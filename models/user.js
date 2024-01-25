const mongoose = require('mongoose');
const cardSchema = require('./card');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    balance: Number,
    isReady: {
        type: Boolean,
        default: false,
    },
    isTurn: {
        type: Boolean,
        default: false,
    },
    cards: [
        cardSchema
    ],
});

const User = mongoose.model('User', userSchema);

module.exports = User;