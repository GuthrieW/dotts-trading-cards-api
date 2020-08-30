const Express = require('express');
const HttpStatusCodes = require('http-status-codes');
const User = require('./../models/User');
const saveAction = require('./../common/saveAction');

const Router = Express.Router();

// Router.get('/migration', async (request, response) => {
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
	Return whether or not the user is an admin
*/
Router.get('/permissions', async (request, response) => {
	const userIsAdmin = request.user.is_admin;
	const userIsProcessor = request.user.is_processor;
	const userIsSubmitter = request.user.is_submitter;
	response.status(HttpStatusCodes.OK).json({
		is_admin: userIsAdmin,
		is_processor: userIsProcessor,
		is_submitter: userIsSubmitter,
	});
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

/* 
	Return a user
*/
Router.get('/search/:username', async (request, response) => {
	const username = request.params.username;
	try {
		const user = await User.find({
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

module.exports = Router;
