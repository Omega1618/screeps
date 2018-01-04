/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utilities.call_back');
 * mod.thing == 'a thing'; // true
 */
 
 //TODO Memory.next_callback_id could overflow
 var fns = {};
 var next_fn_id = 1;
 if (!_.has(Memory, 'callbacks')) {
    Memory.callbacks = {};
    Memory.next_callback_id = 1;
 }
 
 var register_callback_fn = function(fn) {
     fns[next_fn_id] = fn;
     var result = next_fn_id;
     next_fn_id++;
     return result;
 };
 
 var get_callback_fn = function(fn_id) {
     return fns[fn_id];
 };
 
 var register_callback = function(fn_id, context) {
     // console.log("Register: " + Memory.next_callback_id + ", fn_id: " + fn_id + ", " + context);
     Memory.callbacks[Memory.next_callback_id] = {fn_id: fn_id, context:context};
     ++Memory.next_callback_id;
     return Memory.next_callback_id - 1;
 }

 var exec = function(cb_id) {
     if (cb_id === null) {
         return;
     }
     // console.log('exec: ' + cb_id);
     var fn = get_callback_fn(Memory.callbacks[cb_id].fn_id);
     // console.log(Memory.callbacks[cb_id].fn_id);
     fn(Memory.callbacks[cb_id].context);
     delete Memory.callbacks[cb_id];
 }
 
 var copy_callback = function(cb_id) {
     if (!cb_id) {
         return;
     }
     // console.log('copy: ' + cb_id);
     // console.log(Memory.callbacks[cb_id].fn_id);
     Memory.callbacks[Memory.next_callback_id] = {fn_id: Memory.callbacks[cb_id].fn_id, context:Memory.callbacks[cb_id].context};
     ++Memory.next_callback_id;
     // console.log(cb_id + " to " + (Memory.next_callback_id - 1));
     return Memory.next_callback_id - 1;
 }
 
 var del = function(cb_id) {
     if (cb_id) {
        delete Memory.callbacks[cb_id];
     }
 }

module.exports = {
    register_callback_fn:register_callback_fn,
    get_callback_fn:get_callback_fn,
    register_callback:register_callback,
    exec:exec,
    del:del
    //copy_callback:copy_callback
};