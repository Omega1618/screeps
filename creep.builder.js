var constants = require('creep.constants');
var roleHarvester = require('creep.harvester');

var memory_init = function(room, creep_body) {
    var memory = roleHarvester.memory_init(room, creep_body);
    memory.role = constants.role_enum.BUILDER;
    memory.building = false;
    return memory;
};


var startup_creep = function(creep_memory) {
    var source = Game.getObjectById(creep_memory.source_id);
    source.room.memory[constants.WORK_SOURCE_COUNTER_NAME][creep_memory.source_id] += creep_memory.num_work;
    source.room.memory[constants.NUM_BUILDERS] += 1;
};

var shutdown_creep = function(creep_memory) {
    var source = Game.getObjectById(creep_memory.source_id);
    source.room.memory[constants.WORK_SOURCE_COUNTER_NAME][creep_memory.source_id] -= creep_memory.num_work;
    source.room.memory[constants.NUM_BUILDERS] -= 1;
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
        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        if(targets.length) {
            if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0]);
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