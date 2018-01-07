var constants = require('creep.constants');
var MultiQueue = require('utilities.queue');
var callback_util = require('utilities.call_back');

var spawn_creep_with_name = function(room, creep_module, energy) {
    var spawners = room.find(FIND_MY_STRUCTURES, {
        filter: {structureType: STRUCTURE_SPAWN}
    });
    var spawner = spawners[0];
    
    var creep_counter = Memory.creep_counter | 1;
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
    return {err_code: error_code, name: creep_name};
};

var spawn_creep = function(room, creep_module, energy) {
    return spawn_creep_with_name(room, creep_module, energy).err_code;
};

var try_build_road_random = function(room) {
    var rand_creep = _.sample(room.find(FIND_MY_CREEPS));
    var pos = rand_creep.pos;
    return room.createConstructionSite(pos, STRUCTURE_ROAD);
};

// TODO room.memory[constants.TRANSPORT_REQUEST_TRACKER_NEXT_ID] may overflow
var check_and_init_transport_queues = function(room) {
    
    if (room.memory[constants.TRANSPORT_QUEUE_CONSTANTS.TRANSPORT_QUEUES]) {
        return;
    }
    
    var t_queues = {};
    t_queues[constants.TRANSPORT_QUEUE_CONSTANTS.SOURCE] = MultiQueue.make();
    t_queues[constants.TRANSPORT_QUEUE_CONSTANTS.TARGET] = MultiQueue.make();
    room.memory[constants.TRANSPORT_QUEUE_CONSTANTS.TRANSPORT_QUEUES] = t_queues;
    room.memory[constants.TRANSPORT_REQUEST_TRACKER] = {};
    room.memory[constants.TRANSPORT_REQUEST_TRACKER_NEXT_ID] = 1;
}

var transport_request_mark_ignore = function(room, request) {
    room.memory[constants.TRANSPORT_REQUEST_TRACKER][request.id] = true;
};

var transport_request_should_ignore = function(room, request) {
    if (request.id === null) {
        return false;
    }
    return room.memory[constants.TRANSPORT_REQUEST_TRACKER][request.id];
};

var clear_impl = function(room, queue) {
    var new_queue = MultiQueue.make();
    while (true) {
        var result = MultiQueue.dequeue_with_priority(queue);
        if (!result) return new_queue;
        var request = result.item;
        var priority = result.priority;
        if (transport_request_should_ignore(room, request)) {
            callback_util.del(request.start_callback);
            callback_util.del(request.end_callback);
        } else {
            MultiQueue.enqueue(new_queue, priority, request);
        }
    }
};

var clear_ignored_requests = function(room) {
    var t_queues = room.memory[constants.TRANSPORT_QUEUE_CONSTANTS.TRANSPORT_QUEUES];
    t_queues[constants.TRANSPORT_QUEUE_CONSTANTS.SOURCE] = clear_impl(room, t_queues[constants.TRANSPORT_QUEUE_CONSTANTS.SOURCE]);
    t_queues[constants.TRANSPORT_QUEUE_CONSTANTS.TARGET] = clear_impl(room, t_queues[constants.TRANSPORT_QUEUE_CONSTANTS.TARGET]);
};

/**
 * Enqueue each request at most once
 **/
var add_to_transport_queue = function(room, priority, request, source) {
    // console.log("Adding request to transport queue");
    // for (var p in request) {
    //     console.log(p + ": " + request[p]);
    // }
    check_and_init_transport_queues(room);
    
    if (request.id === null) {
        request.id = room.memory[constants.TRANSPORT_REQUEST_TRACKER_NEXT_ID];
        ++room.memory[constants.TRANSPORT_REQUEST_TRACKER_NEXT_ID];
        room.memory[constants.TRANSPORT_REQUEST_TRACKER][request.id] = false;
    }
    
    if (request.id % 50 == 0) clear_ignored_requests(room);
    
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
    check_and_init_transport_queues(room);
    
    var t_queues = room.memory[constants.TRANSPORT_QUEUE_CONSTANTS.TRANSPORT_QUEUES];
    var queue = null;
    if (source) {
        queue = t_queues[constants.TRANSPORT_QUEUE_CONSTANTS.SOURCE];
    } else {
        queue = t_queues[constants.TRANSPORT_QUEUE_CONSTANTS.TARGET];
    }
    
    while (true) {
        var request = MultiQueue.dequeue(queue);
        if (request) {
            delete room.memory[constants.TRANSPORT_REQUEST_TRACKER][request.id];
        } else {
            return request;
        }
        
        if (transport_request_should_ignore(room, request)) {
            callback_util.del(request.start_callback);
            callback_util.del(request.end_callback);  
        } else {
            return request;
        }
    }
};

var get_transport_queue_length = function(room, is_source) {
    check_and_init_transport_queues(room);
    
    var t_queues = room.memory[constants.TRANSPORT_QUEUE_CONSTANTS.TRANSPORT_QUEUES];
    var queue = null;
    if (is_source) {
        queue = t_queues[constants.TRANSPORT_QUEUE_CONSTANTS.SOURCE];
    } else {
        queue = t_queues[constants.TRANSPORT_QUEUE_CONSTANTS.TARGET];
    }
    return MultiQueue.getLength(queue);
};

module.exports = {
    spawn_creep_with_name: spawn_creep_with_name,
    spawn_creep: spawn_creep,
    try_build_road_random: try_build_road_random,
    add_to_transport_queue: add_to_transport_queue,
    get_from_transport_queue: get_from_transport_queue,
    get_transport_queue_length: get_transport_queue_length,
    transport_request_mark_ignore: transport_request_mark_ignore,
    transport_request_should_ignore: transport_request_should_ignore
};