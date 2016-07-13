// Script loaded by creation.html.
$(document).ready(function() {

    var node =  parent.node,
    J = parent.JSUS,
    W = parent.W;

    var results, answers;
    var wrongTxt, correctTxt;
    var quizzes, opts;
    var i, len;

    wrongTxt = 'Wrong, try again';
    correctTxt = 'Correct!';

    node.env('com', function() {
        node.env('review_select', function() {
            answers = {
                coocom: 3,
                reviewSelect: 2,
                reviewRange: 0
            };
        });
        node.env('review_random', function() {
            answers = {
                coocom: 3,
                reviewSelect: 3,
                reviewRange: 0
            };
        });
    });

    node.env('coo', function() {
        node.env('review_select', function() {
            answers = {
                coocom: 2,
                reviewSelect: 2,
                reviewRange: 0
            };
        });
        node.env('review_random', function() {
            answers = {
                coocom: 2,
                reviewSelect: 3,
                reviewRange: 0
            };
        });
    });

    quizzes = [
        {
            id: 'reviewRange',
            mainText: 'When reviewing a painting, on which scale can you ' +
                'express your liking?',
            choices: [ 'From 0 to 10', 'From 1 to 5', 'From 1 to 9' ],
            correctChoice: 0,
        },
        {
            id: 'reviewSelect',
            mainText: 'How are reviewers assigned to images and exhibitions?',
            choices: [
                'Randomly',
                'If I <em>submit</em> to an exhibition I become ' +
                    'reviewer for that exhibition in the next round',
                'If I <em>display</em> in an exhibition I become ' +
                    'reviewer for that exhibition in the next round'
            ],
            correctChoice: 0,
            orientation: 'V'
        },
        {
            id: 'rewards',
            mainText: 'What is the reward for displaying in an exhibition?',
            choices: [
                'The rewards vary by exhibition: the higher the reward, ' +
                    'the fewer the number of awards per exhibition',
                'All rewards are the same regardless of the exhibition',
                'All exhibitions have the same number of awards, but ' +
                    'of different value',
                'The rewards vary by exhibition, but the number of awards ' +
                    'per exhibition is the same'
            ],
            correctChoice: 0,
            orientation: 'V'
        }
    ];

    // Append quizzes in random order.
    J.shuffle(quizzes);
    i = -1, len = quizzes.length;
    for ( ; ++i < len ; ) {
        groupOrder = (i+1);
        opts = quizzes[i];
        opts.groupOrder = groupOrder;
        opts.title = false;
        opts.shuffleChoices = true;
        opts.group = 'quiz';
        root = document.getElementById('q_' + groupOrder);
        node.game.quizzes.push(node.widgets.append('ChoiceTable', root, opts));
    }

});