// right now everything in this module is manual.
// uncomment reset code in main

var reset_memory = function() {
    for (let prop in Memory) {
        delete Memory[prop];
    }
    Memory.creeps = {};
    Memory.rooms = {};
    Memory.flags = {};
    Memory.spawns = {};
};

var reset = function() {
    reset_memory();
}

module.exports = {
    reset: reset
};