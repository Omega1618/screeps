// TODO totally not done, also not yet a role in the role_enum
// TODO this could probably just wrap around the transport role

var constants = require('creep.constants');
var stats_module = require('empire.stats');

var memory_init = function(room, creep_body) {
    return {target_room_name:null, err_code: OK, finished: true, role: constants.role_enum.PARTY_SCOUT};
};

var startup_creep = function(creep_memory) {
};

var shutdown_creep = function(creep_memory) {
};

/** @param {Creep} creep **/
var run = function(creep) {
    var target_room_name = creep.memory.target_room_name;
    if(!target_room_name) {
        creep.memory.err_code = OK;
        return;
    }
    
    if (!creep.memory.finished) {
        creep.memory.err_code = creep.travelToRoom(target_room_name);
        if (creep.memory.err_code == TRAVELTO_FINISHED) creep.memory.finished = true; 
    }
    
    var last_tick = stats_module.get_room_stat(creep.room.name, stats_module.room_stat_names.LAST_UPDATE_TICK);
    if(undefined === last_tick || Game.time - last_tick > CREEP_LIFE_TIME) {
        stats_module.populate_room_stats(creep.room.name);
    }
};

var suggested_body = function(energy) {
    return [MOVE];
};

var set_new_target = function(creep, room_name) {
    creep.memory.target_room_name = room_name;
    creep.memory.finished = false;
}

var is_finished = function(creep) {
    return creep.memory.finished;
}

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body, set_new_target: set_new_target, is_finished: is_finished
};