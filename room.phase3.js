/**
 *
 * The transition to phase 3 should happen at RCL3
 * This phase should try to be as low CPU as possible.
 * This means using fixed paths for miners (with links), upgraders, etc. whenever possible.
 * This is especially important for transports, since they're pathing is massive.
 * This also means using as few creeps as possible.  Builder and repairer should be 1 creep.  This creep can also transport too and from storage to terminal.
 *
 **/