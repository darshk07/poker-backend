const mongoose = require('mongoose');
const User = require('./user');
const cardSchema = require('./card');
const { shuffleCards } = require('../utils/shuffle');
const gameValues = require('../utils/constants');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
	id: String,
	players: [{
		type: Schema.Types.ObjectId,
		ref: 'User'
	}],
	isStarted: {
		type: Boolean,
		default: false
	},
	potMoney: Number,
	potCards: [cardSchema],
	turn: String
});

roomSchema.methods.addPlayer = function (player) {
	this.players.push(player);
	return this.save();
};

roomSchema.methods.startGame = async function () {
	const cards = shuffleCards();
	this.potCards = cards;
	this.isStarted = true;
	await this.nextPlayer();
	return this.save();

}

roomSchema.methods.getDataModel = async function (userId) {
	const res = await this.populate('players')
	// console.log(res);
	const players = res.players;
	// console.log(players)
	const otherPlayers = players.filter((player) => player._id.toString() !== userId);
	const playerInfo = players.filter((player) => player._id.toString() === userId)[0];
	const payload = { ...this._doc, playerInfo, players: otherPlayers };
	return payload;
}

roomSchema.methods.callTransaction = async function (playerId) {
	const user = await User.findByIdAndUpdate(playerId, { $inc: { balance: -gameValues.CALL_AMOUNT } }, { new: true });
	this.potMoney += gameValues.CALL_AMOUNT;
	await this.save();
	return this.populate('players');
}

roomSchema.methods.nextPlayer = async function () {
	// write a function to set the turn variable to the next player in the array of players;
	// if the current player is the last player in the array, set the turn variable to the first player in the array
	// return this.populate('players');
	const players = this.players;
	if (players.length === 1) {
		this.turn = players[0]._id;
		return this.save();
	}
	const currentPlayerIndex = players.findIndex((player) => player._id.toString() === this.turn);
	if (currentPlayerIndex === players.length - 1) {
		this.turn = players[0]._id;
	} else {
		this.turn = players[currentPlayerIndex + 1]._id;
	}
	return this.save();
}

roomSchema.methods.setTurnPlayer = async function (id) {
	this.turn = id;
	this.save();
	return this.populate('players');
}

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
