const Express = require('express');
const BodyParser = require('body-parser');
const Mongoose = require('mongoose');
const Passport = require('passport');
const CookieSession = require('cookie-session');
const HttpStatusCodes = require('http-status-codes');
const Cors = require('cors');
require('dotenv').config();
const App = Express();
const CardRoute = require('/dotts-trading-cards-api/routes/card');
const AuthRoute = require('/dotts-trading-cards-api/routes/auth');
const UserRoute = require('/dotts-trading-cards-api/routes/user');
const TeamRoute = require('/dotts-trading-cards-api/routes/team');

const DAY_IN_MILLISECONDS = 86400000;
const MAX_COOKIE_AGE = DAY_IN_MILLISECONDS;
const PORT = 8080;

// CORS
App.use(Cors({ credentials: true, origin: process.env.UI_URL }));

App.use((request, response, next) => {
	if ('OPTIONS' === HttpStatusCodes.OK) {
		response.send(HttpStatusCodes.OK);
	} else {
		next();
	}
});

// Body Parser
App.use(BodyParser.urlencoded({ extended: true }));
App.use(BodyParser.json());

// Cookie Session
App.use(
	CookieSession({
		maxAge: MAX_COOKIE_AGE,
		keys: [process.env.COOKIE_SESSION_KEY],
	})
);

// Passport
App.use(Passport.initialize());
App.use(Passport.session());

// Routes
App.use('/card', CardRoute);
App.use('/auth', AuthRoute);
App.use('/user', UserRoute);
App.use('/team', TeamRoute);

App.get('*', (request, response) => {
	response.json({ message: 'success' });
});

// MonogDB Connection
Mongoose.connect(
	process.env.DB_CONNECTION,
	{ useNewUrlParser: true, useUnifiedTopology: true },
	() => {
		console.log('Connected to database @' + process.env.DB_CONNECTION);
	}
);

App.listen(PORT);
