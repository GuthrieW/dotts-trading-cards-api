const Passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const Moment = require('moment-timezone');
const User = require('./../models/User');

Passport.serializeUser((user, done) => {
	console.log('serializeUser');
	done(null, user.id);
});

Passport.deserializeUser((_id, done) => {
	console.log('deserializeUser');

	User.findById(_id).then((user) => {
		done(null, user);
	});
});

Passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: process.env.API_URL + '/auth/google/callback',
		},
		(accessToken, refreshToken, profile, done) => {
			console.log('GoogleStrategy');

			User.findOne({ google_id: profile.id })
				.then((foundUser) => {
					console.log('foundUser');

					if (foundUser) {
						console.log('found user');
						done(null, foundUser);
					} else {
						console.log('did not find user');

						const user = new User({
							nsfl_username: '',
							is_admin: false,
							google_id: profile.id,
							google_display_name: profile.displayName,
							completed_collections: [],
							owned_cards: [],
							creation_date: Moment.tz(
								'America/Chicago'
							).format(),
							can_purchase_pack: true,
						});

						console.log('created user');

						user.save().then((newUser) => {
							console.log('saved user');

							done(null, newUser);
						});
					}
				})
				.catch((error) => {
					console.log(error);
				});
		}
	)
);

module.exports = Passport;
