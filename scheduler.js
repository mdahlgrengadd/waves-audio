/* written in ECMAscript 6 */
/**
 * @fileoverview WAVE scheduler singleton based on audio time (time-engine master)
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 */
'use strict';

var audioContext = require("audio-context");
var PriorityQueue = require("priority-queue");
var TimeEngine = require("time-engine");

function arrayRemove(array, value) {
  var index = array.indexOf(value);

  if (index >= 0) {
    array.splice(index, 1);
    return true;
  }

  return false;
}

var Scheduler = (function(){var PRS$0 = (function(o,t){o["__proto__"]={"a":t};return o["a"]===t})({},{});var DP$0 = Object.defineProperty;var GOPD$0 = Object.getOwnPropertyDescriptor;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,GOPD$0(s,p));}}return t};var DPS$0 = Object.defineProperties;var proto$0={};
  function Scheduler() {
    this.__queue = new PriorityQueue();
    this.__engines = [];

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
  }DPS$0(Scheduler.prototype,{currentTime: {"get": $currentTime_get$0, "configurable":true,"enumerable":true}});DP$0(Scheduler,"prototype",{"configurable":false,"enumerable":false,"writable":false});

  // setTimeout scheduling loop
  proto$0.__tick = function() {
    var nextTime = this.__nextTime;

    this.__timeout = null;

    while (nextTime <= audioContext.currentTime + this.lookahead) {
      this.__currentTime = nextTime;

      var nextEngine = this.__queue.head;
      var nextEngineTime = nextEngine.advanceTime(this.__currentTime);

      if(nextEngineTime)
        nextTime = this.__queue.move(nextEngine, Math.max(nextEngineTime, this.__currentTime));
      else
        nextTime = this.__queue.time;
    }

    this.__currentTime = null;

    this.__reschedule(nextTime);
  };

  proto$0.__reschedule = function(nextTime) {var this$0 = this;
    if (this.__timeout) {
      clearTimeout(this.__timeout);
      this.__timeout = null;
    }

    if (nextTime !== Infinity) {
      this.__nextTime = nextTime;

      var timeOutDelay = Math.max((nextTime - audioContext.currentTime - this.lookahead), this.period);

      this.__timeout = setTimeout(function()  {
        this$0.__tick();
      }, timeOutDelay * 1000);
    }
  };

  /**
   * Get scheduler time
   * @return {Number} current scheduler time including lookahead
   */
  function $currentTime_get$0() {
    return this.__currentTime || audioContext.currentTime + this.lookahead;
  }

  /**
   * Add a callback to the scheduler
   * @param {Function} callback function(time, audioTime) to be called
   * @param {Number} delay of first callback (default is 0)
   * @param {Number} period callback period (default is 0 for one-shot)
   * @return {Object} scheduled object that can be used to call remove and reset
   */
  proto$0.callback = function(callbackFunction) {var delay = arguments[1];if(delay === void 0)delay = 0;var period = arguments[2];if(period === void 0)period = 0;
    var engine = {
      period: period || Infinity,
      advanceTime: function(time) {
        callbackFunction(time);
        return time + this.period;
      }
    };

    var nextTime = this.__queue.insert(engine, this.currentTime + delay);
    this.__reschedule(nextTime);

    return engine;
  };

  /**
   * Add a time engine to the scheduler
   * @param {Object} engine time engine to be added to the scheduler
   * @param {Number} delay scheduling delay time
   * @param {Function} function to get current position
   */
  proto$0.add = function(engine) {var delay = arguments[1];if(delay === void 0)delay = 0;var getCurrentPosition = arguments[2];if(getCurrentPosition === void 0)getCurrentPosition = null;var this$0 = this;
    if (!engine.interface) {
      if (TimeEngine.implementsScheduled(engine)) {
        this.__engines.push(engine);

        TimeEngine.setScheduled(engine, function(time)  {
          var nextTime = this$0.__queue.move(engine, time);
          this$0.__reschedule(nextTime);
        }, function()  {
          return this$0.currentTime;
        }, getCurrentPosition);

        var nextTime = this.__queue.insert(engine, this.currentTime + delay);
        this.__reschedule(nextTime);
      } else {
        throw new Error("object cannot be added to scheduler");
      }
    } else {
      throw new Error("object has already been added to a master");
    }

    return engine;
  };

  /**
   * Remove time engine or callback from the scheduler
   * @param {Object} engine time engine or callback to be removed from the scheduler
   */
  proto$0.remove = function(engine) {
    if (arrayRemove(this.__engines, engine)) {
      TimeEngine.resetInterface(engine);

      var nextTime = this.__queue.remove(engine);
      this.__reschedule(nextTime);
    } else {
      throw new Error("object has not been added to this scheduler");
    }
  };

  /**
   * Reschedule a scheduled time engine or callback at a given time
   * @param {Object} engine time engine or callback to be rescheduled
   * @param {Number} time time when to reschedule
   */
  proto$0.reset = function(engine, time) {
    var nextTime = this.__queue.move(engine, time);
    this.__reschedule(nextTime);
  };
MIXIN$0(Scheduler.prototype,proto$0);proto$0=void 0;return Scheduler;})();

// export scheduler singleton
module.exports = new Scheduler();