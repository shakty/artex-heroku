/**
 * # Channels definition file for Art Exhibition Game
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * Configurations options for channel.
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = {

    // alias: 'game',

    // playerServer: 'artex',

    // adminServer: 'artex/admin',

    verbosity: 100,

    // If TRUE, players can invoke GET commands on admins.
    getFromAdmins: true,

    // Unauthorized clients will be redirected here.
    // (defaults: "/pages/accessdenied.htm")
    accessDeniedUrl: '/artex/unauth.htm',

    enableReconnections: true,
    
    rooms: [
        {
            name: 'singlePlayer',
            type: 'Game',
            logicPath: './'
        }
    ]
            
};

