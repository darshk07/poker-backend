const User = require('../models/user');
const Room = require('../models/room');
const { broadcastUpdate } = require('../utils/broadcast');
const userSocketMap = require('../utils/usersocketmap');

module.exports.socketsConnection = (wss, ws) => {
	console.log('Client connected : ');
	ws.on('message', async (message) => {
		try {
			const msg = JSON.parse(message);
			if (msg.action === 'initiate') {
				const { gameId, playerId } = msg;
				await User.updateOne({ _id: playerId }, { ws })

				//	CHANGE IN FUTURE TO GET PLAYER INFO USING ID
				const playerInfo = (await User.find({ _id: playerId }))[0];

				ws.playerId = playerId;
				ws.gameId = gameId;
				ws.isReady = false;
				ws.userId = playerInfo._id.toString();
				userSocketMap.addUserSocket(playerInfo._id.toString(), ws);

				const room = await Room.findOne({ id: gameId });
				const payload = await room.getDataModel(playerInfo._id.toString());
				ws.send(JSON.stringify(payload));
			}

			if (msg.action === 'ready') {
				await User.updateOne({ _id: ws.playerId }, { isReady: true });
				ws.isReady = true;

				//	check if all players are ready
				const room = await Room.findOne({ id: ws.gameId });
				await room.populate('players');

				let allReady = true;
				for (let i = 0; i < room.players.length; i++) {
					if (!room.players[i].isReady) {
						allReady = false;
						break;
					}
				}

				if (allReady) {
					await room.startGame();
					await room.populate('players');
					const turn = Math.floor(Math.random() * room.players.length);
					const turnPlayer = await User.findOne({ _id: room.players[turn]._id });
					await room.setTurnPlayer(turnPlayer._id.toString());
					await broadcastUpdate(ws.gameId, room);
					return;
				}

				await broadcastUpdate(ws.gameId, room);
			}

			if (msg.action === 'unready') {
				await User.updateOne({ _id: ws.playerId }, { isReady: false });
				ws.isReady = false;
				const room = await Room.findOne({ id: ws.gameId });
				await room.populate('players');
				await broadcastUpdate(ws.gameId, room);
			}

			if (msg.action === 'call') {
				console.log('call', ws.userId);
				const room = await Room.findOne({ id: ws.gameId });
				if (room.turn.toString() !== ws.userId) {
					return;
				}
				await room.callTransaction(ws.userId)
				await room.nextPlayer();
				await room.populate('players');
				await broadcastUpdate(ws.gameId, room);
			}
		} catch (err) {
			console.log(err);
		}
	});

	ws.on('close', () => {
		userSocketMap.removeUserSocket(ws.userId);
		console.log('Client disconnected');
	});
}
