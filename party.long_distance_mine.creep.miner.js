// TODO totally not done, also not yet a role in the role_enum

var constants = require('creep.constants');

var memory_init = function(room, creep_body) {
    var num_work = creep_body.filter(function(e) {return e == WORK}).length;
    return {target_room_name:null, source_id:null, harvested:0, role: constants.role_enum.PARTY_LONG_DISTANCE_MINE_MINER, num_work:num_work};
};

var startup_creep = function(creep_memory) {
};

var shutdown_creep = function(creep_memory) {
};

/** @param {Creep} creep **/
var run = function(creep) {
    var current_room = creep.room;
    if (current_room.name != creep.memory.target_room_name) {
        creep.travelTo(new RoomPos(25, 25, creep.memory.target_room_name));
        return;
    }
    
    var source_id = creep.memory.source_id;
    if (!source_id) {
        var original_sources = current_room.find(FIND_SOURCES);
        var sources = original_sources;
        var source_keepers = current_room.find(FIND_STRUCTURES, {
            filter: { structureType: STRUCTURE_KEEPER_LAIR }
        });
        source_keepers.forEach(function(sk){
            var unsafe_source = sk.pos.findClosestByRange(FIND_SOURCES);
            sources = _.filter(sources, function(s){ return s.id != unsafe_source.id;});
        });
        var target_source = creep.pos.findClosestByPath(sources);
        if (!target_source) {
            target_source = creep.pos.findClosestByPath(original_sources);
        }
        if(!target_source) {
            creep.suicide();
            return;
        }
        creep.memory.source_id = target_source.id;
    }
    
    var source = Game.getObjectById(source_id);
    if (source === null) {
        creep.suicide();
        return;
    }
    
    var err_code = creep.harvest(source);
    if(err_code == ERR_NOT_IN_RANGE) {
        var err_code = creep.travelTo(source);
    }
    if (err_code == OK) {
        creep.memory.harvested += creep.memory.num_work * HARVEST_POWER;
    }
};

var suggested_body = function(energy) {
    if (energy < 150) {
        return null;
    }
    var full_body = [MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, TOUGH];
    var body = [];
    for (var i = 0; i < full_body.length && energy >= 0; ++i) {
        body.push(full_body[i]);
        energy -= BODYPART_COST[full_body[i]];
    }
    body.pop();
    return body;
};

var set_new_target = function(creep, room_name, source_id = null) {
    creep.memory.target_room_name = room_name;
    creep.memory.source_id = source_id;
}

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body, set_new_target: set_new_target
};