/**
 * # Game settings: Art Exhibition Game
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = {

    // Session Counter start from.
    SESSION_ID: 100,

    // Minimum number of players that must be always connected.
    MIN_PLAYERS: 2,

    // Number or rounds to repeat the bidding. *
    REPEAT: 2,

    // Number of coins to split. *
    COINS: 100,

    // Divider ECU / DOLLARS *
    EXCHANGE_RATE: 4000,

    EXCHANGE_RATE_INSTRUCTIONS: 0.01,

    // DEBUG.
    DEBUG: true,

    // AUTO-PLAY.
    AUTO: false,

    // AUTHORIZATION.
    AUTH: 'NO', // MTURK, LOCAL, NO.

    // Wait time to reconnect.
    WAIT_TIME: 60,

    // Threshold for publication.
    threshold: 5,

    // Exhibition names.
    exhibitNames: ['A','B','C'],

    // Timer values.
    timer: {

        instructions: 90000,
        quiz: 60000,
        creation: {
            milliseconds: function() {
                if (node.player.stage.round < 2) return 80000;
                if (node.player.stage.round < 3) return 60000;
                return 50000;
            },
            timeup: function() {
                $('#mainframe').contents().find('#done_box button').click();
            }
        },
        evaluation: 20000,
        dissemination: 15000
    },

    // Available treatments:
    // (there is also the "standard" treatment, using the options above)
    treatments: {
        
        review_select_com: {
            fullName: "Competitive Select Reviewer",
            description:
                "Competition.",
            review_select: true,
            com: true,
            questPage: 'questionnaire_SEL_COM.html',
            instrPage: 'instructions_SEL_COM.html',
            payoff: 3
        },

        review_select_coo: {
            fullName: "Non-Competitive Select Reviewer",
            description:
                "No competition.",
            review_select: true,
            com: false,
            questPage: 'questionnaire_SEL_COO.html',
            instrPage: 'instructions_SEL_COO.html',
            payoff: 2
        },

        review_random_com: {
            fullName: "Competitive Random Reviewer",
            description:
                "Competition.",
            review_random: true,
            com: true,
            questPage: 'questionnaire_RND_COM.html',
            instrPage: 'instructions_RND_COM.html',
            payoff: 3
        },

        review_random_coo: {
            fullName: "Non-Competitive Random Reviewer",
            description:
                "No competition.",
            review_random: true,
            com: false,
            questPage: 'questionnaire_RND_COO.html',
            instrPage: 'instructions_RND_COO.html',
            payoff: 2
        }
    }

    // * =  If you change this, you need to update 
    // the instructions and quiz static files in public/
};
