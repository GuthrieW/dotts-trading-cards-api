const Express = require('express');
const HttpStatusCodes = require('http-status-codes');
const User = require('./../models/User');
const Card = require('./../models/Card');
const Action = require('./../models/Action');
const NSFL_TEAMS = require('./../common/teams');
const Router = Express.Router();

// Router.get('/removedAllCardsAndPacks', async (request, response) => {
// 	if (!request.user.is_admin) {
// 		response.status(HttpStatusCodes.UNAUTHORIZED).json({
// 			message: 'User not authorized',
// 		});
// 	}

// 	try {
// 		await User.updateMany(
// 			{ _id: { $exists: true } },
// 			{
// 				$set: {
// 					owned_cards: [],
// 					number_of_packs: 0,
// 				},
// 			}
// 		);
// 		response.status(HttpStatusCodes.OK).json({ message: 'It worked!' });
// 	} catch (error) {
// 		response
// 			.status(HttpStatusCodes.METHOD_FAILURE)
// 			.json({ message: 'Fuuuuuuuuuuuuck' });
// 	}
// });

// Router.get('/removeSubmissionPermissions', async (request, response) => {
// 	if (!request.user.is_admin) {
// 		response.status(HttpStatusCodes.UNAUTHORIZED).json({
// 			message: request.user,
// 		});
// 	}

// 	try {
// 		await User.updateMany(
// 			{},
// 			{
// 				$set: {
// 					is_submitter: false,
// 				},
// 			}
// 		);
// 		response
// 			.status(HttpStatusCodes.OK)
// 			.json({ message: 'All submission perms removed.' });
// 	} catch (error) {
// 		response
// 			.status(HttpStatusCodes.METHOD_FAILURE)
// 			.json({ message: 'Failure' });
// 	}
// });

Router.get('/removeAllSavedActions', async (request, response) => {
	if (!request.user.is_admin) {
		response.status(HttpStatusCodes.UNAUTHORIZED).json({
			message: request.user,
		});
	}

	try {
		await Action.remove({});
		response
			.status(HttpStatusCodes.OK)
			.json({ message: 'All saved actions removed.' });
	} catch (error) {
		response
			.status(HttpStatusCodes.METHOD_FAILURE)
			.json({ message: 'Failure' });
	}
});

/*
	Get the number of cards a user has from each team
*/
Router.get('/cardAmounts', async (request, response) => {
	try {
		let users = await User.find();
		for (let i = 0; i < users.length; i++) {
			let newUser = Object.assign({}, users[i]);

			NSFL_TEAMS.map((team) => {
				newUser._doc[`${team.CITY_NAME} ${team.TEAM_NAME}`] = 0;
			});

			for (const cardId of users[i].owned_cards) {
				const card = await Card.findById(cardId);
				if (!card) {
					continue;
				}
				newUser._doc[`${card.player_team}`] += 1;
			}

			users[i] = newUser._doc;
		}

		response.status(HttpStatusCodes.OK).json(users);
	} catch (error) {
		console.error(error);
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	return;
});

/*
	Return the current user
*/
Router.get('/currentUser', async (request, response) => {
	const userId = request.user._id;

	try {
		const user = await User.findById(userId);
		response.status(HttpStatusCodes.OK).json(user);
	} catch (error) {
		console.error(error);
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}
});

/*
	Return whether or not the user is an admin
*/
Router.get('/permissions', async (request, response) => {
	response.status(HttpStatusCodes.OK).json(request.user);
});

/*
	Return all users
*/
Router.get('/', async (request, response) => {
	try {
		const users = await User.find();
		response.status(HttpStatusCodes.OK).json(users);
	} catch (error) {
		console.error(error);
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	return;
});

/*
	Return whether or not the current user is able to purchase a pack
*/
Router.get('/canPurchasePack', async (request, response) => {
	const userId = request.user._id;

	try {
		const user = await User.findById(userId);
		const canPurchasePack = user.can_purchase_pack;
		response.status(HttpStatusCodes.OK).json(canPurchasePack);
	} catch (error) {
		console.error(error);
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}
});

Router.post('/updateNumberOfPacks', async (request, response) => {
	const username = request.body.nsfl_username;
	const userNumberOfPacks = request.body.numberOfPacks;
	const userNumberOfUltimusPacks = request.body.numberOfUltimusPacks;
	const userId = request.user._id;

	if (request.user.is_admin || request.user.is_pack_issuer) {
		try {
			const updatedUser = await User.findOneAndUpdate(
				{ nsfl_username: username },
				{
					$set: {
						number_of_packs: userNumberOfPacks,
						number_of_ultimus_packs: userNumberOfUltimusPacks,
					},
				},
				{
					new: true,
				}
			);
			response.status(HttpStatusCodes.OK).json(updatedUser);
		} catch (error) {
			response
				.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
				.json({ message: error });
		}
	}
});

/*
	Return a user 
*/
Router.post('/', async (request, response) => {
	const userInformation = request.body;
	const userId = userInformation.userId;

	try {
		const user = await User.findById(userId);
		response.status(HttpStatusCodes.OK).json(user);
	} catch (error) {
		console.error(error);
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}
});

/*
	Update the user's NSFL username
*/
Router.patch('/username', async (request, response) => {
	const userId = request.user._id;
	const oldUsername = request.user.nsfl_username;
	const newUsername = request.body.nsfl_username;

	try {
		await User.updateOne(
			{ _id: userId },
			{ $set: { nsfl_username: newUsername } }
		);
		response.status(HttpStatusCodes.OK).json({ message: 'success' });
	} catch (error) {
		console.error(error);
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}
});

/*
	Get a user by id
*/
Router.get('/:userId', async (request, response) => {
	const userId = request.params.userId;
	try {
		const user = await User.findOne({
			_id: userId,
		});
		response.status(HttpStatusCodes.OK).json(user);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}
});

/* 
	Return a user
*/
Router.get('/search/:username', async (request, response) => {
	const username = request.params.username;
	try {
		const user = await User.findOne({
			nsfl_username: username,
		});
		if (user) {
			response.status(HttpStatusCodes.OK).json(user);
		} else {
			response
				.status(HttpStatusCodes.OK)
				.json({ error: 'USER_NOT_FOUND' });
		}
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}
});

module.exports = Router;
