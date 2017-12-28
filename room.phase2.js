/**
 * 
 * Maintain a low priority queue for transports and a high priority queue for transports to gather from
 * Also maintain a high and low priority queue to send things to.
 * 
 * Also maintain a list of which sources are being mined from and which need to be minded from
 * 
 **/

var roleBuilder = require('creep.phase2.static_builder');
var roleMiner = require('creep.phase2.drop_miner');
var roleTransport = require('creep.phase2.transport');
var roleUpgrader = require('creep.phase2.static_upgrader');
var roleRepairer = require('creep.phase2.repairer');
var roleRecycler = require('creep.recycler');

var MultiQueue = require('utilities.queue');
var Make_Transport_Request = require("utilities.transport_request");
var callback_util = require('utilities.call_back');

var constants = require('creep.constants');
var util = require("room.utilities");
var room_layout = require('room.layout');

var start_phase = function(room) {
    // data structure to keep track of miners at each source.
    var has_drop_miner = {};
    var source_delay = {};
    var sources = room.find(FIND_SOURCES);
    var source_keepers = room.find(FIND_STRUCTURES, {
        filter: { structureType: STRUCTURE_KEEPER_LAIR }
    });
    source_keepers.forEach(function(sk){
        var unsafe_source = sk.pos.findClosestByRange(FIND_SOURCES);
        sources = _.filter(sources, function(s){ return s.id != unsafe_source.id;});
    });
    sources.forEach(function(source) {
        has_drop_miner[source.id] = false;
        source_delay[source.id] = 0;
    });
    room.memory[constants.DROP_MINER_TRACKER] = has_drop_miner;
    room.memory[constants.SAFE_SOURCES] = sources.map(function(s){return s.id;});
    room.memory[constants.NUM_SAFE_SOURCES] = Object.keys(room.memory[constants.SAFE_SOURCES]).length;
    
    room.memory[constants.TRANSPORT_STRUCTURE_ENERGY_REQUEST] = {};
    
    room.memory[constants.NUM_DROP_MINERS] = 0;
    room.memory[constants.NUM_STATIC_BUILDER] = 0;
    room.memory[constants.NUM_STATIC_UPGRADER] = 0;
    room.memory[constants.NUM_TRANSPORT] = 0;
    room.memory[constants.NUM_REPAIRER] = 0;
    
    room.memory[constants.STATIC_BUILDER_WORKER_PARTS] = 0;
    room.memory[constants.STATIC_UPGRADER_WORKER_PARTS] = 0;
};

var end_phase = function(room) {
    delete room.memory[constants.DROP_MINER_TRACKER];
    delete room.memory[constants.SAFE_SOURCES];
    
    delete room.memory[constants.TRANSPORT_STRUCTURE_ENERGY_REQUEST];
    
    delete room.memory[constants.NUM_DROP_MINERS];
    delete room.memory[constants.NUM_STATIC_BUILDER];
    delete room.memory[constants.NUM_STATIC_UPGRADER];
    delete room.memory[constants.NUM_TRANSPORT];
    delete room.memory[constants.NUM_REPAIRER];
    
    delete room.memory[constants.STATIC_BUILDER_WORKER_PARTS];
    delete room.memory[constants.STATIC_UPGRADER_WORKER_PARTS];
};

var try_party = function (room) {
    // TODO
}

