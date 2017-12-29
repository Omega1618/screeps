var constants = require('creep.constants');

var memory_init = function(room, creep_body) {
    var source = -1;
    var min_count = Number.POSITIVE_INFINITY; 
    var source_to_harvester_map = room.memory[constants.WORK_SOURCE_COUNTER_NAME];
    var source_delay = room.memory[constants.SOURCE_DELAY];
    for (var source_id in source_to_harvester_map) {
        if (source_to_harvester_map[source_id] < min_count) {
            source = source_id;
            min_count = source_to_harvester_map[source_id] + 0.1 * source_delay[source_id];
        }
    }
    
    var num_work = creep_body.filter(function(e) {return e == WORK}).length;
    
    return {source_id:source, role: constants.role_enum.HARVESTER, num_work:num_work, no_path_counter:0, harvest_target:null};
};

var startup_creep = function(creep_memory) {
    var source = Game.getObjectById(creep_memory.source_id);
    source.room.memory[constants.WORK_SOURCE_COUNTER_NAME][creep_memory.source_id] += creep_memory.num_work;
    source.room.memory[constants.NUM_HARVESTERS] += 1;
};

var shutdown_creep = function(creep_memory) {
    var source = Game.getObjectById(creep_memory.source_id);
    if (source.room.memory[constants.WORK_SOURCE_COUNTER_NAME]) {
        source.room.memory[constants.WORK_SOURCE_COUNTER_NAME][creep_memory.source_id] -= creep_memory.num_work;
        source.room.memory[constants.NUM_HARVESTERS] -= 1;
    }
};

var harvest_source = function(creep) {
    var source = Game.getObjectById(creep.memory.source_id);
    if (source === null) {
        creep.suicide();
        return;
    }
    
    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
        var err_code = creep.moveTo(source);
        if(err_code == ERR_NO_PATH) {
            creep.memory.no_path_counter += 1;
            var source_delay = creep.room.memory[constants.SOURCE_DELAY];
            if (source_delay) {
                source_delay[creep.memory.source_id] += 1;
            } else {
                return; // Stupid error can occur where the creep accidentally leaves the room -- this is the only necessary handling.
            }
            if(creep.memory.no_path_counter >= 7) {
                var new_source_id = _.sample(creep.room.memory[constants.SAFE_SOURCES]);
                creep.room.memory[constants.WORK_SOURCE_COUNTER_NAME][creep.memory.source_id] -= creep.memory.num_work;
                creep.room.memory[constants.WORK_SOURCE_COUNTER_NAME][new_source_id] += creep.memory.num_work;
                creep.memory.source_id = new_source_id;
                creep.memory.no_path_counter = 0;
            }
        } else {
            creep.memory.no_path_counter = Math.max(0, creep.memory.no_path_counter - 2);
        }
    }
};

/** @param {Creep} creep **/
var run = function(creep) {
    if(creep.carry.energy < creep.carryCapacity) {
        harvest_source(creep);
    }
    else {
        var target = creep.memory.harvest_target;
        if(!target) {
            target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                            structure.energy < structure.energyCapacity;
                    }
            });
            creep.memory.harvest_target = target;
        }
        if(target) {
            var err_code = creep.transfer(target, RESOURCE_ENERGY);
            if(err_code == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
            if(!err_code) {
                creep.memory.harvest_target = null;
            }
        }
    }
};

var suggested_body = function(energy) {
    return constants.basic_body(Math.min(1000, energy));
};

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body, harvest_source:harvest_source
};