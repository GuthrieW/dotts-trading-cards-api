const Express = require('express');
const Moment = require('moment-timezone');
const HttpStatusCodes = require('http-status-codes');
const _filter = require('lodash/filter');
const User = require('./../models/User');
const Card = require('./../models/Card');
const saveAction = require('./../common/saveAction');

const Router = Express.Router();

/*
	Find a card by id
*/
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

/*
	Set approved to true for a given card
*/
Router.post('/approveCard', async (request, response) => {
	const cardInformation = request.body;
	const cardId = cardInformation.cardId;

	if (!request.user.is_admin && !request.user.is_processor) {
		response.status(HttpStatusCodes.UNAUTHORIZED).json({
			message: 'User not authorized',
		});
	}

	try {
		const card = await Card.updateOne(
			{ _id: cardId },
			{ $set: { approved: true } }
		);
		response.status(HttpStatusCodes.OK).json(card);
	} catch (error) {
		response.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
			message: error,
		});
	}
});

/*
	Get an unapproved card
*/
Router.get('/getUnapprovedCard', async (request, response) => {
	try {
		const card = await Card.findOne({ approved: false });
		response.status(HttpStatusCodes.OK).json(card);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}
});

/*
	Get all cards 
*/
Router.get('/cards', async (request, response) => {
	try {
		const cards = await Card.find();
		response.status(HttpStatusCodes.OK).json(cards);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	return;
});

/*
	Purchase a pack of cards
*/
Router.get('/purchasePack', async (request, response) => {
	const userId = request.user._id;

	let pulledCards = [];

	try {
		pulledCards = await Card.aggregate([
			{ $match: { approved: { $ne: false } } },
			{ $sample: { size: 6 } },
		]);
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

/*
	Insert a new card into the database
*/
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
		approved: false,
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
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	return;
});

/*
	Get all cards a the current user owns from a given team
*/
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

/*
	Get all cards a given user owns from a given team
*/
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

/*
	Delete a card from the database
*/
Router.delete('/:cardId', async (request, response) => {
	const cardId = request.params.cardId;
	const userId = request.user._id;

	if (!request.user.is_admin && !request.user.is_processor) {
		response
			.status(HttpStatusCodes.UNAUTHORIZED)
			.json({ message: 'User not authorized' });
	}

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
