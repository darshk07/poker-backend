const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cardSchema = new Schema({
    suit: {
        type: String,
        enum: ['hearts', 'spades', 'clubs', 'diamonds'],
    },
    value: {
        type: String,
        enum: ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'],
    },
    color: {
        type: String,
        enum: ['red', 'black'],
    },
    isOpen: {
        type: Boolean,
        default: false,
    }
});

module.exports = cardSchema;
