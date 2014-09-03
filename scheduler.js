!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.scheduler=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/* written in ECMAscript 6 */
/**
 * @fileoverview WAVE audio event scheduler singleton based on audio time
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 * @version 5.1.0
 */
'use strict';

var audioContext = _dereq_("audio-context");
var EventQueue = _dereq_("event-queue");

var Scheduler = (function(){var DP$0 = Object.defineProperty;

  function Scheduler() {
    this.__eventQueue = new EventQueue();

    this.__currentTime = null;
    this.__nextTime = Infinity;
    this.__timeout = null;

    /**
     * scheduler (setTimeout) period
     * @type {Number}
     */
    this.period = 0.025;

    /**
     * scheduler lookahead time (> period)
     * @type {Number}
     */
    this.lookahead = 0.1;
  }Object.defineProperties(Scheduler.prototype, {time: {"get": time$get$0, "configurable": true, "enumerable": true}});DP$0(Scheduler, "prototype", {"configurable": false, "enumerable": false, "writable": false});

  // global setTimeout scheduling loop
  Scheduler.prototype.__tick = function() {var this$0 = this;
    while (this.__nextTime <= audioContext.currentTime + this.lookahead) {
      this.__currentTime = this.__nextTime;
      this.__nextTime = this.__eventQueue.advance(this.__nextTime, this.__nextTime);
    }

    this.__currentTime = null;

    if (this.__nextTime !== Infinity) {
      this.__timeout = setTimeout(function()  {
        this$0.__tick();
      }, this.period * 1000);
    }
  }

  Scheduler.prototype.__reschedule = function(time) {
    if (this.__nextTime !== Infinity) {
      if (!this.__timeout)
        this.__tick();
    } else if (this.__timeout) {
      clearTimeout(this.__timeout);
      this.__timeout = null;
    }
  }

  /**
   * Get scheduler time
   * @return {Number} current scheduler time including lookahead
   */
  function time$get$0() {
    return this.__currentTime || audioContext.currentTime + this.lookahead;
  }

  /**
   * Add a callback to the scheduler
   * @param {Function} callback function(time, audioTime) to be called
   * @param {Number} period callback period
   * @param {Number} delay of first callback
   * @return {Object} scheduled object that can be used to call remove and reschedule
   */
  Scheduler.prototype.callback = function(callback) {var delay = arguments[1];if(delay === void 0)delay = 0;
    var object = {
      executeEvent: function(time, audioTime) {
        callback(time, audioTime);
        return Infinity;
      }
    };

    this.__nextTime = this.__eventQueue.insert(object, this.time + delay, false);
    this.__reschedule();

    return object;
  }

  /**
   * Add a periodically repeated callback to the scheduler
   * @param {Function} callback function(time, audioTime) to be called periodically
   * @param {Number} period callback period
   * @param {Number} delay of first callback
   * @return {Object} scheduled object that can be used to call remove and reschedule
   */
  Scheduler.prototype.repeat = function(callback) {var period = arguments[1];if(period === void 0)period = 1;var delay = arguments[2];if(delay === void 0)delay = 0;
    var object = {
      period: period,
      executeEvent: function(time, audioTime) {
        callback(time, audioTime);
        return this.period;
      }
    };

    this.__nextTime = this.__eventQueue.insert(object, this.time + delay, false);
    this.__reschedule();

    return object;
  }

  /**
   * Add an event engine to the scheduler
   * @param {Object} engine event engine to be added to the scheduler
   * @param {Number} delay scheduling delay time
   */
  Scheduler.prototype.add = function(engine) {var delay = arguments[1];if(delay === void 0)delay = 0;
    if (engine.scheduler !== null)
      throw "object has already been added to a scheduler";

    if (!engine.syncEvent)
      throw "object does not have a syncEvent method";

    if (!engine.executeEvent)
      throw "object does not have a executeEvent method";

    engine.scheduler = this;
    this.__nextTime = this.__eventQueue.insert(engine, this.time + delay);
    this.__reschedule();
  }

  /**
   * Remove event engine from the scheduler
   * @param {Object} engine event engine or callback to be removed from the scheduler
   */
  Scheduler.prototype.remove = function(engine) {
    if (engine.scheduler !== this)
      throw "object has not been added to this scheduler";

    engine.scheduler = null;
    this.__nextTime = this.__eventQueue.remove(engine);
    this.__reschedule();
  }

  /**
   * Resychronize a scheduled event engine
   * @param {Object} engine event engine to be resynchronized
   */
  Scheduler.prototype.resync = function(engine) {
    if (engine.scheduler !== this)
      throw "object has not been added to this scheduler";

    if (!engine.syncEvent)
      throw "object does not have a syncEvent method";

    this.__nextTime = this.__eventQueue.move(engine, this.time);
    this.__reschedule();
  }

  /**
   * Reschedule a scheduled event engine or callback
   * @param {Object} engine event engine or callback to be rescheduled
   * @param {Number} time time when to reschedule
   */
  Scheduler.prototype.reschedule = function(engine, time) {
    if (engine.scheduler !== this)
      throw "object has not been added to this scheduler";

    this.__nextTime = this.__eventQueue.move(engine, time, false);
    this.__reschedule();
  }
;return Scheduler;})();

