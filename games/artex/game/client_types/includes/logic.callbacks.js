/**
 * # Functions used by logic.
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

var ngc = require('nodegame-client');
var GameStage = ngc.GameStage;
var J = ngc.JSUS;
var fs = require('fs');
var path = require('path');
var RMatcher = require('./rmatcher');

var DUMP_DIR;

module.exports = {
    init: init,
    gameover: gameover,
    evaluation: evaluation,
    dissemination: dissemination,
    endgame: endgame,
    notEnoughPlayers: notEnoughPlayers,
    enoughPlayersAgain: enoughPlayersAgain
};

var node = module.parent.exports.node;
var channel = module.parent.exports.channel;
var gameRoom = module.parent.exports.gameRoom;
var settings = module.parent.exports.settings;
var counter = module.parent.exports.counter;

var client = gameRoom.getClientType('player');
var autoplay = gameRoom.getClientType('autoplay');

var WAIT_TIME = settings.WAIT_TIME * 1000;

function init() {

    // Create data dir. TODO: do it automatically?
    DUMP_DIR = path.resolve(channel.getGameDir(), 'data') + '/' + counter + '/';
    J.mkdirSyncRecursive(DUMP_DIR, 0777);

    this.disconnectStr = 'One or more players disconnected. If they ' +
        'do not reconnect within ' + settings.WAIT_TIME  +
        ' seconds the game will be terminated.';

    // Number of reviewers per image.
    this.reviewers = 3;

    // Exhibition names and their id.
    this.exhibitions = {
        A: 0,
        B: 1,
        C: 2
    };

    // Player ids.
    this.plids = node.game.pl.keep('id').fetch();

    // Object containing the reviews received by every player.
    this.last_reviews = null;

    // Array containing the id the players
    // that have submitted to an exhibition.
    this.last_submissions = null;

    // In case the review assignment is not random,
    // but based on current round actions, this object contains them.
    this.nextround_reviewers = null;

    // Flag to check if the game was terminated abnormally.
    this.gameTerminated = 0;

    // Decorate every object inserted in database with session and treatment.
    this.memory.on('insert', function(o) {
        o.session = node.nodename;
        o.treatment = gameRoom.treatmentName;
    });

    // Function used in submission step
    // for every newly inserted item in db.
    this.assignSubToEx = function(i) {
        var idEx = node.game.exhibitions[i.ex];
        node.game.last_submissions[idEx].push({ player: i.player, cf: i.cf });
    };

    // Register player disconnection, and wait for him...
    node.on.pdisconnect(function(p) {
        console.log('Disconnection in Stage: ' + node.player.stage);
    });

    // Player reconnecting.
    // Reconnections must be handled by the game developer.
    node.on.preconnect(function(p) {
        var code, questStage, disconnectStage;

        console.log('Oh...somebody reconnected!', p.id);
        code = channel.registry.getClient(p.id);

        // The stage when the client disconnected.
        questStage = node.game.questStage;
        disconnectStage = p.stage;

        // If we are in the last steps.
        if (node.game.compareCurrentStep('questionnaire') >= 0) {

            // Player disconnected before the questionnaire
            if (GameStage.compare(disconnectStage, questStage) < 0) 


            // TODO Handle last stage.
            // node.remoteCommand('goto_step', XXXX);

            if (node.game.compareCurrentStep('endgame') === 0) {
                payoff = doCheckout(p);
                // If player was not checkout yet, do it.
                if (payoff) postPayoffs([payoff]);
            }
            return;
        }

        // Setup newly connected client.
        gameRoom.setupClient(p.id);

        // Inits the game on the reconnecting client.
        node.remoteCommand('start', p.id, { step: false });

        // Add player to player list.
        node.game.pl.add(p);


        // Clear any message in the buffer from.
        node.remoteCommand('erase_buffer', 'ROOM');

        // Will send all the players to current stage
        // (also those who were there already).
        node.game.gotoStep(node.player.stage);

        // TODO: or...

        setTimeout(function() {
            // Pause the game on the reconnecting client, will be resumed later.
            // node.remoteCommand('pause', p.id);
            // Unpause ROOM players
            // TODO: add it automatically if we return TRUE? It must be done
            // both in the alias and the real event handler
            node.game.pl.each(function(player) {
                if (player.id !== p.id) {
                    node.remoteCommand('resume', player.id);
                }
            });
            // The logic is also reset to the same game stage.
        }, 100);
    });


    console.log('init');
}

function evaluation() {
    var that;
    var nReviewers, matches;
    var dataRound;

    that = this;

    nReviewers = this.pl.size() > 3 ?
        this.reviewers : this.pl.size() > 2 ? 2 : 1;

    dataRound = this.memory.stage[this.getPreviousStep()];

    node.env('review_random', function() {
        var faces, face, data;
        var i, j;
        faces = dataRound.fetch();
        // Generates a latin square array where:
        // - array-id of items to review,
        // - column are reviewers id.
        matches = J.latinSquareNoSelf(faces.length, nReviewers);

        // Loop across reviewers.
        for (i = 0 ; i < faces.length; i++) {
            data = { A: [], B: [], C: []};
            // Loop across all items to review.
            for (j = 0 ; j < nReviewers ; j++) {
                // Get item to review.
                face = faces[matches[j][i]];
                // Add it to an exhibition.
                data[face.ex].push({
                    face: face.cf,
                    author: face.player,
                    ex: face.ex
                });
            }

            console.log(faces[i].player);

            // Send them.
            node.say('CF', faces[i].player, data);
        }
    });

    node.env('review_select', function() {
        var pool = that.nextround_reviewers;
        var elements = that.last_submissions;

        // First round.
        if (!pool) {
            pool = J.map(elements, function(ex) { return [ex]; });
        }

        var rm = new RMatcher();
        rm.init(elements, pool);

        var matches = rm.match();

        var data = {};
        for (var i = 0; i < elements.length; i++) {
            for (var j = 0; j < elements[i].length; j++) {

                for (var h = 0; h < matches[i][j].length; h++) {
                    var face = dataRound
                        .select('player', '=', elements[i][j]).first();

                    if (!data[face.value]) data[face.value] = [];

                    data = {
                        face: face.CF.value,
                        author: face.player,
                        ex: face.value
                    };
                    node.say('CF', matches[i][j][h], data);
                }

            }

        }
    });

    // Build reviews index.
    node.on.data('done', function(msg) {
        var i, len, reviews, creator;
        if (!msg.data || !msg.data.reviews || !msg.data.reviews.length) {
            console.log('Error: no reviews received.', msg);
            return;
        }
        reviews = msg.data.reviews;
        // Loop through all the reviews of the subject,
        // and group them by item reviewed.
        i = -1, len = reviews.length;
        for ( ; ++i < len ; ) {
            creator = reviews[i].creator;
            if (!that.last_reviews[creator]) that.last_reviews[creator] = [];
            that.last_reviews[creator].push(reviews[i].eva);
        }
    });

    console.log('evaluation');
}

// function dissemination() {
//     var ex, author, cf, mean, player, works;
//     var nextRoundReviewer, player_result;
//     var i, j, k, len;
//     var idEx, nPubs, s;
//     var submissionRound;
// 
//     // Array of all the selected works (by exhibition);
//     var selected;
//     // Results of the round (by author)
//     var player_results;
// 
//     // Prepare result arrays.
//     // Contains the selected images by exhibitions.
//     selected = { A: [], B: [], C: [] };
//     // Contains the individual result for every player.
//     player_results = [];
//     submissionRound = this.getPreviousStep(2);
//     // Loop through exhibitions.
//     for (i = 0; i < this.last_submissions.length; i++) {
// 
//         // Groups all the reviews for an artist.
//         works = this.last_submissions[i];
// 
//         // Exhibition.
//         ex = this.settings.exhibitNames[i];    
// 
//         // Collect all reviews and compute mean.
//         for (j = 0; j < works.length; j++) {
//             player = works[j].player;
//             if (!this.last_reviews[player]) {
//                 node.err('No reviews for player: ' + player +
//                          '. This should not happen. Some results are missing.');
//                 continue;
//             }
//             author = this.pl.id.get(player);
//             if (!author) {
//                 node.err('No author found. This should not happen. ' +
//                          'Some results are missing.');
//                 continue;
//             }
// 
//             // Compute average review score.
//             mean = 0;
//             k = -1, len = this.last_reviews[player].length;
//             for ( ; ++k < len ; ) {
//                 mean += this.last_reviews[player][k]
//             }
//             mean = mean / this.last_reviews[player].length;
// 
//             // Cf.
//             cf = works[j].cf;
// 
//             // Player is a submitter: second choice reviewer.
//             nextRoundReviewer = 1;
// 
//             player_result = {
//                 player: player,
//                 author: author.name || player.substr(player.length -5),
//                 mean: mean.toFixed(2),
//                 ex: ex,
//                 round: submissionRound,
//                 payoff: 0 // will be updated later
//             };
// 
//             // Threshold.
//             if (mean > settings.threshold) {
//                 // Mark that there is at least one winner.
//                 selected.winners = true;
// 
//                 J.mixin(player_result, {
//                     cf: cf,
//                     id: author.name,
//                     round: node.game.getCurrentGameStage().toHash('S.r'),
//                     pc: author.pc,
//                     published: true
//                 });
// 
//                 selected[ex].push(player_result);
// 
//                 // Player will be first choice as a reviewer
//                 // in exhibition i
//                 nextRoundReviewer = 0;
//             }
// 
//             // Add player to the list of next reviewers for the
//             // exhibition where he submitted / published
//             this.nextround_reviewers[i][nextRoundReviewer].push(player);
// 
//             // Add results for single player
//             player_results.push(player_result);
//         }
//     }
// 
//     // Dispatch exhibition results to ROOM.
//     node.say('WIN_CF', 'ROOM', selected);
// 
//     // Compute individual payoffs and send them to each player.
//     i = -1, len = player_results.length;
//     for ( ; ++i < len ; ) {
//         r = player_results[i];
// 
//         if (r.published) {
//             if (node.game.settings.com) {
//                 idEx = node.game.exhibitions[r.ex];
//                 nPubs = node.game.nextround_reviewers[idEx][0].length;
//                 r.payoff = (node.game.settings.payoff / nPubs).toFixed(2);
//             }
//             else {
//                 r.payoff = node.game.settings.payoff;
//             }
//             // Update global payoff.
//             code = channel.registry.getClient(r.player);
//             code.bonus = code.bonus ? code.bonus + r.payoff : r.payoff;
//         }
//         node.say('PLAYER_RESULT', r.player, r);
//     }
// 
//     console.log('dissemination');
// }


function dissemination() {
    var ex, author, cf, mean, player, works;
    var nextRoundReviewer, player_result;
    var i, j, k, len;
    var idEx, nPubs, s;

    // Array of all the selected works (by exhibition);
    var selected;
    // Results of the round (by author)
    var player_results;

    // Prepare result arrays.
    // Contains the selected images by exhibitions.
    selected = { A: [], B: [], C: [] };
    // Contains the individual result for every player.
    player_results = [];

    // Loop through exhibitions.
    for (i = 0; i < this.last_submissions.length; i++) {

        // Groups all the reviews for an artist.
        works = this.last_submissions[i];

        // Don't do more if there are no images submitted here.
        if (!works.length) continue;

        // Exhibition.
        ex = this.settings.exhibitNames[i];        
        // Exhibition settings.
        s = settings['ex' + ex];

        // Collect all reviews and compute mean.
        for (j = 0; j < works.length; j++) {
            player = works[j].player;
            if (!this.last_reviews[player]) {
                node.err('No reviews for player: ' + player +
                         '. This should not happen. Some results are missing.');
                continue;
            }
            author = this.pl.id.get(player);
            if (!author) {
                node.err('No author found. This should not happen. ' +
                         'Some results are missing.');
                continue;
            }

            // Compute average review score.
            mean = 0;
            k = -1, len = this.last_reviews[player].length;
            for ( ; ++k < len ; ) {
                mean += this.last_reviews[player][k]
            }
            mean = mean / this.last_reviews[player].length;

            // Cf.
            cf = works[j].cf;

            // Player is a submitter: second choice reviewer.
            nextRoundReviewer = 1;

            player_result = {
                player: player,
                author: author.name || player.substr(player.length -5),
                mean: Number(mean.toFixed(2)),
                ex: ex,
                round: GameStage.toHash(node.game.getCurrentGameStage(), 'S.r'),
                cf: cf,
                id: author.name,
                payoff: 0 // will be updated later
            };

            if (s.competition === 'threshold') {
                // Threshold.
                if (mean > settings.threshold) {
                    // Mark that there is at least one winner.
                    selected.winners = true;

                    player_result.published = true;                    
                   
                    selected[ex].push(player_result);

                    // Player will be first choice as a reviewer
                    // in exhibition i
                    nextRoundReviewer = 0;

                    
                }
            }
            else {
                // Tournament. (push anyway).
                selected[ex].push(player_result);
            }

            // Add player to the list of next reviewers for the
            // exhibition where he submitted / published
            this.nextround_reviewers[i][nextRoundReviewer].push(player);

            // Add results for single player
            player_results.push(player_result);
        }

        if (s.competition === 'tournament') {
            selected.winners = true;
            selected[ex].sort(function(a, b) {
                if (a.mean > b.mean) return -1;
                if (b.mean > a.mean) return 1;
                return 0;
            });
            // Take only N winners per exhibition.
            selected[ex] = selected[ex].slice(0, s.N);
            j = -1, len = selected[ex].length;
            for ( ; ++j < len ; ) {
                selected[ex][j].published = true;
            }            
        }
    }

    // Dispatch exhibition results to ROOM.
    node.say('WIN_CF', 'ROOM', selected);

    // Compute individual payoffs and send them to each player.
    i = -1, len = player_results.length;
    for ( ; ++i < len ; ) {
        r = player_results[i];

        if (r.published) {
            s = settings['ex' + r.ex];
            if (s.competition === 'threshold') {
                if (node.game.settings.com) {
                    idEx = node.game.exhibitions[r.ex];
                    nPubs = selected[r.ex].length;
                    r.payoff = (node.game.settings.payoff / nPubs).toFixed(2);
                }
                else {
                    r.payoff = node.game.settings.payoff;
                }
            }
            // 'tournament'
            else {
                r.payoff = s.reward;
            }
            // Update global payoff.
            code = channel.registry.getClient(r.player);
            code.bonus = code.bonus ? code.bonus + r.payoff : r.payoff;
        }
        else {
            // Remove data we do not need to send.
            r.cf = null;
        }
        node.say('PLAYER_RESULT', r.player, r);
    }

    console.log('dissemination');
}

function endgame() {
    var payoffs, payoff;

    // Save database.
    node.game.memory.save(DUMP_DIR + '/data_' + node.nodename + '.json');

    console.log('FINAL PAYOFF PER PLAYER');
    console.log('***********************');

    // Compute final bonuses and send them to each player.
    payoffs = node.game.pl.map(doCheckout);

    // Only with Descil.
    // postPayoffs(payoffs);

    console.log('***********************');
    console.log('Game ended');

    // Write bonus file.
    writeBonusFile(payoffs);

    // TODO: do we need this? It triggers gameover.
    // node.done();
}

function gameover() {
    console.log('************** GAMEOVER ' + gameRoom.name + ' **************');

    // Dump all memory.
    node.game.memory.save(DUMP_DIR + 'memory_all.json');

    // TODO: fix this.
    // channel.destroyGameRoom(gameRoom.name);
}

function notEnoughPlayers() {
    if (this.countdown) return;
    console.log('Warning: not enough players!!');
    node.remoteCommand('pause', 'ROOM', this.disconnectStr);
    this.countdown = setTimeout(function() {
        console.log('Countdown fired. Going to Step: questionnaire.');
        node.remoteCommand('erase_buffer', 'ROOM');
        node.remoteCommand('resume', 'ROOM');
        node.game.gameTerminated = true;
        // if syncStepping = false
        //node.remoteCommand('goto_step', 5);
        node.game.gotoStep(new GameStage('questionnaire'));
    }, WAIT_TIME);
}

function enoughPlayersAgain() {
    console.log('Enough players again!');
    // Delete countdown to terminate the game.
    clearTimeout(this.countdown);
    this.countdown = null;
}

/**
 * ## doCheckout
 *
 * Checks if a player has played enough rounds, and communicates the outcome
 *
 * @param {object} p A player object with valid id
 *
 * @return {object} A payoff object as required by descil-mturk.postPayoffs.
 *   If the player has not completed enough rounds returns undefined.
 */
