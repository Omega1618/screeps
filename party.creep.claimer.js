var constants = require('creep.constants');

var memory_init = function(room, creep_body) {
    return {target_room_name:null, should_claim: true, err_code: OK, finished: true, role: constants.role_enum.PARTY_CLAIMER};
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
        var current_room = creep.room;
        if (current_room.name == target_room_name) {
            if (creep.memory.should_claim) {
                creep.memory.err_code = creep.claimController(current_room.controller);
            } else {
                creep.memory.err_code = creep.reserveController(current_room.controller);
            }
            if (creep.memory.err_code == ERR_NOT_IN_RANGE) creep.travelTo(current_room.controller);
            if (creep.memory.err_code == OK && creep.memory.should_claim) creep.memory.finished = true; 
        } else {
            creep.memory.err_code = creep.travelToRoom(target_room_name);
        }
    }
};

var suggested_body = function(energy) {
    return [MOVE, CLAIM];
};

// if claim is true will try to claim room_name, otherwise will try to reserve room_name
var set_new_target = function(creep, room_name, claim=true) {
    creep.memory.target_room_name = room_name;
    creep.memory.should_claim = claim;
    creep.memory.finished = false;
};

var is_finished = function(creep) {
    return creep.memory.finished;
};

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body, set_new_target: set_new_target, is_finished: is_finished
};