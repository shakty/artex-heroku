/**
 * # Logic code for Artex
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

var fs = require('fs');
var ngc = require('nodegame-client');
var stepRules = ngc.stepRules;
var J = ngc.JSUS;

// Variable registered outside of the export function
// are shared among all instances of game logics.
var counter = 0;

// Flag to not cache required files.
var nocache = true;

// Here we export the logic function. Receives three parameters:
// - node: the NodeGameClient object.
// - channel: the ServerChannel object in which this logic will be running.
// - gameRoom: the GameRoom object in which this logic will be running.
module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var node = gameRoom.node;

    // Increment counter.
    counter = counter ? ++counter : settings.SESSION_ID;

    // Import other functions used in the game.
    // Some objects are shared.
    var cbs = channel.require(__dirname + '/includes/logic.callbacks.js', {
        node: node,
        gameRoom: gameRoom,
        settings: settings,
        counter: counter
        // Reference to channel added by default.
    }, nocache);

    // Event handler registered in the init function are always valid.
    stager.setOnInit(cbs.init);

    // Event handler registered in the init function are always valid.
    stager.setOnGameOver(cbs.gameover);

    stager.extendStage('artex', {
        pushClients: true,
        minPlayers: [
            settings.MIN_PLAYERS,
            cbs.notEnoughPlayers,
            cbs.enoughPlayersAgain
        ],
        reconnect: function(code, reconOptions) {
            var cf;
            cf = node.game.memory.cf.get(code.id);
            // cf0 is the initial random face.
            reconOptions.cf = cf.cf || cf.cf0;
            reconOptions.winners = node.game.winners;

            // If evaluation round, add reviews.
            if (node.player.stage.step === 3) {
                reconOptions.reviews = node.game.reviewing[code.id];
            }

            // This function is executed on the client.
            reconOptions.cb = function(options) {
                var i, len, w, table, step;
                this.last_cf = options.cf;

                w = options.winners;
                step = node.player.stage.step;

                // Make the past exhibition list.

                // On dissemination step, do 1 extra iteration and parse table.
                if (step === 4) {
                    i = -1, len = node.player.stage.round;
                    for ( ; ++i < len ; ) {
                        table = this.makeRoundTable(w[i], (i+1));
                    }
                    // Only when DOM is ready.
                    this.plot.tmpCache('cb', function() {
                        W.getElementById('container_exhibition')
                            .appendChild(table.parse());
                        node.events.step.emit('canvas_tooltip');
                    });
                }
                else {
                    i = -1, len = (node.player.stage.round-1);
                    for ( ; ++i < len ; ) {
                        table = this.makeRoundTable(w[i], (i+1));
                    }
                    // Evaluation.
                    if (step === 3) {
                        this.plot.tmpCache('reconReviews', options.reviews);
                    }
                }
            };
        }
    });

    stager.extendStep('submission', {
        init: function() {
            // Three arrays of submissions by exhibition.
            this.last_submissions = [[], [], []];
            this.memory.on('insert', this.assignSubToEx);
        },
        exit: function() {
            this.memory.off('insert', this.assignSubToEx);
        }
    });

    stager.extendStep('evaluation', {
        init: function() {
            this.last_reviews = {};
            this.reviewing = {};
        },
        cb: cbs.evaluation
    });

    stager.extendStep('dissemination', {
        init: function() {
            this.nextround_reviewers = [ [[], []], [[], []], [[], []] ];
        },
        cb: cbs.dissemination
    });

    stager.extendStage('final', {
        init: function() {
            var saveOptions;
            saveOptions = { flag: 'a' };

            // Save data.
            node.game.memory.save(this.DUMP_DIR + 'artex_part2.json',
                                  saveOptions);

            // Compute payoff.
            node.on.data('WIN', function(msg) {
                var id, code, db, svoOwn, svoFrom;
                var totWin, totWinUsd, bonusStr;

                id = msg.from;

                code = channel.registry.getClient(id);
                if (!code) {
                    console.log('ERROR: no code in endgame:', id);
                    return;
                }

                channel.registry.checkOut(id);

                // Computing SVO bonus from other player.
                svoFrom = channel.registry
                    .getClient(node.game.svoMatches[id]).svo;

                if (svoFrom) {
                    svoFrom = svoFrom[1];
                }
                else {
                    console.log('WARN: svoFrom not found. ', msg.from);
                    svoFrom = 50;
                }

                svoOwn = code.svo;
                if (!svoOwn) {
                    console.log('WARN: svoFrom not found. ', msg.from);
                    svoOwn = 100;
                }

                // Send information.
                node.say('WIN', id, {
                    win: code.bonus,
                    exitcode: code.ExitCode,
                    svo: svoOwn,
                    svoFrom: svoFrom
                });

                // Saving last stage player data.
                db = node.game.memory.pquest[msg.from];
                db.save(this.DUMP_DIR + 'artex_quest.json', saveOptions);

                // Saving tot bonus for player.
                totWin = (code.bonus + svoOwn + svoFrom);
                totWinUsd = totWin / settings.EXCHANGE_RATE;
                bonusStr = (code.AccessCode || code.id) + ', ' + 
                    (code.ExitCode || code.id) + ', ' +
                    totWin + ', ' + Number(totWinUsd).toFixed(2) + '\n';
                fs.appendFile(this.DUMP_DIR + 'bonus.csv', bonusStr,
                              function(err) {
                                  if (err) {
                                      console.log(err);
                                      console.log('Tot win: ' + totWin);
                                  }
                              });

                console.log('FINAL PAYOFF PER PLAYER');
                console.log('***********************');
                console.log(bonusStr);
                console.log();
            });
        },
        stepRule: 'SOLO'
    });

    // Here we group together the definition of the game logic.
    return {
        nodename: 'lgc' + counter,
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
