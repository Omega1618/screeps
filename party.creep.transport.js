// TODO totally not done, also not yet a role in the role_enum

// Try to make this generic and provide helper functions that make the transporter useful in a variety of cases.

var constants = require('creep.constants');

var memory_init = function(room, creep_body) {
    return {party_id: null, source_id: null, role: constants.role_enum.PARTY_LONG_DISTANCE_MINE_MINER};
};

var startup_creep = function(creep_memory) {
};

var shutdown_creep = function(creep_memory) {
};

/** @param {Creep} creep **/
var run = function(creep) {
    if(target_room_name && target_room_name != creep.room.name) {
        err_code = creep.moveByPath(exit);
    } else {
        err_code = OK;
    }
};

var suggested_body = function(energy) {
    return [MOVE];
};

var set_new_target = function(room_name) {
    const exitDir = creep.room.findExitTo(room_name);
    const exit = creep.pos.findClosestByRange(exitDir);
}

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body, set_new_target: set_new_target
};