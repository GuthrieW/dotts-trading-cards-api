const Mongoose = require('mongoose');

const Action = Mongoose.Schema({
	user_id: {
		type: String,
		required: true,
	},
	action: {
		type: String,
		required: true,
	},
	action_effect: {
		type: String,
		required: true,
	},
	action_date: {
		type: Date,
	},
});

module.exports = Mongoose.model('Action', Action);
