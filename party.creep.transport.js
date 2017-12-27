// TODO totally not done, also not yet a role in the role_enum

// Try to make this generic and provide helper functions that make the transporter useful in a variety of cases.

var constants = require('creep.constants');
var roleTransport = require('creep.phase2.transport');

var memory_init = function(room, creep_body) {
    return {request: null, move_to_room: null, err_code: OK, finished: true, role: constants.role_enum.PARTY_TRANSPORT};
};

var startup_creep = function(creep_memory) {
};

var shutdown_creep = function(creep_memory) {
};

/** @param {Creep} creep **/
var run = function(creep) {
    var request = creep.memory.request;
    if (request) {
        // TODO
        return;
    }
    var target_room_name = creep.memory.move_to_room;
    if (target_room_name) {
        if(target_room_name != creep.room.name) {
            creep.memory.err_code = creep.travelTo(new RoomPos(25, 25, target_room_name));
        } else {
            if (!creep.memory.finished) {
                creep.memory.finished = true;
                creep.memory.err_code = creep.travelTo(new RoomPos(25, 25, target_room_name));
            }
            creep.memory.err_code = OK;
            creep.memory.move_to_room = null;
        }
    }

};

var suggested_body = function(energy) {
    if (energy < 150) {
        return null;
    }
    var body = [];
    while (energy >= 150) {
        body.push(MOVE);
        body.push(CARRY);
        body.push(CARRY);
        energy -= 150;
    }
    return body;
};

var move_to_room = function(creep_id, room_name) {
    if(creep_id) {
        var creep = Game.getObjectById(creep_id);
        if(creep) {
            if (!creep.memory.finished) {
                return ERR_BUSY;
            }
            creep.memory.target_room_name = room_name;
            return OK;
        }
    }
    return ERR_INVALID_ARGS;
}

var add_request = function(creep_id, request) {
    if(creep_id) {
        var creep = Game.getObjectById(creep_id);
        if(creep) {
            if (!creep.memory.finished) {
                return ERR_BUSY;
            }
            creep.memory.request = request;
            return OK;
        }
    }
    return ERR_INVALID_ARGS;
}

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body, move_to_room: move_to_room
};