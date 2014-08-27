(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * @fileoverview WAVE audio event engine base class
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 * @version 3.0
 */
"use strict";

var EventEngine = (function(){var DP$0 = Object.defineProperty;
  function EventEngine() {var alignToTransportPosition = arguments[0];if(alignToTransportPosition === void 0)alignToTransportPosition = true;
    this.scheduler = null;
    this.transport = null;

    this.alignToTransportPosition = alignToTransportPosition; // true: events are aligned to position when executed within transport

    this.outputNode = null;
  }DP$0(EventEngine, "prototype", {"configurable": false, "enumerable": false, "writable": false});

  /**
   * Synchronize event engine
   * @param {float} time synchronization time or transport position
   * @return {float} next event time
   */
  EventEngine.prototype.syncEvent = function(time) {
    return 0;
  }

  /**
   * Execute next event
   * @param {float} time the event's scheduler time or transport position
   * @param {float} audioTime the event's corresponding audio context's currentTime
   * @return {float} next event time
   */
  EventEngine.prototype.executeEvent = function(time, audioTime) {
    return Infinity; // return next event time
  }

  /**
   * Request event engine resynchronization (called by engine itself)
   */
  EventEngine.prototype.resyncEngine = function() {
    if(this.scheduler)
      this.scheduler.resync(this);
  }

  /**
   * Request event engine rescheduling (called by engine itself)
   * @param {float} time the event's new scheduler time or transport position
   */
  EventEngine.prototype.rescheduleEngine = function(time) {
    if(this.scheduler)
      this.scheduler.reschedule(this, time);
  }

  EventEngine.prototype.connect = function(target) {
    this.outputNode.connect(target);
    return this;
  }

  EventEngine.prototype.disconnect = function(target) {
    this.outputNode.disconnect(target);
    return this;
  }
;return EventEngine;})();

module.exports = EventEngine;
},{}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
/* Generated by es6-transpiler v 0.7.14-2 *//* written in ECMAscript 6 */
/**
 * @fileoverview WAVE audio transport class, provides synchronized time-based and position-based scheduling of events
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 * @version 5.1.0
 */
'use strict';

var EventQueue = require("../event-queue");
var EventEngine = require("../event-engine");

function arrayRemove(array, value) {
  var index = array.indexOf(value);

  if (index === 0) {
    array.splice(index, 1);
    return true;
  }

  return false;
}

var Transport = (function(super$0){var DP$0 = Object.defineProperty;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,Object.getOwnPropertyDescriptor(s,p));}}return t};var S_ITER$0 = typeof Symbol!=='undefined'&&Symbol.iterator||'@@iterator';function GET_ITER$0(v){if(v){if(Array.isArray(v))return 0;var f;if(typeof v==='object'&&typeof (f=v[S_ITER$0])==='function')return f.call(v);if((v+'')==='[object Generator]')return v;}throw new Error(v+' is not iterable')};MIXIN$0(Transport, super$0);

  function Transport() {
    super$0.call(this);

    this.__timeEvents = new EventQueue();
    this.__timeEngines = [];
    this.__nextEventTime = Infinity;

    this.__positionEvents = new EventQueue();
    this.__positionEngines = [];
    this.__nextEventPosition = Infinity;

    this.__nextTime = Infinity;

    this.__time = Infinity;
    this.__position = 0.0;
    this.__speed = 0.0;
    this.__playSpeed = 1.0;

    this.__speedListeners = [];
    this.__seekListeners = [];

    this.muteOnstill = true;

    return this;
  }Transport.prototype = Object.create(super$0.prototype, {"constructor": {"value": Transport, "configurable": true, "writable": true}, time: {"get": time$get$0, "configurable": true, "enumerable": true}, position: {"get": position$get$0, "configurable": true, "enumerable": true}, speed: {"get": speed$get$0, "set": speed$set$0, "configurable": true, "enumerable": true}, reverse: {"get": reverse$get$0, "configurable": true, "enumerable": true} });DP$0(Transport, "prototype", {"configurable": false, "enumerable": false, "writable": false});

  Transport.prototype.__sync = function(time) {
    this.__position += (time - this.__time) * this.__speed;
    this.__time = time;
  }

  Transport.prototype.__reschedule = function() {
    var nextTime;

    if (this.__nextEventPosition !== Infinity)
      nextTime = Math.min(this.__nextEventTime, this.getTimeAtPosition(this.__nextEventPosition));
    else
      nextTime = this.__nextEventTime;

    if (nextTime !== this.__nextTime) {
      this.__nextTime = nextTime;
      this.rescheduleEngine(nextTime);
    }
  }

  // EventEngine syncEvent
  Transport.prototype.syncEvent = function(time) {
    this.__nextEventTime = Infinity;
    this.__nextEventPosition = Infinity;

    this.__time = time;

    if (this.__speed) {
      this.__timeEvents.clear();
      this.__nextEventTime = this.__timeEvents.insertAll(this.__timeEngines, time);

      this.__positionEvents.reverse = (this.__speed < 0);
      this.__positionEvents.clear();
      this.__nextEventPosition = this.__positionEvents.insertAll(this.__positionEngines, this.__position);
    }

    if (this.__nextEventPosition !== Infinity)
      this.__nextTime = Math.min(this.__nextEventTime, this.getTimeAtPosition(this.__nextEventPosition));
    else
      this.__nextTime = this.__nextEventTime;

    return this.__nextTime - time;
  }

  // EventEngine executeEvent
  Transport.prototype.executeEvent = function(time, audioTime) {
    this.__sync(time);

    if (this.__nextTime === this.__nextEventTime)
      this.__nextEventTime = this.__timeEvents.advance(time, audioTime);
    else
      this.__nextEventPosition = this.__positionEvents.advance(this.__position, audioTime);

    if (this.__nextEventPosition !== Infinity)
      this.__nextTime = Math.min(this.__nextEventTime, this.getTimeAtPosition(this.__nextEventPosition));
    else
      this.__nextTime = this.__nextEventTime;

    return this.__nextTime - time;
  }

  Transport.prototype.getPositionAtTime = function(time) {
    return this.__position + (time - this.__time) * this.__speed;
  }

  Transport.prototype.getTimeAtPosition = function(position) {
    return this.__time + (position - this.__position) / this.__speed;
  }

  /**
   * Get transport time
   */
  function time$get$0() {
    return this.scheduler.time; // inherits time from its scheduler
  }

  /**
   * Get transport position
   */
  function position$get$0() {
    var time = this.scheduler.time;
    return this.getPositionAtTime(time);
  }

  /**
   * Get transport speed
   */
  function speed$get$0() {
    return this.__speed;
  }

  /**
   * Get whether transport runs in reverse direction (backward)
   */
  function reverse$get$0() {
    return (this.__speed < 0);
  }

  /**
   * Set transport speed
   */
  function speed$set$0(speed) {var $D$0;var $D$1;var $D$2;var $D$3;
    var lastSpeed = this.__speed;

    if (speed !== lastSpeed) {
      this.__sync(this.time);

      this.__speed = speed;

      if (lastSpeed === 0) {
        // start
        this.__timeEvents.clear();
        this.__nextEventTime = this.__timeEvents.insertAll(this.__timeEngines, this.__time);

        this.__positionEvents.reverse = (speed < 0);
        this.__positionEvents.clear();
        this.__nextEventPosition = this.__positionEvents.insertAll(this.__positionEngines, this.__position);
      } else if (speed === 0) {
        // stop/pause
        this.__nextEventTime = Infinity;
        this.__nextEventPosition = Infinity;
      } else if (speed * lastSpeed < 0) {
        // reverse direction
        this.__positionEvents.reverse = (speed < 0);
        this.__positionEvents.clear();
        this.__nextEventPosition = this.__positionEvents.insertAll(this.__positionEngines, this.__position);
      }

      this.__reschedule();

      $D$3 = (this.__speedListeners);$D$0 = GET_ITER$0($D$3);$D$2 = $D$0 === 0;$D$1 = ($D$2 ? $D$3.length : void 0);for (var listener ; $D$2 ? ($D$0 < $D$1) : !($D$1 = $D$0["next"]())["done"]; )
{listener = ($D$2 ? $D$3[$D$0++] : $D$1["value"]);listener.speed = speed;};$D$0 = $D$1 = $D$2 = $D$3 = void 0;
    }
  }

  /**
   * Set transport position
   */
  Transport.prototype.seek = function(position) {var $D$4;var $D$5;var $D$6;var $D$7;
    this.__sync(this.time);

    if (position !== this.__position) {
      this.__position = position;

      if (this.__speed !== 0) {
        this.__positionEvents.clear();
        this.__nextEventPosition = this.__positionEvents.insertAll(this.__positionEngines, this.__position, true);

        this.__reschedule();

        $D$7 = (this.__seekListeners);$D$4 = GET_ITER$0($D$7);$D$6 = $D$4 === 0;$D$5 = ($D$6 ? $D$7.length : void 0);for (var listener ; $D$6 ? ($D$4 < $D$5) : !($D$5 = $D$4["next"]())["done"]; )
{listener = ($D$6 ? $D$7[$D$4++] : $D$5["value"]);listener.seek(position);};$D$4 = $D$5 = $D$6 = $D$7 = void 0;
      }
    }
  }

  Transport.prototype.start = function() {var seek = arguments[0];if(seek === void 0)seek = null;var speed = arguments[1];if(speed === void 0)speed = null;
    transport.speed = playSpeed;
  }

  Transport.prototype.stop = function() {var seek = arguments[0];if(seek === void 0)seek = null;var speed = arguments[1];if(speed === void 0)speed = null;
    transport.speed = playSpeed;
  }

  /**
   * Add an engine to the transport
   */
  Transport.prototype.add = function(engine) {
    if (engine.transport === null) {
      this.__sync(this.time);

      if (engine.syncEvent && engine.executeEvent) {
        // add an event engine

        if (engine.scheduler === null) {
          if (engine.alignToTransportPosition) {
            if (this.__speed !== 0)
              this.__nextEventPosition = this.__positionEvents.insert(engine, this.__position);
            this.__positionEngines.push(engine);
          } else {
            if (this.__speed !== 0)
              this.__nextEventTime = this.__timeEvents.insert(engine, this.__time);
            this.__timeEngines.push(engine);
          }

          engine.scheduler = this;

          if (this.__speed !== 0)
            this.__reschedule();
        }
      } else {
        // add a non-event engine that has a speed property and/or a seek method

        if (engine.speed)
          this.__speedListeners.push(engine);

        if (engine.seek)
          this.__seekListeners.push(engine);
      }

      engine.transport = this;
    }
  }

  /**
   * Remove an engine from the transport
   */
  Transport.prototype.remove = function(engine) {
    if (engine.transport === this) {
      this.__sync(this.time);

      if (engine.syncEvent && engine.executeEvent) {
        // remove an event engine

        if (engine.scheduler === this) {
          if (engine.alignToTransportPosition) {
            this.__nextEventPosition = this.__positionEvents.remove(engine);
            arrayRemove(this.__positionEngines, engine);
          } else {
            this.__nextEventTime = this.__timeEvents.remove(engine);
            arrayRemove(this.__timeEngines, engine);
          }

          engine.scheduler = null;

          if (this.__speed !== 0)
            this.__reschedule();
        }
      } else {
        // remove a non-event engine that has a speed property and/or a seek method

        if (engine.speed)
          arrayRemove(this.__speedListeners, engine);

        if (engine.seek)
          arrayRemove(this.__seekListeners, engine);
      }

      engine.transport = null;
    }
  }

  /**
   * Resychronize event engine
   */
  Transport.prototype.resync = function(engine) {
    if (engine.scheduler === this && engine.syncEvent && engine.executeEvent) {
      this.__sync(this.time);

      if (this._speed !== 0) {
        if (engine.alignToTransportPosition)
          this.__nextEventPosition = this.__positionEvents.move(engine, this.__position);
        else
          this.__nextEventTime = this.__timeEvents.move(engine, this.__time);

        this.__reschedule();
      }
    }
  }

  /**
   * Reschedule event engine at given time (or position)
   */
  Transport.prototype.reschedule = function(engine, time) {
    if (engine.scheduler === this && engine.syncEvent && engine.executeEvent) {
      this.__sync(this.time);

      if (this._speed !== 0) {
        if (engine.alignToTransportPosition)
          this.__nextEventPosition = this.__positionEvents.move(engine, time, false);
        else
          this.__nextEventTime = this.__timeEvents.move(engine, time, false);

        this.__reschedule();
      }
    }
  }
