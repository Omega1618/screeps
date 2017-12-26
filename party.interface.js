// This file just defines the party module interface

module.exports = {
  memory_init: function (room_of_origin) {},
  startup: function (party_memory) {},
  run: function (party_memory) {},
  should_disband: function (party_memory) {},
  shutdown: function (party_memory) {} 
};