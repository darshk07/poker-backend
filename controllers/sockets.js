const User = require('../models/user');
const Room = require('../models/room');

module.exports.socketsConnection = (ws) => {
    console.log('Client connected');
    ws.on('message', async (message) => {
        // console.log(`Received message: ${message}`);
        // Handle game logic and broadcast updates
        // wss.clients.forEach((client) => {
        //     if (client !== ws && client.readyState === WebSocket.OPEN) {
        //         client.send(message.toString());
        //     }
        // });
        const { playerId, gameId } = JSON.parse(message);
        const room = await Room.findOne({ id: gameId });
        await room.populate('players');
        const currentPlayer = await User.findOne({ name: playerId });
        if (!currentPlayer) {
            return ws.send(JSON.stringify({ error: 'Player not found' }));
        }
        if (!room) {
            return ws.send(JSON.stringify({ error: 'Room not found' }));
        }
        ws.send(JSON.stringify(room));
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
}
