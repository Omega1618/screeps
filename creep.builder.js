var constants = require('creep.constants');
var roleHarvester = require('creep.harvester');

var memory_init = function(room, creep_body) {
    var memory = roleHarvester.memory_init(room, creep_body);
    memory.role = constants.role_enum.BUILDER;
    memory.building = false;
    memory.build_target = null;
    return memory;
};


var startup_creep = function(creep_memory) {
    var source = Game.getObjectById(creep_memory.source_id);
    source.room.memory[constants.WORK_SOURCE_COUNTER_NAME][creep_memory.source_id] += creep_memory.num_work;
    source.room.memory[constants.NUM_BUILDERS] += 1;
};

var shutdown_creep = function(creep_memory) {
    var source = Game.getObjectById(creep_memory.source_id);
    if (source.room.memory[constants.WORK_SOURCE_COUNTER_NAME]) {
        source.room.memory[constants.WORK_SOURCE_COUNTER_NAME][creep_memory.source_id] -= creep_memory.num_work;
        source.room.memory[constants.NUM_BUILDERS] -= 1;
    }
};

/** @param {Creep} creep **/
var run = function(creep) {

    if(creep.memory.building && creep.carry.energy == 0) {
        creep.memory.building = false;
    }
    if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
        creep.memory.building = true;
    }

    if(creep.memory.building) {
        var b_target = creep.memory.build_target;
        if (b_target) {
            b_target = Game.getObjectById(b_target);
        }
        
        if (!b_target) {
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length) {
                b_target = targets[0];
                creep.memory.build_target = b_target.id;
            } else {
                b_target = null;
                creep.memory.build_target = null;
            }
        }
        
        if(b_target) {
            if(creep.build(b_target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(b_target);
            }
        } else {
            var targets = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.hits / structure.hitsMax) < 0.75;
                    }
            });
            if(targets.length > 0) {
                if(creep.repair(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0]);
                }
            } else {
                roleHarvester.run(creep);
            }
        }
    } else {
        roleHarvester.harvest_source(creep);
    }
};

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: constants.basic_body
};