module.exports = new Scheduler; // export scheduler singleton
},{"audio-context":2,"event-queue":3}],2:[function(_dereq_,module,exports){
/* Generated by es6-transpiler v 0.7.14-2 */
// instantiates an audio context in the global scope if not there already
var context = window.audioContext || new AudioContext() || new webkitAudioContext();
window.audioContext = context;
module.exports = context;
},{}],3:[function(_dereq_,module,exports){
/**
 * @fileoverview WAVE audio event queue used by scheduler and transports
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 */
'use strict';

var EventQueue = (function(){var DP$0 = Object.defineProperty;

  function EventQueue() {
    this.__events = [];
    this.reverse = false;
  }DP$0(EventQueue, "prototype", {"configurable": false, "enumerable": false, "writable": false});

  /* Get the index of an object in the event list */
  EventQueue.prototype.__eventIndex = function(object) {
    for (var i = 0; i < this.__events.length; i++) {
      if (object === this.__events[i][0]) {
        return i;
      }
    }

    return -1;
  }

  /* Withdraw an event from the event list */
  EventQueue.prototype.__removeEvent = function(object) {
    var index = this.__eventIndex(object);

    if (index >= 0)
      this.__events.splice(index, 1);

    if (this.__events.length > 0)
      return this.__events[0][1]; // return time of first event

    return Infinity;
  }

  EventQueue.prototype.__syncEvent = function(object, time) {
    var nextEventDelay = Math.max(object.syncEvent(time), 0);
    var nextEventTime = Infinity;

    if (nextEventDelay !== Infinity) {
      if (!this.reverse)
        nextEventTime = time + nextEventDelay;
      else
        nextEventTime = time - nextEventDelay;
    }

    return nextEventTime;
  }

  EventQueue.prototype.__sortEvents = function() {
    if (!this.reverse)
      this.__events.sort(function(a, b) {
        return a[1] - b[1];
      });
    else
      this.__events.sort(function(a, b) {
        return b[1] - a[1];
      });
  }

  /**
   * Insert an event to the queue
   */
  EventQueue.prototype.insert = function(object, time) {var sync = arguments[2];if(sync === void 0)sync = true;
    var nextEventTime = time;

    if (sync)
      nextEventTime = this.__syncEvent(object, time);

    if (nextEventTime !== Infinity) {
      // add new event
      this.__events.push([object, nextEventTime]);
      this.__sortEvents();
      return this.__events[0][1]; // return time of first event
    }

    return this.__removeEvent(object);
  }

  /**
   * Insert an array of events to the queue
   */
  EventQueue.prototype.insertAll = function(arrayOfObjects, time) {var sync = arguments[2];if(sync === void 0)sync = true;
    var nextEventTime = time;

    // sync each event and add to event list (if time is not Infinity)
    for (var i = 0; i < arrayOfObjects.length; i++) {
      var object = arrayOfObjects[i];

      if (sync)
        nextEventTime = this.__syncEvent(object, time);

      // add event to queue of scheduled events
      if (nextEventTime !== Infinity)
        this.__events.push([object, nextEventTime]);
    }

    // sort queue of scheduled events
    this.__sortEvents();

    if (this.__events.length > 0)
      return this.__events[0][1]; // return time of first event

    return Infinity;
  }

  /**
   * Move an event to another time in the queue
   */
  EventQueue.prototype.move = function(object, time) {var sync = arguments[2];if(sync === void 0)sync = true;
    var nextEventTime = time;

    if (sync)
      nextEventTime = this.__syncEvent(object, time);

    if (nextEventTime !== Infinity) {
      var index = this.__eventIndex(object);

      if (index < 0) {
        // add new event
        this.__events.push([object, nextEventTime]);
        this.__sortEvents();
      } else {
        // update time of existing event
        this.__events[index][1] = nextEventTime;

        // move first event if it is not first anymore
        if (index === 0 && this.__events.length > 1) {
          var secondEventTime = this.__events[1][1];

          if ((!this.reverse && nextEventTime > secondEventTime) || (this.reverse && nextEventTime <= secondEventTime))
            this.__sortEvents();
        }
      }

      return this.__events[0][1]; // return time of first event
    }

    return this.__removeEvent(object);
  }

  /**
   * Remove an event from the queue
   */
  EventQueue.prototype.remove = function(object) {
    return this.__removeEvent(object);
  }

  /**
   * Clear queue
   */
  EventQueue.prototype.clear = function() {
    this.__events.length = 0; // clear event list
    return Infinity;
  }

  /**
   * Execute next event and return time of next event
   */
  EventQueue.prototype.advance = function(time, audioTime) {
    // get first object in queue
    var object = this.__events[0][0];
    var nextEventDelay = Math.max(object.executeEvent(time, audioTime), 0);

    if (nextEventDelay !== Infinity) {
      var nextEventTime;

      if (!this.reverse)
        nextEventTime = time + nextEventDelay;
      else
        nextEventTime = time - nextEventDelay;

      this.__events[0][1] = nextEventTime;

      // move first event if it is not first anymore
      if (this.__events.length > 1) {
        var secondTime = this.__events[1][1];

        if ((!this.reverse && nextEventTime > secondTime) || (this.reverse && nextEventTime <= secondTime))
          this.__sortEvents();
      }

      return this.__events[0][1]; // return time of first event
    }

    return this.__removeEvent(object);
  }
;return EventQueue;})();

module.exports = EventQueue;
},{}]},{},[1])
(1)
});