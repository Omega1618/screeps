/*
 * if finished is true when the transport_request is started, then the request will be ignored (useful for requests enqueued multiple times)
 * only one of source or target should be defined, the other should be undefined.  The transport request asks a transport creep to pick source up or deposit to target
 *
 * the callback functions get called when the corresponding event occurs:
 * start: the moment of dequeuing
 * end: when the creep has finished the job
 */
 
 function Make_Transport_Request() {
     var tr = {
         finished: false,
         started: false,
         source: undefined,
         source_type: undefined,
         target: undefined,
         type: undefined,
         
         start_callback: null,
         end_callback: null
     }
     return tr;
 }

module.exports = Make_Transport_Request;