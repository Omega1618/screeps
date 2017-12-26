var constants = require('creep.constants');

var re = constants.role_enum;
var role_id_to_module = {};
// room creeps
role_id_to_module[re.HARVESTER] = require('creep.harvester');
role_id_to_module[re.BUILDER] =  require('creep.builder');
role_id_to_module[re.UPGRADER] = require('creep.upgrader');
role_id_to_module[re.RECYCLER] = require('creep.recycler');
role_id_to_module[re.DROP_MINER] = require('creep.phase2.drop_miner');
role_id_to_module[re.STATIC_BUILDER] = require('creep.phase2.static_builder');
role_id_to_module[re.TRANSPORT] = require('creep.phase2.transport');
role_id_to_module[re.STATIC_UPGRADER] = require('creep.phase2.static_upgrader');
role_id_to_module[re.REPAIRER] = require('creep.phase2.repairer');
// party defend creeps
role_id_to_module[re.PARTY_DEFEND_MELEE_DEFENDER] = require('party.defend.creep.melee_defender');


var run_creep = function(creep) {
    for(var role_id in role_id_to_module) {
        if(creep.memory.role == role_id) {
            role_id_to_module[role_id].run(creep);
            break;
        }
    }
};

var cleanup_creep = function(creep_name) {
    var creep_memory = Memory.creeps[creep_name];
    for(var role_id in role_id_to_module) {
        if(creep_memory.role == role_id) {
            role_id_to_module[role_id].shutdown_creep(creep_memory);
            break;
        }
    }
	delete Memory.creeps[creep_name];
};

var run_creeps = function() {
    for (let name in Memory.creeps){
    	if (!Game.creeps[name]){
    		cleanup_creep(name);
    	} else {
            run_creep(Game.creeps[name]);
    	}
    }
};

var all_creeps_to_recyclers = function(creeps) {
    var roleRecycler = role_id_to_module[re.RECYCLER];
    creeps.forEach(function (creep) {
        var creep_name = creep.name;
        var creep_body = creep.body.forEach(function(bpart) {
            return bpart.type;
        });
        cleanup_creep(creep_name);
        Memory.creeps[creep_name] = roleRecycler.memory_init(creep.room, creep_body);
        roleRecycler.startup_creep(Memory.creeps[creep_name]);
    });
}

module.exports = {
    run_creep: run_creep,
    run_creeps: run_creeps,
    cleanup_creep: cleanup_creep,
    all_creeps_to_recyclers: all_creeps_to_recyclers
};