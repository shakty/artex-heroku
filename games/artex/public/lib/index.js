window.onload = function () {
    // Configuring nodegame.
    // All these properties can get overwritten by remoteSetup from server.
    node.setup('nodegame', {
        verbosity: 10,
        window: {
            promptOnleave: false,
            noEscape: true // Defaults TRUE
        },
        env: {
            auto: false,
            debug: false
        },
        events: {
            dumpEvents: false, // output to console all fired events
            history: false // keep a record of all fired events
        },
        socket: {
            type: 'SocketIo', // for remote connections
            reconnect: false
        }
    });
    // Connect to channel.
    node.connect();
};