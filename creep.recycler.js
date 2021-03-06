/*
 * This creep walks to a spawn and asks to be recycled
 */
 
var constants = require('creep.constants');
var room_utils = require('room.utilities'); 
var callback_util = require('utilities.call_back');
var Make_Transport_Request = require("utilities.transport_request");

var memory_init = function(room, creep_body) {
    return {spawner:null, role: constants.role_enum.RECYCLER, room_name: room.name, x: null, y: null};
};

var startup_creep = function(creep_memory) {
};

var recycle_callback_callback_fn_id = callback_util.register_callback_fn( function(context) {
    var request = context.request;
    var pos = new RoomPosition(request.source.x, request.source.y, request.source.roomName);
    var has_energy = pos.lookFor(LOOK_ENERGY).length > 0;
    if (has_energy) {
        var new_request = Make_Transport_Request();
        new_request.source = pos;
        new_request.type = RESOURCE_ENERGY;
        new_request.source_type = constants.TRANSPORT_SOURCE_TYPES.POSITION;
        new_request.end_callback = callback_util.register_callback(context.cb_fn_id, {request:request, cb_fn_id:context.cb_fn_id});
        
        room_utils.add_to_transport_queue(Game.rooms[request.source.roomName], 0, new_request, true);
    }
});

var shutdown_creep = function(creep_memory) {
    if (!creep_memory.spawner) {
        return;
    }
    
    var request = Make_Transport_Request();
    request.source = new RoomPosition(creep_memory.x, creep_memory.y, creep_memory.room_name);
    request.type = RESOURCE_ENERGY;
    request.source_type = constants.TRANSPORT_SOURCE_TYPES.POSITION;
    request.end_callback = callback_util.register_callback(recycle_callback_callback_fn_id, {request:request, cb_fn_id:recycle_callback_callback_fn_id});
    
    room_utils.add_to_transport_queue(Game.rooms[creep_memory.room_name], 0, request, true);
};
 
/** @param {Creep} creep **/
var run = function(creep) {
    if (creep.memory.spawner === null) {
        var spawners = creep.room.find(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_SPAWN }
        });
        // TODO check if the room has a transport queue, and if it does not then suicide
        if (spawners.length == 0) {
            creep.suicide();
            return;
        }
        creep.memory.spawner = spawners[0].id;
    }
    
    creep.memory.x = creep.pos.x;
    creep.memory.y = creep.pos.y;
    
    var spawner = Game.getObjectById(creep.memory.spawner);
    var err_code = spawner.recycleCreep(creep);
    if (err_code == ERR_NOT_IN_RANGE) {
        var err_code = creep.moveTo(spawner);
        if (err_code == ERR_NO_BODYPART) {
            creep.suicide();
        }
    }
};

var suggested_body = function(energy) {
    return [MOVE];
};

var become_recycler = function(creep, shutdown_fn) {
    var creep_name = creep.name;
    var creep_body = creep.body.forEach(function(bpart) {
        return bpart.type;
    });
    shutdown_fn(Memory.creeps[creep_name]);
    Memory.creeps[creep_name] = memory_init(creep.room, creep_body);
    startup_creep(Memory.creeps[creep_name]);
};

var id_to_recycler = function(id, shutdown_fn) {
    if (id) {
        var creep = Game.getObjectById(id);
        if (creep) {
            become_recycler(creep, shutdown_fn);
        }
    }
};

var name_to_recycler = function(name, shutdown_fn) {
    if (name) {
        var creep = Game.creeps[name];
        if (creep) {
            become_recycler(creep, shutdown_fn);
        }
    }
};

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body, become_recycler:become_recycler, id_to_recycler: id_to_recycler,
                  name_to_recycler: name_to_recycler
};