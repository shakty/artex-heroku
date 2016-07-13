/**
 * Standard Waiting Room settings.
 */
module.exports = {

    // How many clients must connect before groups are formed.
    POOL_SIZE: 9,

    // The size of each group.
    GROUP_SIZE: 9,

    // Maximum waiting time.
    MAX_WAIT_TIME: 60000,

    // Treatment assigned to groups.
    // If left undefined, a random treatment will be selected.
    // Use "treatment_rotate" for rotating the treatmenrs.
    CHOSEN_TREATMENT: 'rank_skew', // 'rank_same',
    
    EXECUTION_MODE: 'WAIT_FOR_N_PLAYERS',

};
