var constants = require('creep.constants');
var Make_Transport_Request = require("utilities.transport_request");
var room_utils = require('room.utilities'); 
var callback_util = require('utilities.call_back');

var memory_init = function(room, creep_body) {
    var source = null;
    var miner_tracker = room.memory[constants.MINER_TRACKER];
    // Make sure all energy sources are being harvested before harvesting minerals.
    for (var source_id in miner_tracker) {
        if (!miner_tracker[source_id]) {
            var obj = Game.getObjectById(source_id);
            if (obj.mineralType) continue;
            source = source_id;
            break;
        }
    }
    for (var source_id in miner_tracker) {
        if (!miner_tracker[source_id]) {
            source = source_id;
            break;
        }
    }
    
    var num_work = creep_body.filter(function(e) {return e == WORK}).length;
    
    var resource_type = RESOURCE_ENERGY;
    var source = Game.getObjectById(source);
    if (source && source.mineralType) resource_type = source.mineralType;
    
    return {target:source, role: constants.role_enum.LINK_MINER, resource_type:resource_type, 
            num_work:num_work, harvested: 0, pickup_request:null, priority:null};
};

var startup_creep = function(creep_memory) {
    var source = Game.getObjectById(creep_memory.target);
    source.room.memory[constants.MINER_TRACKER][creep_memory.target] = true;
    source.room.memory[constants.MINERS] += 1;
};

var shutdown_creep = function(creep_memory) {
    var source = Game.getObjectById(creep_memory.target);
    source.room.memory[constants.MINER_TRACKER][creep_memory.target] = false;
    source.room.memory[constants.MINERS] -= 1;
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
    request.type = creep.memory.resource_type;
    request.source_type = constants.TRANSPORT_SOURCE_TYPES.POSITION;
    request.end_callback = callback_util.register_callback(miner_reset_drop_count_cb_fn_id, creep.id);
    
    creep.memory.pickup_request = request;
    creep.memory.priority = priority;
    
    var source = true;
    room_utils.add_to_transport_queue(creep.room, creep.memory.priority, request, source);
}

var getlink = function(creep, source) {
    var link = null;
    if (creep.memory.link_id) {
        link = Game.getObjectById(creep.memory.link_id);
        if (link) return link;
        delete creep.memory.link_id;
    }
    link = source.pos.getLink();
    if (link) creep.memory.link_id = link.id;
    return link;
};

/** @param {Creep} creep **/
var run = function(creep) {        
    var source = Game.getObjectById(creep.memory.target);
    if (!source) {
        creep.suicide();
        return;
    }
    
    var err_code = creep.harvest(source);
    if(err_code == ERR_NOT_IN_RANGE) creep.travelTo(source.getMiningPosition());
    
    var carry_amount = _.sum(creep.carry);
    if (err_code == OK && carry_amount >= creep.carryCapacity * 0.5) {
        var link = getlink(creep, source);
        
        if (link && carry_amount > 0) {
            var err_code = creep.transfer(link, creep.memory.resource_type);
            if(err_code == ERR_NOT_IN_RANGE) creep.travelTo(link);
        } else {
            // just drop it and make a pickup request.
            creep.drop(creep.memory.resource_type);
            creep.memory.harvested += carry_amount;
            
            if (creep.memory.harvested > 0 creep.memory.pickup_request === null) {
                make_pickup_request(creep, constants.TRANSPORT_IDLE_PRIORITY);
            }
            
            // TODO need to check if a transport creep has already started on the order before increasing priority.
            if (creep.memory.harvested > constants.DROP_MINER_REQUEST_ENERGY && creep.memory.priority < constants.DROP_MINIER_PRIORITY) {
                make_pickup_request(creep, constants.DROP_MINIER_PRIORITY);
            }
            if (creep.memory.harvested > constants.DROP_MINER_PRIORITY_REQUEST_ENERGY && creep.memory.priority < constants.DROP_MINIER_HIGH_PRIORITY) {
                make_pickup_request(creep, constants.DROP_MINIER_HIGH_PRIORITY);
            }
        }
        
    }
};

var suggested_body = function(energy) {
    if (energy < 200) {
        return null;
    }
    var body = [MOVE, CARRY];
    energy -= 100;
    
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