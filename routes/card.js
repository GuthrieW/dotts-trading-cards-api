const Express = require('express');
const Moment = require('moment-timezone');
const HttpStatusCodes = require('http-status-codes');
const _filter = require('lodash/filter');
const User = require('./../models/User');
const Card = require('./../models/Card');
const saveAction = require('./../common/saveAction');

const Router = Express.Router();

Router.post('/card', async (request, response) => {
	const cardInformation = request.body;
	const cardId = cardInformation.cardId;

	try {
		const card = await Card.findById(cardId);
		response.status(HttpStatusCodes.OK).json(card);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	return;
});

Router.get('/cards', async (request, response) => {
	try {
		const cards = await Card.find();
		response.status(HttpStatusCodes.OK).json(cards);
	} catch (error) {
		console.error(error);
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	return;
});

Router.get('/purchasePack', async (request, response) => {
	const userId = request.user._id;

	let pulledCards = [];

	try {
		pulledCards = await Card.aggregate([{ $sample: { size: 6 } }]);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	let pulledCardIds = [];
	for (const pulledCard of pulledCards) {
		pulledCardIds.push(pulledCard._id);
	}

	try {
		await User.updateOne(
			{ _id: userId },
			{ $addToSet: { owned_cards: { $each: pulledCardIds } } }
		);
		await User.updateOne(
			{ _id: userId },
			{ $set: { can_purchase_pack: false } }
		);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	saveAction(
		userId,
		'Purchase Pack',
		`${pulledCardIds} added to user's owned_cards array`
	);

	response.status(HttpStatusCodes.OK).json(pulledCards);

	return;
});

Router.post('/', async (request, response) => {
	const userId = request.user._id;

	const cardInformation = request.body;
	const card = new Card({
		player_name: cardInformation.player_name,
		player_team: cardInformation.player_team,
		rarity: cardInformation.rarity,
		image_url: cardInformation.image_url,
		collections_ids: cardInformation.collections_ids,
		submission_username: cardInformation.submission_username,
		submission_date: Moment.tz('America/Chicago').format(),
	});

	try {
		if (request.user.is_admin) {
			const savedCard = await card.save();
			saveAction(
				userId,
				'Submit Card',
				`${savedCard._id} added to cards collection`
			);
			response.status(HttpStatusCodes.OK).json(savedCard);
		} else {
			response
				.status(HttpStatusCodes.UNAUTHORIZED)
				.json({ message: 'unauthorized' });
		}
	} catch (error) {
		console.error('POST ERROR: ', error);
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	return;
});

Router.post('/team', async (request, response) => {
	const userId = request.user._id;
	const cardInformation = request.body;
	const teamName = cardInformation.teamName;
	let userCards = [];
	let allCards = [];

	try {
		const user = await User.findById(userId);
		userCards = user.owned_cards;
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	try {
		allCards = await Card.find({ player_team: teamName });
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	const filteredCards = _filter(allCards, (card) => {
		return userCards.includes(card._id);
	});

	response.status(HttpStatusCodes.OK).json(filteredCards);

	return;
});

Router.post('/team/:userId', async (request, response) => {
	const userId = request.params.userId;
	const cardInformation = request.body;
	const teamName = cardInformation.teamName;
	let userCards = [];
	let allCards = [];

	try {
		const user = await User.findById(userId);
		userCards = user.owned_cards;
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	try {
		allCards = await Card.find({ player_team: teamName });
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	const filteredCards = _filter(allCards, (card) => {
		return userCards.includes(card._id);
	});

	response.status(HttpStatusCodes.OK).json(filteredCards);

	return;
});

Router.delete('/:cardId', async (request, response) => {
	const cardId = request.params.cardId;
	const userId = request.user._id;

	try {
		const cardToRemove = Card.findById(cardId);
		saveAction(
			userId,
			'Delete Card',
			`The following card was deleted from the database: ${cardToRemove}`
		);

		const removedCard = await Card.remove({ _id: cardId });
		response.status(HttpStatusCodes.OK).json(removedCard);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	return;
});

module.exports = Router;
