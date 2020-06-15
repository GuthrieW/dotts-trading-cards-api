const Express = require('express');
const Moment = require('moment-timezone');
const HttpStatusCodes = require('http-status-codes');
const Team = require('/dotts-trading-cards-api/models/Team');

const Router = Express.Router();

// TODO: Use this to get rid of the file on the ui at ui/commom/data/teams.js
Router.get('/team', async (request, response) => {
	try {
		const teams = await Team.find();
		response.status(HttpStatusCodes.OK).json(teams);
	} catch (error) {
		console.error(error);
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	return;
});

module.exports = Router;
