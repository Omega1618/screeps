// TODO, totally not done, also need to set up Memory data strctures

// Party module should have the same methods as creep modules except without the 'suggested_body' method.  -- Also include an extra method to detect if the party is disbanded.
// When a party module is created, it should check if Memory.parties exists and create it if it does not.
// Parties should request resources, including spawning, from their home rooms.
// Most parties should start with a scout to know what is needed.

// This file should run all parties, regarless of rooms, and should run shutdown methods when parties are disbanded. -- Just like creep.utilities
// Should also include a method for creating parties.

var constants = require('creep.constants');

var pe = constants.party_enum;
var party_module_id_to_module = {};
party_module_id_to_module[pe.DEFEND] = require('party.defend');
party_module_id_to_module[pe.ATTACK] =  require('party.attack');
party_module_id_to_module[pe.CLAIM] = require('party.claim');
party_module_id_to_module[pe.LONG_DISTANCE_MINE] = require('party.long_distance_mine');
party_module_id_to_module[pe.TRANSPORT] = require('party.transport');
party_module_id_to_module[pe.MINE_POWER] = require('party.mine_power');

var get_module_from_id = function(party_id) {
    var party_memory = Memory.parties[party_id];
    for (var module_id in party_module_id_to_module) {
        if(party_memory.module_id == module_id) {
            return party_module_id_to_module[module_id];
        }
    } 
    return null;
}

var run_party = function(party_id) {
    var party_memory = Memory.parties[party_id];
    get_module_from_id(party_id).run(party_memory);
};

var cleanup_party = function(party_id) {
    var party_memory = Memory.parties[party_id];
    get_module_from_id(party_id).shutdown(party_memory);
	delete Memory.parties[party_id];
};

var disband_party = function(party_id) {
    var party_memory = Memory.parties[party_id];
    get_module_from_id(party_id).force_disband(party_memory);
};

var run_parties = function() {
    if (!_.has(Memory, 'parties')) {
        Memory.parties = {};
    }
    
    for (let party_id in Memory.parties) {
        var party_memory = Memory.parties[party_id];
        var module = get_module_from_id(party_id);
        
    	if (module.should_disband(party_memory)) {
    		cleanup_party(party_id);
    	} else {
            run_party(party_id);
    	}
    }
};

var create_party = function(room, party_module_id) {
    var module = party_module_id_to_module[party_module_id];
    if (module === null) {
        return null;
    }
    // TODO Potential overflow error
    var party_id = Memory.party_counter || 1;
    var party_memory = module.memory_init(room);
    if (!party_memory) {
        return null;
    }
    // We assume Memory.parties exists
    Memory.parties[party_id] = party_memory;
    module.startup(party_memory);
    Memory.party_counter = party_id + 1;
    return party_id;
};

var is_active = function(party_id) {
    return Boolean(Memory.parties[party_id]);
}

module.exports = {
    run_parties: run_parties,
    create_party: create_party,
    disband_party: disband_party,
    is_active: is_active,
    
    run_party: run_party,
    cleanup_party: cleanup_party
};