var try_spawn = function(room) {
    var ae = room.energyAvailable;
    var ac = room.energyCapacityAvailable;
    
    if (room.memory[constants.NUM_TRANSPORT] < 1) {
        return util.spawn_creep(room, roleTransport, Math.min(ae, 150));
    }
    
    if (room.memory[constants.NUM_DROP_MINERS] <  1) {
        return util.spawn_creep(room, roleMiner, ae);
    }
    
    if (room.memory[constants.NUM_TRANSPORT] == 1 && room.memory[constants.NUM_DROP_MINERS] > 1) {
        return util.spawn_creep(room, roleTransport, ae);
    }
    
    if (ac - ae > 0) {
        return ERR_NOT_ENOUGH_ENERGY;
    }
    
    if (room.memory[constants.NUM_DROP_MINERS] <  room.memory[constants.SAFE_SOURCES].length) {
        return util.spawn_creep(room, roleMiner, ae);
    }
    
    var queue_length = Math.min(util.get_transport_queue_length(room, true), util.get_transport_queue_length(room, false));
    var total_sources = room.memory[constants.NUM_DROP_MINERS]*2 + room.memory[constants.NUM_STATIC_UPGRADER] + room.memory[constants.NUM_STATIC_BUILDER] + queue_length * 0.1;
    var transport_multiplier = 1.0;
    if (room.memory[constants.NUM_TRANSPORT] < total_sources * transport_multiplier) {
        return util.spawn_creep(room, roleTransport, ae);
    }
    
    if (room.memory[constants.NUM_REPAIRER] < 1) {
        return util.spawn_creep(room, roleRepairer, ae);
    }
    
    var incoming_energy = room.memory[constants.NUM_SAFE_SOURCES] * 10; // TODO update this with source keeper sources and long distance mining.
    var builder_outgoing_energy = room.memory[constants.STATIC_BUILDER_WORKER_PARTS] * BUILD_POWER;
    var upgrader_outgoing_energy = room.memory[constants.STATIC_UPGRADER_WORKER_PARTS] * UPGRADE_CONTROLLER_POWER;
    
    if (builder_outgoing_energy < incoming_energy / 2.0) {
        return util.spawn_creep(room, roleBuilder, ae);
    }
    
    if (upgrader_outgoing_energy < incoming_energy / 2.0) {
        return util.spawn_creep(room, roleUpgrader, ae);
    }
    
    try_party(room);
    return ERR_FULL;
};

var try_build = function(room) {
    var success = room_layout.create_next_construction_site(room.name);
    console.log("Was able to build: " + success);
};

var renew_if_not_full_callback_fn_id = callback_util.register_callback_fn( function(context) {
    var request = context.request;
    var cb_fn_id = context.cb_fn_id;
    var target = Game.getObjectById(request.target);
    if (target.energy == target.energyCapacity) {
        target.room.memory[constants.TRANSPORT_STRUCTURE_ENERGY_REQUEST][target.id] = false;
        return;
    }
    target.room.memory[constants.TRANSPORT_STRUCTURE_ENERGY_REQUEST][target.id] = true;
    
    var new_request = Make_Transport_Request();
    new_request.source = request.source;
    new_request.source_type = request.source_type;
    new_request.target = request.target;
    new_request.type = request.type;
    new_request.end_callback = callback_util.register_callback(cb_fn_id, {request:new_request, cb_fn_id:cb_fn_id});
    
    var is_source = false;
    var room = target.room;
             
    
    util.add_to_transport_queue(room, constants.SPAWNER_REQUEST_PRIORITY, new_request, is_source);
});

var make_spawn_energy_requests = function(room) {
    var targets = room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                        structure.energy < structure.energyCapacity && !(room.memory[constants.TRANSPORT_STRUCTURE_ENERGY_REQUEST][structure.id]);
                }
        });
    targets.forEach(function(target){
        
        var new_request = Make_Transport_Request();
        new_request.target = target.id;
        new_request.type = RESOURCE_ENERGY;
        new_request.end_callback = callback_util.register_callback(renew_if_not_full_callback_fn_id, {request: new_request, cb_fn_id: renew_if_not_full_callback_fn_id});
        
        room.memory[constants.TRANSPORT_STRUCTURE_ENERGY_REQUEST][target.id] = true;
        
        var is_source = false;
        util.add_to_transport_queue(room, constants.SPAWNER_REQUEST_PRIORITY, new_request, is_source);
    });
}
 
var run_room = function(room) {
    // var t_queues = room.memory[constants.TRANSPORT_QUEUE_CONSTANTS.TRANSPORT_QUEUES];
    var err_code = try_spawn(room);
    if (err_code == OK || Game.time % 20 == 0) {
        make_spawn_energy_requests(room);
    }
    if (Game.time % 5 == 0 && room.memory[constants.NUM_STATIC_BUILDER]) {
        if(room.find(FIND_CONSTRUCTION_SITES).length == 0) {
            try_build(room);
        }
    }
};


module.exports = {
    run_room: run_room,
    start_phase: start_phase,
    end_phase: end_phase
};