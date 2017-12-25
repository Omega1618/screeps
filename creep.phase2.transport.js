var constants = require('creep.constants');
var room_utils = require('room.utilities'); 
var callback_util = require('utilities.call_back');

var memory_init = function(room, creep_body) {
    return {request:null, role: constants.role_enum.TRANSPORT, room_name:room.name};
};

var startup_creep = function(creep_memory) {
    var room = Game.rooms[creep_memory.room_name];
    room.memory[constants.NUM_TRANSPORT] += 1;
};

var shutdown_creep = function(creep_memory) {
    var room = Game.rooms[creep_memory.room_name];
    room.memory[constants.NUM_TRANSPORT] -= 1;
    
    if (request !== null) {
        // TODO
    }
};

var check_and_get_request = function(creep) {
    if (creep.memory.request !== null) {
        return;
    }
    var room = creep.room;
    var is_source = creep.carry.energy <= creep.carryCapacity * 0.5;
    var request = room_utils.get_from_transport_queue(room, is_source);
    if (request !== undefined && !room_utils.transport_request_is_started(room, request)) {
        room_utils.transport_request_mark_started(room, request);
        creep.memory.request = request;
        callback_util.exec(request.start_callback);
    }
}

var parse_source = function(creep, request) {
     // Could be a position, creep, resource on the ground, or structure
     var source = request.source;
     var err_code = ERR_NOT_IN_RANGE;
     switch (request.source_type) {
         case constants.TRANSPORT_SOURCE_TYPES.POSITION:
             // TODO look for a resource that matches request.type
             source = new RoomPosition(source.x, source.y, source.roomName);
             source = source.lookFor(LOOK_ENERGY);
             if (source.length == 0) {
                 err_code = OK;
                 break;
             }
             source = source[0];
             err_code = creep.pickup(source);
             if(err_code == OK) {
                 err_code = ERR_BUSY;
             }
             break;
         case constants.TRANSPORT_SOURCE_TYPES.RESOURCE:
             source = Game.getObjectById(source);
             err_code = creep.pickup(source);
             break;
         case constants.TRANSPORT_SOURCE_TYPES.CREEP:
             source = Game.getObjectById(source);
             err_code = source.transfer(creep, request.type);
             break;
         case constants.TRANSPORT_SOURCE_TYPES.STRUCTURE:
             source = Game.getObjectById(source);
             err_code = creep.withdraw(source, request.type);
             break;
     }
     if (err_code == ERR_FULL) {
         err_code = OK;
     }
     return [source, err_code];
 }
 
/** @param {Creep} creep **/
var run = function(creep) {
    if (creep.spawning) {
        return;
    }
    
    check_and_get_request(creep);
    var request = creep.memory.request;
    // console.log("Has request: " + request);
    if (request === null) {
        // console.log("Was null");
        return;
    }
    
    var err_code = ERR_NOT_IN_RANGE;
    var target = request.target;
    if (request.target === undefined) {
        var result = parse_source(creep, request);
        target = result[0];
        err_code = result[1];
    } else {
        target = Game.getObjectById(target);
        err_code = creep.transfer(target, request.type);
        // console.log("actual err code: " + err_code);
        if (err_code == ERR_FULL || err_code == ERR_NOT_ENOUGH_RESOURCES) {
            err_code = OK;
        }
    }
    
    // console.log("Error code: " + err_code);
    if(err_code == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
    if (err_code == OK) {
        // console.log("Completed request");
        callback_util.exec(request.end_callback);
        room_utils.transport_request_mark_done(creep.room, request);
        creep.memory.request = null;
    }
};

var suggested_body = function(energy) {
    if (energy < 100) {
        return null;
    }
    var body = [MOVE, CARRY];
    energy = Math.min(200, energy - 100);
    
    var num_parts = (energy - (energy % 100)) / 100;
    for(var i = 0; i < num_parts; ++i) {
        body.push(MOVE);
        body.push(CARRY);
    }
    
    return body;
};

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body
};