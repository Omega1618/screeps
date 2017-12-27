// TODO totally not done, also not yet a role in the role_enum

var constants = require('creep.constants');

var memory_init = function(room, creep_body) {
    return {target_room_name:null, err_code: OK, role: constants.role_enum.PARTY_SCOUT, path_cache: null, previous_tick_room_name: room.name};
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