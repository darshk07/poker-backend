const mongoose = require('mongoose');
const User = require('./user');
const cardSchema = require('./card');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
    id: String,
    players: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    potMoney: Number,
    potCards: [cardSchema]
});

roomSchema.methods.addPlayer = function (player) {
    this.players.push(player);
    return this.save();
};

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
