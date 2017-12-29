'use strict'

/**
 *
 */
 
// adapted from https://github.com/ScreepsQuorum/screeps-quorum/blob/a8de79d623ade9f69e6821c3d2c5afd763a5055d/src/programs/city/fortify.js

// Any rampart under this value is considered "decaying" and prioritized.
const DECAY_LIMIT = 30000

class CityFortify {
  constructor (room_name) {
    this.data = {}
    this.data.room = room_name
  }

  getDescriptor () {
    return this.data.room
  }
  
  suicide() {
      this.__finished = true
      return false
  }

  main () {
    if (!Game.rooms[this.data.room]) {
      return this.suicide()
    }

    this.room = Game.rooms[this.data.room]
    this.rampartLevels = this.room.getRoomSetting('RAMPART_LEVELS')
    this.defenses = this.room.getDefenseMap()

    // Since the rampart segments aren't garrunteed to be present catch the error for when they are not.
    let planned
    try {
      planned = this.defenses.isPlanned()
    } catch (err) {
      return false
    }

    if (!planned) {
      // console.log("Defense map not planned")
      // this.defenses.generate()
      // this.defenses.save()
      return false
    }

    if (!this.rampartLevels) {
      return false
    }

    if (!_.values(this.rampartLevels).some(a => a > 0)) {
      return false
    }

    return this.getTarget()
  }

  /*
    Attempts to get new target for the builder creeps to work on, prioritized in this order:
      * Construction sites,
      * Structures below the minimum threshold (to prevent ramparts from timing out),
      * Missing structures,
      * Structure with the lowest percentage of hit points compared to desired amount.
  */
  getTarget () {
    const sites = this.room.find(FIND_MY_CONSTRUCTION_SITES, {'filter': function (site) {
      return site.structureType === STRUCTURE_RAMPART || site.structureType === STRUCTURE_WALL
    }})
    if (sites.length > 0) {
      return sites[0]
    }

    let structures = this.defenses.getAllStructures()
    let types = Object.keys(structures)
    // Prioritize missing sites based off of type.
    types.sort((a, b) => b - a)

    let missing = []
    let structureMap = {}
    let decaying = []
    for (let type of types) {
      if (!this.rampartLevels[type]) {
        continue
      }
      for (let position of structures[type]) {
        // Don't build structure ramparts unless there's a structure.
        if (type === RAMPART_PRIMARY_STRUCTURES || type === RAMPART_SECONDARY_STRUCTURES) {
          if (position.lookFor(LOOK_STRUCTURES).length <= 0) {
            continue
          }
        }

        const wall = position.getStructureByType(STRUCTURE_WALL)
        if (wall && wall.hits < WALL_HITS_MAX) {
          structureMap[wall.id] = wall.hits / this.rampartLevels[type]
          continue
        }
        const rampart = position.getStructureByType(STRUCTURE_RAMPART)
        if (rampart && rampart.hits < RAMPART_HITS_MAX[this.room.controller.level]) {
          if (rampart.hits <= DECAY_LIMIT) {
            decaying.push(rampart)
          }
          structureMap[rampart.id] = rampart.hits / this.rampartLevels[type]
          continue
        }
        missing.push(position)
      }
    }

    let target
    if (decaying.length > 0) {
      decaying.sort((a, b) => a.hits - b.hits)
      target = decaying[0]
    } else {
      const potentialTargets = Object.keys(structureMap).sort(function (a, b) {
        return structureMap[a] - structureMap[b]
      })
      target = potentialTargets.length > 0 ? Game.getObjectById(potentialTargets[0]) : false
    }
    if (missing.length > 0 && (!target || target.hits > DECAY_LIMIT)) {
      // Add structure
      let type = STRUCTURE_RAMPART
      if (this.defenses.getStructureAt(missing[0].x, missing[0].y) === WALL_GATEWAY) {
        type = STRUCTURE_WALL
      }
      var err_code = this.room.createConstructionSite(missing[0], type)
      if(!err_code) {
          const c_sites = missing[0].lookFor(LOOK_CONSTRUCTION_SITES)
          if (c_sites.length > 0) {
              return c_sites[0]
          }
      }
      return false
    }
    if (!target) {
      return false
    }
    return target
  }
}

module.exports = CityFortify