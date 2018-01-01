/**
 * 
 * Maintain a low priority queue for transports and a high priority queue for transports to gather from
 * Also maintain a high and low priority queue to send things to.
 * 
 * Also maintain a list of which sources are being mined from and which need to be minded from
 *
 * This phase is not equipped to handle links and labs, consider making a new phase
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
    room.memory[constants.TRANSPORT_CARRY_PARTS] = 0;
    
    // TODO make data structure for party
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
    delete room.memory[constants.TRANSPORT_CARRY_PARTS];
    
    // TODO force disband all parties
};

var try_party = function (room) {
    // TODO, make sure you have enough CPU in the bucket
    // TODO, parties should use resources from the storage and should only be created if enough resources are available in the storage.
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
    
    if (ae < 550 && ac - ae > 0) {
        return ERR_NOT_ENOUGH_ENERGY;
    }
    
    if (room.memory[constants.NUM_DROP_MINERS] <  room.memory[constants.SAFE_SOURCES].length) {
        return util.spawn_creep(room, roleMiner, ae);
    }
    
    if (ac - ae > 0) {
        return ERR_NOT_ENOUGH_ENERGY;
    }
    
    var incoming_energy = room.memory[constants.NUM_SAFE_SOURCES] * 10; // TODO update this with source keeper sources and long distance mining.
    var builder_outgoing_energy = room.memory[constants.STATIC_BUILDER_WORKER_PARTS] * BUILD_POWER;
    var upgrader_outgoing_energy = room.memory[constants.STATIC_UPGRADER_WORKER_PARTS] * UPGRADE_CONTROLLER_POWER;
    
    var builder_output_percentage = 0.5;
    var upgrader_output_percentage = 0.5;
    if (room.controller.level < 3) {
        builder_output_percentage = 0.0;
        upgrader_output_percentage = 1.0;
    }
    
    // Assume transport creeps are multiples of [MOVE, CARRY, CARRY], assume each trip is from source to sink and back with no stops
    // Assume averge trip distance is 25, from sink to source takes 25 ticks, from source to sink takes 50 ticks
    // in 75 ticks 'incoming_energy * 75' is generated
    // room.memory[constants.TRANSPORT_CARRY_PARTS] * 50 energy is removed from the system
    // Hence the optimal transport carry parts is incoming_energy * 75 / 50 = incoming_energy * 1.5
    // In general room.memory[constants.TRANSPORT_CARRY_PARTS] = incoming_energy * 1.5 * avg_dist / 50.0
    // Could potentialy use a moving average of the number of ticks the transports take to calculate average distance
    if (room.memory[constants.TRANSPORT_CARRY_PARTS] < incoming_energy * 1.5) {
        return util.spawn_creep(room, roleTransport, ae);
    }
    
    if (room.memory[constants.NUM_REPAIRER] < 1) {
        return util.spawn_creep(room, roleRepairer, ae);
    }
    
    if (builder_outgoing_energy < incoming_energy * builder_output_percentage) {
        return util.spawn_creep(room, roleBuilder, ae);
    }
    
    if (upgrader_outgoing_energy < incoming_energy * upgrader_output_percentage) {
        return util.spawn_creep(room, roleUpgrader, ae);
    }
    
    try_party(room);
    return ERR_FULL;
};

var try_build = function(room) {
    var success = room_layout.create_next_construction_site(room.name);
    // console.log("Was able to build: " + success);
};

var renew_if_not_full_callback_fn_id = callback_util.register_callback_fn( function(context) {
    var request = context.request;
    var cb_fn_id = context.cb_fn_id;
    var room_name = context.room_name;
    
    var target = Game.getObjectById(request.target);
    if (!target || target.energy == target.energyCapacity) {
        delete Game.rooms[room_name].memory[constants.TRANSPORT_STRUCTURE_ENERGY_REQUEST][request.target];
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

var make_structure_energy_requests = function(room) {
    var targets = room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_TOWER) &&
                        structure.energy < structure.energyCapacity && !(room.memory[constants.TRANSPORT_STRUCTURE_ENERGY_REQUEST][structure.id]);
                }
        });
    if (room.storage && _.sum(room.storage.store) < room.storage.storeCapacity && 
        !(room.memory[constants.TRANSPORT_STRUCTURE_ENERGY_REQUEST][room.storage.id])) {
        targets.push(room.storage);
    }
    
    targets.forEach(function(target){
        
        var new_request = Make_Transport_Request();
        new_request.target = target.id;
        new_request.type = RESOURCE_ENERGY;
        new_request.end_callback = callback_util.register_callback(renew_if_not_full_callback_fn_id, 
                    {request: new_request, cb_fn_id: renew_if_not_full_callback_fn_id, room_name: room.name});
        
        room.memory[constants.TRANSPORT_STRUCTURE_ENERGY_REQUEST][target.id] = true;
        
        var is_source = false;
        util.add_to_transport_queue(room, constants.SPAWNER_REQUEST_PRIORITY, new_request, is_source);
    });
}
 
var run_room = function(room) {
    // var t_queues = room.memory[constants.TRANSPORT_QUEUE_CONSTANTS.TRANSPORT_QUEUES];
    var err_code = try_spawn(room);
    if (err_code == OK || Game.time % 20 == 0) {
        make_structure_energy_requests(room);
    }
    if (Game.time % 50 == 0 && room.controller.level >= 3) {
        // TODO, this may create a construction site.  Need to coordinate between building economic structures and building defense structures.
        var defense_target = room_layout.get_next_defense_target(room.name);
    }
    if (Game.time % 5 == 0 && room.memory[constants.NUM_STATIC_BUILDER]) {
        // TODO cache construction site
        if(room.find(FIND_CONSTRUCTION_SITES).length == 0) {
            try_build(room);
        }
    }
};

var can_help = function(room) {
    return room.memory[constants.NUM_DROP_MINERS] >= room.memory[constants.SAFE_SOURCES].length
            && room.memory[constants.NUM_TRANSPORT] >= 2
            && room.memory[constants.NUM_REPAIRER] >= 1;
};


module.exports = {
    run_room: run_room,
    can_help: can_help,
    start_phase: start_phase,
    end_phase: end_phase
};