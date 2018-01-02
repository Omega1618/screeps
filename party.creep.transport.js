// TODO totally not done, also not yet a role in the role_enum

// Try to make this generic and provide helper functions that make the transporter useful in a variety of cases.

var constants = require('creep.constants');
var roleTransport = require('creep.phase2.transport');
var callback_util = require('utilities.call_back');

var memory_init = function(room, creep_body) {
    return {request: null, target_room_name: null, err_code: OK, spawn_pos: null, finished: true, role: constants.role_enum.PARTY_TRANSPORT};
};

var startup_creep = function(creep_memory) {
};

var shutdown_creep = function(creep_memory) {
};

/** @param {Creep} creep **/
var run = function(creep) {
    if (creep.spawning) {
        if (!creep.memory.spawn_pos) {
            creep.memory.spawn_pos = creep.pos;
        }
        return;
    }
    
    var request = creep.memory.request;
    if (request) {
        var result = roleTransport.run_request(creep, request);
        var err_code = result.err_code;
        var target = result.target;
        
        if(err_code == ERR_NOT_IN_RANGE) {
            creep.travelTo(target);
            creep.memory.err_code = err_code;
        } else if (err_code == OK || err_code == ERR_INVALID_TARGET || err_code == ERR_NOT_OWNER || err_code == ERR_NO_BODYPART
                    || err_code == ERR_NOT_ENOUGH_ENERGY || err_code == ERR_NOT_ENOUGH_RESOURCES) {
            // console.log("Completed request");
            callback_util.exec(request.end_callback);
            creep.memory.request = null;
            creep.memory.err_code = err_code;
            creep.memory.finished = true;
        }
        return;
    }
    
    var target_room_name = creep.memory.target_room_name;
    if (target_room_name && !creep.memory.finished) {
        var spawn_pos = creep.memory.spawn_pos;
        spawn_pos = new RoomPosition(spawn_pos.x, spawn_pos.y, spawn_pos.roomName);
        creep.memory.err_code = creep.travelToByRange(spawn_pos, 8);
        if (creep.memory.err_code == TRAVELTO_FINISHED){
            creep.memory.finished = true;
            creep.memory.target_room_name = null;
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

var move_to_room = function(creep, room_name) {
    if(creep && room_name) {
        if (!creep.memory.finished) {
            return ERR_BUSY;
        }
        creep.memory.finished = false;
        creep.memory.target_room_name = room_name;
        return OK;
    }
    return ERR_INVALID_ARGS;
};

var add_request = function(creep, request) {
    if(creep && request) {
        if (!creep.memory.finished) {
            return ERR_BUSY;
        }
        callback_util.exec(request.start_callback);
        creep.memory.request = request;
        creep.memory.finished = false;
        return OK;
    }
    return ERR_INVALID_ARGS;
};

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body, move_to_room: move_to_room, add_request: add_request
};