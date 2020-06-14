const Moment = require('moment-timezone');
const Action = require('/nsfl-trading-cards/api/models/Action');

const saveAction = async (userId, actionName, actionEffect) => {
	const action = new Action({
		user_id: userId,
		action: actionName,
		action_date: Moment.tz('America/Chicago').format(),
		action_effect: actionEffect,
	});
	await action.save();

	return;
};

module.exports = saveAction;
