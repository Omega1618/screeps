var constants = require('creep.constants');
var roleHarvester = require('creep.harvester');

var memory_init = function(room, creep_body) {
    var memory = roleHarvester.memory_init(room, creep_body);
    memory.role = constants.role_enum.UPGRADER;
    memory.upgrading = false;
    
    var safe_sources = _.map(room.memory[constants.SAFE_SOURCES], function(s_id){ return Game.getObjectById(s_id);});
    let goals = _.map(safe_sources, function(source) {
        // We can't actually walk on sources-- set `range` to 1 
        // so we path next to it.
        return { pos: source.pos, range: 1, id: source.id };
    });
    var best_source = room.controller.pos.findClosestByPath(goals);
    if (best_source != null) {
        memory.source_id = best_source.id;
    }
    return memory;
};

var startup_creep = function(creep_memory) {
    var source = Game.getObjectById(creep_memory.source_id);
    source.room.memory[constants.WORK_SOURCE_COUNTER_NAME][creep_memory.source_id] += creep_memory.num_work;
    source.room.memory[constants.NUM_UPGRADERS] += 1;
};

var shutdown_creep = function(creep_memory) {
    var source = Game.getObjectById(creep_memory.source_id);
    if (source.room.memory[constants.WORK_SOURCE_COUNTER_NAME]) {
        source.room.memory[constants.WORK_SOURCE_COUNTER_NAME][creep_memory.source_id] -= creep_memory.num_work;
        source.room.memory[constants.NUM_UPGRADERS] -= 1;
    }
};

/** @param {Creep} creep **/
var run = function(creep) {

    if(creep.memory.upgrading && creep.carry.energy == 0) {
        creep.memory.upgrading = false;
    }
    if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
        creep.memory.upgrading = true;
    }

    if(creep.memory.upgrading) {
        if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
        }
    }
    else {
        roleHarvester.harvest_source(creep);
    }
};

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: constants.basic_body
};