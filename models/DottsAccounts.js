const Mongoose = require('mongoose');

const DottsAccounts = Mongoose.Schema({
    email: {
        type: String,
    },
    isflUsername: {
        type: String,
    },
    password: {
        type: String,
    },
    ownedCards: {
        type: [String],
        required: true,
    },
    newestCards: {
        type: [String],
        required: true,
    },
    ownedRegularPacks: {
        type: Number,
        required: true,
    },
    ownedUltimusPacks: {
        type: Number,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        required: true,
    },
    isProcessor: {
        type: Boolean,
        required: true,
    },
    isPackIssuer: {
        type: Boolean,
        required: true,
    },
    isSubmitter: {
        type: Boolean,
        required: true,
    },
});

module.exports = Mongoose.model('dotts_accounts', DottsAccounts);