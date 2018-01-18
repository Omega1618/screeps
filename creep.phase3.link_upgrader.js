var constants = require('creep.constants');
var Make_Transport_Request = require("utilities.transport_request");
var room_utils = require('room.utilities'); 
var callback_util = require('utilities.call_back');

var memory_init = function(room, creep_body) {
    var num_work = creep_body.filter(function(e) {return e == WORK}).length;
    return {room_name:room.name, role: constants.role_enum.LINK_UPGRADER, num_work:num_work, energy_request:null, priority:null, done_moving:false, ticks_to_move: 1500};
};

var startup_creep = function(creep_memory) {
    var room = Game.rooms[creep_memory.room_name];
    room.memory[constants.NUM_UPGRADER] += 1;
    room.memory[constants.UPGRADER_WORKER_PARTS] += creep_memory.num_work;
};

var shutdown_creep = function(creep_memory) {
    var room = Game.rooms[creep_memory.room_name];
    room.memory[constants.NUM_UPGRADER] -= 1;
    room.memory[constants.UPGRADER_WORKER_PARTS] -= creep_memory.num_work;
};

var static_upgrader_reset_cb_fn_id = callback_util.register_callback_fn( function(creep_id) {
    var creep = Game.getObjectById(creep_id);
    if (creep) {
        creep.memory.energy_request = null;
        creep.memory.priority = null;
    }
});

var getlink = function(creep) {
    var link = null;
    if (creep.memory.link_id) {
        link = Game.getObjectById(creep.memory.link_id);
        if (link) return link;
        delete creep.memory.link_id;
    }
    link = creep.room.controller.pos.getLink();
    if (link) creep.memory.link_id = link.id;
    return link;
};

/** @param {Creep} creep **/
var run = function(creep) {
    if (!creep.room.controller) return;
    
    if(creep.carry.energy < constants.STATIC_UPGRADER_REQUEST_ENERGY && creep.carry.energy < creep.carryCapacity) {
        var link = getlink(creep);
        if (link) {
            // Estimate require time to move to link
            if (creep.carry.energy <= creep.memory.num_work * 3 * 2 * UPGRADE_CONTROLLER_POWER) {
                creep.memory.done_moving = false;
                creep.memory.ticks_to_move = 1500;
                creep.upgradeController(creep.room.controller);
                var err_code = creep.withdraw(link, RESOURCE_ENERGY);
                if (err_code == ERR_NOT_IN_RANGE) creep.moveTo(link);
                return;
            }
        } else if (creep.memory.energy_request === null) {
            var request = Make_Transport_Request();
            request.target = creep.id;
            request.type = RESOURCE_ENERGY;
            request.end_callback = callback_util.register_callback(static_upgrader_reset_cb_fn_id, creep.id);
            
            creep.memory.energy_request = request;
            creep.memory.priority = constants.STATIC_UPGRADER_PRIORITY;
            
            var is_source = false;
            room_utils.add_to_transport_queue(creep.room, creep.memory.priority, request, is_source)
        }
    }
    
    if (creep.memory.done_moving) {
        if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
        }
    } else {
        var err_code = creep.moveTo(creep.room.controller);
        var range = creep.pos.getRangeTo(creep.room.controller);
        if (err_code == OK) --creep.memory.ticks_to_move;
        
        if (range <= 3) {
            creep.upgradeController(creep.room.controller);
            if (creep.memory.ticks_to_move > 5) creep.memory.ticks_to_move = 5;
        }
        if (range <= 1 || creep.memory.ticks_to_move <= 0 || err_code === ERR_NO_PATH) {
            creep.memory.done_moving = true;
            delete creep.memory.ticks_to_move;
        }
    }
};

var suggested_body = function(energy) {
    if (energy < 350) {
        return null;
    }
    var body = [];
    for(var i = 0; i < 15 && energy >= 150; ++i) {
        body.push(CARRY);
        body.push(WORK);
        energy -= 150;
        if (energy >= 50 && i % 2 == 0) {
            body.push(MOVE);
            energy -= 50;
        }
    }
    return body;
};

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body
};