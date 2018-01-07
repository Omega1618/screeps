// prototypes
require('room.prototype');
require("Traveler");
require('extend_lodash');

var creep_utilities = require('creep.utilities');
var party_manager = require('party.manager');
var room_manager = require('room.manager');
var stats = require('empire.stats');

module.exports.loop = function () {
    
    var tick = Game.time;
    // console.log("Debug tick: " + tick);
    // console.log("CPU used start: " + Game.cpu.getUsed());
    
    party_manager.run_parties();
    creep_utilities.run_creeps();
    room_manager.run_rooms();
    
    if (tick % 15000 == 0) stats.clear_old_room_stats(30000);

    // console.log("CPU used end: " + Game.cpu.getUsed());
}

/** // Uncomment after respawn to clear memory
module.exports.loop = function () { require('utilities.respawn').reset(); }
// **/