/**
 * # Player code for Ultimatum Game
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * Handles bidding, and responds between two players.
 * Extensively documented tutorial.
 *
 * http://www.nodegame.org
 */

var ngc = require('nodegame-client');
var Stager = ngc.Stager;
var stepRules = ngc.stepRules;
var constants = ngc.constants;

// Export the game-creating function.
module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var game, MIN_PLAYERS;
    var cbs;

    var channel = gameRoom.channel;
    var node = gameRoom.node;

    // The game object to return at the end of the function.
    game = {};

    // Import other functions used in the game.

    cbs = require(__dirname + '/includes/player.callbacks.js');

    // Specify init function, and extend default stages.

    // Init callback.
    stager.setOnInit(cbs.init);

    stager.setOnGameOver(function() {
        // Do something if you like!
    });

    // Add all the stages into the stager.

    stager.setDefaultProperty('done', cbs.clearFrame);

    stager.extendStep('instructions', {
        cb: cbs.instructions,
        minPlayers: MIN_PLAYERS,
        timer: settings.timer.instructions
    });

    stager.extendStep('quiz', {
        cb: cbs.quiz,
        timer: settings.timer.quiz,
//        done: function() {
//            var b, QUIZ, answers, isTimeup;
//            QUIZ = W.getFrameWindow().QUIZ;
//            b = W.getElementById('submitQuiz');
//
//            answers = QUIZ.checkAnswers(b);
//            isTimeup = node.game.timer.isTimeup();
//
//            if (!answers.__correct__ && !isTimeup) {
//                return false;
//            }
//
//            answers.timeUp = isTimeup;
//            answers.quiz = true;
//
//            // On TimeUp there are no answers
//            node.set(answers);
//            node.emit('INPUT_DISABLE');
//            
//            return true;
//        }
    });

    // Adjust to displaying rounds in main stage.
    stager.extendStage('artex', {
        init: function() {
            node.game.rounds.setDisplayMode([
                'COUNT_UP_STAGES_TO_TOTAL',
                'COUNT_UP_ROUNDS_TO_TOTAL'
            ]);
        },
        exit: function() {
            node.game.rounds.setDisplayMode([ 'COUNT_UP_STAGES_TO_TOTAL' ]);
        }
    });

    stager.extendStep('creation', {
        init: function() {
            node.game.copies = [];
        },
        cb: cbs.creation,
        timer: settings.timer.creation,
        done: function(ex) {
            // TODO: Check ex?
            $(".copyorclose").dialog('close');
            node.game.last_cf = node.game.cf.getAllValues();
            node.game.last_ex = node.game.last_ex = ex;
            return {
                ex: ex,
                cf: node.game.last_cf,
                copies: node.game.copies
            };
        }
    });
    
    stager.extendStep('evaluation', {
        init: function() {
            // Reset evaluations.
            node.game.evas = {};
        },
        cb: cbs.evaluation,
        timer: settings.timer.evaluation,
        done: function() {
            var i, out, eva;
            out = [];
            for (i in this.evas) {
                if (this.evas.hasOwnProperty(i)) {
                    eva = this.evas[i];
                    out.push({
                        creator: i,
                        ex: eva.ex,
                        eva: parseFloat(eva.display.value, 10),
                        hasChanged: !!eva.changed
                    });
                }
            }
            // Making it an object, so that is is sent as a single parameter.
            return { reviews: out };
        }
    });
    
    stager.extendStep('dissemination', {
        cb: cbs.dissemination,
        timer: settings.timer.dissemination,
    });

    stager.extendStep('questionnaire', {
        cb: cbs.questionnaire,
        timer: 90000,
        // `done` is a callback function that is executed as soon as a
        // _DONE_ event is emitted. It can perform clean-up operations (such
        // as disabling all the forms) and only if it returns true, the
        // client will enter the _DONE_ stage level, and the step rule
        // will be evaluated.
        done: function() {

            // TODO: do checkings, check if timeup.

            node.emit('INPUT_DISABLE');
        }
    });

    stager.extendStep('endgame', {
        cb: cbs.endgame
    });

    // We serialize the game sequence before sending it.
    game.plot = stager.getState();

    // Other settings, optional.   
    
    //auto: true = automatic run, auto: false = user input
    game.env = {
        auto: settings.AUTO,
        review_select: !!settings.review_select,
        review_random: !!settings.review_random,
        com: !!settings.com,
        coo: !!settings.coo
    };



    game.verbosity = setup.verbosity;
    game.debug = setup.debug;

    game.nodename = 'player';

    return game;
};
