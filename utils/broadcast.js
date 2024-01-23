const WebSocket = require('ws');
const broadcastUpdate = async (wss, gameId, room) => {
    wss.clients.forEach((client) => {
        if (client.gameId === gameId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(room));
        }
    });
}

module.exports = broadcastUpdate;   