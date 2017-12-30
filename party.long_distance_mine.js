// TODO, totally not done, also need to set up room data structures

/**
 *
 * First send out a scout, if the scout finds a suitable room then,
 * From its home room the party should request a drop miner and a transporter
 * The transporter's body should be calculated so that it exactly matches the miner's output
 * Then have each do the appropriate thing
 * The transporter should carry back energy to the home room, drop it, then create a request to pick it up.
 * This party should estimate its energy income to the original room so that it can manage its spawning.
 * This party may also need to defend itself from attackers
 * room statistics should be cached.
 *
 * TODO -- should also be aware of threating creeps and stop requesting resources if they appear (and also alert surrounding rooms of threat)
 * TODO -- in the future you may want to avoid mining from rooms adjacent to hostile rooms.
 * TODO -- need to communicate to the origin room on whether it makes sense to try to create this party.  
 * For example, if we find no good sources or all adjacent rooms are occupied or all adjacent rooms are already being mined.
 **/
 
var constants = require('creep.constants');
var stats_module = require('empire.stats');
var party_util = require('party.utilities');
 
var recyclerRole = require('creep.recycler');
var scoutRole = require('party.creep.scout');
var minerRole = require('');
var transportRole = require('');

 var memory_init = function (room_of_origin) {
    return {origin_room_name: room_of_origin.name,
    // Scouting info
    scout_name: null,
    adjacent_rooms: null, 
    // Mining info
    target_room: null,
    miner_name: null,
    transport_names: [],
    finished: false,
    module_id: constants.party_enum.LONG_DISTANCE_MINE};
 };
 
var startup =  function (party_memory) {
   party_memory.adjacent_rooms = Game.map.describeExits(party_memory.origin_room_name);
};

var find_target_room = function(party_memory) {    
    if (Game.creeps[party_memory.scout_name] && !Game.creeps[party_memory.scout_name].finished) {
        return;
    }
    
    var origin_room = Game.rooms[party_memory.origin_room_name];
    // Find adjacent sources and trigger a scout if a room's information is missing.
    var adj_rooms = party_memory.adjacent_rooms;
    var all_rooms_scouted = true;
    var adj_sources = [];
    
    for (let direction in adj_rooms) {
        var adj_room_name = adj_rooms[direction];
        
        // Skip over hostile rooms and my rooms and rooms that already have a remote mining party in them.
        var is_hostile = stats_module.get_room_stat(adj_room_name, stats_module.room_stat_names.HOSTILE);
        if (is_hostile) {
            continue;
        }
        if (Game.rooms[adj_room_name] && Game.rooms[adj_room_name].room.controller && Game.rooms[adj_room_name].room.controller.my) {
            continue
        }
        // TODO check for existing remote mining parties.
        
        var room_sources = stats_module.get_room_stat(adj_room_name, stats_module.room_stat_names.SOURCE_LOCATIONS);
        if (room_sources) {
            room_sources.forEach(function(pos) {
                adj_sources.push(new RoomPosition(pos.x, pos.y, adj_room_name));
            });
        } else {
            var scout_name = party_util.scout_room(party_memory.scout_name, adj_room_name, origin_room);
            if (scout_name) {
                party_memory.scout_name = scout_name;
            }
            all_rooms_scouted = false;
            break;
        }
    }
    if (!all_rooms_scouted) {
        return;
    }

    // set party_memory.target_room
    var origin_mid_point = new RoomPosition(25, 25, party_memory.origin_room_name);
    var target = origin_mid_point.findClosestByRange(adj_sources);
    if (target) {
        party_memory.target_room = target.roomName;
    } else {
        party_memory.finished = true;
    }
}

var run = function (party_memory) {
    if (party_memory.finished) {
        return;
    }
    var origin_room = Game.rooms[party_memory.origin_room_name];
    if (!origin_room) {
        party_memory.finished = true;
        return;
    }
        
    if (!party_memory.target_room) {
        find_target_room(party_memory);
        if (!party_memory.target_room) {
            return;
        }
        
        // Recycle the scout
        var scout = party_memory.scout_name;
        if (scout) {
            scout = Game.creeps[scout];
        }
        if (scout) {
            recyclerRole.name_to_recycler(party_memory.scout_name, scoutRole.shutdown_creep);
            party_memory.scout_name = null;
        }
    } 
    // Target exists
    
    if (!party_memory.miner_name) {
        // TODO
    }
    
   // TODO
   // disband when drop miner dies
};

var should_disband =  function (party_memory) {
   return party_memory.finished;
};

var force_disband = function (party_memory) {
    party_memory.finished = true;
};
 
 var shutdown = function (party_memory) {
    recyclerRole.name_to_recycler(party_memory.scout_name, scoutRole.shutdown_creep);
    recyclerRole.name_to_recycler(party_memory.miner_name, minerRole.shutdown_creep);
    for (var i = 0; i < transport_ids.length; ++i) {
        recyclerRole.name_to_recycler(party_memory.transport_names[i], transportRole.shutdown_creep);
    }
 };

module.exports = {
  memory_init: memory_init,
  startup: startup,
  run: run,
  should_disband: should_disband,
  force_disband: force_disband,
  shutdown: shutdown 
};