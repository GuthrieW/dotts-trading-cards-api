const Mongoose = require('mongoose');

const Team = Mongoose.Schema({
	city_name: {
		type: String,
		required: true,
	},
	team_name: {
		type: String,
		required: true,
	},
	abbreviation: {
		type: String,
		required: true,
	},
	image_path: {
		type: String,
		required: true,
	},
	image_url: {
		type: String,
		required: true,
	},
});
