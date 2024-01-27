const mongoose = require('mongoose');
const User = require('./user');
const cardSchema = require('./card');
const { shuffleCards } = require('../utils/shuffle');
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

roomSchema.methods.startGame = function () {
	const cards = shuffleCards();
	console.log(shuffleCards);
	this.potCards = cards;
	return this.save();
}

roomSchema.methods.getDataModel = async function (userId) {
	const res = await this.populate('players')
	console.log(res);
	const players = res.players;
	console.log(players)
	const otherPlayers = players.filter((player) => player._id.toString() !== userId);
	const playerInfo = players.filter((player) => player._id.toString() === userId)[0];
	const payload = { ...this._doc, playerInfo, players: otherPlayers };
	return payload;
}

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
