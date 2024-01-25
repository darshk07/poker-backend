const User = require('../models/user');
const Room = require('../models/room');
const wss = require('../index');

module.exports.joinRoom = async (req, res) => {
    const { playerId, gameId } = req.body;
    let roomExists = await Room.findOne({ id: gameId });
    if (!roomExists) {
        roomExists = await createRoom(gameId);
    }
    let player = await User.findOne({ name: playerId });
    if (!player) {
        const playerr = new User({ name: playerId, balance: 1000 });
        player = await playerr.save();
    }

    await roomExists.addPlayer(player);
    const result = await roomExists.populate('players');
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(roomExists));
        }
    });
    res.json(result);
}

module.exports.createRoom = async (gameId) => {
    const room = new Room({
        id: gameId,
        potMoney: 0,
        potCards: [],
        players: [],
    });
    await room.save();
    return room;
}
module.exports.endRoom = async (req, res) => {
    const { gameId } = req.body;
    const currentRoom = await Room.findOne({ id: gameId });
    if (!currentRoom) {
        return res.json({ error: 'Room not found' });
    }
    await Room.findByIdAndDelete(currentRoom._id);
    res.json({ message: 'Room ended' });
}