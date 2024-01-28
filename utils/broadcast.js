const WebSocket = require('ws');
const userSocketMap = require('./UserSocketMap');

module.exports.broadcastUpdate = async (gameId, room) => {
	room.players.forEach(async (player) => {
		const ws = userSocketMap.getUserSocket(player._id.toString());
		if (ws && ws.gameId === gameId && ws.readyState === WebSocket.OPEN) {
			// console.log('sending');
			const playerInfo = room.players.filter((player) => player.name === ws.playerId)[0];
			const otherPlayers = room.players.filter((player) => player.name !== ws.playerId);
			const payload = { ...room._doc, playerInfo, players: otherPlayers };
			ws.send(JSON.stringify(payload));
		}
	});
}
