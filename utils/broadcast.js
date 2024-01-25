const WebSocket = require('ws');
const User = require('../models/user');
module.exports.broadcastUpdate = async (wss, gameId, room) => {
    wss.clients.forEach(async (client) => {
        if (client.gameId === gameId && client.readyState === WebSocket.OPEN) {
            let currentPlayer = room.players.find((player) => player.name === client.playerId);
            let otherPlayers = room.players.filter((player) => player.name !== client.playerId);
            // console.log('currentPlayer', currentPlayer);
            // console.log('otherPlayers', otherPlayers);
            const payload = { ...room._doc, playerInfo: currentPlayer, players: otherPlayers };
            client.send(JSON.stringify(payload));
        }
    });
}
