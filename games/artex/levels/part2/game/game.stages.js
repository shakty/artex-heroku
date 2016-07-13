/**
 * # Stages of the Art Exhibition Game
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = function(stager, settings) {

    // Interactive part.


    stager
        .repeat('artex', settings.REPEAT)
        .next('final')
        .gameover();
       
    // Extending steps.

    stager.extendStage('artex', {
        steps: [
            'creation',
            'submission',
            'evaluation',
            'dissemination'
        ]
    });

    stager.extendStage('final', {
        steps: [
            'questionnaire',
            'morequestions',
            'endgame'
        ]
    });

//     stager.skip('artex');
//     stager.skip('artex', 'creation');
//     stager.skip('artex', 'evaluation');
//     stager.skip('artex', 'dissemination');
    
    // stager.skip('final', 'questionnaire')
    // stager.skip('final', 'morequestions')

};
