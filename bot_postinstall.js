#!/usr/bin/env node

// Uses slinker to symlink the local directories into node_modules, so we can have better relative paths (no more ../../..)
// ./bot_messenger/config > @bot_messenger/config
// ./bot_messenger/routes > @bot_messenger/routes

var slinker = require('slinker'),
    path = require('path');
 
slinker.link({
    modules: ['bot_messenger'],
    modulesBasePath: __dirname,
    symlinkPrefix: '@',
    nodeModulesPath: path.join(__dirname, 'node_modules'),
    onComplete: function() {
        console.log('Yay, my modules are linked!');
    },
    onError: function(error) {
        console.log('Oh no, my modules aren\'t linked!');
    }
});