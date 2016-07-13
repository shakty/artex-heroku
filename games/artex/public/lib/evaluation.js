// Script loaded by creation.html.
$(document).ready(function() {

    var node = parent.node,
    JSUS = parent.JSUS,
    W = parent.W,
    Table = W.Table;

    var table;

    // Avoid ESC to break the connection
    W.noEscape(window);

    table = new Table({ id: 'tbl_evaluation' });

    document.getElementById('container_evaluation').appendChild(table.table);

    node.on.data('CF', function(msg) {

        console.log('RECEIVED CF ********************');

        if (!msg.data) {
            node.err('Error: No data received on CF.');
            return;
        }
        // debugger
        if (msg.data.A && msg.data.A.length) makeReviewUI(msg.data.A);
        if (msg.data.B && msg.data.B.length) makeReviewUI(msg.data.B);
        if (msg.data.C && msg.data.C.length) makeReviewUI(msg.data.C);
    });

    node.env('auto', function(){
        node.timer.randomExec(function() {
            node.done();
        }, 10000);
    });

    function makeReviewUI(exData) {
        var cf, display, display_container, sl, head;
        var ex, author, evaId, displayEvaId, displayContId;
        var jQuerySlider, labelText;
        var cf_options;
        var i, len;
        cf_options = {
            width: 300,
            height: 300,
            scaleX: 1,
            scaleY: 1,
            id: false,
            change: false,
            controls: false
        };
        i = -1, len = exData.length;
        for ( ; ++i < len ; ) {

            data = exData[i]
            // Create Chernoff face.
            cf_options.features = data.face;
            cf = node.widgets.get('ChernoffFaces', cf_options);

            // Create Evaluation interface.
            author = data.author;
            // Create object that will store all info about this review.
            node.game.evas[author] = {};

            evaId = 'eva_' + author;
            diplayEvaId = 'display_' + author;
            displayContId = 'display_cont_' + author;

            // Add the slider to the container.
            sl = W.getDiv(evaId);
            display_container = W.getDiv(displayContId);
            display = W.addTextInput(display_container, diplayEvaId, {
                disabled: "disabled",
                className: 'curr-eva-input'
            });

            labelText = 'Your current evaluation: ';
            W.addLabel(display_container, display, null, labelText);

            node.game.evas[author].display = display;

            // Exhibition.
            ex = data.ex;
            node.game.evas[author].ex = ex;

            // Table (need to be parsed, otherwise jQuery slider fails.
            head = document.createElement('span');
            head.innerHTML = 'Review for Exhibition: ' + ex;
            head.className = 'ex-header';
            table.addColumn([head, sl, display_container, cf.getCanvas()]);
            table.parse();

            // Add jquery slider.
            jQuerySlider = $("#" + evaId);
            jQuerySlider.slider({
                value: 5,
                min: 0,
                max: 10,
                step: 0.1,
                slide: function(event, ui) {
                    var author = this.id.substr(4);
                    var slid = 'display_' + author;
                    $("#" + slid).val(ui.value);
                    node.game.evas[author].changed = true;
                }
            });
            $("#" + diplayEvaId).val($("#" + evaId).slider("value"));


            // AUTOPLAY.
            node.env('auto', function() {
                node.timer.randomExec(function() {
                    $("#" + evaId).slider("value", Math.random() * 10);
                    $("#" + diplayEvaId).val($("#" + evaId)
                                             .slider("value"));
                }, 4000);
            });
        }
    }
});