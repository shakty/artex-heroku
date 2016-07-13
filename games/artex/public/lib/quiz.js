// Script loaded by creation.html.
$(document).ready(function() {

    var node =  parent.node,
    J = parent.JSUS,
    W = parent.W;


    node.window.noEscape(window);

    var results, answers;
    var wrongTxt, correctTxt;

    results = { correct: false };

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

    node.env('auto', function() {     
        node.timer.randomExec(function() {
            results.correct = true;
            node.done(results);   
        });
    });

    function checkAnswer(a) {
        var checked;
        if (!a || !answers) return;

        checked = getCheckedValue(a);
        return checked != answers[a.name];
    }

    function checkAnswers(submitButton) {
        var correct, counter = 0;
        J.each(document.forms, function(a) {
            if (!results[a.name]) results[a.name] = [];
            correct = checkAnswer(a);

            if (correct) {
                W.highlight(a, 'ERR');
                document.getElementById(a.id + '_result').innerHTML = wrongTxt;
                results[a.name].push(0);
            }
            else {
                W.highlight(a, 'OK');
                document.getElementById(a.id + '_result').innerHTML = correctTxt;
                results[a.name].push(1);
                counter++;
            }
        });

        document.getElementById('answers_counter').innerHTML = counter + ' / ' + document.forms.length;

        if (counter === document.forms.length) {
            submitButton.disabled = true;
            results.correct = true;
        }
        return results;
    }

    function getCheckedValue(radioObj) {
        if (!radioObj) return;

        if (radioObj.length) {
            for (var i = 0; i < radioObj.length; i++) {
                if (radioObj[i].checked) {
                    return radioObj[i].value;
                }
            }
        }

        return radioObj.checked;
    }

    // set the radio button with the given value as being checked
    // do nothing if there are no radio buttons
    // if the given value does not exist, all the radio buttons
    // are reset to unchecked
    function setCheckedValue(radioObj, newValue) {
        if (!radioObj)
            return;
        var radioLength = radioObj.length;
        if (radioLength == undefined) {
            radioObj.checked = (radioObj.value == newValue.toString());
            return;
        }
        for (var i = 0; i < radioLength; i++) {
            radioObj[i].checked = false;
            if (radioObj[i].value == newValue.toString()) {
                radioObj[i].checked = true;
            }
        }
    }

    window.QUIZ = {
        setCheckedValue: setCheckedValue,
        getCheckedValue: getCheckedValue,
        checkAnswers: checkAnswers
    };



    //     function checkAnswer(a) {
    //         var checked;
    //         if (!a || !answers) return;        
    //         checked = getCheckedValue(a);  
    //         return checked != answers[a.name];
    //     }
    // 
    //     function checkAnswers() {
    //         var reviewRange = document.getElementById('reviewRange');
    //         var reviewSelect = document.getElementById('reviewSelect');
    //         var coocom = document.getElementById('coocom');
    //         
    //         var correct, counter = 0;
    //         J.each(document.forms, function(a){
    //             if (!results[a.name]) results[a.name] = [];
    //             correct = checkAnswer(a);
    //             
    //             if (correct) {
    //                 W.highlight(a, 'ERR');
    //                 document.getElementById(a.id + '_result').innerHTML = wrongTxt;
    //                 results[a.name].push(0);	 
    //             }
    //             else {  
    //                 W.highlight(a, 'OK');
    //                 document.getElementById(a.id + '_result').innerHTML = correctTxt;
    //                 results[a.name].push(1);
    //                 counter++;
    //             }
    //         });
    //         
    //         document.getElementById('answers_counter').innerHTML = counter + ' / ' + document.forms.length;
    //         
    //         if (counter === document.forms.length) {
    //             submitButton.disabled = true;
    //             results.correct = true;
    //             node.set('QUIZ', results);
    //             node.timer.randomEmit('DONE', 2000);
    //         }
    //         
    //     }
    // 
    // 
    //     function getCheckedValue(radioObj) {
    //         if (!radioObj) return;
    //         
    //         if (radioObj.length) {
    //             for (var i = 0; i < radioObj.length; i++) {
    // 	        if (radioObj[i].checked) {
    // 		    return radioObj[i].value;
    // 	        }
    // 	    }
    //         }
    //         
    //         return radioObj.checked;
    //     }
    // 
    //     // set the radio button with the given value as being checked
    //     // do nothing if there are no radio buttons
    //     // if the given value does not exist, all the radio buttons
    //     // are reset to unchecked
    //     function setCheckedValue(radioObj, newValue) {
    //         if (!radioObj)
    // 	    return;
    //         var radioLength = radioObj.length;
    //         if(radioLength == undefined) {
    // 	    radioObj.checked = (radioObj.value == newValue.toString());
    // 	    return;
    //         }
    //         for(var i = 0; i < radioLength; i++) {
    // 	    radioObj[i].checked = false;
    // 	    if(radioObj[i].value == newValue.toString()) {
    // 	        radioObj[i].checked = true;
    // 	    }
    //         }
    //     }

});