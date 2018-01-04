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
var transportRole = require('party.creep.transport');
var claimerRole = require('party.creep.claimer');

 var memory_init = function (room_of_origin) {
    return {origin_room_name: room_of_origin.name,
    scout_name: null,
    claimer_name: null,
    builder_name: null,
    transport_names: [],
    
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
    // TODO
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

// For now just build the spawn, in the future build the first 5 extensions.
var build_room = function (party_memory) {
    // TODO
    // Do miner first, then builder, then transport
    // Miner can produce resources while things are happenning
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