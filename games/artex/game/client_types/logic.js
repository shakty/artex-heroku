/**
 * # Logic code for Artex
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

var path = require('path');
var ngc = require('nodegame-client');
var stepRules = ngc.stepRules;
var J = ngc.JSUS;

// Here we export the logic function. Receives three parameters:
// - node: the NodeGameClient object.
// - channel: the ServerChannel object in which this logic will be running.
// - gameRoom: the GameRoom object in which this logic will be running.
module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var node = gameRoom.node;

    stager.setOnInit(function() {
        // Create data dir. TODO: do it automatically?
        var dataDir, saveOptions;
        dataDir = path.resolve(channel.getGameDir(), 'data') + '/';
//         saveOptions = {
//             headers: [ "time", "timeup", "player", "stage", "timestamp" ],
//             adapter: {
//                 stage: function(row) { return row.stage.stage }
//             }
//         };
        saveOptions = {
            flag: 'a'
        };
        node.on.data('finished_part1', function(msg) {
            var db;

            // Move client to part2
            // (async so that it finishes all current step operations).
            setTimeout(function() {
                console.log('moving client to part2: ', msg.from);
                channel.moveClientToGameLevel(msg.from, 'part2', gameRoom.name);
            }, 100);

            // Save client's data.
            db = node.game.memory.player[msg.from];
            // db.save(dataDir + 'artex_part1.csv', saveOptions);
            // db.save(dataDir + 'artex_part1_b.csv');
            db.save(dataDir + 'artex_part1.json', saveOptions);
        });

        // Select a random value of svo decision.
        node.on.data('done', function(msg) {
            var svo;
            if (!msg.data || !msg.data.id || msg.data.id !== 'svo') return;
            code = channel.registry.getClient(msg.from);
            svo = '' + J.randomInt(0,6); // From 1 to 6.
            code.svo = msg.data.items[svo].choice;
        });

    });

    stager.setDefaultStepRule(stepRules.SOLO);

    // Here we group together the definition of the game logic.
    return {
        nodename: 'lgc_part1',
        // Extracts, and compacts the game plot that we defined above.
        plot: stager.getState(),
        // If debug is false (default false), exception will be caught and
        // and printed to screen, and the game will continue.
        debug: settings.DEBUG,
        // Controls the amount of information printed to screen.
        verbosity: 0,
        // nodeGame enviroment variables.
        env: {
            auto: settings.AUTO,
            review_select: !!settings.review_select,
            review_random: !!settings.review_random,
            com: !!settings.com,
            coo: !!settings.coo
        }
    };
};
