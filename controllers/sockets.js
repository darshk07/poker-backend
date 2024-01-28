const User = require('../models/user');
const Room = require('../models/room');
const { broadcastUpdate } = require('../utils/broadcast');
const userSocketMap = require('../utils/UserSocketMap');

module.exports.socketsConnection = (wss, ws) => {
	console.log('Client connected : ');
	ws.on('message', async (message) => {
		try {
			const msg = JSON.parse(message);
			if (msg.action === 'initiate') {
				const { gameId, playerId } = msg;
				await User.updateOne({ name: playerId }, { ws })

				//	CHANGE IN FUTURE TO GET PLAYER INFO USING ID
				const playerInfo = (await User.find({ name: playerId }))[0];

				ws.playerId = playerId;
				ws.gameId = gameId;
				ws.isReady = false;
				ws.isTurn = false;
				ws.userId = playerInfo._id.toString();
				userSocketMap.addUserSocket(playerInfo._id.toString(), ws);

				const room = await Room.findOne({ id: gameId });
				const payload = await room.getDataModel(playerInfo._id.toString());
				ws.send(JSON.stringify(payload));
			}

			if (msg.action === 'ready') {
				await User.updateOne({ name: ws.playerId }, { isReady: true });
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
					//	assign turn to a random player
					const updatedRoom = await Room.findOneAndUpdate(
						{ id: ws.gameId },
						{ isStarted: true },
						{ new: true });
					await updatedRoom.populate('players');
					const turn = Math.floor(Math.random() * updatedRoom.players.length);
					const turnPlayer = await User.findOne({ _id: updatedRoom.players[turn]._id })
					await turnPlayer.updateOne({ isTurn: true });
					console.log('Turn assigned to :', turnPlayer);
					await broadcastUpdate(ws.gameId, updatedRoom);
					return;
				}

				await broadcastUpdate(ws.gameId, room);
			}

			//	temporary
			if (msg.action === 'myturn') {
				ws.isTurn = true;
				return;
			}

			if (msg.action === 'unready') {
				await User.updateOne({ name: ws.playerId }, { isReady: false });
				ws.isReady = false;
				const room = await Room.findOne({ id: ws.gameId });
				await room.populate('players');
				await broadcastUpdate(ws.gameId, room);
			}

			if (msg.action === 'call') {
				if (ws.isTurn) {
					const user = await User.findOne({ name: ws.playerId });
					const room = await Room.findOne({ id: ws.gameId });
					await room.populate('players');
					const updatedRoom = await room.callTransaction(ws.userId);
					console.log(updatedRoom);
					await broadcastUpdate(ws.gameId, updatedRoom);
				}
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
