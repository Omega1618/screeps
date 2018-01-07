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
 *      Should put this in stats but have it be set in stats from here.
 * TODO need to calculate the correct amount of WORKER parts on MINERS and CARRY parts on harvesters for both unreserved and reserved rooms.
 *          For now just assume things aren't reserved and use a fixed size miner and transporter.
 **/
 
var constants = require('creep.constants');
var stats_module = require('empire.stats');
var WorldPosition = require("WorldPosition");

var party_util = require('party.utilities');
var room_utils = require('room.utilities'); 

var callback_util = require('utilities.call_back');
var Make_Transport_Request = require("utilities.transport_request");
 
var recyclerRole = require('creep.recycler');
var scoutRole = require('party.creep.scout');
var minerRole = require('party.long_distance_mine.creep.miner');
var transportRole = require('party.creep.transport');

const HAS_REMOTE_MINING = 'mining';

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
    if (Game.creeps[party_memory.scout_name] && !Game.creeps[party_memory.scout_name].memory.finished) {
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
        if (Game.rooms[adj_room_name] && Game.rooms[adj_room_name].controller && Game.rooms[adj_room_name].controller.my) continue;
        // TODO may want to check individual sources for source keeps instead of whole rooms, will have to change stats.
        var has_source_keeper = stats_module.get_room_stat(adj_room_name, stats_module.room_stat_names.CONTAINS_SOURCE_KEEPER);
        if (has_source_keeper) continue;
        
        room_sources.forEach(function(source_stat_obj) {
            if (!source_stat_obj[HAS_REMOTE_MINING]) adj_sources.push({
                pos: new RoomPosition(source_stat_obj.x, source_stat_obj.y, adj_room_name), 
                id: source_stat_obj.id,
                stats_object: source_stat_obj
            });
        });
    }

    // set party_memory.source_object
    var origin_mid_point = new RoomPosition(25, 25, party_memory.origin_room_name); // TODO change this to be the first spawn in the room's list of spawns
    origin_mid_point = WorldPosition(origin_mid_point);
    var target = _.minBy(adj_sources, function (adj_s) {
        return origin_mid_point.getRangeTo(WorldPosition(adj_s.pos));
    });
    if (target) {
        target.stats_object[HAS_REMOTE_MINING] = true;
        target.stats_object = undefined;
        party_memory.source_object = target;
    } else {
        party_memory.finished = true;
    }
}

/**
var transport_reset_request_callback = callback_util.register_callback_fn( function(creep_name) {
    var creep = Game.creeps[creep_name];
    if (creep && creep.memory.pickup_request) {
        delete creep.memory.pickup_request;
    }
});

var make_pickup_request = function(creep) {
    var request = Make_Transport_Request();
    request.source = creep.id;
    request.type = RESOURCE_ENERGY;
    request.source_type = constants.TRANSPORT_SOURCE_TYPES.CREEP;
    request.end_callback = callback_util.register_callback(transport_reset_request_callback, creep.name);
    
    creep.memory.pickup_request = request;
    
    room_utils.add_to_transport_queue(creep.room, constants.REMOTE_MINING_IMPORT_PRIORITY, request, true);
};
**/

var return_energy_to_storage = function(creep) {
    var storage = creep.room.storage;
    if (!storage) return ERR_INVALID_TARGET;
    
    var request = Make_Transport_Request();
    request.target = target.id;
    request.type = RESOURCE_ENERGY;
    return transportRole.add_request(creep, request);
};

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
    
    var creep_room = creep.room;
    if (should_return_energy) {
        if (creep_room.name == party_memory.origin_room_name) {
            
            if (creep.carry.energy <= creep.carryCapacity * 0.2 || room_utils.get_transport_queue_length(creep_room, false) == 0) {
                var err_code = return_energy_to_storage(creep)
                if (err_code != ERR_INVALID_TARGET) return err_code;
            }
            var request = room_utils.get_from_transport_queue(creep_room, false);
            if (request) return transportRole.add_request(creep, request);
            
            return creep.travelToCachedPath();
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
        delete party_memory.adjacent_rooms;
    } 
    // Target exists
    
    // Spawn things we don't have
    if (!party_memory.miner_name && party_util.can_help(origin_room) && origin_room.energyAvailable >= 400) {
        var miner_name = party_util.spawn_creep_get_name(origin_room, minerRole, 400);
        if (miner_name) {
            party_memory.miner_name = miner_name;
        }
    } else if (party_memory.transport_names.length == 0 && party_util.can_help(origin_room) && origin_room.energyAvailable >= 450) {
        var transport_name = party_util.spawn_creep_get_name(origin_room, transportRole, Math.min(600, origin_room.energyAvailable));
        if (transport_name) {
            party_memory.transport_names.push(transport_name);
        }
    }
    
    var miner = party_memory.miner_name;
    if (miner) {
        miner = Game.creeps[miner];
    }
    if (miner) {
        if (!miner.memory.source_id) minerRole.set_new_target(miner, party_memory.source_object.pos.roomName, party_memory.source_object.id);
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
   // disband if miner takes damage and alert the room of origin that you're under attack (differential npc invaders vs other players)
   var attacked = false;
   if (miner && miner.hits < miner.hitsMax) attacked = true;
   for (var i = 0; i < old_transport_names.length; ++i) {
       var transport = old_transport_names[i];
       if (transport) {
           transport = Game.creeps[transport];
       }
       if (transport && transport.hits < transport.hitsMax) attacked = true;
   }
   if (attacked) {
       party_memory.finished = true;
       // TODO alert the room of origin
   }
};

var should_disband =  function (party_memory) {
   return party_memory.finished;
};

var force_disband = function (party_memory) {
    party_memory.finished = true;
};
 
 var shutdown = function (party_memory) {
    // mark the mined source as no longer being mined
    var source_object = party_memory.source_object;
    if (source_object) {
        var room_sources = stats_module.get_room_stat(source_object.pos.roomName, stats_module.room_stat_names.SOURCE_LOCATIONS);
        if (room_sources) {
            for (var i = 0; i < room_sources.length; ++i) {
                var stats_obj = room_sources[i];
                if (stats_obj.id == source_object.id && stats_obj[HAS_REMOTE_MINING]) {
                    delete stats_obj[HAS_REMOTE_MINING];
                    break;
                } 
            }
        }
    }
     // recycle creeps
    recyclerRole.name_to_recycler(party_memory.scout_name, scoutRole.shutdown_creep);
    recyclerRole.name_to_recycler(party_memory.miner_name, minerRole.shutdown_creep);
    for (var i = 0; i < party_memory.transport_names.length; ++i) {
        recyclerRole.name_to_recycler(party_memory.transport_names[i], transportRole.shutdown_creep);
    }
 };
 
var get_throughput = function (party_memory) {
    var throughput = 0;
    for (var i = 0; i < party_memory.transport_names.length; ++i) {
        var creep = Game.creeps[party_memory.transport_names[i]];
        if (creep) throughput += transportRole.get_throughput(creep);
    }
    return throughput;
};

module.exports = {
  get_throughput: get_throughput,
    
  memory_init: memory_init,
  startup: startup,
  run: run,
  should_disband: should_disband,
  force_disband: force_disband,
  shutdown: shutdown 
};