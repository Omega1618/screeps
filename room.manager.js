var phase1 = require("room.phase1");
var phase2 = require("room.phase2");

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

var run_room = function(room) {
    if(!room.controller.my) {
        return;
    }
    check_switch_phase(room);
    switch (room.memory.phase) {
        case 1:
            phase1.run_room(room);
            break;
        case 2:
            phase2.run_room(room);
            break;
        default:
            break;
    }
};

module.exports = {
    /** @param {Room} room **/
    run_room: run_room,
    
    run_rooms: function() {
        for(var name in Game.rooms) {
            run_room(Game.rooms[name]);
        }
    }
};