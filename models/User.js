const Mongoose = require('mongoose');

const User = Mongoose.Schema({
	nsfl_username: {
		type: String,
	},
	is_admin: {
		type: Boolean,
		required: true,
	},
	is_processor: {
		type: Boolean,
		required: true,
	},
	is_submitter: {
		type: Boolean,
		required: true,
	},
	google_id: {
		type: String,
		required: true,
	},
	google_display_name: {
		type: String,
		required: true,
	},
	completed_collections: {
		type: [String],
		required: true,
	},
	owned_cards: {
		type: [String],
		required: true,
	},
	creation_date: {
		type: Date,
	},
	can_purchase_pack: {
		type: Boolean,
		required: true,
	},
});

module.exports = Mongoose.model('User', User);
