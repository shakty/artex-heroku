// Script loaded by creation.html.
$(document).ready(function() {
    var node, W, q, names, i, len, tmpElement, options;
    node = parent.node;
    W = parent.W;
    q = node.game.questionnaire;
    names = node.game.qNames;
    i = -1, len = names.length;
    for ( ; ++i < len ; ) {
        name = names[i];
        options = {
            id: name,
            title: false,
            freeText: 'Feel free to report additional relevant information'
        };

        if (name === 'enjoy' || name === 'competitive') {
            options.choices = node.JSUS.seq(0,10);
        }
        else {
            options.choices = [ 'A', 'B', 'C', [ 'Other', "Don't know" ] ];
            options.shuffleChoices = true;
        }

        q[name] = node.widgets.append('ChoiceTable',
                                      W.getElementById(name + '_dd'),
                                      options);
    }
});