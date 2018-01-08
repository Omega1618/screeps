// TODO may want to change the source locations stat to track which are in range of source keepers

var empire_stat_names = {
    LAST_UPDATE_TICK:0,
    CPU_MOVING_MEAN: 'cpu_mm'
};

// TODO, consider adding a check for if the room had hostile creeps upon arrival, and record the owner(s).
var room_stat_names = {
    LAST_UPDATE_TICK:0,
    SOURCE_LOCATIONS:1, // Returns a list of objects that have {x: ..., y: ..., id: source's id} -- the long distance mining party may add a flag for remote mining
    HOSTILE:2, // returns the room controller level if it is hostile and otherwise undefined (this means rooms that are known to not be hostile are also marked as undefined)
    CONTAINS_SOURCE_KEEPER:3
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
    
    stats[room_stat_names.LAST_UPDATE_TICK] = Game.time;
    update_hostile_room_stat(room_name);
    stats[room_stat_names.SOURCE_LOCATIONS] = _.map(room.find(FIND_SOURCES), function (source) { return {x:source.pos.x, y:source.pos.y, id:source.id}} );
    stats[room_stat_names.CONTAINS_SOURCE_KEEPER] = room.find(FIND_HOSTILE_STRUCTURES, {filter: {structureType: STRUCTURE_KEEPER_LAIR}}).length > 0;    
    
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
    if (!stats) {
        return undefined;
    }
    stats = stats[room_name];
    if (!stats) {
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

var cpu_moving_mean = function() {
    var cpu_used = Game.cpu.getUsed();
    var cpu_mm = empire_stat_names.CPU_MOVING_MEAN;
    Memory.stats[cpu_mm] = (Memory.stats[cpu_mm] | cpu_used) * 0.999 + 0.001 * cpu_used;
    return Memory.stats[cpu_mm];
};

module.exports = {
    empire_stat_names: empire_stat_names,
    room_stat_names: room_stat_names,
    
    populate_room_stats: populate_room_stats,
    get_room_stat: get_room_stat,
    clear_old_room_stats: clear_old_room_stats,
    
    cpu_moving_mean: cpu_moving_mean
};
