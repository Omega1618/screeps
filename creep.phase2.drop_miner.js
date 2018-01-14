var constants = require('creep.constants');
var Make_Transport_Request = require("utilities.transport_request");
var room_utils = require('room.utilities'); 
var callback_util = require('utilities.call_back');

var memory_init = function(room, creep_body) {
    var source = null;
    var miner_tracker = room.memory[constants.DROP_MINER_TRACKER];
    for (var source_id in miner_tracker) {
        if (!miner_tracker[source_id]) {
            source = source_id;
            break;
        }
    }
    
    var num_work = creep_body.filter(function(e) {return e == WORK}).length;
    
    return {target:source, role: constants.role_enum.DROP_MINER, num_work:num_work, harvested: 0, pickup_request:null, priority:null};
};

var startup_creep = function(creep_memory) {
    var source = Game.getObjectById(creep_memory.target);
    source.room.memory[constants.DROP_MINER_TRACKER][creep_memory.target] = true;
    source.room.memory[constants.NUM_DROP_MINERS] += 1;
};

var shutdown_creep = function(creep_memory) {
    var source = Game.getObjectById(creep_memory.target);
    source.room.memory[constants.DROP_MINER_TRACKER][creep_memory.target] = false;
    source.room.memory[constants.NUM_DROP_MINERS] -= 1;
};

var miner_reset_drop_count_cb_fn_id = callback_util.register_callback_fn( function(creep_id) {
    var creep = Game.getObjectById(creep_id);
    if (creep !== null) {
        creep.memory.harvested = 0;
        creep.memory.pickup_request = null;
        creep.memory.priority = null;
    }
});

var make_pickup_request = function(creep, priority) {
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

/** @param {Creep} creep **/
var run = function(creep) {    
    var source = Game.getObjectById(creep.memory.target);
    if (source === null) {
        creep.suicide();
        return;
    }
    
    var err_code = creep.harvest(source);
    if(err_code == ERR_NOT_IN_RANGE) {
        var err_code = creep.moveTo(source.getMiningPosition());
    }
    if (err_code == OK) {
        creep.memory.harvested += creep.memory.num_work * 2;
    } 

    
    if (creep.memory.pickup_request === null) {
        make_pickup_request(creep, constants.TRANSPORT_IDLE_PRIORITY);
    }
    // TODO need to check if a transport creep has already started on the order before increasing priority.
    if (creep.memory.harvested > constants.DROP_MINER_REQUEST_ENERGY && creep.memory.priority < constants.DROP_MINIER_PRIORITY) {
        make_pickup_request(creep, constants.DROP_MINIER_PRIORITY);
    }
    if (creep.memory.harvested > constants.DROP_MINER_PRIORITY_REQUEST_ENERGY && creep.memory.priority < constants.DROP_MINIER_HIGH_PRIORITY) {
        make_pickup_request(creep, constants.DROP_MINIER_HIGH_PRIORITY);
    }
};

var suggested_body = function(energy) {
    if (energy < 150) {
        return null;
    }
    var body = [MOVE];
    energy -= 50;
    
    var num_worker_parts = (energy - (energy % 100)) / 100;
    num_worker_parts = Math.min(num_worker_parts, 5);
    for(var i = 0; i < num_worker_parts; ++i) {
        body.push(WORK);
    }
    energy -= 100 * num_worker_parts;
    
    return body;
};

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body
};