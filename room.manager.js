var phase1 = require("room.phase1");
var phase2 = require("room.phase2");
var creep_util = require('creep.utilities');

var num_extensions = function(room) {
    return room.find(FIND_MY_STRUCTURES, {filter: {structureType:STRUCTURE_EXTENSION}}).length;
}

var check_switch_phase = function(room) {
    if (!_.has(room.memory, "phase")) {
        phase1.start_phase(room);
        room.memory.phase = 1;
    }
    if (Game.time % 200 == 0) {
        switch (room.memory.phase) {
            case 1:
                if (num_extensions(room) >= 5 && room.energyAvailable >= 100) {
                    console.log("Switch to phase 2.");
                    phase1.end_phase(room);
                    phase2.start_phase(room);
                    room.memory.phase = 2;
                }
                break;
            case 2:
                break;
            default:
                break;
        }
    }
};

var get_phase_module = function (room) {
    switch (room.memory.phase) {
        case 1: return phase1;
        case 2: return phase2;
        default: return null;
    }
};

var run_room = function(room) {
    if(!room.controller.my) {
        return;
    }
    check_switch_phase(room);
    var phase_module = get_phase_module(room);
    if (phase_module) phase_module.run_room(room);
};

var can_help = function(room) {
    if(!room.controller.my) {
        return false;
    }
    var phase_module = get_phase_module(room);
    if (phase_module) phase_module.can_help(room);
};

// For manual use only, may result in bad things
// TODO this code is actually bad, you shouldn't recycle creeps that are in parties that are in the room.
var reset_room = function(room) {
    var phase_module = get_phase_module(room);
    if (phase_module) {
        creep_util.all_creeps_to_recyclers(room.find(FIND_MY_CREEPS));
        phase_module.end_phase(room);
        phase_module.start_phase(room);
    }
};

module.exports = {
    /** @param {Room} room **/
    run_room: run_room,
    can_help: can_help,
    reset_room: reset_room,
    
    run_rooms: function() {
        for(var name in Game.rooms) {
            run_room(Game.rooms[name]);
        }
    }
};