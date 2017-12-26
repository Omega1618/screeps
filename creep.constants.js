/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('creep.constants');
 * mod.thing == 'a thing'; // true
 */
 
 
var role_enum =  {HARVESTER:0, BUILDER:1, UPGRADER:2, DROP_MINER:3, STATIC_BUILDER: 4, PARTY_DEFEND_MELEE_DEFENDER: 5, TRANSPORT: 6, STATIC_UPGRADER: 7, REPAIRER: 8, RECYCLER: 9};

var party_enum = {DEFEND: 0, ATTACK: 1, CLAIM: 2, LONG_DISTANCE_MINE: 3, TRANSPORT: 4, MINE_POWER: 5};

var basic_body = function(energy) {
    if (energy < 200) {
        return null;
    }
    var body = [CARRY, MOVE, WORK];
    energy -= 200;
    for (var i = 0; energy >= 0; ++i) {
        var part = WORK;
        var cost = BODYPART_COST.work;
        if (i % 3 == 1) {
            part = MOVE;
            cost = BODYPART_COST.move;
        }
        if (i % 3 == 2) {
            part = CARRY;
            cost = BODYPART_COST.carry;
        }
        body.push(part);
        energy -= cost;
    }
    body.pop();
    return body;
};

var transport_queue_names = {TRANSPORT_QUEUES: "t_que", SOURCE: 0, TARGET: 1}
var transport_souce_types = {POSITION:0, RESOURCE:1, CREEP:2, STRUCTURE:3};

module.exports = {
    role_enum: role_enum,
    RECYCLER_CALLBACK_MEMORY: "rec_cb",
    
    WORK_SOURCE_COUNTER_NAME: "w_sc",
    SAFE_SOURCES: "ss",
    NUM_SAFE_SOURCES: "n_ss",
    SOURCE_DELAY: "sd",
    
    NUM_HARVESTERS: "n_h",
    NUM_UPGRADERS: "n_u",
    NUM_BUILDERS: "n_b",
    
    // Phase 2 room memory
    DROP_MINER_TRACKER: "dm_t",
    TRANSPORT_STRUCTURE_ENERGY_REQUEST: "er",
    BUILDER_WORKER_PARTS: "er",
    UPGRADER_WORKER_PARTS: "er",
    
    NUM_DROP_MINERS: "n_dm",
    NUM_STATIC_BUILDER: "n_sb",
    NUM_STATIC_UPGRADER: "n_su",
    NUM_TRANSPORT: "n_t",
    NUM_REPAIRER: "n_r",
    
    // DROP_MINER
    DROP_MINER_REQUEST_ENERGY: 100,
    DROP_MINER_PRIORITY_REQUEST_ENERGY: 250,
    
    // Repairer
    REPAIRER_REPAIR_THRESHOLD: 0.75,
    REPAIRER_PRIORITY_REPAIR_THRESHOLD: 0.3,
    
    // TRANSPORT
    TRANSPORT_IDLE_PRIORITY: -999,
    
    // Transport Queues
    TRANSPORT_QUEUE_CONSTANTS: transport_queue_names,
    TRANSPORT_SOURCE_TYPES: transport_souce_types,
    TRANSPORT_REQUEST_TRACKER: 'trt',
    TRANSPORT_REQUEST_TRACKER_NEXT_ID: 'trt_id',
    
    // Sources
    DROP_MINIER_PRIORITY: 0,
    DROP_MINIER_HIGH_PRIORITY: 1,
    
    // Sinks
    SPAWNER_REQUEST_PRIORITY: 0,
    STATIC_UPGRADER_PRIORITY: 0,
    STATIC_UPGRADER_REQUEST_ENERGY: 20,
    STATIC_BUILDER_PRIORITY: 0,
    STATIC_BUILDER_REQUEST_ENERGY: 20,
    REPAIRER_PRIORITY: 0,
    REPAIRER_REQUEST_ENERGY: 10,
    
    // Parties
    party_enum: party_enum,
    
    basic_body: basic_body
};