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
				const room = await Room.findOne({ id: ws.gameId });
				await room.populate('players');
				await broadcastUpdate(ws.gameId, room);
			}

			if (msg.action === 'unready') {
				await User.updateOne({ name: ws.playerId }, { isReady: false });
				ws.isReady = false;
				const room = await Room.findOne({ id: ws.gameId });
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
