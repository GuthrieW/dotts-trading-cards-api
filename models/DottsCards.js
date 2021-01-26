const Mongoose = require('mongoose');

const DottsCards = Mongoose.Schema({
	playerName: {
		type: String,
		required: true,
	},
	playerTeam: {
		type: String,
		required: true,
	},
	rarity: {
		type: String,
		required: true,
	},
	imageUrl: {
		type: String,
		required: true,
	},
	submissionUsername: {
		type: String,
		required: true,
	},
	submissionDate: {
        type: Date,
        required: true,
	},
	approved: {
        type: Boolean,
        required: true,
	},
	currentRotation: {
        type: Boolean,
        required: true,
	},
});

module.exports = Mongoose.model('dotts_cards', DottsCards);
