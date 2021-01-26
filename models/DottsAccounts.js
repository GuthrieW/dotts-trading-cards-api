const Mongoose = require('mongoose');

const DottsAccounts = Mongoose.Schema({
    providerAccountId: {
        type: String,
        required: true,
    },
    isflUsername: {
        type: String,
        required: true,
    }, 
    ownedCards: {
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

module.exports = Mongoose.model('DottsAccounts', DottsAccounts);