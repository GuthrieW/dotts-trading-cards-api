const Passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const Moment = require('moment-timezone');
const User = require('/nsfl-trading-cards/api/models/User');

Passport.serializeUser((user, done) => {
	done(null, user.id);
});

Passport.deserializeUser((_id, done) => {
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
			User.findOne({ google_id: profile.id }).then((foundUser) => {
				if (foundUser) {
					done(null, foundUser);
				} else {
					const user = new User({
						nsfl_username: '',
						is_admin: false,
						google_id: profile.id,
						google_display_name: profile.displayName,
						completed_collections: [],
						owned_cards: [],
						creation_date: Moment.tz('America/Chicago').format(),
						can_purchase_pack: true,
					});
					user.save().then((newUser) => {
						done(null, newUser);
					});
				}
			});
		}
	)
);

module.exports = Passport;
