// TODO, totally not done, also need to set up room data strctures

/**
 *
 * This class stays in its origin room
 * Can steal transport creeps and other creeps from the origin room
 * Should use the available energy in the storage to spawn defensive creeps if necessary.
 * Should also refill the tower from storage if necessary (but don't get drained)
 * Need to think about when to trigger safe mode
 *
 * TODO doesn't take into account possibly multiple players, might be good anyway since alliances exist.  But may want to attack player creeps over invaders.
 **/
 
var creep_util = require('creep.utilities');
var constants = require('creep.constants');

 var memory_init = function (room_of_origin) {
    var towers = room_of_origin.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
    for (var i = 0; i < towers.length; ++i) {
        towers[i] = towers[i].id;
    }
    
    return {origin_room_name: room_of_origin.name,
    tower_ids: towers, 
    creep_names: [],
    
    healing_parts: 0,
    offense_parts: 0,
    total_hits: 0,
    enemy_creeps: {},
    
    finished: false,
    module_id: constants.party_enum.DEFEND
    };
 };
 
 var scan_threats = function(party_memory) {
     // TODO should try to keep track of creeps the just move out of the room
     var room = Game.rooms[party_memory.origin_room_name];
     if (!room) return;
     var enemy_creeps = room.find(FIND_HOSTILE_CREEPS);
     
     // remove old enemy creeps
     party_memory.enemy_creeps = {};
     party_memory.total_hits = 0;
     party_memory.healing_parts = 0;
     party_memory.offense_parts = 0;
     
     for (var i = 0; i < enemy_creeps.length; ++i) {
         var enemy_creep = enemy_creeps[i];
         /*
         if (party_memory.enemy_creeps[enemy_creep.id]) {
             var old_info = party_memory.enemy_creeps[enemy_creep.id];
             party_memory.total_hits -= old_info.hits;
             party_memory.healing_parts -= old_info.num_heal;
             party_memory.offense_parts -= old_info.num_attack;
             party_memory.offense_parts -= old_info.num_ranged;
         }
         */
         
         var info = {
             hits: enemy_creep.hits,
             num_heal: 0,
             num_ranged: 0,
             num_attack: 0,
             tough: 0,
             ttl: enemy_creep.ticksToLive, // time to live
             last_update: Game.time
         };
         var body = enemy_creep.body;
         for (var j = 0; j < body.length; ++j) {
             switch (body[j].type) {
                 case HEAL:
                    ++info.num_heal;
                    break;
                 case ATTACK:
                    ++info.num_attack;
                    break;
                 case RANGED_ATTACK:
                    ++info.num_ranged;
                    break;
                 case TOUGH:
                    ++info.tough;
                    break;
             }
         }
         
         party_memory.total_hits += info.hits;
         party_memory.healing_parts += info.num_heal;
         party_memory.offense_parts += info.num_attack;
         party_memory.offense_parts += info.num_ranged;
         party_memory.enemy_creeps[enemy_creep.id] = info;
     }
 };
 
var startup =  function (party_memory) {
   scan_threats(party_memory);
};

var towers_attack = function(party_memory, target) {
    for (var i = 0; i < party_memory.tower_ids.length; ++i) {
        var tower = Game.getObjectById(party_memory.tower_ids[i]);
        if (tower) {
            tower.attack(target);
        }
    }
}

var run =  function (party_memory) {
    if (Game.time % 5 == 0) scan_threats(party_memory);
    if (party_memory.offense_parts > 0 || party_memory.healing_parts > 0) {
        var tower = Game.getObjectById(party_memory.tower_ids[0]); // TODO remove the non-existent towers before this loop.
        // TODO find closest target and attack, later implement more advanced behavior.
    } else {
        party_memory.finished = true;
    }
   //TODO
   //TODO use safemodes
   //TODO, before disbanding you should send a scout to see if enemies are in the room they came from.
};

var should_disband =  function (party_memory) {
   return party_memory.finished;
};

var force_disband = function (party_memory) {
    party_memory.finished = true;
};
 
 var shutdown = function (party_memory) {
    creep_util.all_creeps_to_recyclers(_.map(party_memory.creep_names, function(name){ return Game.creeps[name]; } ));
 };

module.exports = {
  memory_init: memory_init,
  startup: startup,
  run: run,
  should_disband: should_disband,
  force_disband: force_disband,
  shutdown: shutdown 
};