/**
 * # Stages of the Art Exhibition Game
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 */

module.exports = function(stager, settings) {


    stager
        .next('consent')
        .next('intro')

    // Individual part.

        .next('mood')
        .next('svo')
        .next('demographics')
        .next('instructions')
        .next('quiz')
        .next('training_intro')
        .repeat('training', settings.REPEAT_TRAINING)
        .next('belief')   
        .next('finished_part1');


    stager.extendStage('instructions', {
        steps: [
            'instr_text',
            'instr_images',
        ]
    });

//     stager.skip('consent');
//     stager.skip('intro');
//     stager.skip('mood');
//     stager.skip('svo');
//     stager.skip('demographics');
//     stager.skip('instructions');
//     stager.skip('quiz');
//     stager.skip('training');
//     stager.skip('belief');

};
