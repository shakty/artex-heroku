// Script loaded by creation.html.
$(document).ready(function() {
    var node, W, q, names, i, len, tmpElement, tables, j, lenJ;
    var options, choices, subqs;
    var tableName, dt, id;
    node = parent.node;
    J = parent.JSUS;
    W = parent.W;
    q = node.game.questionnaire;
    // Names are not shuffled, but they are randomly displayed.
    names = node.game.qNamesExtra;
    choices = node.JSUS.seq(0,10);
    i = -1, len = names.length-1; // Not last one (freecomment).
    for ( ; ++i < len ; ) {
        name = names[i];
        // Meta object with all subquestions.
        q[name] = {};
        tmpElement = document.getElementById(name + '_dl');
        // Shuffle sub-questions within each category.
        subqs = J.shuffle(node.game.qNamesExtraSubs[name]);
        j = -1, lenJ = subqs.length;
        for ( ; ++j < lenJ ; ) {
            id = subqs[j].id;
            tableId = name + '_' + id;
            // Create a new dt element where to append the table.
            dt = document.createElement('dt');
            dt.id = tableId + '_dt';
            tmpElement.appendChild(dt);

            options = {
                id: tableId,
                mainText: subqs[j].mainText,
                title: false,
                choices: choices,
                group: name,
                groupOrder: j,
                timeFrom: 'question_loaded'
            };
            q[name][id] = node.widgets.append('ChoiceTable', dt, options);
        }
    }
});