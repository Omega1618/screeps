var constants = require('creep.constants');
var Make_Transport_Request = require("utilities.transport_request");
var room_utils = require('room.utilities'); 
var callback_util = require('utilities.call_back');

// TODO, this file is not close to done.

var memory_init = function(room) {
    return {room_name:room.name, energy_request:null, priority:null};
};

var startup = function(tower_memory) {
    // var room = Game.rooms[tower_memory.room_name];
    // room.memory[constants.NUM_STATIC_BUILDER] += 1;
};

var shutdown = function(tower_memory) {
    // var room = Game.rooms[tower_memory.room_name];
    // room.memory[constants.NUM_STATIC_BUILDER] -= 1;
};

var reset_cb_fn_id = callback_util.register_callback_fn( function(tower_id) {
    // Game.getObjectById(tower_id).memory.energy_request = null;
    // Game.getObjectById(tower_id).memory.priority = null;
});

var make_pickup_request = function(tower, priority) {
    var room = creep.room;
    if (creep.memory.pickup_request !== null) {
        room_utils.transport_request_mark_ignore(room, creep.memory.pickup_request);
    }
    
    var request = Make_Transport_Request();
    request.source = creep.pos;
    request.type = RESOURCE_ENERGY;
    request.source_type = constants.TRANSPORT_SOURCE_TYPES.POSITION;
    request.end_callback = callback_util.register_callback(miner_reset_drop_count_cb_fn_id, creep.id);
    
    creep.memory.pickup_request = request;
    creep.memory.priority = priority;
    
    var source = true;
    room_utils.add_to_transport_queue(creep.room, creep.memory.priority, request, source);
}

/** @param {Tower} tower **/
var run = function(tower) {
    // TODO
};

module.exports = {memory_init:memory_init, run:run, startup:startup, shutdown:shutdown
};