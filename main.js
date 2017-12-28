var creep_utilities = require('creep.utilities');
// var party_manager = require('party.manager');
var room_manager = require('room.manager');

module.exports.loop = function () {
    
    // console.log("Debug tick: " + Game.time);
    // console.log("CPU used start: " + Game.cpu.getUsed());
    creep_utilities.run_creeps();
    // party_manager.run_parties();
    room_manager.run_rooms();
    // console.log("CPU used end: " + Game.cpu.getUsed());
}

/** // Uncomment after respawn to clear memory
module.exports.loop = function () { require('utilities.respawn').reset(); }
// **/