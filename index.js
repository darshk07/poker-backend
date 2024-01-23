if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const { joinRoom, endRoom } = require('./controllers/game');
const { socketsConnection } = require('./controllers/sockets');

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

wss.on('connection', socketsConnection);

app.post('/join-room', joinRoom);
app.post('/end-room', endRoom);

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
