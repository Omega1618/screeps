/**
 * 
 * Build 5 extensions ASAP
 * 
 **/

var roleHarvester = require('creep.harvester');
var roleUpgrader = require('creep.upgrader');
var roleBuilder = require('creep.builder');
var constants = require('creep.constants');
var util = require("room.utilities");
var creep_util = require('creep.utilities');
var callback_util = require('utilities.call_back');
var Make_Transport_Request = require("utilities.transport_request");
var room_layout = require('room.layout');

var start_phase = function(room) {
    // data structure to keep track of worker parts at each source.
    var source_to_harvester_map = {};
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
        source_to_harvester_map[source.id] = 0;
        source_delay[source.id] = 0;
    });
    room.memory[constants.WORK_SOURCE_COUNTER_NAME] = source_to_harvester_map;
    room.memory[constants.SAFE_SOURCES] = sources.map(function(s){return s.id;});
    room.memory[constants.SOURCE_DELAY] = source_delay;
    
    room.memory[constants.NUM_HARVESTERS] = 0;
    room.memory[constants.NUM_UPGRADERS] = 0;
    room.memory[constants.NUM_BUILDERS] = 0;
};

var end_phase = function(room) {
    // TODO this code is actually bad, you shouldn't recycle creeps that are in parties that are in the room.
    creep_util.all_creeps_to_recyclers(room.find(FIND_MY_CREEPS));
    
    delete room.memory[constants.WORK_SOURCE_COUNTER_NAME];
    delete room.memory[constants.SAFE_SOURCES];
    delete room.memory[constants.SOURCE_DELAY];
    
    delete room.memory[constants.NUM_HARVESTERS];
    delete room.memory[constants.NUM_UPGRADERS];
    delete room.memory[constants.NUM_BUILDERS];
};

var try_spawn = function(room, ae) {
    if (room.memory[constants.NUM_HARVESTERS] < 2) {
        return util.spawn_creep(room, roleHarvester, ae);
    }
    var builder_factor = 0.0;
    var upgrader_factor = 1;
    if (room.controller.level >= 2) {
        builder_factor = 2.0;
        upgrader_factor = 0.5;
    }
    if (room.memory[constants.NUM_BUILDERS] < room.memory[constants.NUM_HARVESTERS] * builder_factor) {
        return util.spawn_creep(room, roleBuilder, ae);
    }
    if (room.memory[constants.NUM_UPGRADERS] < room.memory[constants.NUM_HARVESTERS] * upgrader_factor) {
        return util.spawn_creep(room, roleUpgrader, ae);
    }
    return util.spawn_creep(room, roleHarvester, ae);
};

var try_build = function(room) {
    var success = room_layout.create_next_construction_site(room.name);
    console.log("Was able to build: " + success);
};
 
var run_room = function(room) {
    var ae = room.energyAvailable;
    var ac = room.energyCapacityAvailable;
    if (ac - ae < 1) {
        var err_code = try_spawn(room, ae);
    }
    if (Game.time % 5 == 0 && room.memory[constants.NUM_BUILDERS]) {
        if(room.find(FIND_CONSTRUCTION_SITES).length == 0) {
            try_build(room);
        }
    }
    
    var source_delay = room.memory[constants.SOURCE_DELAY];
    for(var source_id in source_delay) {
        source_delay[source_id] = Math.max(0, source_delay[source_id] - 0.75);
    }
};

module.exports = {
    run_room: run_room,
    start_phase: start_phase,
    end_phase: end_phase
};