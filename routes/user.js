const Express = require('express');
const HttpStatusCodes = require('http-status-codes');
const User = require('./../models/User');
const Card = require('./../models/Card');
const NSFL_TEAMS = require('./../common/teams');
const saveAction = require('./../common/saveAction');
const Router = Express.Router();

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

Router.get('/perms', async (request, response) => {
	response.json({ message: 'done' });
});

/*
	Return a user	
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
				newUser._doc[`${card.CITY_NAME} ${card.TEAM_NAME}`] += 1;
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
	const userInformation = request.body;
	const userId = request.user._id;

	saveAction(
		userId,
		'Update number of packs',
		`New number of packs is ${userInformation.numberOfPacks}`
	);

	try {
		const updatedUser = await User.updateOne(
			{ _id: userInformation._id },
			{
				$set: {
					number_of_packs: userInformation.numberOfPacks,
				},
			}
		);
		response.status(HttpStatusCodes.OK).json(updatedUser);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
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
	saveAction(
		userId,
		'Change Username',
		`NSFL username changed from ${oldUsername} to ${newUsername}`
	);

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
	Update all users to be able to purchase a pack
*/
Router.patch('/resetCanPurchasePack', async (request, response) => {
	const userId = request.user._id;
	saveAction(
		userId,
		'Reset Can Purchase Pack Username',
		'can_purchase_pack set to true for all users'
	);

	const currentUser = await User.findById(userId);
	try {
		if (currentUser.is_admin) {
			await User.updateMany(
				{ can_purchase_pack: false },
				{ $set: { can_purchase_pack: true } }
			);
			response.status(HttpStatusCodes.OK).json({ message: 'success' });
		} else {
			response.status(HttpStatusCodes.OK).json({ message: 'failure' });
		}
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
		if (user !== undefined) {
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
