var constants = require('creep.constants');

var memory_init = function(room, creep_body) {
    return {role: constants.role_enum.PARTY_ABSTRACT};
};

var startup_creep = function(creep_memory) {
};

var shutdown_creep = function(creep_memory) {
};

/** @param {Creep} creep **/
var run = function(creep) {
};

// Not implemented
var suggested_body = function(energy) {
    return null;
};

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body
};