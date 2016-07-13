
function svo() {
    
    var that = this;

    var root, b, options, other;



    W.loadFrame('bidder.html', function() {
        // Start the timer after an offer was received.
        options = {
            milliseconds: 30000,
            timeup: function() {
                node.emit('BID_DONE', 4, 4, other, true);
            }
        };

        node.game.timer.startTiming(options);


        b = W.getElementById('submitOffer');


        
        var highlightClass1;
        var highlightClass2;
        
        
        for (var i = 0; i < 9; i++) {
            var hoverClassesNames = 'firstHoverclass' + i;
            var hoverClasses = W.getElementsByClassName(hoverClassesNames);
            for (var j = 0; j < hoverClasses.length; j++) {
                hoverClasses[j].onmouseover = function() {
                    var thisClassName = this.className;                       
                    var thisClass = W.getElementsByClassName(thisClassName);
                    var thisNumber = thisClassName.slice(-1);
                    var thisRadioId = 'firstPos' + thisNumber;
                    var thisRadioButton = W.getElementById(thisRadioId);
                    if (thisRadioButton.checked == false) {
                        for (var k = 0; k < thisClass.length; k++) {
                            thisClass[k].style.backgroundColor = '#ddd';
                        }                     
                        thisClass[1].style.borderTop = '1px solid #ddd';
                        thisClass[1].style.borderBottom = '1px solid #ddd';
                    }
                    
                }
                
                
                
                
                
                hoverClasses[j].onmouseout = function() {
                    var thisClassName = this.className;
                    var thisClass = W.getElementsByClassName(thisClassName);
                    var thisNumber = thisClassName.slice(-1);
                    var thisRadioId = 'firstPos' + thisNumber;
                    var thisRadioButton = W.getElementById(thisRadioId);
                    if (thisRadioButton.checked == false) {
                        this.style.backgroundColor = '#fff';
                        for (var k = 0; k < thisClass.length; k++) {
                            thisClass[k].style.backgroundColor = '#fff';
                        }
                        thisClass[1].style.borderTop = '1px solid #000';
                        thisClass[1].style.borderBottom = '1px solid #000';
                    }
                }
                
                
                
                
                hoverClasses[j].onclick = function() {
                    var thisClass = this.className;
                    var thisNumber = thisClass.slice(-1);
                    if(highlightClass1) {
                        for (var k = 0; k < highlightClass1.length; k++) {
                            highlightClass1[k].style.backgroundColor = '#fff';
                        }
                        highlightClass1[1].style.borderTop = '1px solid #000';
                        highlightClass1[1].style.borderBottom = '1px solid #000';     
                    }
                    var thisRadioId = 'firstPos' + thisNumber;
                    var thisRadioButton = W.getElementById(thisRadioId);
                    thisRadioButton.checked = true;
                    var thisClassElement = W.getElementsByClassName(thisClass);
                    highlightClass1 = thisClassElement;
                    for (var k = 0; k < thisClassElement.length; k++) {
                        thisClassElement[k].style.backgroundColor = '#ddb';
                    }
                    thisClassElement[1].style.borderTop = '1px solid #ddb';
                    thisClassElement[1].style.borderBottom = '1px solid #ddb';
                    
                }
            }
        }
        
        
        
        for (var i = 0; i < 9; i++) {
            var hoverClassesNames2 = 'secondHoverclass' + i;
            var hoverClasses2 = W.getElementsByClassName(hoverClassesNames2);
            for (var j = 0; j < hoverClasses2.length; j++) {
                hoverClasses2[j].onmouseover = function() {
                    var thisClassName = this.className;
                    var thisClass = W.getElementsByClassName(thisClassName);
                    var thisNumber = thisClassName.slice(-1);
                    var thisRadioId = 'secondPos' + thisNumber;
                    var thisRadioButton = W.getElementById(thisRadioId);
                    if (thisRadioButton.checked == false) {
                        for (var k = 0; k < thisClass.length; k++) {
                            thisClass[k].style.backgroundColor = '#ddd';
                        }
                        thisClass[1].style.borderTop = '1px solid #ddd';
                        thisClass[1].style.borderBottom = '1px solid #ddd';
                    }
                    
                }
                hoverClasses2[j].onmouseout = function() {
                    var thisClassName = this.className;
                    var thisClass = W.getElementsByClassName(thisClassName);
                    var thisNumber = thisClassName.slice(-1);
                    var thisRadioId = 'secondPos' + thisNumber;
                    var thisRadioButton = W.getElementById(thisRadioId);
                    if (thisRadioButton.checked == false) {
                        this.style.backgroundColor = '#fff';
                        for (var k = 0; k < thisClass.length; k++) {
                            thisClass[k].style.backgroundColor = '#fff';
                        }
                        thisClass[1].style.borderTop = '1px solid #000';
                        thisClass[1].style.borderBottom = '1px solid #000';
                    }
                }

                
                
                hoverClasses2[j].onclick = function() {
                    var thisClass = this.className;
                    var thisNumber = thisClass.slice(-1);
                    if(highlightClass2) {
                        for (var k = 0; k < highlightClass2.length; k++) {
                            highlightClass2[k].style.backgroundColor = '#fff';
                        }
                        highlightClass2[1].style.borderTop = '1px solid #000';
                        highlightClass2[1].style.borderBottom = '1px solid #000';     
                    }
                    var thisRadioId = 'secondPos' + thisNumber;
                    var thisRadioButton = W.getElementById(thisRadioId);
                    thisRadioButton.checked = true;
                    var thisClassElement = W.getElementsByClassName(thisClass);
                    highlightClass2 = thisClassElement;
                    for (var k = 0; k < thisClassElement.length; k++) {
                        thisClassElement[k].style.backgroundColor = '#ddb';
                    }               
                    thisClassElement[1].style.borderTop = '1px solid #ddb';
                    thisClassElement[1].style.borderBottom = '1px solid #ddb';
                }
            }
        }
        
        
        b.onclick = function() {
            
            for (var i = 0; i < 9; i++) {
                
                var posname = 'firstPos' + i;
                var position = W.getElementById(posname);
                if (position.checked) {
                    var offer1 = position.value;
                    break;
                }
            }
            

            for (var i = 0; i < 9; i++) {
                
                var posname2 = 'secondPos' + i;
                var position2 = W.getElementById(posname2);
                if (position2.checked) {
                    var offer2 = position2.value;
                    break;
                }
            }
            
            var badAlert = W.getElementById('badAlert');
            var goodAlert = W.getElementById('goodAlert');
            
            if (!offer1 || !offer2) {
                badAlert.style.display = '';
                //alert('Please make a choice for both allocations!');
            } else {
                badAlert.style.display = 'none';
                goodAlert.style.display = '';
                node.emit('BID_DONE', offer1, offer2, other);
            }
        };

        root = W.getElementById('container');

        node.timer.setTimestamp('bidder_loaded');

    }, { cache: { loadMode: 'cache', storeMode: 'onLoad' } });


    console.log('Ultimatum');
}
