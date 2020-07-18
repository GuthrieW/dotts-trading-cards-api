const Mongoose = require('mongoose');

const Card = Mongoose.Schema({
	player_name: {
		type: String,
		required: true,
	},
	player_team: {
		type: String,
		required: true,
	},
	rarity: {
		type: String,
		required: true,
	},
	image_url: {
		type: String,
		required: true,
	},
	collections_ids: {
		type: [String],
		required: true,
	},
	submission_username: {
		type: String,
		required: true,
	},
	submission_date: {
		type: Date,
	},
	approved: {
		type: Boolean,
	},
});

module.exports = Mongoose.model('Card', Card);
