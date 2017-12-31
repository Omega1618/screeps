
var empire_stat_names = {
    LAST_UPDATE_TICK:0
};

// TODO, consider adding a check for if the room had hostile creeps upon arrival, and record the owner(s).
var room_stat_names = {
    LAST_UPDATE_TICK:0,
    SOURCE_LOCATIONS:1, // Returns a list of objects that have {x: ..., y: ...}
    HOSTILE:2 // returns the room controller level if it is hostile and otherwise undefined (this means rooms that are known to not be hostile are also marked as undefined)
};

var update_hostile_room_stat = function (room_name) {
    // Use Memory.empire.hostileRooms because travelTo uses it        
    if (!Memory.empire) {
        Memory.empire = {};
    }
    if (!Memory.empire.hostileRooms) {
        Memory.empire.hostileRooms = {};
    }
    
    var room = Game.rooms[room_name];
    if (room && room.controller) {
        if (room.controller.owner && !room.controller.my) {
            Memory.empire.hostileRooms[room.name] = room.controller.level;
        }
        else {
            Memory.empire.hostileRooms[room.name] = undefined;
        }
    }
}

var get_hostile_room_stat = function (room_name) {
    // Use Memory.empire.hostileRooms because travelTo uses it
    if (!Memory.empire || !Memory.empire.hostileRooms ||  !Memory.empire.hostileRooms[room_name]) {
        return undefined;
    }
    return Memory.empire.hostileRooms[room_name];
}

// Returns true if successfull, and false otherwise
var populate_room_stats = function (room_name) {
    var room = Game.rooms[room_name];
    if (!room) {
        return false;
    }
    
    if (!Memory.stats) {
        Memory.stats = {};
    }
    if (!Memory.stats.rooms) {
        Memory.stats.rooms = {};
    }
    if (!Memory.stats.rooms[room_name]) {
        Memory.stats.rooms[room_name] = {};
    }
    var stats = Memory.stats.rooms[room_name];
    
    stats[room_stat_names.LAST_UPDATE_TICK] = Game.tick;
    update_hostile_room_stat(room_name);
    stats[room_stat_names.SOURCE_LOCATIONS] = _.map(room.find(FIND_SOURCES), function (pos) { return {x:pos.x, y:pos.y}});
    
    return true;
};

// Returns undefined if the stat is unknown.  Otherwise, see the stats return values at the top of the file.
var get_room_stat = function (room_name, stat_id) {
    if (stat_id === room_stat_names.HOSTILE) {
        return get_hostile_room_stat(room_name);
    }
    
    var stats = Memory.stats;
    if (!stats) {
        return undefined;
    }
    stats = stats.rooms;
    if (stats) {
        return undefined;
    }
    stats = stats[room_name];
    if (stats) {
        return undefined;
    }
    return stats[stat_id];
};

var clear_old_room_stats = function (age) {
    var stats = Memory.stats;
    if (!stats) {
        return undefined;
    }
    stats = stats.rooms;
    if (stats) {
        return undefined;
    }
    var current_tick = Game.tick;
    var room_names = Object.keys(stats);
    for (var i = 0; i < room_names.length; ++i) {
        const room_name = room_names[i];
        const last_update_tick = get_room_stat(room_name, room_stat_names.LAST_UPDATE_TICK);
        if ((!last_update_tick || (current_tick - last_update_tick >= age)) && !Game.rooms[room_name]) {
            delete stats[room_name];
            delete Memory.empire.hostileRooms[room_name];
        }
    }
}

module.exports = {
    empire_stat_names: empire_stat_names,
    room_stat_names: room_stat_names,
    
    populate_room_stats: populate_room_stats,
    get_room_stat: get_room_stat,
    clear_old_room_stats: clear_old_room_stats
};