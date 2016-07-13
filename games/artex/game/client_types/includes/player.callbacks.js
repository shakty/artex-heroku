/**
 * # Functions used player clients in the Art Exhibition Game
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = {
    init: init,
    submission: submission,
    dissemination: dissemination
};

function init() {
    var that, header;

    that = this;
    this.node.log('Init.');

    // Setup the header (by default on the left side).
    if (!W.getHeader()) {
        header = W.generateHeader();

        W.setHeaderPosition('top');

        // Uncomment to visualize the name of the stages.
        //node.game.visualStage = node.widgets.append('VisualStage', header);

        node.game.visualTimer = node.widgets.append('VisualTimer', header);

        node.game.rounds = node.widgets.append('VisualRound', header, {
            displayModeNames: ['COUNT_UP_STAGES_TO_TOTAL'],
            // totStageOffset: 1,
            title: 'Timer:'
        });

        if (node.game.settings.competition === 'tournament') {
            node.game.money = node.widgets.append('MoneyTalks', header, {
                currency: '', title: 'Points:', precision: 0
            });
        }
        else {
            node.game.money = node.widgets.append('MoneyTalks', header, {
                currency: 'CHF', money: 10
            });
        }
        node.game.donebutton = node.widgets.append('DoneButton', header, {
            text: 'Click here when you are done!'
        });

    }

    // Add the main frame where the pages will be loaded.
    if (!W.getFrame()) W.generateFrame();

    // Holds references to copied images in current round.
    // Gets cleared every step.
    this.copies = [];

    // Reference to the main drawing ChernoffFaces widget
    this.cf = null;

    // Reference to the values of the last created Chernoff face.
    this.last_cf = null;

    // Exhibition names and total number.
    this.exhibitNames = this.settings.exhibitNames;
    this.nExhibits = this.exhibitNames.length;

    // Indexes of what sliders displaying past images by exhibition.
    this.subSliders = { A: 0, B: 0, C: 0 };

    // Winners.
    this.winners = { A: [], B: [], C: [] };

    // Questionnaire data.
    this.questionnaire = {};

    this.submissionMade = function(decision) {
        var td, otherTd, otherTd2;
        var tdButton, otherTdButton, otherTdButton2;

        if (decision === 'A') {
            td = W.getElementById('td-A');
            otherTd = W.getElementById('td-B');
            otherTd2 = W.getElementById('td-C');
            tdButton = W.getElementById('button-A');
            otherTdButton = W.getElementById('button-B');
            otherTdButton2 = W.getElementById('button-C');
        }
        else if (decision === 'B') {
            td = W.getElementById('td-B');
            otherTd = W.getElementById('td-A');
            otherTd2 = W.getElementById('td-C');
            tdButton = W.getElementById('button-B');
            otherTdButton = W.getElementById('button-A');
            otherTdButton2 = W.getElementById('button-C');
        }
        else if (decision === 'C') {
            td = W.getElementById('td-C');
            otherTd = W.getElementById('td-A');
            otherTd2 = W.getElementById('td-B');
            tdButton = W.getElementById('button-C');
            otherTdButton = W.getElementById('button-B');
            otherTdButton2 = W.getElementById('button-A');
        }
        else {
            node.err('unknown exhibition selected: ' + decision);
            return;
        }

        node.game.last_ex = decision;

        // Departure time is changed by the slider for car.
        JSUS.addClass(tdButton, 'active');
        JSUS.removeClass(otherTdButton, 'active');
        JSUS.removeClass(otherTdButton2, 'active');

        td.className = 'td-selected';
        otherTd.className = '';
        otherTd2.className = '';

        this.updateSubmissionButton();
    };

    this.updateSubmissionButton = function(decision) {
        var span;
        decision = decision || node.game.last_ex;
        if (decision) {
            span = W.getElementById('span-you-chose');
            span.innerHTML = ' (Your choice: <em>' + decision + '</em>)';
            node.game.donebutton.enable();
        }
    };

    // Quiz questions (to be filled by quiz stage).
    this.quizzes = [];

    // Current rounds of evalutions (review delivered by subject).
    // For each item it contains if the slider was moved, a reference
    // to the input containing the current value, and the exhibition.
    this.evas = {};

    // Names of the questionnaire forms ids (standard).
    this.qNames = [ 'enjoy', 'competitive', 'exbeau', 'exinn', 'exfair' ];

    // Names of the questionnaire forms ids (additional).
    this.qNamesExtra = [
        'creation', 'submission', 'review', 'copy',
        'specialization', 'ui', 'freecomment'
    ];
      
    // Names of the questionnaire forms ids (additional).
    this.qNamesExtraSubs = {
        creation: [
            {
                id: 'random',
                mainText: 'I was changing the image randomly'
            },
            {
                id: 'similar',
                mainText: 'I aimed at becoming more <em>similar</em> ' +
                    'to what I saw in the previous round/s'
            },
            {
                id: 'dissimilar',
                mainText: 'I aimed at becoming more ' +
                    '<em>dissimilar/unique</em> from ' +
                    'what I saw in the previous round/s'
            },
            {
                id: 'sim_toex',
                mainText: 'I aimed at becoming more <em>similar</em> to ' +
                    'the images displayed in the exhibition where I wanted ' +
                    'to submit'
            },
            {
                id: 'dis_toex',
                mainText: 'I aimed at becoming more ' +
                    '<em>dissimilar/unique</em> from the images ' +
                    'displayed in the exhibition where I wanted to submit'
            }
        ],
        submission: [
            {
                id: 'random',
                mainText: 'I chose randomly'
            },
            {
                id: 'popular',
                mainText: 'I chose the exhibition that the majority ' +
                    'of other people was choosing as well'
            },
            {
                id: 'qualityup',
                mainText: 'I chose based on the quality of the image ' +
                    'just created: the <em>most</em> beautiful/appealing ' +
                    'images to the <em>most</em> competitive exhibitions ' +
                    '(A or B).'
            },
            {
                id: 'qualitydown',
                mainText: 'I chose based on the quality of the image ' +
                    'just created: the <em>most</em> beautiful/appealing ' +
                    'images to the <em>least</em> competitive exhibitions ' +
                    '(C or B).'
            },
            {
                id: 'innup',
                mainText: 'I chose based on the innovativeness of the ' +
                    'image just created: the <em>most</em> innovative ' +
                    'images to the <em>most</em> competitive exhibitions ' +
                    '(A or B).'
            },
            {
                id: 'inndown',
                mainText: 'I chose based on the innovativeness of the ' +
                    'image just created: the <em>most</em> innovative ' +
                    'images to the <em>least</em> competitive exhibitions ' +
                    '(C or B).'
            },
            {
                id: 'fit',
                mainText: 'I chose the exhibition where my image would ' +
                    'fit best in terms of style'
            },
            {
                id: 'reward',
                mainText: 'I chose the exhibition based on the expected reward'
            }
        ],
        review: [
            {
                id: 'byex',
                mainText: 'I considered the exhibition I was reviewing for: ' +
                    'I was expecting more for images submitted to A, a bit ' +
                    'less for B, and even less for C'
            },
            {
                id: 'like',
                mainText: 'I gave higher scores to the images that ' +
                    'I liked the most'
            },
            {
                id: 'diverse',
                mainText: 'I gave higher scores to images that were more' +
                    'diverse/unique'
            },
            {
                id: 'fit',
                mainText: 'I gave higher scores to images that were fitting ' +
                    'the style of the exhibition to which they have ' +
                    'been submitted'
            },
            {
                id: 'sameex',
                mainText: 'I gave lower scores to images submitted ' +
                    'to my same exhibition in general'
            },
            {
                id: 'sameexA',
                mainText: 'When I chose exhibition A, I gave lower ' +
                    'scores to images submitted A'
            },
            {
                id: 'sameexB',
                mainText: 'When I chose exhibition B, I gave lower ' +
                    'scores to images submitted to B'
            },
            {
                id: 'sameexC',
                mainText: 'When I chose exhibition C, I gave lower ' +
                    'scores to images submitted to C'
            }
        ],
        copy: [
            {
                id: 'never',
                mainText: 'I seldom or never copied past images'                
            },
            {
                id: 'liked',
                mainText: 'I copied because I liked an image ' +
                    'and I thought I that it could improve my style'
            },
            {
                id: 'win_similar',
                mainText: 'I copied because I thought that submitting ' +
                    'similar image would increase my chances of winning'
            },
            {
                id: 'savetime',
                mainText: 'I copied to save time to create something else'
            },
            {
                id: 'newideas',
                mainText: 'I copied when I was running out of new ideas'
            },
            {
                id: 'copy_old',
                mainText: 'I copied when I thought that bringing back an ' +
                    'old image would make me successful'
            }
        ],
        specialization: [
            {
                id: 'A',
                mainText: 'Exhibition A was very different from the others'
            },
            {
                id: 'B',
                mainText: 'Exhibition B was very different from the others'
            },
            {
                id: 'C',
                mainText: 'Exhibition C was very different from the others'
            },
            {
                id: 'same',
                mainText: 'I did not notice any significant difference ' +
                    'across exhibitions'
            }
        ],
        ui: [
            {
                id: 'easy',
                mainText: 'The interface to create was immediately easy to use'
            },
            {
                id: 'more_options',
                mainText: 'I wished to have more options to express my ' +
                    'creativity'
            }
        ]
    };

   // All ids of questionnaire forms.
    this.qNamesAll = this.qNames.concat(this.qNamesExtra);

    // List of all past exhibitions.
    this.all_ex = new W.List({
        id: 'all_ex',
        lifo: true
    });

    // Renders a chernoff face (plus metadata) inside a table's cell.
    this.renderCF = function(cell) {
        var stepName, w, h;
        var cf, cfOptions;
        var container, cfDetailsTable;

        // Check if it is really CF obj (can be another cell, e.g. header).
        if (!cell.content || !cell.content.cf) return;

        stepName = node.game.getCurrentStepObj().id;

        // Adjust dimensions depending on the step.
        if (stepName === 'creation') {
            w = 100;
            h = 100;
        }
        else if (stepName === 'submission') {
            w = 50;
            h = 50;
        }
        else {
            w = 200;
            h = 200;
        }

        cfOptions = {
            width: w,
            height: h,
            features: cell.content.cf,
            controls: false,
            onChange: false,
            title: false
        };

        if (stepName !== 'submission') {

            // Creating HTML.
            container = document.createElement('div');
            cf = node.widgets.append('ChernoffFaces',
                                     container,
                                     cfOptions);

            cfDetailsTable = new W.Table();
            cfDetailsTable.addColumn([
                'Author: ' + cell.content.author,
                'Score: ' + cell.content.mean
            ]);
            container.appendChild(cfDetailsTable.parse());

            // Add listener on canvas.
            cf.getCanvas().onclick = function() {
                node.game.popupCf.call(cf, stepName, cell.content);
            };
            return container;
        }
        else {
            // Just canvas.
            cf = node.widgets.get('ChernoffFaces', cfOptions);
            cf.buildCanvas();
            return cf.getCanvas();
        }

    };

    this.popupCf = function(stepName, metadata) {
        var cf, cfOptions;
        var div, buttons, f;

        f = this.getValues();

        cfOptions = {
            width: 400,
            height: 400,
            features: f,
            controls: false,
            onChange: false,
            title: false
        };

        cf = node.widgets.get('ChernoffFaces', cfOptions);

        cf.buildCanvas();
        $(cf.canvas).css('background', 'white');
        $(cf.canvas).css('border', '3px solid #CCC');
        $(cf.canvas).css('padding', '5px');

        div = $('<div class="copyorclose">');
        div.append(cf.getCanvas());

        // If we are not in dissemination we can copy the image.
        if (stepName !== 'dissemination') {
            buttons = new Array(2);
            buttons[0] = {
                text: 'copy',
                click: function() {
                    // Triggers the update of the image and sliders.
                    node.emit('COPIED', f);
                    // Keep track of copying.
                    node.game.copies.push({
                        time: node.timer.getTimeSince('step'),
                        author: metadata.author,
                        ex: metadata.ex,
                        mean: metadata.mean,
                        round: metadata.round
                    });
                    $(this).dialog("close");
                }
            };
        }
        else {
            buttons = new Array(1);
        }

        buttons[buttons.length-1] = {
            text: 'Cancel',
            click: function() { $(this).dialog("close"); }
        };

        div.dialog({
            width: 480,
            height: 580,
            show: "blind",
            hide: "explode",
            buttons: buttons,
            dialogClass: 'noTitleStuff'
        });
    };

    this.addImagesToEx = function(ex) {
        var i, len, nTR, winners, container;
        var table, y, row, seeMore;

        var IMGS_4_ROW = 4;
        var ROWS_2_SHOW = 2;

        container = W.getElementById('ex-' + ex);
        winners = node.game.winners[ex];
        len = winners.length;
        if (!len) {
            W.getElementById('span-past-images-' + ex)
                .style.display = 'none';
            container.innerHTML = '<span class="noimages">' +
                'No past images yet</span>';
            return;
        }
        // Number of rows in the table.
        nTR = Math.floor(len / IMGS_4_ROW);
        if (len % IMGS_4_ROW !== 0) nTR++;

        // Pointer to last visible row (first row = last images).
        node.game.subSliders[ex] = ROWS_2_SHOW;

        table = new W.Table({
            className: 'exhibition',
            render: {
                pipeline: node.game.renderCF,
                returnAt: 'first'
            },
            id: 'tbl-ex-' + ex,
            tr: function(tr, row) {
                if ('number' !== typeof row) return;
                if (row >= ROWS_2_SHOW) tr.style.display = 'none';
            }
        });

        row = new Array(IMGS_4_ROW);
        i = -1, y = -1;
        for ( ; ++i < len ; ) {
            y = i % IMGS_4_ROW;
            row[y] = winners[i];
            if (y === (IMGS_4_ROW-1)) {
                table.addRow(row);
                row = new Array(IMGS_4_ROW);
            }
        }
        y = i % IMGS_4_ROW;
        if (y !== 0) table.addRow(row.splice(0, y));

        table.parse();
        container.appendChild(table.table);

        if (len > (IMGS_4_ROW * ROWS_2_SHOW)) {
            // Add last row to control visible rows (if needed).
            seeMore = document.createElement('button');
            seeMore.innerHTML = 'See more';
            seeMore.className = 'seemore btn btn-default';

            seeMore.onclick = function() {
                var idxShow, idxHide, trShow, trHide;
                // Restarting modular index.
                if (node.game.subSliders[ex] === 1) idxHide = nTR;
                else idxHide = node.game.subSliders[ex]-1;
                trHide = table.getTR((idxHide-1));

                if (!trHide) {
                    console.log('Error... trHide not found.');
                    return;
                }

                if (node.game.subSliders[ex] < nTR) node.game.subSliders[ex]++;
                else node.game.subSliders[ex] = 1;

                idxShow = node.game.subSliders[ex];
                trShow = table.getTR((idxShow-1));

                if (!trShow) {
                    console.log('Error... trShow not found.');
                    return;
                }

                trHide.style.display = 'none';
                trShow.style.display = '';

            };
            container.appendChild(seeMore);
        }

    };
}

function submission() {
    W.loadFrame('submission.html', function() {
        var creaDiv, f, options;

        creaDiv = W.getElementById("creation");
        f = node.game.cf.getValues();

        options = {
            width: 200,
            height: 200,
            features: f,
            controls: false,
            onChange: false,
            title: false
        };

        node.widgets.append('ChernoffFaces', creaDiv, options);

        this.addImagesToEx('A');
        this.addImagesToEx('B');
        this.addImagesToEx('C');

        node.events.step.emit('canvas_tooltip');
    });
    console.log('Submission');
}

function dissemination() {

    var dt_header, table;

    dt_header = 'Round: ' + node.player.stage.round;
    this.all_ex.addDT(dt_header);

    table = new W.Table({
        className: 'exhibition',
        render: {
            pipeline: this.renderCF,
            returnAt: 'first'
        }
    });
    table.setHeader(this.exhibitNames);

    W.loadFrame('dissemination.html', function() {

        node.on.data('WIN_CF', function(msg) {
            console.log('WWWWWWWWWIN_CF');

            if (!msg.data) {
                node.err('Error: No data received on WIN_CF.');
                return;
            }

            if (msg.data.winners) {
                makeExColumn('A', msg.data.A);
                makeExColumn('B', msg.data.B);
                makeExColumn('C', msg.data.C);
            }
            else {
                str = 'No painting was considered good enough ' +
                    'to be put on display.';
                W.write(str, W.getElementById("container_exhibition"));
                this.all_ex.addDD(str);
            }

            W.getElementById('container_exhibition')
                .appendChild(table.parse());

            this.all_ex.addDD(table);

            node.events.step.emit('canvas_tooltip');
        });

        node.on.data('PLAYER_RESULT', function(msg) {
            var str;
            if (!msg.data) return;
            // Create string.
            str = '';
            if (msg.data.published) {
                str += 'Congratulations! You published in exhibition: ';
                str += '<strong>' + msg.data.ex + '</strong>. ';
                str += 'You earned <strong>' + msg.data.payoff;
                str += ' points</strong>. ';
                node.game.money.update(parseFloat(msg.data.payoff));
            }
            else {
                str += 'Sorry, you got rejected by exhibition: ' +
                    '<strong>' + msg.data.ex + '</strong>. ';
            }
            str += 'Your average review score was: <strong>' +
                msg.data.mean + '</strong>.</br></br>';
            // Assign string.
            W.getElementById('results').innerHTML = str;
        });

        function makeExColumn(ex, data) {
            var winners;
            if (!data.length) {
                table.addColumn([' - ']);
                return;
            }
            winners = data.sort(function(a, b) {
                if (a.mean > b.mean) return -1;
                if (b.mean > a.mean) return 1;
                return 0;
            });

            table.addColumn(winners);
            // Add to submission table.
            node.game.winners[ex] = winners.concat(node.game.winners[ex]);
        }

    });

    console.log('Dissemination');
}
