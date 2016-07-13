/**
 * # Functions used player clients in the Art Exhibition Game
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = {
    init: init,
    instructions: instructions,
    quiz: quiz,
    creation: creation,
    evaluation: evaluation,
    dissemination: dissemination,
    questionnaire: questionnaire,
    endgame: endgame
};

function init() {
    var that, header;

    that = this;
    this.node.log('Init.');

    // Setup the header (by default on the left side).
    if (!W.getHeader()) {
        header = W.generateHeader();

        // W.setHeaderPosition('top');

        // Uncomment to visualize the name of the stages.
        //node.game.visualStage = node.widgets.append('VisualStage', header);

        node.game.rounds = node.widgets.append('VisualRound', header, {
            displayModeNames: ['COUNT_UP_STAGES_TO_TOTAL'],
            totStageOffset: 1
        });

        node.game.timer = node.widgets.append('VisualTimer', header);

        node.game.money = node.widgets.append('MoneyTalks', header, {
            currency: 'CHF', money: 10
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

    // Current rounds of evalutions (review delivered by subject).
    this.evas = {};
    // Marks if the review slider was moved at all.
    this.evasChanged = {};

    // List of all past exhibitions.
    this.all_ex = new W.List({
        id: 'all_ex',
        lifo: true
    });

    // Renders a chernoff face (plus metadata) inside a table's cell.
    this.renderCF = function(cell) {
        var w, h;
        var cf, cfOptions;
        var container, cfDetailsTable;
        
        // Check if it is really CF obj (can be another cell, e.g. header).
        if (!cell.content || !cell.content.cf) return;

        // Adjust dimensions depending on the step.
        if (node.game.getCurrentStepObj().id === 'creation') {
            w = 100;
            h = 100;
        }
        else {
            w = 200;
            h = 200;
        }

        cfOptions = {
            width: w,
            height: h,
            features: cell.content.cf,
            id: false,
            controls: false,
            onChange: false,
            title: false,
            onclick: function() {
                var f, cf, cfOptions;
                var div, buttons;

                f = this.getAllValues();

                cfOptions = {
                    id: false,
                    width: 400,
                    height: 400,
                    features: f,
                    controls: false,
                    onChange: false,
                    title: false
                };

                cf = node.widgets.get('ChernoffFaces', cfOptions);

                div = $('<div class="copyorclose">');
                $(cf.canvas).css('background', 'white');
                $(cf.canvas).css('border', '3px solid #CCC');
                $(cf.canvas).css('padding', '5px');

                div.append(cf.getCanvas());

                // If we are not in dissemination we can copy the image.
                if (node.game.getCurrentStepObj().id !== 'dissemination') {
                    buttons = new Array(2);
                    buttons[0] = {
                        text: 'copy',
                        click: function() {
                            // Triggers the update of the image and sliders.
                            node.emit('COPIED', f);
                            // Keep track of copying.
                            node.game.copies.push({
                                time: node.timer.getTimeSince('step'),
                                author: cell.content.author,
                                ex: cell.content.ex,
                                mean: cell.content.mean,
                                round: cell.content.round
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
                    width: 460,
                    height: 560,
                    show: "blind",
                    hide: "explode",
                    buttons: buttons
                });
            }
        };

        // Creating HTML.
        container = document.createElement('div');

        // Just canvas.
        // cf = node.widgets.get('ChernoffFaces', cfOptions);
        // container.appendChild(cf.getCanvas());

        // Whole widget.
        cf = node.widgets.append('ChernoffFaces',
                                 container,
                                 cfOptions);

        cfDetailsTable = new W.Table();
        cfDetailsTable.addColumn([
            'Author: ' + cell.content.author,
            'Score: ' + cell.content.mean
        ]);
        container.appendChild(cfDetailsTable.parse());

        return container;
    };
}

function instructions() {

    W.loadFrame(node.game.settings.instrPage, function() {

        // TODO: html pages have own button and js handler.
        var b = W.getElementById('read');
        b.onclick = function() {
            node.done();
        };

        node.env('auto', function() {
            node.timer.randomExec(function() {
                node.done();
            }, 2000);
        });
    });
    console.log('Instructions');
}

function quiz() {
    W.loadFrame('quiz.html', function() {
        var button, QUIZ;

        QUIZ = W.getFrameWindow().QUIZ;
        button = W.getElementById('submitQuiz');

        node.on('check-quiz', function() {
            var answers;
            answers = QUIZ.checkAnswers(button);
            if (answers.correct || node.game.timer.isTimeup()) {
                node.emit('INPUT_DISABLE');
                // On Timeup there are no answers.
                node.done(answers);
            }
        });


        node.env('auto', function() {
            node.timer.randomExec(function() {
                node.game.timer.doTimeUp();
            });
        });
    });
    console.log('Quiz');
}

function creation() {
    W.loadFrame('creation.html', function() {
        node.on('CLICKED_DONE', function() {
            $( ".copyorclose" ).dialog('close');
            $( ".copyorclose" ).dialog('destroy');
        });
    });
    console.log('Creation');
}

function evaluation() {
    W.loadFrame('evaluation.html');
    console.log('Evaluation');
}

function dissemination() {

    var dt_header = 'Round: ' + node.player.stage.round;

    this.all_ex.addDT(dt_header);

    var table = new W.Table({
        className: 'exhibition',
        render: {
            pipeline: this.renderCF,
            returnAt: 'first'
        }
    });

    table.setHeader(this.exhibitNames);

    W.loadFrame('dissemination.html', function() {

        node.game.timer.stop();

        node.on.data('WIN_CF', function(msg) {
            var str, db;
            var j, winners;

            console.log('WWWWWWWWWIN_CF');
            if (msg.data.length) {
                db = new node.NDDB(null, msg.data);

                for (j = 0; j < this.nExhibits; j++) {
                    winners = db.select('ex', '=', this.exhibitNames[j])
                        .sort('mean')
                        .reverse()
                        .fetch();


                    if (winners.length > 0) {
                        table.addColumn(winners);
                    }
                    else {
                        table.addColumn([' - ']);
                    }
                }

                // $('#mainframe').contents()
                //   .find('#done_box').before(table.parse());

                W.getElementById('container_exhibition')
                    .appendChild(table.parse());

                this.all_ex.addDD(table);

            }

            else {
                str = 'No painting was considered good enough ' +
                    'to be put on display.';
                W.write(str, W.getElementById("container_exhibition"));
                this.all_ex.addDD(str);
            }

            node.game.timer.restart({
                milliseconds: 15000,
                timeup: 'DONE'
            });
        });

        node.on.data('PLAYER_RESULT', function(msg) {
            if (!msg.data) return;
            var str = '';
            // Create string.
            if (msg.data.published) {
                str += 'Congratulations! You published in exhibition: ';
                str += '<strong>' + msg.data.ex + '</strong>. ';
                str += 'You earned <strong>' + msg.data.payoff;
                str += ' CHF</strong>. ';
                node.emit('MONEYTALKS', parseFloat(msg.data.payoff));
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

        // Auto play.
        node.env('auto', function() {
            node.timer.randomExec(function() {
                node.done();
            }, 5000);
        });
    });

    console.log('Dissemination');
}

function questionnaire() {
    W.loadFrame(node.game.settings.questPage);
    console.log('Postgame');

    // Auto play.
    node.env('auto', function() {
        node.timer.randomExec(function() {
            node.done();
        }, 5000);
    });

}

function endgame() {
    W.loadFrame('ended.html');
    console.log('Game ended');
}

