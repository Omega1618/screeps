var creep_utilities = require('creep.utilities');
var room_manager = require('room.manager');

module.exports.loop = function () {
    
    console.log("Debug tick: " + Game.time);
    console.log("CPU used start: " + Game.cpu.getUsed());
    creep_utilities.run_creeps();
    room_manager.run_rooms();
    console.log("CPU used end: " + Game.cpu.getUsed());
}