;return Transport;})(EventEngine);

module.exports = Transport;
},{"../event-engine":1,"../event-queue":2}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zY2huZWxsL0RldmVsb3BtZW50L3dlYi9taXNjL2d1bHBCcm93RXJzeTYvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zY2huZWxsL0RldmVsb3BtZW50L3dlYi93YXZlL2xpYi9naXRodWIvYXVkaW8vZXZlbnQtZW5naW5lL2luZGV4LmpzIiwiL1VzZXJzL3NjaG5lbGwvRGV2ZWxvcG1lbnQvd2ViL3dhdmUvbGliL2dpdGh1Yi9hdWRpby9ldmVudC1xdWV1ZS9pbmRleC5qcyIsIi9Vc2Vycy9zY2huZWxsL0RldmVsb3BtZW50L3dlYi93YXZlL2xpYi9naXRodWIvYXVkaW8vdHJhbnNwb3J0L2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgV0FWRSBhdWRpbyBldmVudCBlbmdpbmUgYmFzZSBjbGFzc1xuICogQGF1dGhvciBOb3JiZXJ0LlNjaG5lbGxAaXJjYW0uZnIsIFZpY3Rvci5TYWl6QGlyY2FtLmZyLCBLYXJpbS5CYXJrYXRpQGlyY2FtLmZyXG4gKiBAdmVyc2lvbiAzLjBcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBFdmVudEVuZ2luZSA9IChmdW5jdGlvbigpe3ZhciBEUCQwID0gT2JqZWN0LmRlZmluZVByb3BlcnR5O1xuICBmdW5jdGlvbiBFdmVudEVuZ2luZSgpIHt2YXIgYWxpZ25Ub1RyYW5zcG9ydFBvc2l0aW9uID0gYXJndW1lbnRzWzBdO2lmKGFsaWduVG9UcmFuc3BvcnRQb3NpdGlvbiA9PT0gdm9pZCAwKWFsaWduVG9UcmFuc3BvcnRQb3NpdGlvbiA9IHRydWU7XG4gICAgdGhpcy5zY2hlZHVsZXIgPSBudWxsO1xuICAgIHRoaXMudHJhbnNwb3J0ID0gbnVsbDtcblxuICAgIHRoaXMuYWxpZ25Ub1RyYW5zcG9ydFBvc2l0aW9uID0gYWxpZ25Ub1RyYW5zcG9ydFBvc2l0aW9uOyAvLyB0cnVlOiBldmVudHMgYXJlIGFsaWduZWQgdG8gcG9zaXRpb24gd2hlbiBleGVjdXRlZCB3aXRoaW4gdHJhbnNwb3J0XG5cbiAgICB0aGlzLm91dHB1dE5vZGUgPSBudWxsO1xuICB9RFAkMChFdmVudEVuZ2luZSwgXCJwcm90b3R5cGVcIiwge1wiY29uZmlndXJhYmxlXCI6IGZhbHNlLCBcImVudW1lcmFibGVcIjogZmFsc2UsIFwid3JpdGFibGVcIjogZmFsc2V9KTtcblxuICAvKipcbiAgICogU3luY2hyb25pemUgZXZlbnQgZW5naW5lXG4gICAqIEBwYXJhbSB7ZmxvYXR9IHRpbWUgc3luY2hyb25pemF0aW9uIHRpbWUgb3IgdHJhbnNwb3J0IHBvc2l0aW9uXG4gICAqIEByZXR1cm4ge2Zsb2F0fSBuZXh0IGV2ZW50IHRpbWVcbiAgICovXG4gIEV2ZW50RW5naW5lLnByb3RvdHlwZS5zeW5jRXZlbnQgPSBmdW5jdGlvbih0aW1lKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBuZXh0IGV2ZW50XG4gICAqIEBwYXJhbSB7ZmxvYXR9IHRpbWUgdGhlIGV2ZW50J3Mgc2NoZWR1bGVyIHRpbWUgb3IgdHJhbnNwb3J0IHBvc2l0aW9uXG4gICAqIEBwYXJhbSB7ZmxvYXR9IGF1ZGlvVGltZSB0aGUgZXZlbnQncyBjb3JyZXNwb25kaW5nIGF1ZGlvIGNvbnRleHQncyBjdXJyZW50VGltZVxuICAgKiBAcmV0dXJuIHtmbG9hdH0gbmV4dCBldmVudCB0aW1lXG4gICAqL1xuICBFdmVudEVuZ2luZS5wcm90b3R5cGUuZXhlY3V0ZUV2ZW50ID0gZnVuY3Rpb24odGltZSwgYXVkaW9UaW1lKSB7XG4gICAgcmV0dXJuIEluZmluaXR5OyAvLyByZXR1cm4gbmV4dCBldmVudCB0aW1lXG4gIH1cblxuICAvKipcbiAgICogUmVxdWVzdCBldmVudCBlbmdpbmUgcmVzeW5jaHJvbml6YXRpb24gKGNhbGxlZCBieSBlbmdpbmUgaXRzZWxmKVxuICAgKi9cbiAgRXZlbnRFbmdpbmUucHJvdG90eXBlLnJlc3luY0VuZ2luZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmKHRoaXMuc2NoZWR1bGVyKVxuICAgICAgdGhpcy5zY2hlZHVsZXIucmVzeW5jKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcXVlc3QgZXZlbnQgZW5naW5lIHJlc2NoZWR1bGluZyAoY2FsbGVkIGJ5IGVuZ2luZSBpdHNlbGYpXG4gICAqIEBwYXJhbSB7ZmxvYXR9IHRpbWUgdGhlIGV2ZW50J3MgbmV3IHNjaGVkdWxlciB0aW1lIG9yIHRyYW5zcG9ydCBwb3NpdGlvblxuICAgKi9cbiAgRXZlbnRFbmdpbmUucHJvdG90eXBlLnJlc2NoZWR1bGVFbmdpbmUgPSBmdW5jdGlvbih0aW1lKSB7XG4gICAgaWYodGhpcy5zY2hlZHVsZXIpXG4gICAgICB0aGlzLnNjaGVkdWxlci5yZXNjaGVkdWxlKHRoaXMsIHRpbWUpO1xuICB9XG5cbiAgRXZlbnRFbmdpbmUucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgICB0aGlzLm91dHB1dE5vZGUuY29ubmVjdCh0YXJnZXQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgRXZlbnRFbmdpbmUucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgICB0aGlzLm91dHB1dE5vZGUuZGlzY29ubmVjdCh0YXJnZXQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG47cmV0dXJuIEV2ZW50RW5naW5lO30pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbmdpbmU7IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFdBVkUgYXVkaW8gZXZlbnQgcXVldWUgdXNlZCBieSBzY2hlZHVsZXIgYW5kIHRyYW5zcG9ydHNcbiAqIEBhdXRob3IgTm9yYmVydC5TY2huZWxsQGlyY2FtLmZyLCBWaWN0b3IuU2FpekBpcmNhbS5mciwgS2FyaW0uQmFya2F0aUBpcmNhbS5mclxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudFF1ZXVlID0gKGZ1bmN0aW9uKCl7dmFyIERQJDAgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7XG5cbiAgZnVuY3Rpb24gRXZlbnRRdWV1ZSgpIHtcbiAgICB0aGlzLl9fZXZlbnRzID0gW107XG4gICAgdGhpcy5yZXZlcnNlID0gZmFsc2U7XG4gIH1EUCQwKEV2ZW50UXVldWUsIFwicHJvdG90eXBlXCIsIHtcImNvbmZpZ3VyYWJsZVwiOiBmYWxzZSwgXCJlbnVtZXJhYmxlXCI6IGZhbHNlLCBcIndyaXRhYmxlXCI6IGZhbHNlfSk7XG5cbiAgLyogR2V0IHRoZSBpbmRleCBvZiBhbiBvYmplY3QgaW4gdGhlIGV2ZW50IGxpc3QgKi9cbiAgRXZlbnRRdWV1ZS5wcm90b3R5cGUuX19ldmVudEluZGV4ID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9fZXZlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAob2JqZWN0ID09PSB0aGlzLl9fZXZlbnRzW2ldWzBdKSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gIC8qIFdpdGhkcmF3IGFuIGV2ZW50IGZyb20gdGhlIGV2ZW50IGxpc3QgKi9cbiAgRXZlbnRRdWV1ZS5wcm90b3R5cGUuX19yZW1vdmVFdmVudCA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHZhciBpbmRleCA9IHRoaXMuX19ldmVudEluZGV4KG9iamVjdCk7XG5cbiAgICBpZiAoaW5kZXggPj0gMClcbiAgICAgIHRoaXMuX19ldmVudHMuc3BsaWNlKGluZGV4LCAxKTtcblxuICAgIGlmICh0aGlzLl9fZXZlbnRzLmxlbmd0aCA+IDApXG4gICAgICByZXR1cm4gdGhpcy5fX2V2ZW50c1swXVsxXTsgLy8gcmV0dXJuIHRpbWUgb2YgZmlyc3QgZXZlbnRcblxuICAgIHJldHVybiBJbmZpbml0eTtcbiAgfVxuXG4gIEV2ZW50UXVldWUucHJvdG90eXBlLl9fc3luY0V2ZW50ID0gZnVuY3Rpb24ob2JqZWN0LCB0aW1lKSB7XG4gICAgdmFyIG5leHRFdmVudERlbGF5ID0gTWF0aC5tYXgob2JqZWN0LnN5bmNFdmVudCh0aW1lKSwgMCk7XG4gICAgdmFyIG5leHRFdmVudFRpbWUgPSBJbmZpbml0eTtcblxuICAgIGlmIChuZXh0RXZlbnREZWxheSAhPT0gSW5maW5pdHkpIHtcbiAgICAgIGlmICghdGhpcy5yZXZlcnNlKVxuICAgICAgICBuZXh0RXZlbnRUaW1lID0gdGltZSArIG5leHRFdmVudERlbGF5O1xuICAgICAgZWxzZVxuICAgICAgICBuZXh0RXZlbnRUaW1lID0gdGltZSAtIG5leHRFdmVudERlbGF5O1xuICAgIH1cblxuICAgIHJldHVybiBuZXh0RXZlbnRUaW1lO1xuICB9XG5cbiAgRXZlbnRRdWV1ZS5wcm90b3R5cGUuX19zb3J0RXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLnJldmVyc2UpXG4gICAgICB0aGlzLl9fZXZlbnRzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICByZXR1cm4gYVsxXSAtIGJbMV07XG4gICAgICB9KTtcbiAgICBlbHNlXG4gICAgICB0aGlzLl9fZXZlbnRzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICByZXR1cm4gYlsxXSAtIGFbMV07XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnNlcnQgYW4gZXZlbnQgdG8gdGhlIHF1ZXVlXG4gICAqL1xuICBFdmVudFF1ZXVlLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbihvYmplY3QsIHRpbWUpIHt2YXIgc3luYyA9IGFyZ3VtZW50c1syXTtpZihzeW5jID09PSB2b2lkIDApc3luYyA9IHRydWU7XG4gICAgdmFyIG5leHRFdmVudFRpbWUgPSB0aW1lO1xuXG4gICAgaWYgKHN5bmMpXG4gICAgICBuZXh0RXZlbnRUaW1lID0gdGhpcy5fX3N5bmNFdmVudChvYmplY3QsIHRpbWUpO1xuXG4gICAgaWYgKG5leHRFdmVudFRpbWUgIT09IEluZmluaXR5KSB7XG4gICAgICAvLyBhZGQgbmV3IGV2ZW50XG4gICAgICB0aGlzLl9fZXZlbnRzLnB1c2goW29iamVjdCwgbmV4dEV2ZW50VGltZV0pO1xuICAgICAgdGhpcy5fX3NvcnRFdmVudHMoKTtcbiAgICAgIHJldHVybiB0aGlzLl9fZXZlbnRzWzBdWzFdOyAvLyByZXR1cm4gdGltZSBvZiBmaXJzdCBldmVudFxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9fcmVtb3ZlRXZlbnQob2JqZWN0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnNlcnQgYW4gYXJyYXkgb2YgZXZlbnRzIHRvIHRoZSBxdWV1ZVxuICAgKi9cbiAgRXZlbnRRdWV1ZS5wcm90b3R5cGUuaW5zZXJ0QWxsID0gZnVuY3Rpb24oYXJyYXlPZk9iamVjdHMsIHRpbWUpIHt2YXIgc3luYyA9IGFyZ3VtZW50c1syXTtpZihzeW5jID09PSB2b2lkIDApc3luYyA9IHRydWU7XG4gICAgdmFyIG5leHRFdmVudFRpbWUgPSB0aW1lO1xuXG4gICAgLy8gc3luYyBlYWNoIGV2ZW50IGFuZCBhZGQgdG8gZXZlbnQgbGlzdCAoaWYgdGltZSBpcyBub3QgSW5maW5pdHkpXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheU9mT2JqZWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIG9iamVjdCA9IGFycmF5T2ZPYmplY3RzW2ldO1xuXG4gICAgICBpZiAoc3luYylcbiAgICAgICAgbmV4dEV2ZW50VGltZSA9IHRoaXMuX19zeW5jRXZlbnQob2JqZWN0LCB0aW1lKTtcblxuICAgICAgLy8gYWRkIGV2ZW50IHRvIHF1ZXVlIG9mIHNjaGVkdWxlZCBldmVudHNcbiAgICAgIGlmIChuZXh0RXZlbnRUaW1lICE9PSBJbmZpbml0eSlcbiAgICAgICAgdGhpcy5fX2V2ZW50cy5wdXNoKFtvYmplY3QsIG5leHRFdmVudFRpbWVdKTtcbiAgICB9XG5cbiAgICAvLyBzb3J0IHF1ZXVlIG9mIHNjaGVkdWxlZCBldmVudHNcbiAgICB0aGlzLl9fc29ydEV2ZW50cygpO1xuXG4gICAgaWYgKHRoaXMuX19ldmVudHMubGVuZ3RoID4gMClcbiAgICAgIHJldHVybiB0aGlzLl9fZXZlbnRzWzBdWzFdOyAvLyByZXR1cm4gdGltZSBvZiBmaXJzdCBldmVudFxuXG4gICAgcmV0dXJuIEluZmluaXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIE1vdmUgYW4gZXZlbnQgdG8gYW5vdGhlciB0aW1lIGluIHRoZSBxdWV1ZVxuICAgKi9cbiAgRXZlbnRRdWV1ZS5wcm90b3R5cGUubW92ZSA9IGZ1bmN0aW9uKG9iamVjdCwgdGltZSkge3ZhciBzeW5jID0gYXJndW1lbnRzWzJdO2lmKHN5bmMgPT09IHZvaWQgMClzeW5jID0gdHJ1ZTtcbiAgICB2YXIgbmV4dEV2ZW50VGltZSA9IHRpbWU7XG5cbiAgICBpZiAoc3luYylcbiAgICAgIG5leHRFdmVudFRpbWUgPSB0aGlzLl9fc3luY0V2ZW50KG9iamVjdCwgdGltZSk7XG5cbiAgICBpZiAobmV4dEV2ZW50VGltZSAhPT0gSW5maW5pdHkpIHtcbiAgICAgIHZhciBpbmRleCA9IHRoaXMuX19ldmVudEluZGV4KG9iamVjdCk7XG5cbiAgICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgLy8gYWRkIG5ldyBldmVudFxuICAgICAgICB0aGlzLl9fZXZlbnRzLnB1c2goW29iamVjdCwgbmV4dEV2ZW50VGltZV0pO1xuICAgICAgICB0aGlzLl9fc29ydEV2ZW50cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdXBkYXRlIHRpbWUgb2YgZXhpc3RpbmcgZXZlbnRcbiAgICAgICAgdGhpcy5fX2V2ZW50c1tpbmRleF1bMV0gPSBuZXh0RXZlbnRUaW1lO1xuXG4gICAgICAgIC8vIG1vdmUgZmlyc3QgZXZlbnQgaWYgaXQgaXMgbm90IGZpcnN0IGFueW1vcmVcbiAgICAgICAgaWYgKGluZGV4ID09PSAwICYmIHRoaXMuX19ldmVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgIHZhciBzZWNvbmRFdmVudFRpbWUgPSB0aGlzLl9fZXZlbnRzWzFdWzFdO1xuXG4gICAgICAgICAgaWYgKCghdGhpcy5yZXZlcnNlICYmIG5leHRFdmVudFRpbWUgPiBzZWNvbmRFdmVudFRpbWUpIHx8ICh0aGlzLnJldmVyc2UgJiYgbmV4dEV2ZW50VGltZSA8PSBzZWNvbmRFdmVudFRpbWUpKVxuICAgICAgICAgICAgdGhpcy5fX3NvcnRFdmVudHMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5fX2V2ZW50c1swXVsxXTsgLy8gcmV0dXJuIHRpbWUgb2YgZmlyc3QgZXZlbnRcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fX3JlbW92ZUV2ZW50KG9iamVjdCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV2ZW50IGZyb20gdGhlIHF1ZXVlXG4gICAqL1xuICBFdmVudFF1ZXVlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gdGhpcy5fX3JlbW92ZUV2ZW50KG9iamVjdCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXIgcXVldWVcbiAgICovXG4gIEV2ZW50UXVldWUucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fX2V2ZW50cy5sZW5ndGggPSAwOyAvLyBjbGVhciBldmVudCBsaXN0XG4gICAgcmV0dXJuIEluZmluaXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgbmV4dCBldmVudCBhbmQgcmV0dXJuIHRpbWUgb2YgbmV4dCBldmVudFxuICAgKi9cbiAgRXZlbnRRdWV1ZS5wcm90b3R5cGUuYWR2YW5jZSA9IGZ1bmN0aW9uKHRpbWUsIGF1ZGlvVGltZSkge1xuICAgIC8vIGdldCBmaXJzdCBvYmplY3QgaW4gcXVldWVcbiAgICB2YXIgb2JqZWN0ID0gdGhpcy5fX2V2ZW50c1swXVswXTtcbiAgICB2YXIgbmV4dEV2ZW50RGVsYXkgPSBNYXRoLm1heChvYmplY3QuZXhlY3V0ZUV2ZW50KHRpbWUsIGF1ZGlvVGltZSksIDApO1xuXG4gICAgaWYgKG5leHRFdmVudERlbGF5ICE9PSBJbmZpbml0eSkge1xuICAgICAgdmFyIG5leHRFdmVudFRpbWU7XG5cbiAgICAgIGlmICghdGhpcy5yZXZlcnNlKVxuICAgICAgICBuZXh0RXZlbnRUaW1lID0gdGltZSArIG5leHRFdmVudERlbGF5O1xuICAgICAgZWxzZVxuICAgICAgICBuZXh0RXZlbnRUaW1lID0gdGltZSAtIG5leHRFdmVudERlbGF5O1xuXG4gICAgICB0aGlzLl9fZXZlbnRzWzBdWzFdID0gbmV4dEV2ZW50VGltZTtcblxuICAgICAgLy8gbW92ZSBmaXJzdCBldmVudCBpZiBpdCBpcyBub3QgZmlyc3QgYW55bW9yZVxuICAgICAgaWYgKHRoaXMuX19ldmVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICB2YXIgc2Vjb25kVGltZSA9IHRoaXMuX19ldmVudHNbMV1bMV07XG5cbiAgICAgICAgaWYgKCghdGhpcy5yZXZlcnNlICYmIG5leHRFdmVudFRpbWUgPiBzZWNvbmRUaW1lKSB8fCAodGhpcy5yZXZlcnNlICYmIG5leHRFdmVudFRpbWUgPD0gc2Vjb25kVGltZSkpXG4gICAgICAgICAgdGhpcy5fX3NvcnRFdmVudHMoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuX19ldmVudHNbMF1bMV07IC8vIHJldHVybiB0aW1lIG9mIGZpcnN0IGV2ZW50XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX19yZW1vdmVFdmVudChvYmplY3QpO1xuICB9XG47cmV0dXJuIEV2ZW50UXVldWU7fSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudFF1ZXVlOyIsIi8qIEdlbmVyYXRlZCBieSBlczYtdHJhbnNwaWxlciB2IDAuNy4xNC0yICovLyogd3JpdHRlbiBpbiBFQ01Bc2NyaXB0IDYgKi9cbi8qKlxuICogQGZpbGVvdmVydmlldyBXQVZFIGF1ZGlvIHRyYW5zcG9ydCBjbGFzcywgcHJvdmlkZXMgc3luY2hyb25pemVkIHRpbWUtYmFzZWQgYW5kIHBvc2l0aW9uLWJhc2VkIHNjaGVkdWxpbmcgb2YgZXZlbnRzXG4gKiBAYXV0aG9yIE5vcmJlcnQuU2NobmVsbEBpcmNhbS5mciwgVmljdG9yLlNhaXpAaXJjYW0uZnIsIEthcmltLkJhcmthdGlAaXJjYW0uZnJcbiAqIEB2ZXJzaW9uIDUuMS4wXG4gKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEV2ZW50UXVldWUgPSByZXF1aXJlKFwiLi4vZXZlbnQtcXVldWVcIik7XG52YXIgRXZlbnRFbmdpbmUgPSByZXF1aXJlKFwiLi4vZXZlbnQtZW5naW5lXCIpO1xuXG5mdW5jdGlvbiBhcnJheVJlbW92ZShhcnJheSwgdmFsdWUpIHtcbiAgdmFyIGluZGV4ID0gYXJyYXkuaW5kZXhPZih2YWx1ZSk7XG5cbiAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgYXJyYXkuc3BsaWNlKGluZGV4LCAxKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxudmFyIFRyYW5zcG9ydCA9IChmdW5jdGlvbihzdXBlciQwKXt2YXIgRFAkMCA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eTt2YXIgTUlYSU4kMCA9IGZ1bmN0aW9uKHQscyl7Zm9yKHZhciBwIGluIHMpe2lmKHMuaGFzT3duUHJvcGVydHkocCkpe0RQJDAodCxwLE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocyxwKSk7fX1yZXR1cm4gdH07dmFyIFNfSVRFUiQwID0gdHlwZW9mIFN5bWJvbCE9PSd1bmRlZmluZWQnJiZTeW1ib2wuaXRlcmF0b3J8fCdAQGl0ZXJhdG9yJztmdW5jdGlvbiBHRVRfSVRFUiQwKHYpe2lmKHYpe2lmKEFycmF5LmlzQXJyYXkodikpcmV0dXJuIDA7dmFyIGY7aWYodHlwZW9mIHY9PT0nb2JqZWN0JyYmdHlwZW9mIChmPXZbU19JVEVSJDBdKT09PSdmdW5jdGlvbicpcmV0dXJuIGYuY2FsbCh2KTtpZigodisnJyk9PT0nW29iamVjdCBHZW5lcmF0b3JdJylyZXR1cm4gdjt9dGhyb3cgbmV3IEVycm9yKHYrJyBpcyBub3QgaXRlcmFibGUnKX07TUlYSU4kMChUcmFuc3BvcnQsIHN1cGVyJDApO1xuXG4gIGZ1bmN0aW9uIFRyYW5zcG9ydCgpIHtcbiAgICBzdXBlciQwLmNhbGwodGhpcyk7XG5cbiAgICB0aGlzLl9fdGltZUV2ZW50cyA9IG5ldyBFdmVudFF1ZXVlKCk7XG4gICAgdGhpcy5fX3RpbWVFbmdpbmVzID0gW107XG4gICAgdGhpcy5fX25leHRFdmVudFRpbWUgPSBJbmZpbml0eTtcblxuICAgIHRoaXMuX19wb3NpdGlvbkV2ZW50cyA9IG5ldyBFdmVudFF1ZXVlKCk7XG4gICAgdGhpcy5fX3Bvc2l0aW9uRW5naW5lcyA9IFtdO1xuICAgIHRoaXMuX19uZXh0RXZlbnRQb3NpdGlvbiA9IEluZmluaXR5O1xuXG4gICAgdGhpcy5fX25leHRUaW1lID0gSW5maW5pdHk7XG5cbiAgICB0aGlzLl9fdGltZSA9IEluZmluaXR5O1xuICAgIHRoaXMuX19wb3NpdGlvbiA9IDAuMDtcbiAgICB0aGlzLl9fc3BlZWQgPSAwLjA7XG4gICAgdGhpcy5fX3BsYXlTcGVlZCA9IDEuMDtcblxuICAgIHRoaXMuX19zcGVlZExpc3RlbmVycyA9IFtdO1xuICAgIHRoaXMuX19zZWVrTGlzdGVuZXJzID0gW107XG5cbiAgICB0aGlzLm11dGVPbnN0aWxsID0gdHJ1ZTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9VHJhbnNwb3J0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXIkMC5wcm90b3R5cGUsIHtcImNvbnN0cnVjdG9yXCI6IHtcInZhbHVlXCI6IFRyYW5zcG9ydCwgXCJjb25maWd1cmFibGVcIjogdHJ1ZSwgXCJ3cml0YWJsZVwiOiB0cnVlfSwgdGltZToge1wiZ2V0XCI6IHRpbWUkZ2V0JDAsIFwiY29uZmlndXJhYmxlXCI6IHRydWUsIFwiZW51bWVyYWJsZVwiOiB0cnVlfSwgcG9zaXRpb246IHtcImdldFwiOiBwb3NpdGlvbiRnZXQkMCwgXCJjb25maWd1cmFibGVcIjogdHJ1ZSwgXCJlbnVtZXJhYmxlXCI6IHRydWV9LCBzcGVlZDoge1wiZ2V0XCI6IHNwZWVkJGdldCQwLCBcInNldFwiOiBzcGVlZCRzZXQkMCwgXCJjb25maWd1cmFibGVcIjogdHJ1ZSwgXCJlbnVtZXJhYmxlXCI6IHRydWV9LCByZXZlcnNlOiB7XCJnZXRcIjogcmV2ZXJzZSRnZXQkMCwgXCJjb25maWd1cmFibGVcIjogdHJ1ZSwgXCJlbnVtZXJhYmxlXCI6IHRydWV9IH0pO0RQJDAoVHJhbnNwb3J0LCBcInByb3RvdHlwZVwiLCB7XCJjb25maWd1cmFibGVcIjogZmFsc2UsIFwiZW51bWVyYWJsZVwiOiBmYWxzZSwgXCJ3cml0YWJsZVwiOiBmYWxzZX0pO1xuXG4gIFRyYW5zcG9ydC5wcm90b3R5cGUuX19zeW5jID0gZnVuY3Rpb24odGltZSkge1xuICAgIHRoaXMuX19wb3NpdGlvbiArPSAodGltZSAtIHRoaXMuX190aW1lKSAqIHRoaXMuX19zcGVlZDtcbiAgICB0aGlzLl9fdGltZSA9IHRpbWU7XG4gIH1cblxuICBUcmFuc3BvcnQucHJvdG90eXBlLl9fcmVzY2hlZHVsZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXh0VGltZTtcblxuICAgIGlmICh0aGlzLl9fbmV4dEV2ZW50UG9zaXRpb24gIT09IEluZmluaXR5KVxuICAgICAgbmV4dFRpbWUgPSBNYXRoLm1pbih0aGlzLl9fbmV4dEV2ZW50VGltZSwgdGhpcy5nZXRUaW1lQXRQb3NpdGlvbih0aGlzLl9fbmV4dEV2ZW50UG9zaXRpb24pKTtcbiAgICBlbHNlXG4gICAgICBuZXh0VGltZSA9IHRoaXMuX19uZXh0RXZlbnRUaW1lO1xuXG4gICAgaWYgKG5leHRUaW1lICE9PSB0aGlzLl9fbmV4dFRpbWUpIHtcbiAgICAgIHRoaXMuX19uZXh0VGltZSA9IG5leHRUaW1lO1xuICAgICAgdGhpcy5yZXNjaGVkdWxlRW5naW5lKG5leHRUaW1lKTtcbiAgICB9XG4gIH1cblxuICAvLyBFdmVudEVuZ2luZSBzeW5jRXZlbnRcbiAgVHJhbnNwb3J0LnByb3RvdHlwZS5zeW5jRXZlbnQgPSBmdW5jdGlvbih0aW1lKSB7XG4gICAgdGhpcy5fX25leHRFdmVudFRpbWUgPSBJbmZpbml0eTtcbiAgICB0aGlzLl9fbmV4dEV2ZW50UG9zaXRpb24gPSBJbmZpbml0eTtcblxuICAgIHRoaXMuX190aW1lID0gdGltZTtcblxuICAgIGlmICh0aGlzLl9fc3BlZWQpIHtcbiAgICAgIHRoaXMuX190aW1lRXZlbnRzLmNsZWFyKCk7XG4gICAgICB0aGlzLl9fbmV4dEV2ZW50VGltZSA9IHRoaXMuX190aW1lRXZlbnRzLmluc2VydEFsbCh0aGlzLl9fdGltZUVuZ2luZXMsIHRpbWUpO1xuXG4gICAgICB0aGlzLl9fcG9zaXRpb25FdmVudHMucmV2ZXJzZSA9ICh0aGlzLl9fc3BlZWQgPCAwKTtcbiAgICAgIHRoaXMuX19wb3NpdGlvbkV2ZW50cy5jbGVhcigpO1xuICAgICAgdGhpcy5fX25leHRFdmVudFBvc2l0aW9uID0gdGhpcy5fX3Bvc2l0aW9uRXZlbnRzLmluc2VydEFsbCh0aGlzLl9fcG9zaXRpb25FbmdpbmVzLCB0aGlzLl9fcG9zaXRpb24pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9fbmV4dEV2ZW50UG9zaXRpb24gIT09IEluZmluaXR5KVxuICAgICAgdGhpcy5fX25leHRUaW1lID0gTWF0aC5taW4odGhpcy5fX25leHRFdmVudFRpbWUsIHRoaXMuZ2V0VGltZUF0UG9zaXRpb24odGhpcy5fX25leHRFdmVudFBvc2l0aW9uKSk7XG4gICAgZWxzZVxuICAgICAgdGhpcy5fX25leHRUaW1lID0gdGhpcy5fX25leHRFdmVudFRpbWU7XG5cbiAgICByZXR1cm4gdGhpcy5fX25leHRUaW1lIC0gdGltZTtcbiAgfVxuXG4gIC8vIEV2ZW50RW5naW5lIGV4ZWN1dGVFdmVudFxuICBUcmFuc3BvcnQucHJvdG90eXBlLmV4ZWN1dGVFdmVudCA9IGZ1bmN0aW9uKHRpbWUsIGF1ZGlvVGltZSkge1xuICAgIHRoaXMuX19zeW5jKHRpbWUpO1xuXG4gICAgaWYgKHRoaXMuX19uZXh0VGltZSA9PT0gdGhpcy5fX25leHRFdmVudFRpbWUpXG4gICAgICB0aGlzLl9fbmV4dEV2ZW50VGltZSA9IHRoaXMuX190aW1lRXZlbnRzLmFkdmFuY2UodGltZSwgYXVkaW9UaW1lKTtcbiAgICBlbHNlXG4gICAgICB0aGlzLl9fbmV4dEV2ZW50UG9zaXRpb24gPSB0aGlzLl9fcG9zaXRpb25FdmVudHMuYWR2YW5jZSh0aGlzLl9fcG9zaXRpb24sIGF1ZGlvVGltZSk7XG5cbiAgICBpZiAodGhpcy5fX25leHRFdmVudFBvc2l0aW9uICE9PSBJbmZpbml0eSlcbiAgICAgIHRoaXMuX19uZXh0VGltZSA9IE1hdGgubWluKHRoaXMuX19uZXh0RXZlbnRUaW1lLCB0aGlzLmdldFRpbWVBdFBvc2l0aW9uKHRoaXMuX19uZXh0RXZlbnRQb3NpdGlvbikpO1xuICAgIGVsc2VcbiAgICAgIHRoaXMuX19uZXh0VGltZSA9IHRoaXMuX19uZXh0RXZlbnRUaW1lO1xuXG4gICAgcmV0dXJuIHRoaXMuX19uZXh0VGltZSAtIHRpbWU7XG4gIH1cblxuICBUcmFuc3BvcnQucHJvdG90eXBlLmdldFBvc2l0aW9uQXRUaW1lID0gZnVuY3Rpb24odGltZSkge1xuICAgIHJldHVybiB0aGlzLl9fcG9zaXRpb24gKyAodGltZSAtIHRoaXMuX190aW1lKSAqIHRoaXMuX19zcGVlZDtcbiAgfVxuXG4gIFRyYW5zcG9ydC5wcm90b3R5cGUuZ2V0VGltZUF0UG9zaXRpb24gPSBmdW5jdGlvbihwb3NpdGlvbikge1xuICAgIHJldHVybiB0aGlzLl9fdGltZSArIChwb3NpdGlvbiAtIHRoaXMuX19wb3NpdGlvbikgLyB0aGlzLl9fc3BlZWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRyYW5zcG9ydCB0aW1lXG4gICAqL1xuICBmdW5jdGlvbiB0aW1lJGdldCQwKCkge1xuICAgIHJldHVybiB0aGlzLnNjaGVkdWxlci50aW1lOyAvLyBpbmhlcml0cyB0aW1lIGZyb20gaXRzIHNjaGVkdWxlclxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0cmFuc3BvcnQgcG9zaXRpb25cbiAgICovXG4gIGZ1bmN0aW9uIHBvc2l0aW9uJGdldCQwKCkge1xuICAgIHZhciB0aW1lID0gdGhpcy5zY2hlZHVsZXIudGltZTtcbiAgICByZXR1cm4gdGhpcy5nZXRQb3NpdGlvbkF0VGltZSh0aW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdHJhbnNwb3J0IHNwZWVkXG4gICAqL1xuICBmdW5jdGlvbiBzcGVlZCRnZXQkMCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3NwZWVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB3aGV0aGVyIHRyYW5zcG9ydCBydW5zIGluIHJldmVyc2UgZGlyZWN0aW9uIChiYWNrd2FyZClcbiAgICovXG4gIGZ1bmN0aW9uIHJldmVyc2UkZ2V0JDAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9fc3BlZWQgPCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdHJhbnNwb3J0IHNwZWVkXG4gICAqL1xuICBmdW5jdGlvbiBzcGVlZCRzZXQkMChzcGVlZCkge3ZhciAkRCQwO3ZhciAkRCQxO3ZhciAkRCQyO3ZhciAkRCQzO1xuICAgIHZhciBsYXN0U3BlZWQgPSB0aGlzLl9fc3BlZWQ7XG5cbiAgICBpZiAoc3BlZWQgIT09IGxhc3RTcGVlZCkge1xuICAgICAgdGhpcy5fX3N5bmModGhpcy50aW1lKTtcblxuICAgICAgdGhpcy5fX3NwZWVkID0gc3BlZWQ7XG5cbiAgICAgIGlmIChsYXN0U3BlZWQgPT09IDApIHtcbiAgICAgICAgLy8gc3RhcnRcbiAgICAgICAgdGhpcy5fX3RpbWVFdmVudHMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fX25leHRFdmVudFRpbWUgPSB0aGlzLl9fdGltZUV2ZW50cy5pbnNlcnRBbGwodGhpcy5fX3RpbWVFbmdpbmVzLCB0aGlzLl9fdGltZSk7XG5cbiAgICAgICAgdGhpcy5fX3Bvc2l0aW9uRXZlbnRzLnJldmVyc2UgPSAoc3BlZWQgPCAwKTtcbiAgICAgICAgdGhpcy5fX3Bvc2l0aW9uRXZlbnRzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX19uZXh0RXZlbnRQb3NpdGlvbiA9IHRoaXMuX19wb3NpdGlvbkV2ZW50cy5pbnNlcnRBbGwodGhpcy5fX3Bvc2l0aW9uRW5naW5lcywgdGhpcy5fX3Bvc2l0aW9uKTtcbiAgICAgIH0gZWxzZSBpZiAoc3BlZWQgPT09IDApIHtcbiAgICAgICAgLy8gc3RvcC9wYXVzZVxuICAgICAgICB0aGlzLl9fbmV4dEV2ZW50VGltZSA9IEluZmluaXR5O1xuICAgICAgICB0aGlzLl9fbmV4dEV2ZW50UG9zaXRpb24gPSBJbmZpbml0eTtcbiAgICAgIH0gZWxzZSBpZiAoc3BlZWQgKiBsYXN0U3BlZWQgPCAwKSB7XG4gICAgICAgIC8vIHJldmVyc2UgZGlyZWN0aW9uXG4gICAgICAgIHRoaXMuX19wb3NpdGlvbkV2ZW50cy5yZXZlcnNlID0gKHNwZWVkIDwgMCk7XG4gICAgICAgIHRoaXMuX19wb3NpdGlvbkV2ZW50cy5jbGVhcigpO1xuICAgICAgICB0aGlzLl9fbmV4dEV2ZW50UG9zaXRpb24gPSB0aGlzLl9fcG9zaXRpb25FdmVudHMuaW5zZXJ0QWxsKHRoaXMuX19wb3NpdGlvbkVuZ2luZXMsIHRoaXMuX19wb3NpdGlvbik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX19yZXNjaGVkdWxlKCk7XG5cbiAgICAgICREJDMgPSAodGhpcy5fX3NwZWVkTGlzdGVuZXJzKTskRCQwID0gR0VUX0lURVIkMCgkRCQzKTskRCQyID0gJEQkMCA9PT0gMDskRCQxID0gKCREJDIgPyAkRCQzLmxlbmd0aCA6IHZvaWQgMCk7Zm9yICh2YXIgbGlzdGVuZXIgOyAkRCQyID8gKCREJDAgPCAkRCQxKSA6ICEoJEQkMSA9ICREJDBbXCJuZXh0XCJdKCkpW1wiZG9uZVwiXTsgKVxue2xpc3RlbmVyID0gKCREJDIgPyAkRCQzWyREJDArK10gOiAkRCQxW1widmFsdWVcIl0pO2xpc3RlbmVyLnNwZWVkID0gc3BlZWQ7fTskRCQwID0gJEQkMSA9ICREJDIgPSAkRCQzID0gdm9pZCAwO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdHJhbnNwb3J0IHBvc2l0aW9uXG4gICAqL1xuICBUcmFuc3BvcnQucHJvdG90eXBlLnNlZWsgPSBmdW5jdGlvbihwb3NpdGlvbikge3ZhciAkRCQ0O3ZhciAkRCQ1O3ZhciAkRCQ2O3ZhciAkRCQ3O1xuICAgIHRoaXMuX19zeW5jKHRoaXMudGltZSk7XG5cbiAgICBpZiAocG9zaXRpb24gIT09IHRoaXMuX19wb3NpdGlvbikge1xuICAgICAgdGhpcy5fX3Bvc2l0aW9uID0gcG9zaXRpb247XG5cbiAgICAgIGlmICh0aGlzLl9fc3BlZWQgIT09IDApIHtcbiAgICAgICAgdGhpcy5fX3Bvc2l0aW9uRXZlbnRzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX19uZXh0RXZlbnRQb3NpdGlvbiA9IHRoaXMuX19wb3NpdGlvbkV2ZW50cy5pbnNlcnRBbGwodGhpcy5fX3Bvc2l0aW9uRW5naW5lcywgdGhpcy5fX3Bvc2l0aW9uLCB0cnVlKTtcblxuICAgICAgICB0aGlzLl9fcmVzY2hlZHVsZSgpO1xuXG4gICAgICAgICREJDcgPSAodGhpcy5fX3NlZWtMaXN0ZW5lcnMpOyREJDQgPSBHRVRfSVRFUiQwKCREJDcpOyREJDYgPSAkRCQ0ID09PSAwOyREJDUgPSAoJEQkNiA/ICREJDcubGVuZ3RoIDogdm9pZCAwKTtmb3IgKHZhciBsaXN0ZW5lciA7ICREJDYgPyAoJEQkNCA8ICREJDUpIDogISgkRCQ1ID0gJEQkNFtcIm5leHRcIl0oKSlbXCJkb25lXCJdOyApXG57bGlzdGVuZXIgPSAoJEQkNiA/ICREJDdbJEQkNCsrXSA6ICREJDVbXCJ2YWx1ZVwiXSk7bGlzdGVuZXIuc2Vlayhwb3NpdGlvbik7fTskRCQ0ID0gJEQkNSA9ICREJDYgPSAkRCQ3ID0gdm9pZCAwO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIFRyYW5zcG9ydC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHt2YXIgc2VlayA9IGFyZ3VtZW50c1swXTtpZihzZWVrID09PSB2b2lkIDApc2VlayA9IG51bGw7dmFyIHNwZWVkID0gYXJndW1lbnRzWzFdO2lmKHNwZWVkID09PSB2b2lkIDApc3BlZWQgPSBudWxsO1xuICAgIHRyYW5zcG9ydC5zcGVlZCA9IHBsYXlTcGVlZDtcbiAgfVxuXG4gIFRyYW5zcG9ydC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge3ZhciBzZWVrID0gYXJndW1lbnRzWzBdO2lmKHNlZWsgPT09IHZvaWQgMClzZWVrID0gbnVsbDt2YXIgc3BlZWQgPSBhcmd1bWVudHNbMV07aWYoc3BlZWQgPT09IHZvaWQgMClzcGVlZCA9IG51bGw7XG4gICAgdHJhbnNwb3J0LnNwZWVkID0gcGxheVNwZWVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBlbmdpbmUgdG8gdGhlIHRyYW5zcG9ydFxuICAgKi9cbiAgVHJhbnNwb3J0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihlbmdpbmUpIHtcbiAgICBpZiAoZW5naW5lLnRyYW5zcG9ydCA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5fX3N5bmModGhpcy50aW1lKTtcblxuICAgICAgaWYgKGVuZ2luZS5zeW5jRXZlbnQgJiYgZW5naW5lLmV4ZWN1dGVFdmVudCkge1xuICAgICAgICAvLyBhZGQgYW4gZXZlbnQgZW5naW5lXG5cbiAgICAgICAgaWYgKGVuZ2luZS5zY2hlZHVsZXIgPT09IG51bGwpIHtcbiAgICAgICAgICBpZiAoZW5naW5lLmFsaWduVG9UcmFuc3BvcnRQb3NpdGlvbikge1xuICAgICAgICAgICAgaWYgKHRoaXMuX19zcGVlZCAhPT0gMClcbiAgICAgICAgICAgICAgdGhpcy5fX25leHRFdmVudFBvc2l0aW9uID0gdGhpcy5fX3Bvc2l0aW9uRXZlbnRzLmluc2VydChlbmdpbmUsIHRoaXMuX19wb3NpdGlvbik7XG4gICAgICAgICAgICB0aGlzLl9fcG9zaXRpb25FbmdpbmVzLnB1c2goZW5naW5lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuX19zcGVlZCAhPT0gMClcbiAgICAgICAgICAgICAgdGhpcy5fX25leHRFdmVudFRpbWUgPSB0aGlzLl9fdGltZUV2ZW50cy5pbnNlcnQoZW5naW5lLCB0aGlzLl9fdGltZSk7XG4gICAgICAgICAgICB0aGlzLl9fdGltZUVuZ2luZXMucHVzaChlbmdpbmUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGVuZ2luZS5zY2hlZHVsZXIgPSB0aGlzO1xuXG4gICAgICAgICAgaWYgKHRoaXMuX19zcGVlZCAhPT0gMClcbiAgICAgICAgICAgIHRoaXMuX19yZXNjaGVkdWxlKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGFkZCBhIG5vbi1ldmVudCBlbmdpbmUgdGhhdCBoYXMgYSBzcGVlZCBwcm9wZXJ0eSBhbmQvb3IgYSBzZWVrIG1ldGhvZFxuXG4gICAgICAgIGlmIChlbmdpbmUuc3BlZWQpXG4gICAgICAgICAgdGhpcy5fX3NwZWVkTGlzdGVuZXJzLnB1c2goZW5naW5lKTtcblxuICAgICAgICBpZiAoZW5naW5lLnNlZWspXG4gICAgICAgICAgdGhpcy5fX3NlZWtMaXN0ZW5lcnMucHVzaChlbmdpbmUpO1xuICAgICAgfVxuXG4gICAgICBlbmdpbmUudHJhbnNwb3J0ID0gdGhpcztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGVuZ2luZSBmcm9tIHRoZSB0cmFuc3BvcnRcbiAgICovXG4gIFRyYW5zcG9ydC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oZW5naW5lKSB7XG4gICAgaWYgKGVuZ2luZS50cmFuc3BvcnQgPT09IHRoaXMpIHtcbiAgICAgIHRoaXMuX19zeW5jKHRoaXMudGltZSk7XG5cbiAgICAgIGlmIChlbmdpbmUuc3luY0V2ZW50ICYmIGVuZ2luZS5leGVjdXRlRXZlbnQpIHtcbiAgICAgICAgLy8gcmVtb3ZlIGFuIGV2ZW50IGVuZ2luZVxuXG4gICAgICAgIGlmIChlbmdpbmUuc2NoZWR1bGVyID09PSB0aGlzKSB7XG4gICAgICAgICAgaWYgKGVuZ2luZS5hbGlnblRvVHJhbnNwb3J0UG9zaXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX19uZXh0RXZlbnRQb3NpdGlvbiA9IHRoaXMuX19wb3NpdGlvbkV2ZW50cy5yZW1vdmUoZW5naW5lKTtcbiAgICAgICAgICAgIGFycmF5UmVtb3ZlKHRoaXMuX19wb3NpdGlvbkVuZ2luZXMsIGVuZ2luZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX19uZXh0RXZlbnRUaW1lID0gdGhpcy5fX3RpbWVFdmVudHMucmVtb3ZlKGVuZ2luZSk7XG4gICAgICAgICAgICBhcnJheVJlbW92ZSh0aGlzLl9fdGltZUVuZ2luZXMsIGVuZ2luZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZW5naW5lLnNjaGVkdWxlciA9IG51bGw7XG5cbiAgICAgICAgICBpZiAodGhpcy5fX3NwZWVkICE9PSAwKVxuICAgICAgICAgICAgdGhpcy5fX3Jlc2NoZWR1bGUoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gcmVtb3ZlIGEgbm9uLWV2ZW50IGVuZ2luZSB0aGF0IGhhcyBhIHNwZWVkIHByb3BlcnR5IGFuZC9vciBhIHNlZWsgbWV0aG9kXG5cbiAgICAgICAgaWYgKGVuZ2luZS5zcGVlZClcbiAgICAgICAgICBhcnJheVJlbW92ZSh0aGlzLl9fc3BlZWRMaXN0ZW5lcnMsIGVuZ2luZSk7XG5cbiAgICAgICAgaWYgKGVuZ2luZS5zZWVrKVxuICAgICAgICAgIGFycmF5UmVtb3ZlKHRoaXMuX19zZWVrTGlzdGVuZXJzLCBlbmdpbmUpO1xuICAgICAgfVxuXG4gICAgICBlbmdpbmUudHJhbnNwb3J0ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzeWNocm9uaXplIGV2ZW50IGVuZ2luZVxuICAgKi9cbiAgVHJhbnNwb3J0LnByb3RvdHlwZS5yZXN5bmMgPSBmdW5jdGlvbihlbmdpbmUpIHtcbiAgICBpZiAoZW5naW5lLnNjaGVkdWxlciA9PT0gdGhpcyAmJiBlbmdpbmUuc3luY0V2ZW50ICYmIGVuZ2luZS5leGVjdXRlRXZlbnQpIHtcbiAgICAgIHRoaXMuX19zeW5jKHRoaXMudGltZSk7XG5cbiAgICAgIGlmICh0aGlzLl9zcGVlZCAhPT0gMCkge1xuICAgICAgICBpZiAoZW5naW5lLmFsaWduVG9UcmFuc3BvcnRQb3NpdGlvbilcbiAgICAgICAgICB0aGlzLl9fbmV4dEV2ZW50UG9zaXRpb24gPSB0aGlzLl9fcG9zaXRpb25FdmVudHMubW92ZShlbmdpbmUsIHRoaXMuX19wb3NpdGlvbik7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aGlzLl9fbmV4dEV2ZW50VGltZSA9IHRoaXMuX190aW1lRXZlbnRzLm1vdmUoZW5naW5lLCB0aGlzLl9fdGltZSk7XG5cbiAgICAgICAgdGhpcy5fX3Jlc2NoZWR1bGUoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzY2hlZHVsZSBldmVudCBlbmdpbmUgYXQgZ2l2ZW4gdGltZSAob3IgcG9zaXRpb24pXG4gICAqL1xuICBUcmFuc3BvcnQucHJvdG90eXBlLnJlc2NoZWR1bGUgPSBmdW5jdGlvbihlbmdpbmUsIHRpbWUpIHtcbiAgICBpZiAoZW5naW5lLnNjaGVkdWxlciA9PT0gdGhpcyAmJiBlbmdpbmUuc3luY0V2ZW50ICYmIGVuZ2luZS5leGVjdXRlRXZlbnQpIHtcbiAgICAgIHRoaXMuX19zeW5jKHRoaXMudGltZSk7XG5cbiAgICAgIGlmICh0aGlzLl9zcGVlZCAhPT0gMCkge1xuICAgICAgICBpZiAoZW5naW5lLmFsaWduVG9UcmFuc3BvcnRQb3NpdGlvbilcbiAgICAgICAgICB0aGlzLl9fbmV4dEV2ZW50UG9zaXRpb24gPSB0aGlzLl9fcG9zaXRpb25FdmVudHMubW92ZShlbmdpbmUsIHRpbWUsIGZhbHNlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHRoaXMuX19uZXh0RXZlbnRUaW1lID0gdGhpcy5fX3RpbWVFdmVudHMubW92ZShlbmdpbmUsIHRpbWUsIGZhbHNlKTtcblxuICAgICAgICB0aGlzLl9fcmVzY2hlZHVsZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuO3JldHVybiBUcmFuc3BvcnQ7fSkoRXZlbnRFbmdpbmUpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zcG9ydDsiXX0=
