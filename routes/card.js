const Express = require('express');
const Moment = require('moment-timezone');
const HttpStatusCodes = require('http-status-codes');
const _ = require('lodash');
const User = require('./../models/User');
const Card = require('./../models/Card');
const { filter } = require('lodash');
const Router = Express.Router();

// Router.get(
// 	'/fixNullOrNotExistingApproveAndCurrentRotation',
// 	async (request, response) => {
// 		if (!request.user.is_admin) {
// 			response.status(HttpStatusCodes.UNAUTHORIZED).json({
// 				message: 'User not authorized',
// 			});
// 		}

// 		try {
// 			await Card.updateMany(
// 				{ approved: { $exists: false } },
// 				// { approved: null },
// 				{ $set: { approved: false } }
// 			);
// 		} catch (error) {
// 			response
// 				.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
// 				.json({ message: 'Approved error' });
// 		}

// 		try {
// 			await Card.updateMany(
// 				{ current_rotation: { $exists: false } },
// 				// { current_rotation: null },
// 				{ $set: { current_rotation: false } }
// 			);
// 		} catch (error) {
// 			response
// 				.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
// 				.json({ message: 'CurrentRotation error' });
// 		}
// 	}
// );

// Router.get('/migrateAllTrueAndApproved', async (request, response) => {
// 	if (!request.user.is_admin) {
// 		response.status(HttpStatusCodes.UNAUTHORIZED).json({
// 			message: 'User not authorized',
// 		});
// 	}

// 	try {
// 		await Card.updateMany(
// 			{},
// 			{ $set: { current_rotation: true, approved: true } }
// 		);
// 		response.status(HttpStatusCodes.OK).json({ message: 'done' });
// 	} catch (error) {
// 		response
// 			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
// 			.json({ message: error });
// 	}
// });

Router.get('/allCards', async (request, response) => {
	try {
		const cards = await Card.find({});
		response.status(HttpStatusCodes.OK).json(cards);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}
});

/*
	Get an unapproved card
*/
Router.get('/unapproved', async (request, response) => {
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
		await Card.updateOne({ _id: cardId }, { $set: { approved: true } });
		response.status(HttpStatusCodes.OK).json({ message: 'success' });
	} catch (error) {
		response.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
			message: error,
		});
	}
});

/*
	Get all cards 
*/
Router.get('/cards', async (request, response) => {
	try {
		const pulledCards = await Card.aggregate([
			{
				$match: {
					approved: { $ne: false },
					current_rotation: { $ne: false },
				},
			},
			{ $sample: { size: 15 } },
		]);
		response.status(HttpStatusCodes.OK).json(pulledCards);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	return;
});

Router.get('/purchaseUltimusPack', async (request, response) => {
	const userId = request.user._id;
	const userNumberOfPacks = request.user.number_of_ultimus_packs;

	if (userNumberOfPacks <= 0) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	let cardChances = [];
	let pulledCardIds = [];
	let pulledCards = [];

	for (let i = 0; i < 6; i++) {
		cardChances[i] = Math.floor(Math.random() * 10000) + 1;
	}

	try {
		let cardRarity = '';
		for (const chance of cardChances) {
			if (chance > 0 && chance <= 3878) {
				cardRarity = 'Backup';
			} else if (chance > 3878 && chance <= 6438) {
				cardRarity = 'Starter';
			} else if (chance > 6438 && chance <= 8098) {
				cardRarity = 'Star';
			} else if (chance > 8098 && chance <= 8838) {
				cardRarity = 'All-Pro';
			} else if (chance > 8838 && chance <= 9003) {
				cardRarity = 'Legend';
			} else if (chance > 9003 && chance <= 9156) {
				cardRarity = 'Award';
			} else if (chance > 9156 && chance <= 9171) {
				cardRarity = 'Hall of Fame';
			} else if (chance > 9171 && chance <= 9571) {
				cardRarity = 'Ultimus Champion';
			} else if (chance > 9571 && chance <= 9679) {
				cardRarity = 'Holograph Expansion'
			} else if (chance > 9679 && chance <= 9819) {
				cardRarity = 'Autograph Rookie';
			} else if (chance > 9819 && chance <= 10000) {
				cardRarity = 'Captain';
			} else {
				cardRarity = 'Backup';
			}

			const pulledCard = await Card.aggregate([
				{
					$match: {
						approved: { $ne: false },
						current_rotation: { $ne: false },
						rarity: cardRarity,
					},
				},
				{ $sample: { size: 1 } },
			]);

			pulledCardIds.push(pulledCard[0]._id);
			pulledCards.push(pulledCard[0]);
		}
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	try {
		const newUser = await User.findOneAndUpdate(
			{ _id: userId },
			{
				$push: { owned_cards: { $each: pulledCardIds } },
				$inc: { number_of_ultimus_packs: -1 },
			},
			{
				new: true,
			}
		);

		response.status(HttpStatusCodes.OK).json({
			pulledCards: pulledCards,
			numberOfUltimusPacks: newUser.number_of_ultimus_packs,
		});
	} catch (error) {
		response.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
			message: error,
			saving: 'Error saving',
			cardIds: pulledCardIds,
		});
	}

	return;
});

