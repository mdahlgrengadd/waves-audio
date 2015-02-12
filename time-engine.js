!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self),n.TimeEngine=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
  'use strict';

  function fixSetTarget(param) {
    if (!param) // if NYI, just return
      return;
    if (!param.setTargetAtTime)
      param.setTargetAtTime = param.setTargetValueAtTime; 
  }

  if (window.hasOwnProperty('webkitAudioContext') && 
      !window.hasOwnProperty('AudioContext')) {
    window.AudioContext = webkitAudioContext;

    if (!AudioContext.prototype.hasOwnProperty('createGain'))
      AudioContext.prototype.createGain = AudioContext.prototype.createGainNode;
    if (!AudioContext.prototype.hasOwnProperty('createDelay'))
      AudioContext.prototype.createDelay = AudioContext.prototype.createDelayNode;
    if (!AudioContext.prototype.hasOwnProperty('createScriptProcessor'))
      AudioContext.prototype.createScriptProcessor = AudioContext.prototype.createJavaScriptNode;
    if (!AudioContext.prototype.hasOwnProperty('createPeriodicWave'))
      AudioContext.prototype.createPeriodicWave = AudioContext.prototype.createWaveTable;


    AudioContext.prototype.internal_createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function() { 
      var node = this.internal_createGain();
      fixSetTarget(node.gain);
      return node;
    };

    AudioContext.prototype.internal_createDelay = AudioContext.prototype.createDelay;
    AudioContext.prototype.createDelay = function(maxDelayTime) { 
      var node = maxDelayTime ? this.internal_createDelay(maxDelayTime) : this.internal_createDelay();
      fixSetTarget(node.delayTime);
      return node;
    };

    AudioContext.prototype.internal_createBufferSource = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function() { 
      var node = this.internal_createBufferSource();
      if (!node.start) {
        node.start = function ( when, offset, duration ) {
          if ( offset || duration )
            this.noteGrainOn( when, offset, duration );
          else
            this.noteOn( when );
        };
      }
      if (!node.stop)
        node.stop = node.noteOff;
      fixSetTarget(node.playbackRate);
      return node;
    };

    AudioContext.prototype.internal_createDynamicsCompressor = AudioContext.prototype.createDynamicsCompressor;
    AudioContext.prototype.createDynamicsCompressor = function() { 
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
    AudioContext.prototype.createBiquadFilter = function() { 
      var node = this.internal_createBiquadFilter();
      fixSetTarget(node.frequency);
      fixSetTarget(node.detune);
      fixSetTarget(node.Q);
      fixSetTarget(node.gain);
      return node;
    };

    if (AudioContext.prototype.hasOwnProperty( 'createOscillator' )) {
      AudioContext.prototype.internal_createOscillator = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function() { 
        var node = this.internal_createOscillator();
        if (!node.start)
          node.start = node.noteOn; 
        if (!node.stop)
          node.stop = node.noteOff;
        if (!node.setPeriodicWave)
          node.setPeriodicWave = node.setWaveTable;
        fixSetTarget(node.frequency);
        fixSetTarget(node.detune);
        return node;
      };
    }
  }
}(window));
},{}],2:[function(require,module,exports){
/*globals AudioContext*/
require('./ac-monkeypatch');
module.exports = new AudioContext();
},{"./ac-monkeypatch":1}],3:[function(require,module,exports){
"use strict";
"use strict";
var audioContext = require("audio-context");
var TimeEngine = function TimeEngine() {
  this.interface = null;
  this.outputNode = null;
};
($traceurRuntime.createClass)(TimeEngine, {
  get currentTime() {
    return audioContext.currentTime;
  },
  get currentPosition() {
    return 0;
  },
  resetNextTime: function() {
    var time = arguments[0] !== (void 0) ? arguments[0] : null;
  },
  resetNextPosition: function() {
    var position = arguments[0] !== (void 0) ? arguments[0] : null;
  },
  __setGetters: function(getCurrentTime, getCurrentPosition) {
    if (getCurrentTime) {
      Object.defineProperty(this, 'currentTime', {
        configurable: true,
        get: getCurrentTime,
        set: function(time) {}
      });
    }
    if (getCurrentPosition) {
      Object.defineProperty(this, 'currentPosition', {
        configurable: true,
        get: getCurrentPosition,
        set: function(position) {}
      });
    }
  },
  __deleteGetters: function() {
    delete this.currentTime;
    delete this.currentPosition;
  },
  connect: function(target) {
    this.outputNode.connect(target);
    return this;
  },
  disconnect: function(connection) {
    this.outputNode.disconnect(connection);
    return this;
  }
}, {});
TimeEngine.implementsScheduled = function(engine) {
  return (engine.advanceTime && engine.advanceTime instanceof Function);
};
TimeEngine.implementsTransported = function(engine) {
  return (engine.syncPosition && engine.syncPosition instanceof Function && engine.advancePosition && engine.advancePosition instanceof Function);
};
TimeEngine.implementsSpeedControlled = function(engine) {
  return (engine.syncSpeed && engine.syncSpeed instanceof Function);
};
TimeEngine.setScheduled = function(engine, resetNextTime, getCurrentTime, getCurrentPosition) {
  engine.interface = "scheduled";
  engine.__setGetters(getCurrentTime, getCurrentPosition);
  if (resetNextTime)
    engine.resetNextTime = resetNextTime;
};
TimeEngine.setTransported = function(engine, resetNextPosition, getCurrentTime, getCurrentPosition) {
  engine.interface = "transported";
  engine.__setGetters(getCurrentTime, getCurrentPosition);
  if (resetNextPosition)
    engine.resetNextPosition = resetNextPosition;
};
TimeEngine.setSpeedControlled = function(engine, getCurrentTime, getCurrentPosition) {
  engine.interface = "speed-controlled";
  engine.__setGetters(getCurrentTime, getCurrentPosition);
};
TimeEngine.resetInterface = function(engine) {
  engine.__deleteGetters();
  delete engine.resetNextTime;
  delete engine.resetNextPosition;
  engine.interface = null;
};
module.exports = TimeEngine;


//# sourceURL=/Users/goldszmidt/sam/pro/dev/time-engine/time-engine.es6.js
},{"audio-context":2}]},{},[3])(3)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYXVkaW8tY29udGV4dC9hYy1tb25rZXlwYXRjaC5qcyIsIm5vZGVfbW9kdWxlcy9hdWRpby1jb250ZXh0L2F1ZGlvLWNvbnRleHQuanMiLCIvVXNlcnMvZ29sZHN6bWlkdC9zYW0vcHJvL2Rldi90aW1lLWVuZ2luZS90aW1lLWVuZ2luZS5lczYuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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LEVBQUksWUFBVSxDQUFDO0FBQzlCLE9BQUssYUFBYSxBQUFDLENBQUMsY0FBYSxDQUFHLG1CQUFpQixDQUFDLENBQUM7QUFDdkQsS0FBSSxhQUFZO0FBQ2QsU0FBSyxjQUFjLEVBQUksY0FBWSxDQUFDO0FBQUEsQUFDeEMsQ0FBQztBQUVELFNBQVMsZUFBZSxFQUFJLFVBQVMsTUFBSyxDQUFHLENBQUEsaUJBQWdCLENBQUcsQ0FBQSxjQUFhLENBQUcsQ0FBQSxrQkFBaUIsQ0FBRztBQUNsRyxPQUFLLFVBQVUsRUFBSSxjQUFZLENBQUM7QUFDaEMsT0FBSyxhQUFhLEFBQUMsQ0FBQyxjQUFhLENBQUcsbUJBQWlCLENBQUMsQ0FBQztBQUN2RCxLQUFJLGlCQUFnQjtBQUNsQixTQUFLLGtCQUFrQixFQUFJLGtCQUFnQixDQUFDO0FBQUEsQUFDaEQsQ0FBQztBQUVELFNBQVMsbUJBQW1CLEVBQUksVUFBUyxNQUFLLENBQUcsQ0FBQSxjQUFhLENBQUcsQ0FBQSxrQkFBaUIsQ0FBRztBQUNuRixPQUFLLFVBQVUsRUFBSSxtQkFBaUIsQ0FBQztBQUNyQyxPQUFLLGFBQWEsQUFBQyxDQUFDLGNBQWEsQ0FBRyxtQkFBaUIsQ0FBQyxDQUFDO0FBQ3pELENBQUM7QUFFRCxTQUFTLGVBQWUsRUFBSSxVQUFTLE1BQUssQ0FBRztBQUMzQyxPQUFLLGdCQUFnQixBQUFDLEVBQUMsQ0FBQztBQUN4QixPQUFPLE9BQUssY0FBYyxDQUFDO0FBQzNCLE9BQU8sT0FBSyxrQkFBa0IsQ0FBQztBQUMvQixPQUFLLFVBQVUsRUFBSSxLQUFHLENBQUM7QUFDekIsQ0FBQztBQUVELEtBQUssUUFBUSxFQUFJLFdBQVMsQ0FBQztBQUMzQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBDb3B5cmlnaHQgMjAxMyBDaHJpcyBXaWxzb25cblxuICAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAgIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cbiAgIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAgIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4vKiBcblxuVGhpcyBtb25rZXlwYXRjaCBsaWJyYXJ5IGlzIGludGVuZGVkIHRvIGJlIGluY2x1ZGVkIGluIHByb2plY3RzIHRoYXQgYXJlXG53cml0dGVuIHRvIHRoZSBwcm9wZXIgQXVkaW9Db250ZXh0IHNwZWMgKGluc3RlYWQgb2Ygd2Via2l0QXVkaW9Db250ZXh0KSwgXG5hbmQgdGhhdCB1c2UgdGhlIG5ldyBuYW1pbmcgYW5kIHByb3BlciBiaXRzIG9mIHRoZSBXZWIgQXVkaW8gQVBJIChlLmcuIFxudXNpbmcgQnVmZmVyU291cmNlTm9kZS5zdGFydCgpIGluc3RlYWQgb2YgQnVmZmVyU291cmNlTm9kZS5ub3RlT24oKSksIGJ1dCBtYXlcbmhhdmUgdG8gcnVuIG9uIHN5c3RlbXMgdGhhdCBvbmx5IHN1cHBvcnQgdGhlIGRlcHJlY2F0ZWQgYml0cy5cblxuVGhpcyBsaWJyYXJ5IHNob3VsZCBiZSBoYXJtbGVzcyB0byBpbmNsdWRlIGlmIHRoZSBicm93c2VyIHN1cHBvcnRzIFxudW5wcmVmaXhlZCBcIkF1ZGlvQ29udGV4dFwiLCBhbmQvb3IgaWYgaXQgc3VwcG9ydHMgdGhlIG5ldyBuYW1lcy4gIFxuXG5UaGUgcGF0Y2hlcyB0aGlzIGxpYnJhcnkgaGFuZGxlczpcbmlmIHdpbmRvdy5BdWRpb0NvbnRleHQgaXMgdW5zdXBwb3J0ZWQsIGl0IHdpbGwgYmUgYWxpYXNlZCB0byB3ZWJraXRBdWRpb0NvbnRleHQoKS5cbmlmIEF1ZGlvQnVmZmVyU291cmNlTm9kZS5zdGFydCgpIGlzIHVuaW1wbGVtZW50ZWQsIGl0IHdpbGwgYmUgcm91dGVkIHRvIG5vdGVPbigpIG9yXG5ub3RlR3JhaW5PbigpLCBkZXBlbmRpbmcgb24gcGFyYW1ldGVycy5cblxuVGhlIGZvbGxvd2luZyBhbGlhc2VzIG9ubHkgdGFrZSBlZmZlY3QgaWYgdGhlIG5ldyBuYW1lcyBhcmUgbm90IGFscmVhZHkgaW4gcGxhY2U6XG5cbkF1ZGlvQnVmZmVyU291cmNlTm9kZS5zdG9wKCkgaXMgYWxpYXNlZCB0byBub3RlT2ZmKClcbkF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCkgaXMgYWxpYXNlZCB0byBjcmVhdGVHYWluTm9kZSgpXG5BdWRpb0NvbnRleHQuY3JlYXRlRGVsYXkoKSBpcyBhbGlhc2VkIHRvIGNyZWF0ZURlbGF5Tm9kZSgpXG5BdWRpb0NvbnRleHQuY3JlYXRlU2NyaXB0UHJvY2Vzc29yKCkgaXMgYWxpYXNlZCB0byBjcmVhdGVKYXZhU2NyaXB0Tm9kZSgpXG5BdWRpb0NvbnRleHQuY3JlYXRlUGVyaW9kaWNXYXZlKCkgaXMgYWxpYXNlZCB0byBjcmVhdGVXYXZlVGFibGUoKVxuT3NjaWxsYXRvck5vZGUuc3RhcnQoKSBpcyBhbGlhc2VkIHRvIG5vdGVPbigpXG5Pc2NpbGxhdG9yTm9kZS5zdG9wKCkgaXMgYWxpYXNlZCB0byBub3RlT2ZmKClcbk9zY2lsbGF0b3JOb2RlLnNldFBlcmlvZGljV2F2ZSgpIGlzIGFsaWFzZWQgdG8gc2V0V2F2ZVRhYmxlKClcbkF1ZGlvUGFyYW0uc2V0VGFyZ2V0QXRUaW1lKCkgaXMgYWxpYXNlZCB0byBzZXRUYXJnZXRWYWx1ZUF0VGltZSgpXG5cblRoaXMgbGlicmFyeSBkb2VzIE5PVCBwYXRjaCB0aGUgZW51bWVyYXRlZCB0eXBlIGNoYW5nZXMsIGFzIGl0IGlzIFxucmVjb21tZW5kZWQgaW4gdGhlIHNwZWNpZmljYXRpb24gdGhhdCBpbXBsZW1lbnRhdGlvbnMgc3VwcG9ydCBib3RoIGludGVnZXJcbmFuZCBzdHJpbmcgdHlwZXMgZm9yIEF1ZGlvUGFubmVyTm9kZS5wYW5uaW5nTW9kZWwsIEF1ZGlvUGFubmVyTm9kZS5kaXN0YW5jZU1vZGVsIFxuQmlxdWFkRmlsdGVyTm9kZS50eXBlIGFuZCBPc2NpbGxhdG9yTm9kZS50eXBlLlxuXG4qL1xuKGZ1bmN0aW9uIChnbG9iYWwsIGV4cG9ydHMsIHBlcmYpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGZ1bmN0aW9uIGZpeFNldFRhcmdldChwYXJhbSkge1xuICAgIGlmICghcGFyYW0pIC8vIGlmIE5ZSSwganVzdCByZXR1cm5cbiAgICAgIHJldHVybjtcbiAgICBpZiAoIXBhcmFtLnNldFRhcmdldEF0VGltZSlcbiAgICAgIHBhcmFtLnNldFRhcmdldEF0VGltZSA9IHBhcmFtLnNldFRhcmdldFZhbHVlQXRUaW1lOyBcbiAgfVxuXG4gIGlmICh3aW5kb3cuaGFzT3duUHJvcGVydHkoJ3dlYmtpdEF1ZGlvQ29udGV4dCcpICYmIFxuICAgICAgIXdpbmRvdy5oYXNPd25Qcm9wZXJ0eSgnQXVkaW9Db250ZXh0JykpIHtcbiAgICB3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2Via2l0QXVkaW9Db250ZXh0O1xuXG4gICAgaWYgKCFBdWRpb0NvbnRleHQucHJvdG90eXBlLmhhc093blByb3BlcnR5KCdjcmVhdGVHYWluJykpXG4gICAgICBBdWRpb0NvbnRleHQucHJvdG90eXBlLmNyZWF0ZUdhaW4gPSBBdWRpb0NvbnRleHQucHJvdG90eXBlLmNyZWF0ZUdhaW5Ob2RlO1xuICAgIGlmICghQXVkaW9Db250ZXh0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSgnY3JlYXRlRGVsYXknKSlcbiAgICAgIEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlRGVsYXkgPSBBdWRpb0NvbnRleHQucHJvdG90eXBlLmNyZWF0ZURlbGF5Tm9kZTtcbiAgICBpZiAoIUF1ZGlvQ29udGV4dC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkoJ2NyZWF0ZVNjcmlwdFByb2Nlc3NvcicpKVxuICAgICAgQXVkaW9Db250ZXh0LnByb3RvdHlwZS5jcmVhdGVTY3JpcHRQcm9jZXNzb3IgPSBBdWRpb0NvbnRleHQucHJvdG90eXBlLmNyZWF0ZUphdmFTY3JpcHROb2RlO1xuICAgIGlmICghQXVkaW9Db250ZXh0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSgnY3JlYXRlUGVyaW9kaWNXYXZlJykpXG4gICAgICBBdWRpb0NvbnRleHQucHJvdG90eXBlLmNyZWF0ZVBlcmlvZGljV2F2ZSA9IEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlV2F2ZVRhYmxlO1xuXG5cbiAgICBBdWRpb0NvbnRleHQucHJvdG90eXBlLmludGVybmFsX2NyZWF0ZUdhaW4gPSBBdWRpb0NvbnRleHQucHJvdG90eXBlLmNyZWF0ZUdhaW47XG4gICAgQXVkaW9Db250ZXh0LnByb3RvdHlwZS5jcmVhdGVHYWluID0gZnVuY3Rpb24oKSB7IFxuICAgICAgdmFyIG5vZGUgPSB0aGlzLmludGVybmFsX2NyZWF0ZUdhaW4oKTtcbiAgICAgIGZpeFNldFRhcmdldChub2RlLmdhaW4pO1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfTtcblxuICAgIEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuaW50ZXJuYWxfY3JlYXRlRGVsYXkgPSBBdWRpb0NvbnRleHQucHJvdG90eXBlLmNyZWF0ZURlbGF5O1xuICAgIEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlRGVsYXkgPSBmdW5jdGlvbihtYXhEZWxheVRpbWUpIHsgXG4gICAgICB2YXIgbm9kZSA9IG1heERlbGF5VGltZSA/IHRoaXMuaW50ZXJuYWxfY3JlYXRlRGVsYXkobWF4RGVsYXlUaW1lKSA6IHRoaXMuaW50ZXJuYWxfY3JlYXRlRGVsYXkoKTtcbiAgICAgIGZpeFNldFRhcmdldChub2RlLmRlbGF5VGltZSk7XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9O1xuXG4gICAgQXVkaW9Db250ZXh0LnByb3RvdHlwZS5pbnRlcm5hbF9jcmVhdGVCdWZmZXJTb3VyY2UgPSBBdWRpb0NvbnRleHQucHJvdG90eXBlLmNyZWF0ZUJ1ZmZlclNvdXJjZTtcbiAgICBBdWRpb0NvbnRleHQucHJvdG90eXBlLmNyZWF0ZUJ1ZmZlclNvdXJjZSA9IGZ1bmN0aW9uKCkgeyBcbiAgICAgIHZhciBub2RlID0gdGhpcy5pbnRlcm5hbF9jcmVhdGVCdWZmZXJTb3VyY2UoKTtcbiAgICAgIGlmICghbm9kZS5zdGFydCkge1xuICAgICAgICBub2RlLnN0YXJ0ID0gZnVuY3Rpb24gKCB3aGVuLCBvZmZzZXQsIGR1cmF0aW9uICkge1xuICAgICAgICAgIGlmICggb2Zmc2V0IHx8IGR1cmF0aW9uIClcbiAgICAgICAgICAgIHRoaXMubm90ZUdyYWluT24oIHdoZW4sIG9mZnNldCwgZHVyYXRpb24gKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLm5vdGVPbiggd2hlbiApO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgaWYgKCFub2RlLnN0b3ApXG4gICAgICAgIG5vZGUuc3RvcCA9IG5vZGUubm90ZU9mZjtcbiAgICAgIGZpeFNldFRhcmdldChub2RlLnBsYXliYWNrUmF0ZSk7XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9O1xuXG4gICAgQXVkaW9Db250ZXh0LnByb3RvdHlwZS5pbnRlcm5hbF9jcmVhdGVEeW5hbWljc0NvbXByZXNzb3IgPSBBdWRpb0NvbnRleHQucHJvdG90eXBlLmNyZWF0ZUR5bmFtaWNzQ29tcHJlc3NvcjtcbiAgICBBdWRpb0NvbnRleHQucHJvdG90eXBlLmNyZWF0ZUR5bmFtaWNzQ29tcHJlc3NvciA9IGZ1bmN0aW9uKCkgeyBcbiAgICAgIHZhciBub2RlID0gdGhpcy5pbnRlcm5hbF9jcmVhdGVEeW5hbWljc0NvbXByZXNzb3IoKTtcbiAgICAgIGZpeFNldFRhcmdldChub2RlLnRocmVzaG9sZCk7XG4gICAgICBmaXhTZXRUYXJnZXQobm9kZS5rbmVlKTtcbiAgICAgIGZpeFNldFRhcmdldChub2RlLnJhdGlvKTtcbiAgICAgIGZpeFNldFRhcmdldChub2RlLnJlZHVjdGlvbik7XG4gICAgICBmaXhTZXRUYXJnZXQobm9kZS5hdHRhY2spO1xuICAgICAgZml4U2V0VGFyZ2V0KG5vZGUucmVsZWFzZSk7XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9O1xuXG4gICAgQXVkaW9Db250ZXh0LnByb3RvdHlwZS5pbnRlcm5hbF9jcmVhdGVCaXF1YWRGaWx0ZXIgPSBBdWRpb0NvbnRleHQucHJvdG90eXBlLmNyZWF0ZUJpcXVhZEZpbHRlcjtcbiAgICBBdWRpb0NvbnRleHQucHJvdG90eXBlLmNyZWF0ZUJpcXVhZEZpbHRlciA9IGZ1bmN0aW9uKCkgeyBcbiAgICAgIHZhciBub2RlID0gdGhpcy5pbnRlcm5hbF9jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgICAgIGZpeFNldFRhcmdldChub2RlLmZyZXF1ZW5jeSk7XG4gICAgICBmaXhTZXRUYXJnZXQobm9kZS5kZXR1bmUpO1xuICAgICAgZml4U2V0VGFyZ2V0KG5vZGUuUSk7XG4gICAgICBmaXhTZXRUYXJnZXQobm9kZS5nYWluKTtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH07XG5cbiAgICBpZiAoQXVkaW9Db250ZXh0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSggJ2NyZWF0ZU9zY2lsbGF0b3InICkpIHtcbiAgICAgIEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuaW50ZXJuYWxfY3JlYXRlT3NjaWxsYXRvciA9IEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlT3NjaWxsYXRvcjtcbiAgICAgIEF1ZGlvQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlT3NjaWxsYXRvciA9IGZ1bmN0aW9uKCkgeyBcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmludGVybmFsX2NyZWF0ZU9zY2lsbGF0b3IoKTtcbiAgICAgICAgaWYgKCFub2RlLnN0YXJ0KVxuICAgICAgICAgIG5vZGUuc3RhcnQgPSBub2RlLm5vdGVPbjsgXG4gICAgICAgIGlmICghbm9kZS5zdG9wKVxuICAgICAgICAgIG5vZGUuc3RvcCA9IG5vZGUubm90ZU9mZjtcbiAgICAgICAgaWYgKCFub2RlLnNldFBlcmlvZGljV2F2ZSlcbiAgICAgICAgICBub2RlLnNldFBlcmlvZGljV2F2ZSA9IG5vZGUuc2V0V2F2ZVRhYmxlO1xuICAgICAgICBmaXhTZXRUYXJnZXQobm9kZS5mcmVxdWVuY3kpO1xuICAgICAgICBmaXhTZXRUYXJnZXQobm9kZS5kZXR1bmUpO1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgIH07XG4gICAgfVxuICB9XG59KHdpbmRvdykpOyIsIi8qZ2xvYmFscyBBdWRpb0NvbnRleHQqL1xucmVxdWlyZSgnLi9hYy1tb25rZXlwYXRjaCcpO1xubW9kdWxlLmV4cG9ydHMgPSBuZXcgQXVkaW9Db250ZXh0KCk7IiwiLyogd3JpdHRlbiBpbiBFQ01Bc2NyaXB0IDYgKi9cbi8qKlxuICogQGZpbGVvdmVydmlldyBXQVZFIGF1ZGlvIHRpbWUgZW5naW5lIGJhc2UgY2xhc3NcbiAqIEBhdXRob3IgTm9yYmVydC5TY2huZWxsQGlyY2FtLmZyLCBWaWN0b3IuU2FpekBpcmNhbS5mciwgS2FyaW0uQmFya2F0aUBpcmNhbS5mclxuICovXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGF1ZGlvQ29udGV4dCA9IHJlcXVpcmUoXCJhdWRpby1jb250ZXh0XCIpO1xuXG4vKipcbiAqIEBjbGFzcyBUaW1lRW5naW5lXG4gKiBAY2xhc3NkZXNjIEJhc2UgY2xhc3MgZm9yIHRpbWUgZW5naW5lc1xuICpcbiAqIFRpbWUgZW5naW5lcyBhcmUgY29tcG9uZW50cyB0aGF0IGdlbmVyYXRlIG1vcmUgb3IgbGVzcyByZWd1bGFyIGF1ZGlvIGV2ZW50cyBhbmQvb3IgcGxheWJhY2sgYSBtZWRpYSBzdHJlYW0uXG4gKiBUaGV5IGltcGxlbWVudCBvbmUgb3IgbXVsdGlwbGUgaW50ZXJmYWNlcyB0byBiZSBzeW5jaHJvbml6ZWQgYnkgYSBtYXN0ZXIgc3VjaCBhcyBhIHNjaGVkdWxlciwgYSB0cmFuc3BvcnQgb3IgYSBwbGF5LWNvbnRyb2wuXG4gKiBUaGUgcHJvdmlkZWQgaW50ZXJmYWNlcyBhcmUgXCJzY2hlZHVsZWRcIiwgXCJ0cmFuc3BvcnRlZFwiLCBhbmQgXCJwbGF5LWNvbnRyb2xsZWRcIi5cbiAqXG4gKiBJbiB0aGUgXCJzY2hlZHVsZWRcIiBpbnRlcmZhY2UgdGhlIGVuZ2luZSBpbXBsZW1lbnRzIGEgbWV0aG9kIFwiYWR2YW5jZVRpbWVcIiB0aGF0IGlzIGNhbGxlZCBieSB0aGUgbWFzdGVyICh1c3VhbGx5IHRoZSBzY2hlZHVsZXIpXG4gKiBhbmQgcmV0dXJucyB0aGUgZGVsYXkgdW50aWwgdGhlIG5leHQgY2FsbCBvZiBcImFkdmFuY2VUaW1lXCIuIFRoZSBtYXN0ZXIgcHJvdmlkZXMgdGhlIGVuZ2luZSB3aXRoIGEgZnVuY3Rpb24gXCJyZXNldE5leHRUaW1lXCJcbiAqIHRvIHJlc2NoZWR1bGUgdGhlIG5leHQgY2FsbCB0byBhbm90aGVyIHRpbWUuXG4gKlxuICogSW4gdGhlIFwidHJhbnNwb3J0ZWRcIiBpbnRlcmZhY2UgdGhlIG1hc3RlciAodXN1YWxseSBhIHRyYW5zcG9ydCkgZmlyc3QgY2FsbHMgdGhlIG1ldGhvZCBcInN5bmNQb3NpdGlvblwiIHRoYXQgcmV0dXJucyB0aGUgcG9zaXRpb25cbiAqIG9mIHRoZSBmaXJzdCBldmVudCBnZW5lcmF0ZWQgYnkgdGhlIGVuZ2luZSByZWdhcmRpbmcgdGhlIHBsYXlpbmcgZGlyZWN0aW9uIChzaWduIG9mIHRoZSBzcGVlZCBhcmd1bWVudCkuIEV2ZW50cyBhcmUgZ2VuZXJhdGVkXG4gKiB0aHJvdWdoIHRoZSBtZXRob2QgXCJhZHZhbmNlUG9zaXRpb25cIiB0aGF0IHJldHVybnMgdGhlIHBvc2l0aW9uIG9mIHRoZSBuZXh0IGV2ZW50IGdlbmVyYXRlZCB0aHJvdWdoIFwiYWR2YW5jZVBvc2l0aW9uXCIuXG4gKlxuICogSW4gdGhlIFwic3BlZWQtY29udHJvbGxlZFwiIGludGVyZmFjZSB0aGUgZW5naW5lIGlzIGNvbnRyb2xsZWQgYnkgdGhlIG1ldGhvZCBcInN5bmNTcGVlZFwiLlxuICpcbiAqIEZvciBhbGwgaW50ZXJmYWNlcyB0aGUgZW5naW5lIGlzIHByb3ZpZGVkIHdpdGggdGhlIGF0dHJpYnV0ZSBnZXR0ZXJzIFwiY3VycmVudFRpbWVcIiBhbmQgXCJjdXJyZW50UG9zaXRpb25cIiAoZm9yIHRoZSBjYXNlIHRoYXQgdGhlIG1hc3RlclxuICogZG9lcyBub3QgaW1wbGVtZW50IHRoZXNlIGF0dHJpYnV0ZSBnZXR0ZXJzLCB0aGUgYmFzZSBjbGFzcyBwcm92aWRlcyBkZWZhdWx0IGltcGxlbWVudGF0aW9ucykuXG4gKi9cbmNsYXNzIFRpbWVFbmdpbmUge1xuXG4gIC8qKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgLyoqXG4gICAgICogSW50ZXJmYWNlIGN1cnJlbnRseSB1c2VkXG4gICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgKi9cbiAgICB0aGlzLmludGVyZmFjZSA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBPdXRwdXQgYXVkaW8gbm9kZVxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgdGhpcy5vdXRwdXROb2RlID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHRpbWUgZW5naW5lJ3MgY3VycmVudCBtYXN0ZXIgdGltZVxuICAgKiBAdHlwZSB7RnVuY3Rpb259XG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gcHJvdmlkZWQgYnkgdGhlIG1hc3Rlci5cbiAgICovXG4gIGdldCBjdXJyZW50VGltZSgpIHtcbiAgICByZXR1cm4gYXVkaW9Db250ZXh0LmN1cnJlbnRUaW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdGltZSBlbmdpbmUncyBjdXJyZW50IG1hc3RlciBwb3NpdGlvblxuICAgKiBAdHlwZSB7RnVuY3Rpb259XG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gcHJvdmlkZWQgYnkgdGhlIG1hc3Rlci5cbiAgICovXG4gIGdldCBjdXJyZW50UG9zaXRpb24oKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKipcbiAgICogQWR2YW5jZSBlbmdpbmUgdGltZSAoc2NoZWR1bGVkIGludGVyZmFjZSlcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHRpbWUgY3VycmVudCBzY2hlZHVsZXIgdGltZSAoYmFzZWQgb24gYXVkaW8gdGltZSlcbiAgICogQHJldHVybiB7TnVtYmVyfSBuZXh0IGVuZ2luZSB0aW1lXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGJ5IHRoZSBzY2hlZHVsZXIgdG8gbGV0IHRoZSBlbmdpbmUgZG8gaXRzIHdvcmtcbiAgICogc3luY2hyb25pemVkIHRvIHRoZSBzY2hlZHVsZXIgdGltZS5cbiAgICogSWYgdGhlIGVuZ2luZSByZXR1cm5zIEluZmluaXR5LCBpdCBpcyBub3QgY2FsbGVkIGFnYWluIHVudGlsIGl0IGlzIHJlc3RhcnRlZCBieVxuICAgKiB0aGUgc2NoZWR1bGVyIG9yIGl0IGNhbGxzIHJlc2V0TmV4dFBvc2l0aW9uIHdpdGggYSB2YWxpZCBwb3NpdGlvbi5cbiAgICovXG4gIC8vIGFkdmFuY2VUaW1lKHRpbWUpIHtcbiAgLy8gICByZXR1cm4gdGltZTtcbiAgLy8gfVxuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiBwcm92aWRlZCBieSB0aGUgc2NoZWR1bGVyIHRvIHJlc2V0IHRoZSBlbmdpbmUncyBuZXh0IHRpbWVcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHRpbWUgbmV3IGVuZ2luZSB0aW1lIChpbW1lZGlhdGVseSBpZiBub3Qgc3BlY2lmaWVkKVxuICAgKi9cbiAgcmVzZXROZXh0VGltZSh0aW1lID0gbnVsbCkge31cblxuICAvKipcbiAgICogU3luY2hyb25pemUgZW5naW5lIHRvIHRyYW5zcG9ydCBwb3NpdGlvbiAodHJhbnNwb3J0ZWQgaW50ZXJmYWNlKVxuICAgKiBAcGFyYW0ge051bWJlcn0gcG9zaXRpb24gY3VycmVudCB0cmFuc3BvcnQgcG9zaXRpb24gdG8gc3luY2hyb25pemUgdG9cbiAgICogQHBhcmFtIHtOdW1iZXJ9IHRpbWUgY3VycmVudCBzY2hlZHVsZXIgdGltZSAoYmFzZWQgb24gYXVkaW8gdGltZSlcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHNwZWVkIGN1cnJlbnQgc3BlZWRcbiAgICogQHJldHVybiB7TnVtYmVyfSBuZXh0IHBvc2l0aW9uIChnaXZlbiB0aGUgcGxheWluZyBkaXJlY3Rpb24pXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGJ5IHRoZSBtc2F0ZXIgYW5kIGFsbG93cyB0aGUgZW5naW5lIGZvciBzeW5jaHJvbml6aW5nXG4gICAqIChzZWVraW5nKSB0byB0aGUgY3VycmVudCB0cmFuc3BvcnQgcG9zaXRpb24gYW5kIHRvIHJldHVybiBpdHMgbmV4dCBwb3NpdGlvbi5cbiAgICogSWYgdGhlIGVuZ2luZSByZXR1cm5zIEluZmluaXR5IG9yIC1JbmZpbml0eSwgaXQgaXMgbm90IGNhbGxlZCBhZ2FpbiB1bnRpbCBpdCBpc1xuICAgKiByZXN5bmNocm9uaXplZCBieSB0aGUgdHJhbnNwb3J0IG9yIGl0IGNhbGxzIHJlc2V0TmV4dFBvc2l0aW9uLlxuICAgKi9cbiAgLy8gc3luY1Bvc2l0aW9uKHRpbWUsIHBvc2l0aW9uLCBzcGVlZCkge1xuICAvLyAgIHJldHVybiBwb3NpdGlvbjtcbiAgLy8gfVxuXG4gIC8qKlxuICAgKiBBZHZhbmNlIGVuZ2luZSBwb3NpdGlvbiAodHJhbnNwb3J0ZWQgaW50ZXJmYWNlKVxuICAgKiBAcGFyYW0ge051bWJlcn0gdGltZSBjdXJyZW50IHNjaGVkdWxlciB0aW1lIChiYXNlZCBvbiBhdWRpbyB0aW1lKVxuICAgKiBAcGFyYW0ge051bWJlcn0gcG9zaXRpb24gY3VycmVudCB0cmFuc3BvcnQgcG9zaXRpb25cbiAgICogQHBhcmFtIHtOdW1iZXJ9IHNwZWVkIGN1cnJlbnQgc3BlZWRcbiAgICogQHJldHVybiB7TnVtYmVyfSBuZXh0IGVuZ2luZSBwb3NpdGlvbiAoZ2l2ZW4gdGhlIHBsYXlpbmcgZGlyZWN0aW9uKVxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBieSB0aGUgdHJhbnNwb3J0IHRvIGxldCB0aGUgZW5naW5lIGRvIGl0cyB3b3JrXG4gICAqIGFsaWduZWQgdG8gdGhlIHRyYW5zcG9ydCdzIHBvc2l0aW9uLlxuICAgKiBJZiB0aGUgZW5naW5lIHJldHVybnMgSW5maW5pdHkgb3IgLUluZmluaXR5LCBpdCBpcyBub3QgY2FsbGVkIGFnYWluIHVudGlsIGl0IGlzXG4gICAqIHJlc3luY2hyb25pemVkIGJ5IHRoZSB0cmFuc3BvcnQgb3IgaXQgY2FsbHMgcmVzZXROZXh0UG9zaXRpb24uXG4gICAqL1xuICAvLyBhZHZhbmNlUG9zaXRpb24odGltZSwgcG9zaXRpb24sIHNwZWVkKSB7XG4gIC8vICAgcmV0dXJuIHBvc2l0aW9uO1xuICAvLyB9XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHByb3ZpZGVkIGJ5IHRoZSB0cmFuc3BvcnQgdG8gcmVzZXQgdGhlIG5leHQgcG9zaXRpb24gb3IgdG8gcmVxdWVzdCByZXN5bmNocm9uaXppbmcgdGhlIGVuZ2luZSdzIHBvc2l0aW9uXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBwb3NpdGlvbiBuZXcgZW5naW5lIHBvc2l0aW9uICh3aWxsIGNhbGwgc3luY1Bvc2l0aW9uIHdpdGggdGhlIGN1cnJlbnQgcG9zaXRpb24gaWYgbm90IHNwZWNpZmllZClcbiAgICovXG4gIHJlc2V0TmV4dFBvc2l0aW9uKHBvc2l0aW9uID0gbnVsbCkge31cblxuICAvKipcbiAgICogU2V0IGVuZ2luZSBzcGVlZCAoc3BlZWQtY29udHJvbGxlZCBpbnRlcmZhY2UpXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lIGN1cnJlbnQgc2NoZWR1bGVyIHRpbWUgKGJhc2VkIG9uIGF1ZGlvIHRpbWUpXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBzcGVlZCBjdXJyZW50IHRyYW5zcG9ydCBzcGVlZFxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBieSB0aGUgdHJhbnNwb3J0IHRvIHByb3BhZ2F0ZSB0aGUgdHJhbnNwb3J0IHNwZWVkIHRvIHRoZSBlbmdpbmUuXG4gICAqIFRoZSBzcGVlZCBjYW4gYmUgb2YgYW55IHZhbHVlIGJld3RlZW4gLTE2IGFuZCAxNi5cbiAgICogV2l0aCBhIHNwZWVkIG9mIDAgdGhlIGVuZ2luZSBpcyBoYWx0ZWQuXG4gICAqL1xuICAvLyBzeW5jU3BlZWQodGltZSwgc3BlZWQpIHtcbiAgLy8gfVxuXG4gIF9fc2V0R2V0dGVycyhnZXRDdXJyZW50VGltZSwgZ2V0Q3VycmVudFBvc2l0aW9uKSB7XG4gICAgaWYgKGdldEN1cnJlbnRUaW1lKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2N1cnJlbnRUaW1lJywge1xuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldDogZ2V0Q3VycmVudFRpbWUsXG4gICAgICAgIHNldDogZnVuY3Rpb24odGltZSkge31cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChnZXRDdXJyZW50UG9zaXRpb24pIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnY3VycmVudFBvc2l0aW9uJywge1xuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldDogZ2V0Q3VycmVudFBvc2l0aW9uLFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHBvc2l0aW9uKSB7fVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgX19kZWxldGVHZXR0ZXJzKCkge1xuICAgIGRlbGV0ZSB0aGlzLmN1cnJlbnRUaW1lO1xuICAgIGRlbGV0ZSB0aGlzLmN1cnJlbnRQb3NpdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25uZWN0IGF1ZGlvIG5vZGVcbiAgICogQHBhcmFtIHtPYmplY3R9IHRhcmdldCBhdWRpbyBub2RlXG4gICAqL1xuICBjb25uZWN0KHRhcmdldCkge1xuICAgIHRoaXMub3V0cHV0Tm9kZS5jb25uZWN0KHRhcmdldCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRGlzY29ubmVjdCBhdWRpbyBub2RlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBjb25uZWN0aW9uIGNvbm5lY3Rpb24gdG8gYmUgZGlzY29ubmVjdGVkXG4gICAqL1xuICBkaXNjb25uZWN0KGNvbm5lY3Rpb24pIHtcbiAgICB0aGlzLm91dHB1dE5vZGUuZGlzY29ubmVjdChjb25uZWN0aW9uKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIHRpbWUgZW5naW5lIGltcGxlbWVudHMgdGhlIHNjaGVkdWxlZCBpbnRlcmZhY2VcbiAqKi9cblRpbWVFbmdpbmUuaW1wbGVtZW50c1NjaGVkdWxlZCA9IGZ1bmN0aW9uKGVuZ2luZSkge1xuICByZXR1cm4gKGVuZ2luZS5hZHZhbmNlVGltZSAmJiBlbmdpbmUuYWR2YW5jZVRpbWUgaW5zdGFuY2VvZiBGdW5jdGlvbik7XG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIHRpbWUgZW5naW5lIGltcGxlbWVudHMgdGhlIHRyYW5zcG9ydGVkIGludGVyZmFjZVxuICoqL1xuVGltZUVuZ2luZS5pbXBsZW1lbnRzVHJhbnNwb3J0ZWQgPSBmdW5jdGlvbihlbmdpbmUpIHtcbiAgcmV0dXJuIChcbiAgICBlbmdpbmUuc3luY1Bvc2l0aW9uICYmIGVuZ2luZS5zeW5jUG9zaXRpb24gaW5zdGFuY2VvZiBGdW5jdGlvbiAmJlxuICAgIGVuZ2luZS5hZHZhbmNlUG9zaXRpb24gJiYgZW5naW5lLmFkdmFuY2VQb3NpdGlvbiBpbnN0YW5jZW9mIEZ1bmN0aW9uXG4gICk7XG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIHRpbWUgZW5naW5lIGltcGxlbWVudHMgdGhlIHNwZWVkLWNvbnRyb2xsZWQgaW50ZXJmYWNlXG4gKiovXG5UaW1lRW5naW5lLmltcGxlbWVudHNTcGVlZENvbnRyb2xsZWQgPSBmdW5jdGlvbihlbmdpbmUpIHtcbiAgcmV0dXJuIChlbmdpbmUuc3luY1NwZWVkICYmIGVuZ2luZS5zeW5jU3BlZWQgaW5zdGFuY2VvZiBGdW5jdGlvbik7XG59O1xuXG5UaW1lRW5naW5lLnNldFNjaGVkdWxlZCA9IGZ1bmN0aW9uKGVuZ2luZSwgcmVzZXROZXh0VGltZSwgZ2V0Q3VycmVudFRpbWUsIGdldEN1cnJlbnRQb3NpdGlvbikge1xuICBlbmdpbmUuaW50ZXJmYWNlID0gXCJzY2hlZHVsZWRcIjtcbiAgZW5naW5lLl9fc2V0R2V0dGVycyhnZXRDdXJyZW50VGltZSwgZ2V0Q3VycmVudFBvc2l0aW9uKTtcbiAgaWYgKHJlc2V0TmV4dFRpbWUpXG4gICAgZW5naW5lLnJlc2V0TmV4dFRpbWUgPSByZXNldE5leHRUaW1lO1xufTtcblxuVGltZUVuZ2luZS5zZXRUcmFuc3BvcnRlZCA9IGZ1bmN0aW9uKGVuZ2luZSwgcmVzZXROZXh0UG9zaXRpb24sIGdldEN1cnJlbnRUaW1lLCBnZXRDdXJyZW50UG9zaXRpb24pIHtcbiAgZW5naW5lLmludGVyZmFjZSA9IFwidHJhbnNwb3J0ZWRcIjtcbiAgZW5naW5lLl9fc2V0R2V0dGVycyhnZXRDdXJyZW50VGltZSwgZ2V0Q3VycmVudFBvc2l0aW9uKTtcbiAgaWYgKHJlc2V0TmV4dFBvc2l0aW9uKVxuICAgIGVuZ2luZS5yZXNldE5leHRQb3NpdGlvbiA9IHJlc2V0TmV4dFBvc2l0aW9uO1xufTtcblxuVGltZUVuZ2luZS5zZXRTcGVlZENvbnRyb2xsZWQgPSBmdW5jdGlvbihlbmdpbmUsIGdldEN1cnJlbnRUaW1lLCBnZXRDdXJyZW50UG9zaXRpb24pIHtcbiAgZW5naW5lLmludGVyZmFjZSA9IFwic3BlZWQtY29udHJvbGxlZFwiO1xuICBlbmdpbmUuX19zZXRHZXR0ZXJzKGdldEN1cnJlbnRUaW1lLCBnZXRDdXJyZW50UG9zaXRpb24pO1xufTtcblxuVGltZUVuZ2luZS5yZXNldEludGVyZmFjZSA9IGZ1bmN0aW9uKGVuZ2luZSkge1xuICBlbmdpbmUuX19kZWxldGVHZXR0ZXJzKCk7XG4gIGRlbGV0ZSBlbmdpbmUucmVzZXROZXh0VGltZTtcbiAgZGVsZXRlIGVuZ2luZS5yZXNldE5leHRQb3NpdGlvbjtcbiAgZW5naW5lLmludGVyZmFjZSA9IG51bGw7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRpbWVFbmdpbmU7XG4iXX0=
