const mongoose = require('mongoose');
const cardSchema = require('./card');
const gameValues = require('../utils/constants');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	name: String,
	balance: Number,
	isReady: {
		type: Boolean,
		default: false
	},
	cards: [
		cardSchema
	],
	socketId: {
		type: Object,
		default: null
	}
});

const User = mongoose.model('User', userSchema);

module.exports = User;
