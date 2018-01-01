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
 *      For example, if we find no good sources or all adjacent rooms are occupied or all adjacent rooms are already being mined.
 *      Should put this in stats but have it be set here.
 * TODO need to calculate the correct amount of WORKER parts on MINERS and CARRY parts on harvesters for both unreserved and reserved rooms.
 *          For now just assume things aren't reserved and use a fixed size miner and transporter.
 **/
 
var constants = require('creep.constants');
var stats_module = require('empire.stats');
var party_util = require('party.utilities');
var room_utils = require('room.utilities'); 
var callback_util = require('utilities.call_back');
var Make_Transport_Request = require("utilities.transport_request");
 
var recyclerRole = require('creep.recycler');
var scoutRole = require('party.creep.scout');
var minerRole = require('party.long_distance_mine.creep.miner');
var transportRole = require('party.creep.transport');

 var memory_init = function (room_of_origin) {
    return {origin_room_name: room_of_origin.name,
    // Scouting info
    scout_name: null,
    adjacent_rooms: null, 
    // Mining info
    source_object: null,
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
    var adj_sources = [];
    
    for (let direction in adj_rooms) {
        var adj_room_name = adj_rooms[direction];
        
        // Get the room's sources and check if it needs to be scouted
        var room_sources = stats_module.get_room_stat(adj_room_name, stats_module.room_stat_names.SOURCE_LOCATIONS);
        if (!room_sources) {
            var scout_name = party_util.scout_room(party_memory.scout_name, adj_room_name, origin_room);
            if (scout_name) {
                party_memory.scout_name = scout_name;
            }
            return;
        }
        
        // Skip over hostile rooms, my rooms, rooms with source keepers, and rooms that already have a remote mining party in them.
        var is_hostile = stats_module.get_room_stat(adj_room_name, stats_module.room_stat_names.HOSTILE);
        if (is_hostile) continue;
        if (Game.rooms[adj_room_name] && Game.rooms[adj_room_name].room.controller && Game.rooms[adj_room_name].room.controller.my) continue;
        // TODO may want to check individual sources for source keeps instead of whole rooms, will have to change stats.
        var has_source_keeper = stats_module.get_room_stat(adj_room_name, stats_module.room_stat_names.CONTAINS_SOURCE_KEEPER);
        if (has_source_keeper) continue;
        // TODO check for existing remote mining parties.
        
        room_sources.forEach(function(source_stat_obj) {
            adj_sources.push({
                pos: new RoomPosition(source_stat_obj.x, source_stat_obj.y, adj_room_name), 
                id: source_stat_obj.id
            });
        });
    }

    // set party_memory.source_object
    var origin_mid_point = new RoomPosition(25, 25, party_memory.origin_room_name); // TODO change this to be the first spawn in the room's list of spawns
    var target = _.minBy(adj_sources, function (adj_s) {
        return origin_mid_point.getRangeTo(adj_s.pos);
    });
    if (target) {
        // TODO set which source is being mined from and its locations
        // TODO mark the mined source as being mined (set the in_use proprty in the source location object in stats to true).
        party_memory.source_object = target;
    } else {
        party_memory.finished = true;
    }
}

var transport_reset_request_callback = callback_util.register_callback_fn( function(creep_name) {
    var creep = Game.creeps[creep_name];
    if (creep && creep.memory.pickup_request) {
        delete creep.memory.pickup_request;
    }
});

var transport_helper = function(creep, party_memory) {
    if (!creep.memory.finished || creep.memory.pickup_request) {
        return ERR_BUSY;
    }
    
    var should_return_energy = creep.memory.should_return_energy;
    if (should_return_energy) {
        should_return_energy = creep.carry.energy >= creep.carryCapacity * 0.05;
    } else {
        should_return_energy = creep.carry.energy >= creep.carryCapacity;
    }
    
    var miner = party_memory.miner_name;
    if (miner) {
        miner = Game.creeps[miner];
    }
    if (!miner) {
        should_return_energy = true;
    }
    
    creep.memory.should_return_energy = should_return_energy;
    
    if (should_return_energy) {
        if (creep.room.name == party_memory.origin_room_name) {
            var request = Make_Transport_Request();
            request.source = creep.id;
            request.type = RESOURCE_ENERGY;
            request.source_type = constants.TRANSPORT_SOURCE_TYPES.CREEP;
            request.end_callback = callback_util.register_callback(transport_reset_request_callback, creep.name);
            
            creep.memory.pickup_request = request;
            
            room_utils.add_to_transport_queue(creep.room, constants.REMOTE_MINING_IMPORT_PRIORITY, request, true);
        } else {
            return transportRole.move_to_room(creep, party_memory.origin_room_name);
        }
    } else {
        var request = Make_Transport_Request();
        request.source = miner.pos;
        request.type = RESOURCE_ENERGY;
        request.source_type = constants.TRANSPORT_SOURCE_TYPES.POSITION;
        
        return transportRole.add_request(creep, request);
    }
};

var run = function (party_memory) {
    if (party_memory.finished) {
        return;
    }
    var origin_room = Game.rooms[party_memory.origin_room_name];
    if (!origin_room) {
        party_memory.finished = true;
        return;
    }
        
    if (!party_memory.source_object) {
        find_target_room(party_memory);
        if (!party_memory.source_object) {
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
    
    // Spawn things we don't have
    if (!party_memory.miner_name && party_util.can_help(origin_room) && origin_room.availableEnergy >= 400) {
        var miner_name = spawn_creep_get_name(origin_room, minerRole, 400);
        if (miner_name) {
            party_memory.miner_name = miner_name;
        }
    } else if (party_memory.transport_names.length == 0 && party_util.can_help(origin_room) && origin_room.availableEnergy >= 450) {
        var transport_name = spawn_creep_get_name(origin_room, transportRole, 450);
        if (transport_name) {
            party_memory.transport_names.push(transport_name);
        }
    }
    
    var miner = party_memory.miner_name;
    if (miner) {
        miner = Game.creeps[miner];
    }
    if (miner) {
        minerRole.set_new_target(miner, party_memory.source_object.pos.roomName, party_memory.source_object.id);
    } else {
        party_memory.miner_name = null;
    }
    
    var old_transport_names = party_memory.transport_names;
    var new_tansport_names = [];
    for (var i = 0; i < old_transport_names.length; ++i) {
        var transport = old_transport_names[i];
        if (transport) {
            transport = Game.creeps[transport];
        }
        if (transport) {
            transport_helper(transport, party_memory);
            new_tansport_names.push(transport.name);
        } 
    }
    party_memory.transport_names = new_tansport_names;
    
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
     // TODO mark the mined source as no longer being mined (delete the in_use proprty from the source location object in stats). -- don't just modify the source object in your memory
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