/**
 * # Bot code for Ultimatum Game
 * Copyright(c) 2014 Stefano Balietti
 * MIT Licensed
 *
 * Code for a bot playing the artex game randomly.
 * 
 * http://www.nodegame.org
 */

var ngc = require('nodegame-client');
var Stager = ngc.Stager;
var stepRules = ngc.stepRules;
var constants = ngc.constants;

// Export the game-creating function.
module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var game;

    var channel = gameRoom.channel;
    var node = gameRoom.node;


    // Import other functions used in the game.
    ///////////////////////////////////////////

    cbs = require(__dirname + '/includes/bot.callbacks.js');

    // Specify init function, and extend default stages.
    ////////////////////////////////////////////////////

    stager.setOnInit(cbs.init);

    // Set the default step rule for all the stages.
    stager.setDefaultStepRule(stepRules.WAIT);

    stager.extendStep('artex', {
        cb: cbs.artex
    });

    // Prepare the game object to return.
    /////////////////////////////////////

    game = {};

    // We serialize the game sequence before sending it.
    game.plot = stager.getState();

    // Let's add the metadata information.
    game.metadata = {
        name: 'artex_bot',
        version: '0.4.0',
        description: 'Bot randomly playing the artex game'
    };

    // Other settings, optional.
    game.settings = {
        publishLevel: 2
    };

    game.env = {
        auto: settings.AUTO,
        treatment: treatmentName
    };

    game.verbosity = 0;
    game.debug = settings.DEBUG;
    game.nodename = 'bot';

    return game;
};
