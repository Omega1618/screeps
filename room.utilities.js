var constants = require('creep.constants');
var base_lib = require("room.base_position");
var MultiQueue = require('utilities.queue');

var spawn_creep = function(room, creep_module, energy) {
    var spawners = room.find(FIND_MY_STRUCTURES, {
        filter: {structureType: STRUCTURE_SPAWN}
    });
    var spawner = spawners[0];
    
    var creep_counter = Memory.creep_counter | 0;
    var creep_name = creep_counter.toString();
    var creep_body = creep_module.suggested_body(energy);
    if(!creep_body) {
        return ERR_INVALID_ARGS;
    }
    var creep_memory = creep_module.memory_init(room, creep_body);
    if(!creep_memory) {
        return ERR_INVALID_ARGS;
    }
    
    var error_code = spawner.spawnCreep(creep_body, creep_name, {
        memory: creep_memory
    });
    if (!error_code) {
        Memory.creep_counter = creep_counter + 1;
        creep_module.startup_creep(creep_memory);
    }
    return error_code;
};

var try_build_extension = function(room, first_spawn) {
    var spawn = first_spawn;
    var spawn_pos = spawn.pos;
    var extention_poses = base_lib.getExtensionPositions();
    var err_code = OK;
    for(var i = 0; i < extention_poses.length; ++i) {
        var dx = extention_poses[i][0];
        var dy = extention_poses[i][1];
        var ext_pos = new RoomPosition(spawn_pos.x + dx, spawn_pos.y + dy, room.name);
        err_code = ext_pos.createConstructionSite(STRUCTURE_EXTENSION);
        if (err_code != ERR_INVALID_TARGET) {
            break;
        }
    }
    return err_code;
};

var try_build_road_random = function(room) {
    var rand_creep = _.sample(room.find(FIND_MY_CREEPS));
    var pos = rand_creep.pos;
    return room.createConstructionSite(pos, STRUCTURE_ROAD);
};

var add_to_transport_queue = function(room, priority, request, source) {
    // console.log("Adding request to transport queue");
    // for (var p in request) {
    //     console.log(p + ": " + request[p]);
    // }
    var t_queues = room.memory[constants.TRANSPORT_QUEUE_CONSTANTS.TRANSPORT_QUEUES];
    var queue = null;
    if (source) {
        queue = t_queues[constants.TRANSPORT_QUEUE_CONSTANTS.SOURCE];
    } else {
        queue = t_queues[constants.TRANSPORT_QUEUE_CONSTANTS.TARGET];
    }
    MultiQueue.enqueue(queue, priority, request);
};

var get_from_transport_queue = function(room, source) {
    var t_queues = room.memory[constants.TRANSPORT_QUEUE_CONSTANTS.TRANSPORT_QUEUES];
    var queue = null;
    if (source) {
        queue = t_queues[constants.TRANSPORT_QUEUE_CONSTANTS.SOURCE];
    } else {
        queue = t_queues[constants.TRANSPORT_QUEUE_CONSTANTS.TARGET];
    }
    return MultiQueue.dequeue(queue);
};

module.exports = {
    spawn_creep: spawn_creep,
    try_build_extension: try_build_extension,
    try_build_road_random: try_build_road_random,
    add_to_transport_queue: add_to_transport_queue,
    get_from_transport_queue: get_from_transport_queue
};