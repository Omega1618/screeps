/**
 *
 * Should try to target unguarded things like remote mining rooms and rooms without towers.
 * For now just spawn a ranged healer that always runs away from anything that can kill him.
 *
 **/

var constants = require('creep.constants');
var stats_module = require('empire.stats');

var party_util = require('party.utilities');
var room_utils = require('room.utilities');
 
var recyclerRole = require('creep.recycler');
var scoutRole = require('party.creep.scout');
var abstractRole = require('party.creep.abstract');
var harasserRole = Object.assign({}, abstractRole);

harasserRole.suggested_body = function(energy) {
    // multiples of [TOUGH, TOUGH, RANGED_ATTACK, HEAL, MOVE, MOVE, MOVE, MOVE]
    if (energy < 620) {
        return null;
    }
    energy = energy - (energy % 620);
    var num_tough = energy / 620 * 2;
    var num_attack = energy / 620 * 1;
    var num_heal = num_attack;
    var num_move = energy / 620 * 4;
    var body = [];
    for (var i = 0; i < num_tough; ++i) body.push(TOUGH);
    for (var i = 0; i < num_attack; ++i) body.push(RANGED_ATTACK);
    for (var i = 1; i < num_heal; ++i) body.push(HEAL); // 1 less so we can put one at the end
    for (var i = 0; i < num_move; ++i) body.push(MOVE);
    body.push(HEAL);
    return body;
};

 var memory_init = function (room_of_origin) {
    return {origin_room_name: room_of_origin.name,
    target_room: null,
    
    scout_name: null,
    harasser_name: null,
    
    finished: false,
    module_id: constants.party_enum.HARASS};
 };
 
var startup =  function (party_memory) {
   // pass
};
 
var get_target_room = function (party_memory) {
    
    for (let flag_name in Game.flags) {
        var flag = Game.flags[flag_name];
        if (flag.color == constants.HARASS_COLOR && flag_name.split("_")[0] == party_memory.origin_room_name) {
            party_memory.target_room = flag.pos.roomName;
            flag.remove();
            return;
        }
    }
    
    party_memory.finished = true;
};

var run_harasser = function(party_memory, creep) {
    // Stupid harasser for now
    // TODO need to implement a pathing cost matrix in traveler that avoid all enemy creeps 
    // and stays at towers range such that the creep can out heal it.
    if (creep.hits < creep.hitsMax) creep.heal(creep);
    creep.rangedMassAttack();
    
    if (creep.hits < creep.hitsMax * 0.5 || creep.memory.retreating) {
        creep.memory.retreating = true;
        creep.travelToRoom(party_memory.origin_room_name); // TODO EscapeToRoom
        if (creep.hits >= creep.hitsMax) delete creep.memory.retreating;
        return;
    } else if (creep.room.name != party_memory.target_room) {
        creep.travelToRoom(party_memory.target_room);
        return;
    }
    
    if (!creep.memory.target) {
        creep.memory.target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (!creep.memory.target) {
                creep.memory.target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
            }
        if (creep.memory.target) {
            creep.memory.target = creep.memory.target.id;
        } else {
            party_memory.finished = true;
        }
    }
    
    var target = creep.memory.target;
    if (target) {
        var target = Game.getObjectById(target);
        if (target) {
            creep.moveTo(target);
        } else {
            delete creep.memory.target;
        }
    }
};

var run = function (party_memory) {
    if (!party_memory.target_room) get_target_room(party_memory);
    if (!party_memory.target_room) {
        force_disband(party_memory)
        return;
    }
    
    var origin_room = Game.rooms[party_memory.origin_room_name];
    if (!origin_room) {
        party_memory.finished = true;
        return;
    }
    
    // Spawn things we don't have
    if (!party_memory.harasser_name && party_util.can_help(origin_room) && origin_room.energyAvailable >= 620) {
        var harasser_name = party_util.spawn_creep_get_name(origin_room, harasserRole, origin_room.energyAvailable);
        if (harasser_name) {
            party_memory.harasser_name = harasser_name;
        }
    }
    
    if (party_memory.harasser_name) {
        var harasser_name = party_memory.harasser_name;
        var harasser = Game.creeps[harasser_name];
        run_harasser(party_memory, harasser);
    }
};

var should_disband =  function (party_memory) {
   return party_memory.finished;
};

var force_disband = function (party_memory) {
    party_memory.finished = true;
};
 
 var shutdown = function (party_memory) {
    recyclerRole.name_to_recycler(party_memory.scout_name, scoutRole.shutdown_creep);
    recyclerRole.name_to_recycler(party_memory.harasser_name, abstractRole.shutdown_creep);
 };
 
module.exports = {
  memory_init: memory_init,
  startup: startup,
  run: run,
  force_disband: force_disband,
  should_disband: should_disband,
  shutdown: shutdown 
};