const User = require('../models/user');
const Room = require('../models/room');

module.exports.socketsConnection = (ws) => {
    console.log('Client connected');
    ws.on('message', async (message) => {
        const msg = JSON.parse(message);
        if (msg.action === "initiate") {
            const { gameId, playerId } = msg;
            const room = await Room.findOne({ id: gameId });
            await room.populate('players');
            ws.send(JSON.stringify(room));
        }
        if (msg.action === "join") {
            const { gameId, playerId } = msg;
            const room = await Room.findOne({ id: gameId });
            await room.populate('players');
            wss.clients.forEach((client) => {
                ws.send(JSON.stringify(room));
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(room));
                }
            });
        }
        // console.log(`Received message: ${message}`);
        // Handle game logic and broadcast updates

    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
}
