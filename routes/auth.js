const Express = require('express');
const HttpStatusCodes = require('http-status-codes');
const PassportGoogle = require('/dotts-trading-cards-api/middleware/passport-setup');

const Router = Express.Router();

const AuthorizationCheck = (request, response, next) => {
	if (request.user) {
		next();
	} else {
		response
			.status(HttpStatusCodes.UNAUTHORIZED)
			.json({ message: 'User not authorized' });
	}
};

Router.get(
	'/google',
	PassportGoogle.authenticate('google', {
		scope: ['profile', 'email'],
	})
);

Router.get(
	'/google/callback/',
	PassportGoogle.authenticate('google'),
	(request, response) => {
		response
			.status(HttpStatusCodes.OK)
			.redirect(`${process.env.UI_URL}/open-packs`);
	}
);

Router.get('/check', AuthorizationCheck, (request, response) => {
	response.status(HttpStatusCodes.OK).json({ message: 'User authorized' });
});

Router.get('/logout', (request, response) => {
	request.logout();
	response.status(HttpStatusCodes.OK).json({ message: 'redirect' });
});

module.exports = Router;
