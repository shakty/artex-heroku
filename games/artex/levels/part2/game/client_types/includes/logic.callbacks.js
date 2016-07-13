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

    var matcher;

    // Create data dir. TODO: do it automatically?
    this.DUMP_DIR = DUMP_DIR = 
        path.resolve(channel.getGameDir(), 'data') + '/' + counter + '/';
    J.mkdirSyncRecursive(DUMP_DIR, 0777);

    // Number of reviewers per image.
    this.reviewers = 3;

    // Exhibition names and their id.
    this.exhibitions = {
        A: 0,
        B: 1,
        C: 2
    };

    // Player ids.
    this.plids = node.game.pl.id.getAllKeys();

    matcher = new ngc.Matcher();
    matcher.generateMatches('random', node.game.pl.size());
    matcher.setIds(this.plids);
    matcher.match();
    this.svoMatches = matcher.getMatchObject();

    // Object containing the last works under review by player.
    this.reviewing = null;

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

    // List of all winners of all times (to send to reconnecting players).
    this.winners = new Array(settings.REPEAT);

    // Decorate every object inserted in database with session and treatment.
    this.memory.on('insert', function(o) {
        o.session = node.nodename;
        o.treatment = gameRoom.treatmentName;
    });

    // Divide all objects of stage 'final' by player.
    this.memory.hash('pquest', function(o) {
        if (o.stage.stage > 1) return o.player;
    });

    // Keep last cf created by a subject.
    this.memory.index('cf', function(o) {
        if (o.cf || o.cf0) return o.player; 
    });

    // Function used in submission step
    // for every newly inserted item in db.
    this.assignSubToEx = function(i) {
        var idEx;
        idEx = node.game.exhibitions[i.ex];
        node.game.last_submissions[idEx].push({
            player: i.player,
            cf: node.game.memory.cf.get(i.player).cf
        });
    };

    // Register player disconnection, and wait for him...
    node.on.pdisconnect(function(p) {
        console.log('Disconnection in Stage: ' + node.player.stage);
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
        var submissions, sub, data, cf;
        var i, j;

        submissions = dataRound.fetch();
        // Generates a latin square array where:
        // - array-id of items to review,
        // - column are reviewers id.
        matches = J.latinSquareNoSelf(submissions.length, nReviewers);

        // Loop across reviewers.
        for (i = 0 ; i < submissions.length; i++) {
            data = { A: [], B: [], C: [] };
            // Loop across all items to review.
            for (j = 0 ; j < nReviewers ; j++) {
                // Get item to review.
                sub = submissions[matches[j][i]];
                cf = node.game.memory.cf.get(sub.player);
                cf = cf.cf || cf.cf0;
                // Add it to an exhibition.
                data[sub.ex].push({
                    face: cf,
                    author: sub.player,
                    ex: sub.ex
                });
            }

            // Send them.
            node.say('CF', submissions[i].player, data);

            // Store reference to resend them in case of disconnection.
            node.game.reviewing[submissions[i].player] = data;
        }
    });

    node.env('review_select', function() {
        var pool, elements;
        var rm, matches, data;
        var i, j, h, face;

        // TODO: redo completely.

        pool = that.nextround_reviewers;
        elements = that.last_submissions;

        // First round.
        if (!pool) {
            pool = J.map(elements, function(ex) { return [ex]; });
        }

        rm = new RMatcher();
        rm.init(elements, pool);

        matches = rm.match();

        data = {};
        for (i = 0; i < elements.length; i++) {
            for (j = 0; j < elements[i].length; j++) {
                for (h = 0; h < matches[i][j].length; h++) {
                    face = dataRound
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

function dissemination() {
    var ex, author, cf, mean, player, works;
    var nextRoundReviewer, player_result;
    var i, j, k, len;
    var idEx, nPubs, s;
    var round;

    // Array of all the selected works (by exhibition);
    var selected;
    // Results of the round (by author)
    var player_results;

    // Prepare result arrays.
    // Contains the selected images by exhibitions.
    selected = { A: [], B: [], C: [] };
    // Contains the individual result for every player.
    player_results = [];
    
    round = node.game.getCurrentGameStage().round

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
                round: round,
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

    // Keep track of all selected of all times (for recon purposes).
    round--;
    this.winners[round] = selected;

    console.log('dissemination');
}

function gameover() {
    console.log('************** GAMEOVER ' + gameRoom.name + ' **************');

    // Dump all memory.
    // node.game.memory.save(DUMP_DIR + 'memory_all.json');

    // TODO: fix this.
    // channel.destroyGameRoom(gameRoom.name);
}

function notEnoughPlayers() {
    node.game.gotoStep(new GameStage('final'));
}

function enoughPlayersAgain() {
    console.log('Enough players again!');
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