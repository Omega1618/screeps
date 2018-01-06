// TODO, totally not done, also need to set up room data strctures

/**
 *
 * First send out a scout, if the scout finds a suitable room then,
 * From its home room the party should request a drop miner and a transporter
 * The transporter's body should be calculated so that it exactly matches the miner's output
 * Then have each do the appropriate thing
 * The transporter should carry back energy to the home room, drop it, then create a request to pick it up.
 *
 * TODO should make an entry in stats for rooms that construction planning failed.
 *
 * Can probably do this with 1 miner, 1 transport, and 1 builder.  You first need to claim the room with a claimer, but the claimer can be immediately recycled.
 * Edit, with the way the builder is set up, you won't need a transport.
 *
 **/

var constants = require('creep.constants');
var stats_module = require('empire.stats');

var party_util = require('party.utilities');
var room_utils = require('room.utilities'); 
var room_layout = require('room.layout');

var callback_util = require('utilities.call_back');
var Make_Transport_Request = require("utilities.transport_request");
 
var recyclerRole = require('creep.recycler');
var scoutRole = require('party.creep.scout');
// var transportRole = require('party.creep.transport');
var claimerRole = require('party.creep.claimer');
var minerRole = require('party.long_distance_mine.creep.miner');

 var memory_init = function (room_of_origin) {
    return {origin_room_name: room_of_origin.name,
    scout_name: null,
    claimer_name: null,
    builder_name: null,
    miner_name: null,
    
    target_room: null,
    is_planned: false,
    is_claimed: false,
    
    finished: false,
    module_id: constants.party_enum.CLAIM};
 };
 
var startup =  function (party_memory) {
   // pass
};
 
// For now just looks for claim flags
var get_target_room = function (party_memory) {
    
    for (let flag_name in Game.flags) {
        var flag = Game.flags[flag_name];
        if (flag.color == constants.CLAIM_COLOR && flag_name.split("_")[0] == party_memory.origin_room_name) {
            party_memory.target_room = flag.pos.roomName;
            return;
        }
    }
    
    party_memory.finished = true;
    // TODO if flag doesn't exist try to find a suitable room
};

var plan_room_layout = function (party_memory) {
    if (Memory.rooms[party_memory.target_room] 
        && Memory.rooms[party_memory.target_room].construction_planned_flag) {
        party_memory.is_planned = true;
        return;
    }
    
    if (!party_memory.scout_name && party_util.can_help(origin_room) && origin_room.energyAvailable >= 50) {
        var scout_name = party_util.spawn_creep_get_name(origin_room, scoutRole, 50);
        if (scout_name) {
            party_memory.scout_name = scout_name;
        }
    }
    
    var scout = party_memory.scout_name;
    if (scout) scout = Game.creeps[scout];
    if (scout) {
        scoutRole.set_new_target(scout, origin_room.name);
    } else {
        party_memory.scout_name = null;
    }
    
    var target_room = Game.rooms[party_memory.target_room];
    if (target_room) {
        if(!room_layout.plan_layout(party_memory.target_room)) {
            // TODO record that this room is uninhabitable in stats.
            party_memory.finished = true;
        }
    }
};

var claim_room = function (party_memory) {
    var origin_room = Game.rooms[party_memory.origin_room_name];
    if (!origin_room) {
        party_memory.finished = true;
        return;
    }
    
    if (!party_memory.claimer_name && party_util.can_help(origin_room) && origin_room.energyAvailable >= 650) {
        var claimer_name = party_util.spawn_creep_get_name(origin_room, claimerRole, 650);
        if (claimer_name) {
            party_memory.claimer_name = claimer_name;
        }
    }
    
    var claimer = party_memory.claimer_name;
    if (claimer) claimer = Game.creeps[claimer];
    if (claimer) {
        claimerRole.set_new_target(claimer, origin_room.name, true);
    } else {
        party_memory.claimer_name = null;
    }
};

var build_room = function (party_memory) {
    
    // TODO Spawn things we don't have
    /**
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
    */
    
    // TODO just build the miner and builde in that order and set their target rooms to the target room.
    // TODO Finish when room enters phase 2
    // TODO there will be a hiccup when the spawn finished and the controller is level 1, you won't be able to build extensions until RCL2.
    // You can see this when the builder's finished flag is true.
    // TODO in the mean time, just have the builder transfer energy to the spawn from the miner.
    // TODO If the builder dies and the spawn exists, just disband the party
};

var run = function (party_memory) {
    if (!party_memory.target_room) get_target_room(party_memory);
    if (!party_memory.target_room) return;
    
    if (!party_memory.is_planned) plan_room_layout(party_memory);
    if (!party_memory.is_planned) return;
    
    // TODO check that the room has a controller before this point.
    party_memory.is_claimed = Game.rooms[party_memory.target_room] && Game.rooms[party_memory.target_room].controller.my;
    if (!party_memory.is_claimed) {
        claim_room(party_memory);
        return;
    }
    
    build_room(party_memory);
};

var should_disband =  function (party_memory) {
   return party_memory.finished;
};

var force_disband = function (party_memory) {
    party_memory.finished = true;
};
 
 var shutdown = function (party_memory) {
    // TODO
 };
 
module.exports = {
  memory_init: function (room_of_origin) { return {module_id: null} },
  startup: function (party_memory) {},
  run: function (party_memory) {},
  force_disband: function (party_memory) {},
  should_disband: function (party_memory) {},
  shutdown: function (party_memory) {} 
};