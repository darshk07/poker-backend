if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const { joinRoom, endRoom, createRoom } = require('./controllers/game');
const { socketsConnection } = require('./controllers/sockets');
const Room = require('./models/room');
const User = require('./models/user');
const { broadcastUpdate, startGame } = require('./utils/broadcast');

const dbURL = process.env.DB_URL;

mongoose.set('strictQuery', true);
mongoose.connect(dbURL)
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.on("open", () => {
    console.log("Database connected");
})

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', async (message) => {
        try {
            const msg = JSON.parse(message);
            if (msg.action === "initiate") {
                const { gameId, playerId } = msg;
                const room = await Room.findOne({ id: gameId });
                await room.populate('players');
                //remove current player
                room.players = room.players.filter((player) => player.name !== playerId);
                const playerInfo = await User.findOne({ name: playerId });
                const payload = { ...room._doc, playerInfo: playerInfo };
                ws.playerId = playerInfo.name;
                ws.gameId = gameId;
                ws.isReady = false;
                ws.send(JSON.stringify(payload));
            }
            if (msg.action === "ready") {
                const user = await User.updateOne({ name: ws.playerId }, { isReady: true });
                ws.isReady = true;
                const room = await Room.findOne({ id: ws.gameId });
                await room.populate('players');
                // const payload = { ...room._doc, playerInfo: user };
                await broadcastUpdate(wss, ws.gameId, room);
            }
            if (msg.action === "unready") {
                const user = await User.updateOne({ name: ws.playerId }, { isReady: false });
                ws.isReady = false;
                const room = await Room.findOne({ id: ws.gameId });
                await room.populate('players');
                // const payload = { ...room._doc, playerInfo: user };
                await broadcastUpdate(wss, ws.gameId, room);
            }
        }
        catch (err) {
            console.log(err);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

app.get('/health', (req, res) => {
    res.json({ message: 'Server is running' });
});

app.post('/fill-room', async (req, res) => {
    const { gameId } = req.body;
    const room = await Room.findOne({ id: gameId });
    await room.populate('players');
    await room.startGame();
    console.log(room);
    res.json(room);

})

app.post('/join-room', async (req, res) => {
    try {
        const { playerId, gameId } = req.body;
        let roomExists = await Room.findOne({ id: gameId });
        if (!roomExists) {
            roomExists = await createRoom(gameId);
            await roomExists.startGame();
        }
        let player = await User.findOne({ name: playerId });
        if (!player) {
            const playerr = new User({ name: playerId, balance: 1000 });
            player = await playerr.save();
        }
        if (roomExists.players.length > 5) {
            res.json({ message: 'Room is full' });
            return;
        }
        if (!roomExists.players.includes(player._id)) {
            await roomExists.addPlayer(player);
        }
        const result = await roomExists.populate('players');
        // roomExists.players = roomExists.players.filter((player) => player.name !== playerId);
        // const payload = { ...roomExists._doc, playerInfo: player };
        await broadcastUpdate(wss, gameId, roomExists);
        res.json(result);
    }
    catch (err) {
        console.log(err);
    }
})

app.post('/end-room', endRoom);

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
