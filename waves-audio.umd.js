(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.wavesAudio = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var wavesAudio = {
  // core
  audioContext: require('./dist/core/audio-context'),
  TimeEngine: require('./dist/core/time-engine'),
  // engines
  GranularEngine: require('./dist/engines/granular-engine'),
  Metronome: require('./dist/engines/metronome'),
  PlayerEngine: require('./dist/engines/player-engine'),
  SegmentEngine: require('./dist/engines/segment-engine'),
  // masters
  PlayControl: require('./dist/masters/play-control'),
  Transport: require('./dist/masters/transport'),
  // expose these ?
  Scheduler: require('./dist/masters/scheduler'),
  SimpleScheduler: require('./dist/masters/simple-scheduler'),
  // utils
  PriorityQueue: require('./dist/utils/priority-queue'),
  // factories
  getScheduler: require('./dist/masters/factories').getScheduler,
  getSimpleScheduler: require('./dist/masters/factories').getSimpleScheduler
};



module.exports = wavesAudio;
},{"./dist/core/audio-context":3,"./dist/core/time-engine":4,"./dist/engines/granular-engine":5,"./dist/engines/metronome":6,"./dist/engines/player-engine":7,"./dist/engines/segment-engine":8,"./dist/masters/factories":9,"./dist/masters/play-control":10,"./dist/masters/scheduler":11,"./dist/masters/simple-scheduler":12,"./dist/masters/transport":13,"./dist/utils/priority-queue":14}],2:[function(require,module,exports){
"use strict";

/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/* 

This monkeypatch library is intended to be included in projects that are
written to the proper AudioContext spec (instead of webkitAudioContext), 
and that use the new naming and proper bits of the Web Audio API (e.g. 
using BufferSourceNode.start() instead of BufferSourceNode.noteOn()), but may
have to run on systems that only support the deprecated bits.

This library should be harmless to include if the browser supports 
unprefixed "AudioContext", and/or if it supports the new names.  

The patches this library handles:
if window.AudioContext is unsupported, it will be aliased to webkitAudioContext().
if AudioBufferSourceNode.start() is unimplemented, it will be routed to noteOn() or
noteGrainOn(), depending on parameters.

The following aliases only take effect if the new names are not already in place:

AudioBufferSourceNode.stop() is aliased to noteOff()
AudioContext.createGain() is aliased to createGainNode()
AudioContext.createDelay() is aliased to createDelayNode()
AudioContext.createScriptProcessor() is aliased to createJavaScriptNode()
AudioContext.createPeriodicWave() is aliased to createWaveTable()
OscillatorNode.start() is aliased to noteOn()
OscillatorNode.stop() is aliased to noteOff()
OscillatorNode.setPeriodicWave() is aliased to setWaveTable()
AudioParam.setTargetAtTime() is aliased to setTargetValueAtTime()

This library does NOT patch the enumerated type changes, as it is 
recommended in the specification that implementations support both integer
and string types for AudioPannerNode.panningModel, AudioPannerNode.distanceModel 
BiquadFilterNode.type and OscillatorNode.type.

*/
(function (global, exports, perf) {
  "use strict";

  function fixSetTarget(param) {
    if (!param) {
      // if NYI, just return
      return;
    }if (!param.setTargetAtTime) param.setTargetAtTime = param.setTargetValueAtTime;
  }

  if (window.hasOwnProperty("webkitAudioContext") && !window.hasOwnProperty("AudioContext")) {
    window.AudioContext = webkitAudioContext;

    if (!AudioContext.prototype.hasOwnProperty("createGain")) AudioContext.prototype.createGain = AudioContext.prototype.createGainNode;
    if (!AudioContext.prototype.hasOwnProperty("createDelay")) AudioContext.prototype.createDelay = AudioContext.prototype.createDelayNode;
    if (!AudioContext.prototype.hasOwnProperty("createScriptProcessor")) AudioContext.prototype.createScriptProcessor = AudioContext.prototype.createJavaScriptNode;
    if (!AudioContext.prototype.hasOwnProperty("createPeriodicWave")) AudioContext.prototype.createPeriodicWave = AudioContext.prototype.createWaveTable;

    AudioContext.prototype.internal_createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function () {
      var node = this.internal_createGain();
      fixSetTarget(node.gain);
      return node;
    };

    AudioContext.prototype.internal_createDelay = AudioContext.prototype.createDelay;
    AudioContext.prototype.createDelay = function (maxDelayTime) {
      var node = maxDelayTime ? this.internal_createDelay(maxDelayTime) : this.internal_createDelay();
      fixSetTarget(node.delayTime);
      return node;
    };

    AudioContext.prototype.internal_createBufferSource = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      var node = this.internal_createBufferSource();
      if (!node.start) {
        node.start = function (when, offset, duration) {
          if (offset || duration) this.noteGrainOn(when, offset, duration);else this.noteOn(when);
        };
      }
      if (!node.stop) node.stop = node.noteOff;
      fixSetTarget(node.playbackRate);
      return node;
    };

    AudioContext.prototype.internal_createDynamicsCompressor = AudioContext.prototype.createDynamicsCompressor;
    AudioContext.prototype.createDynamicsCompressor = function () {
      var node = this.internal_createDynamicsCompressor();
      fixSetTarget(node.threshold);
      fixSetTarget(node.knee);
      fixSetTarget(node.ratio);
      fixSetTarget(node.reduction);
      fixSetTarget(node.attack);
      fixSetTarget(node.release);
      return node;
    };

    AudioContext.prototype.internal_createBiquadFilter = AudioContext.prototype.createBiquadFilter;
    AudioContext.prototype.createBiquadFilter = function () {
      var node = this.internal_createBiquadFilter();
      fixSetTarget(node.frequency);
      fixSetTarget(node.detune);
      fixSetTarget(node.Q);
      fixSetTarget(node.gain);
      return node;
    };

    if (AudioContext.prototype.hasOwnProperty("createOscillator")) {
      AudioContext.prototype.internal_createOscillator = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function () {
        var node = this.internal_createOscillator();
        if (!node.start) node.start = node.noteOn;
        if (!node.stop) node.stop = node.noteOff;
        if (!node.setPeriodicWave) node.setPeriodicWave = node.setWaveTable;
        fixSetTarget(node.frequency);
        fixSetTarget(node.detune);
        return node;
      };
    }
  }
})(window);

},{}],3:[function(require,module,exports){
"use strict";

// monkeypatch old webAudioAPI
require("./ac-monkeypatch");
// exposes a single instance
module.exports = new AudioContext();

},{"./ac-monkeypatch":2}],4:[function(require,module,exports){
"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var defaultAudioContext = require("./audio-context");

/**
 * @class TimeEngine
 * @classdesc Base class for time engines
 *
 * Time engines are components that generate more or less regular audio events and/or playback a media stream.
 * They implement one or multiple interfaces to be synchronized by a master such as a scheduler, a transport or a play-control.
 * The provided interfaces are "scheduled", "transported", and "play-controlled".
 *
 * In the "scheduled" interface the engine implements a method "advanceTime" that is called by the master (usually the scheduler)
 * and returns the delay until the next call of "advanceTime". The master provides the engine with a function "resetNextTime"
 * to reschedule the next call to another time.
 *
 * In the "transported" interface the master (usually a transport) first calls the method "syncPosition" that returns the position
 * of the first event generated by the engine regarding the playing direction (sign of the speed argument). Events are generated
 * through the method "advancePosition" that returns the position of the next event generated through "advancePosition".
 *
 * In the "speed-controlled" interface the engine is controlled by the method "syncSpeed".
 *
 * For all interfaces the engine is provided with the attribute getters "currentTime" and "currentPosition" (for the case that the master
 * does not implement these attribute getters, the base class provides default implementations).
 */

var TimeEngine = (function () {

  /**
   * @constructor
   */

  function TimeEngine() {
    var audioContext = arguments[0] === undefined ? defaultAudioContext : arguments[0];

    _classCallCheck(this, TimeEngine);

    this.audioContext = audioContext;

    /**
     * Current master
     * @type {Object}
     */
    this.master = null;

    /**
     * Interface currently used
     * @type {String}
     */
    this["interface"] = null;

    /**
     * Output audio node
     * @type {Object}
     */
    this.outputNode = null;
  }

  _createClass(TimeEngine, {
    currentTime: {

      /**
       * Get the time engine's current master time
       * @type {Function}
       *
       * This function provided by the master.
       */

      get: function () {
        return this.audioContext.currentTime;
      }
    },
    currentPosition: {

      /**
       * Get the time engine's current master position
       * @type {Function}
       *
       * This function provided by the master.
       */

      get: function () {
        return 0;
      }
    },
    resetNextTime: {

      /**
       * Function provided by the scheduler to reset the engine's next time
       * @param {Number} time new engine time (immediately if not specified)
       */

      value: function resetNextTime() {
        var time = arguments[0] === undefined ? null : arguments[0];
      }
    },
    resetNextPosition: {

      /**
       * Function provided by the transport to reset the next position or to request resynchronizing the engine's position
       * @param {Number} position new engine position (will call syncPosition with the current position if not specified)
       */

      value: function resetNextPosition() {
        var position = arguments[0] === undefined ? null : arguments[0];
      }
    },
    __setGetters: {
      value: function __setGetters(getCurrentTime, getCurrentPosition) {
        if (getCurrentTime) {
          Object.defineProperty(this, "currentTime", {
            configurable: true,
            get: getCurrentTime
          });
        }

        if (getCurrentPosition) {
          Object.defineProperty(this, "currentPosition", {
            configurable: true,
            get: getCurrentPosition
          });
        }
      }
    },
    __deleteGetters: {
      value: function __deleteGetters() {
        delete this.currentTime;
        delete this.currentPosition;
      }
    },
    implementsScheduled: {

      /**
       * Check whether the time engine implements the scheduled interface
       **/

      value: function implementsScheduled() {
        return this.advanceTime && this.advanceTime instanceof Function;
      }
    },
    implementsTransported: {

      /**
       * Check whether the time engine implements the transported interface
       **/

      value: function implementsTransported() {
        return this.syncPosition && this.syncPosition instanceof Function && this.advancePosition && this.advancePosition instanceof Function;
      }
    },
    implementsSpeedControlled: {

      /**
       * Check whether the time engine implements the speed-controlled interface
       **/

      value: function implementsSpeedControlled() {
        return this.syncSpeed && this.syncSpeed instanceof Function;
      }
    },
    setScheduled: {
      value: function setScheduled(master, resetNextTime, getCurrentTime, getCurrentPosition) {
        this.master = master;
        this["interface"] = "scheduled";

        this.__setGetters(getCurrentTime, getCurrentPosition);

        if (resetNextTime) this.resetNextTime = resetNextTime;
      }
    },
    setTransported: {
      value: function setTransported(master, resetNextPosition, getCurrentTime, getCurrentPosition) {
        this.master = master;
        this["interface"] = "transported";

        this.__setGetters(getCurrentTime, getCurrentPosition);

        if (resetNextPosition) this.resetNextPosition = resetNextPosition;
      }
    },
    setSpeedControlled: {
      value: function setSpeedControlled(master, getCurrentTime, getCurrentPosition) {
        this.master = master;
        this["interface"] = "speed-controlled";

        this.__setGetters(getCurrentTime, getCurrentPosition);
      }
    },
    resetInterface: {
      value: function resetInterface() {
        this.__deleteGetters();

        delete this.resetNextTime;
        delete this.resetNextPosition;

        this.master = null;
        this["interface"] = null;
      }
    },
    connect: {

      /**
       * Connect audio node
       * @param {Object} target audio node
       */

      value: function connect(target) {
        this.outputNode.connect(target);
        return this;
      }
    },
    disconnect: {

      /**
       * Disconnect audio node
       * @param {Number} connection connection to be disconnected
       */

      value: function disconnect(connection) {
        this.outputNode.disconnect(connection);
        return this;
      }
    }
  });

  return TimeEngine;
})();

module.exports = TimeEngine;
/* written in ECMAscript 6 */
/**
 * @fileoverview WAVE audio time engine base class
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 */

},{"./audio-context":3,"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/create-class":17}],5:[function(require,module,exports){
"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _get = require("babel-runtime/helpers/get")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _core = require("babel-runtime/core-js")["default"];

var TimeEngine = require("../core/time-engine");

/**
 * @class GranularEngine
 */

var GranularEngine = (function (_TimeEngine) {
  /**
   * @constructor
   * @param {AudioBuffer} buffer initial audio buffer for granular synthesis
   *
   * The engine implements the "scheduled" interface.
   * The grain position (grain onset or center time in the audio buffer) is optionally
   * determined by the engine's currentPosition attribute.
   */

  function GranularEngine() {
    var options = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, GranularEngine);

    _get(_core.Object.getPrototypeOf(GranularEngine.prototype), "constructor", this).call(this, options.audioContext);

    /**
     * Audio buffer
     * @type {AudioBuffer}
     */
    this.buffer = options.buffer || null;

    /**
     * Absolute grain period in sec
     * @type {Number}
     */
    this.periodAbs = options.periodAbs || 0.01;

    /**
     * Grain period relative to absolute duration
     * @type {Number}
     */
    this.periodRel = options.periodRel || 0;

    /**
     * Amout of random grain period variation relative to grain period
     * @type {Number}
     */
    this.periodVar = options.periodVar || 0;

    /**
     * Grain position (onset time in audio buffer) in sec
     * @type {Number}
     */
    this.position = options.position || 0;

    /**
     * Amout of random grain position variation in sec
     * @type {Number}
     */
    this.positionVar = options.positionVar || 0.003;

    /**
     * Absolute grain duration in sec
     * @type {Number}
     */
    this.durationAbs = options.durationAbs || 0.1; // absolute grain duration

    /**
     * Grain duration relative to grain period (overlap)
     * @type {Number}
     */
    this.durationRel = options.durationRel || 0;

    /**
     * Absolute attack time in sec
     * @type {Number}
     */
    this.attackAbs = options.attackAbs || 0;

    /**
     * Attack time relative to grain duration
     * @type {Number}
     */
    this.attackRel = options.attackRel || 0.5;

    /**
     * Shape of attack
     * @type {String} 'lin' for linear ramp, 'exp' for exponential
     */
    this.attackShape = options.attackShape || "lin";

    /**
     * Absolute release time in sec
     * @type {Number}
     */
    this.releaseAbs = options.releaseAbs || 0;

    /**
     * Release time relative to grain duration
     * @type {Number}
     */
    this.releaseRel = options.releaseRel || 0.5;

    /**
     * Shape of release
     * @type {String} 'lin' for linear ramp, 'exp' for exponential
     */
    this.releaseShape = options.releaseShape || "lin";

    /**
     * Offset (start/end value) for exponential attack/release
     * @type {Number} offset
     */
    this.expRampOffset = options.expRampOffset || 0.0001;

    /**
     * Grain resampling in cent
     * @type {Number}
     */
    this.resampling = options.resampling || 0;

    /**
     * Amout of random resampling variation in cent
     * @type {Number}
     */
    this.resamplingVar = options.resamplingVar || 0;

    /**
     * Whether the grain position refers to the center of the grain (or the beginning)
     * @type {Bool}
     */
    this.centered = options.centered || true;

    /**
     * Whether the audio buffer and grain position are considered as cyclic
     * @type {Bool}
     */
    this.cyclic = options.cyclic || false;

    this.__gainNode = this.audioContext.createGain();
    this.__gainNode.gain.value = options.gain || 1;

    this.outputNode = this.__gainNode;
  }

  _inherits(GranularEngine, _TimeEngine);

  _createClass(GranularEngine, {
    bufferDuration: {
      get: function () {
        var bufferDuration = this.buffer.duration;

        if (this.buffer.wrapAroundExtention) bufferDuration -= this.buffer.wrapAroundExtention;

        return bufferDuration;
      }
    },
    currentPosition: {

      // TimeEngine attribute

      get: function () {
        return this.position;
      }
    },
    advanceTime: {

      // TimeEngine method (scheduled interface)

      value: function advanceTime(time) {
        return time + this.trigger(time);
      }
    },
    playbackLength: {
      get: function () {
        return this.bufferDuration;
      }
    },
    gain: {

      /**
       * Set gain
       * @param {Number} value linear gain factor
       */

      set: function (value) {
        this.__gainNode.gain.value = value;
      },

      /**
       * Get gain
       * @return {Number} current gain
       */
      get: function () {
        return this.__gainNode.gain.value;
      }
    },
    trigger: {

      /**
       * Trigger a grain
       * @param {Number} time grain synthesis audio time
       * @return {Number} period to next grain
       *
       * This function can be called at any time (whether the engine is scheduled or not)
       * to generate a single grain according to the current grain parameters.
       */

      value: function trigger(time) {
        var outputNode = arguments[1] === undefined ? this.outputNode : arguments[1];

        var audioContext = this.audioContext;
        var grainTime = time || audioContext.currentTime;
        var grainPeriod = this.periodAbs;
        var grainPosition = this.currentPosition;
        var grainDuration = this.durationAbs;

        if (this.buffer) {
          var resamplingRate = 1;

          // calculate resampling
          if (this.resampling !== 0 || this.resamplingVar > 0) {
            var randomResampling = (Math.random() - 0.5) * 2 * this.resamplingVar;
            resamplingRate = Math.pow(2, (this.resampling + randomResampling) / 1200);
          }

          grainPeriod += this.periodRel * grainDuration;
          grainDuration += this.durationRel * grainPeriod;

          // grain period randon variation
          if (this.periodVar > 0) grainPeriod += 2 * (Math.random() - 0.5) * this.periodVar * grainPeriod;

          // center grain
          if (this.centered) grainPosition -= 0.5 * grainDuration;

          // randomize grain position
          if (this.positionVar > 0) grainPosition += (2 * Math.random() - 1) * this.positionVar;

          var bufferDuration = this.bufferDuration;

          // wrap or clip grain position and duration into buffer duration
          if (grainPosition < 0 || grainPosition >= bufferDuration) {
            if (this.cyclic) {
              var cycles = grainPosition / bufferDuration;
              grainPosition = (cycles - Math.floor(cycles)) * bufferDuration;

              if (grainPosition + grainDuration > this.buffer.duration) grainDuration = this.buffer.duration - grainPosition;
            } else {
              if (grainPosition < 0) {
                grainTime -= grainPosition;
                grainDuration += grainPosition;
                grainPosition = 0;
              }

              if (grainPosition + grainDuration > bufferDuration) grainDuration = bufferDuration - grainPosition;
            }
          }

          // make grain
          if (this.gain > 0 && grainDuration >= 0.001) {
            // make grain envelope
            var envelopeNode = audioContext.createGain();
            var attack = this.attackAbs + this.attackRel * grainDuration;
            var release = this.releaseAbs + this.releaseRel * grainDuration;

            if (attack + release > grainDuration) {
              var factor = grainDuration / (attack + release);
              attack *= factor;
              release *= factor;
            }

            var attackEndTime = grainTime + attack;
            var grainEndTime = grainTime + grainDuration;
            var releaseStartTime = grainEndTime - release;

            if (this.attackShape === "lin") {
              envelopeNode.gain.setValueAtTime(0, grainTime);
              envelopeNode.gain.linearRampToValueAtTime(1, attackEndTime);
            } else {
              envelopeNode.gain.setValueAtTime(this.expRampOffset, grainTime);
              envelopeNode.gain.exponentialRampToValueAtTime(1, attackEndTime);
            }

            if (releaseStartTime > attackEndTime) envelopeNode.gain.setValueAtTime(1, releaseStartTime);

            if (this.releaseShape === "lin") {
              envelopeNode.gain.linearRampToValueAtTime(0, grainEndTime);
            } else {
              envelopeNode.gain.exponentialRampToValueAtTime(this.expRampOffset, grainEndTime);
            }

            envelopeNode.connect(outputNode);

            // make source
            var source = audioContext.createBufferSource();

            source.buffer = this.buffer;
            source.playbackRate.value = resamplingRate;
            source.connect(envelopeNode);

            source.start(grainTime, grainPosition);
            source.stop(grainTime + grainDuration / resamplingRate);
          }
        }

        return grainPeriod;
      }
    }
  });

  return GranularEngine;
})(TimeEngine);

module.exports = GranularEngine;
/* written in ECMAscript 6 */
/**
 * @fileoverview WAVE audio granular synthesis engine
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 */

},{"../core/time-engine":4,"babel-runtime/core-js":15,"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/create-class":17,"babel-runtime/helpers/get":18,"babel-runtime/helpers/inherits":19}],6:[function(require,module,exports){
"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _get = require("babel-runtime/helpers/get")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _core = require("babel-runtime/core-js")["default"];

var TimeEngine = require("../core/time-engine");

var Metronome = (function (_TimeEngine) {
  function Metronome() {
    var options = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Metronome);

    _get(_core.Object.getPrototypeOf(Metronome.prototype), "constructor", this).call(this, options.audioContext);

    /**
     * Metronome period in sec
     * @type {Number}
     */
    this.period = options.period || 1;

    /**
     * Metronome click frequency
     * @type {Number}
     */
    this.clickFreq = options.clickFreq || 600;

    /**
     * Metronome click attack time
     * @type {Number}
     */
    this.clickAttack = options.clickAttack || 0.002;

    /**
     * Metronome click release time
     * @type {Number}
     */
    this.clickRelease = options.clickRelease || 0.098;

    this.__phase = 0;

    this.__gainNode = this.audioContext.createGain();
    this.__gainNode.gain.value = options.gain || 1;

    this.outputNode = this.__gainNode;
  }

  _inherits(Metronome, _TimeEngine);

  _createClass(Metronome, {
    advanceTime: {

      // TimeEngine method (scheduled interface)

      value: function advanceTime(time) {
        this.trigger(time);
        return time + this.period;
      }
    },
    syncPosition: {

      // TimeEngine method (transported interface)

      value: function syncPosition(time, position, speed) {
        var nextPosition = (Math.floor(position / this.period) + this.__phase) * this.period;

        if (speed > 0 && nextPosition < position) nextPosition += this.period;else if (speed < 0 && nextPosition > position) nextPosition -= this.period;

        return nextPosition;
      }
    },
    advancePosition: {

      // TimeEngine method (transported interface)

      value: function advancePosition(time, position, speed) {
        this.trigger(time);

        if (speed < 0) {
          return position - this.period;
        }return position + this.period;
      }
    },
    trigger: {

      /**
       * Trigger metronome click
       * @param {Number} time metronome click synthesis audio time
       */

      value: function trigger(time) {
        var audioContext = this.audioContext;
        var clickAttack = this.clickAttack;
        var clickRelease = this.clickRelease;
        var period = this.period;

        if (period < clickAttack + clickRelease) {
          var scale = period / (clickAttack + clickRelease);
          clickAttack *= scale;
          clickRelease *= scale;
        }

        this.__envNode = audioContext.createGain();
        this.__envNode.gain.value = 0;
        this.__envNode.gain.setValueAtTime(0, time);
        this.__envNode.gain.linearRampToValueAtTime(1, time + clickAttack);
        this.__envNode.gain.exponentialRampToValueAtTime(1e-7, time + clickAttack + clickRelease);
        this.__envNode.gain.setValueAtTime(0, time);
        this.__envNode.connect(this.__gainNode);

        this.__osc = audioContext.createOscillator();
        this.__osc.frequency.value = this.clickFreq;
        this.__osc.start(0);
        this.__osc.stop(time + clickAttack + clickRelease);
        this.__osc.connect(this.__envNode);
      }
    },
    gain: {

      /**
       * Set gain
       * @param {Number} value linear gain factor
       */

      set: function (value) {
        this.__gainNode.gain.value = value;
      },

      /**
       * Get gain
       * @return {Number} current gain
       */
      get: function () {
        return this.__gainNode.gain.value;
      }
    },
    phase: {

      /**
       * Set phase parameter
       * @param {Number} phase metronome phase (0...1)
       */

      set: function (phase) {
        this.__phase = phase - Math.floor(phase);
        this.resetNextPosition();
      },

      /**
       * Get phase parameter
       * @return {Number} value of phase parameter
       */
      get: function () {
        return this.__phase;
      }
    }
  });

  return Metronome;
})(TimeEngine);

module.exports = Metronome;
/* written in ECMAscript 6 */
/**
 * @fileoverview WAVE audio metronome engine
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 */

},{"../core/time-engine":4,"babel-runtime/core-js":15,"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/create-class":17,"babel-runtime/helpers/get":18,"babel-runtime/helpers/inherits":19}],7:[function(require,module,exports){
"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _get = require("babel-runtime/helpers/get")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _core = require("babel-runtime/core-js")["default"];

var TimeEngine = require("../core/time-engine");

var PlayerEngine = (function (_TimeEngine) {
  function PlayerEngine() {
    var options = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, PlayerEngine);

    _get(_core.Object.getPrototypeOf(PlayerEngine.prototype), "constructor", this).call(this, options.audioContext);

    this.transport = null; // set when added to transporter

    /**
     * Audio buffer
     * @type {AudioBuffer}
     */
    this.buffer = options.buffer || null;

    /**
     * Fade time for chaining segments (e.g. in start, stop, and seek)
     * @type {AudioBuffer}
     */
    this.fadeTime = 0.005;

    this.__time = 0;
    this.__position = 0;
    this.__speed = 0;
    this.__cyclic = false;

    this.__bufferSource = null;
    this.__envNode = null;

    this.__playingSpeed = 1;

    this.__gainNode = this.audioContext.createGain();
    this.__gainNode.gain.value = options.gain || 1;

    this.outputNode = this.__gainNode;
  }

  _inherits(PlayerEngine, _TimeEngine);

  _createClass(PlayerEngine, {
    __start: {
      value: function __start(time, position, speed) {
        var audioContext = this.audioContext;

        if (this.buffer) {
          var bufferDuration = this.buffer.duration;

          if (this.buffer.wrapAroundExtension) bufferDuration -= this.buffer.wrapAroundExtension;

          if (this.__cyclic && (position < 0 || position >= bufferDuration)) {
            var phase = position / bufferDuration;
            position = (phase - Math.floor(phase)) * bufferDuration;
          }

          if (position >= 0 && position < bufferDuration && speed > 0) {
            this.__envNode = audioContext.createGain();
            this.__envNode.gain.setValueAtTime(0, time);
            this.__envNode.gain.linearRampToValueAtTime(1, time + this.fadeTime);
            this.__envNode.connect(this.__gainNode);

            this.__bufferSource = audioContext.createBufferSource();
            this.__bufferSource.buffer = this.buffer;
            this.__bufferSource.playbackRate.value = speed;
            this.__bufferSource.loop = this.__cyclic;
            this.__bufferSource.loopStart = 0;
            this.__bufferSource.loopEnd = bufferDuration;
            this.__bufferSource.start(time, position);
            this.__bufferSource.connect(this.__envNode);
          }
        }
      }
    },
    __halt: {
      value: function __halt(time) {
        if (this.__bufferSource) {
          this.__envNode.gain.cancelScheduledValues(time);
          this.__envNode.gain.setValueAtTime(this.__envNode.gain.value, time);
          this.__envNode.gain.linearRampToValueAtTime(0, time + this.fadeTime);
          this.__bufferSource.stop(time + this.fadeTime);

          this.__bufferSource = null;
          this.__envNode = null;
        }
      }
    },
    syncSpeed: {

      // TimeEngine method (speed-controlled interface)

      value: function syncSpeed(time, position, speed) {
        var seek = arguments[3] === undefined ? false : arguments[3];

        var lastSpeed = this.__speed;

        if (speed !== lastSpeed || seek) {
          if (seek || lastSpeed * speed < 0) {
            this.__halt(time);
            this.__start(time, position, speed);
          } else if (lastSpeed === 0 || seek) {
            this.__start(time, position, speed);
          } else if (speed === 0) {
            this.__halt(time);
          } else if (this.__bufferSource) {
            this.__bufferSource.playbackRate.setValueAtTime(speed, time);
          }

          this.__speed = speed;
        }
      }
    },
    cyclic: {

      /**
       * Set whether the audio buffer is considered as cyclic
       * @param {Bool} cyclic whether the audio buffer is considered as cyclic
       */

      set: function (cyclic) {
        if (cyclic !== this.__cyclic) {
          var time = this.currentTime;
          var position = this.currentosition;

          this.__halt(time);
          this.__cyclic = cyclic;

          if (this.__speed !== 0) this.__start(time, position, this.__speed);
        }
      },

      /**
       * Get whether the audio buffer is considered as cyclic
       * @return {Bool} whether the audio buffer is considered as cyclic
       */
      get: function () {
        return this.__cyclic;
      }
    },
    gain: {

      /**
       * Set gain
       * @param {Number} value linear gain factor
       */

      set: function (value) {
        var time = this.__sync();

        this.__gainNode.cancelScheduledValues(time);
        this.__gainNode.setValueAtTime(this.__gainNode.gain.value, time);
        this.__gainNode.linearRampToValueAtTime(0, time + this.fadeTime);
      },

      /**
       * Get gain
       * @return {Number} current gain
       */
      get: function () {
        return this.__gainNode.gain.value;
      }
    }
  });

  return PlayerEngine;
})(TimeEngine);

module.exports = PlayerEngine;
/* written in ECMAscript 6 */
/**
 * @fileoverview WAVE audio player engine
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 */

},{"../core/time-engine":4,"babel-runtime/core-js":15,"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/create-class":17,"babel-runtime/helpers/get":18,"babel-runtime/helpers/inherits":19}],8:[function(require,module,exports){
"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _get = require("babel-runtime/helpers/get")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _core = require("babel-runtime/core-js")["default"];

var TimeEngine = require("../core/time-engine");

function getCurrentOrPreviousIndex(sortedArray, value) {
  var index = arguments[2] === undefined ? 0 : arguments[2];

  var size = sortedArray.length;

  if (size > 0) {
    var firstVal = sortedArray[0];
    var lastVal = sortedArray[size - 1];

    if (value < firstVal) index = -1;else if (value >= lastVal) index = size - 1;else {
      if (index < 0 || index >= size) index = Math.floor((size - 1) * (value - firstVal) / (lastVal - firstVal));

      while (sortedArray[index] > value) index--;

      while (sortedArray[index + 1] <= value) index++;
    }
  }

  return index;
}

function getCurrentOrNextIndex(sortedArray, value) {
  var index = arguments[2] === undefined ? 0 : arguments[2];

  var size = sortedArray.length;

  if (size > 0) {
    var firstVal = sortedArray[0];
    var lastVal = sortedArray[size - 1];

    if (value <= firstVal) index = 0;else if (value >= lastVal) index = size;else {
      if (index < 0 || index >= size) index = Math.floor((size - 1) * (value - firstVal) / (lastVal - firstVal));

      while (sortedArray[index] < value) index++;

      while (sortedArray[index + 1] >= value) index--;
    }
  }

  return index;
}

/**
 * @class SegmentEngine
 */

var SegmentEngine = (function (_TimeEngine) {
  /**
   * @constructor
   * @param {AudioBuffer} buffer initial audio buffer for granular synthesis
   *
   * The engine implements the "scheduled" and "transported" interfaces.
   * When "scheduled", the engine  generates segments more or less periodically
   * (controlled by the periodAbs, periodRel, and perioVar attributes).
   * When "transported", the engine generates segments at the position of their onset time.
   */

  function SegmentEngine() {
    var options = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, SegmentEngine);

    _get(_core.Object.getPrototypeOf(SegmentEngine.prototype), "constructor", this).call(this, options.audioContext);

    /**
     * Audio buffer
     * @type {AudioBuffer}
     */
    this.buffer = options.buffer || null;

    /**
     * Absolute segment period in sec
     * @type {Number}
     */
    this.periodAbs = options.periodAbs || 0.1;

    /**
     * Segment period relative to inter-segment distance
     * @type {Number}
     */
    this.periodRel = options.periodRel || 0;

    /**
     * Amout of random segment period variation relative to segment period
     * @type {Number}
     */
    this.periodVar = options.periodVar || 0;

    /**
     * Array of segment positions (onset times in audio buffer) in sec
     * @type {Number}
     */
    this.positionArray = options.positionArray || [0];

    /**
     * Amout of random segment position variation in sec
     * @type {Number}
     */
    this.positionVar = options.positionVar || 0;

    /**
     * Array of segment durations in sec
     * @type {Number}
     */
    this.durationArray = options.durationArray || [0];

    /**
     * Absolute segment duration in sec
     * @type {Number}
     */
    this.durationAbs = options.durationAbs || 0;

    /**
     * Segment duration relative to given segment duration or inter-segment distance
     * @type {Number}
     */
    this.durationRel = options.durationRel || 1;

    /**
     * Array of segment offsets in sec
     * @type {Number}
     *
     * offset > 0: the segment's reference position is after the given segment position
     * offset < 0: the given segment position is the segment's reference position and the duration has to be corrected by the offset
     */
    this.offsetArray = options.offsetArray || [0];

    /**
     * Absolute segment offset in sec
     * @type {Number}
     */
    this.offsetAbs = options.offsetAbs || -0.005;

    /**
     * Segment offset relative to segment duration
     * @type {Number}
     */
    this.offsetRel = options.offsetRel || 0;

    /**
     * Time by which all segments are delayed (especially to realize segment offsets)
     * @type {Number}
     */
    this.delay = options.delay || 0.005;

    /**
     * Absolute attack time in sec
     * @type {Number}
     */
    this.attackAbs = options.attackAbs || 0.005;

    /**
     * Attack time relative to segment duration
     * @type {Number}
     */
    this.attackRel = options.attackRel || 0;

    /**
     * Absolute release time in sec
     * @type {Number}
     */
    this.releaseAbs = options.releaseAbs || 0.005;

    /**
     * Release time relative to segment duration
     * @type {Number}
     */
    this.releaseRel = options.releaseRel || 0;

    /**
     * Segment resampling in cent
     * @type {Number}
     */
    this.resampling = options.resampling || 0;

    /**
     * Amout of random resampling variation in cent
     * @type {Number}
     */
    this.resamplingVar = options.resamplingVar || 0;

    /**
     * Index of
     * @type {Number}
     */
    this.segmentIndex = options.segmentIndex || 0;

    /**
     * Whether the audio buffer and segment indices are considered as cyclic
     * @type {Bool}
     */
    this.cyclic = options.cyclic || false;
    this.__cyclicOffset = 0;

    this.__gainNode = this.audioContext.createGain();
    this.__gainNode.gain.value = options.gain || 1;

    this.outputNode = this.__gainNode;
  }

  _inherits(SegmentEngine, _TimeEngine);

  _createClass(SegmentEngine, {
    bufferDuration: {
      get: function () {
        var bufferDuration = this.buffer.duration;

        if (this.buffer.wrapAroundExtention) bufferDuration -= this.buffer.wrapAroundExtention;

        return bufferDuration;
      }
    },
    advanceTime: {

      // TimeEngine method (transported interface)

      value: function advanceTime(time, position, speed) {
        return time + this.trigger(time);
      }
    },
    syncPosition: {

      // TimeEngine method (transported interface)

      value: function syncPosition(time, position, speed) {
        var index = this.segmentIndex;
        var cyclicOffset = 0;
        var bufferDuration = this.bufferDuration;

        if (this.cyclic) {
          var cycles = position / bufferDuration;

          cyclicOffset = Math.floor(cycles) * bufferDuration;
          position -= cyclicOffset;
        }

        if (speed > 0) {
          index = getCurrentOrNextIndex(this.positionArray, position);

          if (index >= this.positionArray.length) {
            index = 0;
            cyclicOffset += bufferDuration;

            if (!this.cyclic) {
              return Infinity;
            }
          }
        } else if (speed < 0) {
          index = getCurrentOrPreviousIndex(this.positionArray, position);

          if (index < 0) {
            index = this.positionArray.length - 1;
            cyclicOffset -= bufferDuration;

            if (!this.cyclic) {
              return -Infinity;
            }
          }
        } else {
          return Infinity;
        }

        this.segmentIndex = index;
        this.__cyclicOffset = cyclicOffset;

        return cyclicOffset + this.positionArray[index];
      }
    },
    advancePosition: {

      // TimeEngine method (transported interface)

      value: function advancePosition(time, position, speed) {
        var index = this.segmentIndex;
        var cyclicOffset = this.__cyclicOffset;

        this.trigger(time);

        if (speed > 0) {
          index++;

          if (index >= this.positionArray.length) {
            index = 0;
            cyclicOffset += this.bufferDuration;

            if (!this.cyclic) {
              return Infinity;
            }
          }
        } else {
          index--;

          if (index < 0) {
            index = this.positionArray.length - 1;
            cyclicOffset -= this.bufferDuration;

            if (!this.cyclic) {
              return -Infinity;
            }
          }
        }

        this.segmentIndex = index;
        this.__cyclicOffset = cyclicOffset;

        return cyclicOffset + this.positionArray[index];
      }
    },
    gain: {

      /**
       * Set gain
       * @param {Number} value linear gain factor
       */

      set: function (value) {
        this.__gainNode.gain.value = value;
      },

      /**
       * Get gain
       * @return {Number} current gain
       */
      get: function () {
        return this.__gainNode.gain.value;
      }
    },
    trigger: {

      /**
       * Trigger a segment
       * @param {Number} audioTime segment synthesis audio time
       * @return {Number} period to next segment
       *
       * This function can be called at any time (whether the engine is scheduled/transported or not)
       * to generate a single segment according to the current segment parameters.
       */

      value: function trigger(audioTime) {
        var audioContext = this.audioContext;
        var segmentTime = audioTime || audioContext.currentTime + this.delay;
        var segmentPeriod = this.periodAbs;
        var segmentIndex = this.segmentIndex;

        if (this.buffer) {
          var segmentPosition = 0;
          var segmentDuration = 0;
          var segmentOffset = 0;
          var resamplingRate = 1;
          var bufferDuration = this.bufferDuration;

          if (this.cyclic) segmentIndex = segmentIndex % this.positionArray.length;else segmentIndex = Math.max(0, Math.min(segmentIndex, this.positionArray.length - 1));

          if (this.positionArray) segmentPosition = this.positionArray[segmentIndex] || 0;

          if (this.durationArray) segmentDuration = this.durationArray[segmentIndex] || 0;

          if (this.offsetArray) segmentOffset = this.offsetArray[segmentIndex] || 0;

          // calculate resampling
          if (this.resampling !== 0 || this.resamplingVar > 0) {
            var randomResampling = (Math.random() - 0.5) * 2 * this.resamplingVar;
            resamplingRate = Math.pow(2, (this.resampling + randomResampling) / 1200);
          }

          // calculate inter-segment distance
          if (segmentDuration === 0 || this.periodRel > 0) {
            var nextSegementIndex = segmentIndex + 1;
            var nextPosition, nextOffset;

            if (nextSegementIndex === this.positionArray.length) {
              if (this.cyclic) {
                nextPosition = this.positionArray[0] + bufferDuration;
                nextOffset = this.offsetArray[0];
              } else {
                nextPosition = bufferDuration;
                nextOffset = 0;
              }
            } else {
              nextPosition = this.positionArray[nextSegementIndex];
              nextOffset = this.offsetArray[nextSegementIndex];
            }

            var interSegmentDistance = nextPosition - segmentPosition;

            // correct inter-segment distance by offsets
            //   offset > 0: the segment's reference position is after the given segment position
            if (segmentOffset > 0) interSegmentDistance -= segmentOffset;

            if (nextOffset > 0) interSegmentDistance += nextOffset;

            if (interSegmentDistance < 0) interSegmentDistance = 0;

            // use inter-segment distance instead of segment duration
            if (segmentDuration === 0) segmentDuration = interSegmentDistance;

            // calculate period relative to inter marker distance
            segmentPeriod += this.periodRel * interSegmentDistance;
          }

          // add relative and absolute segment duration
          segmentDuration *= this.durationRel;
          segmentDuration += this.durationAbs;

          // add relative and absolute segment offset
          segmentOffset *= this.offsetRel;
          segmentOffset += this.offsetAbs;

          // apply segment offset
          //   offset > 0: the segment's reference position is after the given segment position
          //   offset < 0: the given segment position is the segment's reference position and the duration has to be corrected by the offset
          if (segmentOffset < 0) {
            segmentDuration -= segmentOffset;
            segmentPosition += segmentOffset;
            segmentTime += segmentOffset / resamplingRate;
          } else {
            segmentTime -= segmentOffset / resamplingRate;
          }

          // randomize segment position
          if (this.positionVar > 0) segmentPosition += 2 * (Math.random() - 0.5) * this.positionVar;

          // shorten duration of segments over the edges of the buffer
          if (segmentPosition < 0) {
            segmentDuration += segmentPosition;
            segmentPosition = 0;
          }

          if (segmentPosition + segmentDuration > this.buffer.duration) segmentDuration = this.buffer.duration - segmentPosition;

          // make segment
          if (this.gain > 0 && segmentDuration > 0) {
            // make segment envelope
            var envelopeNode = audioContext.createGain();
            var attack = this.attackAbs + this.attackRel * segmentDuration;
            var release = this.releaseAbs + this.releaseRel * segmentDuration;

            if (attack + release > segmentDuration) {
              var factor = segmentDuration / (attack + release);
              attack *= factor;
              release *= factor;
            }

            var attackEndTime = segmentTime + attack;
            var segmentEndTime = segmentTime + segmentDuration;
            var releaseStartTime = segmentEndTime - release;

            envelopeNode.gain.value = this.gain;

            envelopeNode.gain.setValueAtTime(0, segmentTime);
            envelopeNode.gain.linearRampToValueAtTime(this.gain, attackEndTime);

            if (releaseStartTime > attackEndTime) envelopeNode.gain.setValueAtTime(this.gain, releaseStartTime);

            envelopeNode.gain.linearRampToValueAtTime(0, segmentEndTime);
            envelopeNode.connect(this.__gainNode);

            // make source
            var source = audioContext.createBufferSource();

            source.buffer = this.buffer;
            source.playbackRate.value = resamplingRate;
            source.connect(envelopeNode);
            envelopeNode.connect(this.__gainNode);

            source.start(segmentTime, segmentPosition);
            source.stop(segmentTime + segmentDuration / resamplingRate);
          }
        }

        return segmentPeriod;
      }
    }
  });

  return SegmentEngine;
})(TimeEngine);

module.exports = SegmentEngine;
/* written in ECMAscript 6 */
/**
 * @fileoverview WAVE audio sound segment engine
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 */

},{"../core/time-engine":4,"babel-runtime/core-js":15,"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/create-class":17,"babel-runtime/helpers/get":18,"babel-runtime/helpers/inherits":19}],9:[function(require,module,exports){
"use strict";

var _core = require("babel-runtime/core-js")["default"];

// schedulers should be singletons
var Scheduler = require("./scheduler");
var SimpleScheduler = require("./simple-scheduler");
var defaultAudioContext = require("../core/audio-context");
var schedulerMap = new _core.WeakMap();

// scheduler factory
module.exports.getScheduler = function () {
  var audioContext = arguments[0] === undefined ? defaultAudioContext : arguments[0];

  var scheduler = schedulerMap.get(audioContext);

  if (!scheduler) {
    scheduler = new Scheduler({ audioContext: audioContext });
    schedulerMap.set(audioContext, scheduler);
  } else if (scheduler instanceof SimpleScheduler) {
    throw new Error("Scheduler type mismatch for audio context " + audioContext);
  }

  return scheduler;
};

module.exports.getSimpleScheduler = function () {
  var audioContext = arguments[0] === undefined ? defaultAudioContext : arguments[0];

  var simpleScheduler = schedulerMap.get(audioContext);

  if (!simpleScheduler) {
    simpleScheduler = new SimpleScheduler({ audioContext: audioContext });
    schedulerMap.set(audioContext, simpleScheduler);
  } else if (simpleScheduler instanceof Scheduler) {
    throw new Error("Scheduler type mismatch for audio context " + audioContext);
  }

  return simpleScheduler;
};

},{"../core/audio-context":3,"./scheduler":11,"./simple-scheduler":12,"babel-runtime/core-js":15}],10:[function(require,module,exports){
"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _get = require("babel-runtime/helpers/get")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _core = require("babel-runtime/core-js")["default"];

var TimeEngine = require("../core/time-engine");

var _require = require("./factories");

var getScheduler = _require.getScheduler;

var PlayControlSchedulerHook = (function (_TimeEngine) {
  function PlayControlSchedulerHook(playControl) {
    _classCallCheck(this, PlayControlSchedulerHook);

    _get(_core.Object.getPrototypeOf(PlayControlSchedulerHook.prototype), "constructor", this).call(this);
    this.__playControl = playControl;
  }

  _inherits(PlayControlSchedulerHook, _TimeEngine);

  _createClass(PlayControlSchedulerHook, {
    advanceTime: {
      value: function advanceTime(time) {
        var playControl = this.__playControl;
        var position = playControl.__getPositionAtTime(time);
        var nextPosition = playControl.__engine.advancePosition(time, position, playControl.__speed);

        if (nextPosition !== Infinity) {
          return playControl.__getTimeAtPosition(nextPosition);
        }return Infinity;
      }
    }
  });

  return PlayControlSchedulerHook;
})(TimeEngine);

var PlayControlLoopControl = (function (_TimeEngine2) {
  function PlayControlLoopControl(playControl) {
    _classCallCheck(this, PlayControlLoopControl);

    _get(_core.Object.getPrototypeOf(PlayControlLoopControl.prototype), "constructor", this).call(this);
    this.__playControl = playControl;
    this.speed = null;
  }

  _inherits(PlayControlLoopControl, _TimeEngine2);

  _createClass(PlayControlLoopControl, {
    advanceTime: {

      // TimeEngine method (scheduled interface)

      value: function advanceTime(time) {
        if (this.speed > 0) {
          this.__playControl.syncSpeed(time, this.__playControl.__loopStart, this.speed, true);
          return this.__playControl.__getTimeAtPosition(this.__playControl.__loopEnd);
        } else if (this.speed < 0) {
          this.__playControl.syncSpeed(time, this.__playControl.__loopEnd, this.speed, true);
          return this.__playControl.__getTimeAtPosition(this.__playControl.__loopStart);
        }

        return Infinity;
      }
    }
  });

  return PlayControlLoopControl;
})(TimeEngine);

var PlayControl = (function (_TimeEngine3) {
  function PlayControl(engine) {
    var _this = this;

    _classCallCheck(this, PlayControl);

    _get(_core.Object.getPrototypeOf(PlayControl.prototype), "constructor", this).call(this, engine.audioContext);

    this.scheduler = getScheduler(engine.audioContext);

    this.__engine = null;
    this.__interface = null;
    this.__schedulerHook = null;

    this.__loopControl = null;
    this.__loopStart = 0;
    this.__loopEnd = Infinity;

    // synchronized tie, position, and speed
    this.__time = 0;
    this.__position = 0;
    this.__speed = 0;

    this.__nextPosition = Infinity;

    // non-zero "user" speed
    this.__playingSpeed = 1;

    if (engine.master) throw new Error("object has already been added to a master");

    var speed = this.__speed;

    var getCurrentTime = function () {
      return _this.currentTime;
    };

    var getCurrentPosition = function () {
      return _this.currentPosition;
    };

    if (engine.implementsSpeedControlled()) {
      // add time engine that implements speed-controlled interface
      this.__engine = engine;
      this.__interface = "speed-controlled";
      engine.setSpeedControlled(this, getCurrentTime, getCurrentPosition);
    } else if (engine.implementsTransported()) {
      // add time engine that implements transported interface
      this.__engine = engine;
      this.__interface = "transported";

      engine.setTransported(this, 0, function () {
        var nextEnginePosition = arguments[0] === undefined ? null : arguments[0];

        // resetNextPosition
        if (nextEnginePosition === null) {
          var time = _this.scheduler.currentTime;
          var position = _this.__getPositionAtTime(time);
          nextEnginePosition = engine.syncPosition(time, position, _this.__speed);
        }

        _this.__resetNextPosition(nextEnginePosition);
      }, getCurrentTime, getCurrentPosition);
    } else if (engine.implementsScheduled()) {
      // add time engine that implements scheduled interface
      this.__engine = engine;
      this.__interface = "scheduled";

      this.scheduler.add(engine, Infinity, getCurrentPosition);
    } else {
      throw new Error("object cannot be added to play control");
    }
  }

  _inherits(PlayControl, _TimeEngine3);

  _createClass(PlayControl, {
    __getTimeAtPosition: {

      /**
       * Extrapolate transport time for given position
       * @param {Number} position position
       * @return {Number} extrapolated time
       */

      value: function __getTimeAtPosition(position) {
        return this.__time + (position - this.__position) / this.__speed;
      }
    },
    __getPositionAtTime: {

      /**
       * Extrapolate playing position for given time
       * @param {Number} time time
       * @return {Number} extrapolated position
       */

      value: function __getPositionAtTime(time) {
        return this.__position + (time - this.__time) * this.__speed;
      }
    },
    __sync: {
      value: function __sync() {
        var now = this.currentTime;
        this.__position += (now - this.__time) * this.__speed;
        this.__time = now;
        return now;
      }
    },
    __resetNextPosition: {

      /**
       * Get current master position
       * @return {Number} current playing position
       */

      value: function __resetNextPosition(nextPosition) {
        if (this.__schedulerHook) this.__schedulerHook.resetNextTime(this.__getTimeAtPosition(nextPosition));

        this.__nextPosition = nextPosition;
      }
    },
    currentTime: {

      /**
       * Get current master time
       * @return {Number} current time
       *
       * This function will be replaced when the play-control is added to a master.
       */

      get: function () {
        return this.scheduler.currentTime;
      }
    },
    currentPosition: {

      /**
       * Get current master position
       * @return {Number} current playing position
       *
       * This function will be replaced when the play-control is added to a master.
       */

      get: function () {
        return this.__position + (this.scheduler.currentTime - this.__time) * this.__speed;
      }
    },
    loop: {
      set: function (enable) {
        if (enable) {
          if (this.__loopStart > -Infinity && this.__loopEnd < Infinity) {
            this.__loopControl = new PlayControlLoopControl(this);
            this.scheduler.add(this.__loopControl, Infinity);
          }
        } else if (this.__loopControl) {
          this.scheduler.remove(this.__loopControl);
          this.__loopControl = null;
        }
      },
      get: function () {
        return !!this.__loopControl;
      }
    },
    setLoopBoundaries: {
      value: function setLoopBoundaries(start, end) {
        if (end >= start) {
          this.__loopStart = start;
          this.__loopEnd = end;
        } else {
          this.__loopStart = end;
          this.__loopEnd = start;
        }

        this.loop = this.loop;
      }
    },
    loopStart: {
      set: function (startTime) {
        this.setLoopBoundaries(startTime, this.__loopEnd);
      },
      get: function () {
        return this.__loopStart;
      }
    },
    loopEnd: {
      set: function (endTime) {
        this.setLoopBoundaries(this.__loopStart, endTime);
      },
      get: function () {
        return this.__loopEnd;
      }
    },
    __applyLoopBoundaries: {
      value: function __applyLoopBoundaries(position, speed, seek) {
        if (this.__loopControl) {
          if (speed > 0 && position >= this.__loopEnd) {
            return this.__loopStart + (position - this.__loopStart) % (this.__loopEnd - this.__loopStart);
          } else if (speed < 0 && position < this.__loopStart) {
            return this.__loopEnd - (this.__loopEnd - position) % (this.__loopEnd - this.__loopStart);
          }
        }

        return position;
      }
    },
    __rescheduleLoopControl: {
      value: function __rescheduleLoopControl(position, speed) {
        if (this.__loopControl) {
          if (speed > 0) {
            this.__loopControl.speed = speed;
            this.scheduler.reset(this.__loopControl, this.__getTimeAtPosition(this.__loopEnd));
          } else if (speed < 0) {
            this.__loopControl.speed = speed;
            this.scheduler.reset(this.__loopControl, this.__getTimeAtPosition(this.__loopStart));
          } else {
            this.scheduler.reset(this.__loopControl, Infinity);
          }
        }
      }
    },
    syncSpeed: {

      // TimeEngine method (speed-controlled interface)

      value: function syncSpeed(time, position, speed) {
        var seek = arguments[3] === undefined ? false : arguments[3];

        var lastSpeed = this.__speed;

        if (speed !== lastSpeed || seek) {
          if (seek || lastSpeed === 0) position = this.__applyLoopBoundaries(position, speed);

          this.__time = time;
          this.__position = position;
          this.__speed = speed;

          switch (this.__interface) {
            case "speed-controlled":
              this.__engine.syncSpeed(time, position, speed, seek);
              break;

            case "transported":
              var nextPosition = this.__nextPosition;

              if (seek) {
                nextPosition = this.__engine.syncPosition(time, position, speed);
              } else if (lastSpeed === 0) {
                // start
                nextPosition = this.__engine.syncPosition(time, position, speed);

                // add scheduler hook to scheduler (will be rescheduled to appropriate time below)
                this.__schedulerHook = new PlayControlSchedulerHook(this);
                this.scheduler.add(this.__schedulerHook, Infinity);
              } else if (speed === 0) {
                // stop
                nextPosition = Infinity;

                if (this.__engine.syncSpeed) this.__engine.syncSpeed(time, position, 0);

                // remove scheduler hook from scheduler
                this.scheduler.remove(this.__schedulerHook);
                this.__schedulerHook = null;
              } else if (speed * lastSpeed < 0) {
                // change transport direction
                nextPosition = this.__engine.syncPosition(time, position, speed);
              } else if (this.__engine.syncSpeed) {
                this.__engine.syncSpeed(time, position, speed);
              }

              this.__resetNextPosition(nextPosition);
              break;

            case "scheduled":
              if (lastSpeed === 0) // start or seek
                this.__scheduledEngine.resetNextTime(0);else if (speed === 0) // stop
                this.__scheduledEngine.resetNextTime(Infinity);
              break;
          }

          this.__rescheduleLoopControl(position, speed);
        }
      }
    },
    start: {

      /**
       * Start playing
       */

      value: function start() {
        var time = this.__sync();
        this.syncSpeed(time, this.__position, this.__playingSpeed);
      }
    },
    pause: {

      /**
       * Pause playing
       */

      value: function pause() {
        var time = this.__sync();
        this.syncSpeed(time, this.__position, 0);
      }
    },
    stop: {

      /**
       * Stop playing
       */

      value: function stop() {
        var time = this.__sync();
        this.syncSpeed(time, this.__position, 0);
        this.seek(0);
      }
    },
    speed: {

      /**
       * Set playing speed
       * @param {Number} speed playing speed (non-zero speed between -16 and -1/16 or between 1/16 and 16)
       */

      set: function (speed) {
        var time = this.__sync();

        if (speed >= 0) {
          if (speed < 0.0625) speed = 0.0625;else if (speed > 16) speed = 16;
        } else {
          if (speed < -16) speed = -16;else if (speed > -0.0625) speed = -0.0625;
        }

        this.__playingSpeed = speed;

        if (this.__speed !== 0) this.syncSpeed(time, this.__position, speed);
      },

      /**
       * Get playing speed
       * @return current playing speed
       */
      get: function () {
        return this.__playingSpeed;
      }
    },
    seek: {

      /**
       * Set (jump to) playing position
       * @param {Number} position target position
       */

      value: function seek(position) {
        if (position !== this.__position) {
          var time = this.__sync();
          this.__position = position;
          this.syncSpeed(time, position, this.__speed, true);
        }
      }
    },
    clear: {

      /**
       * Remove time engine from the transport
       */

      value: function clear() {
        var time = this.__sync();
        this.syncSpeed(time, this.__position, 0);
        this.__engine.resetInterface();
      }
    }
  });

  return PlayControl;
})(TimeEngine);

module.exports = PlayControl;
/* written in ECMAscript 6 */
/**
 * @fileoverview WAVE audio play control class (time-engine master), provides play control to a single engine
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 */

},{"../core/time-engine":4,"./factories":9,"babel-runtime/core-js":15,"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/create-class":17,"babel-runtime/helpers/get":18,"babel-runtime/helpers/inherits":19}],11:[function(require,module,exports){
"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var PriorityQueue = require("../utils/priority-queue");
var TimeEngine = require("../core/time-engine");
var defaultAudioContext = require("../core/audio-context");

function arrayRemove(array, value) {
  var index = array.indexOf(value);

  if (index >= 0) {
    array.splice(index, 1);
    return true;
  }

  return false;
}

var Scheduler = (function () {
  function Scheduler() {
    var options = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Scheduler);

    this.audioContext = options.audioContext || defaultAudioContext;

    this.__queue = new PriorityQueue();
    this.__engines = [];

    this.__currentTime = null;
    this.__nextTime = Infinity;
    this.__timeout = null;

    /**
     * scheduler (setTimeout) period
     * @type {Number}
     */
    this.period = options.period || 0.025;

    /**
     * scheduler lookahead time (> period)
     * @type {Number}
     */
    this.lookahead = options.lookahead || 0.1;
  }

  _createClass(Scheduler, {
    __tick: {

      // setTimeout scheduling loop

      value: function __tick() {
        var audioContext = this.audioContext;
        var nextTime = this.__nextTime;

        this.__timeout = null;

        while (nextTime <= audioContext.currentTime + this.lookahead) {
          this.__currentTime = nextTime;

          var engine = this.__queue.head;
          var time = engine.advanceTime(this.__currentTime);

          if (time && time < Infinity) {
            nextTime = this.__queue.move(engine, Math.max(time, this.__currentTime));
          } else {
            nextTime = this.__queue.remove(engine);

            // remove time engine from scheduler if advanceTime returns null/undfined
            if (!time && engine.master === this) engine.resetInterface();
          }
        }

        this.__currentTime = null;
        this.__reschedule(nextTime);
      }
    },
    __reschedule: {
      value: function __reschedule(nextTime) {
        var _this = this;

        if (this.__timeout) {
          clearTimeout(this.__timeout);
          this.__timeout = null;
        }

        if (nextTime !== Infinity) {
          this.__nextTime = nextTime;

          var timeOutDelay = Math.max(nextTime - this.audioContext.currentTime - this.lookahead, this.period);

          this.__timeout = setTimeout(function () {
            _this.__tick();
          }, timeOutDelay * 1000);
        }
      }
    },
    currentTime: {

      /**
       * Get scheduler time
       * @return {Number} current scheduler time including lookahead
       */

      get: function () {
        return this.__currentTime || this.audioContext.currentTime + this.lookahead;
      }
    },
    add: {

      /**
       * Add a time engine or a simple callback function to the scheduler
       * @param {Object} engine time engine to be added to the scheduler
       * @param {Number} time scheduling time
       * @param {Function} function to get current position
       * @return handle to the scheduled engine (use for calling further methods)
       */

      value: function add(engine) {
        var _this = this;

        var time = arguments[1] === undefined ? this.currentTime : arguments[1];
        var getCurrentPosition = arguments[2] === undefined ? null : arguments[2];

        if (engine instanceof Function) {
          // construct minimal scheduled time engine
          engine = {
            advanceTime: engine
          };
        } else {
          if (!engine.implementsScheduled()) throw new Error("object cannot be added to scheduler");

          if (engine.master) throw new Error("object has already been added to a master");

          // register engine
          this.__engines.push(engine);

          // set scheduled interface
          engine.setScheduled(this, function (time) {
            var nextTime = _this.__queue.move(engine, time);
            _this.__reschedule(nextTime);
          }, function () {
            return _this.currentTime;
          }, getCurrentPosition);
        }

        // schedule engine or callback
        var nextTime = this.__queue.insert(engine, time);
        this.__reschedule(nextTime);

        return engine;
      }
    },
    remove: {

      /**
       * Remove a time engine from the scheduler
       * @param {Object} engine time engine or callback to be removed from the scheduler
       */

      value: function remove(engine) {
        var master = engine.master;

        if (master) {
          if (master !== this) throw new Error("object has not been added to this scheduler");

          engine.resetInterface();
          arrayRemove(this.__engines, engine);
        }

        var nextTime = this.__queue.remove(engine);
        this.__reschedule(nextTime);
      }
    },
    reset: {

      /**
       * Reschedule a scheduled time engine or callback at a given time
       * @param {Object} engine time engine or callback to be rescheduled
       * @param {Number} time time when to reschedule
       */

      value: function reset(engine, time) {
        var nextTime = this.__queue.move(engine, time);
        this.__reschedule(nextTime);
      }
    },
    clear: {

      /**
       * Remove all schdeduled callbacks and engines from the scheduler
       */

      value: function clear() {
        if (this.__timeout) {
          clearTimeout(this.__timeout);
          this.__timeout = null;
        }

        this.__queue.clear();
        this.__engines.length = 0;
      }
    }
  });

  return Scheduler;
})();

module.exports = Scheduler;
/* written in ECMAscript 6 */
/**
 * @fileoverview WAVE scheduler singleton based on audio time (time-engine master)
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 */

},{"../core/audio-context":3,"../core/time-engine":4,"../utils/priority-queue":14,"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/create-class":17}],12:[function(require,module,exports){
"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

/* written in ECMAscript 6 */
/**
 * @fileoverview WAVE simplified scheduler singleton based on audio time (time-engine master)
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 */

var TimeEngine = require("../core/time-engine");

function arrayRemove(array, value) {
  var index = array.indexOf(value);

  if (index >= 0) {
    array.splice(index, 1);
    return true;
  }

  return false;
}

var SimpleScheduler = (function () {
  function SimpleScheduler() {
    var options = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, SimpleScheduler);

    this.audioContext = options.audioContext || defaultAudioContext;

    this.__engines = [];

    this.__schedEngines = [];
    this.__schedTimes = [];

    this.__currentTime = null;
    this.__timeout = null;

    /**
     * scheduler (setTimeout) period
     * @type {Number}
     */
    this.period = options.period || 0.025;

    /**
     * scheduler lookahead time (> period)
     * @type {Number}
     */
    this.lookahead = options.lookahead || 0.1;
  }

  _createClass(SimpleScheduler, {
    __scheduleEngine: {
      value: function __scheduleEngine(engine, time) {
        this.__schedEngines.push(engine);
        this.__schedTimes.push(time);
      }
    },
    __rescheduleEngine: {
      value: function __rescheduleEngine(engine, time) {
        var index = this.__schedEngines.indexOf(engine);

        if (index >= 0) {
          if (time !== Infinity) {
            this.__schedTimes[index] = time;
          } else {
            this.__schedEngines.splice(index, 1);
            this.__schedTimes.splice(index, 1);
          }
        }
      }
    },
    __unscheduleEngine: {
      value: function __unscheduleEngine(engine) {
        var index = this.__schedEngines.indexOf(engine);

        if (index >= 0) {
          this.__schedEngines.splice(index, 1);
          this.__schedTimes.splice(index, 1);
        }
      }
    },
    __resetTick: {
      value: function __resetTick() {
        if (this.__schedEngines.length > 0) {
          if (!this.__timeout) this.__tick();
        } else if (this.__timeout) {
          clearTimeout(this.__timeout);
          this.__timeout = null;
        }
      }
    },
    __tick: {
      value: function __tick() {
        var _this = this;

        var audioContext = this.audioContext;
        var i = 0;

        while (i < this.__schedEngines.length) {
          var engine = this.__schedEngines[i];
          var time = this.__schedTimes[i];

          while (time && time <= audioContext.currentTime + this.lookahead) {
            time = Math.max(time, audioContext.currentTime);
            this.__currentTime = time;
            time = engine.advanceTime(time);
          }

          if (time && time < Infinity) {
            this.__schedTimes[i++] = time;
          } else {
            this.__unscheduleEngine(engine);

            // remove engine from scheduler
            if (!time && arrayRemove(this.__engines, engine)) engine.resetInterface();
          }
        }

        this.__currentTime = null;
        this.__timeout = null;

        if (this.__schedEngines.length > 0) {
          this.__timeout = setTimeout(function () {
            _this.__tick();
          }, this.period * 1000);
        }
      }
    },
    currentTime: {

      /**
       * Get scheduler time
       * @return {Number} current scheduler time including lookahead
       */

      get: function () {
        return this.__currentTime || this.audioContext.currentTime + this.lookahead;
      }
    },
    callback: {

      /**
       * Add a callback to the scheduler
       * @param {Function} callback function(time) to be called
       * @param {Number} time of first callback (default is now)
       * @param {Number} period callback period (default is 0 for one-shot)
       * @return {Object} scheduled object that can be used to call remove and reset
       */

      value: function callback(callbackFunction) {
        var time = arguments[1] === undefined ? this.currentTime : arguments[1];

        var engineWrapper = {
          advanceTime: callbackFunction
        };

        this.__scheduleEngine(engineWrapper, time);
        this.__resetTick();

        return engineWrapper;
      }
    },
    add: {

      /**
       * Add a time engine to the scheduler
       * @param {Object} engine time engine to be added to the scheduler
       * @param {Number} time scheduling time
       */

      value: function add(engine) {
        var _this = this;

        var time = arguments[1] === undefined ? this.currentTime : arguments[1];
        var getCurrentPosition = arguments[2] === undefined ? null : arguments[2];

        if (engine instanceof Function) {
          // construct minimal scheduled time engine
          engine = {
            advanceTime: engine
          };
        } else {
          if (!engine.implementsScheduled()) throw new Error("object cannot be added to scheduler");

          if (engine.master) throw new Error("object has already been added to a master");

          // register engine
          this.__engines.push(engine);

          // set scheduled interface
          engine.setScheduled(this, function (time) {
            _this.__rescheduleEngine(engine, time);
            _this.__resetTick();
          }, function () {
            return _this.currentTime;
          }, getCurrentPosition);
        }

        this.__scheduleEngine(engine, time);
        this.__resetTick();

        return engine;
      }
    },
    remove: {

      /**
       * Remove a scheduled time engine or callback from the scheduler
       * @param {Object} engine time engine or callback to be removed from the scheduler
       */

      value: function remove(engine) {
        var master = engine.master;

        if (master) {
          if (master !== this) throw new Error("object has not been added to this scheduler");

          engine.resetInterface();
          arrayRemove(this.__engines, engine);
        }

        this.__unscheduleEngine(engine);
        this.__resetTick();
      }
    },
    reset: {

      /**
       * Reschedule a scheduled time engine or callback
       * @param {Object} engine time engine or callback to be rescheduled
       * @param {Number} time time when to reschedule
       */

      value: function reset(engine, time) {
        this.__rescheduleEngine(engine, time);
        this.__resetTick();
      }
    },
    clear: {
      value: function clear() {
        if (this.__timeout) {
          clearTimeout(this.__timeout);
          this.__timeout = null;
        }

        this.__schedEngines.length = 0;
        this.__schedTimes.length = 0;
      }
    }
  });

  return SimpleScheduler;
})();

// export scheduler singleton
module.exports = SimpleScheduler;

},{"../core/time-engine":4,"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/create-class":17}],13:[function(require,module,exports){
"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _get = require("babel-runtime/helpers/get")["default"];

var _core = require("babel-runtime/core-js")["default"];

var TimeEngine = require("../core/time-engine");
var PriorityQueue = require("../utils/priority-queue");

var _require = require("./factories");

var getScheduler = _require.getScheduler;

function removeCouple(firstArray, secondArray, firstElement) {
  var index = firstArray.indexOf(firstElement);

  if (index >= 0) {
    var secondElement = secondArray[index];

    firstArray.splice(index, 1);
    secondArray.splice(index, 1);

    return secondElement;
  }

  return null;
}

var Transported = (function (_TimeEngine) {
  function Transported(transport, engine, startPosition, endPosition, offsetPosition) {
    _classCallCheck(this, Transported);

    this.__transport = transport;
    this.__engine = engine;
    this.__startPosition = startPosition;
    this.__endPosition = endPosition;
    this.__offsetPosition = offsetPosition;
    this.__scalePosition = 1;
    this.__haltPosition = Infinity; // engine's next halt position when not running (is null when engine hes been started)
  }

  _inherits(Transported, _TimeEngine);

  _createClass(Transported, {
    setBoundaries: {
      value: function setBoundaries(startPosition, endPosition) {
        var _this = this;

        var offsetPosition = arguments[2] === undefined ? startPosition : arguments[2];
        var scalePosition = arguments[3] === undefined ? 1 : arguments[3];
        return (function () {
          _this.__startPosition = startPosition;
          _this.__endPosition = endPosition;
          _this.__offsetPosition = offsetPosition;
          _this.__scalePosition = scalePosition;
          _this.resetNextPosition();
        })();
      }
    },
    start: {
      value: function start(time, position, speed) {}
    },
    stop: {
      value: function stop(time, position) {}
    },
    syncPosition: {
      value: function syncPosition(time, position, speed) {
        if (speed > 0) {
          if (position < this.__startPosition) {

            if (this.__haltPosition === null) this.stop(time, position - this.__offsetPosition);

            this.__haltPosition = this.__endPosition;

            return this.__startPosition;
          } else if (position <= this.__endPosition) {
            this.start(time, position - this.__offsetPosition, speed);

            this.__haltPosition = null; // engine is active

            return this.__endPosition;
          }
        } else {
          if (position >= this.__endPosition) {
            if (this.__haltPosition === null) this.stop(time, position - this.__offsetPosition);

            this.__haltPosition = this.__startPosition;

            return this.__endPosition;
          } else if (position > this.__startPosition) {
            this.start(time, position - this.__offsetPosition, speed);

            this.__haltPosition = null; // engine is active

            return this.__startPosition;
          }
        }

        if (this.__haltPosition === null) this.stop(time, position);

        this.__haltPosition = Infinity;

        return Infinity;
      }
    },
    advancePosition: {
      value: function advancePosition(time, position, speed) {
        var haltPosition = this.__haltPosition;

        if (haltPosition !== null) {
          this.start(time, position - this.__offsetPosition, speed);

          this.__haltPosition = null;

          return haltPosition;
        }

        // stop engine
        if (this.__haltPosition === null) this.stop(time, position - this.__offsetPosition);

        this.__haltPosition = Infinity;

        return Infinity;
      }
    },
    syncSpeed: {
      value: function syncSpeed(time, position, speed) {
        if (speed === 0) this.stop(time, position - this.__offsetPosition);
      }
    },
    destroy: {
      value: function destroy() {
        this.__transport = null;
        this.__engine = null;
      }
    }
  });

  return Transported;
})(TimeEngine);

// TransportedScheduled has to switch on and off the scheduled engines
// when the transport hits the engine's start and end position

var TransportedTransported = (function (_Transported) {
  function TransportedTransported(transport, engine, startPosition, endPosition, offsetPosition) {
    var _this = this;

    _classCallCheck(this, TransportedTransported);

    _get(_core.Object.getPrototypeOf(TransportedTransported.prototype), "constructor", this).call(this, transport, engine, startPosition, endPosition, offsetPosition);

    engine.setTransported(this, function () {
      var nextEnginePosition = arguments[0] === undefined ? null : arguments[0];

      // resetNextPosition
      if (nextEnginePosition !== null) nextEnginePosition += _this.__offsetPosition;

      _this.resetNextPosition(nextEnginePosition);
    }, function () {
      // getCurrentTime
      return _this.__transport.scheduler.currentTime;
    }, function () {
      // get currentPosition
      return _this.__transport.currentPosition - _this.__offsetPosition;
    });
  }

  _inherits(TransportedTransported, _Transported);

  _createClass(TransportedTransported, {
    syncPosition: {
      value: function syncPosition(time, position, speed) {
        if (speed > 0 && position < this.__endPosition) position = Math.max(position, this.__startPosition);else if (speed < 0 && position >= this.__startPosition) position = Math.min(position, this.__endPosition);

        return this.__offsetPosition + this.__engine.syncPosition(time, position - this.__offsetPosition, speed);
      }
    },
    advancePosition: {
      value: function advancePosition(time, position, speed) {
        position = this.__offsetPosition + this.__engine.advancePosition(time, position - this.__offsetPosition, speed);

        if (speed > 0 && position < this.__endPosition || speed < 0 && position >= this.__startPosition) {
          return position;
        }return Infinity;
      }
    },
    syncSpeed: {
      value: function syncSpeed(time, position, speed) {
        if (this.__engine.syncSpeed) this.__engine.syncSpeed(time, position, speed);
      }
    },
    destroy: {
      value: function destroy() {
        this.__engine.resetInterface();
        _get(_core.Object.getPrototypeOf(TransportedTransported.prototype), "destroy", this).call(this);
      }
    }
  });

  return TransportedTransported;
})(Transported);

// TransportedSpeedControlled has to start and stop the speed-controlled engines
// when the transport hits the engine's start and end position

var TransportedSpeedControlled = (function (_Transported2) {
  function TransportedSpeedControlled(transport, engine, startPosition, endPosition, offsetPosition) {
    var _this = this;

    _classCallCheck(this, TransportedSpeedControlled);

    _get(_core.Object.getPrototypeOf(TransportedSpeedControlled.prototype), "constructor", this).call(this, transport, engine, startPosition, endPosition, offsetPosition);

    engine.setSpeedControlled(this, function () {
      // getCurrentTime
      return _this.__transport.scheduler.currentTime;
    }, function () {
      // get currentPosition
      return _this.__transport.currentPosition - _this.__offsetPosition;
    });
  }

  _inherits(TransportedSpeedControlled, _Transported2);

  _createClass(TransportedSpeedControlled, {
    start: {
      value: function start(time, position, speed) {
        this.__engine.syncSpeed(time, position, speed, true);
      }
    },
    stop: {
      value: function stop(time, position) {
        this.__engine.syncSpeed(time, position, 0);
      }
    },
    syncSpeed: {
      value: function syncSpeed(time, position, speed) {
        if (this.__haltPosition === null) // engine is active
          this.__engine.syncSpeed(time, position, speed);
      }
    },
    destroy: {
      value: function destroy() {
        this.__engine.syncSpeed(this.__transport.currentTime, this.__transport.currentPosition - this.__offsetPosition, 0);
        this.__engine.resetInterface();
        _get(_core.Object.getPrototypeOf(TransportedSpeedControlled.prototype), "destroy", this).call(this);
      }
    }
  });

  return TransportedSpeedControlled;
})(Transported);

// TransportedScheduled has to switch on and off the scheduled engines
// when the transport hits the engine's start and end position

var TransportedScheduled = (function (_Transported3) {
  function TransportedScheduled(transport, engine, startPosition, endPosition, offsetPosition) {
    var _this = this;

    _classCallCheck(this, TransportedScheduled);

    _get(_core.Object.getPrototypeOf(TransportedScheduled.prototype), "constructor", this).call(this, transport, engine, startPosition, endPosition, offsetPosition);

    this.__transport.scheduler.add(engine, Infinity, function () {
      // get currentPosition
      return (_this.__transport.currentPosition - _this.__offsetPosition) * _this.__scalePosition;
    });
  }

  _inherits(TransportedScheduled, _Transported3);

  _createClass(TransportedScheduled, {
    start: {
      value: function start(time, position, speed) {
        this.__engine.resetNextTime(time);
      }
    },
    stop: {
      value: function stop(time, position) {
        this.__engine.resetNextTime(Infinity);
      }
    },
    destroy: {
      value: function destroy() {
        this.__transport.scheduler.remove(this.__engine);
        _get(_core.Object.getPrototypeOf(TransportedScheduled.prototype), "destroy", this).call(this);
      }
    }
  });

  return TransportedScheduled;
})(Transported);

var TransportSchedulerHook = (function (_TimeEngine2) {
  function TransportSchedulerHook(transport) {
    _classCallCheck(this, TransportSchedulerHook);

    _get(_core.Object.getPrototypeOf(TransportSchedulerHook.prototype), "constructor", this).call(this);
    this.__transport = transport;
  }

  _inherits(TransportSchedulerHook, _TimeEngine2);

  _createClass(TransportSchedulerHook, {
    advanceTime: {

      // TimeEngine method (scheduled interface)

      value: function advanceTime(time) {
        var transport = this.__transport;
        var position = transport.__getPositionAtTime(time);
        var nextPosition = transport.advancePosition(time, position, transport.__speed);

        if (nextPosition !== Infinity) {
          return transport.__getTimeAtPosition(nextPosition);
        }return Infinity;
      }
    }
  });

  return TransportSchedulerHook;
})(TimeEngine);

/**
 * Transport class
 */

var Transport = (function (_TimeEngine3) {
  function Transport() {
    var options = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Transport);

    _get(_core.Object.getPrototypeOf(Transport.prototype), "constructor", this).call(this, options.audioContext);

    this.scheduler = getScheduler(this.audioContext);

    this.__engines = [];
    this.__transported = [];

    this.__schedulerHook = null;
    this.__transportQueue = new PriorityQueue();

    // syncronized time, position, and speed
    this.__time = 0;
    this.__position = 0;
    this.__speed = 0;

    this.__nextPosition = Infinity;
  }

  _inherits(Transport, _TimeEngine3);

  _createClass(Transport, {
    __getPositionAtTime: {
      value: function __getPositionAtTime(time) {
        return this.__position + (time - this.__time) * this.__speed;
      }
    },
    __getTimeAtPosition: {
      value: function __getTimeAtPosition(position) {
        return this.__time + (position - this.__position) / this.__speed;
      }
    },
    __syncTransportedPosition: {
      value: function __syncTransportedPosition(time, position, speed) {
        var numTransportedEngines = this.__transported.length;
        var nextPosition = Infinity;

        if (numTransportedEngines > 0) {
          var engine, nextEnginePosition;

          this.__transportQueue.clear();
          this.__transportQueue.reverse = speed < 0;

          for (var i = numTransportedEngines - 1; i > 0; i--) {
            engine = this.__transported[i];
            nextEnginePosition = engine.syncPosition(time, position, speed);
            this.__transportQueue.insert(engine, nextEnginePosition, false); // insert but don't sort
          }

          engine = this.__transported[0];
          nextEnginePosition = engine.syncPosition(time, position, speed);
          nextPosition = this.__transportQueue.insert(engine, nextEnginePosition, true); // insert and sort
        }

        return nextPosition;
      }
    },
    __syncTransportedSpeed: {
      value: function __syncTransportedSpeed(time, position, speed) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = _core.$for.getIterator(this.__transported), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var transported = _step.value;

            transported.syncSpeed(time, position, speed);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator["return"]) {
              _iterator["return"]();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    },
    currentTime: {

      /**
       * Get current master time
       * @return {Number} current time
       *
       * This function will be replaced when the transport is added to a master (i.e. transport or play-control).
       */

      get: function () {
        return this.scheduler.currentTime;
      }
    },
    currentPosition: {

      /**
       * Get current master position
       * @return {Number} current playing position
       *
       * This function will be replaced when the transport is added to a master (i.e. transport or play-control).
       */

      get: function () {
        return this.__position + (this.scheduler.currentTime - this.__time) * this.__speed;
      }
    },
    resetNextPosition: {

      /**
       * Reset next transport position
       * @param {Number} next transport position
       *
       * This function will be replaced when the transport is added to a master (i.e. transport or play-control).
       */

      value: function resetNextPosition(nextPosition) {
        if (this.__schedulerHook) this.__schedulerHook.resetNextTime(this.__getTimeAtPosition(nextPosition));

        this.__nextPosition = nextPosition;
      }
    },
    syncPosition: {

      // TimeEngine method (transported interface)

      value: function syncPosition(time, position, speed) {
        this.__time = time;
        this.__position = position;
        this.__speed = speed;

        return this.__syncTransportedPosition(time, position, speed);
      }
    },
    advancePosition: {

      // TimeEngine method (transported interface)

      value: function advancePosition(time, position, speed) {
        var nextEngine = this.__transportQueue.head;
        var nextEnginePosition = nextEngine.advancePosition(time, position, speed);

        this.__nextPosition = this.__transportQueue.move(nextEngine, nextEnginePosition);

        return this.__nextPosition;
      }
    },
    syncSpeed: {

      // TimeEngine method (speed-controlled interface)

      value: function syncSpeed(time, position, speed) {
        var seek = arguments[3] === undefined ? false : arguments[3];

        var lastSpeed = this.__speed;

        this.__time = time;
        this.__position = position;
        this.__speed = speed;

        if (speed !== lastSpeed || seek && speed !== 0) {
          var nextPosition = this.__nextPosition;

          // resync transported engines
          if (seek || speed * lastSpeed < 0) {
            // seek or reverse direction
            nextPosition = this.__syncTransportedPosition(time, position, speed);
          } else if (lastSpeed === 0) {
            // start
            nextPosition = this.__syncTransportedPosition(time, position, speed);

            // schedule transport itself
            this.__schedulerHook = new TransportSchedulerHook(this);
            this.scheduler.add(this.__schedulerHook, Infinity);
          } else if (speed === 0) {
            // stop
            nextPosition = Infinity;

            this.__syncTransportedSpeed(time, position, 0);

            // unschedule transport itself
            this.scheduler.remove(this.__schedulerHook);
            delete this.__schedulerHook;
          } else {
            // change speed without reversing direction
            this.__syncTransportedSpeed(time, position, speed);
          }

          this.resetNextPosition(nextPosition);
        }
      }
    },
    add: {

      /**
       * Add a time engine to the transport
       * @param {Object} engine engine to be added to the transport
       * @param {Number} position start position
       */

      value: function add(engine) {
        var _this = this;

        var startPosition = arguments[1] === undefined ? -Infinity : arguments[1];
        var endPosition = arguments[2] === undefined ? Infinity : arguments[2];
        var offsetPosition = arguments[3] === undefined ? startPosition : arguments[3];
        return (function () {
          var transported = null;

          if (offsetPosition === -Infinity) offsetPosition = 0;

          if (engine.master) throw new Error("object has already been added to a master");

          if (engine.implementsTransported()) transported = new TransportedTransported(_this, engine, startPosition, endPosition, offsetPosition);else if (engine.implementsSpeedControlled()) transported = new TransportedSpeedControlled(_this, engine, startPosition, endPosition, offsetPosition);else if (engine.implementsScheduled()) transported = new TransportedScheduled(_this, engine, startPosition, endPosition, offsetPosition);else throw new Error("object cannot be added to a transport");

          if (transported) {
            var speed = _this.__speed;

            _this.__engines.push(engine);
            _this.__transported.push(transported);

            transported.setTransported(_this, function () {
              var nextEnginePosition = arguments[0] === undefined ? null : arguments[0];

              // resetNextPosition
              var speed = _this.__speed;

              if (speed !== 0) {
                if (nextEnginePosition === null) nextEnginePosition = transported.syncPosition(_this.currentTime, _this.currentPosition, speed);

                var nextPosition = _this.__transportQueue.move(transported, nextEnginePosition);
                _this.resetNextPosition(nextPosition);
              }
            }, function () {
              // getCurrentTime
              return _this.__transport.scheduler.currentTime;
            }, function () {
              // get currentPosition
              return _this.__transport.currentPosition - _this.__offsetPosition;
            });

            if (speed !== 0) {
              // sync and start
              var nextEnginePosition = transported.syncPosition(_this.currentTime, _this.currentPosition, speed);
              var nextPosition = _this.__transportQueue.insert(transported, nextEnginePosition);

              _this.resetNextPosition(nextPosition);
            }
          }

          return transported;
        })();
      }
    },
    remove: {

      /**
       * Remove a time engine from the transport
       * @param {object} engineOrTransported engine or transported to be removed from the transport
       */

      value: function remove(engineOrTransported) {
        var engine = engineOrTransported;
        var transported = removeCouple(this.__engines, this.__transported, engineOrTransported);

        if (!transported) {
          engine = removeCouple(this.__transported, this.__engines, engineOrTransported);
          transported = engineOrTransported;
        }

        if (engine && transported) {
          var nextPosition = this.__transportQueue.remove(transported);

          transported.resetInterface();
          transported.destroy();

          if (this.__speed !== 0) this.resetNextPosition(nextPosition);
        } else {
          throw new Error("object has not been added to this transport");
        }
      }
    },
    clear: {

      /**
       * Remove all time engines from the transport
       */

      value: function clear() {
        this.syncSpeed(this.currentTime, this.currentPosition, 0);

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = _core.$for.getIterator(this.__transported), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var transported = _step.value;

            transported.resetInterface();
            transported.destroy();
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator["return"]) {
              _iterator["return"]();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    }
  });

  return Transport;
})(TimeEngine);

module.exports = Transport;
/* written in ECMAscript 6 */
/**
 * @fileoverview WAVE audio transport class (time-engine master), provides synchronized scheduling of time engines
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 */

},{"../core/time-engine":4,"../utils/priority-queue":14,"./factories":9,"babel-runtime/core-js":15,"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/create-class":17,"babel-runtime/helpers/get":18,"babel-runtime/helpers/inherits":19}],14:[function(require,module,exports){
"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

/* written in ECMAscript 6 */
/**
 * @fileoverview WAVE audio priority queue used by scheduler and transports
 * @author Norbert Schnell <Norbert.Schnell@ircam.fr>
 *
 * First rather stupid implementation to be optimized...
 */

var PriorityQueue = (function () {
  function PriorityQueue() {
    _classCallCheck(this, PriorityQueue);

    this.__objects = [];
    this.reverse = false;
  }

  _createClass(PriorityQueue, {
    __objectIndex: {

      /**
       *  Get the index of an object in the object list
       */

      value: function __objectIndex(object) {
        for (var i = 0; i < this.__objects.length; i++) {
          if (object === this.__objects[i][0]) {
            return i;
          }
        }
        return -1;
      }
    },
    __removeObject: {

      /** 
       * Withdraw an object from the object list
       */

      value: function __removeObject(object) {
        var index = this.__objectIndex(object);

        if (index >= 0) this.__objects.splice(index, 1);

        if (this.__objects.length > 0) {
          return this.__objects[0][1];
        } // return time of first object

        return Infinity;
      }
    },
    __sortObjects: {
      value: function __sortObjects() {
        if (!this.reverse) this.__objects.sort(function (a, b) {
          return a[1] - b[1];
        });else this.__objects.sort(function (a, b) {
          return b[1] - a[1];
        });
      }
    },
    insert: {

      /**
       * Insert an object to the queue
       * (for this primitive version: prevent sorting for each element by calling with "false" as third argument)
       */

      value: function insert(object, time) {
        var sort = arguments[2] === undefined ? true : arguments[2];

        if (time !== Infinity && time != -Infinity) {
          // add new object
          this.__objects.push([object, time]);

          if (sort) this.__sortObjects();

          return this.__objects[0][1]; // return time of first object
        }

        return this.__removeObject(object);
      }
    },
    move: {

      /**
       * Move an object to another time in the queue
       */

      value: function move(object, time) {
        if (time !== Infinity && time != -Infinity) {

          var index = this.__objectIndex(object);

          if (index < 0) this.__objects.push([object, time]); // add new object
          else this.__objects[index][1] = time; // update time of existing object

          this.__sortObjects();

          return this.__objects[0][1]; // return time of first object
        }

        return this.__removeObject(object);
      }
    },
    remove: {

      /**
       * Remove an object from the queue
       */

      value: function remove(object) {
        return this.__removeObject(object);
      }
    },
    clear: {

      /**
       * Clear queue
       */

      value: function clear() {
        this.__objects.length = 0; // clear object list
        return Infinity;
      }
    },
    head: {

      /**
       * Get first object in queue
       */

      get: function () {
        if (this.__objects.length > 0) return this.__objects[0][0];

        return null;
      }
    },
    time: {

      /**
       * Get time of first object in queue
       */

      get: function () {
        if (this.__objects.length > 0) return this.__objects[0][1];

        return Infinity;
      }
    }
  });

  return PriorityQueue;
})();

module.exports = PriorityQueue;

},{"babel-runtime/helpers/class-call-check":16,"babel-runtime/helpers/create-class":17}],15:[function(require,module,exports){
/**
 * Core.js 0.6.1
 * https://github.com/zloirock/core-js
 * License: http://rock.mit-license.org
 * © 2015 Denis Pushkarev
 */
!function(global, framework, undefined){
'use strict';

/******************************************************************************
 * Module : common                                                            *
 ******************************************************************************/

  // Shortcuts for [[Class]] & property names
var OBJECT          = 'Object'
  , FUNCTION        = 'Function'
  , ARRAY           = 'Array'
  , STRING          = 'String'
  , NUMBER          = 'Number'
  , REGEXP          = 'RegExp'
  , DATE            = 'Date'
  , MAP             = 'Map'
  , SET             = 'Set'
  , WEAKMAP         = 'WeakMap'
  , WEAKSET         = 'WeakSet'
  , SYMBOL          = 'Symbol'
  , PROMISE         = 'Promise'
  , MATH            = 'Math'
  , ARGUMENTS       = 'Arguments'
  , PROTOTYPE       = 'prototype'
  , CONSTRUCTOR     = 'constructor'
  , TO_STRING       = 'toString'
  , TO_STRING_TAG   = TO_STRING + 'Tag'
  , TO_LOCALE       = 'toLocaleString'
  , HAS_OWN         = 'hasOwnProperty'
  , FOR_EACH        = 'forEach'
  , ITERATOR        = 'iterator'
  , FF_ITERATOR     = '@@' + ITERATOR
  , PROCESS         = 'process'
  , CREATE_ELEMENT  = 'createElement'
  // Aliases global objects and prototypes
  , Function        = global[FUNCTION]
  , Object          = global[OBJECT]
  , Array           = global[ARRAY]
  , String          = global[STRING]
  , Number          = global[NUMBER]
  , RegExp          = global[REGEXP]
  , Date            = global[DATE]
  , Map             = global[MAP]
  , Set             = global[SET]
  , WeakMap         = global[WEAKMAP]
  , WeakSet         = global[WEAKSET]
  , Symbol          = global[SYMBOL]
  , Math            = global[MATH]
  , TypeError       = global.TypeError
  , RangeError      = global.RangeError
  , setTimeout      = global.setTimeout
  , setImmediate    = global.setImmediate
  , clearImmediate  = global.clearImmediate
  , parseInt        = global.parseInt
  , isFinite        = global.isFinite
  , process         = global[PROCESS]
  , nextTick        = process && process.nextTick
  , document        = global.document
  , html            = document && document.documentElement
  , navigator       = global.navigator
  , define          = global.define
  , console         = global.console || {}
  , ArrayProto      = Array[PROTOTYPE]
  , ObjectProto     = Object[PROTOTYPE]
  , FunctionProto   = Function[PROTOTYPE]
  , Infinity        = 1 / 0
  , DOT             = '.';

// http://jsperf.com/core-js-isobject
function isObject(it){
  return it !== null && (typeof it == 'object' || typeof it == 'function');
}
function isFunction(it){
  return typeof it == 'function';
}
// Native function?
var isNative = ctx(/./.test, /\[native code\]\s*\}\s*$/, 1);

// Object internal [[Class]] or toStringTag
// http://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring
var toString = ObjectProto[TO_STRING];
function setToStringTag(it, tag, stat){
  if(it && !has(it = stat ? it : it[PROTOTYPE], SYMBOL_TAG))hidden(it, SYMBOL_TAG, tag);
}
function cof(it){
  return toString.call(it).slice(8, -1);
}
function classof(it){
  var O, T;
  return it == undefined ? it === undefined ? 'Undefined' : 'Null'
    : typeof (T = (O = Object(it))[SYMBOL_TAG]) == 'string' ? T : cof(O);
}

// Function
var call  = FunctionProto.call
  , apply = FunctionProto.apply
  , REFERENCE_GET;
// Partial apply
function part(/* ...args */){
  var fn     = assertFunction(this)
    , length = arguments.length
    , args   = Array(length)
    , i      = 0
    , _      = path._
    , holder = false;
  while(length > i)if((args[i] = arguments[i++]) === _)holder = true;
  return function(/* ...args */){
    var that    = this
      , _length = arguments.length
      , i = 0, j = 0, _args;
    if(!holder && !_length)return invoke(fn, args, that);
    _args = args.slice();
    if(holder)for(;length > i; i++)if(_args[i] === _)_args[i] = arguments[j++];
    while(_length > j)_args.push(arguments[j++]);
    return invoke(fn, _args, that);
  }
}
// Optional / simple context binding
function ctx(fn, that, length){
  assertFunction(fn);
  if(~length && that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    }
    case 2: return function(a, b){
      return fn.call(that, a, b);
    }
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    }
  } return function(/* ...args */){
      return fn.apply(that, arguments);
  }
}
// Fast apply
// http://jsperf.lnkit.com/fast-apply/5
function invoke(fn, args, that){
  var un = that === undefined;
  switch(args.length | 0){
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
    case 5: return un ? fn(args[0], args[1], args[2], args[3], args[4])
                      : fn.call(that, args[0], args[1], args[2], args[3], args[4]);
  } return              fn.apply(that, args);
}

// Object:
var create           = Object.create
  , getPrototypeOf   = Object.getPrototypeOf
  , setPrototypeOf   = Object.setPrototypeOf
  , defineProperty   = Object.defineProperty
  , defineProperties = Object.defineProperties
  , getOwnDescriptor = Object.getOwnPropertyDescriptor
  , getKeys          = Object.keys
  , getNames         = Object.getOwnPropertyNames
  , getSymbols       = Object.getOwnPropertySymbols
  , isFrozen         = Object.isFrozen
  , has              = ctx(call, ObjectProto[HAS_OWN], 2)
  // Dummy, fix for not array-like ES3 string in es5 module
  , ES5Object        = Object
  , Dict;
function toObject(it){
  return ES5Object(assertDefined(it));
}
function returnIt(it){
  return it;
}
function returnThis(){
  return this;
}
function get(object, key){
  if(has(object, key))return object[key];
}
function ownKeys(it){
  assertObject(it);
  return getSymbols ? getNames(it).concat(getSymbols(it)) : getNames(it);
}
// 19.1.2.1 Object.assign(target, source, ...)
var assign = Object.assign || function(target, source){
  var T = Object(assertDefined(target))
    , l = arguments.length
    , i = 1;
  while(l > i){
    var S      = ES5Object(arguments[i++])
      , keys   = getKeys(S)
      , length = keys.length
      , j      = 0
      , key;
    while(length > j)T[key = keys[j++]] = S[key];
  }
  return T;
}
function keyOf(object, el){
  var O      = toObject(object)
    , keys   = getKeys(O)
    , length = keys.length
    , index  = 0
    , key;
  while(length > index)if(O[key = keys[index++]] === el)return key;
}

// Array
// array('str1,str2,str3') => ['str1', 'str2', 'str3']
function array(it){
  return String(it).split(',');
}
var push    = ArrayProto.push
  , unshift = ArrayProto.unshift
  , slice   = ArrayProto.slice
  , splice  = ArrayProto.splice
  , indexOf = ArrayProto.indexOf
  , forEach = ArrayProto[FOR_EACH];
/*
 * 0 -> forEach
 * 1 -> map
 * 2 -> filter
 * 3 -> some
 * 4 -> every
 * 5 -> find
 * 6 -> findIndex
 */
function createArrayMethod(type){
  var isMap       = type == 1
    , isFilter    = type == 2
    , isSome      = type == 3
    , isEvery     = type == 4
    , isFindIndex = type == 6
    , noholes     = type == 5 || isFindIndex;
  return function(callbackfn/*, that = undefined */){
    var O      = Object(assertDefined(this))
      , that   = arguments[1]
      , self   = ES5Object(O)
      , f      = ctx(callbackfn, that, 3)
      , length = toLength(self.length)
      , index  = 0
      , result = isMap ? Array(length) : isFilter ? [] : undefined
      , val, res;
    for(;length > index; index++)if(noholes || index in self){
      val = self[index];
      res = f(val, index, O);
      if(type){
        if(isMap)result[index] = res;             // map
        else if(res)switch(type){
          case 3: return true;                    // some
          case 5: return val;                     // find
          case 6: return index;                   // findIndex
          case 2: result.push(val);               // filter
        } else if(isEvery)return false;           // every
      }
    }
    return isFindIndex ? -1 : isSome || isEvery ? isEvery : result;
  }
}
function createArrayContains(isContains){
  return function(el /*, fromIndex = 0 */){
    var O      = toObject(this)
      , length = toLength(O.length)
      , index  = toIndex(arguments[1], length);
    if(isContains && el != el){
      for(;length > index; index++)if(sameNaN(O[index]))return isContains || index;
    } else for(;length > index; index++)if(isContains || index in O){
      if(O[index] === el)return isContains || index;
    } return !isContains && -1;
  }
}
function generic(A, B){
  // strange IE quirks mode bug -> use typeof vs isFunction
  return typeof A == 'function' ? A : B;
}

// Math
var MAX_SAFE_INTEGER = 0x1fffffffffffff // pow(2, 53) - 1 == 9007199254740991
  , pow    = Math.pow
  , abs    = Math.abs
  , ceil   = Math.ceil
  , floor  = Math.floor
  , max    = Math.max
  , min    = Math.min
  , random = Math.random
  , trunc  = Math.trunc || function(it){
      return (it > 0 ? floor : ceil)(it);
    }
// 20.1.2.4 Number.isNaN(number)
function sameNaN(number){
  return number != number;
}
// 7.1.4 ToInteger
function toInteger(it){
  return isNaN(it) ? 0 : trunc(it);
}
// 7.1.15 ToLength
function toLength(it){
  return it > 0 ? min(toInteger(it), MAX_SAFE_INTEGER) : 0;
}
function toIndex(index, length){
  var index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
}
function lz(num){
  return num > 9 ? num : '0' + num;
}

function createReplacer(regExp, replace, isStatic){
  var replacer = isObject(replace) ? function(part){
    return replace[part];
  } : replace;
  return function(it){
    return String(isStatic ? it : this).replace(regExp, replacer);
  }
}
function createPointAt(toString){
  return function(pos){
    var s = String(assertDefined(this))
      , i = toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return toString ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? toString ? s.charAt(i) : a
      : toString ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  }
}

// Assertion & errors
var REDUCE_ERROR = 'Reduce of empty object with no initial value';
function assert(condition, msg1, msg2){
  if(!condition)throw TypeError(msg2 ? msg1 + msg2 : msg1);
}
function assertDefined(it){
  if(it == undefined)throw TypeError('Function called on null or undefined');
  return it;
}
function assertFunction(it){
  assert(isFunction(it), it, ' is not a function!');
  return it;
}
function assertObject(it){
  assert(isObject(it), it, ' is not an object!');
  return it;
}
function assertInstance(it, Constructor, name){
  assert(it instanceof Constructor, name, ": use the 'new' operator!");
}

// Property descriptors & Symbol
function descriptor(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  }
}
function simpleSet(object, key, value){
  object[key] = value;
  return object;
}
function createDefiner(bitmap){
  return DESC ? function(object, key, value){
    return defineProperty(object, key, descriptor(bitmap, value));
  } : simpleSet;
}
function uid(key){
  return SYMBOL + '(' + key + ')_' + (++sid + random())[TO_STRING](36);
}
function getWellKnownSymbol(name, setter){
  return (Symbol && Symbol[name]) || (setter ? Symbol : safeSymbol)(SYMBOL + DOT + name);
}
// The engine works fine with descriptors? Thank's IE8 for his funny defineProperty.
var DESC = !!function(){
      try {
        return defineProperty({}, 'a', {get: function(){ return 2 }}).a == 2;
      } catch(e){}
    }()
  , sid    = 0
  , hidden = createDefiner(1)
  , set    = Symbol ? simpleSet : hidden
  , safeSymbol = Symbol || uid;
function assignHidden(target, src){
  for(var key in src)hidden(target, key, src[key]);
  return target;
}

var SYMBOL_UNSCOPABLES = getWellKnownSymbol('unscopables')
  , ArrayUnscopables   = ArrayProto[SYMBOL_UNSCOPABLES] || {}
  , SYMBOL_TAG         = getWellKnownSymbol(TO_STRING_TAG)
  , SYMBOL_SPECIES     = getWellKnownSymbol('species')
  , SYMBOL_ITERATOR;
function setSpecies(C){
  if(DESC && (framework || !isNative(C)))defineProperty(C, SYMBOL_SPECIES, {
    configurable: true,
    get: returnThis
  });
}

/******************************************************************************
 * Module : common.export                                                     *
 ******************************************************************************/

var NODE = cof(process) == PROCESS
  , core = {}
  , path = framework ? global : core
  , old  = global.core
  , exportGlobal
  // type bitmap
  , FORCED = 1
  , GLOBAL = 2
  , STATIC = 4
  , PROTO  = 8
  , BIND   = 16
  , WRAP   = 32;
function $define(type, name, source){
  var key, own, out, exp
    , isGlobal = type & GLOBAL
    , target   = isGlobal ? global : (type & STATIC)
        ? global[name] : (global[name] || ObjectProto)[PROTOTYPE]
    , exports  = isGlobal ? core : core[name] || (core[name] = {});
  if(isGlobal)source = name;
  for(key in source){
    // there is a similar native
    own = !(type & FORCED) && target && key in target
      && (!isFunction(target[key]) || isNative(target[key]));
    // export native or passed
    out = (own ? target : source)[key];
    // prevent global pollution for namespaces
    if(!framework && isGlobal && !isFunction(target[key]))exp = source[key];
    // bind timers to global for call from export context
    else if(type & BIND && own)exp = ctx(out, global);
    // wrap global constructors for prevent change them in library
    else if(type & WRAP && !framework && target[key] == out){
      exp = function(param){
        return this instanceof out ? new out(param) : out(param);
      }
      exp[PROTOTYPE] = out[PROTOTYPE];
    } else exp = type & PROTO && isFunction(out) ? ctx(call, out) : out;
    // extend global
    if(framework && target && !own){
      if(isGlobal)target[key] = out;
      else delete target[key] && hidden(target, key, out);
    }
    // export
    if(exports[key] != out)hidden(exports, key, exp);
  }
}
// CommonJS export
if(typeof module != 'undefined' && module.exports)module.exports = core;
// RequireJS export
else if(isFunction(define) && define.amd)define(function(){return core});
// Export to global object
else exportGlobal = true;
if(exportGlobal || framework){
  core.noConflict = function(){
    global.core = old;
    return core;
  }
  global.core = core;
}

/******************************************************************************
 * Module : common.iterators                                                  *
 ******************************************************************************/

SYMBOL_ITERATOR = getWellKnownSymbol(ITERATOR);
var ITER  = safeSymbol('iter')
  , KEY   = 1
  , VALUE = 2
  , Iterators = {}
  , IteratorPrototype = {}
    // Safari has byggy iterators w/o `next`
  , BUGGY_ITERATORS = 'keys' in ArrayProto && !('next' in [].keys());
// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
setIterator(IteratorPrototype, returnThis);
function setIterator(O, value){
  hidden(O, SYMBOL_ITERATOR, value);
  // Add iterator for FF iterator protocol
  FF_ITERATOR in ArrayProto && hidden(O, FF_ITERATOR, value);
}
function createIterator(Constructor, NAME, next, proto){
  Constructor[PROTOTYPE] = create(proto || IteratorPrototype, {next: descriptor(1, next)});
  setToStringTag(Constructor, NAME + ' Iterator');
}
function defineIterator(Constructor, NAME, value, DEFAULT){
  var proto = Constructor[PROTOTYPE]
    , iter  = get(proto, SYMBOL_ITERATOR) || get(proto, FF_ITERATOR) || (DEFAULT && get(proto, DEFAULT)) || value;
  if(framework){
    // Define iterator
    setIterator(proto, iter);
    if(iter !== value){
      var iterProto = getPrototypeOf(iter.call(new Constructor));
      // Set @@toStringTag to native iterators
      setToStringTag(iterProto, NAME + ' Iterator', true);
      // FF fix
      has(proto, FF_ITERATOR) && setIterator(iterProto, returnThis);
    }
  }
  // Plug for library
  Iterators[NAME] = iter;
  // FF & v8 fix
  Iterators[NAME + ' Iterator'] = returnThis;
  return iter;
}
function defineStdIterators(Base, NAME, Constructor, next, DEFAULT, IS_SET){
  function createIter(kind){
    return function(){
      return new Constructor(this, kind);
    }
  }
  createIterator(Constructor, NAME, next);
  var entries = createIter(KEY+VALUE)
    , values  = createIter(VALUE);
  if(DEFAULT == VALUE)values = defineIterator(Base, NAME, values, 'values');
  else entries = defineIterator(Base, NAME, entries, 'entries');
  if(DEFAULT){
    $define(PROTO + FORCED * BUGGY_ITERATORS, NAME, {
      entries: entries,
      keys: IS_SET ? values : createIter(KEY),
      values: values
    });
  }
}
function iterResult(done, value){
  return {value: value, done: !!done};
}
function isIterable(it){
  var O      = Object(it)
    , Symbol = global[SYMBOL]
    , hasExt = (Symbol && Symbol[ITERATOR] || FF_ITERATOR) in O;
  return hasExt || SYMBOL_ITERATOR in O || has(Iterators, classof(O));
}
function getIterator(it){
  var Symbol  = global[SYMBOL]
    , ext     = it[Symbol && Symbol[ITERATOR] || FF_ITERATOR]
    , getIter = ext || it[SYMBOL_ITERATOR] || Iterators[classof(it)];
  return assertObject(getIter.call(it));
}
function stepCall(fn, value, entries){
  return entries ? invoke(fn, value) : fn(value);
}
function checkDangerIterClosing(fn){
  var danger = true;
  var O = {
    next: function(){ throw 1 },
    'return': function(){ danger = false }
  };
  O[SYMBOL_ITERATOR] = returnThis;
  try {
    fn(O);
  } catch(e){}
  return danger;
}
function closeIterator(iterator){
  var ret = iterator['return'];
  if(ret !== undefined)ret.call(iterator);
}
function safeIterClose(exec, iterator){
  try {
    exec(iterator);
  } catch(e){
    closeIterator(iterator);
    throw e;
  }
}
function forOf(iterable, entries, fn, that){
  safeIterClose(function(iterator){
    var f = ctx(fn, that, entries ? 2 : 1)
      , step;
    while(!(step = iterator.next()).done)if(stepCall(f, step.value, entries) === false){
      return closeIterator(iterator);
    }
  }, getIterator(iterable));
}

/******************************************************************************
 * Module : es6.symbol                                                        *
 ******************************************************************************/

// ECMAScript 6 symbols shim
!function(TAG, SymbolRegistry, AllSymbols, setter){
  // 19.4.1.1 Symbol([description])
  if(!isNative(Symbol)){
    Symbol = function(description){
      assert(!(this instanceof Symbol), SYMBOL + ' is not a ' + CONSTRUCTOR);
      var tag = uid(description)
        , sym = set(create(Symbol[PROTOTYPE]), TAG, tag);
      AllSymbols[tag] = sym;
      DESC && setter && defineProperty(ObjectProto, tag, {
        configurable: true,
        set: function(value){
          hidden(this, tag, value);
        }
      });
      return sym;
    }
    hidden(Symbol[PROTOTYPE], TO_STRING, function(){
      return this[TAG];
    });
  }
  $define(GLOBAL + WRAP, {Symbol: Symbol});
  
  var symbolStatics = {
    // 19.4.2.1 Symbol.for(key)
    'for': function(key){
      return has(SymbolRegistry, key += '')
        ? SymbolRegistry[key]
        : SymbolRegistry[key] = Symbol(key);
    },
    // 19.4.2.4 Symbol.iterator
    iterator: SYMBOL_ITERATOR || getWellKnownSymbol(ITERATOR),
    // 19.4.2.5 Symbol.keyFor(sym)
    keyFor: part.call(keyOf, SymbolRegistry),
    // 19.4.2.10 Symbol.species
    species: SYMBOL_SPECIES,
    // 19.4.2.13 Symbol.toStringTag
    toStringTag: SYMBOL_TAG = getWellKnownSymbol(TO_STRING_TAG, true),
    // 19.4.2.14 Symbol.unscopables
    unscopables: SYMBOL_UNSCOPABLES,
    pure: safeSymbol,
    set: set,
    useSetter: function(){setter = true},
    useSimple: function(){setter = false}
  };
  // 19.4.2.2 Symbol.hasInstance
  // 19.4.2.3 Symbol.isConcatSpreadable
  // 19.4.2.6 Symbol.match
  // 19.4.2.8 Symbol.replace
  // 19.4.2.9 Symbol.search
  // 19.4.2.11 Symbol.split
  // 19.4.2.12 Symbol.toPrimitive
  forEach.call(array('hasInstance,isConcatSpreadable,match,replace,search,split,toPrimitive'),
    function(it){
      symbolStatics[it] = getWellKnownSymbol(it);
    }
  );
  $define(STATIC, SYMBOL, symbolStatics);
  
  setToStringTag(Symbol, SYMBOL);
  
  $define(STATIC + FORCED * !isNative(Symbol), OBJECT, {
    // 19.1.2.7 Object.getOwnPropertyNames(O)
    getOwnPropertyNames: function(it){
      var names = getNames(toObject(it)), result = [], key, i = 0;
      while(names.length > i)has(AllSymbols, key = names[i++]) || result.push(key);
      return result;
    },
    // 19.1.2.8 Object.getOwnPropertySymbols(O)
    getOwnPropertySymbols: function(it){
      var names = getNames(toObject(it)), result = [], key, i = 0;
      while(names.length > i)has(AllSymbols, key = names[i++]) && result.push(AllSymbols[key]);
      return result;
    }
  });
  
  // 20.2.1.9 Math[@@toStringTag]
  setToStringTag(Math, MATH, true);
  // 24.3.3 JSON[@@toStringTag]
  setToStringTag(global.JSON, 'JSON', true);
}(safeSymbol('tag'), {}, {}, true);

/******************************************************************************
 * Module : es6.object.statics                                                *
 ******************************************************************************/

!function(){
  var objectStatic = {
    // 19.1.3.1 Object.assign(target, source)
    assign: assign,
    // 19.1.3.10 Object.is(value1, value2)
    is: function(x, y){
      return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
    }
  };
  // 19.1.3.19 Object.setPrototypeOf(O, proto)
  // Works with __proto__ only. Old v8 can't works with null proto objects.
  '__proto__' in ObjectProto && function(buggy, set){
    try {
      set = ctx(call, getOwnDescriptor(ObjectProto, '__proto__').set, 2);
      set({}, ArrayProto);
    } catch(e){ buggy = true }
    objectStatic.setPrototypeOf = setPrototypeOf = setPrototypeOf || function(O, proto){
      assertObject(O);
      assert(proto === null || isObject(proto), proto, ": can't set as prototype!");
      if(buggy)O.__proto__ = proto;
      else set(O, proto);
      return O;
    }
  }();
  $define(STATIC, OBJECT, objectStatic);
}();

/******************************************************************************
 * Module : es6.object.statics-accept-primitives                              *
 ******************************************************************************/

!function(){
  // Object static methods accept primitives
  function wrapObjectMethod(key, MODE){
    var fn  = Object[key]
      , exp = core[OBJECT][key]
      , f   = 0
      , o   = {};
    if(!exp || isNative(exp)){
      o[key] = MODE == 1 ? function(it){
        return isObject(it) ? fn(it) : it;
      } : MODE == 2 ? function(it){
        return isObject(it) ? fn(it) : true;
      } : MODE == 3 ? function(it){
        return isObject(it) ? fn(it) : false;
      } : MODE == 4 ? function(it, key){
        return fn(toObject(it), key);
      } : function(it){
        return fn(toObject(it));
      };
      try { fn(DOT) }
      catch(e){ f = 1 }
      $define(STATIC + FORCED * f, OBJECT, o);
    }
  }
  wrapObjectMethod('freeze', 1);
  wrapObjectMethod('seal', 1);
  wrapObjectMethod('preventExtensions', 1);
  wrapObjectMethod('isFrozen', 2);
  wrapObjectMethod('isSealed', 2);
  wrapObjectMethod('isExtensible', 3);
  wrapObjectMethod('getOwnPropertyDescriptor', 4);
  wrapObjectMethod('getPrototypeOf');
  wrapObjectMethod('keys');
  wrapObjectMethod('getOwnPropertyNames');
}();

/******************************************************************************
 * Module : es6.number.statics                                                *
 ******************************************************************************/

!function(isInteger){
  $define(STATIC, NUMBER, {
    // 20.1.2.1 Number.EPSILON
    EPSILON: pow(2, -52),
    // 20.1.2.2 Number.isFinite(number)
    isFinite: function(it){
      return typeof it == 'number' && isFinite(it);
    },
    // 20.1.2.3 Number.isInteger(number)
    isInteger: isInteger,
    // 20.1.2.4 Number.isNaN(number)
    isNaN: sameNaN,
    // 20.1.2.5 Number.isSafeInteger(number)
    isSafeInteger: function(number){
      return isInteger(number) && abs(number) <= MAX_SAFE_INTEGER;
    },
    // 20.1.2.6 Number.MAX_SAFE_INTEGER
    MAX_SAFE_INTEGER: MAX_SAFE_INTEGER,
    // 20.1.2.10 Number.MIN_SAFE_INTEGER
    MIN_SAFE_INTEGER: -MAX_SAFE_INTEGER,
    // 20.1.2.12 Number.parseFloat(string)
    parseFloat: parseFloat,
    // 20.1.2.13 Number.parseInt(string, radix)
    parseInt: parseInt
  });
// 20.1.2.3 Number.isInteger(number)
}(Number.isInteger || function(it){
  return !isObject(it) && isFinite(it) && floor(it) === it;
});

/******************************************************************************
 * Module : es6.math                                                          *
 ******************************************************************************/

// ECMAScript 6 shim
!function(){
  // 20.2.2.28 Math.sign(x)
  var E    = Math.E
    , exp  = Math.exp
    , log  = Math.log
    , sqrt = Math.sqrt
    , sign = Math.sign || function(x){
        return (x = +x) == 0 || x != x ? x : x < 0 ? -1 : 1;
      };
  
  // 20.2.2.5 Math.asinh(x)
  function asinh(x){
    return !isFinite(x = +x) || x == 0 ? x : x < 0 ? -asinh(-x) : log(x + sqrt(x * x + 1));
  }
  // 20.2.2.14 Math.expm1(x)
  function expm1(x){
    return (x = +x) == 0 ? x : x > -1e-6 && x < 1e-6 ? x + x * x / 2 : exp(x) - 1;
  }
    
  $define(STATIC, MATH, {
    // 20.2.2.3 Math.acosh(x)
    acosh: function(x){
      return (x = +x) < 1 ? NaN : isFinite(x) ? log(x / E + sqrt(x + 1) * sqrt(x - 1) / E) + 1 : x;
    },
    // 20.2.2.5 Math.asinh(x)
    asinh: asinh,
    // 20.2.2.7 Math.atanh(x)
    atanh: function(x){
      return (x = +x) == 0 ? x : log((1 + x) / (1 - x)) / 2;
    },
    // 20.2.2.9 Math.cbrt(x)
    cbrt: function(x){
      return sign(x = +x) * pow(abs(x), 1 / 3);
    },
    // 20.2.2.11 Math.clz32(x)
    clz32: function(x){
      return (x >>>= 0) ? 32 - x[TO_STRING](2).length : 32;
    },
    // 20.2.2.12 Math.cosh(x)
    cosh: function(x){
      return (exp(x = +x) + exp(-x)) / 2;
    },
    // 20.2.2.14 Math.expm1(x)
    expm1: expm1,
    // 20.2.2.16 Math.fround(x)
    // TODO: fallback for IE9-
    fround: function(x){
      return new Float32Array([x])[0];
    },
    // 20.2.2.17 Math.hypot([value1[, value2[, … ]]])
    hypot: function(value1, value2){
      var sum  = 0
        , len1 = arguments.length
        , len2 = len1
        , args = Array(len1)
        , larg = -Infinity
        , arg;
      while(len1--){
        arg = args[len1] = +arguments[len1];
        if(arg == Infinity || arg == -Infinity)return Infinity;
        if(arg > larg)larg = arg;
      }
      larg = arg || 1;
      while(len2--)sum += pow(args[len2] / larg, 2);
      return larg * sqrt(sum);
    },
    // 20.2.2.18 Math.imul(x, y)
    imul: function(x, y){
      var UInt16 = 0xffff
        , xn = +x
        , yn = +y
        , xl = UInt16 & xn
        , yl = UInt16 & yn;
      return 0 | xl * yl + ((UInt16 & xn >>> 16) * yl + xl * (UInt16 & yn >>> 16) << 16 >>> 0);
    },
    // 20.2.2.20 Math.log1p(x)
    log1p: function(x){
      return (x = +x) > -1e-8 && x < 1e-8 ? x - x * x / 2 : log(1 + x);
    },
    // 20.2.2.21 Math.log10(x)
    log10: function(x){
      return log(x) / Math.LN10;
    },
    // 20.2.2.22 Math.log2(x)
    log2: function(x){
      return log(x) / Math.LN2;
    },
    // 20.2.2.28 Math.sign(x)
    sign: sign,
    // 20.2.2.30 Math.sinh(x)
    sinh: function(x){
      return (abs(x = +x) < 1) ? (expm1(x) - expm1(-x)) / 2 : (exp(x - 1) - exp(-x - 1)) * (E / 2);
    },
    // 20.2.2.33 Math.tanh(x)
    tanh: function(x){
      var a = expm1(x = +x)
        , b = expm1(-x);
      return a == Infinity ? 1 : b == Infinity ? -1 : (a - b) / (exp(x) + exp(-x));
    },
    // 20.2.2.34 Math.trunc(x)
    trunc: trunc
  });
}();

/******************************************************************************
 * Module : es6.string                                                        *
 ******************************************************************************/

!function(fromCharCode){
  function assertNotRegExp(it){
    if(cof(it) == REGEXP)throw TypeError();
  }
  
  $define(STATIC, STRING, {
    // 21.1.2.2 String.fromCodePoint(...codePoints)
    fromCodePoint: function(x){
      var res = []
        , len = arguments.length
        , i   = 0
        , code
      while(len > i){
        code = +arguments[i++];
        if(toIndex(code, 0x10ffff) !== code)throw RangeError(code + ' is not a valid code point');
        res.push(code < 0x10000
          ? fromCharCode(code)
          : fromCharCode(((code -= 0x10000) >> 10) + 0xd800, code % 0x400 + 0xdc00)
        );
      } return res.join('');
    },
    // 21.1.2.4 String.raw(callSite, ...substitutions)
    raw: function(callSite){
      var raw = toObject(callSite.raw)
        , len = toLength(raw.length)
        , sln = arguments.length
        , res = []
        , i   = 0;
      while(len > i){
        res.push(String(raw[i++]));
        if(i < sln)res.push(String(arguments[i]));
      } return res.join('');
    }
  });
  
  $define(PROTO, STRING, {
    // 21.1.3.3 String.prototype.codePointAt(pos)
    codePointAt: createPointAt(false),
    // 21.1.3.6 String.prototype.endsWith(searchString [, endPosition])
    endsWith: function(searchString /*, endPosition = @length */){
      assertNotRegExp(searchString);
      var that = String(assertDefined(this))
        , endPosition = arguments[1]
        , len = toLength(that.length)
        , end = endPosition === undefined ? len : min(toLength(endPosition), len);
      searchString += '';
      return that.slice(end - searchString.length, end) === searchString;
    },
    // 21.1.3.7 String.prototype.includes(searchString, position = 0)
    includes: function(searchString /*, position = 0 */){
      assertNotRegExp(searchString);
      return !!~String(assertDefined(this)).indexOf(searchString, arguments[1]);
    },
    // 21.1.3.13 String.prototype.repeat(count)
    repeat: function(count){
      var str = String(assertDefined(this))
        , res = ''
        , n   = toInteger(count);
      if(0 > n || n == Infinity)throw RangeError("Count can't be negative");
      for(;n > 0; (n >>>= 1) && (str += str))if(n & 1)res += str;
      return res;
    },
    // 21.1.3.18 String.prototype.startsWith(searchString [, position ])
    startsWith: function(searchString /*, position = 0 */){
      assertNotRegExp(searchString);
      var that  = String(assertDefined(this))
        , index = toLength(min(arguments[1], that.length));
      searchString += '';
      return that.slice(index, index + searchString.length) === searchString;
    }
  });
}(String.fromCharCode);

/******************************************************************************
 * Module : es6.array.statics                                                 *
 ******************************************************************************/

!function(){
  $define(STATIC + FORCED * checkDangerIterClosing(Array.from), ARRAY, {
    // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
    from: function(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
      var O       = Object(assertDefined(arrayLike))
        , mapfn   = arguments[1]
        , mapping = mapfn !== undefined
        , f       = mapping ? ctx(mapfn, arguments[2], 2) : undefined
        , index   = 0
        , length, result, step;
      if(isIterable(O)){
        result = new (generic(this, Array));
        safeIterClose(function(iterator){
          for(; !(step = iterator.next()).done; index++){
            result[index] = mapping ? f(step.value, index) : step.value;
          }
        }, getIterator(O));
      } else {
        result = new (generic(this, Array))(length = toLength(O.length));
        for(; length > index; index++){
          result[index] = mapping ? f(O[index], index) : O[index];
        }
      }
      result.length = index;
      return result;
    }
  });
  
  $define(STATIC, ARRAY, {
    // 22.1.2.3 Array.of( ...items)
    of: function(/* ...args */){
      var index  = 0
        , length = arguments.length
        , result = new (generic(this, Array))(length);
      while(length > index)result[index] = arguments[index++];
      result.length = length;
      return result;
    }
  });
  
  setSpecies(Array);
}();

/******************************************************************************
 * Module : es6.array.prototype                                               *
 ******************************************************************************/

!function(){
  $define(PROTO, ARRAY, {
    // 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)
    copyWithin: function(target /* = 0 */, start /* = 0, end = @length */){
      var O     = Object(assertDefined(this))
        , len   = toLength(O.length)
        , to    = toIndex(target, len)
        , from  = toIndex(start, len)
        , end   = arguments[2]
        , fin   = end === undefined ? len : toIndex(end, len)
        , count = min(fin - from, len - to)
        , inc   = 1;
      if(from < to && to < from + count){
        inc  = -1;
        from = from + count - 1;
        to   = to + count - 1;
      }
      while(count-- > 0){
        if(from in O)O[to] = O[from];
        else delete O[to];
        to += inc;
        from += inc;
      } return O;
    },
    // 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)
    fill: function(value /*, start = 0, end = @length */){
      var O      = Object(assertDefined(this))
        , length = toLength(O.length)
        , index  = toIndex(arguments[1], length)
        , end    = arguments[2]
        , endPos = end === undefined ? length : toIndex(end, length);
      while(endPos > index)O[index++] = value;
      return O;
    },
    // 22.1.3.8 Array.prototype.find(predicate, thisArg = undefined)
    find: createArrayMethod(5),
    // 22.1.3.9 Array.prototype.findIndex(predicate, thisArg = undefined)
    findIndex: createArrayMethod(6)
  });
  
  if(framework){
    // 22.1.3.31 Array.prototype[@@unscopables]
    forEach.call(array('find,findIndex,fill,copyWithin,entries,keys,values'), function(it){
      ArrayUnscopables[it] = true;
    });
    SYMBOL_UNSCOPABLES in ArrayProto || hidden(ArrayProto, SYMBOL_UNSCOPABLES, ArrayUnscopables);
  }
}();

/******************************************************************************
 * Module : es6.iterators                                                     *
 ******************************************************************************/

!function(at){
  // 22.1.3.4 Array.prototype.entries()
  // 22.1.3.13 Array.prototype.keys()
  // 22.1.3.29 Array.prototype.values()
  // 22.1.3.30 Array.prototype[@@iterator]()
  defineStdIterators(Array, ARRAY, function(iterated, kind){
    set(this, ITER, {o: toObject(iterated), i: 0, k: kind});
  // 22.1.5.2.1 %ArrayIteratorPrototype%.next()
  }, function(){
    var iter  = this[ITER]
      , O     = iter.o
      , kind  = iter.k
      , index = iter.i++;
    if(!O || index >= O.length){
      iter.o = undefined;
      return iterResult(1);
    }
    if(kind == KEY)  return iterResult(0, index);
    if(kind == VALUE)return iterResult(0, O[index]);
                     return iterResult(0, [index, O[index]]);
  }, VALUE);
  
  // argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
  Iterators[ARGUMENTS] = Iterators[ARRAY];
  
  // 21.1.3.27 String.prototype[@@iterator]()
  defineStdIterators(String, STRING, function(iterated){
    set(this, ITER, {o: String(iterated), i: 0});
  // 21.1.5.2.1 %StringIteratorPrototype%.next()
  }, function(){
    var iter  = this[ITER]
      , O     = iter.o
      , index = iter.i
      , point;
    if(index >= O.length)return iterResult(1);
    point = at.call(O, index);
    iter.i += point.length;
    return iterResult(0, point);
  });
}(createPointAt(true));

/******************************************************************************
 * Module : web.immediate                                                     *
 ******************************************************************************/

// setImmediate shim
// Node.js 0.9+ & IE10+ has setImmediate, else:
isFunction(setImmediate) && isFunction(clearImmediate) || function(ONREADYSTATECHANGE){
  var postMessage      = global.postMessage
    , addEventListener = global.addEventListener
    , MessageChannel   = global.MessageChannel
    , counter          = 0
    , queue            = {}
    , defer, channel, port;
  setImmediate = function(fn){
    var args = [], i = 1;
    while(arguments.length > i)args.push(arguments[i++]);
    queue[++counter] = function(){
      invoke(isFunction(fn) ? fn : Function(fn), args);
    }
    defer(counter);
    return counter;
  }
  clearImmediate = function(id){
    delete queue[id];
  }
  function run(id){
    if(has(queue, id)){
      var fn = queue[id];
      delete queue[id];
      fn();
    }
  }
  function listner(event){
    run(event.data);
  }
  // Node.js 0.8-
  if(NODE){
    defer = function(id){
      nextTick(part.call(run, id));
    }
  // Modern browsers, skip implementation for WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is object
  } else if(addEventListener && isFunction(postMessage) && !global.importScripts){
    defer = function(id){
      postMessage(id, '*');
    }
    addEventListener('message', listner, false);
  // WebWorkers
  } else if(isFunction(MessageChannel)){
    channel = new MessageChannel;
    port    = channel.port2;
    channel.port1.onmessage = listner;
    defer = ctx(port.postMessage, port, 1);
  // IE8-
  } else if(document && ONREADYSTATECHANGE in document[CREATE_ELEMENT]('script')){
    defer = function(id){
      html.appendChild(document[CREATE_ELEMENT]('script'))[ONREADYSTATECHANGE] = function(){
        html.removeChild(this);
        run(id);
      }
    }
  // Rest old browsers
  } else {
    defer = function(id){
      setTimeout(run, 0, id);
    }
  }
}('onreadystatechange');
$define(GLOBAL + BIND, {
  setImmediate:   setImmediate,
  clearImmediate: clearImmediate
});

/******************************************************************************
 * Module : es6.promise                                                       *
 ******************************************************************************/

// ES6 promises shim
// Based on https://github.com/getify/native-promise-only/
!function(Promise, test){
  isFunction(Promise) && isFunction(Promise.resolve)
  && Promise.resolve(test = new Promise(function(){})) == test
  || function(asap, RECORD){
    function isThenable(it){
      var then;
      if(isObject(it))then = it.then;
      return isFunction(then) ? then : false;
    }
    function handledRejectionOrHasOnRejected(promise){
      var record = promise[RECORD]
        , chain  = record.c
        , i      = 0
        , react;
      if(record.h)return true;
      while(chain.length > i){
        react = chain[i++];
        if(react.fail || handledRejectionOrHasOnRejected(react.P))return true;
      }
    }
    function notify(record, reject){
      var chain = record.c;
      if(reject || chain.length)asap(function(){
        var promise = record.p
          , value   = record.v
          , ok      = record.s == 1
          , i       = 0;
        if(reject && !handledRejectionOrHasOnRejected(promise)){
          setTimeout(function(){
            if(!handledRejectionOrHasOnRejected(promise)){
              if(NODE){
                if(!process.emit('unhandledRejection', value, promise)){
                  // default node.js behavior
                }
              } else if(isFunction(console.error)){
                console.error('Unhandled promise rejection', value);
              }
            }
          }, 1e3);
        } else while(chain.length > i)!function(react){
          var cb = ok ? react.ok : react.fail
            , ret, then;
          try {
            if(cb){
              if(!ok)record.h = true;
              ret = cb === true ? value : cb(value);
              if(ret === react.P){
                react.rej(TypeError(PROMISE + '-chain cycle'));
              } else if(then = isThenable(ret)){
                then.call(ret, react.res, react.rej);
              } else react.res(ret);
            } else react.rej(value);
          } catch(err){
            react.rej(err);
          }
        }(chain[i++]);
        chain.length = 0;
      });
    }
    function resolve(value){
      var record = this
        , then, wrapper;
      if(record.d)return;
      record.d = true;
      record = record.r || record; // unwrap
      try {
        if(then = isThenable(value)){
          wrapper = {r: record, d: false}; // wrap
          then.call(value, ctx(resolve, wrapper, 1), ctx(reject, wrapper, 1));
        } else {
          record.v = value;
          record.s = 1;
          notify(record);
        }
      } catch(err){
        reject.call(wrapper || {r: record, d: false}, err); // wrap
      }
    }
    function reject(value){
      var record = this;
      if(record.d)return;
      record.d = true;
      record = record.r || record; // unwrap
      record.v = value;
      record.s = 2;
      notify(record, true);
    }
    function getConstructor(C){
      var S = assertObject(C)[SYMBOL_SPECIES];
      return S != undefined ? S : C;
    }
    // 25.4.3.1 Promise(executor)
    Promise = function(executor){
      assertFunction(executor);
      assertInstance(this, Promise, PROMISE);
      var record = {
        p: this,      // promise
        c: [],        // chain
        s: 0,         // state
        d: false,     // done
        v: undefined, // value
        h: false      // handled rejection
      };
      hidden(this, RECORD, record);
      try {
        executor(ctx(resolve, record, 1), ctx(reject, record, 1));
      } catch(err){
        reject.call(record, err);
      }
    }
    assignHidden(Promise[PROTOTYPE], {
      // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
      then: function(onFulfilled, onRejected){
        var S = assertObject(assertObject(this)[CONSTRUCTOR])[SYMBOL_SPECIES];
        var react = {
          ok:   isFunction(onFulfilled) ? onFulfilled : true,
          fail: isFunction(onRejected)  ? onRejected  : false
        } , P = react.P = new (S != undefined ? S : Promise)(function(resolve, reject){
          react.res = assertFunction(resolve);
          react.rej = assertFunction(reject);
        }), record = this[RECORD];
        record.c.push(react);
        record.s && notify(record);
        return P;
      },
      // 25.4.5.1 Promise.prototype.catch(onRejected)
      'catch': function(onRejected){
        return this.then(undefined, onRejected);
      }
    });
    assignHidden(Promise, {
      // 25.4.4.1 Promise.all(iterable)
      all: function(iterable){
        var Promise = getConstructor(this)
          , values  = [];
        return new Promise(function(resolve, reject){
          forOf(iterable, false, push, values);
          var remaining = values.length
            , results   = Array(remaining);
          if(remaining)forEach.call(values, function(promise, index){
            Promise.resolve(promise).then(function(value){
              results[index] = value;
              --remaining || resolve(results);
            }, reject);
          });
          else resolve(results);
        });
      },
      // 25.4.4.4 Promise.race(iterable)
      race: function(iterable){
        var Promise = getConstructor(this);
        return new Promise(function(resolve, reject){
          forOf(iterable, false, function(promise){
            Promise.resolve(promise).then(resolve, reject);
          });
        });
      },
      // 25.4.4.5 Promise.reject(r)
      reject: function(r){
        return new (getConstructor(this))(function(resolve, reject){
          reject(r);
        });
      },
      // 25.4.4.6 Promise.resolve(x)
      resolve: function(x){
        return isObject(x) && RECORD in x && getPrototypeOf(x) === this[PROTOTYPE]
          ? x : new (getConstructor(this))(function(resolve, reject){
            resolve(x);
          });
      }
    });
  }(nextTick || setImmediate, safeSymbol('record'));
  setToStringTag(Promise, PROMISE);
  setSpecies(Promise);
  $define(GLOBAL + FORCED * !isNative(Promise), {Promise: Promise});
}(global[PROMISE]);

/******************************************************************************
 * Module : es6.collections                                                   *
 ******************************************************************************/

// ECMAScript 6 collections shim
!function(){
  var UID   = safeSymbol('uid')
    , O1    = safeSymbol('O1')
    , WEAK  = safeSymbol('weak')
    , LEAK  = safeSymbol('leak')
    , LAST  = safeSymbol('last')
    , FIRST = safeSymbol('first')
    , SIZE  = DESC ? safeSymbol('size') : 'size'
    , uid   = 0
    , tmp   = {};
  
  function getCollection(C, NAME, methods, commonMethods, isMap, isWeak){
    var ADDER = isMap ? 'set' : 'add'
      , proto = C && C[PROTOTYPE]
      , O     = {};
    function initFromIterable(that, iterable){
      if(iterable != undefined)forOf(iterable, isMap, that[ADDER], that);
      return that;
    }
    function fixSVZ(key, chain){
      var method = proto[key];
      if(framework)proto[key] = function(a, b){
        var result = method.call(this, a === 0 ? 0 : a, b);
        return chain ? this : result;
      };
    }
    if(!isNative(C) || !(isWeak || (!BUGGY_ITERATORS && has(proto, FOR_EACH) && has(proto, 'entries')))){
      // create collection constructor
      C = isWeak
        ? function(iterable){
            assertInstance(this, C, NAME);
            set(this, UID, uid++);
            initFromIterable(this, iterable);
          }
        : function(iterable){
            var that = this;
            assertInstance(that, C, NAME);
            set(that, O1, create(null));
            set(that, SIZE, 0);
            set(that, LAST, undefined);
            set(that, FIRST, undefined);
            initFromIterable(that, iterable);
          };
      assignHidden(assignHidden(C[PROTOTYPE], methods), commonMethods);
      isWeak || !DESC || defineProperty(C[PROTOTYPE], 'size', {get: function(){
        return assertDefined(this[SIZE]);
      }});
    } else {
      var Native = C
        , inst   = new C
        , chain  = inst[ADDER](isWeak ? {} : -0, 1)
        , buggyZero;
      // wrap to init collections from iterable
      if(checkDangerIterClosing(function(O){ new C(O) })){
        C = function(iterable){
          assertInstance(this, C, NAME);
          return initFromIterable(new Native, iterable);
        }
        C[PROTOTYPE] = proto;
        if(framework)proto[CONSTRUCTOR] = C;
      }
      isWeak || inst[FOR_EACH](function(val, key){
        buggyZero = 1 / key === -Infinity;
      });
      // fix converting -0 key to +0
      if(buggyZero){
        fixSVZ('delete');
        fixSVZ('has');
        isMap && fixSVZ('get');
      }
      // + fix .add & .set for chaining
      if(buggyZero || chain !== inst)fixSVZ(ADDER, true);
    }
    setToStringTag(C, NAME);
    setSpecies(C);
    
    O[NAME] = C;
    $define(GLOBAL + WRAP + FORCED * !isNative(C), O);
    
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    isWeak || defineStdIterators(C, NAME, function(iterated, kind){
      set(this, ITER, {o: iterated, k: kind});
    }, function(){
      var iter  = this[ITER]
        , kind  = iter.k
        , entry = iter.l;
      // revert to the last existing entry
      while(entry && entry.r)entry = entry.p;
      // get next entry
      if(!iter.o || !(iter.l = entry = entry ? entry.n : iter.o[FIRST])){
        // or finish the iteration
        iter.o = undefined;
        return iterResult(1);
      }
      // return step by kind
      if(kind == KEY)  return iterResult(0, entry.k);
      if(kind == VALUE)return iterResult(0, entry.v);
                       return iterResult(0, [entry.k, entry.v]);   
    }, isMap ? KEY+VALUE : VALUE, !isMap);
    
    return C;
  }
  
  function fastKey(it, create){
    // return primitive with prefix
    if(!isObject(it))return (typeof it == 'string' ? 'S' : 'P') + it;
    // can't set id to frozen object
    if(isFrozen(it))return 'F';
    if(!has(it, UID)){
      // not necessary to add id
      if(!create)return 'E';
      // add missing object id
      hidden(it, UID, ++uid);
    // return object id with prefix
    } return 'O' + it[UID];
  }
  function getEntry(that, key){
    // fast case
    var index = fastKey(key), entry;
    if(index != 'F')return that[O1][index];
    // frozen object case
    for(entry = that[FIRST]; entry; entry = entry.n){
      if(entry.k == key)return entry;
    }
  }
  function def(that, key, value){
    var entry = getEntry(that, key)
      , prev, index;
    // change existing entry
    if(entry)entry.v = value;
    // create new entry
    else {
      that[LAST] = entry = {
        i: index = fastKey(key, true), // <- index
        k: key,                        // <- key
        v: value,                      // <- value
        p: prev = that[LAST],          // <- previous entry
        n: undefined,                  // <- next entry
        r: false                       // <- removed
      };
      if(!that[FIRST])that[FIRST] = entry;
      if(prev)prev.n = entry;
      that[SIZE]++;
      // add to index
      if(index != 'F')that[O1][index] = entry;
    } return that;
  }

  var collectionMethods = {
    // 23.1.3.1 Map.prototype.clear()
    // 23.2.3.2 Set.prototype.clear()
    clear: function(){
      for(var that = this, data = that[O1], entry = that[FIRST]; entry; entry = entry.n){
        entry.r = true;
        if(entry.p)entry.p = entry.p.n = undefined;
        delete data[entry.i];
      }
      that[FIRST] = that[LAST] = undefined;
      that[SIZE] = 0;
    },
    // 23.1.3.3 Map.prototype.delete(key)
    // 23.2.3.4 Set.prototype.delete(value)
    'delete': function(key){
      var that  = this
        , entry = getEntry(that, key);
      if(entry){
        var next = entry.n
          , prev = entry.p;
        delete that[O1][entry.i];
        entry.r = true;
        if(prev)prev.n = next;
        if(next)next.p = prev;
        if(that[FIRST] == entry)that[FIRST] = next;
        if(that[LAST] == entry)that[LAST] = prev;
        that[SIZE]--;
      } return !!entry;
    },
    // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
    // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
    forEach: function(callbackfn /*, that = undefined */){
      var f = ctx(callbackfn, arguments[1], 3)
        , entry;
      while(entry = entry ? entry.n : this[FIRST]){
        f(entry.v, entry.k, this);
        // revert to the last existing entry
        while(entry && entry.r)entry = entry.p;
      }
    },
    // 23.1.3.7 Map.prototype.has(key)
    // 23.2.3.7 Set.prototype.has(value)
    has: function(key){
      return !!getEntry(this, key);
    }
  }
  
  // 23.1 Map Objects
  Map = getCollection(Map, MAP, {
    // 23.1.3.6 Map.prototype.get(key)
    get: function(key){
      var entry = getEntry(this, key);
      return entry && entry.v;
    },
    // 23.1.3.9 Map.prototype.set(key, value)
    set: function(key, value){
      return def(this, key === 0 ? 0 : key, value);
    }
  }, collectionMethods, true);
  
  // 23.2 Set Objects
  Set = getCollection(Set, SET, {
    // 23.2.3.1 Set.prototype.add(value)
    add: function(value){
      return def(this, value = value === 0 ? 0 : value, value);
    }
  }, collectionMethods);
  
  function defWeak(that, key, value){
    if(isFrozen(assertObject(key)))leakStore(that).set(key, value);
    else {
      has(key, WEAK) || hidden(key, WEAK, {});
      key[WEAK][that[UID]] = value;
    } return that;
  }
  function leakStore(that){
    return that[LEAK] || hidden(that, LEAK, new Map)[LEAK];
  }
  
  var weakMethods = {
    // 23.3.3.2 WeakMap.prototype.delete(key)
    // 23.4.3.3 WeakSet.prototype.delete(value)
    'delete': function(key){
      if(!isObject(key))return false;
      if(isFrozen(key))return leakStore(this)['delete'](key);
      return has(key, WEAK) && has(key[WEAK], this[UID]) && delete key[WEAK][this[UID]];
    },
    // 23.3.3.4 WeakMap.prototype.has(key)
    // 23.4.3.4 WeakSet.prototype.has(value)
    has: function(key){
      if(!isObject(key))return false;
      if(isFrozen(key))return leakStore(this).has(key);
      return has(key, WEAK) && has(key[WEAK], this[UID]);
    }
  };
  
  // 23.3 WeakMap Objects
  WeakMap = getCollection(WeakMap, WEAKMAP, {
    // 23.3.3.3 WeakMap.prototype.get(key)
    get: function(key){
      if(isObject(key)){
        if(isFrozen(key))return leakStore(this).get(key);
        if(has(key, WEAK))return key[WEAK][this[UID]];
      }
    },
    // 23.3.3.5 WeakMap.prototype.set(key, value)
    set: function(key, value){
      return defWeak(this, key, value);
    }
  }, weakMethods, true, true);
  
  // IE11 WeakMap frozen keys fix
  if(framework && new WeakMap().set(Object.freeze(tmp), 7).get(tmp) != 7){
    forEach.call(array('delete,has,get,set'), function(key){
      var method = WeakMap[PROTOTYPE][key];
      WeakMap[PROTOTYPE][key] = function(a, b){
        // store frozen objects on leaky map
        if(isObject(a) && isFrozen(a)){
          var result = leakStore(this)[key](a, b);
          return key == 'set' ? this : result;
        // store all the rest on native weakmap
        } return method.call(this, a, b);
      };
    });
  }
  
  // 23.4 WeakSet Objects
  WeakSet = getCollection(WeakSet, WEAKSET, {
    // 23.4.3.1 WeakSet.prototype.add(value)
    add: function(value){
      return defWeak(this, value, true);
    }
  }, weakMethods, false, true);
}();

/******************************************************************************
 * Module : es6.reflect                                                       *
 ******************************************************************************/

!function(){
  function Enumerate(iterated){
    var keys = [], key;
    for(key in iterated)keys.push(key);
    set(this, ITER, {o: iterated, a: keys, i: 0});
  }
  createIterator(Enumerate, OBJECT, function(){
    var iter = this[ITER]
      , keys = iter.a
      , key;
    do {
      if(iter.i >= keys.length)return iterResult(1);
    } while(!((key = keys[iter.i++]) in iter.o));
    return iterResult(0, key);
  });
  
  function wrap(fn){
    return function(it){
      assertObject(it);
      try {
        return fn.apply(undefined, arguments), true;
      } catch(e){
        return false;
      }
    }
  }
  
  function reflectGet(target, propertyKey/*, receiver*/){
    var receiver = arguments.length < 3 ? target : arguments[2]
      , desc = getOwnDescriptor(assertObject(target), propertyKey), proto;
    if(desc)return has(desc, 'value')
      ? desc.value
      : desc.get === undefined
        ? undefined
        : desc.get.call(receiver);
    return isObject(proto = getPrototypeOf(target))
      ? reflectGet(proto, propertyKey, receiver)
      : undefined;
  }
  function reflectSet(target, propertyKey, V/*, receiver*/){
    var receiver = arguments.length < 4 ? target : arguments[3]
      , ownDesc  = getOwnDescriptor(assertObject(target), propertyKey)
      , existingDescriptor, proto;
    if(!ownDesc){
      if(isObject(proto = getPrototypeOf(target))){
        return reflectSet(proto, propertyKey, V, receiver);
      }
      ownDesc = descriptor(0);
    }
    if(has(ownDesc, 'value')){
      if(ownDesc.writable === false || !isObject(receiver))return false;
      existingDescriptor = getOwnDescriptor(receiver, propertyKey) || descriptor(0);
      existingDescriptor.value = V;
      return defineProperty(receiver, propertyKey, existingDescriptor), true;
    }
    return ownDesc.set === undefined
      ? false
      : (ownDesc.set.call(receiver, V), true);
  }
  var isExtensible = Object.isExtensible || returnIt;
  
  var reflect = {
    // 26.1.1 Reflect.apply(target, thisArgument, argumentsList)
    apply: ctx(call, apply, 3),
    // 26.1.2 Reflect.construct(target, argumentsList [, newTarget])
    construct: function(target, argumentsList /*, newTarget*/){
      var proto    = assertFunction(arguments.length < 3 ? target : arguments[2])[PROTOTYPE]
        , instance = create(isObject(proto) ? proto : ObjectProto)
        , result   = apply.call(target, instance, argumentsList);
      return isObject(result) ? result : instance;
    },
    // 26.1.3 Reflect.defineProperty(target, propertyKey, attributes)
    defineProperty: wrap(defineProperty),
    // 26.1.4 Reflect.deleteProperty(target, propertyKey)
    deleteProperty: function(target, propertyKey){
      var desc = getOwnDescriptor(assertObject(target), propertyKey);
      return desc && !desc.configurable ? false : delete target[propertyKey];
    },
    // 26.1.5 Reflect.enumerate(target)
    enumerate: function(target){
      return new Enumerate(assertObject(target));
    },
    // 26.1.6 Reflect.get(target, propertyKey [, receiver])
    get: reflectGet,
    // 26.1.7 Reflect.getOwnPropertyDescriptor(target, propertyKey)
    getOwnPropertyDescriptor: function(target, propertyKey){
      return getOwnDescriptor(assertObject(target), propertyKey);
    },
    // 26.1.8 Reflect.getPrototypeOf(target)
    getPrototypeOf: function(target){
      return getPrototypeOf(assertObject(target));
    },
    // 26.1.9 Reflect.has(target, propertyKey)
    has: function(target, propertyKey){
      return propertyKey in target;
    },
    // 26.1.10 Reflect.isExtensible(target)
    isExtensible: function(target){
      return !!isExtensible(assertObject(target));
    },
    // 26.1.11 Reflect.ownKeys(target)
    ownKeys: ownKeys,
    // 26.1.12 Reflect.preventExtensions(target)
    preventExtensions: wrap(Object.preventExtensions || returnIt),
    // 26.1.13 Reflect.set(target, propertyKey, V [, receiver])
    set: reflectSet
  }
  // 26.1.14 Reflect.setPrototypeOf(target, proto)
  if(setPrototypeOf)reflect.setPrototypeOf = function(target, proto){
    return setPrototypeOf(assertObject(target), proto), true;
  };
  
  $define(GLOBAL, {Reflect: {}});
  $define(STATIC, 'Reflect', reflect);
}();

/******************************************************************************
 * Module : es7.proposals                                                     *
 ******************************************************************************/

!function(){
  $define(PROTO, ARRAY, {
    // https://github.com/domenic/Array.prototype.includes
    includes: createArrayContains(true)
  });
  $define(PROTO, STRING, {
    // https://github.com/mathiasbynens/String.prototype.at
    at: createPointAt(true)
  });
  
  function createObjectToArray(isEntries){
    return function(object){
      var O      = toObject(object)
        , keys   = getKeys(object)
        , length = keys.length
        , i      = 0
        , result = Array(length)
        , key;
      if(isEntries)while(length > i)result[i] = [key = keys[i++], O[key]];
      else while(length > i)result[i] = O[keys[i++]];
      return result;
    }
  }
  $define(STATIC, OBJECT, {
    // https://gist.github.com/WebReflection/9353781
    getOwnPropertyDescriptors: function(object){
      var O      = toObject(object)
        , result = {};
      forEach.call(ownKeys(O), function(key){
        defineProperty(result, key, descriptor(0, getOwnDescriptor(O, key)));
      });
      return result;
    },
    // https://github.com/rwaldron/tc39-notes/blob/master/es6/2014-04/apr-9.md#51-objectentries-objectvalues
    values:  createObjectToArray(false),
    entries: createObjectToArray(true)
  });
  $define(STATIC, REGEXP, {
    // https://gist.github.com/kangax/9698100
    escape: createReplacer(/([\\\-[\]{}()*+?.,^$|])/g, '\\$1', true)
  });
}();

/******************************************************************************
 * Module : es7.abstract-refs                                                 *
 ******************************************************************************/

// https://github.com/zenparsing/es-abstract-refs
!function(REFERENCE){
  REFERENCE_GET = getWellKnownSymbol(REFERENCE+'Get', true);
  var REFERENCE_SET = getWellKnownSymbol(REFERENCE+SET, true)
    , REFERENCE_DELETE = getWellKnownSymbol(REFERENCE+'Delete', true);
  
  $define(STATIC, SYMBOL, {
    referenceGet: REFERENCE_GET,
    referenceSet: REFERENCE_SET,
    referenceDelete: REFERENCE_DELETE
  });
  
  hidden(FunctionProto, REFERENCE_GET, returnThis);
  
  function setMapMethods(Constructor){
    if(Constructor){
      var MapProto = Constructor[PROTOTYPE];
      hidden(MapProto, REFERENCE_GET, MapProto.get);
      hidden(MapProto, REFERENCE_SET, MapProto.set);
      hidden(MapProto, REFERENCE_DELETE, MapProto['delete']);
    }
  }
  setMapMethods(Map);
  setMapMethods(WeakMap);
}('reference');

/******************************************************************************
 * Module : core.dict                                                         *
 ******************************************************************************/

!function(DICT){
  Dict = function(iterable){
    var dict = create(null);
    if(iterable != undefined){
      if(isIterable(iterable)){
        forOf(iterable, true, function(key, value){
          dict[key] = value;
        });
      } else assign(dict, iterable);
    }
    return dict;
  }
  Dict[PROTOTYPE] = null;
  
  function DictIterator(iterated, kind){
    set(this, ITER, {o: toObject(iterated), a: getKeys(iterated), i: 0, k: kind});
  }
  createIterator(DictIterator, DICT, function(){
    var iter = this[ITER]
      , O    = iter.o
      , keys = iter.a
      , kind = iter.k
      , key;
    do {
      if(iter.i >= keys.length){
        iter.o = undefined;
        return iterResult(1);
      }
    } while(!has(O, key = keys[iter.i++]));
    if(kind == KEY)  return iterResult(0, key);
    if(kind == VALUE)return iterResult(0, O[key]);
                     return iterResult(0, [key, O[key]]);
  });
  function createDictIter(kind){
    return function(it){
      return new DictIterator(it, kind);
    }
  }
  
  /*
   * 0 -> forEach
   * 1 -> map
   * 2 -> filter
   * 3 -> some
   * 4 -> every
   * 5 -> find
   * 6 -> findKey
   * 7 -> mapPairs
   */
  function createDictMethod(type){
    var isMap    = type == 1
      , isEvery  = type == 4;
    return function(object, callbackfn, that /* = undefined */){
      var f      = ctx(callbackfn, that, 3)
        , O      = toObject(object)
        , result = isMap || type == 7 || type == 2 ? new (generic(this, Dict)) : undefined
        , key, val, res;
      for(key in O)if(has(O, key)){
        val = O[key];
        res = f(val, key, object);
        if(type){
          if(isMap)result[key] = res;             // map
          else if(res)switch(type){
            case 2: result[key] = val; break      // filter
            case 3: return true;                  // some
            case 5: return val;                   // find
            case 6: return key;                   // findKey
            case 7: result[res[0]] = res[1];      // mapPairs
          } else if(isEvery)return false;         // every
        }
      }
      return type == 3 || isEvery ? isEvery : result;
    }
  }
  function createDictReduce(isTurn){
    return function(object, mapfn, init){
      assertFunction(mapfn);
      var O      = toObject(object)
        , keys   = getKeys(O)
        , length = keys.length
        , i      = 0
        , memo, key, result;
      if(isTurn)memo = init == undefined ? new (generic(this, Dict)) : Object(init);
      else if(arguments.length < 3){
        assert(length, REDUCE_ERROR);
        memo = O[keys[i++]];
      } else memo = Object(init);
      while(length > i)if(has(O, key = keys[i++])){
        result = mapfn(memo, O[key], key, object);
        if(isTurn){
          if(result === false)break;
        } else memo = result;
      }
      return memo;
    }
  }
  var findKey = createDictMethod(6);
  function includes(object, el){
    return (el == el ? keyOf(object, el) : findKey(object, sameNaN)) !== undefined;
  }
  
  var dictMethods = {
    keys:    createDictIter(KEY),
    values:  createDictIter(VALUE),
    entries: createDictIter(KEY+VALUE),
    forEach: createDictMethod(0),
    map:     createDictMethod(1),
    filter:  createDictMethod(2),
    some:    createDictMethod(3),
    every:   createDictMethod(4),
    find:    createDictMethod(5),
    findKey: findKey,
    mapPairs:createDictMethod(7),
    reduce:  createDictReduce(false),
    turn:    createDictReduce(true),
    keyOf:   keyOf,
    includes:includes,
    // Has / get / set own property
    has: has,
    get: get,
    set: createDefiner(0),
    isDict: function(it){
      return isObject(it) && getPrototypeOf(it) === Dict[PROTOTYPE];
    }
  };
  
  if(REFERENCE_GET)for(var key in dictMethods)!function(fn){
    function method(){
      for(var args = [this], i = 0; i < arguments.length;)args.push(arguments[i++]);
      return invoke(fn, args);
    }
    fn[REFERENCE_GET] = function(){
      return method;
    }
  }(dictMethods[key]);
  
  $define(GLOBAL + FORCED, {Dict: assignHidden(Dict, dictMethods)});
}('Dict');

/******************************************************************************
 * Module : core.$for                                                         *
 ******************************************************************************/

!function(ENTRIES, FN){  
  function $for(iterable, entries){
    if(!(this instanceof $for))return new $for(iterable, entries);
    this[ITER]    = getIterator(iterable);
    this[ENTRIES] = !!entries;
  }
  
  createIterator($for, 'Wrapper', function(){
    return this[ITER].next();
  });
  var $forProto = $for[PROTOTYPE];
  setIterator($forProto, function(){
    return this[ITER]; // unwrap
  });
  
  function createChainIterator(next){
    function Iter(I, fn, that){
      this[ITER]    = getIterator(I);
      this[ENTRIES] = I[ENTRIES];
      this[FN]      = ctx(fn, that, I[ENTRIES] ? 2 : 1);
    }
    createIterator(Iter, 'Chain', next, $forProto);
    setIterator(Iter[PROTOTYPE], returnThis); // override $forProto iterator
    return Iter;
  }
  
  var MapIter = createChainIterator(function(){
    var step = this[ITER].next();
    return step.done ? step : iterResult(0, stepCall(this[FN], step.value, this[ENTRIES]));
  });
  
  var FilterIter = createChainIterator(function(){
    for(;;){
      var step = this[ITER].next();
      if(step.done || stepCall(this[FN], step.value, this[ENTRIES]))return step;
    }
  });
  
  assignHidden($forProto, {
    of: function(fn, that){
      forOf(this, this[ENTRIES], fn, that);
    },
    array: function(fn, that){
      var result = [];
      forOf(fn != undefined ? this.map(fn, that) : this, false, push, result);
      return result;
    },
    filter: function(fn, that){
      return new FilterIter(this, fn, that);
    },
    map: function(fn, that){
      return new MapIter(this, fn, that);
    }
  });
  
  $for.isIterable  = isIterable;
  $for.getIterator = getIterator;
  
  $define(GLOBAL + FORCED, {$for: $for});
}('entries', safeSymbol('fn'));

/******************************************************************************
 * Module : core.delay                                                        *
 ******************************************************************************/

// https://esdiscuss.org/topic/promise-returning-delay-function
$define(GLOBAL + FORCED, {
  delay: function(time){
    return new Promise(function(resolve){
      setTimeout(resolve, time, true);
    });
  }
});

/******************************************************************************
 * Module : core.binding                                                      *
 ******************************************************************************/

!function(_, toLocaleString){
  // Placeholder
  core._ = path._ = path._ || {};

  $define(PROTO + FORCED, FUNCTION, {
    part: part,
    only: function(numberArguments, that /* = @ */){
      var fn     = assertFunction(this)
        , n      = toLength(numberArguments)
        , isThat = arguments.length > 1;
      return function(/* ...args */){
        var length = min(n, arguments.length)
          , args   = Array(length)
          , i      = 0;
        while(length > i)args[i] = arguments[i++];
        return invoke(fn, args, isThat ? that : this);
      }
    }
  });
  
  function tie(key){
    var that  = this
      , bound = {};
    return hidden(that, _, function(key){
      if(key === undefined || !(key in that))return toLocaleString.call(that);
      return has(bound, key) ? bound[key] : (bound[key] = ctx(that[key], that, -1));
    })[_](key);
  }
  
  hidden(path._, TO_STRING, function(){
    return _;
  });
  
  hidden(ObjectProto, _, tie);
  DESC || hidden(ArrayProto, _, tie);
  // IE8- dirty hack - redefined toLocaleString is not enumerable
}(DESC ? uid('tie') : TO_LOCALE, ObjectProto[TO_LOCALE]);

/******************************************************************************
 * Module : core.object                                                       *
 ******************************************************************************/

!function(){
  function define(target, mixin){
    var keys   = ownKeys(toObject(mixin))
      , length = keys.length
      , i = 0, key;
    while(length > i)defineProperty(target, key = keys[i++], getOwnDescriptor(mixin, key));
    return target;
  };
  $define(STATIC + FORCED, OBJECT, {
    isObject: isObject,
    classof: classof,
    define: define,
    make: function(proto, mixin){
      return define(create(proto), mixin);
    }
  });
}();

/******************************************************************************
 * Module : core.array                                                        *
 ******************************************************************************/

$define(PROTO + FORCED, ARRAY, {
  turn: function(fn, target /* = [] */){
    assertFunction(fn);
    var memo   = target == undefined ? [] : Object(target)
      , O      = ES5Object(this)
      , length = toLength(O.length)
      , index  = 0;
    while(length > index)if(fn(memo, O[index], index++, this) === false)break;
    return memo;
  }
});
if(framework)ArrayUnscopables.turn = true;

/******************************************************************************
 * Module : core.number                                                       *
 ******************************************************************************/

!function(numberMethods){  
  function NumberIterator(iterated){
    set(this, ITER, {l: toLength(iterated), i: 0});
  }
  createIterator(NumberIterator, NUMBER, function(){
    var iter = this[ITER]
      , i    = iter.i++;
    return i < iter.l ? iterResult(0, i) : iterResult(1);
  });
  defineIterator(Number, NUMBER, function(){
    return new NumberIterator(this);
  });
  
  numberMethods.random = function(lim /* = 0 */){
    var a = +this
      , b = lim == undefined ? 0 : +lim
      , m = min(a, b);
    return random() * (max(a, b) - m) + m;
  };

  forEach.call(array(
      // ES3:
      'round,floor,ceil,abs,sin,asin,cos,acos,tan,atan,exp,sqrt,max,min,pow,atan2,' +
      // ES6:
      'acosh,asinh,atanh,cbrt,clz32,cosh,expm1,hypot,imul,log1p,log10,log2,sign,sinh,tanh,trunc'
    ), function(key){
      var fn = Math[key];
      if(fn)numberMethods[key] = function(/* ...args */){
        // ie9- dont support strict mode & convert `this` to object -> convert it to number
        var args = [+this]
          , i    = 0;
        while(arguments.length > i)args.push(arguments[i++]);
        return invoke(fn, args);
      }
    }
  );
  
  $define(PROTO + FORCED, NUMBER, numberMethods);
}({});

/******************************************************************************
 * Module : core.string                                                       *
 ******************************************************************************/

!function(){
  var escapeHTMLDict = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  }, unescapeHTMLDict = {}, key;
  for(key in escapeHTMLDict)unescapeHTMLDict[escapeHTMLDict[key]] = key;
  $define(PROTO + FORCED, STRING, {
    escapeHTML:   createReplacer(/[&<>"']/g, escapeHTMLDict),
    unescapeHTML: createReplacer(/&(?:amp|lt|gt|quot|apos);/g, unescapeHTMLDict)
  });
}();

/******************************************************************************
 * Module : core.date                                                         *
 ******************************************************************************/

!function(formatRegExp, flexioRegExp, locales, current, SECONDS, MINUTES, HOURS, MONTH, YEAR){
  function createFormat(prefix){
    return function(template, locale /* = current */){
      var that = this
        , dict = locales[has(locales, locale) ? locale : current];
      function get(unit){
        return that[prefix + unit]();
      }
      return String(template).replace(formatRegExp, function(part){
        switch(part){
          case 's'  : return get(SECONDS);                  // Seconds : 0-59
          case 'ss' : return lz(get(SECONDS));              // Seconds : 00-59
          case 'm'  : return get(MINUTES);                  // Minutes : 0-59
          case 'mm' : return lz(get(MINUTES));              // Minutes : 00-59
          case 'h'  : return get(HOURS);                    // Hours   : 0-23
          case 'hh' : return lz(get(HOURS));                // Hours   : 00-23
          case 'D'  : return get(DATE);                     // Date    : 1-31
          case 'DD' : return lz(get(DATE));                 // Date    : 01-31
          case 'W'  : return dict[0][get('Day')];           // Day     : Понедельник
          case 'N'  : return get(MONTH) + 1;                // Month   : 1-12
          case 'NN' : return lz(get(MONTH) + 1);            // Month   : 01-12
          case 'M'  : return dict[2][get(MONTH)];           // Month   : Январь
          case 'MM' : return dict[1][get(MONTH)];           // Month   : Января
          case 'Y'  : return get(YEAR);                     // Year    : 2014
          case 'YY' : return lz(get(YEAR) % 100);           // Year    : 14
        } return part;
      });
    }
  }
  function addLocale(lang, locale){
    function split(index){
      var result = [];
      forEach.call(array(locale.months), function(it){
        result.push(it.replace(flexioRegExp, '$' + index));
      });
      return result;
    }
    locales[lang] = [array(locale.weekdays), split(1), split(2)];
    return core;
  }
  $define(PROTO + FORCED, DATE, {
    format:    createFormat('get'),
    formatUTC: createFormat('getUTC')
  });
  addLocale(current, {
    weekdays: 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
    months: 'January,February,March,April,May,June,July,August,September,October,November,December'
  });
  addLocale('ru', {
    weekdays: 'Воскресенье,Понедельник,Вторник,Среда,Четверг,Пятница,Суббота',
    months: 'Январ:я|ь,Феврал:я|ь,Март:а|,Апрел:я|ь,Ма:я|й,Июн:я|ь,' +
            'Июл:я|ь,Август:а|,Сентябр:я|ь,Октябр:я|ь,Ноябр:я|ь,Декабр:я|ь'
  });
  core.locale = function(locale){
    return has(locales, locale) ? current = locale : current;
  };
  core.addLocale = addLocale;
}(/\b\w\w?\b/g, /:(.*)\|(.*)$/, {}, 'en', 'Seconds', 'Minutes', 'Hours', 'Month', 'FullYear');

/******************************************************************************
 * Module : core.global                                                       *
 ******************************************************************************/

$define(GLOBAL + FORCED, {global: global});

/******************************************************************************
 * Module : js.array.statics                                                  *
 ******************************************************************************/

// JavaScript 1.6 / Strawman array statics shim
!function(arrayStatics){
  function setArrayStatics(keys, length){
    forEach.call(array(keys), function(key){
      if(key in ArrayProto)arrayStatics[key] = ctx(call, ArrayProto[key], length);
    });
  }
  setArrayStatics('pop,reverse,shift,keys,values,entries', 1);
  setArrayStatics('indexOf,every,some,forEach,map,filter,find,findIndex,includes', 3);
  setArrayStatics('join,slice,concat,push,splice,unshift,sort,lastIndexOf,' +
                  'reduce,reduceRight,copyWithin,fill,turn');
  $define(STATIC, ARRAY, arrayStatics);
}({});

/******************************************************************************
 * Module : web.dom.itarable                                                  *
 ******************************************************************************/

!function(NodeList){
  if(framework && NodeList && !(SYMBOL_ITERATOR in NodeList[PROTOTYPE])){
    hidden(NodeList[PROTOTYPE], SYMBOL_ITERATOR, Iterators[ARRAY]);
  }
  Iterators.NodeList = Iterators[ARRAY];
}(global.NodeList);

/******************************************************************************
 * Module : core.log                                                          *
 ******************************************************************************/

!function(log, enabled){
  // Methods from https://github.com/DeveloperToolsWG/console-object/blob/master/api.md
  forEach.call(array('assert,clear,count,debug,dir,dirxml,error,exception,' +
      'group,groupCollapsed,groupEnd,info,isIndependentlyComposed,log,' +
      'markTimeline,profile,profileEnd,table,time,timeEnd,timeline,' +
      'timelineEnd,timeStamp,trace,warn'), function(key){
    log[key] = function(){
      if(enabled && key in console)return apply.call(console[key], console, arguments);
    };
  });
  $define(GLOBAL + FORCED, {log: assign(log.log, log, {
    enable: function(){
      enabled = true;
    },
    disable: function(){
      enabled = false;
    }
  })});
}({}, true);
}(typeof self != 'undefined' && self.Math === Math ? self : Function('return this')(), false);
module.exports = { "default": module.exports, __esModule: true };

},{}],16:[function(require,module,exports){
"use strict";

exports["default"] = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

exports.__esModule = true;
},{}],17:[function(require,module,exports){
"use strict";

exports["default"] = (function () {
  function defineProperties(target, props) {
    for (var key in props) {
      var prop = props[key];
      prop.configurable = true;
      if (prop.value) prop.writable = true;
    }

    Object.defineProperties(target, props);
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

exports.__esModule = true;
},{}],18:[function(require,module,exports){
"use strict";

var _core = require("babel-runtime/core-js")["default"];

exports["default"] = function get(_x, _x2, _x3) {
  var _again = true;

  _function: while (_again) {
    _again = false;
    var object = _x,
        property = _x2,
        receiver = _x3;
    desc = parent = getter = undefined;

    var desc = _core.Object.getOwnPropertyDescriptor(object, property);

    if (desc === undefined) {
      var parent = _core.Object.getPrototypeOf(object);

      if (parent === null) {
        return undefined;
      } else {
        _x = parent;
        _x2 = property;
        _x3 = receiver;
        _again = true;
        continue _function;
      }
    } else if ("value" in desc && desc.writable) {
      return desc.value;
    } else {
      var getter = desc.get;

      if (getter === undefined) {
        return undefined;
      }

      return getter.call(receiver);
    }
  }
};

exports.__esModule = true;
},{"babel-runtime/core-js":15}],19:[function(require,module,exports){
"use strict";

exports["default"] = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) subClass.__proto__ = superClass;
};

exports.__esModule = true;
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3YXZlcy1hdWRpby5qcyIsImVzNi91dGlscy9wcmlvcml0eS1xdWV1ZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9oZWxwZXJzL2NsYXNzLWNhbGwtY2hlY2suanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9oZWxwZXJzL2NyZWF0ZS1jbGFzcy5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2hlbHBlcnMvZ2V0LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbmhlcml0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN1QkEsQUFBQyxDQUFBLFVBQVUsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7QUFDaEMsY0FBWSxDQUFDOztBQUViLFdBQVMsWUFBWSxDQUFDLEtBQUssRUFBRTtBQUMzQixRQUFJLENBQUMsS0FBSzs7QUFDUixhQUFPO0tBQUEsQUFDVCxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFDeEIsS0FBSyxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQUM7R0FDdEQ7O0FBRUQsTUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLG9CQUFvQixDQUFDLElBQzNDLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsRUFB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QUFNeEMsUUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQzs7Ozs7O0FBTXhDLFFBQUksQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWEsSUFBSSxDQUFDLENBQUcsQ0FBQyxDQUFDOzs7Ozs7QUFNcEQsUUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsV0FBVyxJQUFJLENBQUMsQ0FBQzs7Ozs7O0FBTTVDLFFBQUksQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWEsSUFBSSxDQUFDLENBQUcsQ0FBQyxDQUFDOzs7Ozs7QUFNcEQsUUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsV0FBVyxJQUFJLENBQUMsQ0FBQzs7Ozs7O0FBTTVDLFFBQUksQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUM7Ozs7Ozs7OztBQVM1QyxRQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFHLENBQUMsQ0FBQzs7Ozs7O0FBTWhELFFBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsSUFBSSxDQUFDLEtBQUssQ0FBQzs7Ozs7O0FBTTdDLFFBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUM7Ozs7OztBQU14QyxRQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDOzs7Ozs7QUFNcEMsUUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQzs7Ozs7O0FBTTVDLFFBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUM7Ozs7OztBQU14QyxRQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDOzs7Ozs7QUFNOUMsUUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQzs7Ozs7O0FBTTFDLFFB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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3B5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIHdhdmVzQXVkaW8gPSB7XG4gIC8vIGNvcmVcbiAgYXVkaW9Db250ZXh0OiByZXF1aXJlKCcuL2Rpc3QvY29yZS9hdWRpby1jb250ZXh0JyksXG4gIFRpbWVFbmdpbmU6IHJlcXVpcmUoJy4vZGlzdC9jb3JlL3RpbWUtZW5naW5lJyksXG4gIC8vIGVuZ2luZXNcbiAgR3JhbnVsYXJFbmdpbmU6IHJlcXVpcmUoJy4vZGlzdC9lbmdpbmVzL2dyYW51bGFyLWVuZ2luZScpLFxuICBNZXRyb25vbWU6IHJlcXVpcmUoJy4vZGlzdC9lbmdpbmVzL21ldHJvbm9tZScpLFxuICBQbGF5ZXJFbmdpbmU6IHJlcXVpcmUoJy4vZGlzdC9lbmdpbmVzL3BsYXllci1lbmdpbmUnKSxcbiAgU2VnbWVudEVuZ2luZTogcmVxdWlyZSgnLi9kaXN0L2VuZ2luZXMvc2VnbWVudC1lbmdpbmUnKSxcbiAgLy8gbWFzdGVyc1xuICBQbGF5Q29udHJvbDogcmVxdWlyZSgnLi9kaXN0L21hc3RlcnMvcGxheS1jb250cm9sJyksXG4gIFRyYW5zcG9ydDogcmVxdWlyZSgnLi9kaXN0L21hc3RlcnMvdHJhbnNwb3J0JyksXG4gIC8vIGV4cG9zZSB0aGVzZSA/XG4gIFNjaGVkdWxlcjogcmVxdWlyZSgnLi9kaXN0L21hc3RlcnMvc2NoZWR1bGVyJyksXG4gIFNpbXBsZVNjaGVkdWxlcjogcmVxdWlyZSgnLi9kaXN0L21hc3RlcnMvc2ltcGxlLXNjaGVkdWxlcicpLFxuICAvLyB1dGlsc1xuICBQcmlvcml0eVF1ZXVlOiByZXF1aXJlKCcuL2Rpc3QvdXRpbHMvcHJpb3JpdHktcXVldWUnKSxcbiAgLy8gZmFjdG9yaWVzXG4gIGdldFNjaGVkdWxlcjogcmVxdWlyZSgnLi9kaXN0L21hc3RlcnMvZmFjdG9yaWVzJykuZ2V0U2NoZWR1bGVyLFxuICBnZXRTaW1wbGVTY2hlZHVsZXI6IHJlcXVpcmUoJy4vZGlzdC9tYXN0ZXJzL2ZhY3RvcmllcycpLmdldFNpbXBsZVNjaGVkdWxlclxufTtcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gd2F2ZXNBdWRpbzsiLCIvKiB3cml0dGVuIGluIEVDTUFzY3JpcHQgNiAqL1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFdBVkUgYXVkaW8gcHJpb3JpdHkgcXVldWUgdXNlZCBieSBzY2hlZHVsZXIgYW5kIHRyYW5zcG9ydHNcbiAqIEBhdXRob3IgTm9yYmVydCBTY2huZWxsIDxOb3JiZXJ0LlNjaG5lbGxAaXJjYW0uZnI+XG4gKlxuICogRmlyc3QgcmF0aGVyIHN0dXBpZCBpbXBsZW1lbnRhdGlvbiB0byBiZSBvcHRpbWl6ZWQuLi5cbiAqL1xuXG5jbGFzcyBQcmlvcml0eVF1ZXVlIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9fb2JqZWN0cyA9IFtdO1xuICAgIHRoaXMucmV2ZXJzZSA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqICBHZXQgdGhlIGluZGV4IG9mIGFuIG9iamVjdCBpbiB0aGUgb2JqZWN0IGxpc3RcbiAgICovXG4gIF9fb2JqZWN0SW5kZXgob2JqZWN0KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9fb2JqZWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKG9iamVjdCA9PT0gdGhpcy5fX29iamVjdHNbaV1bMF0pIHtcbiAgICAgICAgcmV0dXJuIGk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gIC8qKiBcbiAgICogV2l0aGRyYXcgYW4gb2JqZWN0IGZyb20gdGhlIG9iamVjdCBsaXN0XG4gICAqL1xuICBfX3JlbW92ZU9iamVjdChvYmplY3QpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLl9fb2JqZWN0SW5kZXgob2JqZWN0KTtcblxuICAgIGlmIChpbmRleCA+PSAwKVxuICAgICAgdGhpcy5fX29iamVjdHMuc3BsaWNlKGluZGV4LCAxKTtcblxuICAgIGlmICh0aGlzLl9fb2JqZWN0cy5sZW5ndGggPiAwKVxuICAgICAgcmV0dXJuIHRoaXMuX19vYmplY3RzWzBdWzFdOyAvLyByZXR1cm4gdGltZSBvZiBmaXJzdCBvYmplY3RcblxuICAgIHJldHVybiBJbmZpbml0eTtcbiAgfVxuXG4gIF9fc29ydE9iamVjdHMoKSB7XG4gICAgaWYgKCF0aGlzLnJldmVyc2UpXG4gICAgICB0aGlzLl9fb2JqZWN0cy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGFbMV0gLSBiWzFdO1xuICAgICAgfSk7XG4gICAgZWxzZVxuICAgICAgdGhpcy5fX29iamVjdHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIHJldHVybiBiWzFdIC0gYVsxXTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluc2VydCBhbiBvYmplY3QgdG8gdGhlIHF1ZXVlXG4gICAqIChmb3IgdGhpcyBwcmltaXRpdmUgdmVyc2lvbjogcHJldmVudCBzb3J0aW5nIGZvciBlYWNoIGVsZW1lbnQgYnkgY2FsbGluZyB3aXRoIFwiZmFsc2VcIiBhcyB0aGlyZCBhcmd1bWVudClcbiAgICovXG4gIGluc2VydChvYmplY3QsIHRpbWUsIHNvcnQgPSB0cnVlKSB7XG4gICAgaWYgKHRpbWUgIT09IEluZmluaXR5ICYmIHRpbWUgIT0gLUluZmluaXR5KSB7XG4gICAgICAvLyBhZGQgbmV3IG9iamVjdFxuICAgICAgdGhpcy5fX29iamVjdHMucHVzaChbb2JqZWN0LCB0aW1lXSk7XG5cbiAgICAgIGlmIChzb3J0KVxuICAgICAgICB0aGlzLl9fc29ydE9iamVjdHMoKTtcblxuICAgICAgcmV0dXJuIHRoaXMuX19vYmplY3RzWzBdWzFdOyAvLyByZXR1cm4gdGltZSBvZiBmaXJzdCBvYmplY3RcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fX3JlbW92ZU9iamVjdChvYmplY3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1vdmUgYW4gb2JqZWN0IHRvIGFub3RoZXIgdGltZSBpbiB0aGUgcXVldWVcbiAgICovXG4gIG1vdmUob2JqZWN0LCB0aW1lKSB7XG4gICAgaWYgKHRpbWUgIT09IEluZmluaXR5ICYmIHRpbWUgIT0gLUluZmluaXR5KSB7XG4gICAgICBcbiAgICAgIHZhciBpbmRleCA9IHRoaXMuX19vYmplY3RJbmRleChvYmplY3QpO1xuXG4gICAgICBpZiAoaW5kZXggPCAwKVxuICAgICAgICB0aGlzLl9fb2JqZWN0cy5wdXNoKFtvYmplY3QsIHRpbWVdKTsgLy8gYWRkIG5ldyBvYmplY3RcbiAgICAgIGVsc2VcbiAgICAgICAgdGhpcy5fX29iamVjdHNbaW5kZXhdWzFdID0gdGltZTsgLy8gdXBkYXRlIHRpbWUgb2YgZXhpc3Rpbmcgb2JqZWN0XG5cbiAgICAgIHRoaXMuX19zb3J0T2JqZWN0cygpO1xuXG4gICAgICByZXR1cm4gdGhpcy5fX29iamVjdHNbMF1bMV07IC8vIHJldHVybiB0aW1lIG9mIGZpcnN0IG9iamVjdFxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9fcmVtb3ZlT2JqZWN0KG9iamVjdCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIG9iamVjdCBmcm9tIHRoZSBxdWV1ZVxuICAgKi9cbiAgcmVtb3ZlKG9iamVjdCkge1xuICAgIHJldHVybiB0aGlzLl9fcmVtb3ZlT2JqZWN0KG9iamVjdCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXIgcXVldWVcbiAgICovXG4gIGNsZWFyKCkge1xuICAgIHRoaXMuX19vYmplY3RzLmxlbmd0aCA9IDA7IC8vIGNsZWFyIG9iamVjdCBsaXN0XG4gICAgcmV0dXJuIEluZmluaXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBmaXJzdCBvYmplY3QgaW4gcXVldWVcbiAgICovXG4gIGdldCBoZWFkKCkge1xuICAgIGlmICh0aGlzLl9fb2JqZWN0cy5sZW5ndGggPiAwKVxuICAgICAgcmV0dXJuIHRoaXMuX19vYmplY3RzWzBdWzBdO1xuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRpbWUgb2YgZmlyc3Qgb2JqZWN0IGluIHF1ZXVlXG4gICAqL1xuICBnZXQgdGltZSgpIHtcbiAgICBpZiAodGhpcy5fX29iamVjdHMubGVuZ3RoID4gMClcbiAgICAgIHJldHVybiB0aGlzLl9fb2JqZWN0c1swXVsxXTtcblxuICAgIHJldHVybiBJbmZpbml0eTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByaW9yaXR5UXVldWU7XG4iLCIvKipcbiAqIENvcmUuanMgMC42LjFcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS96bG9pcm9jay9jb3JlLWpzXG4gKiBMaWNlbnNlOiBodHRwOi8vcm9jay5taXQtbGljZW5zZS5vcmdcbiAqIMKpIDIwMTUgRGVuaXMgUHVzaGthcmV2XG4gKi9cbiFmdW5jdGlvbihnbG9iYWwsIGZyYW1ld29yaywgdW5kZWZpbmVkKXtcbid1c2Ugc3RyaWN0JztcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogTW9kdWxlIDogY29tbW9uICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvLyBTaG9ydGN1dHMgZm9yIFtbQ2xhc3NdXSAmIHByb3BlcnR5IG5hbWVzXHJcbnZhciBPQkpFQ1QgICAgICAgICAgPSAnT2JqZWN0J1xyXG4gICwgRlVOQ1RJT04gICAgICAgID0gJ0Z1bmN0aW9uJ1xyXG4gICwgQVJSQVkgICAgICAgICAgID0gJ0FycmF5J1xyXG4gICwgU1RSSU5HICAgICAgICAgID0gJ1N0cmluZydcclxuICAsIE5VTUJFUiAgICAgICAgICA9ICdOdW1iZXInXHJcbiAgLCBSRUdFWFAgICAgICAgICAgPSAnUmVnRXhwJ1xyXG4gICwgREFURSAgICAgICAgICAgID0gJ0RhdGUnXHJcbiAgLCBNQVAgICAgICAgICAgICAgPSAnTWFwJ1xyXG4gICwgU0VUICAgICAgICAgICAgID0gJ1NldCdcclxuICAsIFdFQUtNQVAgICAgICAgICA9ICdXZWFrTWFwJ1xyXG4gICwgV0VBS1NFVCAgICAgICAgID0gJ1dlYWtTZXQnXHJcbiAgLCBTWU1CT0wgICAgICAgICAgPSAnU3ltYm9sJ1xyXG4gICwgUFJPTUlTRSAgICAgICAgID0gJ1Byb21pc2UnXHJcbiAgLCBNQVRIICAgICAgICAgICAgPSAnTWF0aCdcclxuICAsIEFSR1VNRU5UUyAgICAgICA9ICdBcmd1bWVudHMnXHJcbiAgLCBQUk9UT1RZUEUgICAgICAgPSAncHJvdG90eXBlJ1xyXG4gICwgQ09OU1RSVUNUT1IgICAgID0gJ2NvbnN0cnVjdG9yJ1xyXG4gICwgVE9fU1RSSU5HICAgICAgID0gJ3RvU3RyaW5nJ1xyXG4gICwgVE9fU1RSSU5HX1RBRyAgID0gVE9fU1RSSU5HICsgJ1RhZydcclxuICAsIFRPX0xPQ0FMRSAgICAgICA9ICd0b0xvY2FsZVN0cmluZydcclxuICAsIEhBU19PV04gICAgICAgICA9ICdoYXNPd25Qcm9wZXJ0eSdcclxuICAsIEZPUl9FQUNIICAgICAgICA9ICdmb3JFYWNoJ1xyXG4gICwgSVRFUkFUT1IgICAgICAgID0gJ2l0ZXJhdG9yJ1xyXG4gICwgRkZfSVRFUkFUT1IgICAgID0gJ0BAJyArIElURVJBVE9SXHJcbiAgLCBQUk9DRVNTICAgICAgICAgPSAncHJvY2VzcydcclxuICAsIENSRUFURV9FTEVNRU5UICA9ICdjcmVhdGVFbGVtZW50J1xyXG4gIC8vIEFsaWFzZXMgZ2xvYmFsIG9iamVjdHMgYW5kIHByb3RvdHlwZXNcclxuICAsIEZ1bmN0aW9uICAgICAgICA9IGdsb2JhbFtGVU5DVElPTl1cclxuICAsIE9iamVjdCAgICAgICAgICA9IGdsb2JhbFtPQkpFQ1RdXHJcbiAgLCBBcnJheSAgICAgICAgICAgPSBnbG9iYWxbQVJSQVldXHJcbiAgLCBTdHJpbmcgICAgICAgICAgPSBnbG9iYWxbU1RSSU5HXVxyXG4gICwgTnVtYmVyICAgICAgICAgID0gZ2xvYmFsW05VTUJFUl1cclxuICAsIFJlZ0V4cCAgICAgICAgICA9IGdsb2JhbFtSRUdFWFBdXHJcbiAgLCBEYXRlICAgICAgICAgICAgPSBnbG9iYWxbREFURV1cclxuICAsIE1hcCAgICAgICAgICAgICA9IGdsb2JhbFtNQVBdXHJcbiAgLCBTZXQgICAgICAgICAgICAgPSBnbG9iYWxbU0VUXVxyXG4gICwgV2Vha01hcCAgICAgICAgID0gZ2xvYmFsW1dFQUtNQVBdXHJcbiAgLCBXZWFrU2V0ICAgICAgICAgPSBnbG9iYWxbV0VBS1NFVF1cclxuICAsIFN5bWJvbCAgICAgICAgICA9IGdsb2JhbFtTWU1CT0xdXHJcbiAgLCBNYXRoICAgICAgICAgICAgPSBnbG9iYWxbTUFUSF1cclxuICAsIFR5cGVFcnJvciAgICAgICA9IGdsb2JhbC5UeXBlRXJyb3JcclxuICAsIFJhbmdlRXJyb3IgICAgICA9IGdsb2JhbC5SYW5nZUVycm9yXHJcbiAgLCBzZXRUaW1lb3V0ICAgICAgPSBnbG9iYWwuc2V0VGltZW91dFxyXG4gICwgc2V0SW1tZWRpYXRlICAgID0gZ2xvYmFsLnNldEltbWVkaWF0ZVxyXG4gICwgY2xlYXJJbW1lZGlhdGUgID0gZ2xvYmFsLmNsZWFySW1tZWRpYXRlXHJcbiAgLCBwYXJzZUludCAgICAgICAgPSBnbG9iYWwucGFyc2VJbnRcclxuICAsIGlzRmluaXRlICAgICAgICA9IGdsb2JhbC5pc0Zpbml0ZVxyXG4gICwgcHJvY2VzcyAgICAgICAgID0gZ2xvYmFsW1BST0NFU1NdXHJcbiAgLCBuZXh0VGljayAgICAgICAgPSBwcm9jZXNzICYmIHByb2Nlc3MubmV4dFRpY2tcclxuICAsIGRvY3VtZW50ICAgICAgICA9IGdsb2JhbC5kb2N1bWVudFxyXG4gICwgaHRtbCAgICAgICAgICAgID0gZG9jdW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50XHJcbiAgLCBuYXZpZ2F0b3IgICAgICAgPSBnbG9iYWwubmF2aWdhdG9yXHJcbiAgLCBkZWZpbmUgICAgICAgICAgPSBnbG9iYWwuZGVmaW5lXHJcbiAgLCBjb25zb2xlICAgICAgICAgPSBnbG9iYWwuY29uc29sZSB8fCB7fVxyXG4gICwgQXJyYXlQcm90byAgICAgID0gQXJyYXlbUFJPVE9UWVBFXVxyXG4gICwgT2JqZWN0UHJvdG8gICAgID0gT2JqZWN0W1BST1RPVFlQRV1cclxuICAsIEZ1bmN0aW9uUHJvdG8gICA9IEZ1bmN0aW9uW1BST1RPVFlQRV1cclxuICAsIEluZmluaXR5ICAgICAgICA9IDEgLyAwXHJcbiAgLCBET1QgICAgICAgICAgICAgPSAnLic7XHJcblxyXG4vLyBodHRwOi8vanNwZXJmLmNvbS9jb3JlLWpzLWlzb2JqZWN0XHJcbmZ1bmN0aW9uIGlzT2JqZWN0KGl0KXtcclxuICByZXR1cm4gaXQgIT09IG51bGwgJiYgKHR5cGVvZiBpdCA9PSAnb2JqZWN0JyB8fCB0eXBlb2YgaXQgPT0gJ2Z1bmN0aW9uJyk7XHJcbn1cclxuZnVuY3Rpb24gaXNGdW5jdGlvbihpdCl7XHJcbiAgcmV0dXJuIHR5cGVvZiBpdCA9PSAnZnVuY3Rpb24nO1xyXG59XHJcbi8vIE5hdGl2ZSBmdW5jdGlvbj9cclxudmFyIGlzTmF0aXZlID0gY3R4KC8uLy50ZXN0LCAvXFxbbmF0aXZlIGNvZGVcXF1cXHMqXFx9XFxzKiQvLCAxKTtcclxuXHJcbi8vIE9iamVjdCBpbnRlcm5hbCBbW0NsYXNzXV0gb3IgdG9TdHJpbmdUYWdcclxuLy8gaHR0cDovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZ1xyXG52YXIgdG9TdHJpbmcgPSBPYmplY3RQcm90b1tUT19TVFJJTkddO1xyXG5mdW5jdGlvbiBzZXRUb1N0cmluZ1RhZyhpdCwgdGFnLCBzdGF0KXtcclxuICBpZihpdCAmJiAhaGFzKGl0ID0gc3RhdCA/IGl0IDogaXRbUFJPVE9UWVBFXSwgU1lNQk9MX1RBRykpaGlkZGVuKGl0LCBTWU1CT0xfVEFHLCB0YWcpO1xyXG59XHJcbmZ1bmN0aW9uIGNvZihpdCl7XHJcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwoaXQpLnNsaWNlKDgsIC0xKTtcclxufVxyXG5mdW5jdGlvbiBjbGFzc29mKGl0KXtcclxuICB2YXIgTywgVDtcclxuICByZXR1cm4gaXQgPT0gdW5kZWZpbmVkID8gaXQgPT09IHVuZGVmaW5lZCA/ICdVbmRlZmluZWQnIDogJ051bGwnXHJcbiAgICA6IHR5cGVvZiAoVCA9IChPID0gT2JqZWN0KGl0KSlbU1lNQk9MX1RBR10pID09ICdzdHJpbmcnID8gVCA6IGNvZihPKTtcclxufVxyXG5cclxuLy8gRnVuY3Rpb25cclxudmFyIGNhbGwgID0gRnVuY3Rpb25Qcm90by5jYWxsXHJcbiAgLCBhcHBseSA9IEZ1bmN0aW9uUHJvdG8uYXBwbHlcclxuICAsIFJFRkVSRU5DRV9HRVQ7XHJcbi8vIFBhcnRpYWwgYXBwbHlcclxuZnVuY3Rpb24gcGFydCgvKiAuLi5hcmdzICovKXtcclxuICB2YXIgZm4gICAgID0gYXNzZXJ0RnVuY3Rpb24odGhpcylcclxuICAgICwgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aFxyXG4gICAgLCBhcmdzICAgPSBBcnJheShsZW5ndGgpXHJcbiAgICAsIGkgICAgICA9IDBcclxuICAgICwgXyAgICAgID0gcGF0aC5fXHJcbiAgICAsIGhvbGRlciA9IGZhbHNlO1xyXG4gIHdoaWxlKGxlbmd0aCA+IGkpaWYoKGFyZ3NbaV0gPSBhcmd1bWVudHNbaSsrXSkgPT09IF8paG9sZGVyID0gdHJ1ZTtcclxuICByZXR1cm4gZnVuY3Rpb24oLyogLi4uYXJncyAqLyl7XHJcbiAgICB2YXIgdGhhdCAgICA9IHRoaXNcclxuICAgICAgLCBfbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aFxyXG4gICAgICAsIGkgPSAwLCBqID0gMCwgX2FyZ3M7XHJcbiAgICBpZighaG9sZGVyICYmICFfbGVuZ3RoKXJldHVybiBpbnZva2UoZm4sIGFyZ3MsIHRoYXQpO1xyXG4gICAgX2FyZ3MgPSBhcmdzLnNsaWNlKCk7XHJcbiAgICBpZihob2xkZXIpZm9yKDtsZW5ndGggPiBpOyBpKyspaWYoX2FyZ3NbaV0gPT09IF8pX2FyZ3NbaV0gPSBhcmd1bWVudHNbaisrXTtcclxuICAgIHdoaWxlKF9sZW5ndGggPiBqKV9hcmdzLnB1c2goYXJndW1lbnRzW2orK10pO1xyXG4gICAgcmV0dXJuIGludm9rZShmbiwgX2FyZ3MsIHRoYXQpO1xyXG4gIH1cclxufVxyXG4vLyBPcHRpb25hbCAvIHNpbXBsZSBjb250ZXh0IGJpbmRpbmdcclxuZnVuY3Rpb24gY3R4KGZuLCB0aGF0LCBsZW5ndGgpe1xyXG4gIGFzc2VydEZ1bmN0aW9uKGZuKTtcclxuICBpZih+bGVuZ3RoICYmIHRoYXQgPT09IHVuZGVmaW5lZClyZXR1cm4gZm47XHJcbiAgc3dpdGNoKGxlbmd0aCl7XHJcbiAgICBjYXNlIDE6IHJldHVybiBmdW5jdGlvbihhKXtcclxuICAgICAgcmV0dXJuIGZuLmNhbGwodGhhdCwgYSk7XHJcbiAgICB9XHJcbiAgICBjYXNlIDI6IHJldHVybiBmdW5jdGlvbihhLCBiKXtcclxuICAgICAgcmV0dXJuIGZuLmNhbGwodGhhdCwgYSwgYik7XHJcbiAgICB9XHJcbiAgICBjYXNlIDM6IHJldHVybiBmdW5jdGlvbihhLCBiLCBjKXtcclxuICAgICAgcmV0dXJuIGZuLmNhbGwodGhhdCwgYSwgYiwgYyk7XHJcbiAgICB9XHJcbiAgfSByZXR1cm4gZnVuY3Rpb24oLyogLi4uYXJncyAqLyl7XHJcbiAgICAgIHJldHVybiBmbi5hcHBseSh0aGF0LCBhcmd1bWVudHMpO1xyXG4gIH1cclxufVxyXG4vLyBGYXN0IGFwcGx5XHJcbi8vIGh0dHA6Ly9qc3BlcmYubG5raXQuY29tL2Zhc3QtYXBwbHkvNVxyXG5mdW5jdGlvbiBpbnZva2UoZm4sIGFyZ3MsIHRoYXQpe1xyXG4gIHZhciB1biA9IHRoYXQgPT09IHVuZGVmaW5lZDtcclxuICBzd2l0Y2goYXJncy5sZW5ndGggfCAwKXtcclxuICAgIGNhc2UgMDogcmV0dXJuIHVuID8gZm4oKVxyXG4gICAgICAgICAgICAgICAgICAgICAgOiBmbi5jYWxsKHRoYXQpO1xyXG4gICAgY2FzZSAxOiByZXR1cm4gdW4gPyBmbihhcmdzWzBdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgOiBmbi5jYWxsKHRoYXQsIGFyZ3NbMF0pO1xyXG4gICAgY2FzZSAyOiByZXR1cm4gdW4gPyBmbihhcmdzWzBdLCBhcmdzWzFdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgOiBmbi5jYWxsKHRoYXQsIGFyZ3NbMF0sIGFyZ3NbMV0pO1xyXG4gICAgY2FzZSAzOiByZXR1cm4gdW4gPyBmbihhcmdzWzBdLCBhcmdzWzFdLCBhcmdzWzJdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgOiBmbi5jYWxsKHRoYXQsIGFyZ3NbMF0sIGFyZ3NbMV0sIGFyZ3NbMl0pO1xyXG4gICAgY2FzZSA0OiByZXR1cm4gdW4gPyBmbihhcmdzWzBdLCBhcmdzWzFdLCBhcmdzWzJdLCBhcmdzWzNdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgOiBmbi5jYWxsKHRoYXQsIGFyZ3NbMF0sIGFyZ3NbMV0sIGFyZ3NbMl0sIGFyZ3NbM10pO1xyXG4gICAgY2FzZSA1OiByZXR1cm4gdW4gPyBmbihhcmdzWzBdLCBhcmdzWzFdLCBhcmdzWzJdLCBhcmdzWzNdLCBhcmdzWzRdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgOiBmbi5jYWxsKHRoYXQsIGFyZ3NbMF0sIGFyZ3NbMV0sIGFyZ3NbMl0sIGFyZ3NbM10sIGFyZ3NbNF0pO1xyXG4gIH0gcmV0dXJuICAgICAgICAgICAgICBmbi5hcHBseSh0aGF0LCBhcmdzKTtcclxufVxyXG5cclxuLy8gT2JqZWN0OlxyXG52YXIgY3JlYXRlICAgICAgICAgICA9IE9iamVjdC5jcmVhdGVcclxuICAsIGdldFByb3RvdHlwZU9mICAgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2ZcclxuICAsIHNldFByb3RvdHlwZU9mICAgPSBPYmplY3Quc2V0UHJvdG90eXBlT2ZcclxuICAsIGRlZmluZVByb3BlcnR5ICAgPSBPYmplY3QuZGVmaW5lUHJvcGVydHlcclxuICAsIGRlZmluZVByb3BlcnRpZXMgPSBPYmplY3QuZGVmaW5lUHJvcGVydGllc1xyXG4gICwgZ2V0T3duRGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JcclxuICAsIGdldEtleXMgICAgICAgICAgPSBPYmplY3Qua2V5c1xyXG4gICwgZ2V0TmFtZXMgICAgICAgICA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzXHJcbiAgLCBnZXRTeW1ib2xzICAgICAgID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9sc1xyXG4gICwgaXNGcm96ZW4gICAgICAgICA9IE9iamVjdC5pc0Zyb3plblxyXG4gICwgaGFzICAgICAgICAgICAgICA9IGN0eChjYWxsLCBPYmplY3RQcm90b1tIQVNfT1dOXSwgMilcclxuICAvLyBEdW1teSwgZml4IGZvciBub3QgYXJyYXktbGlrZSBFUzMgc3RyaW5nIGluIGVzNSBtb2R1bGVcclxuICAsIEVTNU9iamVjdCAgICAgICAgPSBPYmplY3RcclxuICAsIERpY3Q7XHJcbmZ1bmN0aW9uIHRvT2JqZWN0KGl0KXtcclxuICByZXR1cm4gRVM1T2JqZWN0KGFzc2VydERlZmluZWQoaXQpKTtcclxufVxyXG5mdW5jdGlvbiByZXR1cm5JdChpdCl7XHJcbiAgcmV0dXJuIGl0O1xyXG59XHJcbmZ1bmN0aW9uIHJldHVyblRoaXMoKXtcclxuICByZXR1cm4gdGhpcztcclxufVxyXG5mdW5jdGlvbiBnZXQob2JqZWN0LCBrZXkpe1xyXG4gIGlmKGhhcyhvYmplY3QsIGtleSkpcmV0dXJuIG9iamVjdFtrZXldO1xyXG59XHJcbmZ1bmN0aW9uIG93bktleXMoaXQpe1xyXG4gIGFzc2VydE9iamVjdChpdCk7XHJcbiAgcmV0dXJuIGdldFN5bWJvbHMgPyBnZXROYW1lcyhpdCkuY29uY2F0KGdldFN5bWJvbHMoaXQpKSA6IGdldE5hbWVzKGl0KTtcclxufVxyXG4vLyAxOS4xLjIuMSBPYmplY3QuYXNzaWduKHRhcmdldCwgc291cmNlLCAuLi4pXHJcbnZhciBhc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHRhcmdldCwgc291cmNlKXtcclxuICB2YXIgVCA9IE9iamVjdChhc3NlcnREZWZpbmVkKHRhcmdldCkpXHJcbiAgICAsIGwgPSBhcmd1bWVudHMubGVuZ3RoXHJcbiAgICAsIGkgPSAxO1xyXG4gIHdoaWxlKGwgPiBpKXtcclxuICAgIHZhciBTICAgICAgPSBFUzVPYmplY3QoYXJndW1lbnRzW2krK10pXHJcbiAgICAgICwga2V5cyAgID0gZ2V0S2V5cyhTKVxyXG4gICAgICAsIGxlbmd0aCA9IGtleXMubGVuZ3RoXHJcbiAgICAgICwgaiAgICAgID0gMFxyXG4gICAgICAsIGtleTtcclxuICAgIHdoaWxlKGxlbmd0aCA+IGopVFtrZXkgPSBrZXlzW2orK11dID0gU1trZXldO1xyXG4gIH1cclxuICByZXR1cm4gVDtcclxufVxyXG5mdW5jdGlvbiBrZXlPZihvYmplY3QsIGVsKXtcclxuICB2YXIgTyAgICAgID0gdG9PYmplY3Qob2JqZWN0KVxyXG4gICAgLCBrZXlzICAgPSBnZXRLZXlzKE8pXHJcbiAgICAsIGxlbmd0aCA9IGtleXMubGVuZ3RoXHJcbiAgICAsIGluZGV4ICA9IDBcclxuICAgICwga2V5O1xyXG4gIHdoaWxlKGxlbmd0aCA+IGluZGV4KWlmKE9ba2V5ID0ga2V5c1tpbmRleCsrXV0gPT09IGVsKXJldHVybiBrZXk7XHJcbn1cclxuXHJcbi8vIEFycmF5XHJcbi8vIGFycmF5KCdzdHIxLHN0cjIsc3RyMycpID0+IFsnc3RyMScsICdzdHIyJywgJ3N0cjMnXVxyXG5mdW5jdGlvbiBhcnJheShpdCl7XHJcbiAgcmV0dXJuIFN0cmluZyhpdCkuc3BsaXQoJywnKTtcclxufVxyXG52YXIgcHVzaCAgICA9IEFycmF5UHJvdG8ucHVzaFxyXG4gICwgdW5zaGlmdCA9IEFycmF5UHJvdG8udW5zaGlmdFxyXG4gICwgc2xpY2UgICA9IEFycmF5UHJvdG8uc2xpY2VcclxuICAsIHNwbGljZSAgPSBBcnJheVByb3RvLnNwbGljZVxyXG4gICwgaW5kZXhPZiA9IEFycmF5UHJvdG8uaW5kZXhPZlxyXG4gICwgZm9yRWFjaCA9IEFycmF5UHJvdG9bRk9SX0VBQ0hdO1xyXG4vKlxyXG4gKiAwIC0+IGZvckVhY2hcclxuICogMSAtPiBtYXBcclxuICogMiAtPiBmaWx0ZXJcclxuICogMyAtPiBzb21lXHJcbiAqIDQgLT4gZXZlcnlcclxuICogNSAtPiBmaW5kXHJcbiAqIDYgLT4gZmluZEluZGV4XHJcbiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVBcnJheU1ldGhvZCh0eXBlKXtcclxuICB2YXIgaXNNYXAgICAgICAgPSB0eXBlID09IDFcclxuICAgICwgaXNGaWx0ZXIgICAgPSB0eXBlID09IDJcclxuICAgICwgaXNTb21lICAgICAgPSB0eXBlID09IDNcclxuICAgICwgaXNFdmVyeSAgICAgPSB0eXBlID09IDRcclxuICAgICwgaXNGaW5kSW5kZXggPSB0eXBlID09IDZcclxuICAgICwgbm9ob2xlcyAgICAgPSB0eXBlID09IDUgfHwgaXNGaW5kSW5kZXg7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uKGNhbGxiYWNrZm4vKiwgdGhhdCA9IHVuZGVmaW5lZCAqLyl7XHJcbiAgICB2YXIgTyAgICAgID0gT2JqZWN0KGFzc2VydERlZmluZWQodGhpcykpXHJcbiAgICAgICwgdGhhdCAgID0gYXJndW1lbnRzWzFdXHJcbiAgICAgICwgc2VsZiAgID0gRVM1T2JqZWN0KE8pXHJcbiAgICAgICwgZiAgICAgID0gY3R4KGNhbGxiYWNrZm4sIHRoYXQsIDMpXHJcbiAgICAgICwgbGVuZ3RoID0gdG9MZW5ndGgoc2VsZi5sZW5ndGgpXHJcbiAgICAgICwgaW5kZXggID0gMFxyXG4gICAgICAsIHJlc3VsdCA9IGlzTWFwID8gQXJyYXkobGVuZ3RoKSA6IGlzRmlsdGVyID8gW10gOiB1bmRlZmluZWRcclxuICAgICAgLCB2YWwsIHJlcztcclxuICAgIGZvcig7bGVuZ3RoID4gaW5kZXg7IGluZGV4KyspaWYobm9ob2xlcyB8fCBpbmRleCBpbiBzZWxmKXtcclxuICAgICAgdmFsID0gc2VsZltpbmRleF07XHJcbiAgICAgIHJlcyA9IGYodmFsLCBpbmRleCwgTyk7XHJcbiAgICAgIGlmKHR5cGUpe1xyXG4gICAgICAgIGlmKGlzTWFwKXJlc3VsdFtpbmRleF0gPSByZXM7ICAgICAgICAgICAgIC8vIG1hcFxyXG4gICAgICAgIGVsc2UgaWYocmVzKXN3aXRjaCh0eXBlKXtcclxuICAgICAgICAgIGNhc2UgMzogcmV0dXJuIHRydWU7ICAgICAgICAgICAgICAgICAgICAvLyBzb21lXHJcbiAgICAgICAgICBjYXNlIDU6IHJldHVybiB2YWw7ICAgICAgICAgICAgICAgICAgICAgLy8gZmluZFxyXG4gICAgICAgICAgY2FzZSA2OiByZXR1cm4gaW5kZXg7ICAgICAgICAgICAgICAgICAgIC8vIGZpbmRJbmRleFxyXG4gICAgICAgICAgY2FzZSAyOiByZXN1bHQucHVzaCh2YWwpOyAgICAgICAgICAgICAgIC8vIGZpbHRlclxyXG4gICAgICAgIH0gZWxzZSBpZihpc0V2ZXJ5KXJldHVybiBmYWxzZTsgICAgICAgICAgIC8vIGV2ZXJ5XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBpc0ZpbmRJbmRleCA/IC0xIDogaXNTb21lIHx8IGlzRXZlcnkgPyBpc0V2ZXJ5IDogcmVzdWx0O1xyXG4gIH1cclxufVxyXG5mdW5jdGlvbiBjcmVhdGVBcnJheUNvbnRhaW5zKGlzQ29udGFpbnMpe1xyXG4gIHJldHVybiBmdW5jdGlvbihlbCAvKiwgZnJvbUluZGV4ID0gMCAqLyl7XHJcbiAgICB2YXIgTyAgICAgID0gdG9PYmplY3QodGhpcylcclxuICAgICAgLCBsZW5ndGggPSB0b0xlbmd0aChPLmxlbmd0aClcclxuICAgICAgLCBpbmRleCAgPSB0b0luZGV4KGFyZ3VtZW50c1sxXSwgbGVuZ3RoKTtcclxuICAgIGlmKGlzQ29udGFpbnMgJiYgZWwgIT0gZWwpe1xyXG4gICAgICBmb3IoO2xlbmd0aCA+IGluZGV4OyBpbmRleCsrKWlmKHNhbWVOYU4oT1tpbmRleF0pKXJldHVybiBpc0NvbnRhaW5zIHx8IGluZGV4O1xyXG4gICAgfSBlbHNlIGZvcig7bGVuZ3RoID4gaW5kZXg7IGluZGV4KyspaWYoaXNDb250YWlucyB8fCBpbmRleCBpbiBPKXtcclxuICAgICAgaWYoT1tpbmRleF0gPT09IGVsKXJldHVybiBpc0NvbnRhaW5zIHx8IGluZGV4O1xyXG4gICAgfSByZXR1cm4gIWlzQ29udGFpbnMgJiYgLTE7XHJcbiAgfVxyXG59XHJcbmZ1bmN0aW9uIGdlbmVyaWMoQSwgQil7XHJcbiAgLy8gc3RyYW5nZSBJRSBxdWlya3MgbW9kZSBidWcgLT4gdXNlIHR5cGVvZiB2cyBpc0Z1bmN0aW9uXHJcbiAgcmV0dXJuIHR5cGVvZiBBID09ICdmdW5jdGlvbicgPyBBIDogQjtcclxufVxyXG5cclxuLy8gTWF0aFxyXG52YXIgTUFYX1NBRkVfSU5URUdFUiA9IDB4MWZmZmZmZmZmZmZmZmYgLy8gcG93KDIsIDUzKSAtIDEgPT0gOTAwNzE5OTI1NDc0MDk5MVxyXG4gICwgcG93ICAgID0gTWF0aC5wb3dcclxuICAsIGFicyAgICA9IE1hdGguYWJzXHJcbiAgLCBjZWlsICAgPSBNYXRoLmNlaWxcclxuICAsIGZsb29yICA9IE1hdGguZmxvb3JcclxuICAsIG1heCAgICA9IE1hdGgubWF4XHJcbiAgLCBtaW4gICAgPSBNYXRoLm1pblxyXG4gICwgcmFuZG9tID0gTWF0aC5yYW5kb21cclxuICAsIHRydW5jICA9IE1hdGgudHJ1bmMgfHwgZnVuY3Rpb24oaXQpe1xyXG4gICAgICByZXR1cm4gKGl0ID4gMCA/IGZsb29yIDogY2VpbCkoaXQpO1xyXG4gICAgfVxyXG4vLyAyMC4xLjIuNCBOdW1iZXIuaXNOYU4obnVtYmVyKVxyXG5mdW5jdGlvbiBzYW1lTmFOKG51bWJlcil7XHJcbiAgcmV0dXJuIG51bWJlciAhPSBudW1iZXI7XHJcbn1cclxuLy8gNy4xLjQgVG9JbnRlZ2VyXHJcbmZ1bmN0aW9uIHRvSW50ZWdlcihpdCl7XHJcbiAgcmV0dXJuIGlzTmFOKGl0KSA/IDAgOiB0cnVuYyhpdCk7XHJcbn1cclxuLy8gNy4xLjE1IFRvTGVuZ3RoXHJcbmZ1bmN0aW9uIHRvTGVuZ3RoKGl0KXtcclxuICByZXR1cm4gaXQgPiAwID8gbWluKHRvSW50ZWdlcihpdCksIE1BWF9TQUZFX0lOVEVHRVIpIDogMDtcclxufVxyXG5mdW5jdGlvbiB0b0luZGV4KGluZGV4LCBsZW5ndGgpe1xyXG4gIHZhciBpbmRleCA9IHRvSW50ZWdlcihpbmRleCk7XHJcbiAgcmV0dXJuIGluZGV4IDwgMCA/IG1heChpbmRleCArIGxlbmd0aCwgMCkgOiBtaW4oaW5kZXgsIGxlbmd0aCk7XHJcbn1cclxuZnVuY3Rpb24gbHoobnVtKXtcclxuICByZXR1cm4gbnVtID4gOSA/IG51bSA6ICcwJyArIG51bTtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlUmVwbGFjZXIocmVnRXhwLCByZXBsYWNlLCBpc1N0YXRpYyl7XHJcbiAgdmFyIHJlcGxhY2VyID0gaXNPYmplY3QocmVwbGFjZSkgPyBmdW5jdGlvbihwYXJ0KXtcclxuICAgIHJldHVybiByZXBsYWNlW3BhcnRdO1xyXG4gIH0gOiByZXBsYWNlO1xyXG4gIHJldHVybiBmdW5jdGlvbihpdCl7XHJcbiAgICByZXR1cm4gU3RyaW5nKGlzU3RhdGljID8gaXQgOiB0aGlzKS5yZXBsYWNlKHJlZ0V4cCwgcmVwbGFjZXIpO1xyXG4gIH1cclxufVxyXG5mdW5jdGlvbiBjcmVhdGVQb2ludEF0KHRvU3RyaW5nKXtcclxuICByZXR1cm4gZnVuY3Rpb24ocG9zKXtcclxuICAgIHZhciBzID0gU3RyaW5nKGFzc2VydERlZmluZWQodGhpcykpXHJcbiAgICAgICwgaSA9IHRvSW50ZWdlcihwb3MpXHJcbiAgICAgICwgbCA9IHMubGVuZ3RoXHJcbiAgICAgICwgYSwgYjtcclxuICAgIGlmKGkgPCAwIHx8IGkgPj0gbClyZXR1cm4gdG9TdHJpbmcgPyAnJyA6IHVuZGVmaW5lZDtcclxuICAgIGEgPSBzLmNoYXJDb2RlQXQoaSk7XHJcbiAgICByZXR1cm4gYSA8IDB4ZDgwMCB8fCBhID4gMHhkYmZmIHx8IGkgKyAxID09PSBsIHx8IChiID0gcy5jaGFyQ29kZUF0KGkgKyAxKSkgPCAweGRjMDAgfHwgYiA+IDB4ZGZmZlxyXG4gICAgICA/IHRvU3RyaW5nID8gcy5jaGFyQXQoaSkgOiBhXHJcbiAgICAgIDogdG9TdHJpbmcgPyBzLnNsaWNlKGksIGkgKyAyKSA6IChhIC0gMHhkODAwIDw8IDEwKSArIChiIC0gMHhkYzAwKSArIDB4MTAwMDA7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBBc3NlcnRpb24gJiBlcnJvcnNcclxudmFyIFJFRFVDRV9FUlJPUiA9ICdSZWR1Y2Ugb2YgZW1wdHkgb2JqZWN0IHdpdGggbm8gaW5pdGlhbCB2YWx1ZSc7XHJcbmZ1bmN0aW9uIGFzc2VydChjb25kaXRpb24sIG1zZzEsIG1zZzIpe1xyXG4gIGlmKCFjb25kaXRpb24pdGhyb3cgVHlwZUVycm9yKG1zZzIgPyBtc2cxICsgbXNnMiA6IG1zZzEpO1xyXG59XHJcbmZ1bmN0aW9uIGFzc2VydERlZmluZWQoaXQpe1xyXG4gIGlmKGl0ID09IHVuZGVmaW5lZCl0aHJvdyBUeXBlRXJyb3IoJ0Z1bmN0aW9uIGNhbGxlZCBvbiBudWxsIG9yIHVuZGVmaW5lZCcpO1xyXG4gIHJldHVybiBpdDtcclxufVxyXG5mdW5jdGlvbiBhc3NlcnRGdW5jdGlvbihpdCl7XHJcbiAgYXNzZXJ0KGlzRnVuY3Rpb24oaXQpLCBpdCwgJyBpcyBub3QgYSBmdW5jdGlvbiEnKTtcclxuICByZXR1cm4gaXQ7XHJcbn1cclxuZnVuY3Rpb24gYXNzZXJ0T2JqZWN0KGl0KXtcclxuICBhc3NlcnQoaXNPYmplY3QoaXQpLCBpdCwgJyBpcyBub3QgYW4gb2JqZWN0IScpO1xyXG4gIHJldHVybiBpdDtcclxufVxyXG5mdW5jdGlvbiBhc3NlcnRJbnN0YW5jZShpdCwgQ29uc3RydWN0b3IsIG5hbWUpe1xyXG4gIGFzc2VydChpdCBpbnN0YW5jZW9mIENvbnN0cnVjdG9yLCBuYW1lLCBcIjogdXNlIHRoZSAnbmV3JyBvcGVyYXRvciFcIik7XHJcbn1cclxuXHJcbi8vIFByb3BlcnR5IGRlc2NyaXB0b3JzICYgU3ltYm9sXHJcbmZ1bmN0aW9uIGRlc2NyaXB0b3IoYml0bWFwLCB2YWx1ZSl7XHJcbiAgcmV0dXJuIHtcclxuICAgIGVudW1lcmFibGUgIDogIShiaXRtYXAgJiAxKSxcclxuICAgIGNvbmZpZ3VyYWJsZTogIShiaXRtYXAgJiAyKSxcclxuICAgIHdyaXRhYmxlICAgIDogIShiaXRtYXAgJiA0KSxcclxuICAgIHZhbHVlICAgICAgIDogdmFsdWVcclxuICB9XHJcbn1cclxuZnVuY3Rpb24gc2ltcGxlU2V0KG9iamVjdCwga2V5LCB2YWx1ZSl7XHJcbiAgb2JqZWN0W2tleV0gPSB2YWx1ZTtcclxuICByZXR1cm4gb2JqZWN0O1xyXG59XHJcbmZ1bmN0aW9uIGNyZWF0ZURlZmluZXIoYml0bWFwKXtcclxuICByZXR1cm4gREVTQyA/IGZ1bmN0aW9uKG9iamVjdCwga2V5LCB2YWx1ZSl7XHJcbiAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkob2JqZWN0LCBrZXksIGRlc2NyaXB0b3IoYml0bWFwLCB2YWx1ZSkpO1xyXG4gIH0gOiBzaW1wbGVTZXQ7XHJcbn1cclxuZnVuY3Rpb24gdWlkKGtleSl7XHJcbiAgcmV0dXJuIFNZTUJPTCArICcoJyArIGtleSArICcpXycgKyAoKytzaWQgKyByYW5kb20oKSlbVE9fU1RSSU5HXSgzNik7XHJcbn1cclxuZnVuY3Rpb24gZ2V0V2VsbEtub3duU3ltYm9sKG5hbWUsIHNldHRlcil7XHJcbiAgcmV0dXJuIChTeW1ib2wgJiYgU3ltYm9sW25hbWVdKSB8fCAoc2V0dGVyID8gU3ltYm9sIDogc2FmZVN5bWJvbCkoU1lNQk9MICsgRE9UICsgbmFtZSk7XHJcbn1cclxuLy8gVGhlIGVuZ2luZSB3b3JrcyBmaW5lIHdpdGggZGVzY3JpcHRvcnM/IFRoYW5rJ3MgSUU4IGZvciBoaXMgZnVubnkgZGVmaW5lUHJvcGVydHkuXHJcbnZhciBERVNDID0gISFmdW5jdGlvbigpe1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eSh7fSwgJ2EnLCB7Z2V0OiBmdW5jdGlvbigpeyByZXR1cm4gMiB9fSkuYSA9PSAyO1xyXG4gICAgICB9IGNhdGNoKGUpe31cclxuICAgIH0oKVxyXG4gICwgc2lkICAgID0gMFxyXG4gICwgaGlkZGVuID0gY3JlYXRlRGVmaW5lcigxKVxyXG4gICwgc2V0ICAgID0gU3ltYm9sID8gc2ltcGxlU2V0IDogaGlkZGVuXHJcbiAgLCBzYWZlU3ltYm9sID0gU3ltYm9sIHx8IHVpZDtcclxuZnVuY3Rpb24gYXNzaWduSGlkZGVuKHRhcmdldCwgc3JjKXtcclxuICBmb3IodmFyIGtleSBpbiBzcmMpaGlkZGVuKHRhcmdldCwga2V5LCBzcmNba2V5XSk7XHJcbiAgcmV0dXJuIHRhcmdldDtcclxufVxyXG5cclxudmFyIFNZTUJPTF9VTlNDT1BBQkxFUyA9IGdldFdlbGxLbm93blN5bWJvbCgndW5zY29wYWJsZXMnKVxyXG4gICwgQXJyYXlVbnNjb3BhYmxlcyAgID0gQXJyYXlQcm90b1tTWU1CT0xfVU5TQ09QQUJMRVNdIHx8IHt9XHJcbiAgLCBTWU1CT0xfVEFHICAgICAgICAgPSBnZXRXZWxsS25vd25TeW1ib2woVE9fU1RSSU5HX1RBRylcclxuICAsIFNZTUJPTF9TUEVDSUVTICAgICA9IGdldFdlbGxLbm93blN5bWJvbCgnc3BlY2llcycpXHJcbiAgLCBTWU1CT0xfSVRFUkFUT1I7XHJcbmZ1bmN0aW9uIHNldFNwZWNpZXMoQyl7XHJcbiAgaWYoREVTQyAmJiAoZnJhbWV3b3JrIHx8ICFpc05hdGl2ZShDKSkpZGVmaW5lUHJvcGVydHkoQywgU1lNQk9MX1NQRUNJRVMsIHtcclxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuICAgIGdldDogcmV0dXJuVGhpc1xyXG4gIH0pO1xyXG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1vZHVsZSA6IGNvbW1vbi5leHBvcnQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbnZhciBOT0RFID0gY29mKHByb2Nlc3MpID09IFBST0NFU1NcclxuICAsIGNvcmUgPSB7fVxyXG4gICwgcGF0aCA9IGZyYW1ld29yayA/IGdsb2JhbCA6IGNvcmVcclxuICAsIG9sZCAgPSBnbG9iYWwuY29yZVxyXG4gICwgZXhwb3J0R2xvYmFsXHJcbiAgLy8gdHlwZSBiaXRtYXBcclxuICAsIEZPUkNFRCA9IDFcclxuICAsIEdMT0JBTCA9IDJcclxuICAsIFNUQVRJQyA9IDRcclxuICAsIFBST1RPICA9IDhcclxuICAsIEJJTkQgICA9IDE2XHJcbiAgLCBXUkFQICAgPSAzMjtcclxuZnVuY3Rpb24gJGRlZmluZSh0eXBlLCBuYW1lLCBzb3VyY2Upe1xyXG4gIHZhciBrZXksIG93biwgb3V0LCBleHBcclxuICAgICwgaXNHbG9iYWwgPSB0eXBlICYgR0xPQkFMXHJcbiAgICAsIHRhcmdldCAgID0gaXNHbG9iYWwgPyBnbG9iYWwgOiAodHlwZSAmIFNUQVRJQylcclxuICAgICAgICA/IGdsb2JhbFtuYW1lXSA6IChnbG9iYWxbbmFtZV0gfHwgT2JqZWN0UHJvdG8pW1BST1RPVFlQRV1cclxuICAgICwgZXhwb3J0cyAgPSBpc0dsb2JhbCA/IGNvcmUgOiBjb3JlW25hbWVdIHx8IChjb3JlW25hbWVdID0ge30pO1xyXG4gIGlmKGlzR2xvYmFsKXNvdXJjZSA9IG5hbWU7XHJcbiAgZm9yKGtleSBpbiBzb3VyY2Upe1xyXG4gICAgLy8gdGhlcmUgaXMgYSBzaW1pbGFyIG5hdGl2ZVxyXG4gICAgb3duID0gISh0eXBlICYgRk9SQ0VEKSAmJiB0YXJnZXQgJiYga2V5IGluIHRhcmdldFxyXG4gICAgICAmJiAoIWlzRnVuY3Rpb24odGFyZ2V0W2tleV0pIHx8IGlzTmF0aXZlKHRhcmdldFtrZXldKSk7XHJcbiAgICAvLyBleHBvcnQgbmF0aXZlIG9yIHBhc3NlZFxyXG4gICAgb3V0ID0gKG93biA/IHRhcmdldCA6IHNvdXJjZSlba2V5XTtcclxuICAgIC8vIHByZXZlbnQgZ2xvYmFsIHBvbGx1dGlvbiBmb3IgbmFtZXNwYWNlc1xyXG4gICAgaWYoIWZyYW1ld29yayAmJiBpc0dsb2JhbCAmJiAhaXNGdW5jdGlvbih0YXJnZXRba2V5XSkpZXhwID0gc291cmNlW2tleV07XHJcbiAgICAvLyBiaW5kIHRpbWVycyB0byBnbG9iYWwgZm9yIGNhbGwgZnJvbSBleHBvcnQgY29udGV4dFxyXG4gICAgZWxzZSBpZih0eXBlICYgQklORCAmJiBvd24pZXhwID0gY3R4KG91dCwgZ2xvYmFsKTtcclxuICAgIC8vIHdyYXAgZ2xvYmFsIGNvbnN0cnVjdG9ycyBmb3IgcHJldmVudCBjaGFuZ2UgdGhlbSBpbiBsaWJyYXJ5XHJcbiAgICBlbHNlIGlmKHR5cGUgJiBXUkFQICYmICFmcmFtZXdvcmsgJiYgdGFyZ2V0W2tleV0gPT0gb3V0KXtcclxuICAgICAgZXhwID0gZnVuY3Rpb24ocGFyYW0pe1xyXG4gICAgICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2Ygb3V0ID8gbmV3IG91dChwYXJhbSkgOiBvdXQocGFyYW0pO1xyXG4gICAgICB9XHJcbiAgICAgIGV4cFtQUk9UT1RZUEVdID0gb3V0W1BST1RPVFlQRV07XHJcbiAgICB9IGVsc2UgZXhwID0gdHlwZSAmIFBST1RPICYmIGlzRnVuY3Rpb24ob3V0KSA/IGN0eChjYWxsLCBvdXQpIDogb3V0O1xyXG4gICAgLy8gZXh0ZW5kIGdsb2JhbFxyXG4gICAgaWYoZnJhbWV3b3JrICYmIHRhcmdldCAmJiAhb3duKXtcclxuICAgICAgaWYoaXNHbG9iYWwpdGFyZ2V0W2tleV0gPSBvdXQ7XHJcbiAgICAgIGVsc2UgZGVsZXRlIHRhcmdldFtrZXldICYmIGhpZGRlbih0YXJnZXQsIGtleSwgb3V0KTtcclxuICAgIH1cclxuICAgIC8vIGV4cG9ydFxyXG4gICAgaWYoZXhwb3J0c1trZXldICE9IG91dCloaWRkZW4oZXhwb3J0cywga2V5LCBleHApO1xyXG4gIH1cclxufVxyXG4vLyBDb21tb25KUyBleHBvcnRcclxuaWYodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyltb2R1bGUuZXhwb3J0cyA9IGNvcmU7XHJcbi8vIFJlcXVpcmVKUyBleHBvcnRcclxuZWxzZSBpZihpc0Z1bmN0aW9uKGRlZmluZSkgJiYgZGVmaW5lLmFtZClkZWZpbmUoZnVuY3Rpb24oKXtyZXR1cm4gY29yZX0pO1xyXG4vLyBFeHBvcnQgdG8gZ2xvYmFsIG9iamVjdFxyXG5lbHNlIGV4cG9ydEdsb2JhbCA9IHRydWU7XHJcbmlmKGV4cG9ydEdsb2JhbCB8fCBmcmFtZXdvcmspe1xyXG4gIGNvcmUubm9Db25mbGljdCA9IGZ1bmN0aW9uKCl7XHJcbiAgICBnbG9iYWwuY29yZSA9IG9sZDtcclxuICAgIHJldHVybiBjb3JlO1xyXG4gIH1cclxuICBnbG9iYWwuY29yZSA9IGNvcmU7XHJcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogTW9kdWxlIDogY29tbW9uLml0ZXJhdG9ycyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuU1lNQk9MX0lURVJBVE9SID0gZ2V0V2VsbEtub3duU3ltYm9sKElURVJBVE9SKTtcclxudmFyIElURVIgID0gc2FmZVN5bWJvbCgnaXRlcicpXHJcbiAgLCBLRVkgICA9IDFcclxuICAsIFZBTFVFID0gMlxyXG4gICwgSXRlcmF0b3JzID0ge31cclxuICAsIEl0ZXJhdG9yUHJvdG90eXBlID0ge31cclxuICAgIC8vIFNhZmFyaSBoYXMgYnlnZ3kgaXRlcmF0b3JzIHcvbyBgbmV4dGBcclxuICAsIEJVR0dZX0lURVJBVE9SUyA9ICdrZXlzJyBpbiBBcnJheVByb3RvICYmICEoJ25leHQnIGluIFtdLmtleXMoKSk7XHJcbi8vIDI1LjEuMi4xLjEgJUl0ZXJhdG9yUHJvdG90eXBlJVtAQGl0ZXJhdG9yXSgpXHJcbnNldEl0ZXJhdG9yKEl0ZXJhdG9yUHJvdG90eXBlLCByZXR1cm5UaGlzKTtcclxuZnVuY3Rpb24gc2V0SXRlcmF0b3IoTywgdmFsdWUpe1xyXG4gIGhpZGRlbihPLCBTWU1CT0xfSVRFUkFUT1IsIHZhbHVlKTtcclxuICAvLyBBZGQgaXRlcmF0b3IgZm9yIEZGIGl0ZXJhdG9yIHByb3RvY29sXHJcbiAgRkZfSVRFUkFUT1IgaW4gQXJyYXlQcm90byAmJiBoaWRkZW4oTywgRkZfSVRFUkFUT1IsIHZhbHVlKTtcclxufVxyXG5mdW5jdGlvbiBjcmVhdGVJdGVyYXRvcihDb25zdHJ1Y3RvciwgTkFNRSwgbmV4dCwgcHJvdG8pe1xyXG4gIENvbnN0cnVjdG9yW1BST1RPVFlQRV0gPSBjcmVhdGUocHJvdG8gfHwgSXRlcmF0b3JQcm90b3R5cGUsIHtuZXh0OiBkZXNjcmlwdG9yKDEsIG5leHQpfSk7XHJcbiAgc2V0VG9TdHJpbmdUYWcoQ29uc3RydWN0b3IsIE5BTUUgKyAnIEl0ZXJhdG9yJyk7XHJcbn1cclxuZnVuY3Rpb24gZGVmaW5lSXRlcmF0b3IoQ29uc3RydWN0b3IsIE5BTUUsIHZhbHVlLCBERUZBVUxUKXtcclxuICB2YXIgcHJvdG8gPSBDb25zdHJ1Y3RvcltQUk9UT1RZUEVdXHJcbiAgICAsIGl0ZXIgID0gZ2V0KHByb3RvLCBTWU1CT0xfSVRFUkFUT1IpIHx8IGdldChwcm90bywgRkZfSVRFUkFUT1IpIHx8IChERUZBVUxUICYmIGdldChwcm90bywgREVGQVVMVCkpIHx8IHZhbHVlO1xyXG4gIGlmKGZyYW1ld29yayl7XHJcbiAgICAvLyBEZWZpbmUgaXRlcmF0b3JcclxuICAgIHNldEl0ZXJhdG9yKHByb3RvLCBpdGVyKTtcclxuICAgIGlmKGl0ZXIgIT09IHZhbHVlKXtcclxuICAgICAgdmFyIGl0ZXJQcm90byA9IGdldFByb3RvdHlwZU9mKGl0ZXIuY2FsbChuZXcgQ29uc3RydWN0b3IpKTtcclxuICAgICAgLy8gU2V0IEBAdG9TdHJpbmdUYWcgdG8gbmF0aXZlIGl0ZXJhdG9yc1xyXG4gICAgICBzZXRUb1N0cmluZ1RhZyhpdGVyUHJvdG8sIE5BTUUgKyAnIEl0ZXJhdG9yJywgdHJ1ZSk7XHJcbiAgICAgIC8vIEZGIGZpeFxyXG4gICAgICBoYXMocHJvdG8sIEZGX0lURVJBVE9SKSAmJiBzZXRJdGVyYXRvcihpdGVyUHJvdG8sIHJldHVyblRoaXMpO1xyXG4gICAgfVxyXG4gIH1cclxuICAvLyBQbHVnIGZvciBsaWJyYXJ5XHJcbiAgSXRlcmF0b3JzW05BTUVdID0gaXRlcjtcclxuICAvLyBGRiAmIHY4IGZpeFxyXG4gIEl0ZXJhdG9yc1tOQU1FICsgJyBJdGVyYXRvciddID0gcmV0dXJuVGhpcztcclxuICByZXR1cm4gaXRlcjtcclxufVxyXG5mdW5jdGlvbiBkZWZpbmVTdGRJdGVyYXRvcnMoQmFzZSwgTkFNRSwgQ29uc3RydWN0b3IsIG5leHQsIERFRkFVTFQsIElTX1NFVCl7XHJcbiAgZnVuY3Rpb24gY3JlYXRlSXRlcihraW5kKXtcclxuICAgIHJldHVybiBmdW5jdGlvbigpe1xyXG4gICAgICByZXR1cm4gbmV3IENvbnN0cnVjdG9yKHRoaXMsIGtpbmQpO1xyXG4gICAgfVxyXG4gIH1cclxuICBjcmVhdGVJdGVyYXRvcihDb25zdHJ1Y3RvciwgTkFNRSwgbmV4dCk7XHJcbiAgdmFyIGVudHJpZXMgPSBjcmVhdGVJdGVyKEtFWStWQUxVRSlcclxuICAgICwgdmFsdWVzICA9IGNyZWF0ZUl0ZXIoVkFMVUUpO1xyXG4gIGlmKERFRkFVTFQgPT0gVkFMVUUpdmFsdWVzID0gZGVmaW5lSXRlcmF0b3IoQmFzZSwgTkFNRSwgdmFsdWVzLCAndmFsdWVzJyk7XHJcbiAgZWxzZSBlbnRyaWVzID0gZGVmaW5lSXRlcmF0b3IoQmFzZSwgTkFNRSwgZW50cmllcywgJ2VudHJpZXMnKTtcclxuICBpZihERUZBVUxUKXtcclxuICAgICRkZWZpbmUoUFJPVE8gKyBGT1JDRUQgKiBCVUdHWV9JVEVSQVRPUlMsIE5BTUUsIHtcclxuICAgICAgZW50cmllczogZW50cmllcyxcclxuICAgICAga2V5czogSVNfU0VUID8gdmFsdWVzIDogY3JlYXRlSXRlcihLRVkpLFxyXG4gICAgICB2YWx1ZXM6IHZhbHVlc1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbmZ1bmN0aW9uIGl0ZXJSZXN1bHQoZG9uZSwgdmFsdWUpe1xyXG4gIHJldHVybiB7dmFsdWU6IHZhbHVlLCBkb25lOiAhIWRvbmV9O1xyXG59XHJcbmZ1bmN0aW9uIGlzSXRlcmFibGUoaXQpe1xyXG4gIHZhciBPICAgICAgPSBPYmplY3QoaXQpXHJcbiAgICAsIFN5bWJvbCA9IGdsb2JhbFtTWU1CT0xdXHJcbiAgICAsIGhhc0V4dCA9IChTeW1ib2wgJiYgU3ltYm9sW0lURVJBVE9SXSB8fCBGRl9JVEVSQVRPUikgaW4gTztcclxuICByZXR1cm4gaGFzRXh0IHx8IFNZTUJPTF9JVEVSQVRPUiBpbiBPIHx8IGhhcyhJdGVyYXRvcnMsIGNsYXNzb2YoTykpO1xyXG59XHJcbmZ1bmN0aW9uIGdldEl0ZXJhdG9yKGl0KXtcclxuICB2YXIgU3ltYm9sICA9IGdsb2JhbFtTWU1CT0xdXHJcbiAgICAsIGV4dCAgICAgPSBpdFtTeW1ib2wgJiYgU3ltYm9sW0lURVJBVE9SXSB8fCBGRl9JVEVSQVRPUl1cclxuICAgICwgZ2V0SXRlciA9IGV4dCB8fCBpdFtTWU1CT0xfSVRFUkFUT1JdIHx8IEl0ZXJhdG9yc1tjbGFzc29mKGl0KV07XHJcbiAgcmV0dXJuIGFzc2VydE9iamVjdChnZXRJdGVyLmNhbGwoaXQpKTtcclxufVxyXG5mdW5jdGlvbiBzdGVwQ2FsbChmbiwgdmFsdWUsIGVudHJpZXMpe1xyXG4gIHJldHVybiBlbnRyaWVzID8gaW52b2tlKGZuLCB2YWx1ZSkgOiBmbih2YWx1ZSk7XHJcbn1cclxuZnVuY3Rpb24gY2hlY2tEYW5nZXJJdGVyQ2xvc2luZyhmbil7XHJcbiAgdmFyIGRhbmdlciA9IHRydWU7XHJcbiAgdmFyIE8gPSB7XHJcbiAgICBuZXh0OiBmdW5jdGlvbigpeyB0aHJvdyAxIH0sXHJcbiAgICAncmV0dXJuJzogZnVuY3Rpb24oKXsgZGFuZ2VyID0gZmFsc2UgfVxyXG4gIH07XHJcbiAgT1tTWU1CT0xfSVRFUkFUT1JdID0gcmV0dXJuVGhpcztcclxuICB0cnkge1xyXG4gICAgZm4oTyk7XHJcbiAgfSBjYXRjaChlKXt9XHJcbiAgcmV0dXJuIGRhbmdlcjtcclxufVxyXG5mdW5jdGlvbiBjbG9zZUl0ZXJhdG9yKGl0ZXJhdG9yKXtcclxuICB2YXIgcmV0ID0gaXRlcmF0b3JbJ3JldHVybiddO1xyXG4gIGlmKHJldCAhPT0gdW5kZWZpbmVkKXJldC5jYWxsKGl0ZXJhdG9yKTtcclxufVxyXG5mdW5jdGlvbiBzYWZlSXRlckNsb3NlKGV4ZWMsIGl0ZXJhdG9yKXtcclxuICB0cnkge1xyXG4gICAgZXhlYyhpdGVyYXRvcik7XHJcbiAgfSBjYXRjaChlKXtcclxuICAgIGNsb3NlSXRlcmF0b3IoaXRlcmF0b3IpO1xyXG4gICAgdGhyb3cgZTtcclxuICB9XHJcbn1cclxuZnVuY3Rpb24gZm9yT2YoaXRlcmFibGUsIGVudHJpZXMsIGZuLCB0aGF0KXtcclxuICBzYWZlSXRlckNsb3NlKGZ1bmN0aW9uKGl0ZXJhdG9yKXtcclxuICAgIHZhciBmID0gY3R4KGZuLCB0aGF0LCBlbnRyaWVzID8gMiA6IDEpXHJcbiAgICAgICwgc3RlcDtcclxuICAgIHdoaWxlKCEoc3RlcCA9IGl0ZXJhdG9yLm5leHQoKSkuZG9uZSlpZihzdGVwQ2FsbChmLCBzdGVwLnZhbHVlLCBlbnRyaWVzKSA9PT0gZmFsc2Upe1xyXG4gICAgICByZXR1cm4gY2xvc2VJdGVyYXRvcihpdGVyYXRvcik7XHJcbiAgICB9XHJcbiAgfSwgZ2V0SXRlcmF0b3IoaXRlcmFibGUpKTtcclxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBNb2R1bGUgOiBlczYuc3ltYm9sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vLyBFQ01BU2NyaXB0IDYgc3ltYm9scyBzaGltXHJcbiFmdW5jdGlvbihUQUcsIFN5bWJvbFJlZ2lzdHJ5LCBBbGxTeW1ib2xzLCBzZXR0ZXIpe1xyXG4gIC8vIDE5LjQuMS4xIFN5bWJvbChbZGVzY3JpcHRpb25dKVxyXG4gIGlmKCFpc05hdGl2ZShTeW1ib2wpKXtcclxuICAgIFN5bWJvbCA9IGZ1bmN0aW9uKGRlc2NyaXB0aW9uKXtcclxuICAgICAgYXNzZXJ0KCEodGhpcyBpbnN0YW5jZW9mIFN5bWJvbCksIFNZTUJPTCArICcgaXMgbm90IGEgJyArIENPTlNUUlVDVE9SKTtcclxuICAgICAgdmFyIHRhZyA9IHVpZChkZXNjcmlwdGlvbilcclxuICAgICAgICAsIHN5bSA9IHNldChjcmVhdGUoU3ltYm9sW1BST1RPVFlQRV0pLCBUQUcsIHRhZyk7XHJcbiAgICAgIEFsbFN5bWJvbHNbdGFnXSA9IHN5bTtcclxuICAgICAgREVTQyAmJiBzZXR0ZXIgJiYgZGVmaW5lUHJvcGVydHkoT2JqZWN0UHJvdG8sIHRhZywge1xyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKXtcclxuICAgICAgICAgIGhpZGRlbih0aGlzLCB0YWcsIHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gc3ltO1xyXG4gICAgfVxyXG4gICAgaGlkZGVuKFN5bWJvbFtQUk9UT1RZUEVdLCBUT19TVFJJTkcsIGZ1bmN0aW9uKCl7XHJcbiAgICAgIHJldHVybiB0aGlzW1RBR107XHJcbiAgICB9KTtcclxuICB9XHJcbiAgJGRlZmluZShHTE9CQUwgKyBXUkFQLCB7U3ltYm9sOiBTeW1ib2x9KTtcclxuICBcclxuICB2YXIgc3ltYm9sU3RhdGljcyA9IHtcclxuICAgIC8vIDE5LjQuMi4xIFN5bWJvbC5mb3Ioa2V5KVxyXG4gICAgJ2Zvcic6IGZ1bmN0aW9uKGtleSl7XHJcbiAgICAgIHJldHVybiBoYXMoU3ltYm9sUmVnaXN0cnksIGtleSArPSAnJylcclxuICAgICAgICA/IFN5bWJvbFJlZ2lzdHJ5W2tleV1cclxuICAgICAgICA6IFN5bWJvbFJlZ2lzdHJ5W2tleV0gPSBTeW1ib2woa2V5KTtcclxuICAgIH0sXHJcbiAgICAvLyAxOS40LjIuNCBTeW1ib2wuaXRlcmF0b3JcclxuICAgIGl0ZXJhdG9yOiBTWU1CT0xfSVRFUkFUT1IgfHwgZ2V0V2VsbEtub3duU3ltYm9sKElURVJBVE9SKSxcclxuICAgIC8vIDE5LjQuMi41IFN5bWJvbC5rZXlGb3Ioc3ltKVxyXG4gICAga2V5Rm9yOiBwYXJ0LmNhbGwoa2V5T2YsIFN5bWJvbFJlZ2lzdHJ5KSxcclxuICAgIC8vIDE5LjQuMi4xMCBTeW1ib2wuc3BlY2llc1xyXG4gICAgc3BlY2llczogU1lNQk9MX1NQRUNJRVMsXHJcbiAgICAvLyAxOS40LjIuMTMgU3ltYm9sLnRvU3RyaW5nVGFnXHJcbiAgICB0b1N0cmluZ1RhZzogU1lNQk9MX1RBRyA9IGdldFdlbGxLbm93blN5bWJvbChUT19TVFJJTkdfVEFHLCB0cnVlKSxcclxuICAgIC8vIDE5LjQuMi4xNCBTeW1ib2wudW5zY29wYWJsZXNcclxuICAgIHVuc2NvcGFibGVzOiBTWU1CT0xfVU5TQ09QQUJMRVMsXHJcbiAgICBwdXJlOiBzYWZlU3ltYm9sLFxyXG4gICAgc2V0OiBzZXQsXHJcbiAgICB1c2VTZXR0ZXI6IGZ1bmN0aW9uKCl7c2V0dGVyID0gdHJ1ZX0sXHJcbiAgICB1c2VTaW1wbGU6IGZ1bmN0aW9uKCl7c2V0dGVyID0gZmFsc2V9XHJcbiAgfTtcclxuICAvLyAxOS40LjIuMiBTeW1ib2wuaGFzSW5zdGFuY2VcclxuICAvLyAxOS40LjIuMyBTeW1ib2wuaXNDb25jYXRTcHJlYWRhYmxlXHJcbiAgLy8gMTkuNC4yLjYgU3ltYm9sLm1hdGNoXHJcbiAgLy8gMTkuNC4yLjggU3ltYm9sLnJlcGxhY2VcclxuICAvLyAxOS40LjIuOSBTeW1ib2wuc2VhcmNoXHJcbiAgLy8gMTkuNC4yLjExIFN5bWJvbC5zcGxpdFxyXG4gIC8vIDE5LjQuMi4xMiBTeW1ib2wudG9QcmltaXRpdmVcclxuICBmb3JFYWNoLmNhbGwoYXJyYXkoJ2hhc0luc3RhbmNlLGlzQ29uY2F0U3ByZWFkYWJsZSxtYXRjaCxyZXBsYWNlLHNlYXJjaCxzcGxpdCx0b1ByaW1pdGl2ZScpLFxyXG4gICAgZnVuY3Rpb24oaXQpe1xyXG4gICAgICBzeW1ib2xTdGF0aWNzW2l0XSA9IGdldFdlbGxLbm93blN5bWJvbChpdCk7XHJcbiAgICB9XHJcbiAgKTtcclxuICAkZGVmaW5lKFNUQVRJQywgU1lNQk9MLCBzeW1ib2xTdGF0aWNzKTtcclxuICBcclxuICBzZXRUb1N0cmluZ1RhZyhTeW1ib2wsIFNZTUJPTCk7XHJcbiAgXHJcbiAgJGRlZmluZShTVEFUSUMgKyBGT1JDRUQgKiAhaXNOYXRpdmUoU3ltYm9sKSwgT0JKRUNULCB7XHJcbiAgICAvLyAxOS4xLjIuNyBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhPKVxyXG4gICAgZ2V0T3duUHJvcGVydHlOYW1lczogZnVuY3Rpb24oaXQpe1xyXG4gICAgICB2YXIgbmFtZXMgPSBnZXROYW1lcyh0b09iamVjdChpdCkpLCByZXN1bHQgPSBbXSwga2V5LCBpID0gMDtcclxuICAgICAgd2hpbGUobmFtZXMubGVuZ3RoID4gaSloYXMoQWxsU3ltYm9scywga2V5ID0gbmFtZXNbaSsrXSkgfHwgcmVzdWx0LnB1c2goa2V5KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcbiAgICAvLyAxOS4xLjIuOCBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKE8pXHJcbiAgICBnZXRPd25Qcm9wZXJ0eVN5bWJvbHM6IGZ1bmN0aW9uKGl0KXtcclxuICAgICAgdmFyIG5hbWVzID0gZ2V0TmFtZXModG9PYmplY3QoaXQpKSwgcmVzdWx0ID0gW10sIGtleSwgaSA9IDA7XHJcbiAgICAgIHdoaWxlKG5hbWVzLmxlbmd0aCA+IGkpaGFzKEFsbFN5bWJvbHMsIGtleSA9IG5hbWVzW2krK10pICYmIHJlc3VsdC5wdXNoKEFsbFN5bWJvbHNba2V5XSk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgXHJcbiAgLy8gMjAuMi4xLjkgTWF0aFtAQHRvU3RyaW5nVGFnXVxyXG4gIHNldFRvU3RyaW5nVGFnKE1hdGgsIE1BVEgsIHRydWUpO1xyXG4gIC8vIDI0LjMuMyBKU09OW0BAdG9TdHJpbmdUYWddXHJcbiAgc2V0VG9TdHJpbmdUYWcoZ2xvYmFsLkpTT04sICdKU09OJywgdHJ1ZSk7XHJcbn0oc2FmZVN5bWJvbCgndGFnJyksIHt9LCB7fSwgdHJ1ZSk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1vZHVsZSA6IGVzNi5vYmplY3Quc3RhdGljcyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiFmdW5jdGlvbigpe1xyXG4gIHZhciBvYmplY3RTdGF0aWMgPSB7XHJcbiAgICAvLyAxOS4xLjMuMSBPYmplY3QuYXNzaWduKHRhcmdldCwgc291cmNlKVxyXG4gICAgYXNzaWduOiBhc3NpZ24sXHJcbiAgICAvLyAxOS4xLjMuMTAgT2JqZWN0LmlzKHZhbHVlMSwgdmFsdWUyKVxyXG4gICAgaXM6IGZ1bmN0aW9uKHgsIHkpe1xyXG4gICAgICByZXR1cm4geCA9PT0geSA/IHggIT09IDAgfHwgMSAvIHggPT09IDEgLyB5IDogeCAhPSB4ICYmIHkgIT0geTtcclxuICAgIH1cclxuICB9O1xyXG4gIC8vIDE5LjEuMy4xOSBPYmplY3Quc2V0UHJvdG90eXBlT2YoTywgcHJvdG8pXHJcbiAgLy8gV29ya3Mgd2l0aCBfX3Byb3RvX18gb25seS4gT2xkIHY4IGNhbid0IHdvcmtzIHdpdGggbnVsbCBwcm90byBvYmplY3RzLlxyXG4gICdfX3Byb3RvX18nIGluIE9iamVjdFByb3RvICYmIGZ1bmN0aW9uKGJ1Z2d5LCBzZXQpe1xyXG4gICAgdHJ5IHtcclxuICAgICAgc2V0ID0gY3R4KGNhbGwsIGdldE93bkRlc2NyaXB0b3IoT2JqZWN0UHJvdG8sICdfX3Byb3RvX18nKS5zZXQsIDIpO1xyXG4gICAgICBzZXQoe30sIEFycmF5UHJvdG8pO1xyXG4gICAgfSBjYXRjaChlKXsgYnVnZ3kgPSB0cnVlIH1cclxuICAgIG9iamVjdFN0YXRpYy5zZXRQcm90b3R5cGVPZiA9IHNldFByb3RvdHlwZU9mID0gc2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24oTywgcHJvdG8pe1xyXG4gICAgICBhc3NlcnRPYmplY3QoTyk7XHJcbiAgICAgIGFzc2VydChwcm90byA9PT0gbnVsbCB8fCBpc09iamVjdChwcm90byksIHByb3RvLCBcIjogY2FuJ3Qgc2V0IGFzIHByb3RvdHlwZSFcIik7XHJcbiAgICAgIGlmKGJ1Z2d5KU8uX19wcm90b19fID0gcHJvdG87XHJcbiAgICAgIGVsc2Ugc2V0KE8sIHByb3RvKTtcclxuICAgICAgcmV0dXJuIE87XHJcbiAgICB9XHJcbiAgfSgpO1xyXG4gICRkZWZpbmUoU1RBVElDLCBPQkpFQ1QsIG9iamVjdFN0YXRpYyk7XHJcbn0oKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogTW9kdWxlIDogZXM2Lm9iamVjdC5zdGF0aWNzLWFjY2VwdC1wcmltaXRpdmVzICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuIWZ1bmN0aW9uKCl7XHJcbiAgLy8gT2JqZWN0IHN0YXRpYyBtZXRob2RzIGFjY2VwdCBwcmltaXRpdmVzXHJcbiAgZnVuY3Rpb24gd3JhcE9iamVjdE1ldGhvZChrZXksIE1PREUpe1xyXG4gICAgdmFyIGZuICA9IE9iamVjdFtrZXldXHJcbiAgICAgICwgZXhwID0gY29yZVtPQkpFQ1RdW2tleV1cclxuICAgICAgLCBmICAgPSAwXHJcbiAgICAgICwgbyAgID0ge307XHJcbiAgICBpZighZXhwIHx8IGlzTmF0aXZlKGV4cCkpe1xyXG4gICAgICBvW2tleV0gPSBNT0RFID09IDEgPyBmdW5jdGlvbihpdCl7XHJcbiAgICAgICAgcmV0dXJuIGlzT2JqZWN0KGl0KSA/IGZuKGl0KSA6IGl0O1xyXG4gICAgICB9IDogTU9ERSA9PSAyID8gZnVuY3Rpb24oaXQpe1xyXG4gICAgICAgIHJldHVybiBpc09iamVjdChpdCkgPyBmbihpdCkgOiB0cnVlO1xyXG4gICAgICB9IDogTU9ERSA9PSAzID8gZnVuY3Rpb24oaXQpe1xyXG4gICAgICAgIHJldHVybiBpc09iamVjdChpdCkgPyBmbihpdCkgOiBmYWxzZTtcclxuICAgICAgfSA6IE1PREUgPT0gNCA/IGZ1bmN0aW9uKGl0LCBrZXkpe1xyXG4gICAgICAgIHJldHVybiBmbih0b09iamVjdChpdCksIGtleSk7XHJcbiAgICAgIH0gOiBmdW5jdGlvbihpdCl7XHJcbiAgICAgICAgcmV0dXJuIGZuKHRvT2JqZWN0KGl0KSk7XHJcbiAgICAgIH07XHJcbiAgICAgIHRyeSB7IGZuKERPVCkgfVxyXG4gICAgICBjYXRjaChlKXsgZiA9IDEgfVxyXG4gICAgICAkZGVmaW5lKFNUQVRJQyArIEZPUkNFRCAqIGYsIE9CSkVDVCwgbyk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHdyYXBPYmplY3RNZXRob2QoJ2ZyZWV6ZScsIDEpO1xyXG4gIHdyYXBPYmplY3RNZXRob2QoJ3NlYWwnLCAxKTtcclxuICB3cmFwT2JqZWN0TWV0aG9kKCdwcmV2ZW50RXh0ZW5zaW9ucycsIDEpO1xyXG4gIHdyYXBPYmplY3RNZXRob2QoJ2lzRnJvemVuJywgMik7XHJcbiAgd3JhcE9iamVjdE1ldGhvZCgnaXNTZWFsZWQnLCAyKTtcclxuICB3cmFwT2JqZWN0TWV0aG9kKCdpc0V4dGVuc2libGUnLCAzKTtcclxuICB3cmFwT2JqZWN0TWV0aG9kKCdnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3InLCA0KTtcclxuICB3cmFwT2JqZWN0TWV0aG9kKCdnZXRQcm90b3R5cGVPZicpO1xyXG4gIHdyYXBPYmplY3RNZXRob2QoJ2tleXMnKTtcclxuICB3cmFwT2JqZWN0TWV0aG9kKCdnZXRPd25Qcm9wZXJ0eU5hbWVzJyk7XHJcbn0oKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogTW9kdWxlIDogZXM2Lm51bWJlci5zdGF0aWNzICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuIWZ1bmN0aW9uKGlzSW50ZWdlcil7XHJcbiAgJGRlZmluZShTVEFUSUMsIE5VTUJFUiwge1xyXG4gICAgLy8gMjAuMS4yLjEgTnVtYmVyLkVQU0lMT05cclxuICAgIEVQU0lMT046IHBvdygyLCAtNTIpLFxyXG4gICAgLy8gMjAuMS4yLjIgTnVtYmVyLmlzRmluaXRlKG51bWJlcilcclxuICAgIGlzRmluaXRlOiBmdW5jdGlvbihpdCl7XHJcbiAgICAgIHJldHVybiB0eXBlb2YgaXQgPT0gJ251bWJlcicgJiYgaXNGaW5pdGUoaXQpO1xyXG4gICAgfSxcclxuICAgIC8vIDIwLjEuMi4zIE51bWJlci5pc0ludGVnZXIobnVtYmVyKVxyXG4gICAgaXNJbnRlZ2VyOiBpc0ludGVnZXIsXHJcbiAgICAvLyAyMC4xLjIuNCBOdW1iZXIuaXNOYU4obnVtYmVyKVxyXG4gICAgaXNOYU46IHNhbWVOYU4sXHJcbiAgICAvLyAyMC4xLjIuNSBOdW1iZXIuaXNTYWZlSW50ZWdlcihudW1iZXIpXHJcbiAgICBpc1NhZmVJbnRlZ2VyOiBmdW5jdGlvbihudW1iZXIpe1xyXG4gICAgICByZXR1cm4gaXNJbnRlZ2VyKG51bWJlcikgJiYgYWJzKG51bWJlcikgPD0gTUFYX1NBRkVfSU5URUdFUjtcclxuICAgIH0sXHJcbiAgICAvLyAyMC4xLjIuNiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUlxyXG4gICAgTUFYX1NBRkVfSU5URUdFUjogTUFYX1NBRkVfSU5URUdFUixcclxuICAgIC8vIDIwLjEuMi4xMCBOdW1iZXIuTUlOX1NBRkVfSU5URUdFUlxyXG4gICAgTUlOX1NBRkVfSU5URUdFUjogLU1BWF9TQUZFX0lOVEVHRVIsXHJcbiAgICAvLyAyMC4xLjIuMTIgTnVtYmVyLnBhcnNlRmxvYXQoc3RyaW5nKVxyXG4gICAgcGFyc2VGbG9hdDogcGFyc2VGbG9hdCxcclxuICAgIC8vIDIwLjEuMi4xMyBOdW1iZXIucGFyc2VJbnQoc3RyaW5nLCByYWRpeClcclxuICAgIHBhcnNlSW50OiBwYXJzZUludFxyXG4gIH0pO1xyXG4vLyAyMC4xLjIuMyBOdW1iZXIuaXNJbnRlZ2VyKG51bWJlcilcclxufShOdW1iZXIuaXNJbnRlZ2VyIHx8IGZ1bmN0aW9uKGl0KXtcclxuICByZXR1cm4gIWlzT2JqZWN0KGl0KSAmJiBpc0Zpbml0ZShpdCkgJiYgZmxvb3IoaXQpID09PSBpdDtcclxufSk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1vZHVsZSA6IGVzNi5tYXRoICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8vIEVDTUFTY3JpcHQgNiBzaGltXHJcbiFmdW5jdGlvbigpe1xyXG4gIC8vIDIwLjIuMi4yOCBNYXRoLnNpZ24oeClcclxuICB2YXIgRSAgICA9IE1hdGguRVxyXG4gICAgLCBleHAgID0gTWF0aC5leHBcclxuICAgICwgbG9nICA9IE1hdGgubG9nXHJcbiAgICAsIHNxcnQgPSBNYXRoLnNxcnRcclxuICAgICwgc2lnbiA9IE1hdGguc2lnbiB8fCBmdW5jdGlvbih4KXtcclxuICAgICAgICByZXR1cm4gKHggPSAreCkgPT0gMCB8fCB4ICE9IHggPyB4IDogeCA8IDAgPyAtMSA6IDE7XHJcbiAgICAgIH07XHJcbiAgXHJcbiAgLy8gMjAuMi4yLjUgTWF0aC5hc2luaCh4KVxyXG4gIGZ1bmN0aW9uIGFzaW5oKHgpe1xyXG4gICAgcmV0dXJuICFpc0Zpbml0ZSh4ID0gK3gpIHx8IHggPT0gMCA/IHggOiB4IDwgMCA/IC1hc2luaCgteCkgOiBsb2coeCArIHNxcnQoeCAqIHggKyAxKSk7XHJcbiAgfVxyXG4gIC8vIDIwLjIuMi4xNCBNYXRoLmV4cG0xKHgpXHJcbiAgZnVuY3Rpb24gZXhwbTEoeCl7XHJcbiAgICByZXR1cm4gKHggPSAreCkgPT0gMCA/IHggOiB4ID4gLTFlLTYgJiYgeCA8IDFlLTYgPyB4ICsgeCAqIHggLyAyIDogZXhwKHgpIC0gMTtcclxuICB9XHJcbiAgICBcclxuICAkZGVmaW5lKFNUQVRJQywgTUFUSCwge1xyXG4gICAgLy8gMjAuMi4yLjMgTWF0aC5hY29zaCh4KVxyXG4gICAgYWNvc2g6IGZ1bmN0aW9uKHgpe1xyXG4gICAgICByZXR1cm4gKHggPSAreCkgPCAxID8gTmFOIDogaXNGaW5pdGUoeCkgPyBsb2coeCAvIEUgKyBzcXJ0KHggKyAxKSAqIHNxcnQoeCAtIDEpIC8gRSkgKyAxIDogeDtcclxuICAgIH0sXHJcbiAgICAvLyAyMC4yLjIuNSBNYXRoLmFzaW5oKHgpXHJcbiAgICBhc2luaDogYXNpbmgsXHJcbiAgICAvLyAyMC4yLjIuNyBNYXRoLmF0YW5oKHgpXHJcbiAgICBhdGFuaDogZnVuY3Rpb24oeCl7XHJcbiAgICAgIHJldHVybiAoeCA9ICt4KSA9PSAwID8geCA6IGxvZygoMSArIHgpIC8gKDEgLSB4KSkgLyAyO1xyXG4gICAgfSxcclxuICAgIC8vIDIwLjIuMi45IE1hdGguY2JydCh4KVxyXG4gICAgY2JydDogZnVuY3Rpb24oeCl7XHJcbiAgICAgIHJldHVybiBzaWduKHggPSAreCkgKiBwb3coYWJzKHgpLCAxIC8gMyk7XHJcbiAgICB9LFxyXG4gICAgLy8gMjAuMi4yLjExIE1hdGguY2x6MzIoeClcclxuICAgIGNsejMyOiBmdW5jdGlvbih4KXtcclxuICAgICAgcmV0dXJuICh4ID4+Pj0gMCkgPyAzMiAtIHhbVE9fU1RSSU5HXSgyKS5sZW5ndGggOiAzMjtcclxuICAgIH0sXHJcbiAgICAvLyAyMC4yLjIuMTIgTWF0aC5jb3NoKHgpXHJcbiAgICBjb3NoOiBmdW5jdGlvbih4KXtcclxuICAgICAgcmV0dXJuIChleHAoeCA9ICt4KSArIGV4cCgteCkpIC8gMjtcclxuICAgIH0sXHJcbiAgICAvLyAyMC4yLjIuMTQgTWF0aC5leHBtMSh4KVxyXG4gICAgZXhwbTE6IGV4cG0xLFxyXG4gICAgLy8gMjAuMi4yLjE2IE1hdGguZnJvdW5kKHgpXHJcbiAgICAvLyBUT0RPOiBmYWxsYmFjayBmb3IgSUU5LVxyXG4gICAgZnJvdW5kOiBmdW5jdGlvbih4KXtcclxuICAgICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoW3hdKVswXTtcclxuICAgIH0sXHJcbiAgICAvLyAyMC4yLjIuMTcgTWF0aC5oeXBvdChbdmFsdWUxWywgdmFsdWUyWywg4oCmIF1dXSlcclxuICAgIGh5cG90OiBmdW5jdGlvbih2YWx1ZTEsIHZhbHVlMil7XHJcbiAgICAgIHZhciBzdW0gID0gMFxyXG4gICAgICAgICwgbGVuMSA9IGFyZ3VtZW50cy5sZW5ndGhcclxuICAgICAgICAsIGxlbjIgPSBsZW4xXHJcbiAgICAgICAgLCBhcmdzID0gQXJyYXkobGVuMSlcclxuICAgICAgICAsIGxhcmcgPSAtSW5maW5pdHlcclxuICAgICAgICAsIGFyZztcclxuICAgICAgd2hpbGUobGVuMS0tKXtcclxuICAgICAgICBhcmcgPSBhcmdzW2xlbjFdID0gK2FyZ3VtZW50c1tsZW4xXTtcclxuICAgICAgICBpZihhcmcgPT0gSW5maW5pdHkgfHwgYXJnID09IC1JbmZpbml0eSlyZXR1cm4gSW5maW5pdHk7XHJcbiAgICAgICAgaWYoYXJnID4gbGFyZylsYXJnID0gYXJnO1xyXG4gICAgICB9XHJcbiAgICAgIGxhcmcgPSBhcmcgfHwgMTtcclxuICAgICAgd2hpbGUobGVuMi0tKXN1bSArPSBwb3coYXJnc1tsZW4yXSAvIGxhcmcsIDIpO1xyXG4gICAgICByZXR1cm4gbGFyZyAqIHNxcnQoc3VtKTtcclxuICAgIH0sXHJcbiAgICAvLyAyMC4yLjIuMTggTWF0aC5pbXVsKHgsIHkpXHJcbiAgICBpbXVsOiBmdW5jdGlvbih4LCB5KXtcclxuICAgICAgdmFyIFVJbnQxNiA9IDB4ZmZmZlxyXG4gICAgICAgICwgeG4gPSAreFxyXG4gICAgICAgICwgeW4gPSAreVxyXG4gICAgICAgICwgeGwgPSBVSW50MTYgJiB4blxyXG4gICAgICAgICwgeWwgPSBVSW50MTYgJiB5bjtcclxuICAgICAgcmV0dXJuIDAgfCB4bCAqIHlsICsgKChVSW50MTYgJiB4biA+Pj4gMTYpICogeWwgKyB4bCAqIChVSW50MTYgJiB5biA+Pj4gMTYpIDw8IDE2ID4+PiAwKTtcclxuICAgIH0sXHJcbiAgICAvLyAyMC4yLjIuMjAgTWF0aC5sb2cxcCh4KVxyXG4gICAgbG9nMXA6IGZ1bmN0aW9uKHgpe1xyXG4gICAgICByZXR1cm4gKHggPSAreCkgPiAtMWUtOCAmJiB4IDwgMWUtOCA/IHggLSB4ICogeCAvIDIgOiBsb2coMSArIHgpO1xyXG4gICAgfSxcclxuICAgIC8vIDIwLjIuMi4yMSBNYXRoLmxvZzEwKHgpXHJcbiAgICBsb2cxMDogZnVuY3Rpb24oeCl7XHJcbiAgICAgIHJldHVybiBsb2coeCkgLyBNYXRoLkxOMTA7XHJcbiAgICB9LFxyXG4gICAgLy8gMjAuMi4yLjIyIE1hdGgubG9nMih4KVxyXG4gICAgbG9nMjogZnVuY3Rpb24oeCl7XHJcbiAgICAgIHJldHVybiBsb2coeCkgLyBNYXRoLkxOMjtcclxuICAgIH0sXHJcbiAgICAvLyAyMC4yLjIuMjggTWF0aC5zaWduKHgpXHJcbiAgICBzaWduOiBzaWduLFxyXG4gICAgLy8gMjAuMi4yLjMwIE1hdGguc2luaCh4KVxyXG4gICAgc2luaDogZnVuY3Rpb24oeCl7XHJcbiAgICAgIHJldHVybiAoYWJzKHggPSAreCkgPCAxKSA/IChleHBtMSh4KSAtIGV4cG0xKC14KSkgLyAyIDogKGV4cCh4IC0gMSkgLSBleHAoLXggLSAxKSkgKiAoRSAvIDIpO1xyXG4gICAgfSxcclxuICAgIC8vIDIwLjIuMi4zMyBNYXRoLnRhbmgoeClcclxuICAgIHRhbmg6IGZ1bmN0aW9uKHgpe1xyXG4gICAgICB2YXIgYSA9IGV4cG0xKHggPSAreClcclxuICAgICAgICAsIGIgPSBleHBtMSgteCk7XHJcbiAgICAgIHJldHVybiBhID09IEluZmluaXR5ID8gMSA6IGIgPT0gSW5maW5pdHkgPyAtMSA6IChhIC0gYikgLyAoZXhwKHgpICsgZXhwKC14KSk7XHJcbiAgICB9LFxyXG4gICAgLy8gMjAuMi4yLjM0IE1hdGgudHJ1bmMoeClcclxuICAgIHRydW5jOiB0cnVuY1xyXG4gIH0pO1xyXG59KCk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1vZHVsZSA6IGVzNi5zdHJpbmcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiFmdW5jdGlvbihmcm9tQ2hhckNvZGUpe1xyXG4gIGZ1bmN0aW9uIGFzc2VydE5vdFJlZ0V4cChpdCl7XHJcbiAgICBpZihjb2YoaXQpID09IFJFR0VYUCl0aHJvdyBUeXBlRXJyb3IoKTtcclxuICB9XHJcbiAgXHJcbiAgJGRlZmluZShTVEFUSUMsIFNUUklORywge1xyXG4gICAgLy8gMjEuMS4yLjIgU3RyaW5nLmZyb21Db2RlUG9pbnQoLi4uY29kZVBvaW50cylcclxuICAgIGZyb21Db2RlUG9pbnQ6IGZ1bmN0aW9uKHgpe1xyXG4gICAgICB2YXIgcmVzID0gW11cclxuICAgICAgICAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGhcclxuICAgICAgICAsIGkgICA9IDBcclxuICAgICAgICAsIGNvZGVcclxuICAgICAgd2hpbGUobGVuID4gaSl7XHJcbiAgICAgICAgY29kZSA9ICthcmd1bWVudHNbaSsrXTtcclxuICAgICAgICBpZih0b0luZGV4KGNvZGUsIDB4MTBmZmZmKSAhPT0gY29kZSl0aHJvdyBSYW5nZUVycm9yKGNvZGUgKyAnIGlzIG5vdCBhIHZhbGlkIGNvZGUgcG9pbnQnKTtcclxuICAgICAgICByZXMucHVzaChjb2RlIDwgMHgxMDAwMFxyXG4gICAgICAgICAgPyBmcm9tQ2hhckNvZGUoY29kZSlcclxuICAgICAgICAgIDogZnJvbUNoYXJDb2RlKCgoY29kZSAtPSAweDEwMDAwKSA+PiAxMCkgKyAweGQ4MDAsIGNvZGUgJSAweDQwMCArIDB4ZGMwMClcclxuICAgICAgICApO1xyXG4gICAgICB9IHJldHVybiByZXMuam9pbignJyk7XHJcbiAgICB9LFxyXG4gICAgLy8gMjEuMS4yLjQgU3RyaW5nLnJhdyhjYWxsU2l0ZSwgLi4uc3Vic3RpdHV0aW9ucylcclxuICAgIHJhdzogZnVuY3Rpb24oY2FsbFNpdGUpe1xyXG4gICAgICB2YXIgcmF3ID0gdG9PYmplY3QoY2FsbFNpdGUucmF3KVxyXG4gICAgICAgICwgbGVuID0gdG9MZW5ndGgocmF3Lmxlbmd0aClcclxuICAgICAgICAsIHNsbiA9IGFyZ3VtZW50cy5sZW5ndGhcclxuICAgICAgICAsIHJlcyA9IFtdXHJcbiAgICAgICAgLCBpICAgPSAwO1xyXG4gICAgICB3aGlsZShsZW4gPiBpKXtcclxuICAgICAgICByZXMucHVzaChTdHJpbmcocmF3W2krK10pKTtcclxuICAgICAgICBpZihpIDwgc2xuKXJlcy5wdXNoKFN0cmluZyhhcmd1bWVudHNbaV0pKTtcclxuICAgICAgfSByZXR1cm4gcmVzLmpvaW4oJycpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIFxyXG4gICRkZWZpbmUoUFJPVE8sIFNUUklORywge1xyXG4gICAgLy8gMjEuMS4zLjMgU3RyaW5nLnByb3RvdHlwZS5jb2RlUG9pbnRBdChwb3MpXHJcbiAgICBjb2RlUG9pbnRBdDogY3JlYXRlUG9pbnRBdChmYWxzZSksXHJcbiAgICAvLyAyMS4xLjMuNiBTdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoKHNlYXJjaFN0cmluZyBbLCBlbmRQb3NpdGlvbl0pXHJcbiAgICBlbmRzV2l0aDogZnVuY3Rpb24oc2VhcmNoU3RyaW5nIC8qLCBlbmRQb3NpdGlvbiA9IEBsZW5ndGggKi8pe1xyXG4gICAgICBhc3NlcnROb3RSZWdFeHAoc2VhcmNoU3RyaW5nKTtcclxuICAgICAgdmFyIHRoYXQgPSBTdHJpbmcoYXNzZXJ0RGVmaW5lZCh0aGlzKSlcclxuICAgICAgICAsIGVuZFBvc2l0aW9uID0gYXJndW1lbnRzWzFdXHJcbiAgICAgICAgLCBsZW4gPSB0b0xlbmd0aCh0aGF0Lmxlbmd0aClcclxuICAgICAgICAsIGVuZCA9IGVuZFBvc2l0aW9uID09PSB1bmRlZmluZWQgPyBsZW4gOiBtaW4odG9MZW5ndGgoZW5kUG9zaXRpb24pLCBsZW4pO1xyXG4gICAgICBzZWFyY2hTdHJpbmcgKz0gJyc7XHJcbiAgICAgIHJldHVybiB0aGF0LnNsaWNlKGVuZCAtIHNlYXJjaFN0cmluZy5sZW5ndGgsIGVuZCkgPT09IHNlYXJjaFN0cmluZztcclxuICAgIH0sXHJcbiAgICAvLyAyMS4xLjMuNyBTdHJpbmcucHJvdG90eXBlLmluY2x1ZGVzKHNlYXJjaFN0cmluZywgcG9zaXRpb24gPSAwKVxyXG4gICAgaW5jbHVkZXM6IGZ1bmN0aW9uKHNlYXJjaFN0cmluZyAvKiwgcG9zaXRpb24gPSAwICovKXtcclxuICAgICAgYXNzZXJ0Tm90UmVnRXhwKHNlYXJjaFN0cmluZyk7XHJcbiAgICAgIHJldHVybiAhIX5TdHJpbmcoYXNzZXJ0RGVmaW5lZCh0aGlzKSkuaW5kZXhPZihzZWFyY2hTdHJpbmcsIGFyZ3VtZW50c1sxXSk7XHJcbiAgICB9LFxyXG4gICAgLy8gMjEuMS4zLjEzIFN0cmluZy5wcm90b3R5cGUucmVwZWF0KGNvdW50KVxyXG4gICAgcmVwZWF0OiBmdW5jdGlvbihjb3VudCl7XHJcbiAgICAgIHZhciBzdHIgPSBTdHJpbmcoYXNzZXJ0RGVmaW5lZCh0aGlzKSlcclxuICAgICAgICAsIHJlcyA9ICcnXHJcbiAgICAgICAgLCBuICAgPSB0b0ludGVnZXIoY291bnQpO1xyXG4gICAgICBpZigwID4gbiB8fCBuID09IEluZmluaXR5KXRocm93IFJhbmdlRXJyb3IoXCJDb3VudCBjYW4ndCBiZSBuZWdhdGl2ZVwiKTtcclxuICAgICAgZm9yKDtuID4gMDsgKG4gPj4+PSAxKSAmJiAoc3RyICs9IHN0cikpaWYobiAmIDEpcmVzICs9IHN0cjtcclxuICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0sXHJcbiAgICAvLyAyMS4xLjMuMTggU3RyaW5nLnByb3RvdHlwZS5zdGFydHNXaXRoKHNlYXJjaFN0cmluZyBbLCBwb3NpdGlvbiBdKVxyXG4gICAgc3RhcnRzV2l0aDogZnVuY3Rpb24oc2VhcmNoU3RyaW5nIC8qLCBwb3NpdGlvbiA9IDAgKi8pe1xyXG4gICAgICBhc3NlcnROb3RSZWdFeHAoc2VhcmNoU3RyaW5nKTtcclxuICAgICAgdmFyIHRoYXQgID0gU3RyaW5nKGFzc2VydERlZmluZWQodGhpcykpXHJcbiAgICAgICAgLCBpbmRleCA9IHRvTGVuZ3RoKG1pbihhcmd1bWVudHNbMV0sIHRoYXQubGVuZ3RoKSk7XHJcbiAgICAgIHNlYXJjaFN0cmluZyArPSAnJztcclxuICAgICAgcmV0dXJuIHRoYXQuc2xpY2UoaW5kZXgsIGluZGV4ICsgc2VhcmNoU3RyaW5nLmxlbmd0aCkgPT09IHNlYXJjaFN0cmluZztcclxuICAgIH1cclxuICB9KTtcclxufShTdHJpbmcuZnJvbUNoYXJDb2RlKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogTW9kdWxlIDogZXM2LmFycmF5LnN0YXRpY3MgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuIWZ1bmN0aW9uKCl7XHJcbiAgJGRlZmluZShTVEFUSUMgKyBGT1JDRUQgKiBjaGVja0Rhbmdlckl0ZXJDbG9zaW5nKEFycmF5LmZyb20pLCBBUlJBWSwge1xyXG4gICAgLy8gMjIuMS4yLjEgQXJyYXkuZnJvbShhcnJheUxpa2UsIG1hcGZuID0gdW5kZWZpbmVkLCB0aGlzQXJnID0gdW5kZWZpbmVkKVxyXG4gICAgZnJvbTogZnVuY3Rpb24oYXJyYXlMaWtlLyosIG1hcGZuID0gdW5kZWZpbmVkLCB0aGlzQXJnID0gdW5kZWZpbmVkKi8pe1xyXG4gICAgICB2YXIgTyAgICAgICA9IE9iamVjdChhc3NlcnREZWZpbmVkKGFycmF5TGlrZSkpXHJcbiAgICAgICAgLCBtYXBmbiAgID0gYXJndW1lbnRzWzFdXHJcbiAgICAgICAgLCBtYXBwaW5nID0gbWFwZm4gIT09IHVuZGVmaW5lZFxyXG4gICAgICAgICwgZiAgICAgICA9IG1hcHBpbmcgPyBjdHgobWFwZm4sIGFyZ3VtZW50c1syXSwgMikgOiB1bmRlZmluZWRcclxuICAgICAgICAsIGluZGV4ICAgPSAwXHJcbiAgICAgICAgLCBsZW5ndGgsIHJlc3VsdCwgc3RlcDtcclxuICAgICAgaWYoaXNJdGVyYWJsZShPKSl7XHJcbiAgICAgICAgcmVzdWx0ID0gbmV3IChnZW5lcmljKHRoaXMsIEFycmF5KSk7XHJcbiAgICAgICAgc2FmZUl0ZXJDbG9zZShmdW5jdGlvbihpdGVyYXRvcil7XHJcbiAgICAgICAgICBmb3IoOyAhKHN0ZXAgPSBpdGVyYXRvci5uZXh0KCkpLmRvbmU7IGluZGV4Kyspe1xyXG4gICAgICAgICAgICByZXN1bHRbaW5kZXhdID0gbWFwcGluZyA/IGYoc3RlcC52YWx1ZSwgaW5kZXgpIDogc3RlcC52YWx1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCBnZXRJdGVyYXRvcihPKSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0ID0gbmV3IChnZW5lcmljKHRoaXMsIEFycmF5KSkobGVuZ3RoID0gdG9MZW5ndGgoTy5sZW5ndGgpKTtcclxuICAgICAgICBmb3IoOyBsZW5ndGggPiBpbmRleDsgaW5kZXgrKyl7XHJcbiAgICAgICAgICByZXN1bHRbaW5kZXhdID0gbWFwcGluZyA/IGYoT1tpbmRleF0sIGluZGV4KSA6IE9baW5kZXhdO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXN1bHQubGVuZ3RoID0gaW5kZXg7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgXHJcbiAgJGRlZmluZShTVEFUSUMsIEFSUkFZLCB7XHJcbiAgICAvLyAyMi4xLjIuMyBBcnJheS5vZiggLi4uaXRlbXMpXHJcbiAgICBvZjogZnVuY3Rpb24oLyogLi4uYXJncyAqLyl7XHJcbiAgICAgIHZhciBpbmRleCAgPSAwXHJcbiAgICAgICAgLCBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoXHJcbiAgICAgICAgLCByZXN1bHQgPSBuZXcgKGdlbmVyaWModGhpcywgQXJyYXkpKShsZW5ndGgpO1xyXG4gICAgICB3aGlsZShsZW5ndGggPiBpbmRleClyZXN1bHRbaW5kZXhdID0gYXJndW1lbnRzW2luZGV4KytdO1xyXG4gICAgICByZXN1bHQubGVuZ3RoID0gbGVuZ3RoO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIFxyXG4gIHNldFNwZWNpZXMoQXJyYXkpO1xyXG59KCk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1vZHVsZSA6IGVzNi5hcnJheS5wcm90b3R5cGUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiFmdW5jdGlvbigpe1xyXG4gICRkZWZpbmUoUFJPVE8sIEFSUkFZLCB7XHJcbiAgICAvLyAyMi4xLjMuMyBBcnJheS5wcm90b3R5cGUuY29weVdpdGhpbih0YXJnZXQsIHN0YXJ0LCBlbmQgPSB0aGlzLmxlbmd0aClcclxuICAgIGNvcHlXaXRoaW46IGZ1bmN0aW9uKHRhcmdldCAvKiA9IDAgKi8sIHN0YXJ0IC8qID0gMCwgZW5kID0gQGxlbmd0aCAqLyl7XHJcbiAgICAgIHZhciBPICAgICA9IE9iamVjdChhc3NlcnREZWZpbmVkKHRoaXMpKVxyXG4gICAgICAgICwgbGVuICAgPSB0b0xlbmd0aChPLmxlbmd0aClcclxuICAgICAgICAsIHRvICAgID0gdG9JbmRleCh0YXJnZXQsIGxlbilcclxuICAgICAgICAsIGZyb20gID0gdG9JbmRleChzdGFydCwgbGVuKVxyXG4gICAgICAgICwgZW5kICAgPSBhcmd1bWVudHNbMl1cclxuICAgICAgICAsIGZpbiAgID0gZW5kID09PSB1bmRlZmluZWQgPyBsZW4gOiB0b0luZGV4KGVuZCwgbGVuKVxyXG4gICAgICAgICwgY291bnQgPSBtaW4oZmluIC0gZnJvbSwgbGVuIC0gdG8pXHJcbiAgICAgICAgLCBpbmMgICA9IDE7XHJcbiAgICAgIGlmKGZyb20gPCB0byAmJiB0byA8IGZyb20gKyBjb3VudCl7XHJcbiAgICAgICAgaW5jICA9IC0xO1xyXG4gICAgICAgIGZyb20gPSBmcm9tICsgY291bnQgLSAxO1xyXG4gICAgICAgIHRvICAgPSB0byArIGNvdW50IC0gMTtcclxuICAgICAgfVxyXG4gICAgICB3aGlsZShjb3VudC0tID4gMCl7XHJcbiAgICAgICAgaWYoZnJvbSBpbiBPKU9bdG9dID0gT1tmcm9tXTtcclxuICAgICAgICBlbHNlIGRlbGV0ZSBPW3RvXTtcclxuICAgICAgICB0byArPSBpbmM7XHJcbiAgICAgICAgZnJvbSArPSBpbmM7XHJcbiAgICAgIH0gcmV0dXJuIE87XHJcbiAgICB9LFxyXG4gICAgLy8gMjIuMS4zLjYgQXJyYXkucHJvdG90eXBlLmZpbGwodmFsdWUsIHN0YXJ0ID0gMCwgZW5kID0gdGhpcy5sZW5ndGgpXHJcbiAgICBmaWxsOiBmdW5jdGlvbih2YWx1ZSAvKiwgc3RhcnQgPSAwLCBlbmQgPSBAbGVuZ3RoICovKXtcclxuICAgICAgdmFyIE8gICAgICA9IE9iamVjdChhc3NlcnREZWZpbmVkKHRoaXMpKVxyXG4gICAgICAgICwgbGVuZ3RoID0gdG9MZW5ndGgoTy5sZW5ndGgpXHJcbiAgICAgICAgLCBpbmRleCAgPSB0b0luZGV4KGFyZ3VtZW50c1sxXSwgbGVuZ3RoKVxyXG4gICAgICAgICwgZW5kICAgID0gYXJndW1lbnRzWzJdXHJcbiAgICAgICAgLCBlbmRQb3MgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbmd0aCA6IHRvSW5kZXgoZW5kLCBsZW5ndGgpO1xyXG4gICAgICB3aGlsZShlbmRQb3MgPiBpbmRleClPW2luZGV4KytdID0gdmFsdWU7XHJcbiAgICAgIHJldHVybiBPO1xyXG4gICAgfSxcclxuICAgIC8vIDIyLjEuMy44IEFycmF5LnByb3RvdHlwZS5maW5kKHByZWRpY2F0ZSwgdGhpc0FyZyA9IHVuZGVmaW5lZClcclxuICAgIGZpbmQ6IGNyZWF0ZUFycmF5TWV0aG9kKDUpLFxyXG4gICAgLy8gMjIuMS4zLjkgQXJyYXkucHJvdG90eXBlLmZpbmRJbmRleChwcmVkaWNhdGUsIHRoaXNBcmcgPSB1bmRlZmluZWQpXHJcbiAgICBmaW5kSW5kZXg6IGNyZWF0ZUFycmF5TWV0aG9kKDYpXHJcbiAgfSk7XHJcbiAgXHJcbiAgaWYoZnJhbWV3b3JrKXtcclxuICAgIC8vIDIyLjEuMy4zMSBBcnJheS5wcm90b3R5cGVbQEB1bnNjb3BhYmxlc11cclxuICAgIGZvckVhY2guY2FsbChhcnJheSgnZmluZCxmaW5kSW5kZXgsZmlsbCxjb3B5V2l0aGluLGVudHJpZXMsa2V5cyx2YWx1ZXMnKSwgZnVuY3Rpb24oaXQpe1xyXG4gICAgICBBcnJheVVuc2NvcGFibGVzW2l0XSA9IHRydWU7XHJcbiAgICB9KTtcclxuICAgIFNZTUJPTF9VTlNDT1BBQkxFUyBpbiBBcnJheVByb3RvIHx8IGhpZGRlbihBcnJheVByb3RvLCBTWU1CT0xfVU5TQ09QQUJMRVMsIEFycmF5VW5zY29wYWJsZXMpO1xyXG4gIH1cclxufSgpO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBNb2R1bGUgOiBlczYuaXRlcmF0b3JzICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4hZnVuY3Rpb24oYXQpe1xyXG4gIC8vIDIyLjEuMy40IEFycmF5LnByb3RvdHlwZS5lbnRyaWVzKClcclxuICAvLyAyMi4xLjMuMTMgQXJyYXkucHJvdG90eXBlLmtleXMoKVxyXG4gIC8vIDIyLjEuMy4yOSBBcnJheS5wcm90b3R5cGUudmFsdWVzKClcclxuICAvLyAyMi4xLjMuMzAgQXJyYXkucHJvdG90eXBlW0BAaXRlcmF0b3JdKClcclxuICBkZWZpbmVTdGRJdGVyYXRvcnMoQXJyYXksIEFSUkFZLCBmdW5jdGlvbihpdGVyYXRlZCwga2luZCl7XHJcbiAgICBzZXQodGhpcywgSVRFUiwge286IHRvT2JqZWN0KGl0ZXJhdGVkKSwgaTogMCwgazoga2luZH0pO1xyXG4gIC8vIDIyLjEuNS4yLjEgJUFycmF5SXRlcmF0b3JQcm90b3R5cGUlLm5leHQoKVxyXG4gIH0sIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgaXRlciAgPSB0aGlzW0lURVJdXHJcbiAgICAgICwgTyAgICAgPSBpdGVyLm9cclxuICAgICAgLCBraW5kICA9IGl0ZXIua1xyXG4gICAgICAsIGluZGV4ID0gaXRlci5pKys7XHJcbiAgICBpZighTyB8fCBpbmRleCA+PSBPLmxlbmd0aCl7XHJcbiAgICAgIGl0ZXIubyA9IHVuZGVmaW5lZDtcclxuICAgICAgcmV0dXJuIGl0ZXJSZXN1bHQoMSk7XHJcbiAgICB9XHJcbiAgICBpZihraW5kID09IEtFWSkgIHJldHVybiBpdGVyUmVzdWx0KDAsIGluZGV4KTtcclxuICAgIGlmKGtpbmQgPT0gVkFMVUUpcmV0dXJuIGl0ZXJSZXN1bHQoMCwgT1tpbmRleF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlclJlc3VsdCgwLCBbaW5kZXgsIE9baW5kZXhdXSk7XHJcbiAgfSwgVkFMVUUpO1xyXG4gIFxyXG4gIC8vIGFyZ3VtZW50c0xpc3RbQEBpdGVyYXRvcl0gaXMgJUFycmF5UHJvdG9fdmFsdWVzJSAoOS40LjQuNiwgOS40LjQuNylcclxuICBJdGVyYXRvcnNbQVJHVU1FTlRTXSA9IEl0ZXJhdG9yc1tBUlJBWV07XHJcbiAgXHJcbiAgLy8gMjEuMS4zLjI3IFN0cmluZy5wcm90b3R5cGVbQEBpdGVyYXRvcl0oKVxyXG4gIGRlZmluZVN0ZEl0ZXJhdG9ycyhTdHJpbmcsIFNUUklORywgZnVuY3Rpb24oaXRlcmF0ZWQpe1xyXG4gICAgc2V0KHRoaXMsIElURVIsIHtvOiBTdHJpbmcoaXRlcmF0ZWQpLCBpOiAwfSk7XHJcbiAgLy8gMjEuMS41LjIuMSAlU3RyaW5nSXRlcmF0b3JQcm90b3R5cGUlLm5leHQoKVxyXG4gIH0sIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgaXRlciAgPSB0aGlzW0lURVJdXHJcbiAgICAgICwgTyAgICAgPSBpdGVyLm9cclxuICAgICAgLCBpbmRleCA9IGl0ZXIuaVxyXG4gICAgICAsIHBvaW50O1xyXG4gICAgaWYoaW5kZXggPj0gTy5sZW5ndGgpcmV0dXJuIGl0ZXJSZXN1bHQoMSk7XHJcbiAgICBwb2ludCA9IGF0LmNhbGwoTywgaW5kZXgpO1xyXG4gICAgaXRlci5pICs9IHBvaW50Lmxlbmd0aDtcclxuICAgIHJldHVybiBpdGVyUmVzdWx0KDAsIHBvaW50KTtcclxuICB9KTtcclxufShjcmVhdGVQb2ludEF0KHRydWUpKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogTW9kdWxlIDogd2ViLmltbWVkaWF0ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLy8gc2V0SW1tZWRpYXRlIHNoaW1cclxuLy8gTm9kZS5qcyAwLjkrICYgSUUxMCsgaGFzIHNldEltbWVkaWF0ZSwgZWxzZTpcclxuaXNGdW5jdGlvbihzZXRJbW1lZGlhdGUpICYmIGlzRnVuY3Rpb24oY2xlYXJJbW1lZGlhdGUpIHx8IGZ1bmN0aW9uKE9OUkVBRFlTVEFURUNIQU5HRSl7XHJcbiAgdmFyIHBvc3RNZXNzYWdlICAgICAgPSBnbG9iYWwucG9zdE1lc3NhZ2VcclxuICAgICwgYWRkRXZlbnRMaXN0ZW5lciA9IGdsb2JhbC5hZGRFdmVudExpc3RlbmVyXHJcbiAgICAsIE1lc3NhZ2VDaGFubmVsICAgPSBnbG9iYWwuTWVzc2FnZUNoYW5uZWxcclxuICAgICwgY291bnRlciAgICAgICAgICA9IDBcclxuICAgICwgcXVldWUgICAgICAgICAgICA9IHt9XHJcbiAgICAsIGRlZmVyLCBjaGFubmVsLCBwb3J0O1xyXG4gIHNldEltbWVkaWF0ZSA9IGZ1bmN0aW9uKGZuKXtcclxuICAgIHZhciBhcmdzID0gW10sIGkgPSAxO1xyXG4gICAgd2hpbGUoYXJndW1lbnRzLmxlbmd0aCA+IGkpYXJncy5wdXNoKGFyZ3VtZW50c1tpKytdKTtcclxuICAgIHF1ZXVlWysrY291bnRlcl0gPSBmdW5jdGlvbigpe1xyXG4gICAgICBpbnZva2UoaXNGdW5jdGlvbihmbikgPyBmbiA6IEZ1bmN0aW9uKGZuKSwgYXJncyk7XHJcbiAgICB9XHJcbiAgICBkZWZlcihjb3VudGVyKTtcclxuICAgIHJldHVybiBjb3VudGVyO1xyXG4gIH1cclxuICBjbGVhckltbWVkaWF0ZSA9IGZ1bmN0aW9uKGlkKXtcclxuICAgIGRlbGV0ZSBxdWV1ZVtpZF07XHJcbiAgfVxyXG4gIGZ1bmN0aW9uIHJ1bihpZCl7XHJcbiAgICBpZihoYXMocXVldWUsIGlkKSl7XHJcbiAgICAgIHZhciBmbiA9IHF1ZXVlW2lkXTtcclxuICAgICAgZGVsZXRlIHF1ZXVlW2lkXTtcclxuICAgICAgZm4oKTtcclxuICAgIH1cclxuICB9XHJcbiAgZnVuY3Rpb24gbGlzdG5lcihldmVudCl7XHJcbiAgICBydW4oZXZlbnQuZGF0YSk7XHJcbiAgfVxyXG4gIC8vIE5vZGUuanMgMC44LVxyXG4gIGlmKE5PREUpe1xyXG4gICAgZGVmZXIgPSBmdW5jdGlvbihpZCl7XHJcbiAgICAgIG5leHRUaWNrKHBhcnQuY2FsbChydW4sIGlkKSk7XHJcbiAgICB9XHJcbiAgLy8gTW9kZXJuIGJyb3dzZXJzLCBza2lwIGltcGxlbWVudGF0aW9uIGZvciBXZWJXb3JrZXJzXHJcbiAgLy8gSUU4IGhhcyBwb3N0TWVzc2FnZSwgYnV0IGl0J3Mgc3luYyAmIHR5cGVvZiBpdHMgcG9zdE1lc3NhZ2UgaXMgb2JqZWN0XHJcbiAgfSBlbHNlIGlmKGFkZEV2ZW50TGlzdGVuZXIgJiYgaXNGdW5jdGlvbihwb3N0TWVzc2FnZSkgJiYgIWdsb2JhbC5pbXBvcnRTY3JpcHRzKXtcclxuICAgIGRlZmVyID0gZnVuY3Rpb24oaWQpe1xyXG4gICAgICBwb3N0TWVzc2FnZShpZCwgJyonKTtcclxuICAgIH1cclxuICAgIGFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBsaXN0bmVyLCBmYWxzZSk7XHJcbiAgLy8gV2ViV29ya2Vyc1xyXG4gIH0gZWxzZSBpZihpc0Z1bmN0aW9uKE1lc3NhZ2VDaGFubmVsKSl7XHJcbiAgICBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsO1xyXG4gICAgcG9ydCAgICA9IGNoYW5uZWwucG9ydDI7XHJcbiAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGxpc3RuZXI7XHJcbiAgICBkZWZlciA9IGN0eChwb3J0LnBvc3RNZXNzYWdlLCBwb3J0LCAxKTtcclxuICAvLyBJRTgtXHJcbiAgfSBlbHNlIGlmKGRvY3VtZW50ICYmIE9OUkVBRFlTVEFURUNIQU5HRSBpbiBkb2N1bWVudFtDUkVBVEVfRUxFTUVOVF0oJ3NjcmlwdCcpKXtcclxuICAgIGRlZmVyID0gZnVuY3Rpb24oaWQpe1xyXG4gICAgICBodG1sLmFwcGVuZENoaWxkKGRvY3VtZW50W0NSRUFURV9FTEVNRU5UXSgnc2NyaXB0JykpW09OUkVBRFlTVEFURUNIQU5HRV0gPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIGh0bWwucmVtb3ZlQ2hpbGQodGhpcyk7XHJcbiAgICAgICAgcnVuKGlkKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIC8vIFJlc3Qgb2xkIGJyb3dzZXJzXHJcbiAgfSBlbHNlIHtcclxuICAgIGRlZmVyID0gZnVuY3Rpb24oaWQpe1xyXG4gICAgICBzZXRUaW1lb3V0KHJ1biwgMCwgaWQpO1xyXG4gICAgfVxyXG4gIH1cclxufSgnb25yZWFkeXN0YXRlY2hhbmdlJyk7XHJcbiRkZWZpbmUoR0xPQkFMICsgQklORCwge1xyXG4gIHNldEltbWVkaWF0ZTogICBzZXRJbW1lZGlhdGUsXHJcbiAgY2xlYXJJbW1lZGlhdGU6IGNsZWFySW1tZWRpYXRlXHJcbn0pO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBNb2R1bGUgOiBlczYucHJvbWlzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vLyBFUzYgcHJvbWlzZXMgc2hpbVxyXG4vLyBCYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vZ2V0aWZ5L25hdGl2ZS1wcm9taXNlLW9ubHkvXHJcbiFmdW5jdGlvbihQcm9taXNlLCB0ZXN0KXtcclxuICBpc0Z1bmN0aW9uKFByb21pc2UpICYmIGlzRnVuY3Rpb24oUHJvbWlzZS5yZXNvbHZlKVxyXG4gICYmIFByb21pc2UucmVzb2x2ZSh0ZXN0ID0gbmV3IFByb21pc2UoZnVuY3Rpb24oKXt9KSkgPT0gdGVzdFxyXG4gIHx8IGZ1bmN0aW9uKGFzYXAsIFJFQ09SRCl7XHJcbiAgICBmdW5jdGlvbiBpc1RoZW5hYmxlKGl0KXtcclxuICAgICAgdmFyIHRoZW47XHJcbiAgICAgIGlmKGlzT2JqZWN0KGl0KSl0aGVuID0gaXQudGhlbjtcclxuICAgICAgcmV0dXJuIGlzRnVuY3Rpb24odGhlbikgPyB0aGVuIDogZmFsc2U7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBoYW5kbGVkUmVqZWN0aW9uT3JIYXNPblJlamVjdGVkKHByb21pc2Upe1xyXG4gICAgICB2YXIgcmVjb3JkID0gcHJvbWlzZVtSRUNPUkRdXHJcbiAgICAgICAgLCBjaGFpbiAgPSByZWNvcmQuY1xyXG4gICAgICAgICwgaSAgICAgID0gMFxyXG4gICAgICAgICwgcmVhY3Q7XHJcbiAgICAgIGlmKHJlY29yZC5oKXJldHVybiB0cnVlO1xyXG4gICAgICB3aGlsZShjaGFpbi5sZW5ndGggPiBpKXtcclxuICAgICAgICByZWFjdCA9IGNoYWluW2krK107XHJcbiAgICAgICAgaWYocmVhY3QuZmFpbCB8fCBoYW5kbGVkUmVqZWN0aW9uT3JIYXNPblJlamVjdGVkKHJlYWN0LlApKXJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBub3RpZnkocmVjb3JkLCByZWplY3Qpe1xyXG4gICAgICB2YXIgY2hhaW4gPSByZWNvcmQuYztcclxuICAgICAgaWYocmVqZWN0IHx8IGNoYWluLmxlbmd0aClhc2FwKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdmFyIHByb21pc2UgPSByZWNvcmQucFxyXG4gICAgICAgICAgLCB2YWx1ZSAgID0gcmVjb3JkLnZcclxuICAgICAgICAgICwgb2sgICAgICA9IHJlY29yZC5zID09IDFcclxuICAgICAgICAgICwgaSAgICAgICA9IDA7XHJcbiAgICAgICAgaWYocmVqZWN0ICYmICFoYW5kbGVkUmVqZWN0aW9uT3JIYXNPblJlamVjdGVkKHByb21pc2UpKXtcclxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgaWYoIWhhbmRsZWRSZWplY3Rpb25Pckhhc09uUmVqZWN0ZWQocHJvbWlzZSkpe1xyXG4gICAgICAgICAgICAgIGlmKE5PREUpe1xyXG4gICAgICAgICAgICAgICAgaWYoIXByb2Nlc3MuZW1pdCgndW5oYW5kbGVkUmVqZWN0aW9uJywgdmFsdWUsIHByb21pc2UpKXtcclxuICAgICAgICAgICAgICAgICAgLy8gZGVmYXVsdCBub2RlLmpzIGJlaGF2aW9yXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmKGlzRnVuY3Rpb24oY29uc29sZS5lcnJvcikpe1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignVW5oYW5kbGVkIHByb21pc2UgcmVqZWN0aW9uJywgdmFsdWUpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgMWUzKTtcclxuICAgICAgICB9IGVsc2Ugd2hpbGUoY2hhaW4ubGVuZ3RoID4gaSkhZnVuY3Rpb24ocmVhY3Qpe1xyXG4gICAgICAgICAgdmFyIGNiID0gb2sgPyByZWFjdC5vayA6IHJlYWN0LmZhaWxcclxuICAgICAgICAgICAgLCByZXQsIHRoZW47XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZihjYil7XHJcbiAgICAgICAgICAgICAgaWYoIW9rKXJlY29yZC5oID0gdHJ1ZTtcclxuICAgICAgICAgICAgICByZXQgPSBjYiA9PT0gdHJ1ZSA/IHZhbHVlIDogY2IodmFsdWUpO1xyXG4gICAgICAgICAgICAgIGlmKHJldCA9PT0gcmVhY3QuUCl7XHJcbiAgICAgICAgICAgICAgICByZWFjdC5yZWooVHlwZUVycm9yKFBST01JU0UgKyAnLWNoYWluIGN5Y2xlJykpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZih0aGVuID0gaXNUaGVuYWJsZShyZXQpKXtcclxuICAgICAgICAgICAgICAgIHRoZW4uY2FsbChyZXQsIHJlYWN0LnJlcywgcmVhY3QucmVqKTtcclxuICAgICAgICAgICAgICB9IGVsc2UgcmVhY3QucmVzKHJldCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSByZWFjdC5yZWoodmFsdWUpO1xyXG4gICAgICAgICAgfSBjYXRjaChlcnIpe1xyXG4gICAgICAgICAgICByZWFjdC5yZWooZXJyKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KGNoYWluW2krK10pO1xyXG4gICAgICAgIGNoYWluLmxlbmd0aCA9IDA7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcmVzb2x2ZSh2YWx1ZSl7XHJcbiAgICAgIHZhciByZWNvcmQgPSB0aGlzXHJcbiAgICAgICAgLCB0aGVuLCB3cmFwcGVyO1xyXG4gICAgICBpZihyZWNvcmQuZClyZXR1cm47XHJcbiAgICAgIHJlY29yZC5kID0gdHJ1ZTtcclxuICAgICAgcmVjb3JkID0gcmVjb3JkLnIgfHwgcmVjb3JkOyAvLyB1bndyYXBcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBpZih0aGVuID0gaXNUaGVuYWJsZSh2YWx1ZSkpe1xyXG4gICAgICAgICAgd3JhcHBlciA9IHtyOiByZWNvcmQsIGQ6IGZhbHNlfTsgLy8gd3JhcFxyXG4gICAgICAgICAgdGhlbi5jYWxsKHZhbHVlLCBjdHgocmVzb2x2ZSwgd3JhcHBlciwgMSksIGN0eChyZWplY3QsIHdyYXBwZXIsIDEpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmVjb3JkLnYgPSB2YWx1ZTtcclxuICAgICAgICAgIHJlY29yZC5zID0gMTtcclxuICAgICAgICAgIG5vdGlmeShyZWNvcmQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaChlcnIpe1xyXG4gICAgICAgIHJlamVjdC5jYWxsKHdyYXBwZXIgfHwge3I6IHJlY29yZCwgZDogZmFsc2V9LCBlcnIpOyAvLyB3cmFwXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHJlamVjdCh2YWx1ZSl7XHJcbiAgICAgIHZhciByZWNvcmQgPSB0aGlzO1xyXG4gICAgICBpZihyZWNvcmQuZClyZXR1cm47XHJcbiAgICAgIHJlY29yZC5kID0gdHJ1ZTtcclxuICAgICAgcmVjb3JkID0gcmVjb3JkLnIgfHwgcmVjb3JkOyAvLyB1bndyYXBcclxuICAgICAgcmVjb3JkLnYgPSB2YWx1ZTtcclxuICAgICAgcmVjb3JkLnMgPSAyO1xyXG4gICAgICBub3RpZnkocmVjb3JkLCB0cnVlKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGdldENvbnN0cnVjdG9yKEMpe1xyXG4gICAgICB2YXIgUyA9IGFzc2VydE9iamVjdChDKVtTWU1CT0xfU1BFQ0lFU107XHJcbiAgICAgIHJldHVybiBTICE9IHVuZGVmaW5lZCA/IFMgOiBDO1xyXG4gICAgfVxyXG4gICAgLy8gMjUuNC4zLjEgUHJvbWlzZShleGVjdXRvcilcclxuICAgIFByb21pc2UgPSBmdW5jdGlvbihleGVjdXRvcil7XHJcbiAgICAgIGFzc2VydEZ1bmN0aW9uKGV4ZWN1dG9yKTtcclxuICAgICAgYXNzZXJ0SW5zdGFuY2UodGhpcywgUHJvbWlzZSwgUFJPTUlTRSk7XHJcbiAgICAgIHZhciByZWNvcmQgPSB7XHJcbiAgICAgICAgcDogdGhpcywgICAgICAvLyBwcm9taXNlXHJcbiAgICAgICAgYzogW10sICAgICAgICAvLyBjaGFpblxyXG4gICAgICAgIHM6IDAsICAgICAgICAgLy8gc3RhdGVcclxuICAgICAgICBkOiBmYWxzZSwgICAgIC8vIGRvbmVcclxuICAgICAgICB2OiB1bmRlZmluZWQsIC8vIHZhbHVlXHJcbiAgICAgICAgaDogZmFsc2UgICAgICAvLyBoYW5kbGVkIHJlamVjdGlvblxyXG4gICAgICB9O1xyXG4gICAgICBoaWRkZW4odGhpcywgUkVDT1JELCByZWNvcmQpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGV4ZWN1dG9yKGN0eChyZXNvbHZlLCByZWNvcmQsIDEpLCBjdHgocmVqZWN0LCByZWNvcmQsIDEpKTtcclxuICAgICAgfSBjYXRjaChlcnIpe1xyXG4gICAgICAgIHJlamVjdC5jYWxsKHJlY29yZCwgZXJyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgYXNzaWduSGlkZGVuKFByb21pc2VbUFJPVE9UWVBFXSwge1xyXG4gICAgICAvLyAyNS40LjUuMyBQcm9taXNlLnByb3RvdHlwZS50aGVuKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKVxyXG4gICAgICB0aGVuOiBmdW5jdGlvbihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCl7XHJcbiAgICAgICAgdmFyIFMgPSBhc3NlcnRPYmplY3QoYXNzZXJ0T2JqZWN0KHRoaXMpW0NPTlNUUlVDVE9SXSlbU1lNQk9MX1NQRUNJRVNdO1xyXG4gICAgICAgIHZhciByZWFjdCA9IHtcclxuICAgICAgICAgIG9rOiAgIGlzRnVuY3Rpb24ob25GdWxmaWxsZWQpID8gb25GdWxmaWxsZWQgOiB0cnVlLFxyXG4gICAgICAgICAgZmFpbDogaXNGdW5jdGlvbihvblJlamVjdGVkKSAgPyBvblJlamVjdGVkICA6IGZhbHNlXHJcbiAgICAgICAgfSAsIFAgPSByZWFjdC5QID0gbmV3IChTICE9IHVuZGVmaW5lZCA/IFMgOiBQcm9taXNlKShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xyXG4gICAgICAgICAgcmVhY3QucmVzID0gYXNzZXJ0RnVuY3Rpb24ocmVzb2x2ZSk7XHJcbiAgICAgICAgICByZWFjdC5yZWogPSBhc3NlcnRGdW5jdGlvbihyZWplY3QpO1xyXG4gICAgICAgIH0pLCByZWNvcmQgPSB0aGlzW1JFQ09SRF07XHJcbiAgICAgICAgcmVjb3JkLmMucHVzaChyZWFjdCk7XHJcbiAgICAgICAgcmVjb3JkLnMgJiYgbm90aWZ5KHJlY29yZCk7XHJcbiAgICAgICAgcmV0dXJuIFA7XHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIDI1LjQuNS4xIFByb21pc2UucHJvdG90eXBlLmNhdGNoKG9uUmVqZWN0ZWQpXHJcbiAgICAgICdjYXRjaCc6IGZ1bmN0aW9uKG9uUmVqZWN0ZWQpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRoZW4odW5kZWZpbmVkLCBvblJlamVjdGVkKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBhc3NpZ25IaWRkZW4oUHJvbWlzZSwge1xyXG4gICAgICAvLyAyNS40LjQuMSBQcm9taXNlLmFsbChpdGVyYWJsZSlcclxuICAgICAgYWxsOiBmdW5jdGlvbihpdGVyYWJsZSl7XHJcbiAgICAgICAgdmFyIFByb21pc2UgPSBnZXRDb25zdHJ1Y3Rvcih0aGlzKVxyXG4gICAgICAgICAgLCB2YWx1ZXMgID0gW107XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XHJcbiAgICAgICAgICBmb3JPZihpdGVyYWJsZSwgZmFsc2UsIHB1c2gsIHZhbHVlcyk7XHJcbiAgICAgICAgICB2YXIgcmVtYWluaW5nID0gdmFsdWVzLmxlbmd0aFxyXG4gICAgICAgICAgICAsIHJlc3VsdHMgICA9IEFycmF5KHJlbWFpbmluZyk7XHJcbiAgICAgICAgICBpZihyZW1haW5pbmcpZm9yRWFjaC5jYWxsKHZhbHVlcywgZnVuY3Rpb24ocHJvbWlzZSwgaW5kZXgpe1xyXG4gICAgICAgICAgICBQcm9taXNlLnJlc29sdmUocHJvbWlzZSkudGhlbihmdW5jdGlvbih2YWx1ZSl7XHJcbiAgICAgICAgICAgICAgcmVzdWx0c1tpbmRleF0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAtLXJlbWFpbmluZyB8fCByZXNvbHZlKHJlc3VsdHMpO1xyXG4gICAgICAgICAgICB9LCByZWplY3QpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzdWx0cyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIDI1LjQuNC40IFByb21pc2UucmFjZShpdGVyYWJsZSlcclxuICAgICAgcmFjZTogZnVuY3Rpb24oaXRlcmFibGUpe1xyXG4gICAgICAgIHZhciBQcm9taXNlID0gZ2V0Q29uc3RydWN0b3IodGhpcyk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XHJcbiAgICAgICAgICBmb3JPZihpdGVyYWJsZSwgZmFsc2UsIGZ1bmN0aW9uKHByb21pc2Upe1xyXG4gICAgICAgICAgICBQcm9taXNlLnJlc29sdmUocHJvbWlzZSkudGhlbihyZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIDI1LjQuNC41IFByb21pc2UucmVqZWN0KHIpXHJcbiAgICAgIHJlamVjdDogZnVuY3Rpb24ocil7XHJcbiAgICAgICAgcmV0dXJuIG5ldyAoZ2V0Q29uc3RydWN0b3IodGhpcykpKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XHJcbiAgICAgICAgICByZWplY3Qocik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIDI1LjQuNC42IFByb21pc2UucmVzb2x2ZSh4KVxyXG4gICAgICByZXNvbHZlOiBmdW5jdGlvbih4KXtcclxuICAgICAgICByZXR1cm4gaXNPYmplY3QoeCkgJiYgUkVDT1JEIGluIHggJiYgZ2V0UHJvdG90eXBlT2YoeCkgPT09IHRoaXNbUFJPVE9UWVBFXVxyXG4gICAgICAgICAgPyB4IDogbmV3IChnZXRDb25zdHJ1Y3Rvcih0aGlzKSkoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcclxuICAgICAgICAgICAgcmVzb2x2ZSh4KTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9KG5leHRUaWNrIHx8IHNldEltbWVkaWF0ZSwgc2FmZVN5bWJvbCgncmVjb3JkJykpO1xyXG4gIHNldFRvU3RyaW5nVGFnKFByb21pc2UsIFBST01JU0UpO1xyXG4gIHNldFNwZWNpZXMoUHJvbWlzZSk7XHJcbiAgJGRlZmluZShHTE9CQUwgKyBGT1JDRUQgKiAhaXNOYXRpdmUoUHJvbWlzZSksIHtQcm9taXNlOiBQcm9taXNlfSk7XHJcbn0oZ2xvYmFsW1BST01JU0VdKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogTW9kdWxlIDogZXM2LmNvbGxlY3Rpb25zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLy8gRUNNQVNjcmlwdCA2IGNvbGxlY3Rpb25zIHNoaW1cclxuIWZ1bmN0aW9uKCl7XHJcbiAgdmFyIFVJRCAgID0gc2FmZVN5bWJvbCgndWlkJylcclxuICAgICwgTzEgICAgPSBzYWZlU3ltYm9sKCdPMScpXHJcbiAgICAsIFdFQUsgID0gc2FmZVN5bWJvbCgnd2VhaycpXHJcbiAgICAsIExFQUsgID0gc2FmZVN5bWJvbCgnbGVhaycpXHJcbiAgICAsIExBU1QgID0gc2FmZVN5bWJvbCgnbGFzdCcpXHJcbiAgICAsIEZJUlNUID0gc2FmZVN5bWJvbCgnZmlyc3QnKVxyXG4gICAgLCBTSVpFICA9IERFU0MgPyBzYWZlU3ltYm9sKCdzaXplJykgOiAnc2l6ZSdcclxuICAgICwgdWlkICAgPSAwXHJcbiAgICAsIHRtcCAgID0ge307XHJcbiAgXHJcbiAgZnVuY3Rpb24gZ2V0Q29sbGVjdGlvbihDLCBOQU1FLCBtZXRob2RzLCBjb21tb25NZXRob2RzLCBpc01hcCwgaXNXZWFrKXtcclxuICAgIHZhciBBRERFUiA9IGlzTWFwID8gJ3NldCcgOiAnYWRkJ1xyXG4gICAgICAsIHByb3RvID0gQyAmJiBDW1BST1RPVFlQRV1cclxuICAgICAgLCBPICAgICA9IHt9O1xyXG4gICAgZnVuY3Rpb24gaW5pdEZyb21JdGVyYWJsZSh0aGF0LCBpdGVyYWJsZSl7XHJcbiAgICAgIGlmKGl0ZXJhYmxlICE9IHVuZGVmaW5lZClmb3JPZihpdGVyYWJsZSwgaXNNYXAsIHRoYXRbQURERVJdLCB0aGF0KTtcclxuICAgICAgcmV0dXJuIHRoYXQ7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBmaXhTVlooa2V5LCBjaGFpbil7XHJcbiAgICAgIHZhciBtZXRob2QgPSBwcm90b1trZXldO1xyXG4gICAgICBpZihmcmFtZXdvcmspcHJvdG9ba2V5XSA9IGZ1bmN0aW9uKGEsIGIpe1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBtZXRob2QuY2FsbCh0aGlzLCBhID09PSAwID8gMCA6IGEsIGIpO1xyXG4gICAgICAgIHJldHVybiBjaGFpbiA/IHRoaXMgOiByZXN1bHQ7XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgICBpZighaXNOYXRpdmUoQykgfHwgIShpc1dlYWsgfHwgKCFCVUdHWV9JVEVSQVRPUlMgJiYgaGFzKHByb3RvLCBGT1JfRUFDSCkgJiYgaGFzKHByb3RvLCAnZW50cmllcycpKSkpe1xyXG4gICAgICAvLyBjcmVhdGUgY29sbGVjdGlvbiBjb25zdHJ1Y3RvclxyXG4gICAgICBDID0gaXNXZWFrXHJcbiAgICAgICAgPyBmdW5jdGlvbihpdGVyYWJsZSl7XHJcbiAgICAgICAgICAgIGFzc2VydEluc3RhbmNlKHRoaXMsIEMsIE5BTUUpO1xyXG4gICAgICAgICAgICBzZXQodGhpcywgVUlELCB1aWQrKyk7XHJcbiAgICAgICAgICAgIGluaXRGcm9tSXRlcmFibGUodGhpcywgaXRlcmFibGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIDogZnVuY3Rpb24oaXRlcmFibGUpe1xyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgICAgIGFzc2VydEluc3RhbmNlKHRoYXQsIEMsIE5BTUUpO1xyXG4gICAgICAgICAgICBzZXQodGhhdCwgTzEsIGNyZWF0ZShudWxsKSk7XHJcbiAgICAgICAgICAgIHNldCh0aGF0LCBTSVpFLCAwKTtcclxuICAgICAgICAgICAgc2V0KHRoYXQsIExBU1QsIHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICAgIHNldCh0aGF0LCBGSVJTVCwgdW5kZWZpbmVkKTtcclxuICAgICAgICAgICAgaW5pdEZyb21JdGVyYWJsZSh0aGF0LCBpdGVyYWJsZSk7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICBhc3NpZ25IaWRkZW4oYXNzaWduSGlkZGVuKENbUFJPVE9UWVBFXSwgbWV0aG9kcyksIGNvbW1vbk1ldGhvZHMpO1xyXG4gICAgICBpc1dlYWsgfHwgIURFU0MgfHwgZGVmaW5lUHJvcGVydHkoQ1tQUk9UT1RZUEVdLCAnc2l6ZScsIHtnZXQ6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuIGFzc2VydERlZmluZWQodGhpc1tTSVpFXSk7XHJcbiAgICAgIH19KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhciBOYXRpdmUgPSBDXHJcbiAgICAgICAgLCBpbnN0ICAgPSBuZXcgQ1xyXG4gICAgICAgICwgY2hhaW4gID0gaW5zdFtBRERFUl0oaXNXZWFrID8ge30gOiAtMCwgMSlcclxuICAgICAgICAsIGJ1Z2d5WmVybztcclxuICAgICAgLy8gd3JhcCB0byBpbml0IGNvbGxlY3Rpb25zIGZyb20gaXRlcmFibGVcclxuICAgICAgaWYoY2hlY2tEYW5nZXJJdGVyQ2xvc2luZyhmdW5jdGlvbihPKXsgbmV3IEMoTykgfSkpe1xyXG4gICAgICAgIEMgPSBmdW5jdGlvbihpdGVyYWJsZSl7XHJcbiAgICAgICAgICBhc3NlcnRJbnN0YW5jZSh0aGlzLCBDLCBOQU1FKTtcclxuICAgICAgICAgIHJldHVybiBpbml0RnJvbUl0ZXJhYmxlKG5ldyBOYXRpdmUsIGl0ZXJhYmxlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgQ1tQUk9UT1RZUEVdID0gcHJvdG87XHJcbiAgICAgICAgaWYoZnJhbWV3b3JrKXByb3RvW0NPTlNUUlVDVE9SXSA9IEM7XHJcbiAgICAgIH1cclxuICAgICAgaXNXZWFrIHx8IGluc3RbRk9SX0VBQ0hdKGZ1bmN0aW9uKHZhbCwga2V5KXtcclxuICAgICAgICBidWdneVplcm8gPSAxIC8ga2V5ID09PSAtSW5maW5pdHk7XHJcbiAgICAgIH0pO1xyXG4gICAgICAvLyBmaXggY29udmVydGluZyAtMCBrZXkgdG8gKzBcclxuICAgICAgaWYoYnVnZ3laZXJvKXtcclxuICAgICAgICBmaXhTVlooJ2RlbGV0ZScpO1xyXG4gICAgICAgIGZpeFNWWignaGFzJyk7XHJcbiAgICAgICAgaXNNYXAgJiYgZml4U1ZaKCdnZXQnKTtcclxuICAgICAgfVxyXG4gICAgICAvLyArIGZpeCAuYWRkICYgLnNldCBmb3IgY2hhaW5pbmdcclxuICAgICAgaWYoYnVnZ3laZXJvIHx8IGNoYWluICE9PSBpbnN0KWZpeFNWWihBRERFUiwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgICBzZXRUb1N0cmluZ1RhZyhDLCBOQU1FKTtcclxuICAgIHNldFNwZWNpZXMoQyk7XHJcbiAgICBcclxuICAgIE9bTkFNRV0gPSBDO1xyXG4gICAgJGRlZmluZShHTE9CQUwgKyBXUkFQICsgRk9SQ0VEICogIWlzTmF0aXZlKEMpLCBPKTtcclxuICAgIFxyXG4gICAgLy8gYWRkIC5rZXlzLCAudmFsdWVzLCAuZW50cmllcywgW0BAaXRlcmF0b3JdXHJcbiAgICAvLyAyMy4xLjMuNCwgMjMuMS4zLjgsIDIzLjEuMy4xMSwgMjMuMS4zLjEyLCAyMy4yLjMuNSwgMjMuMi4zLjgsIDIzLjIuMy4xMCwgMjMuMi4zLjExXHJcbiAgICBpc1dlYWsgfHwgZGVmaW5lU3RkSXRlcmF0b3JzKEMsIE5BTUUsIGZ1bmN0aW9uKGl0ZXJhdGVkLCBraW5kKXtcclxuICAgICAgc2V0KHRoaXMsIElURVIsIHtvOiBpdGVyYXRlZCwgazoga2luZH0pO1xyXG4gICAgfSwgZnVuY3Rpb24oKXtcclxuICAgICAgdmFyIGl0ZXIgID0gdGhpc1tJVEVSXVxyXG4gICAgICAgICwga2luZCAgPSBpdGVyLmtcclxuICAgICAgICAsIGVudHJ5ID0gaXRlci5sO1xyXG4gICAgICAvLyByZXZlcnQgdG8gdGhlIGxhc3QgZXhpc3RpbmcgZW50cnlcclxuICAgICAgd2hpbGUoZW50cnkgJiYgZW50cnkucillbnRyeSA9IGVudHJ5LnA7XHJcbiAgICAgIC8vIGdldCBuZXh0IGVudHJ5XHJcbiAgICAgIGlmKCFpdGVyLm8gfHwgIShpdGVyLmwgPSBlbnRyeSA9IGVudHJ5ID8gZW50cnkubiA6IGl0ZXIub1tGSVJTVF0pKXtcclxuICAgICAgICAvLyBvciBmaW5pc2ggdGhlIGl0ZXJhdGlvblxyXG4gICAgICAgIGl0ZXIubyA9IHVuZGVmaW5lZDtcclxuICAgICAgICByZXR1cm4gaXRlclJlc3VsdCgxKTtcclxuICAgICAgfVxyXG4gICAgICAvLyByZXR1cm4gc3RlcCBieSBraW5kXHJcbiAgICAgIGlmKGtpbmQgPT0gS0VZKSAgcmV0dXJuIGl0ZXJSZXN1bHQoMCwgZW50cnkuayk7XHJcbiAgICAgIGlmKGtpbmQgPT0gVkFMVUUpcmV0dXJuIGl0ZXJSZXN1bHQoMCwgZW50cnkudik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZXJSZXN1bHQoMCwgW2VudHJ5LmssIGVudHJ5LnZdKTsgICBcclxuICAgIH0sIGlzTWFwID8gS0VZK1ZBTFVFIDogVkFMVUUsICFpc01hcCk7XHJcbiAgICBcclxuICAgIHJldHVybiBDO1xyXG4gIH1cclxuICBcclxuICBmdW5jdGlvbiBmYXN0S2V5KGl0LCBjcmVhdGUpe1xyXG4gICAgLy8gcmV0dXJuIHByaW1pdGl2ZSB3aXRoIHByZWZpeFxyXG4gICAgaWYoIWlzT2JqZWN0KGl0KSlyZXR1cm4gKHR5cGVvZiBpdCA9PSAnc3RyaW5nJyA/ICdTJyA6ICdQJykgKyBpdDtcclxuICAgIC8vIGNhbid0IHNldCBpZCB0byBmcm96ZW4gb2JqZWN0XHJcbiAgICBpZihpc0Zyb3plbihpdCkpcmV0dXJuICdGJztcclxuICAgIGlmKCFoYXMoaXQsIFVJRCkpe1xyXG4gICAgICAvLyBub3QgbmVjZXNzYXJ5IHRvIGFkZCBpZFxyXG4gICAgICBpZighY3JlYXRlKXJldHVybiAnRSc7XHJcbiAgICAgIC8vIGFkZCBtaXNzaW5nIG9iamVjdCBpZFxyXG4gICAgICBoaWRkZW4oaXQsIFVJRCwgKyt1aWQpO1xyXG4gICAgLy8gcmV0dXJuIG9iamVjdCBpZCB3aXRoIHByZWZpeFxyXG4gICAgfSByZXR1cm4gJ08nICsgaXRbVUlEXTtcclxuICB9XHJcbiAgZnVuY3Rpb24gZ2V0RW50cnkodGhhdCwga2V5KXtcclxuICAgIC8vIGZhc3QgY2FzZVxyXG4gICAgdmFyIGluZGV4ID0gZmFzdEtleShrZXkpLCBlbnRyeTtcclxuICAgIGlmKGluZGV4ICE9ICdGJylyZXR1cm4gdGhhdFtPMV1baW5kZXhdO1xyXG4gICAgLy8gZnJvemVuIG9iamVjdCBjYXNlXHJcbiAgICBmb3IoZW50cnkgPSB0aGF0W0ZJUlNUXTsgZW50cnk7IGVudHJ5ID0gZW50cnkubil7XHJcbiAgICAgIGlmKGVudHJ5LmsgPT0ga2V5KXJldHVybiBlbnRyeTtcclxuICAgIH1cclxuICB9XHJcbiAgZnVuY3Rpb24gZGVmKHRoYXQsIGtleSwgdmFsdWUpe1xyXG4gICAgdmFyIGVudHJ5ID0gZ2V0RW50cnkodGhhdCwga2V5KVxyXG4gICAgICAsIHByZXYsIGluZGV4O1xyXG4gICAgLy8gY2hhbmdlIGV4aXN0aW5nIGVudHJ5XHJcbiAgICBpZihlbnRyeSllbnRyeS52ID0gdmFsdWU7XHJcbiAgICAvLyBjcmVhdGUgbmV3IGVudHJ5XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhhdFtMQVNUXSA9IGVudHJ5ID0ge1xyXG4gICAgICAgIGk6IGluZGV4ID0gZmFzdEtleShrZXksIHRydWUpLCAvLyA8LSBpbmRleFxyXG4gICAgICAgIGs6IGtleSwgICAgICAgICAgICAgICAgICAgICAgICAvLyA8LSBrZXlcclxuICAgICAgICB2OiB2YWx1ZSwgICAgICAgICAgICAgICAgICAgICAgLy8gPC0gdmFsdWVcclxuICAgICAgICBwOiBwcmV2ID0gdGhhdFtMQVNUXSwgICAgICAgICAgLy8gPC0gcHJldmlvdXMgZW50cnlcclxuICAgICAgICBuOiB1bmRlZmluZWQsICAgICAgICAgICAgICAgICAgLy8gPC0gbmV4dCBlbnRyeVxyXG4gICAgICAgIHI6IGZhbHNlICAgICAgICAgICAgICAgICAgICAgICAvLyA8LSByZW1vdmVkXHJcbiAgICAgIH07XHJcbiAgICAgIGlmKCF0aGF0W0ZJUlNUXSl0aGF0W0ZJUlNUXSA9IGVudHJ5O1xyXG4gICAgICBpZihwcmV2KXByZXYubiA9IGVudHJ5O1xyXG4gICAgICB0aGF0W1NJWkVdKys7XHJcbiAgICAgIC8vIGFkZCB0byBpbmRleFxyXG4gICAgICBpZihpbmRleCAhPSAnRicpdGhhdFtPMV1baW5kZXhdID0gZW50cnk7XHJcbiAgICB9IHJldHVybiB0aGF0O1xyXG4gIH1cclxuXHJcbiAgdmFyIGNvbGxlY3Rpb25NZXRob2RzID0ge1xyXG4gICAgLy8gMjMuMS4zLjEgTWFwLnByb3RvdHlwZS5jbGVhcigpXHJcbiAgICAvLyAyMy4yLjMuMiBTZXQucHJvdG90eXBlLmNsZWFyKClcclxuICAgIGNsZWFyOiBmdW5jdGlvbigpe1xyXG4gICAgICBmb3IodmFyIHRoYXQgPSB0aGlzLCBkYXRhID0gdGhhdFtPMV0sIGVudHJ5ID0gdGhhdFtGSVJTVF07IGVudHJ5OyBlbnRyeSA9IGVudHJ5Lm4pe1xyXG4gICAgICAgIGVudHJ5LnIgPSB0cnVlO1xyXG4gICAgICAgIGlmKGVudHJ5LnApZW50cnkucCA9IGVudHJ5LnAubiA9IHVuZGVmaW5lZDtcclxuICAgICAgICBkZWxldGUgZGF0YVtlbnRyeS5pXTtcclxuICAgICAgfVxyXG4gICAgICB0aGF0W0ZJUlNUXSA9IHRoYXRbTEFTVF0gPSB1bmRlZmluZWQ7XHJcbiAgICAgIHRoYXRbU0laRV0gPSAwO1xyXG4gICAgfSxcclxuICAgIC8vIDIzLjEuMy4zIE1hcC5wcm90b3R5cGUuZGVsZXRlKGtleSlcclxuICAgIC8vIDIzLjIuMy40IFNldC5wcm90b3R5cGUuZGVsZXRlKHZhbHVlKVxyXG4gICAgJ2RlbGV0ZSc6IGZ1bmN0aW9uKGtleSl7XHJcbiAgICAgIHZhciB0aGF0ICA9IHRoaXNcclxuICAgICAgICAsIGVudHJ5ID0gZ2V0RW50cnkodGhhdCwga2V5KTtcclxuICAgICAgaWYoZW50cnkpe1xyXG4gICAgICAgIHZhciBuZXh0ID0gZW50cnkublxyXG4gICAgICAgICAgLCBwcmV2ID0gZW50cnkucDtcclxuICAgICAgICBkZWxldGUgdGhhdFtPMV1bZW50cnkuaV07XHJcbiAgICAgICAgZW50cnkuciA9IHRydWU7XHJcbiAgICAgICAgaWYocHJldilwcmV2Lm4gPSBuZXh0O1xyXG4gICAgICAgIGlmKG5leHQpbmV4dC5wID0gcHJldjtcclxuICAgICAgICBpZih0aGF0W0ZJUlNUXSA9PSBlbnRyeSl0aGF0W0ZJUlNUXSA9IG5leHQ7XHJcbiAgICAgICAgaWYodGhhdFtMQVNUXSA9PSBlbnRyeSl0aGF0W0xBU1RdID0gcHJldjtcclxuICAgICAgICB0aGF0W1NJWkVdLS07XHJcbiAgICAgIH0gcmV0dXJuICEhZW50cnk7XHJcbiAgICB9LFxyXG4gICAgLy8gMjMuMi4zLjYgU2V0LnByb3RvdHlwZS5mb3JFYWNoKGNhbGxiYWNrZm4sIHRoaXNBcmcgPSB1bmRlZmluZWQpXHJcbiAgICAvLyAyMy4xLjMuNSBNYXAucHJvdG90eXBlLmZvckVhY2goY2FsbGJhY2tmbiwgdGhpc0FyZyA9IHVuZGVmaW5lZClcclxuICAgIGZvckVhY2g6IGZ1bmN0aW9uKGNhbGxiYWNrZm4gLyosIHRoYXQgPSB1bmRlZmluZWQgKi8pe1xyXG4gICAgICB2YXIgZiA9IGN0eChjYWxsYmFja2ZuLCBhcmd1bWVudHNbMV0sIDMpXHJcbiAgICAgICAgLCBlbnRyeTtcclxuICAgICAgd2hpbGUoZW50cnkgPSBlbnRyeSA/IGVudHJ5Lm4gOiB0aGlzW0ZJUlNUXSl7XHJcbiAgICAgICAgZihlbnRyeS52LCBlbnRyeS5rLCB0aGlzKTtcclxuICAgICAgICAvLyByZXZlcnQgdG8gdGhlIGxhc3QgZXhpc3RpbmcgZW50cnlcclxuICAgICAgICB3aGlsZShlbnRyeSAmJiBlbnRyeS5yKWVudHJ5ID0gZW50cnkucDtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIC8vIDIzLjEuMy43IE1hcC5wcm90b3R5cGUuaGFzKGtleSlcclxuICAgIC8vIDIzLjIuMy43IFNldC5wcm90b3R5cGUuaGFzKHZhbHVlKVxyXG4gICAgaGFzOiBmdW5jdGlvbihrZXkpe1xyXG4gICAgICByZXR1cm4gISFnZXRFbnRyeSh0aGlzLCBrZXkpO1xyXG4gICAgfVxyXG4gIH1cclxuICBcclxuICAvLyAyMy4xIE1hcCBPYmplY3RzXHJcbiAgTWFwID0gZ2V0Q29sbGVjdGlvbihNYXAsIE1BUCwge1xyXG4gICAgLy8gMjMuMS4zLjYgTWFwLnByb3RvdHlwZS5nZXQoa2V5KVxyXG4gICAgZ2V0OiBmdW5jdGlvbihrZXkpe1xyXG4gICAgICB2YXIgZW50cnkgPSBnZXRFbnRyeSh0aGlzLCBrZXkpO1xyXG4gICAgICByZXR1cm4gZW50cnkgJiYgZW50cnkudjtcclxuICAgIH0sXHJcbiAgICAvLyAyMy4xLjMuOSBNYXAucHJvdG90eXBlLnNldChrZXksIHZhbHVlKVxyXG4gICAgc2V0OiBmdW5jdGlvbihrZXksIHZhbHVlKXtcclxuICAgICAgcmV0dXJuIGRlZih0aGlzLCBrZXkgPT09IDAgPyAwIDoga2V5LCB2YWx1ZSk7XHJcbiAgICB9XHJcbiAgfSwgY29sbGVjdGlvbk1ldGhvZHMsIHRydWUpO1xyXG4gIFxyXG4gIC8vIDIzLjIgU2V0IE9iamVjdHNcclxuICBTZXQgPSBnZXRDb2xsZWN0aW9uKFNldCwgU0VULCB7XHJcbiAgICAvLyAyMy4yLjMuMSBTZXQucHJvdG90eXBlLmFkZCh2YWx1ZSlcclxuICAgIGFkZDogZnVuY3Rpb24odmFsdWUpe1xyXG4gICAgICByZXR1cm4gZGVmKHRoaXMsIHZhbHVlID0gdmFsdWUgPT09IDAgPyAwIDogdmFsdWUsIHZhbHVlKTtcclxuICAgIH1cclxuICB9LCBjb2xsZWN0aW9uTWV0aG9kcyk7XHJcbiAgXHJcbiAgZnVuY3Rpb24gZGVmV2Vhayh0aGF0LCBrZXksIHZhbHVlKXtcclxuICAgIGlmKGlzRnJvemVuKGFzc2VydE9iamVjdChrZXkpKSlsZWFrU3RvcmUodGhhdCkuc2V0KGtleSwgdmFsdWUpO1xyXG4gICAgZWxzZSB7XHJcbiAgICAgIGhhcyhrZXksIFdFQUspIHx8IGhpZGRlbihrZXksIFdFQUssIHt9KTtcclxuICAgICAga2V5W1dFQUtdW3RoYXRbVUlEXV0gPSB2YWx1ZTtcclxuICAgIH0gcmV0dXJuIHRoYXQ7XHJcbiAgfVxyXG4gIGZ1bmN0aW9uIGxlYWtTdG9yZSh0aGF0KXtcclxuICAgIHJldHVybiB0aGF0W0xFQUtdIHx8IGhpZGRlbih0aGF0LCBMRUFLLCBuZXcgTWFwKVtMRUFLXTtcclxuICB9XHJcbiAgXHJcbiAgdmFyIHdlYWtNZXRob2RzID0ge1xyXG4gICAgLy8gMjMuMy4zLjIgV2Vha01hcC5wcm90b3R5cGUuZGVsZXRlKGtleSlcclxuICAgIC8vIDIzLjQuMy4zIFdlYWtTZXQucHJvdG90eXBlLmRlbGV0ZSh2YWx1ZSlcclxuICAgICdkZWxldGUnOiBmdW5jdGlvbihrZXkpe1xyXG4gICAgICBpZighaXNPYmplY3Qoa2V5KSlyZXR1cm4gZmFsc2U7XHJcbiAgICAgIGlmKGlzRnJvemVuKGtleSkpcmV0dXJuIGxlYWtTdG9yZSh0aGlzKVsnZGVsZXRlJ10oa2V5KTtcclxuICAgICAgcmV0dXJuIGhhcyhrZXksIFdFQUspICYmIGhhcyhrZXlbV0VBS10sIHRoaXNbVUlEXSkgJiYgZGVsZXRlIGtleVtXRUFLXVt0aGlzW1VJRF1dO1xyXG4gICAgfSxcclxuICAgIC8vIDIzLjMuMy40IFdlYWtNYXAucHJvdG90eXBlLmhhcyhrZXkpXHJcbiAgICAvLyAyMy40LjMuNCBXZWFrU2V0LnByb3RvdHlwZS5oYXModmFsdWUpXHJcbiAgICBoYXM6IGZ1bmN0aW9uKGtleSl7XHJcbiAgICAgIGlmKCFpc09iamVjdChrZXkpKXJldHVybiBmYWxzZTtcclxuICAgICAgaWYoaXNGcm96ZW4oa2V5KSlyZXR1cm4gbGVha1N0b3JlKHRoaXMpLmhhcyhrZXkpO1xyXG4gICAgICByZXR1cm4gaGFzKGtleSwgV0VBSykgJiYgaGFzKGtleVtXRUFLXSwgdGhpc1tVSURdKTtcclxuICAgIH1cclxuICB9O1xyXG4gIFxyXG4gIC8vIDIzLjMgV2Vha01hcCBPYmplY3RzXHJcbiAgV2Vha01hcCA9IGdldENvbGxlY3Rpb24oV2Vha01hcCwgV0VBS01BUCwge1xyXG4gICAgLy8gMjMuMy4zLjMgV2Vha01hcC5wcm90b3R5cGUuZ2V0KGtleSlcclxuICAgIGdldDogZnVuY3Rpb24oa2V5KXtcclxuICAgICAgaWYoaXNPYmplY3Qoa2V5KSl7XHJcbiAgICAgICAgaWYoaXNGcm96ZW4oa2V5KSlyZXR1cm4gbGVha1N0b3JlKHRoaXMpLmdldChrZXkpO1xyXG4gICAgICAgIGlmKGhhcyhrZXksIFdFQUspKXJldHVybiBrZXlbV0VBS11bdGhpc1tVSURdXTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIC8vIDIzLjMuMy41IFdlYWtNYXAucHJvdG90eXBlLnNldChrZXksIHZhbHVlKVxyXG4gICAgc2V0OiBmdW5jdGlvbihrZXksIHZhbHVlKXtcclxuICAgICAgcmV0dXJuIGRlZldlYWsodGhpcywga2V5LCB2YWx1ZSk7XHJcbiAgICB9XHJcbiAgfSwgd2Vha01ldGhvZHMsIHRydWUsIHRydWUpO1xyXG4gIFxyXG4gIC8vIElFMTEgV2Vha01hcCBmcm96ZW4ga2V5cyBmaXhcclxuICBpZihmcmFtZXdvcmsgJiYgbmV3IFdlYWtNYXAoKS5zZXQoT2JqZWN0LmZyZWV6ZSh0bXApLCA3KS5nZXQodG1wKSAhPSA3KXtcclxuICAgIGZvckVhY2guY2FsbChhcnJheSgnZGVsZXRlLGhhcyxnZXQsc2V0JyksIGZ1bmN0aW9uKGtleSl7XHJcbiAgICAgIHZhciBtZXRob2QgPSBXZWFrTWFwW1BST1RPVFlQRV1ba2V5XTtcclxuICAgICAgV2Vha01hcFtQUk9UT1RZUEVdW2tleV0gPSBmdW5jdGlvbihhLCBiKXtcclxuICAgICAgICAvLyBzdG9yZSBmcm96ZW4gb2JqZWN0cyBvbiBsZWFreSBtYXBcclxuICAgICAgICBpZihpc09iamVjdChhKSAmJiBpc0Zyb3plbihhKSl7XHJcbiAgICAgICAgICB2YXIgcmVzdWx0ID0gbGVha1N0b3JlKHRoaXMpW2tleV0oYSwgYik7XHJcbiAgICAgICAgICByZXR1cm4ga2V5ID09ICdzZXQnID8gdGhpcyA6IHJlc3VsdDtcclxuICAgICAgICAvLyBzdG9yZSBhbGwgdGhlIHJlc3Qgb24gbmF0aXZlIHdlYWttYXBcclxuICAgICAgICB9IHJldHVybiBtZXRob2QuY2FsbCh0aGlzLCBhLCBiKTtcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG4gIH1cclxuICBcclxuICAvLyAyMy40IFdlYWtTZXQgT2JqZWN0c1xyXG4gIFdlYWtTZXQgPSBnZXRDb2xsZWN0aW9uKFdlYWtTZXQsIFdFQUtTRVQsIHtcclxuICAgIC8vIDIzLjQuMy4xIFdlYWtTZXQucHJvdG90eXBlLmFkZCh2YWx1ZSlcclxuICAgIGFkZDogZnVuY3Rpb24odmFsdWUpe1xyXG4gICAgICByZXR1cm4gZGVmV2Vhayh0aGlzLCB2YWx1ZSwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgfSwgd2Vha01ldGhvZHMsIGZhbHNlLCB0cnVlKTtcclxufSgpO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBNb2R1bGUgOiBlczYucmVmbGVjdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4hZnVuY3Rpb24oKXtcclxuICBmdW5jdGlvbiBFbnVtZXJhdGUoaXRlcmF0ZWQpe1xyXG4gICAgdmFyIGtleXMgPSBbXSwga2V5O1xyXG4gICAgZm9yKGtleSBpbiBpdGVyYXRlZClrZXlzLnB1c2goa2V5KTtcclxuICAgIHNldCh0aGlzLCBJVEVSLCB7bzogaXRlcmF0ZWQsIGE6IGtleXMsIGk6IDB9KTtcclxuICB9XHJcbiAgY3JlYXRlSXRlcmF0b3IoRW51bWVyYXRlLCBPQkpFQ1QsIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgaXRlciA9IHRoaXNbSVRFUl1cclxuICAgICAgLCBrZXlzID0gaXRlci5hXHJcbiAgICAgICwga2V5O1xyXG4gICAgZG8ge1xyXG4gICAgICBpZihpdGVyLmkgPj0ga2V5cy5sZW5ndGgpcmV0dXJuIGl0ZXJSZXN1bHQoMSk7XHJcbiAgICB9IHdoaWxlKCEoKGtleSA9IGtleXNbaXRlci5pKytdKSBpbiBpdGVyLm8pKTtcclxuICAgIHJldHVybiBpdGVyUmVzdWx0KDAsIGtleSk7XHJcbiAgfSk7XHJcbiAgXHJcbiAgZnVuY3Rpb24gd3JhcChmbil7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oaXQpe1xyXG4gICAgICBhc3NlcnRPYmplY3QoaXQpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiBmbi5hcHBseSh1bmRlZmluZWQsIGFyZ3VtZW50cyksIHRydWU7XHJcbiAgICAgIH0gY2F0Y2goZSl7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIFxyXG4gIGZ1bmN0aW9uIHJlZmxlY3RHZXQodGFyZ2V0LCBwcm9wZXJ0eUtleS8qLCByZWNlaXZlciovKXtcclxuICAgIHZhciByZWNlaXZlciA9IGFyZ3VtZW50cy5sZW5ndGggPCAzID8gdGFyZ2V0IDogYXJndW1lbnRzWzJdXHJcbiAgICAgICwgZGVzYyA9IGdldE93bkRlc2NyaXB0b3IoYXNzZXJ0T2JqZWN0KHRhcmdldCksIHByb3BlcnR5S2V5KSwgcHJvdG87XHJcbiAgICBpZihkZXNjKXJldHVybiBoYXMoZGVzYywgJ3ZhbHVlJylcclxuICAgICAgPyBkZXNjLnZhbHVlXHJcbiAgICAgIDogZGVzYy5nZXQgPT09IHVuZGVmaW5lZFxyXG4gICAgICAgID8gdW5kZWZpbmVkXHJcbiAgICAgICAgOiBkZXNjLmdldC5jYWxsKHJlY2VpdmVyKTtcclxuICAgIHJldHVybiBpc09iamVjdChwcm90byA9IGdldFByb3RvdHlwZU9mKHRhcmdldCkpXHJcbiAgICAgID8gcmVmbGVjdEdldChwcm90bywgcHJvcGVydHlLZXksIHJlY2VpdmVyKVxyXG4gICAgICA6IHVuZGVmaW5lZDtcclxuICB9XHJcbiAgZnVuY3Rpb24gcmVmbGVjdFNldCh0YXJnZXQsIHByb3BlcnR5S2V5LCBWLyosIHJlY2VpdmVyKi8pe1xyXG4gICAgdmFyIHJlY2VpdmVyID0gYXJndW1lbnRzLmxlbmd0aCA8IDQgPyB0YXJnZXQgOiBhcmd1bWVudHNbM11cclxuICAgICAgLCBvd25EZXNjICA9IGdldE93bkRlc2NyaXB0b3IoYXNzZXJ0T2JqZWN0KHRhcmdldCksIHByb3BlcnR5S2V5KVxyXG4gICAgICAsIGV4aXN0aW5nRGVzY3JpcHRvciwgcHJvdG87XHJcbiAgICBpZighb3duRGVzYyl7XHJcbiAgICAgIGlmKGlzT2JqZWN0KHByb3RvID0gZ2V0UHJvdG90eXBlT2YodGFyZ2V0KSkpe1xyXG4gICAgICAgIHJldHVybiByZWZsZWN0U2V0KHByb3RvLCBwcm9wZXJ0eUtleSwgViwgcmVjZWl2ZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIG93bkRlc2MgPSBkZXNjcmlwdG9yKDApO1xyXG4gICAgfVxyXG4gICAgaWYoaGFzKG93bkRlc2MsICd2YWx1ZScpKXtcclxuICAgICAgaWYob3duRGVzYy53cml0YWJsZSA9PT0gZmFsc2UgfHwgIWlzT2JqZWN0KHJlY2VpdmVyKSlyZXR1cm4gZmFsc2U7XHJcbiAgICAgIGV4aXN0aW5nRGVzY3JpcHRvciA9IGdldE93bkRlc2NyaXB0b3IocmVjZWl2ZXIsIHByb3BlcnR5S2V5KSB8fCBkZXNjcmlwdG9yKDApO1xyXG4gICAgICBleGlzdGluZ0Rlc2NyaXB0b3IudmFsdWUgPSBWO1xyXG4gICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkocmVjZWl2ZXIsIHByb3BlcnR5S2V5LCBleGlzdGluZ0Rlc2NyaXB0b3IpLCB0cnVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG93bkRlc2Muc2V0ID09PSB1bmRlZmluZWRcclxuICAgICAgPyBmYWxzZVxyXG4gICAgICA6IChvd25EZXNjLnNldC5jYWxsKHJlY2VpdmVyLCBWKSwgdHJ1ZSk7XHJcbiAgfVxyXG4gIHZhciBpc0V4dGVuc2libGUgPSBPYmplY3QuaXNFeHRlbnNpYmxlIHx8IHJldHVybkl0O1xyXG4gIFxyXG4gIHZhciByZWZsZWN0ID0ge1xyXG4gICAgLy8gMjYuMS4xIFJlZmxlY3QuYXBwbHkodGFyZ2V0LCB0aGlzQXJndW1lbnQsIGFyZ3VtZW50c0xpc3QpXHJcbiAgICBhcHBseTogY3R4KGNhbGwsIGFwcGx5LCAzKSxcclxuICAgIC8vIDI2LjEuMiBSZWZsZWN0LmNvbnN0cnVjdCh0YXJnZXQsIGFyZ3VtZW50c0xpc3QgWywgbmV3VGFyZ2V0XSlcclxuICAgIGNvbnN0cnVjdDogZnVuY3Rpb24odGFyZ2V0LCBhcmd1bWVudHNMaXN0IC8qLCBuZXdUYXJnZXQqLyl7XHJcbiAgICAgIHZhciBwcm90byAgICA9IGFzc2VydEZ1bmN0aW9uKGFyZ3VtZW50cy5sZW5ndGggPCAzID8gdGFyZ2V0IDogYXJndW1lbnRzWzJdKVtQUk9UT1RZUEVdXHJcbiAgICAgICAgLCBpbnN0YW5jZSA9IGNyZWF0ZShpc09iamVjdChwcm90bykgPyBwcm90byA6IE9iamVjdFByb3RvKVxyXG4gICAgICAgICwgcmVzdWx0ICAgPSBhcHBseS5jYWxsKHRhcmdldCwgaW5zdGFuY2UsIGFyZ3VtZW50c0xpc3QpO1xyXG4gICAgICByZXR1cm4gaXNPYmplY3QocmVzdWx0KSA/IHJlc3VsdCA6IGluc3RhbmNlO1xyXG4gICAgfSxcclxuICAgIC8vIDI2LjEuMyBSZWZsZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcGVydHlLZXksIGF0dHJpYnV0ZXMpXHJcbiAgICBkZWZpbmVQcm9wZXJ0eTogd3JhcChkZWZpbmVQcm9wZXJ0eSksXHJcbiAgICAvLyAyNi4xLjQgUmVmbGVjdC5kZWxldGVQcm9wZXJ0eSh0YXJnZXQsIHByb3BlcnR5S2V5KVxyXG4gICAgZGVsZXRlUHJvcGVydHk6IGZ1bmN0aW9uKHRhcmdldCwgcHJvcGVydHlLZXkpe1xyXG4gICAgICB2YXIgZGVzYyA9IGdldE93bkRlc2NyaXB0b3IoYXNzZXJ0T2JqZWN0KHRhcmdldCksIHByb3BlcnR5S2V5KTtcclxuICAgICAgcmV0dXJuIGRlc2MgJiYgIWRlc2MuY29uZmlndXJhYmxlID8gZmFsc2UgOiBkZWxldGUgdGFyZ2V0W3Byb3BlcnR5S2V5XTtcclxuICAgIH0sXHJcbiAgICAvLyAyNi4xLjUgUmVmbGVjdC5lbnVtZXJhdGUodGFyZ2V0KVxyXG4gICAgZW51bWVyYXRlOiBmdW5jdGlvbih0YXJnZXQpe1xyXG4gICAgICByZXR1cm4gbmV3IEVudW1lcmF0ZShhc3NlcnRPYmplY3QodGFyZ2V0KSk7XHJcbiAgICB9LFxyXG4gICAgLy8gMjYuMS42IFJlZmxlY3QuZ2V0KHRhcmdldCwgcHJvcGVydHlLZXkgWywgcmVjZWl2ZXJdKVxyXG4gICAgZ2V0OiByZWZsZWN0R2V0LFxyXG4gICAgLy8gMjYuMS43IFJlZmxlY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwgcHJvcGVydHlLZXkpXHJcbiAgICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I6IGZ1bmN0aW9uKHRhcmdldCwgcHJvcGVydHlLZXkpe1xyXG4gICAgICByZXR1cm4gZ2V0T3duRGVzY3JpcHRvcihhc3NlcnRPYmplY3QodGFyZ2V0KSwgcHJvcGVydHlLZXkpO1xyXG4gICAgfSxcclxuICAgIC8vIDI2LjEuOCBSZWZsZWN0LmdldFByb3RvdHlwZU9mKHRhcmdldClcclxuICAgIGdldFByb3RvdHlwZU9mOiBmdW5jdGlvbih0YXJnZXQpe1xyXG4gICAgICByZXR1cm4gZ2V0UHJvdG90eXBlT2YoYXNzZXJ0T2JqZWN0KHRhcmdldCkpO1xyXG4gICAgfSxcclxuICAgIC8vIDI2LjEuOSBSZWZsZWN0Lmhhcyh0YXJnZXQsIHByb3BlcnR5S2V5KVxyXG4gICAgaGFzOiBmdW5jdGlvbih0YXJnZXQsIHByb3BlcnR5S2V5KXtcclxuICAgICAgcmV0dXJuIHByb3BlcnR5S2V5IGluIHRhcmdldDtcclxuICAgIH0sXHJcbiAgICAvLyAyNi4xLjEwIFJlZmxlY3QuaXNFeHRlbnNpYmxlKHRhcmdldClcclxuICAgIGlzRXh0ZW5zaWJsZTogZnVuY3Rpb24odGFyZ2V0KXtcclxuICAgICAgcmV0dXJuICEhaXNFeHRlbnNpYmxlKGFzc2VydE9iamVjdCh0YXJnZXQpKTtcclxuICAgIH0sXHJcbiAgICAvLyAyNi4xLjExIFJlZmxlY3Qub3duS2V5cyh0YXJnZXQpXHJcbiAgICBvd25LZXlzOiBvd25LZXlzLFxyXG4gICAgLy8gMjYuMS4xMiBSZWZsZWN0LnByZXZlbnRFeHRlbnNpb25zKHRhcmdldClcclxuICAgIHByZXZlbnRFeHRlbnNpb25zOiB3cmFwKE9iamVjdC5wcmV2ZW50RXh0ZW5zaW9ucyB8fCByZXR1cm5JdCksXHJcbiAgICAvLyAyNi4xLjEzIFJlZmxlY3Quc2V0KHRhcmdldCwgcHJvcGVydHlLZXksIFYgWywgcmVjZWl2ZXJdKVxyXG4gICAgc2V0OiByZWZsZWN0U2V0XHJcbiAgfVxyXG4gIC8vIDI2LjEuMTQgUmVmbGVjdC5zZXRQcm90b3R5cGVPZih0YXJnZXQsIHByb3RvKVxyXG4gIGlmKHNldFByb3RvdHlwZU9mKXJlZmxlY3Quc2V0UHJvdG90eXBlT2YgPSBmdW5jdGlvbih0YXJnZXQsIHByb3RvKXtcclxuICAgIHJldHVybiBzZXRQcm90b3R5cGVPZihhc3NlcnRPYmplY3QodGFyZ2V0KSwgcHJvdG8pLCB0cnVlO1xyXG4gIH07XHJcbiAgXHJcbiAgJGRlZmluZShHTE9CQUwsIHtSZWZsZWN0OiB7fX0pO1xyXG4gICRkZWZpbmUoU1RBVElDLCAnUmVmbGVjdCcsIHJlZmxlY3QpO1xyXG59KCk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1vZHVsZSA6IGVzNy5wcm9wb3NhbHMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiFmdW5jdGlvbigpe1xyXG4gICRkZWZpbmUoUFJPVE8sIEFSUkFZLCB7XHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vZG9tZW5pYy9BcnJheS5wcm90b3R5cGUuaW5jbHVkZXNcclxuICAgIGluY2x1ZGVzOiBjcmVhdGVBcnJheUNvbnRhaW5zKHRydWUpXHJcbiAgfSk7XHJcbiAgJGRlZmluZShQUk9UTywgU1RSSU5HLCB7XHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbWF0aGlhc2J5bmVucy9TdHJpbmcucHJvdG90eXBlLmF0XHJcbiAgICBhdDogY3JlYXRlUG9pbnRBdCh0cnVlKVxyXG4gIH0pO1xyXG4gIFxyXG4gIGZ1bmN0aW9uIGNyZWF0ZU9iamVjdFRvQXJyYXkoaXNFbnRyaWVzKXtcclxuICAgIHJldHVybiBmdW5jdGlvbihvYmplY3Qpe1xyXG4gICAgICB2YXIgTyAgICAgID0gdG9PYmplY3Qob2JqZWN0KVxyXG4gICAgICAgICwga2V5cyAgID0gZ2V0S2V5cyhvYmplY3QpXHJcbiAgICAgICAgLCBsZW5ndGggPSBrZXlzLmxlbmd0aFxyXG4gICAgICAgICwgaSAgICAgID0gMFxyXG4gICAgICAgICwgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKVxyXG4gICAgICAgICwga2V5O1xyXG4gICAgICBpZihpc0VudHJpZXMpd2hpbGUobGVuZ3RoID4gaSlyZXN1bHRbaV0gPSBba2V5ID0ga2V5c1tpKytdLCBPW2tleV1dO1xyXG4gICAgICBlbHNlIHdoaWxlKGxlbmd0aCA+IGkpcmVzdWx0W2ldID0gT1trZXlzW2krK11dO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH1cclxuICAkZGVmaW5lKFNUQVRJQywgT0JKRUNULCB7XHJcbiAgICAvLyBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9XZWJSZWZsZWN0aW9uLzkzNTM3ODFcclxuICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcnM6IGZ1bmN0aW9uKG9iamVjdCl7XHJcbiAgICAgIHZhciBPICAgICAgPSB0b09iamVjdChvYmplY3QpXHJcbiAgICAgICAgLCByZXN1bHQgPSB7fTtcclxuICAgICAgZm9yRWFjaC5jYWxsKG93bktleXMoTyksIGZ1bmN0aW9uKGtleSl7XHJcbiAgICAgICAgZGVmaW5lUHJvcGVydHkocmVzdWx0LCBrZXksIGRlc2NyaXB0b3IoMCwgZ2V0T3duRGVzY3JpcHRvcihPLCBrZXkpKSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9yd2FsZHJvbi90YzM5LW5vdGVzL2Jsb2IvbWFzdGVyL2VzNi8yMDE0LTA0L2Fwci05Lm1kIzUxLW9iamVjdGVudHJpZXMtb2JqZWN0dmFsdWVzXHJcbiAgICB2YWx1ZXM6ICBjcmVhdGVPYmplY3RUb0FycmF5KGZhbHNlKSxcclxuICAgIGVudHJpZXM6IGNyZWF0ZU9iamVjdFRvQXJyYXkodHJ1ZSlcclxuICB9KTtcclxuICAkZGVmaW5lKFNUQVRJQywgUkVHRVhQLCB7XHJcbiAgICAvLyBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9rYW5nYXgvOTY5ODEwMFxyXG4gICAgZXNjYXBlOiBjcmVhdGVSZXBsYWNlcigvKFtcXFxcXFwtW1xcXXt9KCkqKz8uLF4kfF0pL2csICdcXFxcJDEnLCB0cnVlKVxyXG4gIH0pO1xyXG59KCk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1vZHVsZSA6IGVzNy5hYnN0cmFjdC1yZWZzICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS96ZW5wYXJzaW5nL2VzLWFic3RyYWN0LXJlZnNcclxuIWZ1bmN0aW9uKFJFRkVSRU5DRSl7XHJcbiAgUkVGRVJFTkNFX0dFVCA9IGdldFdlbGxLbm93blN5bWJvbChSRUZFUkVOQ0UrJ0dldCcsIHRydWUpO1xyXG4gIHZhciBSRUZFUkVOQ0VfU0VUID0gZ2V0V2VsbEtub3duU3ltYm9sKFJFRkVSRU5DRStTRVQsIHRydWUpXHJcbiAgICAsIFJFRkVSRU5DRV9ERUxFVEUgPSBnZXRXZWxsS25vd25TeW1ib2woUkVGRVJFTkNFKydEZWxldGUnLCB0cnVlKTtcclxuICBcclxuICAkZGVmaW5lKFNUQVRJQywgU1lNQk9MLCB7XHJcbiAgICByZWZlcmVuY2VHZXQ6IFJFRkVSRU5DRV9HRVQsXHJcbiAgICByZWZlcmVuY2VTZXQ6IFJFRkVSRU5DRV9TRVQsXHJcbiAgICByZWZlcmVuY2VEZWxldGU6IFJFRkVSRU5DRV9ERUxFVEVcclxuICB9KTtcclxuICBcclxuICBoaWRkZW4oRnVuY3Rpb25Qcm90bywgUkVGRVJFTkNFX0dFVCwgcmV0dXJuVGhpcyk7XHJcbiAgXHJcbiAgZnVuY3Rpb24gc2V0TWFwTWV0aG9kcyhDb25zdHJ1Y3Rvcil7XHJcbiAgICBpZihDb25zdHJ1Y3Rvcil7XHJcbiAgICAgIHZhciBNYXBQcm90byA9IENvbnN0cnVjdG9yW1BST1RPVFlQRV07XHJcbiAgICAgIGhpZGRlbihNYXBQcm90bywgUkVGRVJFTkNFX0dFVCwgTWFwUHJvdG8uZ2V0KTtcclxuICAgICAgaGlkZGVuKE1hcFByb3RvLCBSRUZFUkVOQ0VfU0VULCBNYXBQcm90by5zZXQpO1xyXG4gICAgICBoaWRkZW4oTWFwUHJvdG8sIFJFRkVSRU5DRV9ERUxFVEUsIE1hcFByb3RvWydkZWxldGUnXSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHNldE1hcE1ldGhvZHMoTWFwKTtcclxuICBzZXRNYXBNZXRob2RzKFdlYWtNYXApO1xyXG59KCdyZWZlcmVuY2UnKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogTW9kdWxlIDogY29yZS5kaWN0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuIWZ1bmN0aW9uKERJQ1Qpe1xyXG4gIERpY3QgPSBmdW5jdGlvbihpdGVyYWJsZSl7XHJcbiAgICB2YXIgZGljdCA9IGNyZWF0ZShudWxsKTtcclxuICAgIGlmKGl0ZXJhYmxlICE9IHVuZGVmaW5lZCl7XHJcbiAgICAgIGlmKGlzSXRlcmFibGUoaXRlcmFibGUpKXtcclxuICAgICAgICBmb3JPZihpdGVyYWJsZSwgdHJ1ZSwgZnVuY3Rpb24oa2V5LCB2YWx1ZSl7XHJcbiAgICAgICAgICBkaWN0W2tleV0gPSB2YWx1ZTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIGFzc2lnbihkaWN0LCBpdGVyYWJsZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZGljdDtcclxuICB9XHJcbiAgRGljdFtQUk9UT1RZUEVdID0gbnVsbDtcclxuICBcclxuICBmdW5jdGlvbiBEaWN0SXRlcmF0b3IoaXRlcmF0ZWQsIGtpbmQpe1xyXG4gICAgc2V0KHRoaXMsIElURVIsIHtvOiB0b09iamVjdChpdGVyYXRlZCksIGE6IGdldEtleXMoaXRlcmF0ZWQpLCBpOiAwLCBrOiBraW5kfSk7XHJcbiAgfVxyXG4gIGNyZWF0ZUl0ZXJhdG9yKERpY3RJdGVyYXRvciwgRElDVCwgZnVuY3Rpb24oKXtcclxuICAgIHZhciBpdGVyID0gdGhpc1tJVEVSXVxyXG4gICAgICAsIE8gICAgPSBpdGVyLm9cclxuICAgICAgLCBrZXlzID0gaXRlci5hXHJcbiAgICAgICwga2luZCA9IGl0ZXIua1xyXG4gICAgICAsIGtleTtcclxuICAgIGRvIHtcclxuICAgICAgaWYoaXRlci5pID49IGtleXMubGVuZ3RoKXtcclxuICAgICAgICBpdGVyLm8gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgcmV0dXJuIGl0ZXJSZXN1bHQoMSk7XHJcbiAgICAgIH1cclxuICAgIH0gd2hpbGUoIWhhcyhPLCBrZXkgPSBrZXlzW2l0ZXIuaSsrXSkpO1xyXG4gICAgaWYoa2luZCA9PSBLRVkpICByZXR1cm4gaXRlclJlc3VsdCgwLCBrZXkpO1xyXG4gICAgaWYoa2luZCA9PSBWQUxVRSlyZXR1cm4gaXRlclJlc3VsdCgwLCBPW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlclJlc3VsdCgwLCBba2V5LCBPW2tleV1dKTtcclxuICB9KTtcclxuICBmdW5jdGlvbiBjcmVhdGVEaWN0SXRlcihraW5kKXtcclxuICAgIHJldHVybiBmdW5jdGlvbihpdCl7XHJcbiAgICAgIHJldHVybiBuZXcgRGljdEl0ZXJhdG9yKGl0LCBraW5kKTtcclxuICAgIH1cclxuICB9XHJcbiAgXHJcbiAgLypcclxuICAgKiAwIC0+IGZvckVhY2hcclxuICAgKiAxIC0+IG1hcFxyXG4gICAqIDIgLT4gZmlsdGVyXHJcbiAgICogMyAtPiBzb21lXHJcbiAgICogNCAtPiBldmVyeVxyXG4gICAqIDUgLT4gZmluZFxyXG4gICAqIDYgLT4gZmluZEtleVxyXG4gICAqIDcgLT4gbWFwUGFpcnNcclxuICAgKi9cclxuICBmdW5jdGlvbiBjcmVhdGVEaWN0TWV0aG9kKHR5cGUpe1xyXG4gICAgdmFyIGlzTWFwICAgID0gdHlwZSA9PSAxXHJcbiAgICAgICwgaXNFdmVyeSAgPSB0eXBlID09IDQ7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0LCBjYWxsYmFja2ZuLCB0aGF0IC8qID0gdW5kZWZpbmVkICovKXtcclxuICAgICAgdmFyIGYgICAgICA9IGN0eChjYWxsYmFja2ZuLCB0aGF0LCAzKVxyXG4gICAgICAgICwgTyAgICAgID0gdG9PYmplY3Qob2JqZWN0KVxyXG4gICAgICAgICwgcmVzdWx0ID0gaXNNYXAgfHwgdHlwZSA9PSA3IHx8IHR5cGUgPT0gMiA/IG5ldyAoZ2VuZXJpYyh0aGlzLCBEaWN0KSkgOiB1bmRlZmluZWRcclxuICAgICAgICAsIGtleSwgdmFsLCByZXM7XHJcbiAgICAgIGZvcihrZXkgaW4gTylpZihoYXMoTywga2V5KSl7XHJcbiAgICAgICAgdmFsID0gT1trZXldO1xyXG4gICAgICAgIHJlcyA9IGYodmFsLCBrZXksIG9iamVjdCk7XHJcbiAgICAgICAgaWYodHlwZSl7XHJcbiAgICAgICAgICBpZihpc01hcClyZXN1bHRba2V5XSA9IHJlczsgICAgICAgICAgICAgLy8gbWFwXHJcbiAgICAgICAgICBlbHNlIGlmKHJlcylzd2l0Y2godHlwZSl7XHJcbiAgICAgICAgICAgIGNhc2UgMjogcmVzdWx0W2tleV0gPSB2YWw7IGJyZWFrICAgICAgLy8gZmlsdGVyXHJcbiAgICAgICAgICAgIGNhc2UgMzogcmV0dXJuIHRydWU7ICAgICAgICAgICAgICAgICAgLy8gc29tZVxyXG4gICAgICAgICAgICBjYXNlIDU6IHJldHVybiB2YWw7ICAgICAgICAgICAgICAgICAgIC8vIGZpbmRcclxuICAgICAgICAgICAgY2FzZSA2OiByZXR1cm4ga2V5OyAgICAgICAgICAgICAgICAgICAvLyBmaW5kS2V5XHJcbiAgICAgICAgICAgIGNhc2UgNzogcmVzdWx0W3Jlc1swXV0gPSByZXNbMV07ICAgICAgLy8gbWFwUGFpcnNcclxuICAgICAgICAgIH0gZWxzZSBpZihpc0V2ZXJ5KXJldHVybiBmYWxzZTsgICAgICAgICAvLyBldmVyeVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHlwZSA9PSAzIHx8IGlzRXZlcnkgPyBpc0V2ZXJ5IDogcmVzdWx0O1xyXG4gICAgfVxyXG4gIH1cclxuICBmdW5jdGlvbiBjcmVhdGVEaWN0UmVkdWNlKGlzVHVybil7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0LCBtYXBmbiwgaW5pdCl7XHJcbiAgICAgIGFzc2VydEZ1bmN0aW9uKG1hcGZuKTtcclxuICAgICAgdmFyIE8gICAgICA9IHRvT2JqZWN0KG9iamVjdClcclxuICAgICAgICAsIGtleXMgICA9IGdldEtleXMoTylcclxuICAgICAgICAsIGxlbmd0aCA9IGtleXMubGVuZ3RoXHJcbiAgICAgICAgLCBpICAgICAgPSAwXHJcbiAgICAgICAgLCBtZW1vLCBrZXksIHJlc3VsdDtcclxuICAgICAgaWYoaXNUdXJuKW1lbW8gPSBpbml0ID09IHVuZGVmaW5lZCA/IG5ldyAoZ2VuZXJpYyh0aGlzLCBEaWN0KSkgOiBPYmplY3QoaW5pdCk7XHJcbiAgICAgIGVsc2UgaWYoYXJndW1lbnRzLmxlbmd0aCA8IDMpe1xyXG4gICAgICAgIGFzc2VydChsZW5ndGgsIFJFRFVDRV9FUlJPUik7XHJcbiAgICAgICAgbWVtbyA9IE9ba2V5c1tpKytdXTtcclxuICAgICAgfSBlbHNlIG1lbW8gPSBPYmplY3QoaW5pdCk7XHJcbiAgICAgIHdoaWxlKGxlbmd0aCA+IGkpaWYoaGFzKE8sIGtleSA9IGtleXNbaSsrXSkpe1xyXG4gICAgICAgIHJlc3VsdCA9IG1hcGZuKG1lbW8sIE9ba2V5XSwga2V5LCBvYmplY3QpO1xyXG4gICAgICAgIGlmKGlzVHVybil7XHJcbiAgICAgICAgICBpZihyZXN1bHQgPT09IGZhbHNlKWJyZWFrO1xyXG4gICAgICAgIH0gZWxzZSBtZW1vID0gcmVzdWx0O1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBtZW1vO1xyXG4gICAgfVxyXG4gIH1cclxuICB2YXIgZmluZEtleSA9IGNyZWF0ZURpY3RNZXRob2QoNik7XHJcbiAgZnVuY3Rpb24gaW5jbHVkZXMob2JqZWN0LCBlbCl7XHJcbiAgICByZXR1cm4gKGVsID09IGVsID8ga2V5T2Yob2JqZWN0LCBlbCkgOiBmaW5kS2V5KG9iamVjdCwgc2FtZU5hTikpICE9PSB1bmRlZmluZWQ7XHJcbiAgfVxyXG4gIFxyXG4gIHZhciBkaWN0TWV0aG9kcyA9IHtcclxuICAgIGtleXM6ICAgIGNyZWF0ZURpY3RJdGVyKEtFWSksXHJcbiAgICB2YWx1ZXM6ICBjcmVhdGVEaWN0SXRlcihWQUxVRSksXHJcbiAgICBlbnRyaWVzOiBjcmVhdGVEaWN0SXRlcihLRVkrVkFMVUUpLFxyXG4gICAgZm9yRWFjaDogY3JlYXRlRGljdE1ldGhvZCgwKSxcclxuICAgIG1hcDogICAgIGNyZWF0ZURpY3RNZXRob2QoMSksXHJcbiAgICBmaWx0ZXI6ICBjcmVhdGVEaWN0TWV0aG9kKDIpLFxyXG4gICAgc29tZTogICAgY3JlYXRlRGljdE1ldGhvZCgzKSxcclxuICAgIGV2ZXJ5OiAgIGNyZWF0ZURpY3RNZXRob2QoNCksXHJcbiAgICBmaW5kOiAgICBjcmVhdGVEaWN0TWV0aG9kKDUpLFxyXG4gICAgZmluZEtleTogZmluZEtleSxcclxuICAgIG1hcFBhaXJzOmNyZWF0ZURpY3RNZXRob2QoNyksXHJcbiAgICByZWR1Y2U6ICBjcmVhdGVEaWN0UmVkdWNlKGZhbHNlKSxcclxuICAgIHR1cm46ICAgIGNyZWF0ZURpY3RSZWR1Y2UodHJ1ZSksXHJcbiAgICBrZXlPZjogICBrZXlPZixcclxuICAgIGluY2x1ZGVzOmluY2x1ZGVzLFxyXG4gICAgLy8gSGFzIC8gZ2V0IC8gc2V0IG93biBwcm9wZXJ0eVxyXG4gICAgaGFzOiBoYXMsXHJcbiAgICBnZXQ6IGdldCxcclxuICAgIHNldDogY3JlYXRlRGVmaW5lcigwKSxcclxuICAgIGlzRGljdDogZnVuY3Rpb24oaXQpe1xyXG4gICAgICByZXR1cm4gaXNPYmplY3QoaXQpICYmIGdldFByb3RvdHlwZU9mKGl0KSA9PT0gRGljdFtQUk9UT1RZUEVdO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgXHJcbiAgaWYoUkVGRVJFTkNFX0dFVClmb3IodmFyIGtleSBpbiBkaWN0TWV0aG9kcykhZnVuY3Rpb24oZm4pe1xyXG4gICAgZnVuY3Rpb24gbWV0aG9kKCl7XHJcbiAgICAgIGZvcih2YXIgYXJncyA9IFt0aGlzXSwgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOylhcmdzLnB1c2goYXJndW1lbnRzW2krK10pO1xyXG4gICAgICByZXR1cm4gaW52b2tlKGZuLCBhcmdzKTtcclxuICAgIH1cclxuICAgIGZuW1JFRkVSRU5DRV9HRVRdID0gZnVuY3Rpb24oKXtcclxuICAgICAgcmV0dXJuIG1ldGhvZDtcclxuICAgIH1cclxuICB9KGRpY3RNZXRob2RzW2tleV0pO1xyXG4gIFxyXG4gICRkZWZpbmUoR0xPQkFMICsgRk9SQ0VELCB7RGljdDogYXNzaWduSGlkZGVuKERpY3QsIGRpY3RNZXRob2RzKX0pO1xyXG59KCdEaWN0Jyk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1vZHVsZSA6IGNvcmUuJGZvciAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiFmdW5jdGlvbihFTlRSSUVTLCBGTil7ICBcclxuICBmdW5jdGlvbiAkZm9yKGl0ZXJhYmxlLCBlbnRyaWVzKXtcclxuICAgIGlmKCEodGhpcyBpbnN0YW5jZW9mICRmb3IpKXJldHVybiBuZXcgJGZvcihpdGVyYWJsZSwgZW50cmllcyk7XHJcbiAgICB0aGlzW0lURVJdICAgID0gZ2V0SXRlcmF0b3IoaXRlcmFibGUpO1xyXG4gICAgdGhpc1tFTlRSSUVTXSA9ICEhZW50cmllcztcclxuICB9XHJcbiAgXHJcbiAgY3JlYXRlSXRlcmF0b3IoJGZvciwgJ1dyYXBwZXInLCBmdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuIHRoaXNbSVRFUl0ubmV4dCgpO1xyXG4gIH0pO1xyXG4gIHZhciAkZm9yUHJvdG8gPSAkZm9yW1BST1RPVFlQRV07XHJcbiAgc2V0SXRlcmF0b3IoJGZvclByb3RvLCBmdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuIHRoaXNbSVRFUl07IC8vIHVud3JhcFxyXG4gIH0pO1xyXG4gIFxyXG4gIGZ1bmN0aW9uIGNyZWF0ZUNoYWluSXRlcmF0b3IobmV4dCl7XHJcbiAgICBmdW5jdGlvbiBJdGVyKEksIGZuLCB0aGF0KXtcclxuICAgICAgdGhpc1tJVEVSXSAgICA9IGdldEl0ZXJhdG9yKEkpO1xyXG4gICAgICB0aGlzW0VOVFJJRVNdID0gSVtFTlRSSUVTXTtcclxuICAgICAgdGhpc1tGTl0gICAgICA9IGN0eChmbiwgdGhhdCwgSVtFTlRSSUVTXSA/IDIgOiAxKTtcclxuICAgIH1cclxuICAgIGNyZWF0ZUl0ZXJhdG9yKEl0ZXIsICdDaGFpbicsIG5leHQsICRmb3JQcm90byk7XHJcbiAgICBzZXRJdGVyYXRvcihJdGVyW1BST1RPVFlQRV0sIHJldHVyblRoaXMpOyAvLyBvdmVycmlkZSAkZm9yUHJvdG8gaXRlcmF0b3JcclxuICAgIHJldHVybiBJdGVyO1xyXG4gIH1cclxuICBcclxuICB2YXIgTWFwSXRlciA9IGNyZWF0ZUNoYWluSXRlcmF0b3IoZnVuY3Rpb24oKXtcclxuICAgIHZhciBzdGVwID0gdGhpc1tJVEVSXS5uZXh0KCk7XHJcbiAgICByZXR1cm4gc3RlcC5kb25lID8gc3RlcCA6IGl0ZXJSZXN1bHQoMCwgc3RlcENhbGwodGhpc1tGTl0sIHN0ZXAudmFsdWUsIHRoaXNbRU5UUklFU10pKTtcclxuICB9KTtcclxuICBcclxuICB2YXIgRmlsdGVySXRlciA9IGNyZWF0ZUNoYWluSXRlcmF0b3IoZnVuY3Rpb24oKXtcclxuICAgIGZvcig7Oyl7XHJcbiAgICAgIHZhciBzdGVwID0gdGhpc1tJVEVSXS5uZXh0KCk7XHJcbiAgICAgIGlmKHN0ZXAuZG9uZSB8fCBzdGVwQ2FsbCh0aGlzW0ZOXSwgc3RlcC52YWx1ZSwgdGhpc1tFTlRSSUVTXSkpcmV0dXJuIHN0ZXA7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgXHJcbiAgYXNzaWduSGlkZGVuKCRmb3JQcm90bywge1xyXG4gICAgb2Y6IGZ1bmN0aW9uKGZuLCB0aGF0KXtcclxuICAgICAgZm9yT2YodGhpcywgdGhpc1tFTlRSSUVTXSwgZm4sIHRoYXQpO1xyXG4gICAgfSxcclxuICAgIGFycmF5OiBmdW5jdGlvbihmbiwgdGhhdCl7XHJcbiAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgZm9yT2YoZm4gIT0gdW5kZWZpbmVkID8gdGhpcy5tYXAoZm4sIHRoYXQpIDogdGhpcywgZmFsc2UsIHB1c2gsIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG4gICAgZmlsdGVyOiBmdW5jdGlvbihmbiwgdGhhdCl7XHJcbiAgICAgIHJldHVybiBuZXcgRmlsdGVySXRlcih0aGlzLCBmbiwgdGhhdCk7XHJcbiAgICB9LFxyXG4gICAgbWFwOiBmdW5jdGlvbihmbiwgdGhhdCl7XHJcbiAgICAgIHJldHVybiBuZXcgTWFwSXRlcih0aGlzLCBmbiwgdGhhdCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgXHJcbiAgJGZvci5pc0l0ZXJhYmxlICA9IGlzSXRlcmFibGU7XHJcbiAgJGZvci5nZXRJdGVyYXRvciA9IGdldEl0ZXJhdG9yO1xyXG4gIFxyXG4gICRkZWZpbmUoR0xPQkFMICsgRk9SQ0VELCB7JGZvcjogJGZvcn0pO1xyXG59KCdlbnRyaWVzJywgc2FmZVN5bWJvbCgnZm4nKSk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1vZHVsZSA6IGNvcmUuZGVsYXkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8vIGh0dHBzOi8vZXNkaXNjdXNzLm9yZy90b3BpYy9wcm9taXNlLXJldHVybmluZy1kZWxheS1mdW5jdGlvblxyXG4kZGVmaW5lKEdMT0JBTCArIEZPUkNFRCwge1xyXG4gIGRlbGF5OiBmdW5jdGlvbih0aW1lKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKXtcclxuICAgICAgc2V0VGltZW91dChyZXNvbHZlLCB0aW1lLCB0cnVlKTtcclxuICAgIH0pO1xyXG4gIH1cclxufSk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1vZHVsZSA6IGNvcmUuYmluZGluZyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiFmdW5jdGlvbihfLCB0b0xvY2FsZVN0cmluZyl7XHJcbiAgLy8gUGxhY2Vob2xkZXJcclxuICBjb3JlLl8gPSBwYXRoLl8gPSBwYXRoLl8gfHwge307XHJcblxyXG4gICRkZWZpbmUoUFJPVE8gKyBGT1JDRUQsIEZVTkNUSU9OLCB7XHJcbiAgICBwYXJ0OiBwYXJ0LFxyXG4gICAgb25seTogZnVuY3Rpb24obnVtYmVyQXJndW1lbnRzLCB0aGF0IC8qID0gQCAqLyl7XHJcbiAgICAgIHZhciBmbiAgICAgPSBhc3NlcnRGdW5jdGlvbih0aGlzKVxyXG4gICAgICAgICwgbiAgICAgID0gdG9MZW5ndGgobnVtYmVyQXJndW1lbnRzKVxyXG4gICAgICAgICwgaXNUaGF0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDE7XHJcbiAgICAgIHJldHVybiBmdW5jdGlvbigvKiAuLi5hcmdzICovKXtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gbWluKG4sIGFyZ3VtZW50cy5sZW5ndGgpXHJcbiAgICAgICAgICAsIGFyZ3MgICA9IEFycmF5KGxlbmd0aClcclxuICAgICAgICAgICwgaSAgICAgID0gMDtcclxuICAgICAgICB3aGlsZShsZW5ndGggPiBpKWFyZ3NbaV0gPSBhcmd1bWVudHNbaSsrXTtcclxuICAgICAgICByZXR1cm4gaW52b2tlKGZuLCBhcmdzLCBpc1RoYXQgPyB0aGF0IDogdGhpcyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxuICBcclxuICBmdW5jdGlvbiB0aWUoa2V5KXtcclxuICAgIHZhciB0aGF0ICA9IHRoaXNcclxuICAgICAgLCBib3VuZCA9IHt9O1xyXG4gICAgcmV0dXJuIGhpZGRlbih0aGF0LCBfLCBmdW5jdGlvbihrZXkpe1xyXG4gICAgICBpZihrZXkgPT09IHVuZGVmaW5lZCB8fCAhKGtleSBpbiB0aGF0KSlyZXR1cm4gdG9Mb2NhbGVTdHJpbmcuY2FsbCh0aGF0KTtcclxuICAgICAgcmV0dXJuIGhhcyhib3VuZCwga2V5KSA/IGJvdW5kW2tleV0gOiAoYm91bmRba2V5XSA9IGN0eCh0aGF0W2tleV0sIHRoYXQsIC0xKSk7XHJcbiAgICB9KVtfXShrZXkpO1xyXG4gIH1cclxuICBcclxuICBoaWRkZW4ocGF0aC5fLCBUT19TVFJJTkcsIGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gXztcclxuICB9KTtcclxuICBcclxuICBoaWRkZW4oT2JqZWN0UHJvdG8sIF8sIHRpZSk7XHJcbiAgREVTQyB8fCBoaWRkZW4oQXJyYXlQcm90bywgXywgdGllKTtcclxuICAvLyBJRTgtIGRpcnR5IGhhY2sgLSByZWRlZmluZWQgdG9Mb2NhbGVTdHJpbmcgaXMgbm90IGVudW1lcmFibGVcclxufShERVNDID8gdWlkKCd0aWUnKSA6IFRPX0xPQ0FMRSwgT2JqZWN0UHJvdG9bVE9fTE9DQUxFXSk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1vZHVsZSA6IGNvcmUub2JqZWN0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiFmdW5jdGlvbigpe1xyXG4gIGZ1bmN0aW9uIGRlZmluZSh0YXJnZXQsIG1peGluKXtcclxuICAgIHZhciBrZXlzICAgPSBvd25LZXlzKHRvT2JqZWN0KG1peGluKSlcclxuICAgICAgLCBsZW5ndGggPSBrZXlzLmxlbmd0aFxyXG4gICAgICAsIGkgPSAwLCBrZXk7XHJcbiAgICB3aGlsZShsZW5ndGggPiBpKWRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5ID0ga2V5c1tpKytdLCBnZXRPd25EZXNjcmlwdG9yKG1peGluLCBrZXkpKTtcclxuICAgIHJldHVybiB0YXJnZXQ7XHJcbiAgfTtcclxuICAkZGVmaW5lKFNUQVRJQyArIEZPUkNFRCwgT0JKRUNULCB7XHJcbiAgICBpc09iamVjdDogaXNPYmplY3QsXHJcbiAgICBjbGFzc29mOiBjbGFzc29mLFxyXG4gICAgZGVmaW5lOiBkZWZpbmUsXHJcbiAgICBtYWtlOiBmdW5jdGlvbihwcm90bywgbWl4aW4pe1xyXG4gICAgICByZXR1cm4gZGVmaW5lKGNyZWF0ZShwcm90byksIG1peGluKTtcclxuICAgIH1cclxuICB9KTtcclxufSgpO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBNb2R1bGUgOiBjb3JlLmFycmF5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4kZGVmaW5lKFBST1RPICsgRk9SQ0VELCBBUlJBWSwge1xyXG4gIHR1cm46IGZ1bmN0aW9uKGZuLCB0YXJnZXQgLyogPSBbXSAqLyl7XHJcbiAgICBhc3NlcnRGdW5jdGlvbihmbik7XHJcbiAgICB2YXIgbWVtbyAgID0gdGFyZ2V0ID09IHVuZGVmaW5lZCA/IFtdIDogT2JqZWN0KHRhcmdldClcclxuICAgICAgLCBPICAgICAgPSBFUzVPYmplY3QodGhpcylcclxuICAgICAgLCBsZW5ndGggPSB0b0xlbmd0aChPLmxlbmd0aClcclxuICAgICAgLCBpbmRleCAgPSAwO1xyXG4gICAgd2hpbGUobGVuZ3RoID4gaW5kZXgpaWYoZm4obWVtbywgT1tpbmRleF0sIGluZGV4KyssIHRoaXMpID09PSBmYWxzZSlicmVhaztcclxuICAgIHJldHVybiBtZW1vO1xyXG4gIH1cclxufSk7XHJcbmlmKGZyYW1ld29yaylBcnJheVVuc2NvcGFibGVzLnR1cm4gPSB0cnVlO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBNb2R1bGUgOiBjb3JlLm51bWJlciAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4hZnVuY3Rpb24obnVtYmVyTWV0aG9kcyl7ICBcclxuICBmdW5jdGlvbiBOdW1iZXJJdGVyYXRvcihpdGVyYXRlZCl7XHJcbiAgICBzZXQodGhpcywgSVRFUiwge2w6IHRvTGVuZ3RoKGl0ZXJhdGVkKSwgaTogMH0pO1xyXG4gIH1cclxuICBjcmVhdGVJdGVyYXRvcihOdW1iZXJJdGVyYXRvciwgTlVNQkVSLCBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGl0ZXIgPSB0aGlzW0lURVJdXHJcbiAgICAgICwgaSAgICA9IGl0ZXIuaSsrO1xyXG4gICAgcmV0dXJuIGkgPCBpdGVyLmwgPyBpdGVyUmVzdWx0KDAsIGkpIDogaXRlclJlc3VsdCgxKTtcclxuICB9KTtcclxuICBkZWZpbmVJdGVyYXRvcihOdW1iZXIsIE5VTUJFUiwgZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiBuZXcgTnVtYmVySXRlcmF0b3IodGhpcyk7XHJcbiAgfSk7XHJcbiAgXHJcbiAgbnVtYmVyTWV0aG9kcy5yYW5kb20gPSBmdW5jdGlvbihsaW0gLyogPSAwICovKXtcclxuICAgIHZhciBhID0gK3RoaXNcclxuICAgICAgLCBiID0gbGltID09IHVuZGVmaW5lZCA/IDAgOiArbGltXHJcbiAgICAgICwgbSA9IG1pbihhLCBiKTtcclxuICAgIHJldHVybiByYW5kb20oKSAqIChtYXgoYSwgYikgLSBtKSArIG07XHJcbiAgfTtcclxuXHJcbiAgZm9yRWFjaC5jYWxsKGFycmF5KFxyXG4gICAgICAvLyBFUzM6XHJcbiAgICAgICdyb3VuZCxmbG9vcixjZWlsLGFicyxzaW4sYXNpbixjb3MsYWNvcyx0YW4sYXRhbixleHAsc3FydCxtYXgsbWluLHBvdyxhdGFuMiwnICtcclxuICAgICAgLy8gRVM2OlxyXG4gICAgICAnYWNvc2gsYXNpbmgsYXRhbmgsY2JydCxjbHozMixjb3NoLGV4cG0xLGh5cG90LGltdWwsbG9nMXAsbG9nMTAsbG9nMixzaWduLHNpbmgsdGFuaCx0cnVuYydcclxuICAgICksIGZ1bmN0aW9uKGtleSl7XHJcbiAgICAgIHZhciBmbiA9IE1hdGhba2V5XTtcclxuICAgICAgaWYoZm4pbnVtYmVyTWV0aG9kc1trZXldID0gZnVuY3Rpb24oLyogLi4uYXJncyAqLyl7XHJcbiAgICAgICAgLy8gaWU5LSBkb250IHN1cHBvcnQgc3RyaWN0IG1vZGUgJiBjb252ZXJ0IGB0aGlzYCB0byBvYmplY3QgLT4gY29udmVydCBpdCB0byBudW1iZXJcclxuICAgICAgICB2YXIgYXJncyA9IFsrdGhpc11cclxuICAgICAgICAgICwgaSAgICA9IDA7XHJcbiAgICAgICAgd2hpbGUoYXJndW1lbnRzLmxlbmd0aCA+IGkpYXJncy5wdXNoKGFyZ3VtZW50c1tpKytdKTtcclxuICAgICAgICByZXR1cm4gaW52b2tlKGZuLCBhcmdzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICk7XHJcbiAgXHJcbiAgJGRlZmluZShQUk9UTyArIEZPUkNFRCwgTlVNQkVSLCBudW1iZXJNZXRob2RzKTtcclxufSh7fSk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1vZHVsZSA6IGNvcmUuc3RyaW5nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiFmdW5jdGlvbigpe1xyXG4gIHZhciBlc2NhcGVIVE1MRGljdCA9IHtcclxuICAgICcmJzogJyZhbXA7JyxcclxuICAgICc8JzogJyZsdDsnLFxyXG4gICAgJz4nOiAnJmd0OycsXHJcbiAgICAnXCInOiAnJnF1b3Q7JyxcclxuICAgIFwiJ1wiOiAnJmFwb3M7J1xyXG4gIH0sIHVuZXNjYXBlSFRNTERpY3QgPSB7fSwga2V5O1xyXG4gIGZvcihrZXkgaW4gZXNjYXBlSFRNTERpY3QpdW5lc2NhcGVIVE1MRGljdFtlc2NhcGVIVE1MRGljdFtrZXldXSA9IGtleTtcclxuICAkZGVmaW5lKFBST1RPICsgRk9SQ0VELCBTVFJJTkcsIHtcclxuICAgIGVzY2FwZUhUTUw6ICAgY3JlYXRlUmVwbGFjZXIoL1smPD5cIiddL2csIGVzY2FwZUhUTUxEaWN0KSxcclxuICAgIHVuZXNjYXBlSFRNTDogY3JlYXRlUmVwbGFjZXIoLyYoPzphbXB8bHR8Z3R8cXVvdHxhcG9zKTsvZywgdW5lc2NhcGVIVE1MRGljdClcclxuICB9KTtcclxufSgpO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBNb2R1bGUgOiBjb3JlLmRhdGUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4hZnVuY3Rpb24oZm9ybWF0UmVnRXhwLCBmbGV4aW9SZWdFeHAsIGxvY2FsZXMsIGN1cnJlbnQsIFNFQ09ORFMsIE1JTlVURVMsIEhPVVJTLCBNT05USCwgWUVBUil7XHJcbiAgZnVuY3Rpb24gY3JlYXRlRm9ybWF0KHByZWZpeCl7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24odGVtcGxhdGUsIGxvY2FsZSAvKiA9IGN1cnJlbnQgKi8pe1xyXG4gICAgICB2YXIgdGhhdCA9IHRoaXNcclxuICAgICAgICAsIGRpY3QgPSBsb2NhbGVzW2hhcyhsb2NhbGVzLCBsb2NhbGUpID8gbG9jYWxlIDogY3VycmVudF07XHJcbiAgICAgIGZ1bmN0aW9uIGdldCh1bml0KXtcclxuICAgICAgICByZXR1cm4gdGhhdFtwcmVmaXggKyB1bml0XSgpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBTdHJpbmcodGVtcGxhdGUpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbihwYXJ0KXtcclxuICAgICAgICBzd2l0Y2gocGFydCl7XHJcbiAgICAgICAgICBjYXNlICdzJyAgOiByZXR1cm4gZ2V0KFNFQ09ORFMpOyAgICAgICAgICAgICAgICAgIC8vIFNlY29uZHMgOiAwLTU5XHJcbiAgICAgICAgICBjYXNlICdzcycgOiByZXR1cm4gbHooZ2V0KFNFQ09ORFMpKTsgICAgICAgICAgICAgIC8vIFNlY29uZHMgOiAwMC01OVxyXG4gICAgICAgICAgY2FzZSAnbScgIDogcmV0dXJuIGdldChNSU5VVEVTKTsgICAgICAgICAgICAgICAgICAvLyBNaW51dGVzIDogMC01OVxyXG4gICAgICAgICAgY2FzZSAnbW0nIDogcmV0dXJuIGx6KGdldChNSU5VVEVTKSk7ICAgICAgICAgICAgICAvLyBNaW51dGVzIDogMDAtNTlcclxuICAgICAgICAgIGNhc2UgJ2gnICA6IHJldHVybiBnZXQoSE9VUlMpOyAgICAgICAgICAgICAgICAgICAgLy8gSG91cnMgICA6IDAtMjNcclxuICAgICAgICAgIGNhc2UgJ2hoJyA6IHJldHVybiBseihnZXQoSE9VUlMpKTsgICAgICAgICAgICAgICAgLy8gSG91cnMgICA6IDAwLTIzXHJcbiAgICAgICAgICBjYXNlICdEJyAgOiByZXR1cm4gZ2V0KERBVEUpOyAgICAgICAgICAgICAgICAgICAgIC8vIERhdGUgICAgOiAxLTMxXHJcbiAgICAgICAgICBjYXNlICdERCcgOiByZXR1cm4gbHooZ2V0KERBVEUpKTsgICAgICAgICAgICAgICAgIC8vIERhdGUgICAgOiAwMS0zMVxyXG4gICAgICAgICAgY2FzZSAnVycgIDogcmV0dXJuIGRpY3RbMF1bZ2V0KCdEYXknKV07ICAgICAgICAgICAvLyBEYXkgICAgIDog0J/QvtC90LXQtNC10LvRjNC90LjQulxyXG4gICAgICAgICAgY2FzZSAnTicgIDogcmV0dXJuIGdldChNT05USCkgKyAxOyAgICAgICAgICAgICAgICAvLyBNb250aCAgIDogMS0xMlxyXG4gICAgICAgICAgY2FzZSAnTk4nIDogcmV0dXJuIGx6KGdldChNT05USCkgKyAxKTsgICAgICAgICAgICAvLyBNb250aCAgIDogMDEtMTJcclxuICAgICAgICAgIGNhc2UgJ00nICA6IHJldHVybiBkaWN0WzJdW2dldChNT05USCldOyAgICAgICAgICAgLy8gTW9udGggICA6INCv0L3QstCw0YDRjFxyXG4gICAgICAgICAgY2FzZSAnTU0nIDogcmV0dXJuIGRpY3RbMV1bZ2V0KE1PTlRIKV07ICAgICAgICAgICAvLyBNb250aCAgIDog0K/QvdCy0LDRgNGPXHJcbiAgICAgICAgICBjYXNlICdZJyAgOiByZXR1cm4gZ2V0KFlFQVIpOyAgICAgICAgICAgICAgICAgICAgIC8vIFllYXIgICAgOiAyMDE0XHJcbiAgICAgICAgICBjYXNlICdZWScgOiByZXR1cm4gbHooZ2V0KFlFQVIpICUgMTAwKTsgICAgICAgICAgIC8vIFllYXIgICAgOiAxNFxyXG4gICAgICAgIH0gcmV0dXJuIHBhcnQ7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuICBmdW5jdGlvbiBhZGRMb2NhbGUobGFuZywgbG9jYWxlKXtcclxuICAgIGZ1bmN0aW9uIHNwbGl0KGluZGV4KXtcclxuICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgICBmb3JFYWNoLmNhbGwoYXJyYXkobG9jYWxlLm1vbnRocyksIGZ1bmN0aW9uKGl0KXtcclxuICAgICAgICByZXN1bHQucHVzaChpdC5yZXBsYWNlKGZsZXhpb1JlZ0V4cCwgJyQnICsgaW5kZXgpKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgICBsb2NhbGVzW2xhbmddID0gW2FycmF5KGxvY2FsZS53ZWVrZGF5cyksIHNwbGl0KDEpLCBzcGxpdCgyKV07XHJcbiAgICByZXR1cm4gY29yZTtcclxuICB9XHJcbiAgJGRlZmluZShQUk9UTyArIEZPUkNFRCwgREFURSwge1xyXG4gICAgZm9ybWF0OiAgICBjcmVhdGVGb3JtYXQoJ2dldCcpLFxyXG4gICAgZm9ybWF0VVRDOiBjcmVhdGVGb3JtYXQoJ2dldFVUQycpXHJcbiAgfSk7XHJcbiAgYWRkTG9jYWxlKGN1cnJlbnQsIHtcclxuICAgIHdlZWtkYXlzOiAnU3VuZGF5LE1vbmRheSxUdWVzZGF5LFdlZG5lc2RheSxUaHVyc2RheSxGcmlkYXksU2F0dXJkYXknLFxyXG4gICAgbW9udGhzOiAnSmFudWFyeSxGZWJydWFyeSxNYXJjaCxBcHJpbCxNYXksSnVuZSxKdWx5LEF1Z3VzdCxTZXB0ZW1iZXIsT2N0b2JlcixOb3ZlbWJlcixEZWNlbWJlcidcclxuICB9KTtcclxuICBhZGRMb2NhbGUoJ3J1Jywge1xyXG4gICAgd2Vla2RheXM6ICfQktC+0YHQutGA0LXRgdC10L3RjNC1LNCf0L7QvdC10LTQtdC70YzQvdC40Los0JLRgtC+0YDQvdC40Los0KHRgNC10LTQsCzQp9C10YLQstC10YDQsyzQn9GP0YLQvdC40YbQsCzQodGD0LHQsdC+0YLQsCcsXHJcbiAgICBtb250aHM6ICfQr9C90LLQsNGAOtGPfNGMLNCk0LXQstGA0LDQuzrRj3zRjCzQnNCw0YDRgjrQsHws0JDQv9GA0LXQuzrRj3zRjCzQnNCwOtGPfNC5LNCY0Y7QvTrRj3zRjCwnICtcclxuICAgICAgICAgICAgJ9CY0Y7QuzrRj3zRjCzQkNCy0LPRg9GB0YI60LB8LNCh0LXQvdGC0Y/QsdGAOtGPfNGMLNCe0LrRgtGP0LHRgDrRj3zRjCzQndC+0Y/QsdGAOtGPfNGMLNCU0LXQutCw0LHRgDrRj3zRjCdcclxuICB9KTtcclxuICBjb3JlLmxvY2FsZSA9IGZ1bmN0aW9uKGxvY2FsZSl7XHJcbiAgICByZXR1cm4gaGFzKGxvY2FsZXMsIGxvY2FsZSkgPyBjdXJyZW50ID0gbG9jYWxlIDogY3VycmVudDtcclxuICB9O1xyXG4gIGNvcmUuYWRkTG9jYWxlID0gYWRkTG9jYWxlO1xyXG59KC9cXGJcXHdcXHc/XFxiL2csIC86KC4qKVxcfCguKikkLywge30sICdlbicsICdTZWNvbmRzJywgJ01pbnV0ZXMnLCAnSG91cnMnLCAnTW9udGgnLCAnRnVsbFllYXInKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogTW9kdWxlIDogY29yZS5nbG9iYWwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuJGRlZmluZShHTE9CQUwgKyBGT1JDRUQsIHtnbG9iYWw6IGdsb2JhbH0pO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBNb2R1bGUgOiBqcy5hcnJheS5zdGF0aWNzICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vLyBKYXZhU2NyaXB0IDEuNiAvIFN0cmF3bWFuIGFycmF5IHN0YXRpY3Mgc2hpbVxyXG4hZnVuY3Rpb24oYXJyYXlTdGF0aWNzKXtcclxuICBmdW5jdGlvbiBzZXRBcnJheVN0YXRpY3Moa2V5cywgbGVuZ3RoKXtcclxuICAgIGZvckVhY2guY2FsbChhcnJheShrZXlzKSwgZnVuY3Rpb24oa2V5KXtcclxuICAgICAgaWYoa2V5IGluIEFycmF5UHJvdG8pYXJyYXlTdGF0aWNzW2tleV0gPSBjdHgoY2FsbCwgQXJyYXlQcm90b1trZXldLCBsZW5ndGgpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHNldEFycmF5U3RhdGljcygncG9wLHJldmVyc2Usc2hpZnQsa2V5cyx2YWx1ZXMsZW50cmllcycsIDEpO1xyXG4gIHNldEFycmF5U3RhdGljcygnaW5kZXhPZixldmVyeSxzb21lLGZvckVhY2gsbWFwLGZpbHRlcixmaW5kLGZpbmRJbmRleCxpbmNsdWRlcycsIDMpO1xyXG4gIHNldEFycmF5U3RhdGljcygnam9pbixzbGljZSxjb25jYXQscHVzaCxzcGxpY2UsdW5zaGlmdCxzb3J0LGxhc3RJbmRleE9mLCcgK1xyXG4gICAgICAgICAgICAgICAgICAncmVkdWNlLHJlZHVjZVJpZ2h0LGNvcHlXaXRoaW4sZmlsbCx0dXJuJyk7XHJcbiAgJGRlZmluZShTVEFUSUMsIEFSUkFZLCBhcnJheVN0YXRpY3MpO1xyXG59KHt9KTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogTW9kdWxlIDogd2ViLmRvbS5pdGFyYWJsZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuIWZ1bmN0aW9uKE5vZGVMaXN0KXtcclxuICBpZihmcmFtZXdvcmsgJiYgTm9kZUxpc3QgJiYgIShTWU1CT0xfSVRFUkFUT1IgaW4gTm9kZUxpc3RbUFJPVE9UWVBFXSkpe1xyXG4gICAgaGlkZGVuKE5vZGVMaXN0W1BST1RPVFlQRV0sIFNZTUJPTF9JVEVSQVRPUiwgSXRlcmF0b3JzW0FSUkFZXSk7XHJcbiAgfVxyXG4gIEl0ZXJhdG9ycy5Ob2RlTGlzdCA9IEl0ZXJhdG9yc1tBUlJBWV07XHJcbn0oZ2xvYmFsLk5vZGVMaXN0KTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogTW9kdWxlIDogY29yZS5sb2cgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuIWZ1bmN0aW9uKGxvZywgZW5hYmxlZCl7XHJcbiAgLy8gTWV0aG9kcyBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9EZXZlbG9wZXJUb29sc1dHL2NvbnNvbGUtb2JqZWN0L2Jsb2IvbWFzdGVyL2FwaS5tZFxyXG4gIGZvckVhY2guY2FsbChhcnJheSgnYXNzZXJ0LGNsZWFyLGNvdW50LGRlYnVnLGRpcixkaXJ4bWwsZXJyb3IsZXhjZXB0aW9uLCcgK1xyXG4gICAgICAnZ3JvdXAsZ3JvdXBDb2xsYXBzZWQsZ3JvdXBFbmQsaW5mbyxpc0luZGVwZW5kZW50bHlDb21wb3NlZCxsb2csJyArXHJcbiAgICAgICdtYXJrVGltZWxpbmUscHJvZmlsZSxwcm9maWxlRW5kLHRhYmxlLHRpbWUsdGltZUVuZCx0aW1lbGluZSwnICtcclxuICAgICAgJ3RpbWVsaW5lRW5kLHRpbWVTdGFtcCx0cmFjZSx3YXJuJyksIGZ1bmN0aW9uKGtleSl7XHJcbiAgICBsb2dba2V5XSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgIGlmKGVuYWJsZWQgJiYga2V5IGluIGNvbnNvbGUpcmV0dXJuIGFwcGx5LmNhbGwoY29uc29sZVtrZXldLCBjb25zb2xlLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuICB9KTtcclxuICAkZGVmaW5lKEdMT0JBTCArIEZPUkNFRCwge2xvZzogYXNzaWduKGxvZy5sb2csIGxvZywge1xyXG4gICAgZW5hYmxlOiBmdW5jdGlvbigpe1xyXG4gICAgICBlbmFibGVkID0gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBkaXNhYmxlOiBmdW5jdGlvbigpe1xyXG4gICAgICBlbmFibGVkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSl9KTtcclxufSh7fSwgdHJ1ZSk7XG59KHR5cGVvZiBzZWxmICE9ICd1bmRlZmluZWQnICYmIHNlbGYuTWF0aCA9PT0gTWF0aCA/IHNlbGYgOiBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpLCBmYWxzZSk7XG5tb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IG1vZHVsZS5leHBvcnRzLCBfX2VzTW9kdWxlOiB0cnVlIH07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBmdW5jdGlvbiAoaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7XG4gIGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTtcbiAgfVxufTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gcHJvcHMpIHtcbiAgICAgIHZhciBwcm9wID0gcHJvcHNba2V5XTtcbiAgICAgIHByb3AuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICAgIGlmIChwcm9wLnZhbHVlKSBwcm9wLndyaXRhYmxlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gICAgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTtcbiAgICBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTtcbiAgICByZXR1cm4gQ29uc3RydWN0b3I7XG4gIH07XG59KSgpO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlOyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX2NvcmUgPSByZXF1aXJlKFwiYmFiZWwtcnVudGltZS9jb3JlLWpzXCIpW1wiZGVmYXVsdFwiXTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBmdW5jdGlvbiBnZXQoX3gsIF94MiwgX3gzKSB7XG4gIHZhciBfYWdhaW4gPSB0cnVlO1xuXG4gIF9mdW5jdGlvbjogd2hpbGUgKF9hZ2Fpbikge1xuICAgIF9hZ2FpbiA9IGZhbHNlO1xuICAgIHZhciBvYmplY3QgPSBfeCxcbiAgICAgICAgcHJvcGVydHkgPSBfeDIsXG4gICAgICAgIHJlY2VpdmVyID0gX3gzO1xuICAgIGRlc2MgPSBwYXJlbnQgPSBnZXR0ZXIgPSB1bmRlZmluZWQ7XG5cbiAgICB2YXIgZGVzYyA9IF9jb3JlLk9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBwcm9wZXJ0eSk7XG5cbiAgICBpZiAoZGVzYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB2YXIgcGFyZW50ID0gX2NvcmUuT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iamVjdCk7XG5cbiAgICAgIGlmIChwYXJlbnQgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF94ID0gcGFyZW50O1xuICAgICAgICBfeDIgPSBwcm9wZXJ0eTtcbiAgICAgICAgX3gzID0gcmVjZWl2ZXI7XG4gICAgICAgIF9hZ2FpbiA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlIF9mdW5jdGlvbjtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKFwidmFsdWVcIiBpbiBkZXNjICYmIGRlc2Mud3JpdGFibGUpIHtcbiAgICAgIHJldHVybiBkZXNjLnZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZ2V0dGVyID0gZGVzYy5nZXQ7XG5cbiAgICAgIGlmIChnZXR0ZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZ2V0dGVyLmNhbGwocmVjZWl2ZXIpO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBmdW5jdGlvbiAoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHtcbiAgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90IFwiICsgdHlwZW9mIHN1cGVyQ2xhc3MpO1xuICB9XG5cbiAgc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7XG4gICAgY29uc3RydWN0b3I6IHtcbiAgICAgIHZhbHVlOiBzdWJDbGFzcyxcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9XG4gIH0pO1xuICBpZiAoc3VwZXJDbGFzcykgc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzcztcbn07XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7Il19
