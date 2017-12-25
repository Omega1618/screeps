var constants = require('creep.constants');
var Make_Transport_Request = require("utilities.transport_request");
var room_utils = require('room.utilities'); 
var callback_util = require('utilities.call_back');

var memory_init = function(room, creep_body) {
    var num_work = creep_body.filter(function(e) {return e == WORK}).length;
    return {target: null, room_name:room.name, role: constants.role_enum.STATIC_BUILDER, num_work:num_work, energy_request:null, priority:null};
};

var startup_creep = function(creep_memory) {
    var room = Game.rooms[creep_memory.room_name];
    room.memory[constants.NUM_STATIC_BUILDER] += 1;
};

var shutdown_creep = function(creep_memory) {
    var room = Game.rooms[creep_memory.room_name];
    room.memory[constants.NUM_STATIC_BUILDER] -= 1;
};

var static_builder_reset_cb_fn_id = callback_util.register_callback_fn( function(creep_id) {
    Game.getObjectById(creep_id).memory.energy_request = null;
    Game.getObjectById(creep_id).memory.priority = null;
});

/** @param {Creep} creep **/
var run = function(creep) {
    if(creep.memory.energy_request === null && creep.carry.energy < constants.STATIC_BUILDER_REQUEST_ENERGY) {
        var request = Make_Transport_Request();
        request.target = creep.id;
        request.type = RESOURCE_ENERGY;
        request.end_callback = callback_util.register_callback(static_builder_reset_cb_fn_id, creep.id);
        
        creep.memory.energy_request = request;
        creep.memory.priority = constants.STATIC_BUILDER_PRIORITY;
        
        var is_source = false;
        room_utils.add_to_transport_queue(creep.room, creep.memory.priority, request, is_source)
    }
    
    if (creep.memory.target !== null) {
        if(Game.getObjectById(creep.memory.target) === null) creep.memory.target = null;
    }
    
    if (creep.memory.target === null) {
        creep.memory.target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        if (creep.memory.target !== null) creep.memory.target = creep.memory.target.id;
    }
    
    if (creep.memory.target !== null) {
        var target = Game.getObjectById(creep.memory.target);
        if(creep.build(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    }
};

var suggested_body = function(energy) {
    if (energy < 350) {
        return null;
    }
    var body = [MOVE, CARRY, CARRY];
    energy -= 150;
    
    var num_worker_parts = (energy - (energy % 100)) / 100;
    num_worker_parts = Math.min(num_worker_parts, 4);
    for(var i = 0; i < num_worker_parts; ++i) {
        body.push(WORK);
    }
    energy -= 100 * num_worker_parts;
    
    for (var i = 0; i < 2; i++) {
        if (energy >= 50) {
            body.push(CARRY);
        }
    }
    return body;
};

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body
};