/*

Queue.js

A function to represent a queue

Created by Stephen Morley - http://code.stephenmorley.org/ - and released under
the terms of the CC0 1.0 Universal legal code:

http://creativecommons.org/publicdomain/zero/1.0/legalcode

*/

/* Creates a new queue. A queue is a first-in-first-out (FIFO) data structure -
 * items are added to the end of the queue and removed from the front.
 */
var Queue = {

  // initialise the queue and offset
  make: function() {
      return {queue:[], offset:0};
  },

  // Returns the length of the queue.
  getLength: function(obj){
    return (obj.queue.length - obj.offset);
  },

  // Returns true if the queue is empty, and false otherwise.
  isEmpty: function(obj){
    return (obj.queue.length == 0);
  },

  /* Enqueues the specified item. The parameter is:
   *
   * item - the item to enqueue
   */
  enqueue: function(obj, item){
    obj.queue.push(item);
  },

  /* Dequeues an item and returns it. If the queue is empty, the value
   * 'undefined' is returned.
   */
  dequeue: function(obj){

    // if the queue is empty, return immediately
    if (obj.queue.length == 0) return undefined;

    // store the item at the front of the queue
    var item = obj.queue[obj.offset];

    // increment the offset and remove the free space if necessary
    if (++obj.offset * 2 >= obj.queue.length){
      obj.queue  = obj.queue.slice(obj.offset);
      obj.offset = 0;
    }

    // return the dequeued item
    return item;

  },

  /* Returns the item at the front of the queue (without dequeuing it). If the
   * queue is empty then undefined is returned.
   */
  peek: function(obj){
    return (obj.queue.length > 0 ? obj.queue[obj.offset] : undefined);
  }

}

/**
   * Returns undefined if empty
   **/
var getMaxPriority = function(queues) {
      var max_p = undefined;
      for (var p in queues) {
          if (max_p === undefined || max_p < p) {
              max_p = p;
          }
      }
      return max_p;
  }
  
var MultiQueue = {
      
  // initialise the queue and offset
  make: function() {
      return {};
  },

  // Returns the length of the queue.
  getLength: function(queues){
      var length = 0;
      for (var p in queues) {
          length += Queue.getLength(queues[p]);
      }
      return length;
  },

  // Returns true if the queue is empty, and false otherwise.
  isEmpty : function(queues){
    return Object.keys(queues).length == 0;
  },

  /* Enqueues the specified item. The parameter is:
   *
   * item - the item to enqueue
   */
  enqueue: function(queues, priority, item){
      if(!_.has(queues, priority)) {
          queues[priority] = Queue.make();
      }
      Queue.enqueue(queues[priority], item);
  },

  /* Dequeues an item and returns it. If the queue is empty, the value
   * 'undefined' is returned.
   */
  dequeue: function(queues){

    var max_p = getMaxPriority(queues);
    if (max_p === undefined) {
        return undefined;
    }

    var item = Queue.dequeue(queues[max_p]);
    if (Queue.isEmpty(queues[max_p])) {
        delete queues[max_p];
    }

    return item;
  },

  /* Returns the item at the front of the queue (without dequeuing it). If the
   * queue is empty then undefined is returned.
   */
  peek: function(){
    var max_p = getMaxPriority(queues);
    if (max_p === undefined) {
        return undefined;
    }
    
    return Queue.peek(queues[max_p]);
  }
}

module.exports = MultiQueue;