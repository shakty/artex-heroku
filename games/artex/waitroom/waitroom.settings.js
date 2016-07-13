/**
 * Standard Waiting Room settings.
 */
module.exports = {

    // How many clients must connect before groups are formed.
    POOL_SIZE: 1,

    // The size of each group.
    GROUP_SIZE: 1,

    // Maximum waiting time.
    MAX_WAIT_TIME: 600000,

    // Treatment assigned to groups.
    // If left undefined, a random treatment will be selected.
    // Use "treatment_rotate" for rotating the treatmenrs.
    CHOSEN_TREATMENT: 'rank_skew', // 'rank_same',

//     ON_TIMEOUT: function(data) {
//         var timeOut;
// 
//         // Enough Time passed, not enough players connected.
//         if (data.over === 'Time elapsed!!!') {
// 
//             timeOut = "<h3 align='center'>Thank you for your patience.<br>";
//             timeOut += "Unfortunately, there are not enough participants in ";
//             timeOut += "your group to start the experiment.<br>";   
//         }
// 
//         // Too much time passed, but no message from server received.
//         else {
//             timeOut = "An error has occurred. You seem to be ";
//             timeOut += "waiting for too long. Please look for a HIT called ";
//             timeOut += "<strong>ETH Descil Trouble Ticket</strong> and file ";
//             timeOut += "a new trouble ticket reporting your experience."
//         }
// 
//         if (data.exit) {
//             timeOut += "<br>Please report this exit code: " + data.exit;
//         }
// 
//         timeOut += "<br></h3>";
// 
//         this.bodyDiv.innerHTML = timeOut;
//     },

    EXECUTION_MODE: 'WAIT_FOR_N_PLAYERS',

    DISPATCH_TO_SAME_ROOM: true
};