function doCheckout(p) {
    var code;
    code = channel.registry.getClient(p.id);
    if (code.checkout) {
        node.remoteAlert('Hi! It looks like you have already ' +
                         'completed this game.', p.id);
        return;
    }
    // Computing payoff and USD.
    code.checkout = true;

    code.bonus = code.bonus || 0;
    code.usd = parseFloat(
        ((code.bonus * settings.EXCHANGE_RATE).toFixed(2)),
        10);

    // Sending info to player.
    node.say('win', p.id, {
        ExitCode: code.ExitCode,
        fail: code.fail,
        bonus: code.bonus,
        usd: code.usd
    });

    return {
        AccessCode: p.id,
        Bonus: code.usd,
        ExitCode: code.ExitCode,
        BonusReason: 'Full bonus.'
    };
}

function writeBonusFile(data) {
    var bonusFile;
    var i, len;
    // Create stream and write.
    bonusFile = fs.createWriteStream(DUMP_DIR + 'bonus.csv');
    bonusFile.on('error', function(err) {
        console.log('Error while saving bonus file: ', err);
    });
    bonusFile.write('access, exit, bonus, terminated\n');
    i = -1, len = data.length;
    for ( ; ++i < len ; ) {
        bonusFile.write(data[i].AccessCode + ',' +
                        (data[i].ExitCode || 'NA') + ',' +
                        data[i].Bonus + ',' +
                        (!!!data[i].Fail ? '1' : '0') + '\n');
    }
    bonusFile.end();
}