Room.prototype.isMy = function() {
    return Game.rooms[this.name] && Game.rooms[this.name].controller && Game.rooms[this.name].controller.my;
}