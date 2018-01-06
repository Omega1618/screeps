var constants = require('creep.constants');
var stats_module = require('empire.stats');
var room_layout = require('room.layout');

var memory_init = function(room, creep_body) {
    return {target_room_name:null, target_site_id:null, err_code: OK, finished: true, role: constants.role_enum.PARTY_BUILDER};
};

var startup_creep = function(creep_memory) {
};

var shutdown_creep = function(creep_memory) {
};

var recharge = function (creep) {
    creep.memory.is_recharging = true;
    // pick up energy and finish recharging immediately or find an energy source.
    if (creep.memory.resource_id) {
        var resource = Game.getObjectById(creep.memory.resource_id);
        if (resource) {
            var err_code = creep.pickup(resource);
            if (err_code == ERR_NOT_IN_RANGE) {
                creep.travelTo(resource);
            } else if (err_code == OK || err_code == ERR_FULL) {
                delete creep.memory.is_recharging;
            } else if (err_code == ERR_INVALID_TARGET) {
                creep.memory.resource_id = null;
            }            
        } else {
            creep.memory.resource_id = null;
        }
        return;
    }
    
    if (creep.memory.source_id) {        
        var source = Game.getObjectById(creep.memory.source_id);
        if (source) {
            var err_code = creep.harvest(resource);
            if (err_code == ERR_NOT_IN_RANGE) {
                creep.travelTo(source);
            } else if (err_code == ERR_FULL) {
                delete creep.memory.is_recharging;
            } else if (err_code == ERR_INVALID_TARGET) {
                creep.memory.source_id = null;
            }            
        } else {
            creep.memory.source_id = null;
        }        
        if (creep.carry.energy >= creep.carry.carryCapacity) delete creep.memory.is_recharging;
        return;
    }
    
    var resources = creep.room.find(FIND_DROPPED_ENERGY);
    if (resources.length > 0) {
        creep.memory.resource_id = resources[0].id;
        return;
    }
    
    var source = creep.pos.findClosestByRange(FIND_SOURCES);
    if (source) {
        creep.memory.source_id = source.id;
    }
}

/** @param {Creep} creep **/
var run = function(creep) {
    var target_room_name = creep.memory.target_room_name;
    if(!target_room_name) {
        creep.memory.err_code = OK;
        return;
    }
    
    if (!creep.memory.finished) {
        var current_room = creep.room;
        if (room.name == target_room_name) {
            if (creep.memory.is_recharging || creep.carry.energy == 0) {
                recharge(creep);
                return;
            }
            
            if (!creep.memory.target_site_id) { 
                    var cite = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
                    if (cite) creep.memory.target_site_id = cite.id;
            }            
            if (!creep.memory.target_site_id) { 
                if (!room_layout.create_next_construction_site(room.name)) {
                    creep.memory.finished = true;
                    return;
                }
                var cite = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
                if (cite) creep.memory.target_site_id = cite.id;
            }
            
            if (creep.memory.target_site_id) {
                var con_cite = Game.getObjectById(creep.memory.target_site_id);
                if (!con_cite) {
                    creep.memory.target_site_id = null;
                    return;
                }
                creep.memory.err_code = creep.build(con_cite);
                if (creep.memory.err_code == ERR_NOT_IN_RANGE) creep.memory.err_code = creep.travelTo(con_cite);
                
            }
            
        } else {
            creep.memory.err_code = creep.travelToRoom(target_room_name);
        } 
    }
};

var suggested_body = function(energy) {
    
    if (energy <= 750) return null;
    var body = [CARRY, CARRY, CARRY, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
    energy -= 750;
    for (var i = 0; i < 3 && energy >= 100; ++i) {
        body.push(MOVE);
        body.push(CARRY);
        energy -= 100;
    }
    
    return body;
};

var set_new_target = function(creep, room_name) {
    creep.memory.target_room_name = room_name;
    creep.memory.finished = false;
}

var is_finished = function(creep) {
    return creep.memory.finished;
}

module.exports = {memory_init:memory_init, run:run, startup_creep:startup_creep, shutdown_creep:shutdown_creep,
                  suggested_body: suggested_body, set_new_target: set_new_target, is_finished: is_finished
};