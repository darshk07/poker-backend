const User = require('../models/user');
const Room = require('../models/room');

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
    res.json(result);
}

const createRoom = async (gameId) => {
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
    const players = currentRoom.players;
    for (const player of players) {
        await User.findByIdAndDelete(player);
    }
    await Room.findByIdAndDelete(currentRoom._id);
    res.json({ message: 'Room ended' });
}
