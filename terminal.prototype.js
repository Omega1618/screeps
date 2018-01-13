'use strict'

StructureTerminal.prototype.canReceive = function (resource = false) {
  const buffer = this.getBuffer()
  if (buffer < 50000) {
    if (buffer > 5000) {
      // Transfer energy to help terminal drain itself of excess resources.
      if (resource === RESOURCE_ENERGY && this.store[RESOURCE_ENERGY] < 5000) {
        return true
      }
    }
    return false
  }
  return true
}

StructureTerminal.prototype.getBuffer = function () {
  return this.storeCapacity - _.sum(this.store)
}