/*
	Purchase a pack of cards
*/
Router.get('/purchasePack', async (request, response) => {
	const userId = request.user._id;
	const userNumberOfPacks = request.user.number_of_packs;

	if (userNumberOfPacks <= 0) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	let cardChances = [];
	let pulledCardIds = [];
	let pulledCards = [];

	for (let i = 0; i < 6; i++) {
		cardChances[i] = Math.floor(Math.random() * 10000) + 1;
	}

	try {
		let cardRarity = '';
		for (const chance of cardChances) {
			if (chance > 0 && chance <= 4208) {
				cardRarity = 'Backup';
			} else if (chance > 4208 && chance <= 6768) {
				cardRarity = 'Starter';
			} else if (chance > 6768 && chance <= 8428) {
				cardRarity = 'Star';
			} else if (chance > 8428 && chance <= 9168) {
				cardRarity = 'All-Pro';
			} else if (chance > 9168 && chance <= 9333) {
				cardRarity = 'Legend';
			} else if (chance > 9333 && chance <= 9486) {
				cardRarity = 'Award';
			} else if (chance > 9486 && chance <= 9501) {
				cardRarity = 'Hall of Fame';
			} else if (chance > 9501 && chance <= 9571) {
				cardRarity = 'Ultimus Champion';
			} else if (chance > 9571 && chance <= 9679) {
				cardRarity = 'Holograph Expansion'
			} else if (chance > 9679 && chance <= 9819) {
				cardRarity = 'Autograph Rookie';
			} else if (chance > 9819 && chance <= 10000) {
				cardRarity = 'Captain';
			} else {
				cardRarity = 'Backup';
			}

			const pulledCard = await Card.aggregate([
				{
					$match: {
						approved: { $ne: false },
						current_rotation: { $ne: false },
						rarity: cardRarity,
					},
				},
				{ $sample: { size: 1 } },
			]);

			pulledCardIds.push(pulledCard[0]._id);
			pulledCards.push(pulledCard[0]);
		}
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	try {
		const newUser = await User.findOneAndUpdate(
			{ _id: userId },
			{
				$push: { owned_cards: { $each: pulledCardIds } },
				$inc: { number_of_packs: -1 },
			},
			{
				new: true,
			}
		);

		response.status(HttpStatusCodes.OK).json({
			pulledCards: pulledCards,
			numberOfPacks: newUser.number_of_packs,
		});
	} catch (error) {
		response.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
			message: error,
			saving: 'Error saving',
			cardIds: pulledCardIds,
		});
	}

	return;
});

/*
	Remove a card from the current rotation of cards that can be pulled from packs
*/
Router.post('/removeFromRotation', async (request, response) => {
	const cardInformation = request.body;
	const cardId = cardInformation.cardId;

	try {
		const card = await Card.updateOne(
			{ _id: cardId },
			{ $set: { current_rotation: false } }
		);
		response.status(HttpStatusCodes.OK).json(card);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}
});

/*
	Add a card to the current rotation of cards that can be pulled from packs
*/
Router.post('/addToRotation', async (request, response) => {
	const cardInformation = request.body;
	const cardId = cardInformation.cardId;

	try {
		const card = await Card.updateOne(
			{ _id: cardId },
			{ $set: { current_rotation: true } }
		);
		response.status(HttpStatusCodes.OK).json(card);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}
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
		current_rotation: false,
	});

	if (!request.user.is_admin && !request.user.is_submitter) {
		response
			.status(HttpStatusCodes.UNAUTHORIZED)
			.json({ message: 'User not authorized' });
	}

	try {
		const savedCard = await card.save();
		response.status(HttpStatusCodes.OK).json(savedCard);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}

	return;
});

/*
	Get all cards the current user owns from a given team
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

	let filteredCards = [];
	for (const card of allCards) {
		if (userCards.includes(card._id)) {
			filteredCards.push(card);
		}
	}

	// const filteredCards = _filter(allCards, (card) => {
	// 	return userCards.includes(card._id);
	// });

	response.status(HttpStatusCodes.OK).json(filteredCards);

	return;
});

Router.post('/update', async (request, response) => {
	const cardInformation = request.body;
	try {
		const newCard = await Card.updateOne(
			{ _id: cardInformation._id },
			{
				$set: {
					submission_username: cardInformation.submission_username,
					player_name: cardInformation.player_name,
					player_team: cardInformation.player_team,
					rarity: cardInformation.rarity,
					image_url: cardInformation.image_url,
					approved: cardInformation.approved,
					current_rotation: cardInformation.current_rotation,
				},
			}
		);
		response.status(HttpStatusCodes.OK).json(newCard);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}
});

/*
	Find a card by id
*/
Router.get('/:cardId', async (request, response) => {
	const cardId = request.params.cardId;
	try {
		const card = await Card.findById(cardId);
		response.status(HttpStatusCodes.OK).json(card);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}
});

/*
	Return all of the cards for a given player name
*/
Router.get('/search/:playerName', async (request, response) => {
	const playerName = request.params.playerName;
	try {
		const cards = await Card.find({
			player_name: playerName,
		});
		response.status(HttpStatusCodes.OK).json(cards);
	} catch (error) {
		response
			.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
			.json({ message: error });
	}
});

Router.get('/testing/:userId', async (request, response) => {});

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

	let filteredCards = [];
	for (const card of allCards) {
		if (userCards.includes(card._id)) {
			filteredCards.push(card);
		}
	}

	// const filteredCards = _filter(allCards, (card) => {
	// 	return userCards.includes(card._id);
	// });

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
