/**
 * # Game setup
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(settings, stages) {
    
    var game = {};

    game.debug = settings.DEBUG;

    game.verbosity = 0;

    game.window = {
        promptOnleave: !game.debug,
        disableRightClick: false,
        disableBackButton: true
    }

    return game;
};
