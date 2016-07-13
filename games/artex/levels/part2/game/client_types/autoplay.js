/**
 * # Autoplay code for Art Exhibition Game
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * Handles bidding, and responds between two players automatically.
 *
 * http://www.nodegame.org
 */

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var node = gameRoom.node;
    var ngc =  require('nodegame-client');

    var game, stager;

    game = gameRoom.getClientType('player');
    game.env.auto = true;
    game.nodename = 'autoplay';

    stager = ngc.getStager(game.plot);

    stager.extendAllSteps(function(o) {
        o._cb = o.cb;
        o.cb = function() {
            var _cb, stepObj;
            stepObj = this.getCurrentStepObj();
            _cb = stepObj._cb;
            _cb.call(this);
            if (stepObj.id === 'submission') {
                // node.game.last_cf = node.game.cf.getAllValues();
                node.game.last_ex =
                    node.game.settings.exhibitNames[node.JSUS.randomInt(-1, 2)];
                // if (node.player.stage.round < 5) node.timer.randomDone();
            }

            node.timer.randomDone();
            
        };
        return o;
    });

    game.plot = stager.getState();

    return game;
};
