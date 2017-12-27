// TODO, totally not done, also need to set up room data structures

/**
 *
 * First send out a scout, if the scout finds a suitable room then,
 * From its home room the party should request a drop miner and a transporter
 * The transporter's body should be calculated so that it exactly matches the miner's output
 * Then have each do the appropriate thing
 * The transporter should carry back energy to the home room, drop it, then create a request to pick it up.
 *
 * TODO -- should also be aware of threating creeps and stop requesting resources if they appear (and also alert surrounding rooms of threat)
 **/
 
var recyclerRole = require('creep.recycler');
var constants = require('creep.constants');

var scoutRole = require('');
var minerRole = require('');
var transportRole = require('');

 var memory_init = function (room_of_origin) {
    return {origin_room_name: room_of_origin.name,
    // Scouting info
    scout_id: null,
    room_info: null, 
    // Mining info
    target_room: null,
    miner_id: null,
    transport_ids: [],
    finished: false,
    module_id: constants.party_enum.LONG_DISTANCE_MINE};
 };
 
var startup =  function (party_memory) {
   //TODO
};

var get_creep = function(creep_id) {
    if (creep_id) {
        var creep = Game.getObjectById(creep_id);
        if (creep) {
            return creep;
        }
    }
    return null;
}

var run =  function (party_memory) {
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
    recyclerRole.id_to_recycler(party_memory.scout_id, scoutRole.shutdown_creep);
    recyclerRole.id_to_recycler(party_memory.miner_id, minerRole.shutdown_creep);
    for (var i = 0; i < transport_ids.length; ++i) {
        recyclerRole.id_to_recycler(party_memory.transport_ids[i], transportRole.shutdown_creep);
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