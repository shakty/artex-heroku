$(document).ready(function() {

    var node = parent.node;

    // Tooltip for enlarge and copy canvas
    //////////////////////////////////////


    // Creation is step 1 of stage artex.
    var cancopy = node.game.getCurrentGameStage().step === 1;
    var txt, select;

    if (cancopy) {
        select = '#all_ex canvas';
        txt = "<span id='enlarge'>Click to enlarge, " +
            "and decide if you want to copy it.</span>";
    }
    else {
        select = '#container_exhibition canvas';
        txt = "<span id='enlarge'>Click to enlarge.</span>";
    }

    node.events.step.on('canvas_tooltip', function() {

        $(select).hover(
            function(e) {
                var enlarge = $(txt);
                var pos = $(this).position();
                enlarge.addClass('tooltip');
                enlarge.css({
                    "left": (5 + e.pageX) + "px",
                    "top": e.pageY + "px"
                });
                $(this).before(enlarge);
                $(this).mousemove(function(e){
                    $('span#enlarge').css({
                        "left": (5 + e.pageX) + "px",
                        "top": e.pageY + "px"
                    });
                });
            },
            function() {
                $(this).parent().find("span#enlarge").remove();
                $(this).unbind('mousemove');
            }
        );
    });

});