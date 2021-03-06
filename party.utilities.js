var scoutRole = require('party.creep.scout');
var room_manager = null;
var room_utilities = require('room.utilities');

var get_creep_by_id = function(creep_id) {
    if (creep_id) {
        var creep = Game.getObjectById(creep_id);
        if (creep) {
            return creep;
        }
    }
    return null;
};

// Returns undefined if the creep fails to spawn, otherwise returns the creep's name.
var spawn_creep_get_name = function(room, creep_module, energy) {
    var result = room_utilities.spawn_creep_with_name(room, creep_module, energy);
    if (result.err_code === OK) {
        return result.name;
    }
    return undefined;
};

// Returns the creep name if spawned, otherwise returns undefined
// Don't use this if the party has a high priority, this can wait for a long time.
var scout_room = function (scout_name, target_room_name, origin_room) {
    var scout = scout_name;
    if (scout) {
        scout = Game.creeps[scout_name];
    }
    if (scout) {
        if (!scoutRole.is_finished(scout) || scout.spawning) return undefined;
        scoutRole.set_new_target(scout, target_room_name);
        return undefined;
    }
    if (room_manager == null) {
        room_manager = require('room.manager'); // Lazy require to resolve circular dependency.  TODO fix the circular dependency.
    }
    if (room_manager.can_help(origin_room)) {
        return spawn_creep_get_name(origin_room, scoutRole, 50);
    }
    return undefined;
};

var can_help = function(room) {
    if (room_manager == null) {
        room_manager = require('room.manager'); // Lazy require to resolve circular dependency.  TODO fix the circular dependency.
    }
    return room_manager.can_help(room);
};

module.exports = {
    get_creep_by_id: get_creep_by_id,
    spawn_creep_get_name: spawn_creep_get_name,
    can_help: can_help,
    scout_room: scout_room
};