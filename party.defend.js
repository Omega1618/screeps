// TODO, totally not done, also need to set up room data strctures

/**
 *
 * This class stays in its origin room
 *
 **/
 
var creep_util = require('creep.utilities');

 var memory_init = function (room_of_origin) {
    var towers = room_of_origin.find(FIND_MY_STRUCTURES, {filter {structureType: STRUCTURE_TOWER}});
    for (var i = 0; i < towers.length; ++i) {
        towers[i] = towers[i].id;
    }
    return {origin_room_name: room_of_origin.name,
    tower_ids: towers,
    scount_target: null, 
    creep_ids: []};
 };
 
var startup =  function (party_memory) {
   //TODO
}

var run =  function (party_memory) {
   //TODO
}

var should_disband =  function (party_memory) {
   //TODO, before disbanding you should send a scout to see if enemies are in the room they came from.
}
 
 var shutdown = function (party_memory) {
    creep_util.all_creeps_to_recyclers(party_memory.creep_ids);
 };

module.exports = {
  memory_init: function (room_of_origin) {},
  startup: function (party_memory) {},
  run: function (party_memory) {},
  should_disband: function (party_memory) {},
  shutdown: function (party_memory) {} 
};