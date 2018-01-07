var constants = require('creep.constants');
var room_utils = require('room.utilities'); 
var callback_util = require('utilities.call_back');
var recyclerRole = require('creep.recycler');

var movement_options = {reusePath: 10, ignoreCreeps: false};

var memory_init = function(room, creep_body) {
    var num_carry = creep_body.filter(function(e) {return e == CARRY}).length;
    return {request:null, find_source:true, num_carry:num_carry, role: constants.role_enum.TRANSPORT, room_name:room.name};
};

var startup_creep = function(creep_memory) {
    var room = Game.rooms[creep_memory.room_name];
    room.memory[constants.NUM_TRANSPORT] += 1;
    room.memory[constants.TRANSPORT_CARRY_PARTS] += creep_memory.num_carry;
};

var shutdown_creep = function(creep_memory) {
    var room = Game.rooms[creep_memory.room_name];
    room.memory[constants.NUM_TRANSPORT] -= 1;
    room.memory[constants.TRANSPORT_CARRY_PARTS] -= creep_memory.num_carry;
    
    var request = creep_memory.request;
    if (request !== null) {
        callback_util.exec(request.end_callback);
        creep_memory.request = null;
    }
};

var update_find_source = function(creep) {
    if (creep.memory.find_source) {
        creep.memory.find_source = creep.carry.energy <= creep.carryCapacity * 0.5;
    } else {
        creep.memory.find_source = creep.carry.energy <= creep.carryCapacity * 0.25;
    }    
}

var check_and_get_request = function(creep) {
    if (creep.memory.request !== null) {
        return;
    }
    
    update_find_source(creep);
    
    var room = creep.room;
    var request = room_utils.get_from_transport_queue(room, creep.memory.find_source);
    if (request) {
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
             if (!source) {
                 err_code = OK;
                 break;
             }
             err_code = creep.pickup(source);
             break;
         case constants.TRANSPORT_SOURCE_TYPES.CREEP:
             source = Game.getObjectById(source);
             if (!source) {
                 err_code = OK;
                 break;
             }
             err_code = source.transfer(creep, request.type);
             if (err_code != ERR_BUSY && err_code != ERR_NOT_IN_RANGE) {
                 err_code = OK;
             }
             break;
         case constants.TRANSPORT_SOURCE_TYPES.STRUCTURE:
             source = Game.getObjectById(source);
             if (!source) {
                 err_code = OK;
                 break;
             }
             err_code = creep.withdraw(source, request.type);
             break;
     }
     if (err_code == ERR_FULL) {
         err_code = OK;
     }
     return [source, err_code];
 };
 
 var run_request = function (creep, request) {
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
        // TODO, when not in range, you should check if the target is full on the resource and if it is then you should return OK.
    }
    return {err_code:err_code, target:target};
 };
 
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
    
    var result = run_request(creep, request);
    var err_code = result.err_code;
    var target = result.target;
    
    // console.log("Error code: " + err_code);
    if(err_code == ERR_NOT_IN_RANGE) {
        creep.moveTo(target, movement_options);
    } else if (err_code == OK || err_code == ERR_INVALID_TARGET || err_code == ERR_NOT_OWNER || err_code == ERR_NO_BODYPART
                || err_code == ERR_NOT_ENOUGH_ENERGY || err_code == ERR_NOT_ENOUGH_RESOURCES) {
        // console.log("Completed request");
        callback_util.exec(request.end_callback);
        creep.memory.request = null;
        if (err_code == ERR_NO_BODYPART) {
            recyclerRole.become_recycler(creep, shutdown_creep);
        }
    }
};

var suggested_body = function(energy) {
    if (energy < 100) {
        return null;
    }
    var body = [MOVE, CARRY];
    energy = Math.min(900, energy) - 100;
    
    if (energy >= 50) {
        body.push(CARRY);
        energy = Math.max(0, energy - 50);
    }
    
    var num_parts = (energy - (energy % 150)) / 150;
    for(var i = 0; i < num_parts; ++i) {
        body.push(MOVE);
        body.push(CARRY);
        body.push(CARRY);
        energy -= 150;
    }
    
    if (energy >= 100) {
        body.push(MOVE);
        body.push(CARRY);        
    }
    
    return body;
};

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body, run_request:run_request
};