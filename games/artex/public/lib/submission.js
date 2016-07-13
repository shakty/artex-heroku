// Script loaded by creation.html.
$(document).ready(function() {
    var node = parent.node;
    var J = parent.JSUS;
    var ids;
    node.game.subOrder = J.shuffleElements(document.getElementById("tr-decision"));
    ids = [node.game.subOrder[0] + '-past-images',
           node.game.subOrder[1] + '-past-images',
           node.game.subOrder[2] + '-past-images'
          ];
    J.shuffleElements(document.getElementById("tr-past-images"), ids);
    
    document.getElementById('reward-A').innerHTML = node.game.settings.exA.reward;
    document.getElementById('reward-B').innerHTML = node.game.settings.exB.reward;
    document.getElementById('reward-C').innerHTML = node.game.settings.exC.reward;

    document.getElementById('available-A').innerHTML = node.game.settings.exA.N;
    document.getElementById('available-B').innerHTML = node.game.settings.exB.N;
    document.getElementById('available-C').innerHTML = node.game.settings.exC.N;
});