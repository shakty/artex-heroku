// Script loaded by creation.html.
$(document).ready(function() {

    var node = parent.node;
    var J = node.JSUS;
    var W = node.window;
    var GameStage = node.GameStage;

    var creationDiv;
    var cf_options, init_cf;
    var init_sc, cfc;
    var historyDiv
    var stepId;

    function addJQuerySliders(init) {
        $('#cf_controls div.ui-slider').each(function() {
            // Read initial values from markup and remove that.
            var settings = init[this.id];
            if (settings) {
                settings.slide = settings.change = function(e, ui) {
                    var f;
                    f = {};
                    f[this.id] = ui.value;
                    node.emit('CF_CHANGE', f);
                };
                $(this).slider(settings);
            }
        });
    };

    // Initialize Chernoff Face
    ////////////////////////////

    // If we play the first round we start with a random face,
    // otherwise with the last one created
    if (!node.game.last_cf) {
        init_cf = new node.widgets.widgets.ChernoffFaces.FaceVector();
        // Some features are fixed in the simplified version
        init_cf = CFControls.pinDownFeatures(init_cf);
    }
    else {
        init_cf = node.game.last_cf;
    }

    // Important: set the player color.
    init_cf.color = 'black';
    init_sc = CFControls.normalizeFeatures(init_cf);

    if (!node.game.last_cf) {        
        // Store the initial random face.
        node.set({
            cf0: init_cf
        });
    }

    cfc = new CFControls({
        id: 'cf_controls',
        features: init_sc
    });

    creationDiv = document.getElementById('creation');

    cf_options = {
        id: 'cf_creation',
        width: 500,
        height: 500,
        features: init_cf,
        controls: cfc,
        title: false,
        trackChanges: true
    };
    node.game.cf = node.widgets.append('ChernoffFaces',
                                       creationDiv,
                                       cf_options);

    // Adding the jQuery sliders
    ////////////////////////////
    addJQuerySliders(init_sc);


    // Stop here if it is not creation.
    stepId = node.game.getCurrentStepObj().id;
    if (stepId !== 'creation') {
        return;
    }
   
    // History of previous exhibits
    ///////////////////////////////
    
    historyDiv = document.getElementById('history');

    if (node.game.all_ex.size() > 0) {
        node.game.all_ex.parse();
        historyDiv.appendChild(node.game.all_ex.getRoot());

        // TODO: do we need as an emit?
        // Can we do it inside the jQuery dialog?
        node.on('COPIED', function(f) {
            node.game.cf.draw(f);
            addJQuerySliders(CFControls.normalizeFeatures(f));
        });
    }
    else {
        historyDiv.innerHTML = '<em>No past exhibitions yet.</em>';
    }

    // Activate canvas tooltip.
    node.events.step.emit('canvas_tooltip');
   
});