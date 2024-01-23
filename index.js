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
const broadcastUpdate = require('./utils/broadcast');

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
                ws.gameId = gameId;
                const room = await Room.findOne({ id: gameId });
                await room.populate('players');
                ws.send(JSON.stringify(room));
            }
            if (msg.action === "refresh") {
                const { gameId, playerId } = msg;
                const room = await Room.findOne({ id: gameId });
                await room.populate('players');
                wss.clients.forEach((client) => {
                    if (client.gameId === gameId && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(room));
                    }
                });
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
app.post('/join-room', async (req, res) => {
    try {
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
