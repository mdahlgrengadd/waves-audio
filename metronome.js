!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.Metronome=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/* Generated by es6-transpiler v 0.7.14-2 */
// instantiates an audio context in the global scope if not there already
var context = window.audioContext || new AudioContext();
window.audioContext = context;
module.exports = context;
},{}],2:[function(_dereq_,module,exports){

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
},{}],3:[function(_dereq_,module,exports){
/* Generated by es6-transpiler v 0.7.14-2 *//* written in ECMAscript 6 */
/**
 * @fileoverview WAVE audio metronome engine
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 */
"use strict";

var audioContext = _dereq_("../audio-context");
var EventEngine = _dereq_("../event-engine");

var Metronome = (function(super$0){var DP$0 = Object.defineProperty;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,Object.getOwnPropertyDescriptor(s,p));}}return t};MIXIN$0(Metronome, super$0);
  function Metronome() {var period = arguments[0];if(period === void 0)period = 1;var frequency = arguments[1];if(frequency === void 0)frequency = 600;var attack = arguments[2];if(attack === void 0)attack = 0.002;var release = arguments[3];if(release === void 0)release = 0.098;
    super$0.call(this);

    this.period = period; // in sec
    this.frequency = frequency;
    this.attack = attack;
    this.release = release;

    this.__phase = 0;
    this.__aligned = true;

    this.__gainNode = audioContext.createGain();
    this.outputNode = this.__gainNode;
  }Metronome.prototype = Object.create(super$0.prototype, {"constructor": {"value": Metronome, "configurable": true, "writable": true}, gain: {"get": gain$get$0, "set": gain$set$0, "configurable": true, "enumerable": true}, phase: {"get": phase$get$0, "set": phase$set$0, "configurable": true, "enumerable": true}, aligned: {"get": aligned$get$0, "set": aligned$set$0, "configurable": true, "enumerable": true} });DP$0(Metronome, "prototype", {"configurable": false, "enumerable": false, "writable": false});

  // EventEngine syncEvent
  Metronome.prototype.syncEvent = function(time) {
    var cycles = -this.__phase;

    if (this.__aligned || this.transport) // is always aligned in transport
      cycles += time / this.period;

    if (this.transport && this.transport.reverse)
      cycles *= -1;

    var delay = (Math.ceil(cycles) - cycles) * this.period;

    return delay;
  }

  // EventEngine executeEvent
  Metronome.prototype.executeEvent = function(time, audioTime) {
    this.trigger(audioTime);
    return this.period;
  }

  Metronome.prototype.trigger = function(audioTime) {
    var attack = this.attack;
    var release = this.release;
    var period = this.period;

    if (period < this.attack + this.release) {
      var scale = period / (this.attack + this.release);
      attack *= scale;
      release *= scale;
    }

    this.__envNode = audioContext.createGain();
    this.__envNode.gain.value = 0.0;
    this.__envNode.gain.setValueAtTime(0, audioTime);
    this.__envNode.gain.linearRampToValueAtTime(1.0, audioTime + attack);
    this.__envNode.gain.exponentialRampToValueAtTime(0.0000001, audioTime + attack + release);
    this.__envNode.gain.setValueAtTime(0, audioTime);
    this.__envNode.connect(this.__gainNode);

    this.__osc = audioContext.createOscillator();
    this.__osc.frequency.value = this.frequency;
    this.__osc.start(0);
    this.__osc.stop(audioTime + attack + release);
    this.__osc.connect(this.__envNode);
  }

  function gain$set$0(value) {
    this.__gainNode.gain.value = value;
  }

  function gain$get$0() {
    return this.__gainNode.gain.value;
  }

  function phase$set$0(phase) {
    this.__phase = phase;
    this.resyncEngine();
  }

  function phase$get$0() {
    return this.__phase;
  }

  function aligned$set$0(aligned) {
    this.__aligned = aligned;
    this.resyncEngine();
  }

  function aligned$get$0() {
    return this.__aligned;
  }
;return Metronome;})(EventEngine);

module.exports = Metronome;
},{"../audio-context":1,"../event-engine":2}]},{},[3])
(3)
});