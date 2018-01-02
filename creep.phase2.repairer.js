var constants = require('creep.constants');
var Make_Transport_Request = require("utilities.transport_request");
var room_utils = require('room.utilities'); 
var callback_util = require('utilities.call_back');

var memory_init = function(room, creep_body) {
    var num_work = creep_body.filter(function(e) {return e == WORK}).length;
    return {target: null, room_name:room.name, role: constants.role_enum.REPAIRER, num_work:num_work, energy_request:null, priority:null};
};

var startup_creep = function(creep_memory) {
    var room = Game.rooms[creep_memory.room_name];
    room.memory[constants.NUM_REPAIRER] += 1;
};

var shutdown_creep = function(creep_memory) {
    var room = Game.rooms[creep_memory.room_name];
    room.memory[constants.NUM_REPAIRER] -= 1;
};

var reset_cb_fn_id = callback_util.register_callback_fn( function(creep_name) {
    if (!creep_name) return;
    var creep = Game.creeps[creep_name];
    if (creep) {
        creep.memory.energy_request = null;
        creep.memory.priority = null;
    }
});

/** @param {Creep} creep **/
var run = function(creep) {
    if(creep.memory.energy_request === null && creep.carry.energy < constants.REPAIRER_REQUEST_ENERGY) {
        var request = Make_Transport_Request();
        request.target = creep.id;
        request.type = RESOURCE_ENERGY;
        request.end_callback = callback_util.register_callback(reset_cb_fn_id, creep.name);
        
        creep.memory.energy_request = request;
        creep.memory.priority = constants.REPAIRER_PRIORITY;
        
        var is_source = false;
        room_utils.add_to_transport_queue(creep.room, creep.memory.priority, request, is_source)
    }
    
    if(creep.memory.target !== null) {
        var target = Game.getObjectById(creep.memory.target);
        if(!target || target.hits == target.hitsMax) {
            creep.memory.target = null;
        }
    }
    
    if (Game.time % 25 === 0 && creep.memory.target === null) {
        // TODO cache a list of all structures that need to be repaired.
        // TODO walls and STRUCTURE_RAMPART
        var structures = creep.room.find(FIND_STRUCTURES);
        var damaged_structures = [];
        var min_percentage = 1.0;
        for (var i = 0; i < structures.length; ++i) {
            var struct = structures[i];
            if (struct.structureType != STRUCTURE_WALL && struct.structureType != STRUCTURE_RAMPART && struct.hits < struct.hitsMax) {
                min_percentage = Math.min(min_percentage, struct.hits / struct.hitsMax);
                damaged_structures.push(struct);
            }
        }
        creep.memory.target = _.minBy(damaged_structures, function(struct) {return struct.hits / struct.hitsMax});
        
        if(creep.memory.target !== null) {
            creep.memory.target = creep.memory.target.id;
        }
    }
    
    if (creep.memory.target !== null) {
        var target = Game.getObjectById(creep.memory.target);
        if(target && creep.repair(creep.memory.target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.memory.target);
        }
    } else {
        if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
        }
    }
};

var suggested_body = function(energy) {
    if (energy < 400) {
        return null;
    }
    var body = [MOVE, MOVE, CARRY, CARRY];
    energy -= 200;
    
    var num_worker_parts = (energy - (energy % 100)) / 100;
    num_worker_parts = Math.min(num_worker_parts, 3);
    for(var i = 0; i < num_worker_parts; ++i) {
        body.push(WORK);
    }
    energy -= 100 * num_worker_parts;
    
    // if (energy >= 50) {
    //     body.push(CARRY);
    //     energy -= 50;
    // }
    return body;
};

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body
};