// TODO totally not done, also not yet a role in the role_enum
// TODO this could probably just wrap around the transport role

var constants = require('creep.constants');

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
    if(target_room_name != creep.room.name) {
        creep.memory.err_code = creep.travelTo(new RoomPos(25, 25, target_room_name));
    } else {
        if (!creep.memory.finished) {
            creep.memory.finished = true;
            creep.memory.err_code = creep.travelTo(new RoomPos(25, 25, target_room_name));
        }
        creep.memory.err_code = OK;
    }
};

var suggested_body = function(energy) {
    return [MOVE];
};

var set_new_target = function(creep_id, room_name) {
    if(creep_id) {
        var creep = Game.getObjectById(creep_id);
        if(creep) {
            creep.memory.target_room_name = room_name;
            creep.memory.finished = false;
        }
    }
}

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body, set_new_target: set_new_target
};