# screeps

# Overview

The script is divided into:
Rooms
Room creeps
Parties
Party creeps
utilities

# Rooms
Room scripts start with rooms and manage data structures and tasks specific to the room.
Files start with room.

# Room creeps
These creeps will only work within one room.
Rooms are expected to generate these creeps and support data structures that they need.
Files start with creep.

# Parties
Parties are inter-room entities that fufill specific tasks.
They manage data structures specific to the tasks.
Files start with party.

# Party creeps
The room creep analogy to parties.
These creeps are controlled by the party, not the room.
Parties are expected to ask rooms to generate these creeps.
Files start with party.<party_name>.creep.

# General design pattern
creep's run method should be the only thing necessary to get the creep's work to be done.
The same is true of rooms and parties.
Creeps coordinate with their owning entity.  This is either a room or a party.
Rooms currently do not yet coordinate with any other rooms.  At the moment they are the highest level entity.
Rooms general launch parties and support their requests for resources.  Thus a party is owned by a room.  However, parties' can change their owners.