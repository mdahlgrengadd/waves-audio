(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.wavesAudio = f()}})(function(){var define,module,exports;return (function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var AudioContext = window.AudioContext || window.webkitAudioContext;

/**
 * Expose a unique audio context singleton as the default audio
 * context used by the components of the Waves Audio library and
 * applications using the library.
 *
 * @type AudioContext
 * @name audioContext
 * @constant
 * @global
 * @instance
 *
 * @example
 * import * as audio from 'waves-audio';
 * const audioContext = audio.audioContext;
 */
var audioContext = null;

if (AudioContext) {
  audioContext = new AudioContext();

  if (/(iPhone|iPad)/i.test(navigator.userAgent) && audioContext.sampleRate < 44100) {
    var buffer = audioContext.createBuffer(1, 1, 44100);
    var dummy = audioContext.createBufferSource();
    dummy.buffer = buffer;
    dummy.connect(audioContext.destination);
    dummy.start(0);
    dummy.disconnect();
  }
}

exports.default = audioContext;

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _timeEngine = require('./time-engine');

var _timeEngine2 = _interopRequireDefault(_timeEngine);

var _audioContext = require('./audio-context');

var _audioContext2 = _interopRequireDefault(_audioContext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This is the base class for all audio related time engine components. It is
 * used to handle audio related events such as the playback of a media stream.
 * It extends the TimeEngine class by the standard web audio node methods
 * connect and disconnect.
 *
 * [example]{@link https://rawgit.com/wavesjs/waves-audio/master/examples/audio-time-engine.html}
 *
 * @extends TimeEngine
 * @example
 * import audio from 'waves-audio';
 *
 * class MyEngine extends audio.AudioTimeEngine {
 *   constructor() {
 *     super();
 *     // ...
 *   }
 * }
 */
var AudioTimeEngine = function (_TimeEngine) {
  (0, _inherits3.default)(AudioTimeEngine, _TimeEngine);

  function AudioTimeEngine() {
    var audioContext = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _audioContext2.default;
    (0, _classCallCheck3.default)(this, AudioTimeEngine);

    /**
     * Audio context used by the TimeEngine, default to the global audioContext
     *
     * @name audioContext
     * @type AudioContext
     * @memberof AudioTimeEngine
     * @see audioContext
     */
    var _this = (0, _possibleConstructorReturn3.default)(this, (AudioTimeEngine.__proto__ || (0, _getPrototypeOf2.default)(AudioTimeEngine)).call(this));

    _this.audioContext = audioContext;

    /**
     * Output audio node. By default the connect method connects a given node
     * to this output node.
     *
     * @name outputNode
     * @type AudioNode
     * @memberof AudioTimeEngine
     * @default null
     */
    _this.outputNode = null;
    return _this;
  }

  /**
   * Connect to an audio node (e.g. audioContext.destination)
   *
   * @param {AudioNode} target - Target audio node
   */


  (0, _createClass3.default)(AudioTimeEngine, [{
    key: 'connect',
    value: function connect(target) {
      this.outputNode.connect(target);
      return this;
    }

    /**
     * Disconnect from an audio node (e.g. audioContext.destination). If undefined
     * disconnect from all target nodes.
     *
     * @param {AudioNode} target - Target audio node.
     */

  }, {
    key: 'disconnect',
    value: function disconnect(connection) {
      this.outputNode.disconnect(connection);
      return this;
    }
  }]);
  return AudioTimeEngine;
}(_timeEngine2.default);

exports.default = AudioTimeEngine;

},{"./audio-context":1,"./time-engine":5,"babel-runtime/core-js/object/get-prototype-of":20,"babel-runtime/helpers/classCallCheck":26,"babel-runtime/helpers/createClass":27,"babel-runtime/helpers/inherits":29,"babel-runtime/helpers/possibleConstructorReturn":30}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// works by reference
function swap(arr, i1, i2) {
  var tmp = arr[i1];
  arr[i1] = arr[i2];
  arr[i2] = tmp;
}

// https://jsperf.com/js-for-loop-vs-array-indexof/346
function indexOf(arr, el) {
  var l = arr.length;
  // ignore first element as it can't be a entry
  for (var i = 1; i < l; i++) {
    if (arr[i] === el) {
      return i;
    }
  }

  return -1;
}

/**
 * Define if `time1` should be lower in the topography than `time2`.
 * Is dynamically affected to the priority queue according to handle `min` and `max` heap.
 *
 * @private
 * @param {Number} time1
 * @param {Number} time2
 * @return {Boolean}
 */
var _isLowerMaxHeap = function _isLowerMaxHeap(time1, time2) {
  return time1 < time2;
};

var _isLowerMinHeap = function _isLowerMinHeap(time1, time2) {
  return time1 > time2;
};

/**
 * Define if `time1` should be higher in the topography than `time2`.
 * Is dynamically affected to the priority queue according to handle `min` and `max` heap.
 *
 * @private
 * @param {Number} time1
 * @param {Number} time2
 * @return {Boolean}
 */
var _isHigherMaxHeap = function _isHigherMaxHeap(time1, time2) {
  return time1 > time2;
};

var _isHigherMinHeap = function _isHigherMinHeap(time1, time2) {
  return time1 < time2;
};

var POSITIVE_INFINITY = Number.POSITIVE_INFINITY;

/**
 * Priority queue implementing a binary heap.
 * Acts as a min heap by default, can be dynamically changed to a max heap
 * by setting `reverse` to true.
 *
 * _note_: the queue creates and maintains a new property (i.e. `queueTime`)
 * to each object added.
 *
 * @param {Number} [heapLength=100] - Default size of the array used to create the heap.
 */

var PriorityQueue = function () {
  function PriorityQueue() {
    var heapLength = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 100;
    (0, _classCallCheck3.default)(this, PriorityQueue);

    /**
     * Pointer to the first empty index of the heap.
     * @type {Number}
     * @memberof PriorityQueue
     * @name _currentLength
     * @private
     */
    this._currentLength = 1;

    /**
     * Array of the sorted indexes of the entries, the actual heap. Ignore the index 0.
     * @type {Array}
     * @memberof PriorityQueue
     * @name _heap
     * @private
     */
    this._heap = new Array(heapLength + 1);

    /**
     * Type of the queue: `min` heap if `false`, `max` heap if `true`
     * @type {Boolean}
     * @memberof PriorityQueue
     * @name _reverse
     * @private
     */
    this._reverse = null;

    // initialize compare functions
    this.reverse = false;
  }

  /**
   * Time of the first element in the binary heap.
   * @returns {Number}
   */


  (0, _createClass3.default)(PriorityQueue, [{
    key: "_bubbleUp",


    /**
     * Fix the heap by moving an entry to a new upper position.
     *
     * @private
     * @param {Number} startIndex - The index of the entry to move.
     */
    value: function _bubbleUp(startIndex) {
      var entry = this._heap[startIndex];

      var index = startIndex;
      var parentIndex = Math.floor(index / 2);
      var parent = this._heap[parentIndex];

      while (parent && this._isHigher(entry.queueTime, parent.queueTime)) {
        swap(this._heap, index, parentIndex);

        index = parentIndex;
        parentIndex = Math.floor(index / 2);
        parent = this._heap[parentIndex];
      }
    }

    /**
     * Fix the heap by moving an entry to a new lower position.
     *
     * @private
     * @param {Number} startIndex - The index of the entry to move.
     */

  }, {
    key: "_bubbleDown",
    value: function _bubbleDown(startIndex) {
      var entry = this._heap[startIndex];

      var index = startIndex;
      var c1index = index * 2;
      var c2index = c1index + 1;
      var child1 = this._heap[c1index];
      var child2 = this._heap[c2index];

      while (child1 && this._isLower(entry.queueTime, child1.queueTime) || child2 && this._isLower(entry.queueTime, child2.queueTime)) {
        // swap with the minimum child
        var targetIndex = void 0;

        if (child2) targetIndex = this._isHigher(child1.queueTime, child2.queueTime) ? c1index : c2index;else targetIndex = c1index;

        swap(this._heap, index, targetIndex);

        // update to find next children
        index = targetIndex;
        c1index = index * 2;
        c2index = c1index + 1;
        child1 = this._heap[c1index];
        child2 = this._heap[c2index];
      }
    }

    /**
     * Build the heap (from bottom up).
     */

  }, {
    key: "buildHeap",
    value: function buildHeap() {
      // find the index of the last internal node
      // @todo - make sure that's the right way to do.
      var maxIndex = Math.floor((this._currentLength - 1) / 2);

      for (var i = maxIndex; i > 0; i--) {
        this._bubbleDown(i);
      }
    }

    /**
     * Insert a new object in the binary heap and sort it.
     *
     * @param {Object} entry - Entry to insert.
     * @param {Number} time - Time at which the entry should be orderer.
     * @returns {Number} - Time of the first entry in the heap.
     */

  }, {
    key: "insert",
    value: function insert(entry, time) {
      if (Math.abs(time) !== POSITIVE_INFINITY) {
        entry.queueTime = time;
        // add the new entry at the end of the heap
        this._heap[this._currentLength] = entry;
        // bubble it up
        this._bubbleUp(this._currentLength);
        this._currentLength += 1;

        return this.time;
      }

      entry.queueTime = undefined;
      return this.remove(entry);
    }

    /**
     * Move a given entry to a new position.
     *
     * @param {Object} entry - Entry to move.
     * @param {Number} time - Time at which the entry should be orderer.
     * @return {Number} - Time of first entry in the heap.
     */

  }, {
    key: "move",
    value: function move(entry, time) {
      if (Math.abs(time) !== POSITIVE_INFINITY) {
        var index = indexOf(this._heap, entry);

        if (index !== -1) {
          entry.queueTime = time;
          // define if the entry should be bubbled up or down
          var parent = this._heap[Math.floor(index / 2)];

          if (parent && this._isHigher(time, parent.queueTime)) this._bubbleUp(index);else this._bubbleDown(index);
        }

        return this.time;
      }

      entry.queueTime = undefined;
      return this.remove(entry);
    }

    /**
     * Remove an entry from the heap and fix the heap.
     *
     * @param {Object} entry - Entry to remove.
     * @return {Number} - Time of first entry in the heap.
     */

  }, {
    key: "remove",
    value: function remove(entry) {
      // find the index of the entry
      var index = indexOf(this._heap, entry);

      if (index !== -1) {
        var lastIndex = this._currentLength - 1;

        // if the entry is the last one
        if (index === lastIndex) {
          // remove the element from heap
          this._heap[lastIndex] = undefined;
          // update current length
          this._currentLength = lastIndex;

          return this.time;
        } else {
          // swap with the last element of the heap
          swap(this._heap, index, lastIndex);
          // remove the element from heap
          this._heap[lastIndex] = undefined;

          if (index === 1) {
            this._bubbleDown(1);
          } else {
            // bubble the (ex last) element up or down according to its new context
            var _entry = this._heap[index];
            var parent = this._heap[Math.floor(index / 2)];

            if (parent && this._isHigher(_entry.queueTime, parent.queueTime)) this._bubbleUp(index);else this._bubbleDown(index);
          }
        }

        // update current length
        this._currentLength = lastIndex;
      }

      return this.time;
    }

    /**
     * Clear the queue.
     */

  }, {
    key: "clear",
    value: function clear() {
      this._currentLength = 1;
      this._heap = new Array(this._heap.length);
    }

    /**
     * Defines if the queue contains the given `entry`.
     *
     * @param {Object} entry - Entry to be checked
     * @return {Boolean}
     */

  }, {
    key: "has",
    value: function has(entry) {
      return this._heap.indexOf(entry) !== -1;
    }
  }, {
    key: "time",
    get: function get() {
      if (this._currentLength > 1) return this._heap[1].queueTime;

      return Infinity;
    }

    /**
     * First element in the binary heap.
     * @returns {Number}
     * @readonly
     */

  }, {
    key: "head",
    get: function get() {
      return this._heap[1];
    }

    /**
     * Change the order of the queue (max heap if true, min heap if false),
     * rebuild the heap with the existing entries.
     *
     * @type {Boolean}
     */

  }, {
    key: "reverse",
    set: function set(value) {
      if (value !== this._reverse) {
        this._reverse = value;

        if (this._reverse === true) {
          this._isLower = _isLowerMaxHeap;
          this._isHigher = _isHigherMaxHeap;
        } else {
          this._isLower = _isLowerMinHeap;
          this._isHigher = _isHigherMinHeap;
        }

        this.buildHeap();
      }
    },
    get: function get() {
      return this._reverse;
    }
  }]);
  return PriorityQueue;
}();

exports.default = PriorityQueue;

},{"babel-runtime/helpers/classCallCheck":26,"babel-runtime/helpers/createClass":27}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _priorityQueue = require('./priority-queue');

var _priorityQueue2 = _interopRequireDefault(_priorityQueue);

var _timeEngine = require('./time-engine');

var _timeEngine2 = _interopRequireDefault(_timeEngine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @class SchedulingQueue
 * @extends TimeEngine
 */
/**
 * SchedulingQueue base class
 * http://wavesjs.github.io/audio/#audio-scheduling-queue
 *
 * Norbert.Schnell@ircam.fr
 * Copyright 2014, 2015 IRCAM – Centre Pompidou
 */

var SchedulingQueue = function (_TimeEngine) {
  (0, _inherits3.default)(SchedulingQueue, _TimeEngine);

  function SchedulingQueue() {
    (0, _classCallCheck3.default)(this, SchedulingQueue);

    var _this = (0, _possibleConstructorReturn3.default)(this, (SchedulingQueue.__proto__ || (0, _getPrototypeOf2.default)(SchedulingQueue)).call(this));

    _this.__queue = new _priorityQueue2.default();
    _this.__engines = new _set2.default();
    return _this;
  }

  // TimeEngine 'scheduled' interface


  (0, _createClass3.default)(SchedulingQueue, [{
    key: 'advanceTime',
    value: function advanceTime(time) {
      var engine = this.__queue.head;
      var nextEngineTime = engine.advanceTime(time);

      if (!nextEngineTime) {
        engine.master = null;
        this.__engines.delete(engine);
        this.__queue.remove(engine);
      } else {
        this.__queue.move(engine, nextEngineTime);
      }

      return this.__queue.time;
    }

    // TimeEngine master method to be implemented by derived class

  }, {
    key: 'defer',


    // call a function at a given time
    value: function defer(fun) {
      var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.currentTime;

      if (!(fun instanceof Function)) throw new Error("object cannot be defered by scheduler");

      this.add({
        advanceTime: function advanceTime(time) {
          fun(time);
        } // make sur that the advanceTime method does not returm anything
      }, time);
    }

    // add a time engine to the scheduler

  }, {
    key: 'add',
    value: function add(engine) {
      var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.currentTime;

      if (!_timeEngine2.default.implementsScheduled(engine)) throw new Error("object cannot be added to scheduler");

      if (engine.master) throw new Error("object has already been added to a master");

      engine.master = this;

      // add to engines and queue
      this.__engines.add(engine);
      var nextTime = this.__queue.insert(engine, time);

      // reschedule queue
      this.resetTime(nextTime);
    }

    // remove a time engine from the queue

  }, {
    key: 'remove',
    value: function remove(engine) {
      if (engine.master !== this) throw new Error("object has not been added to this scheduler");

      engine.master = null;

      // remove from array and queue
      this.__engines.delete(engine);
      var nextTime = this.__queue.remove(engine);

      // reschedule queue
      this.resetTime(nextTime);
    }

    // reset next engine time

  }, {
    key: 'resetEngineTime',
    value: function resetEngineTime(engine) {
      var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.currentTime;

      if (engine.master !== this) throw new Error("object has not been added to this scheduler");

      var nextTime = void 0;

      if (this.__queue.has(engine)) nextTime = this.__queue.move(engine, time);else nextTime = this.__queue.insert(engine, time);

      this.resetTime(nextTime);
    }

    // check whether a given engine is scheduled

  }, {
    key: 'has',
    value: function has(engine) {
      return this.__engines.has(engine);
    }

    // clear queue

  }, {
    key: 'clear',
    value: function clear() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(this.__engines), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var engine = _step.value;

          engine.master = null;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.__queue.clear();
      this.__engines.clear();
      this.resetTime(Infinity);
    }
  }, {
    key: 'currentTime',
    get: function get() {
      return 0;
    }
  }]);
  return SchedulingQueue;
}(_timeEngine2.default);

exports.default = SchedulingQueue;

},{"./priority-queue":3,"./time-engine":5,"babel-runtime/core-js/get-iterator":16,"babel-runtime/core-js/object/get-prototype-of":20,"babel-runtime/core-js/set":22,"babel-runtime/helpers/classCallCheck":26,"babel-runtime/helpers/createClass":27,"babel-runtime/helpers/inherits":29,"babel-runtime/helpers/possibleConstructorReturn":30}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Base class for time engines
 *
 * A time engine generates more or less regular events and/or plays back a
 * media stream. It implements one or multiple interfaces to be driven by a
 * master (i.e. a Scheduler, a Transport or a PlayControl) in synchronization
 * with other engines. The provided interfaces are scheduled, transported,
 * and play-controlled.
 *
 *
 * #### The `scheduled` interface
 *
 * The scheduled interface allows for synchronizing an engine to a monotonous time
 * as it is provided by the Scheduler master.
 *
 * ###### `advanceTime(time :Number) -> {Number}`
 *
 * The `advanceTime` method has to be implemented by an `TimeEngine` as part of the
 * scheduled interface. The method is called by the master (e.g. the scheduler).
 * It generates an event and to returns the time of the next event (i.e. the next
 * call of advanceTime). The returned time has to be greater than the time
 * received as argument of the method. In case that a TimeEngine has to generate
 * multiple events at the same time, the engine has to implement its own loop
 * while(event.time <= time) and return the time of the next event (if any).
 *
 * ###### `resetTime(time=undefined :Number)`
 *
 * The `resetTime` method is provided by the `TimeEngine` base class. An engine may
 * call this method to reset its next event time (e.g. when a parameter is
 * changed that influences the engine's temporal behavior). When no argument
 * is given, the time is reset to the current master time. When calling the
 * method with Infinity the engine is suspended without being removed from the
 * master.
 *
 *
 * #### The `transported` interface
 *
 * The transported interface allows for synchronizing an engine to a position
 * (i.e. media playback time) that can run forward and backward and jump as it
 * is provided by the Transport master.
 *
 * ###### `syncPosition(time :Number, position :Number, speed :Number) -> {Number}`
 *
 * The `syncPositon` method has to be implemented by a `TimeEngine` as part of the
 * transported interface. The method syncPositon is called whenever the master
 * of a transported engine has to (re-)synchronize the engine's position. This
 * is for example required when the master (re-)starts playback, jumps to an
 * arbitrary position, and when reversing playback direction. The method returns
 * the next position of the engine in the given playback direction
 * (i.e. `speed < 0` or `speed > 0`).
 *
 * ###### `advancePosition(time :Number, position :Number, speed :Number) -> {Number}`
 *
 * The `advancePosition` method has to be implemented by a `TimeEngine` as part
 * of the transported interface. The master calls the advancePositon method when
 * the engine's event position is reached. The method generates an event and
 * returns the next position in the given playback direction (i.e. speed < 0 or
 * speed > 0). The returned position has to be greater (i.e. when speed > 0)
 * or less (i.e. when speed < 0) than the position received as argument of the
 * method.
 *
 * ###### `resetPosition(position=undefined :Number)`
 *
 * The resetPosition method is provided by the TimeEngine base class. An engine
 * may call this method to reset its next event position. When no argument
 * is given, the time is reset to the current master time. When calling the
 * method with Infinity the engine is suspended without being removed from
 * the master.
 *
 *
 * #### The speed-controlled interface
 *
 * The "speed-controlled" interface allows for syncronizing an engine that is
 * neither driven through the scheduled nor the transported interface. The
 * interface allows in particular to synchronize engines that assure their own
 * scheduling (i.e. audio player or an oscillator) to the event-based scheduled
 * and transported engines.
 *
 * ###### `syncSpeed(time :Number, position :Number, speed :Number, seek=false :Boolean)`
 *
 * The syncSpeed method has to be implemented by a TimeEngine as part of the
 * speed-controlled interface. The method is called by the master whenever the
 * playback speed changes or the position jumps arbitarily (i.e. on a seek).
 *
 *
 * <hr />
 *
 * Example that shows a `TimeEngine` running in a `Scheduler` that counts up
 * at a given frequency:
 * {@link https://rawgit.com/wavesjs/waves-audio/master/examples/time-engine.html}
 *
 * @example
 * import * as audio from 'waves-audio';
 *
 * class MyEngine extends audio.TimeEngine {
 *   constructor() {
 *     super();
 *     // ...
 *   }
 * }
 *
 */
var TimeEngine = function () {
  function TimeEngine() {
    (0, _classCallCheck3.default)(this, TimeEngine);

    /**
     * The engine's master.
     *
     * @type {Mixed}
     * @name master
     * @memberof TimeEngine
     */
    this.master = null;
  }

  /**
   * The time engine's current (master) time.
   *
   * @type {Number}
   * @memberof TimeEngine
   * @readonly
   */


  (0, _createClass3.default)(TimeEngine, [{
    key: "resetTime",
    value: function resetTime() {
      var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

      if (this.master) this.master.resetEngineTime(this, time);
    }

    /**
     * Transported interface
     *   - syncPosition(time, position, speed), called to reposition TimeEngine, returns next position
     *   - advancePosition(time, position, speed), called to generate next event at given time and position, returns next position
     *
     * @static
     * @memberof TimeEngine
     */

  }, {
    key: "resetPosition",
    value: function resetPosition() {
      var position = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

      if (this.master) this.master.resetEnginePosition(this, position);
    }

    /**
     * Speed-controlled interface
     *   - syncSpeed(time, position, speed, ), called to
     *
     * @static
     * @memberof TimeEngine
     */

  }, {
    key: "currentTime",
    get: function get() {
      if (this.master) return this.master.currentTime;

      return undefined;
    }

    /**
     * The time engine's current (master) position.
     *
     * @type {Number}
     * @memberof TimeEngine
     * @readonly
     */

  }, {
    key: "currentPosition",
    get: function get() {
      var master = this.master;

      if (master && master.currentPosition !== undefined) return master.currentPosition;

      return undefined;
    }

    /**
     * Scheduled interface
     *   - advanceTime(time), called to generate next event at given time, returns next time
     *
     * @static
     * @memberof TimeEngine
     */

  }], [{
    key: "implementsScheduled",
    value: function implementsScheduled(engine) {
      return engine.advanceTime && engine.advanceTime instanceof Function;
    }
  }, {
    key: "implementsTransported",
    value: function implementsTransported(engine) {
      return engine.syncPosition && engine.syncPosition instanceof Function && engine.advancePosition && engine.advancePosition instanceof Function;
    }
  }, {
    key: "implementsSpeedControlled",
    value: function implementsSpeedControlled(engine) {
      return engine.syncSpeed && engine.syncSpeed instanceof Function;
    }
  }]);
  return TimeEngine;
}();

exports.default = TimeEngine;

},{"babel-runtime/helpers/classCallCheck":26,"babel-runtime/helpers/createClass":27}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _audioTimeEngine = require('../core/audio-time-engine');

var _audioTimeEngine2 = _interopRequireDefault(_audioTimeEngine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function optOrDef(opt, def) {
  if (opt !== undefined) return opt;

  return def;
}

/**
 * Granular synthesis TimeEngine implementing the scheduled interface.
 * The grain position (grain onset or center time in the audio buffer) is
 * optionally determined by the engine's currentPosition attribute.
 *
 * Example that shows a `GranularEngine` (with a few parameter controls) driven
 * by a `Scheduler` and a `PlayControl`:
 * {@link https://rawgit.com/wavesjs/waves-audio/master/examples/granular-engine.html}
 *
 * @extends AudioTimeEngine
 * @example
 * import * as audio from 'waves-audio';
 * const scheduler = audio.getScheduler();
 * const granularEngine = new audio.GranularEngine();
 *
 * scheduler.add(granularEngine);
 *
 *
 * @param {Object} options={} - Parameters
 * @param {AudioBuffer} [options.buffer=null] - Audio buffer
 * @param {Number} [options.periodAbs=0.01] - Absolute grain period in sec
 * @param {Number} [options.periodRel=0] - Grain period relative to absolute
 *  duration
 * @param {Number} [options.periodVar=0] - Amout of random grain period
 *  variation relative to grain period
 * @param {Number} [options.periodMin=0.001] - Minimum grain period
 * @param {Number} [options.position=0] - Grain position (onset time in audio
 *  buffer) in sec
 * @param {Number} [options.positionVar=0.003] - Amout of random grain position
 *  variation in sec
 * @param {Number} [options.durationAbs=0.1] - Absolute grain duration in sec
 * @param {Number} [options.durationRel=0] - Grain duration relative to grain
 * @param {Number} [options.durationVar=0] - Amout of random grain duration
 *  period (overlap)
 * @param {Number} [options.attackAbs=0] - Absolute attack time in sec
 * @param {Number} [options.attackRel=0.5] - Attack time relative to grain duration
 * @param {String} [options.attackShape='lin'] - Shape of attack
 * @param {Number} [options.releaseAbs=0] - Absolute release time in sec
 * @param {Number} [options.releaseRel=0.5] - Release time relative to grain duration
 * @param {Number} [options.releaseShape='lin'] - Shape of release
 * @param {String} [options.expRampOffset=0.0001] - Offset (start/end value)
 *  for exponential attack/release
 * @param {Number} [options.resampling=0] - Grain resampling in cent
 * @param {Number} [options.resamplingVar=0] - Amout of random resampling variation in cent
 * @param {Number} [options.gain=1] - Linear gain factor
 * @param {Boolean} [options.centered=true] - Whether the grain position refers
 *  to the center of the grain (or the beginning)
 * @param {Boolean} [options.cyclic=false] - Whether the audio buffer and grain
 *  position are considered as cyclic
 * @param {Number} [options.wrapAroundExtension=0] - Portion at the end of the
 *  audio buffer that has been copied from the beginning to assure cyclic behavior
 */

var GranularEngine = function (_AudioTimeEngine) {
  (0, _inherits3.default)(GranularEngine, _AudioTimeEngine);

  function GranularEngine() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, GranularEngine);

    /**
     * Audio buffer
     *
     * @type {AudioBuffer}
     * @name buffer
     * @default null
     * @memberof GranularEngine
     * @instance
     */
    var _this = (0, _possibleConstructorReturn3.default)(this, (GranularEngine.__proto__ || (0, _getPrototypeOf2.default)(GranularEngine)).call(this, options.audioContext));

    _this.buffer = optOrDef(options.buffer, null);

    /**
     * Absolute grain period in sec
     *
     * @type {Number}
     * @name periodAbs
     * @default 0.01
     * @memberof GranularEngine
     * @instance
     */
    _this.periodAbs = optOrDef(options.periodAbs, 0.01);

    /**
     * Grain period relative to absolute duration
     *
     * @type {Number}
     * @name periodRel
     * @default 0
     * @memberof GranularEngine
     * @instance
     */
    _this.periodRel = optOrDef(options.periodRel, 0);

    /**
     * Amout of random grain period variation relative to grain period
     *
     * @type {Number}
     * @name periodVar
     * @default 0
     * @memberof GranularEngine
     * @instance
     */
    _this.periodVar = optOrDef(options.periodVar, 0);

    /**
     * Minimum grain period
     *
     * @type {Number}
     * @name periodMin
     * @default 0.001
     * @memberof GranularEngine
     * @instance
     */
    _this.periodMin = optOrDef(options.periodMin, 0.001);

    /**
     * Grain position (onset time in audio buffer) in sec
     *
     * @type {Number}
     * @name position
     * @default 0
     * @memberof GranularEngine
     * @instance
     */
    _this.position = optOrDef(options.position, 0);

    /**
     * Amout of random grain position variation in sec
     *
     * @type {Number}
     * @name positionVar
     * @default 0.003
     * @memberof GranularEngine
     * @instance
     */
    _this.positionVar = optOrDef(options.positionVar, 0.003);

    /**
     * Absolute grain duration in sec
     *
     * @type {Number}
     * @name durationAbs
     * @default 0.1
     * @memberof GranularEngine
     * @instance
     */
    _this.durationAbs = optOrDef(options.durationAbs, 0.1); // absolute grain duration

    /**
     * Grain duration relative to grain period (overlap)
     *
     * @type {Number}
     * @name durationRel
     * @default 0
     * @memberof GranularEngine
     * @instance
     */
    _this.durationRel = optOrDef(options.durationRel, 0);

    /**
     * Amout of random grain duration variation in sec
     *
     * @type {Number}
     * @name durationVar
     * @default 0
     * @memberof GranularEngine
     * @instance
     */
    _this.durationVar = optOrDef(options.durationVar, 0);

    /**
     * Absolute attack time in sec
     *
     * @type {Number}
     * @name attackAbs
     * @default 0
     * @memberof GranularEngine
     * @instance
     */
    _this.attackAbs = optOrDef(options.attackAbs, 0);

    /**
     * Attack time relative to grain duration
     *
     * @type {Number}
     * @name attackRel
     * @default 0.5
     * @memberof GranularEngine
     * @instance
     */
    _this.attackRel = optOrDef(options.attackRel, 0.5);

    /**
     * Shape of attack ('lin' for linear ramp, 'exp' for exponential ramp)
     *
     * @type {String}
     * @name attackShape
     * @default 'lin'
     * @memberof GranularEngine
     * @instance
     */
    _this.attackShape = optOrDef(options.attackShape, 'lin');

    /**
     * Absolute release time in sec
     *
     * @type {Number}
     * @name releaseAbs
     * @default 0
     * @memberof GranularEngine
     * @instance
     */
    _this.releaseAbs = optOrDef(options.releaseAbs, 0);

    /**
     * Release time relative to grain duration
     *
     * @type {Number}
     * @name releaseRel
     * @default 0.5
     * @memberof GranularEngine
     * @instance
     */
    _this.releaseRel = optOrDef(options.releaseRel, 0.5);

    /**
     * Shape of release ('lin' for linear ramp, 'exp' for exponential ramp)
     *
     * @type {String}
     * @name releaseShape
     * @default 'lin'
     * @memberof GranularEngine
     * @instance
     */
    _this.releaseShape = optOrDef(options.releaseShape, 'lin');

    /**
     * Offset (start/end value) for exponential attack/release
     *
     * @type {Number}
     * @name expRampOffset
     * @default 0.0001
     * @memberof GranularEngine
     * @instance
     */
    _this.expRampOffset = optOrDef(options.expRampOffset, 0.0001);

    /**
     * Grain resampling in cent
     *
     * @type {Number}
     * @name resampling
     * @default 0
     * @memberof GranularEngine
     * @instance
     */
    _this.resampling = optOrDef(options.resampling, 0);

    /**
     * Amout of random resampling variation in cent
     *
     * @type {Number}
     * @name resamplingVar
     * @default 0
     * @memberof GranularEngine
     * @instance
     */
    _this.resamplingVar = optOrDef(options.resamplingVar, 0);

    /**
     * Linear gain factor
     *
     * @type {Number}
     * @name gain
     * @default 1
     * @memberof GranularEngine
     * @instance
     */
    _this.gain = optOrDef(options.gain, 1);

    /**
     * Whether the grain position refers to the center of the grain (or the beginning)
     *
     * @type {Boolean}
     * @name centered
     * @default true
     * @memberof GranularEngine
     * @instance
     */
    _this.centered = optOrDef(options.centered, true);

    /**
     * Whether the audio buffer and grain position are considered as cyclic
     *
     * @type {Boolean}
     * @name cyclic
     * @default false
     * @memberof GranularEngine
     * @instance
     */
    _this.cyclic = optOrDef(options.cyclic, false);

    /**
     * Portion at the end of the audio buffer that has been copied from the
     * beginning to assure cyclic behavior
     *
     * @type {Number}
     * @name wrapAroundExtension
     * @default 0
     * @memberof GranularEngine
     * @instance
     */
    _this.wrapAroundExtension = optOrDef(options.wrapAroundExtension, 0);

    _this.outputNode = _this.audioContext.createGain();
    return _this;
  }

  /**
   * Get buffer duration (excluding wrapAroundExtension)
   *
   * @type {Number}
   * @name bufferDuration
   * @memberof GranularEngine
   * @instance
   * @readonly
   */


  (0, _createClass3.default)(GranularEngine, [{
    key: 'advanceTime',
    value: function advanceTime(time) {
      time = Math.max(time, this.audioContext.currentTime);
      return time + this.trigger(time);
    }

    /**
     * Trigger a grain. This function can be called at any time (whether the
     * engine is scheduled or not) to generate a single grain according to the
     * current grain parameters.
     *
     * @param {Number} time - grain synthesis audio time
     * @return {Number} - period to next grain
     */

  }, {
    key: 'trigger',
    value: function trigger(time) {
      var audioContext = this.audioContext;
      var grainTime = time || audioContext.currentTime;
      var grainPeriod = this.periodAbs;
      var grainPosition = this.currentPosition;
      var grainDuration = this.durationAbs;

      if (this.buffer) {
        var resamplingRate = 1.0;

        // calculate resampling
        if (this.resampling !== 0 || this.resamplingVar > 0) {
          var randomResampling = (Math.random() - 0.5) * 2.0 * this.resamplingVar;
          resamplingRate = Math.pow(2.0, (this.resampling + randomResampling) / 1200.0);
        }

        // randomize grain duration
        if (this.durationVar > 0) grainDuration += (2.0 * Math.random() - 1) * this.durationVar;

        grainPeriod += this.periodRel * grainDuration;
        grainDuration += this.durationRel * grainPeriod;

        // grain period randon variation
        if (this.periodVar > 0.0) grainPeriod += 2.0 * (Math.random() - 0.5) * this.periodVar * grainPeriod;

        // center grain
        if (this.centered) grainPosition -= 0.5 * grainDuration;

        // randomize grain position
        if (this.positionVar > 0) grainPosition += (2.0 * Math.random() - 1) * this.positionVar;

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
          var envelope = audioContext.createGain();
          var attack = this.attackAbs + this.attackRel * grainDuration;
          var release = this.releaseAbs + this.releaseRel * grainDuration;

          if (attack + release > grainDuration) {
            var factor = grainDuration / (attack + release);
            attack *= factor;
            release *= factor;
          }

          var attackEndTime = grainTime + attack;
          var grainEndTime = grainTime + grainDuration / resamplingRate;
          var releaseStartTime = grainEndTime - release;

          envelope.gain.value = 0;

          if (this.attackShape === 'lin') {
            envelope.gain.setValueAtTime(0.0, grainTime);
            envelope.gain.linearRampToValueAtTime(this.gain, attackEndTime);
          } else {
            envelope.gain.setValueAtTime(this.expRampOffset, grainTime);
            envelope.gain.exponentialRampToValueAtTime(this.gain, attackEndTime);
          }

          if (releaseStartTime > attackEndTime) envelope.gain.setValueAtTime(this.gain, releaseStartTime);

          if (this.releaseShape === 'lin') {
            envelope.gain.linearRampToValueAtTime(0.0, grainEndTime);
          } else {
            envelope.gain.exponentialRampToValueAtTime(this.expRampOffset, grainEndTime);
          }

          envelope.connect(this.outputNode);

          // make source
          var source = audioContext.createBufferSource();

          source.buffer = this.buffer;
          source.playbackRate.value = resamplingRate;
          source.connect(envelope);

          source.start(grainTime, grainPosition);
          source.stop(grainEndTime);
        }
      }

      return Math.max(this.periodMin, grainPeriod);
    }
  }, {
    key: 'bufferDuration',
    get: function get() {
      if (this.buffer) {
        var bufferDuration = this.buffer.duration;

        if (this.wrapAroundExtension) bufferDuration -= this.wrapAroundExtension;

        return bufferDuration;
      }

      return 0;
    }

    /**
     * Current position
     *
     * @type {Number}
     * @name currentPosition
     * @memberof GranularEngine
     * @instance
     * @readonly
     */

  }, {
    key: 'currentPosition',
    get: function get() {
      var master = this.master;

      if (master && master.currentPosition !== undefined) return master.currentPosition;

      return this.position;
    }
  }]);
  return GranularEngine;
}(_audioTimeEngine2.default);

exports.default = GranularEngine;

},{"../core/audio-time-engine":2,"babel-runtime/core-js/object/get-prototype-of":20,"babel-runtime/helpers/classCallCheck":26,"babel-runtime/helpers/createClass":27,"babel-runtime/helpers/inherits":29,"babel-runtime/helpers/possibleConstructorReturn":30}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _audioTimeEngine = require('../core/audio-time-engine');

var _audioTimeEngine2 = _interopRequireDefault(_audioTimeEngine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function optOrDef(opt, def) {
  if (opt !== undefined) return opt;

  return def;
}

/**
 * Metronome audio engine. It extends Time Engine as a transported interface.
 * [example]{@link https://rawgit.com/wavesjs/waves-audio/master/examples/metronome.html}
 *
 * @extends AudioTimeEngine
 * @example
 * import * as audio from 'waves-audio';
 * const scheduler = audio.getScheduler();
 * const metronome = new audio.Metronome({period: 0.333});
 *
 * scheduler.add(metronome);
 *
 * @param {Object} [options={}] - Default options
 * @param {Number} [options.period=1] - Metronome period
 * @param {Number} [options.clickFreq=600] - Metronome click frequency
 * @param {Number} [options.clickAttack=0.002] - Metronome click attack time
 * @param {Number} [options.clickRelease=0.098] - Metronome click release time
 * @param {Number} [options.gain=1] - Gain
 */

var Metronome = function (_AudioTimeEngine) {
  (0, _inherits3.default)(Metronome, _AudioTimeEngine);

  function Metronome() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, Metronome);

    /**
     * Metronome period
     * @type {Number}
     * @private
     */
    var _this = (0, _possibleConstructorReturn3.default)(this, (Metronome.__proto__ || (0, _getPrototypeOf2.default)(Metronome)).call(this, options.audioContext));

    _this.__period = optOrDef(options.period, 1);

    /**
     * Metronome click frequency
     *
     * @type {Number}
     * @memberof Metronome
     * @name clickFreq
     * @instance
     */
    _this.clickFreq = optOrDef(options.clickFreq, 600);

    /**
     * Metronome click attack time
     *
     * @type {Number}
     * @memberof Metronome
     * @name clickAttack
     * @instance
     */
    _this.clickAttack = optOrDef(options.clickAttack, 0.002);

    /**
     * Metronome click release time
     *
     * @type {Number}
     * @memberof Metronome
     * @name clickRelease
     * @instance
     */
    _this.clickRelease = optOrDef(options.clickRelease, 0.098);

    _this.__lastTime = 0;
    _this.__phase = 0;

    _this.__gainNode = _this.audioContext.createGain();
    _this.__gainNode.gain.value = optOrDef(options.gain, 1);

    _this.outputNode = _this.__gainNode;
    return _this;
  }

  // TimeEngine method (scheduled interface)


  (0, _createClass3.default)(Metronome, [{
    key: 'advanceTime',
    value: function advanceTime(time) {
      this.trigger(time);
      this.__lastTime = time;
      return time + this.__period;
    }

    // TimeEngine method (transported interface)

  }, {
    key: 'syncPosition',
    value: function syncPosition(time, position, speed) {
      if (this.__period > 0) {
        var nextPosition = (Math.floor(position / this.__period) + this.__phase) * this.__period;

        if (speed > 0 && nextPosition < position) nextPosition += this.__period;else if (speed < 0 && nextPosition > position) nextPosition -= this.__period;

        return nextPosition;
      }

      return Infinity * speed;
    }

    // TimeEngine method (transported interface)

  }, {
    key: 'advancePosition',
    value: function advancePosition(time, position, speed) {
      this.trigger(time);

      if (speed < 0) return position - this.__period;

      return position + this.__period;
    }

    /**
     * Trigger metronome click
     * @param {Number} time metronome click synthesis audio time
     */

  }, {
    key: 'trigger',
    value: function trigger(time) {
      var audioContext = this.audioContext;
      var clickAttack = this.clickAttack;
      var clickRelease = this.clickRelease;

      var env = audioContext.createGain();
      env.gain.value = 0.0;
      env.gain.setValueAtTime(0, time);
      env.gain.linearRampToValueAtTime(1.0, time + clickAttack);
      env.gain.exponentialRampToValueAtTime(0.0000001, time + clickAttack + clickRelease);
      env.gain.setValueAtTime(0, time);
      env.connect(this.outputNode);

      var osc = audioContext.createOscillator();
      osc.frequency.value = this.clickFreq;
      osc.start(time);
      osc.stop(time + clickAttack + clickRelease);
      osc.connect(env);
    }

    /**
     * linear gain factor
     *
     * @type {Number}
     * @name gain
     * @memberof Metronome
     * @instance
     */

  }, {
    key: 'gain',
    set: function set(value) {
      this.__gainNode.gain.value = value;
    },
    get: function get() {
      return this.__gainNode.gain.value;
    }

    /**
     * metronome period
     *
     * @type {Number}
     * @name period
     * @memberof Metronome
     * @instance
     */

  }, {
    key: 'period',
    set: function set(period) {
      this.__period = period;

      var master = this.master;

      if (master) {
        if (master.resetEngineTime) master.resetEngineTime(this, this.__lastTime + period);else if (master.resetEnginePosition) master.resetEnginePosition(this);
      }
    },
    get: function get() {
      return this.__period;
    }

    /**
     * Set phase parameter (available only when 'transported'), should be
     * between [0, 1[
     *
     * @type {Number}
     * @name phase
     * @memberof Metronome
     * @instance
     */

  }, {
    key: 'phase',
    set: function set(phase) {
      this.__phase = phase - Math.floor(phase);

      var master = this.master;

      if (master && master.resetEnginePosition !== undefined) master.resetEnginePosition(this);
    },
    get: function get() {
      return this.__phase;
    }
  }]);
  return Metronome;
}(_audioTimeEngine2.default);

exports.default = Metronome;

},{"../core/audio-time-engine":2,"babel-runtime/core-js/object/get-prototype-of":20,"babel-runtime/helpers/classCallCheck":26,"babel-runtime/helpers/createClass":27,"babel-runtime/helpers/inherits":29,"babel-runtime/helpers/possibleConstructorReturn":30}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _audioTimeEngine = require('../core/audio-time-engine');

var _audioTimeEngine2 = _interopRequireDefault(_audioTimeEngine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function optOrDef(opt, def) {
  if (opt !== undefined) return opt;

  return def;
}

/**
 * Used with a buffer to serve audio files.
 *
 * [example]{@link https://rawgit.com/wavesjs/waves-audio/master/examples/player-engine.html}
 *
 * @extends AudioTimeEngine
 * @example
 * import * as audio from 'waves-audio';
 * const playerEngine = audio.PlayerEngine();
 * const playControl = new audio.PlayControl(playerEngine);
 *
 * playControl.start();
 *
 * @param {Object} [options={}] - Default options
 * @param {Number} [options.buffer=1] - Audio buffer
 * @param {Number} [options.fadeTime=600] - Fade time for chaining segments
 * @param {Number} [options.cyclic=false] - Loop mode
 * @param {Number} [options.gain=1] - Gain
 */

var PlayerEngine = function (_AudioTimeEngine) {
  (0, _inherits3.default)(PlayerEngine, _AudioTimeEngine);

  function PlayerEngine() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, PlayerEngine);

    var _this = (0, _possibleConstructorReturn3.default)(this, (PlayerEngine.__proto__ || (0, _getPrototypeOf2.default)(PlayerEngine)).call(this, options.audioContext));

    _this.transport = null; // set when added to transporter

    /**
     * Audio buffer
     *
     * @type {AudioBuffer}
     * @name buffer
     * @memberof PlayerEngine
     * @instance
     * @default null
     */
    _this.buffer = optOrDef(options.buffer, null);

    /**
     * Fade time for chaining segments (e.g. in start, stop, and seek)
     *
     * @type {Number}
     * @name fadeTime
     * @memberof PlayerEngine
     * @instance
     * @default 0.005
     */
    _this.fadeTime = optOrDef(options.fadeTime, 0.005);

    _this.__time = 0;
    _this.__position = 0;
    _this.__speed = 0;

    _this.__bufferSource = null;
    _this.__envNode = null;

    _this.__gainNode = _this.audioContext.createGain();
    _this.__gainNode.gain.value = optOrDef(options.gain, 1);

    _this.__cyclic = optOrDef(options.cyclic, false);

    _this.outputNode = _this.__gainNode;
    return _this;
  }

  (0, _createClass3.default)(PlayerEngine, [{
    key: '__start',
    value: function __start(time, position, speed) {
      var audioContext = this.audioContext;

      if (this.buffer) {
        var bufferDuration = this.buffer.duration;

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
  }, {
    key: '__halt',
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

    // TimeEngine method (speed-controlled interface)

  }, {
    key: 'syncSpeed',
    value: function syncSpeed(time, position, speed) {
      var seek = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

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

    /**
     * Set whether the audio buffer is considered as cyclic
     * @type {Bool}
     * @name cyclic
     * @memberof PlayerEngine
     * @instance
     */

  }, {
    key: 'cyclic',
    set: function set(cyclic) {
      if (cyclic !== this.__cyclic) {
        var time = this.currentTime;
        var position = this.currentosition;

        this.__halt(time);
        this.__cyclic = cyclic;

        if (this.__speed !== 0) this.__start(time, position, this.__speed);
      }
    },
    get: function get() {
      return this.__cyclic;
    }

    /**
     * Linear gain factor
     * @type {Number}
     * @name gain
     * @memberof PlayerEngine
     * @instance
     */

  }, {
    key: 'gain',
    set: function set(value) {
      var time = this.currentTime;
      this.__gainNode.cancelScheduledValues(time);
      this.__gainNode.setValueAtTime(this.__gainNode.gain.value, time);
      this.__gainNode.linearRampToValueAtTime(0, time + this.fadeTime);
    },
    get: function get() {
      return this.__gainNode.gain.value;
    }

    /**
     * Get buffer duration
     * @type {Number}
     * @name bufferDuration
     * @memberof PlayerEngine
     * @instance
     * @readonly
     */

  }, {
    key: 'bufferDuration',
    get: function get() {
      if (this.buffer) return this.buffer.duration;

      return 0;
    }
  }]);
  return PlayerEngine;
}(_audioTimeEngine2.default);

exports.default = PlayerEngine;

},{"../core/audio-time-engine":2,"babel-runtime/core-js/object/get-prototype-of":20,"babel-runtime/helpers/classCallCheck":26,"babel-runtime/helpers/createClass":27,"babel-runtime/helpers/inherits":29,"babel-runtime/helpers/possibleConstructorReturn":30}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _audioTimeEngine = require('../core/audio-time-engine');

var _audioTimeEngine2 = _interopRequireDefault(_audioTimeEngine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function optOrDef(opt, def) {
  if (opt !== undefined) return opt;

  return def;
}

function getCurrentOrPreviousIndex(sortedArray, value) {
  var index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;

  var size = sortedArray.length;

  if (size > 0) {
    var firstVal = sortedArray[0];
    var lastVal = sortedArray[size - 1];

    if (value < firstVal) index = -1;else if (value >= lastVal) index = size - 1;else {
      if (index < 0 || index >= size) index = Math.floor((size - 1) * (value - firstVal) / (lastVal - firstVal));

      while (sortedArray[index] > value) {
        index--;
      }while (sortedArray[index + 1] <= value) {
        index++;
      }
    }
  }

  return index;
}

function getCurrentOrNextIndex(sortedArray, value) {
  var index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;

  var size = sortedArray.length;

  if (size > 0) {
    var firstVal = sortedArray[0];
    var lastVal = sortedArray[size - 1];

    if (value <= firstVal) index = 0;else if (value >= lastVal) index = size;else {
      if (index < 0 || index >= size) index = Math.floor((size - 1) * (value - firstVal) / (lastVal - firstVal));

      while (sortedArray[index] < value) {
        index++;
      }while (sortedArray[index - 1] >= value) {
        index--;
      }
    }
  }

  return index;
}

/**
 * Used with a buffer to serve audio files via granular synthesis.
 *
 * The engine implements the "scheduled" and "transported" interfaces.
 * When "scheduled", the engine  generates segments more or less periodically
 * (controlled by the periodAbs, periodRel, and perioVar attributes).
 * When "transported", the engine generates segments at the position of their onset time.
 *
 * Example that shows a `SegmentEngine` with a few parameter controls running in a `Scheduler`.
 * {@link https://rawgit.com/wavesjs/waves-audio/master/examples/segment-engine.html}
 *
 * @extends AudioTimeEngine
 * @example
 * import * as audio from 'waves-audio';
 * const scheduler = audio.getScheduler();
 * const segmentEngine = new audio.SegmentEngine();
 *
 * scheduler.add(segmentEngine);
 *
 * @param {Object} [options={}] - Default options
 * @param {AudioBuffer} [options.buffer=null] - Audio buffer
 * @param {Number} [options.periodAbs=0] - Absolute segment period in sec
 * @param {Number} [options.periodRel=1] - Segment period relative to inter-segment distance
 * @param {Number} [options.periodVar=0] - Amout of random segment period variation relative
 *  to segment period
 * @param {Number} [options.periodMin=0.001] - Minimum segment period
 * @param {Number} [options.positionArray=[0.0]] - Array of segment positions (onset times
 *  in audio buffer) in sec
 * @param {Number} [options.positionVar=0] - Amout of random segment position variation in sec
 * @param {Number} [options.durationArray=[0.0]] - Array of segment durations in sec
 * @param {Number} [options.durationAbs=0] - Absolute segment duration in sec
 * @param {Number} [options.durationRel=1] - Segment duration relative to given segment
 *  duration or inter-segment distance
 * @param {Array} [options.offsetArray=[0.0]] - Array of segment offsets in sec
 * @param {Number} [options.offsetAbs=-0.005] - Absolute segment offset in sec
 * @param {Number} [options.offsetRel=0] - Segment offset relative to segment duration
 * @param {Number} [options.delay=0.005] - Time by which all segments are delayed (especially
 *  to realize segment offsets)
 * @param {Number} [options.attackAbs=0.005] - Absolute attack time in sec
 * @param {Number} [options.attackRel=0] - Attack time relative to segment duration
 * @param {Number} [options.releaseAbs=0.005] - Absolute release time in sec
 * @param {Number} [options.releaseRel=0] - Release time relative to segment duration
 * @param {Number} [options.resampling=0] - Segment resampling in cent
 * @param {Number} [options.resamplingVar=0] - Amout of random resampling variation in cent
 * @param {Number} [options.gain=1] - Linear gain factor
 * @param {Number} [options.abortTime=0.005] - fade-out time when aborted
 * @param {Number} [options.segmentIndex=0] - Index of the segment to synthesize (i.e. of
 *  this.positionArray/durationArray/offsetArray)
 * @param {Bool} [options.cyclic=false] - Whether the audio buffer and segment indices are
 *  considered as cyclic
 * @param {Number} [options.wrapAroundExtension=0] - Portion at the end of the audio buffer
 *  that has been copied from the beginning to assure cyclic behavior
 */

var SegmentEngine = function (_AudioTimeEngine) {
  (0, _inherits3.default)(SegmentEngine, _AudioTimeEngine);

  function SegmentEngine() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, SegmentEngine);

    /**
     * Audio buffer
     * @name buffer
     * @type {AudioBuffer}
     * @default null
     * @memberof SegmentEngine
     * @instance
     */
    var _this = (0, _possibleConstructorReturn3.default)(this, (SegmentEngine.__proto__ || (0, _getPrototypeOf2.default)(SegmentEngine)).call(this, options.audioContext));

    _this.buffer = optOrDef(options.buffer, null);

    /**
     * Absolute segment period in sec
     * @name periodAbs
     * @type {Number}
     * @default 0
     * @memberof SegmentEngine
     * @instance
     */
    _this.periodAbs = optOrDef(options.periodAbs, 0);

    /**
     * Segment period relative to inter-segment distance
     * @name periodRel
     * @type {Number}
     * @default 1
     * @memberof SegmentEngine
     * @instance
     */
    _this.periodRel = optOrDef(options.periodRel, 1);

    /**
     * Amout of random segment period variation relative to segment period
     * @name periodVar
     * @type {Number}
     * @default 0
     * @memberof SegmentEngine
     * @instance
     */
    _this.periodVar = optOrDef(options.periodVar, 0);

    /**
     * Minimum segment period
     * @name periodMin
     * @type {Number}
     * @default 0.001
     * @memberof SegmentEngine
     * @instance
     */
    _this.periodMin = optOrDef(options.periodMin, 0.001);

    /**
     * Array of segment positions (onset times in audio buffer) in sec
     * @name positionArray
     * @type {Number}
     * @default [0.0]
     * @memberof SegmentEngine
     * @instance
     */
    _this.positionArray = optOrDef(options.positionArray, [0.0]);

    /**
     * Amout of random segment position variation in sec
     * @name positionVar
     * @type {Number}
     * @default 0
     * @memberof SegmentEngine
     * @instance
     */
    _this.positionVar = optOrDef(options.positionVar, 0);

    /**
     * Array of segment durations in sec
     * @name durationArray
     * @type {Number}
     * @default [0.0]
     * @memberof SegmentEngine
     * @instance
     */
    _this.durationArray = optOrDef(options.durationArray, [0.0]);

    /**
     * Absolute segment duration in sec
     * @name durationAbs
     * @type {Number}
     * @default 0
     * @memberof SegmentEngine
     * @instance
     */
    _this.durationAbs = optOrDef(options.durationAbs, 0);

    /**
     * Segment duration relative to given segment duration or inter-segment distance
     * @name durationRel
     * @type {Number}
     * @default 1
     * @memberof SegmentEngine
     * @instance
     */
    _this.durationRel = optOrDef(options.durationRel, 1);

    /**
     * Array of segment offsets in sec
     *
     * offset > 0: the segment's reference position is after the given segment position
     * offset < 0: the given segment position is the segment's reference position
     * and the duration has to be corrected by the offset
     *
     * @name offsetArray
     * @type {Array}
     * @default [0.0]
     * @memberof SegmentEngine
     * @instance
     */
    _this.offsetArray = optOrDef(options.offsetArray, [0.0]);

    /**
     * Absolute segment offset in sec
     * @name offsetAbs
     * @type {Number}
     * @default -0.005
     * @memberof SegmentEngine
     * @instance
     */
    _this.offsetAbs = optOrDef(options.offsetAbs, -0.005);

    /**
     * Segment offset relative to segment duration
     * @name offsetRel
     * @type {Number}
     * @default 0
     * @memberof SegmentEngine
     * @instance
     */
    _this.offsetRel = optOrDef(options.offsetRel, 0);

    /**
     * Time by which all segments are delayed (especially to realize segment offsets)
     * @name delay
     * @type {Number}
     * @default 0.005
     * @memberof SegmentEngine
     * @instance
     */
    _this.delay = optOrDef(options.delay, 0.005);

    /**
     * Absolute attack time in sec
     * @name attackAbs
     * @type {Number}
     * @default 0.005
     * @memberof SegmentEngine
     * @instance
     */
    _this.attackAbs = optOrDef(options.attackAbs, 0.005);

    /**
     * Attack time relative to segment duration
     * @name attackRel
     * @type {Number}
     * @default 0
     * @memberof SegmentEngine
     * @instance
     */
    _this.attackRel = optOrDef(options.attackRel, 0);

    /**
     * Absolute release time in sec
     * @name releaseAbs
     * @type {Number}
     * @default 0.005
     * @memberof SegmentEngine
     * @instance
     */
    _this.releaseAbs = optOrDef(options.releaseAbs, 0.005);

    /**
     * Release time relative to segment duration
     * @name releaseRel
     * @type {Number}
     * @default 0
     * @memberof SegmentEngine
     * @instance
     */
    _this.releaseRel = optOrDef(options.releaseRel, 0);

    /**
     * Segment resampling in cent
     * @name resampling
     * @type {Number}
     * @default 0
     * @memberof SegmentEngine
     * @instance
     */
    _this.resampling = optOrDef(options.resampling, 0);

    /**
     * Amout of random resampling variation in cent
     * @name resamplingVar
     * @type {Number}
     * @default 0
     * @memberof SegmentEngine
     * @instance
     */
    _this.resamplingVar = optOrDef(options.resamplingVar, 0);

    /**
     * Linear gain factor
     * @name gain
     * @type {Number}
     * @default 1
     * @memberof SegmentEngine
     * @instance
     */
    _this.gain = optOrDef(options.gain, 1);

    /**
     * Index of the segment to synthesize (i.e. of this.positionArray/durationArray/offsetArray)
     * @name segmentIndex
     * @type {Number}
     * @default 0
     * @memberof SegmentEngine
     * @instance
     */
    _this.segmentIndex = optOrDef(options.segmentIndex, 0);

    /**
     * Whether the audio buffer and segment indices are considered as cyclic
     * @name cyclic
     * @type {Bool}
     * @default false
     * @memberof SegmentEngine
     * @instance
     */
    _this.cyclic = optOrDef(options.cyclic, false);
    _this.__cyclicOffset = 0;

    /**
     * Whether the last segment is aborted when triggering the next
     * @name monophonic
     * @type {Number}
     * @default false
     * @memberof SegmentEngine
     * @instance
     */
    _this.monophonic = optOrDef(options.monophonic, false);
    _this.__currentSrc = null;
    _this.__currentEnv = null;
    _this.__releaseStartTime = 0;
    _this.__currentGain = 0;
    _this.__currentEndTime = 0;

    /**
     * Fade-out time (when aborted)
     * @name abortTime
     * @type {Number}
     * @default 0.005
     * @memberof SegmentEngine
     * @instance
     */
    _this.abortTime = optOrDef(options.abortTime, 0.005);

    /**
     * Portion at the end of the audio buffer that has been copied from the beginning to assure cyclic behavior
     * @name wrapAroundExtension
     * @type {Number}
     * @default 0
     * @memberof SegmentEngine
     * @instance
     */
    _this.wrapAroundExtension = optOrDef(options.wrapAroundExtension, 0);

    _this.outputNode = _this.audioContext.createGain();
    return _this;
  }

  /**
   * Get buffer duration (excluding wrapAroundExtension)
   *
   * @type {Number}
   * @default 0
   * @memberof SegmentEngine
   * @instance
   */


  (0, _createClass3.default)(SegmentEngine, [{
    key: 'advanceTime',


    // TimeEngine method (transported interface)
    value: function advanceTime(time) {
      time = Math.max(time, this.audioContext.currentTime);
      return time + this.trigger(time);
    }

    // TimeEngine method (transported interface)

  }, {
    key: 'syncPosition',
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

          if (!this.cyclic) return Infinity;
        }
      } else if (speed < 0) {
        index = getCurrentOrPreviousIndex(this.positionArray, position);

        if (index < 0) {
          index = this.positionArray.length - 1;
          cyclicOffset -= bufferDuration;

          if (!this.cyclic) return -Infinity;
        }
      } else {
        return Infinity;
      }

      this.segmentIndex = index;
      this.__cyclicOffset = cyclicOffset;

      return cyclicOffset + this.positionArray[index];
    }

    // TimeEngine method (transported interface)

  }, {
    key: 'advancePosition',
    value: function advancePosition(time, position, speed) {
      var index = this.segmentIndex;
      var cyclicOffset = this.__cyclicOffset;

      this.trigger(time);

      if (speed > 0) {
        index++;

        if (index >= this.positionArray.length) {
          index = 0;
          cyclicOffset += this.bufferDuration;

          if (!this.cyclic) return Infinity;
        }
      } else {
        index--;

        if (index < 0) {
          index = this.positionArray.length - 1;
          cyclicOffset -= this.bufferDuration;

          if (!this.cyclic) return -Infinity;
        }
      }

      this.segmentIndex = index;
      this.__cyclicOffset = cyclicOffset;

      return cyclicOffset + this.positionArray[index];
    }

    /**
     * Trigger a segment.
     * This function can be called at any time (whether the engine is scheduled/transported or not)
     * to generate a single segment according to the current segment parameters.
     *
     * @param {Number} time segment synthesis audio time
     * @return {Number} period to next segment
     */

  }, {
    key: 'trigger',
    value: function trigger(time) {
      var audioContext = this.audioContext;
      var segmentTime = (time || audioContext.currentTime) + this.delay;
      var segmentPeriod = this.periodAbs;
      var segmentIndex = this.segmentIndex;

      if (this.buffer) {
        var segmentPosition = 0.0;
        var segmentDuration = 0.0;
        var segmentOffset = 0.0;
        var resamplingRate = 1.0;
        var bufferDuration = this.bufferDuration;

        if (this.cyclic) segmentIndex = segmentIndex % this.positionArray.length;else segmentIndex = Math.max(0, Math.min(segmentIndex, this.positionArray.length - 1));

        if (this.positionArray) segmentPosition = this.positionArray[segmentIndex] || 0;

        if (this.durationArray) segmentDuration = this.durationArray[segmentIndex] || 0;

        if (this.offsetArray) segmentOffset = this.offsetArray[segmentIndex] || 0;

        // calculate resampling
        if (this.resampling !== 0 || this.resamplingVar > 0) {
          var randomResampling = (Math.random() - 0.5) * 2.0 * this.resamplingVar;
          resamplingRate = Math.pow(2.0, (this.resampling + randomResampling) / 1200.0);
        }

        // calculate inter-segment distance
        if (segmentDuration === 0 || this.periodRel > 0) {
          var nextSegmentIndex = segmentIndex + 1;
          var nextPosition, nextOffset;

          if (nextSegmentIndex === this.positionArray.length) {
            if (this.cyclic) {
              nextPosition = this.positionArray[0] + bufferDuration;
              nextOffset = this.offsetArray[0];
            } else {
              nextPosition = bufferDuration;
              nextOffset = 0;
            }
          } else {
            nextPosition = this.positionArray[nextSegmentIndex];
            nextOffset = this.offsetArray[nextSegmentIndex];
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
        if (this.positionVar > 0) segmentPosition += 2.0 * (Math.random() - 0.5) * this.positionVar;

        // shorten duration of segments over the edges of the buffer
        if (segmentPosition < 0) {
          //segmentTime -= grainPosition; hm, not sure if we want to do this
          segmentDuration += segmentPosition;
          segmentPosition = 0;
        }

        if (segmentPosition + segmentDuration > this.buffer.duration) segmentDuration = this.buffer.duration - segmentPosition;

        segmentDuration /= resamplingRate;

        if (this.monophonic) this.abort(segmentTime);

        // make segment
        if (this.gain > 0 && segmentDuration > 0) {
          // make segment envelope
          var envelope = audioContext.createGain();
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

          envelope.gain.value = 0;
          envelope.gain.setValueAtTime(0.0, segmentTime);
          envelope.gain.linearRampToValueAtTime(this.gain, attackEndTime);

          if (releaseStartTime > attackEndTime) envelope.gain.setValueAtTime(this.gain, releaseStartTime);

          envelope.gain.linearRampToValueAtTime(0.0, segmentEndTime);
          envelope.connect(this.outputNode);

          this.__currentEnv = envelope;

          // make source
          var source = audioContext.createBufferSource();

          source.buffer = this.buffer;
          source.playbackRate.value = resamplingRate;
          source.connect(envelope);

          source.start(segmentTime, segmentPosition);
          source.stop(segmentTime + segmentDuration);

          this.__currentSrc = source;
          this.__releaseStartTime = releaseStartTime;
          this.__currentGain = this.gain;
          this.__currentEndTime = segmentEndTime;
        }
      }

      // grain period randon variation
      if (this.periodVar > 0.0) segmentPeriod += 2.0 * (Math.random() - 0.5) * this.periodVar * grainPeriod;

      return Math.max(this.periodMin, segmentPeriod);
    }
  }, {
    key: 'abort',
    value: function abort(time) {
      var audioContext = this.audioContext;
      var endTime = this.__currentEndTime;
      var abortTime = time || audioContext.currentTime;

      if (abortTime < endTime) {
        var segmentEndTime = Math.min(abortTime + this.abortTime, endTime);
        var envelope = this.__currentEnv;
        var currentGainValue = this.__currentGain;

        if (abortTime > this.__releaseStartTime) {
          var releaseStart = this.__releaseStartTime;
          currentGainValue *= (abortTime - releaseStart) / (endTime - releaseStart);
        }

        envelope.gain.cancelScheduledValues(abortTime);
        envelope.gain.setValueAtTime(currentGainValue, abortTime);
        envelope.gain.linearRampToValueAtTime(0, segmentEndTime);

        this.__currentSrc = null;
        this.__currentEnv = null;
        this.__releaseStartTime = 0;
        this.__currentGain = 0;
        this.__currentEndTime = 0;
      }
    }
  }, {
    key: 'bufferDuration',
    get: function get() {
      if (this.buffer) {
        var bufferDuration = this.buffer.duration;

        if (this.wrapAroundExtension) bufferDuration -= this.wrapAroundExtension;

        return bufferDuration;
      }

      return 0;
    }
  }]);
  return SegmentEngine;
}(_audioTimeEngine2.default);

exports.default = SegmentEngine;

},{"../core/audio-time-engine":2,"babel-runtime/core-js/object/get-prototype-of":20,"babel-runtime/helpers/classCallCheck":26,"babel-runtime/helpers/createClass":27,"babel-runtime/helpers/inherits":29,"babel-runtime/helpers/possibleConstructorReturn":30}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _audioContext = require('./core/audio-context');

Object.defineProperty(exports, 'audioContext', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_audioContext).default;
  }
});

var _timeEngine = require('./core/time-engine');

Object.defineProperty(exports, 'TimeEngine', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_timeEngine).default;
  }
});

var _audioTimeEngine = require('./core/audio-time-engine');

Object.defineProperty(exports, 'AudioTimeEngine', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_audioTimeEngine).default;
  }
});

var _priorityQueue = require('./core/priority-queue');

Object.defineProperty(exports, 'PriorityQueue', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_priorityQueue).default;
  }
});

var _schedulingQueue = require('./core/scheduling-queue');

Object.defineProperty(exports, 'SchedulingQueue', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_schedulingQueue).default;
  }
});

var _granularEngine = require('./engines/granular-engine');

Object.defineProperty(exports, 'GranularEngine', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_granularEngine).default;
  }
});

var _metronome = require('./engines/metronome');

Object.defineProperty(exports, 'Metronome', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_metronome).default;
  }
});

var _playerEngine = require('./engines/player-engine');

Object.defineProperty(exports, 'PlayerEngine', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_playerEngine).default;
  }
});

var _segmentEngine = require('./engines/segment-engine');

Object.defineProperty(exports, 'SegmentEngine', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_segmentEngine).default;
  }
});

var _playControl = require('./masters/play-control');

Object.defineProperty(exports, 'PlayControl', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_playControl).default;
  }
});

var _transport = require('./masters/transport');

Object.defineProperty(exports, 'Transport', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_transport).default;
  }
});

var _scheduler = require('./masters/scheduler');

Object.defineProperty(exports, 'Scheduler', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_scheduler).default;
  }
});

var _simpleScheduler = require('./masters/simple-scheduler');

Object.defineProperty(exports, 'SimpleScheduler', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_simpleScheduler).default;
  }
});

var _factories = require('./masters/factories');

Object.defineProperty(exports, 'getScheduler', {
  enumerable: true,
  get: function get() {
    return _factories.getScheduler;
  }
});
Object.defineProperty(exports, 'getSimpleScheduler', {
  enumerable: true,
  get: function get() {
    return _factories.getSimpleScheduler;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

},{"./core/audio-context":1,"./core/audio-time-engine":2,"./core/priority-queue":3,"./core/scheduling-queue":4,"./core/time-engine":5,"./engines/granular-engine":6,"./engines/metronome":7,"./engines/player-engine":8,"./engines/segment-engine":9,"./masters/factories":11,"./masters/play-control":12,"./masters/scheduler":13,"./masters/simple-scheduler":14,"./masters/transport":15}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSimpleScheduler = exports.getScheduler = undefined;

var _weakMap = require('babel-runtime/core-js/weak-map');

var _weakMap2 = _interopRequireDefault(_weakMap);

var _audioContext = require('../core/audio-context');

var _audioContext2 = _interopRequireDefault(_audioContext);

var _scheduler = require('./scheduler');

var _scheduler2 = _interopRequireDefault(_scheduler);

var _simpleScheduler = require('./simple-scheduler');

var _simpleScheduler2 = _interopRequireDefault(_simpleScheduler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var schedulerMap = new _weakMap2.default(); // schedulers should be singletons

var simpleSchedulerMap = new _weakMap2.default();

/**
 * Returns a unique instance of `Scheduler`
 *
 * @global
 * @function
 * @returns {Scheduler}
 * @see Scheduler
 */
var getScheduler = exports.getScheduler = function getScheduler() {
  var audioContext = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _audioContext2.default;

  var scheduler = schedulerMap.get(audioContext);

  if (!scheduler) {
    scheduler = new _scheduler2.default({ audioContext: audioContext });
    schedulerMap.set(audioContext, scheduler);
  }

  return scheduler;
};

/**
 * Returns a unique instance of `SimpleScheduler`
 *
 * @global
 * @function
 * @returns {SimpleScheduler}
 * @see SimpleScheduler
 */
var getSimpleScheduler = exports.getSimpleScheduler = function getSimpleScheduler() {
  var audioContext = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _audioContext2.default;

  var simpleScheduler = simpleSchedulerMap.get(audioContext);

  if (!simpleScheduler) {
    simpleScheduler = new _simpleScheduler2.default({ audioContext: audioContext });
    simpleSchedulerMap.set(audioContext, simpleScheduler);
  }

  return simpleScheduler;
};

},{"../core/audio-context":1,"./scheduler":13,"./simple-scheduler":14,"babel-runtime/core-js/weak-map":25}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _audioContext = require('../core/audio-context');

var _audioContext2 = _interopRequireDefault(_audioContext);

var _schedulingQueue = require('../core/scheduling-queue');

var _schedulingQueue2 = _interopRequireDefault(_schedulingQueue);

var _timeEngine = require('../core/time-engine');

var _timeEngine2 = _interopRequireDefault(_timeEngine);

var _factories = require('./factories');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EPSILON = 1e-8;

var LoopControl = function (_TimeEngine) {
  (0, _inherits3.default)(LoopControl, _TimeEngine);

  function LoopControl(playControl) {
    (0, _classCallCheck3.default)(this, LoopControl);

    var _this = (0, _possibleConstructorReturn3.default)(this, (LoopControl.__proto__ || (0, _getPrototypeOf2.default)(LoopControl)).call(this));

    _this.__playControl = playControl;
    _this.speed = 1;
    _this.lower = -Infinity;
    _this.upper = Infinity;
    return _this;
  }

  // TimeEngine method (scheduled interface)


  (0, _createClass3.default)(LoopControl, [{
    key: 'advanceTime',
    value: function advanceTime(time) {
      var playControl = this.__playControl;
      var speed = this.speed;
      var lower = this.lower;
      var upper = this.upper;

      if (speed > 0) time += EPSILON;else time -= EPSILON;

      if (speed > 0) {
        playControl.syncSpeed(time, lower, speed, true);
        return playControl.__getTimeAtPosition(upper) - EPSILON;
      } else if (speed < 0) {
        playControl.syncSpeed(time, upper, speed, true);
        return playControl.__getTimeAtPosition(lower) + EPSILON;
      }

      return Infinity;
    }
  }, {
    key: 'reschedule',
    value: function reschedule(speed) {
      var playControl = this.__playControl;
      var lower = Math.min(playControl.__loopStart, playControl.__loopEnd);
      var upper = Math.max(playControl.__loopStart, playControl.__loopEnd);

      this.speed = speed;
      this.lower = lower;
      this.upper = upper;

      if (lower === upper) speed = 0;

      if (speed > 0) this.resetTime(playControl.__getTimeAtPosition(upper) - EPSILON);else if (speed < 0) this.resetTime(playControl.__getTimeAtPosition(lower) + EPSILON);else this.resetTime(Infinity);
    }
  }, {
    key: 'applyLoopBoundaries',
    value: function applyLoopBoundaries(position, speed) {
      var lower = this.lower;
      var upper = this.upper;

      if (speed > 0 && position >= upper) return lower + (position - lower) % (upper - lower);else if (speed < 0 && position < lower) return upper - (upper - position) % (upper - lower);

      return position;
    }
  }]);
  return LoopControl;
}(_timeEngine2.default);

// play controlled base class


var PlayControlled = function () {
  function PlayControlled(playControl, engine) {
    (0, _classCallCheck3.default)(this, PlayControlled);

    this.__playControl = playControl;

    engine.master = this;
    this.__engine = engine;
  }

  (0, _createClass3.default)(PlayControlled, [{
    key: 'syncSpeed',
    value: function syncSpeed(time, position, speed, seek, lastSpeed) {
      this.__engine.syncSpeed(time, position, speed, seek);
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.__playControl = null;

      this.__engine.master = null;
      this.__engine = null;
    }
  }, {
    key: 'currentTime',
    get: function get() {
      return this.__playControl.currentTime;
    }
  }, {
    key: 'currentPosition',
    get: function get() {
      return this.__playControl.currentPosition;
    }
  }]);
  return PlayControlled;
}();

// play control for engines implementing the *speed-controlled* interface


var PlayControlledSpeedControlled = function (_PlayControlled) {
  (0, _inherits3.default)(PlayControlledSpeedControlled, _PlayControlled);

  function PlayControlledSpeedControlled(playControl, engine) {
    (0, _classCallCheck3.default)(this, PlayControlledSpeedControlled);
    return (0, _possibleConstructorReturn3.default)(this, (PlayControlledSpeedControlled.__proto__ || (0, _getPrototypeOf2.default)(PlayControlledSpeedControlled)).call(this, playControl, engine));
  }

  return PlayControlledSpeedControlled;
}(PlayControlled);

// play control for engines implmenting the *transported* interface


var PlayControlledTransported = function (_PlayControlled2) {
  (0, _inherits3.default)(PlayControlledTransported, _PlayControlled2);

  function PlayControlledTransported(playControl, engine) {
    (0, _classCallCheck3.default)(this, PlayControlledTransported);

    var _this3 = (0, _possibleConstructorReturn3.default)(this, (PlayControlledTransported.__proto__ || (0, _getPrototypeOf2.default)(PlayControlledTransported)).call(this, playControl, engine));

    _this3.__schedulerHook = new PlayControlledSchedulerHook(playControl, engine);
    return _this3;
  }

  (0, _createClass3.default)(PlayControlledTransported, [{
    key: 'syncSpeed',
    value: function syncSpeed(time, position, speed, seek, lastSpeed) {
      if (speed !== lastSpeed || seek && speed !== 0) {
        var nextPosition;

        // resync transported engines
        if (seek || speed * lastSpeed < 0) {
          // seek or reverse direction
          nextPosition = this.__engine.syncPosition(time, position, speed);
        } else if (lastSpeed === 0) {
          // start
          nextPosition = this.__engine.syncPosition(time, position, speed);
        } else if (speed === 0) {
          // stop
          nextPosition = Infinity;

          if (this.__engine.syncSpeed) this.__engine.syncSpeed(time, position, 0);
        } else if (this.__engine.syncSpeed) {
          // change speed without reversing direction
          this.__engine.syncSpeed(time, position, speed);
        }

        this.__schedulerHook.resetPosition(nextPosition);
      }
    }
  }, {
    key: 'resetEnginePosition',
    value: function resetEnginePosition(engine) {
      var position = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      if (position === undefined) {
        var playControl = this.__playControl;
        var time = playControl.__sync();

        position = this.__engine.syncPosition(time, playControl.__position, playControl.__speed);
      }

      this.__schedulerHook.resetPosition(position);
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.__schedulerHook.destroy();
      this.__schedulerHook = null;

      (0, _get3.default)(PlayControlledTransported.prototype.__proto__ || (0, _getPrototypeOf2.default)(PlayControlledTransported.prototype), 'destroy', this).call(this);
    }
  }]);
  return PlayControlledTransported;
}(PlayControlled);

// play control for time engines implementing the *scheduled* interface


var PlayControlledScheduled = function (_PlayControlled3) {
  (0, _inherits3.default)(PlayControlledScheduled, _PlayControlled3);

  function PlayControlledScheduled(playControl, engine) {
    (0, _classCallCheck3.default)(this, PlayControlledScheduled);

    // scheduling queue becomes master of engine
    var _this4 = (0, _possibleConstructorReturn3.default)(this, (PlayControlledScheduled.__proto__ || (0, _getPrototypeOf2.default)(PlayControlledScheduled)).call(this, playControl, engine));

    engine.master = null;
    _this4.__schedulingQueue = new PlayControlledSchedulingQueue(playControl, engine);
    return _this4;
  }

  (0, _createClass3.default)(PlayControlledScheduled, [{
    key: 'syncSpeed',
    value: function syncSpeed(time, position, speed, seek, lastSpeed) {
      if (lastSpeed === 0 && speed !== 0) // start or seek
        this.__engine.resetTime();else if (lastSpeed !== 0 && speed === 0) // stop
        this.__engine.resetTime(Infinity);
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.__schedulingQueue.destroy();
      (0, _get3.default)(PlayControlledScheduled.prototype.__proto__ || (0, _getPrototypeOf2.default)(PlayControlledScheduled.prototype), 'destroy', this).call(this);
    }
  }]);
  return PlayControlledScheduled;
}(PlayControlled);

// translates transported engine advancePosition into global scheduler times


var PlayControlledSchedulerHook = function (_TimeEngine2) {
  (0, _inherits3.default)(PlayControlledSchedulerHook, _TimeEngine2);

  function PlayControlledSchedulerHook(playControl, engine) {
    (0, _classCallCheck3.default)(this, PlayControlledSchedulerHook);

    var _this5 = (0, _possibleConstructorReturn3.default)(this, (PlayControlledSchedulerHook.__proto__ || (0, _getPrototypeOf2.default)(PlayControlledSchedulerHook)).call(this));

    _this5.__playControl = playControl;
    _this5.__engine = engine;

    _this5.__nextPosition = Infinity;
    playControl.__scheduler.add(_this5, Infinity);
    return _this5;
  }

  (0, _createClass3.default)(PlayControlledSchedulerHook, [{
    key: 'advanceTime',
    value: function advanceTime(time) {
      var playControl = this.__playControl;
      var engine = this.__engine;
      var position = this.__nextPosition;
      var nextPosition = engine.advancePosition(time, position, playControl.__speed);
      var nextTime = playControl.__getTimeAtPosition(nextPosition);

      this.__nextPosition = nextPosition;
      return nextTime;
    }
  }, {
    key: 'resetPosition',
    value: function resetPosition() {
      var position = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.__nextPosition;

      var time = this.__playControl.__getTimeAtPosition(position);
      this.__nextPosition = position;
      this.resetTime(time);
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.__playControl.__scheduler.remove(this);
      this.__playControl = null;
      this.__engine = null;
    }
  }, {
    key: 'currentTime',
    get: function get() {
      return this.__playControl.currentTime;
    }
  }, {
    key: 'currentPosition',
    get: function get() {
      return this.__playControl.currentPosition;
    }
  }]);
  return PlayControlledSchedulerHook;
}(_timeEngine2.default);

// internal scheduling queue that returns the current position (and time) of the play control


var PlayControlledSchedulingQueue = function (_SchedulingQueue) {
  (0, _inherits3.default)(PlayControlledSchedulingQueue, _SchedulingQueue);

  function PlayControlledSchedulingQueue(playControl, engine) {
    (0, _classCallCheck3.default)(this, PlayControlledSchedulingQueue);

    var _this6 = (0, _possibleConstructorReturn3.default)(this, (PlayControlledSchedulingQueue.__proto__ || (0, _getPrototypeOf2.default)(PlayControlledSchedulingQueue)).call(this));

    _this6.__playControl = playControl;
    _this6.__engine = engine;

    _this6.add(engine, Infinity);
    playControl.__scheduler.add(_this6, Infinity);
    return _this6;
  }

  (0, _createClass3.default)(PlayControlledSchedulingQueue, [{
    key: 'destroy',
    value: function destroy() {
      this.__playControl.__scheduler.remove(this);
      this.remove(this.__engine);

      this.__playControl = null;
      this.__engine = null;
    }
  }, {
    key: 'currentTime',
    get: function get() {
      return this.__playControl.currentTime;
    }
  }, {
    key: 'currentPosition',
    get: function get() {
      return this.__playControl.currentPosition;
    }
  }]);
  return PlayControlledSchedulingQueue;
}(_schedulingQueue2.default);

/**
 * Extends Time Engine to provide playback control of a Time Engine instance.
 *
 * [example]{@link https://rawgit.com/wavesjs/waves-audio/master/examples/play-control.html}
 *
 * @extends TimeEngine
 * @param {TimeEngine} engine - engine to control
 *
 * @example
 * import * as audio from 'waves-audio';
 * const playerEngine = audio.PlayerEngine();
 * const playControl = new audio.PlayControl(playerEngine);
 *
 * playControl.start();
 */


var PlayControl = function (_TimeEngine3) {
  (0, _inherits3.default)(PlayControl, _TimeEngine3);

  function PlayControl(engine) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck3.default)(this, PlayControl);

    var _this7 = (0, _possibleConstructorReturn3.default)(this, (PlayControl.__proto__ || (0, _getPrototypeOf2.default)(PlayControl)).call(this));

    _this7.audioContext = options.audioContext || _audioContext2.default;
    _this7.__scheduler = (0, _factories.getScheduler)(_this7.audioContext);

    _this7.__playControlled = null;

    _this7.__loopControl = null;
    _this7.__loopStart = 0;
    _this7.__loopEnd = 1;

    // synchronized tie, position, and speed
    _this7.__time = 0;
    _this7.__position = 0;
    _this7.__speed = 0;

    // non-zero "user" speed
    _this7.__playingSpeed = 1;

    if (engine) _this7.__setEngine(engine);
    return _this7;
  }

  (0, _createClass3.default)(PlayControl, [{
    key: '__setEngine',
    value: function __setEngine(engine) {
      if (engine.master) throw new Error("object has already been added to a master");

      if (_timeEngine2.default.implementsSpeedControlled(engine)) this.__playControlled = new PlayControlledSpeedControlled(this, engine);else if (_timeEngine2.default.implementsTransported(engine)) this.__playControlled = new PlayControlledTransported(this, engine);else if (_timeEngine2.default.implementsScheduled(engine)) this.__playControlled = new PlayControlledScheduled(this, engine);else throw new Error("object cannot be added to play control");
    }
  }, {
    key: '__resetEngine',
    value: function __resetEngine() {
      this.__playControlled.destroy();
      this.__playControlled = null;
    }

    /**
     * Calculate/extrapolate playing time for given position
     *
     * @param {Number} position position
     * @return {Number} extrapolated time
     * @private
     */

  }, {
    key: '__getTimeAtPosition',
    value: function __getTimeAtPosition(position) {
      return this.__time + (position - this.__position) / this.__speed;
    }

    /**
     * Calculate/extrapolate playing position for given time
     *
     * @param {Number} time time
     * @return {Number} extrapolated position
     * @private
     */

  }, {
    key: '__getPositionAtTime',
    value: function __getPositionAtTime(time) {
      return this.__position + (time - this.__time) * this.__speed;
    }
  }, {
    key: '__sync',
    value: function __sync() {
      var now = this.currentTime;
      this.__position += (now - this.__time) * this.__speed;
      this.__time = now;
      return now;
    }

    /**
     * Get current master time.
     * This function will be replaced when the play-control is added to a master.
     *
     * @name currentTime
     * @type {Number}
     * @memberof PlayControl
     * @instance
     * @readonly
     */

  }, {
    key: 'set',
    value: function set() {
      var engine = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      var time = this.__sync();
      var speed = this.__speed;

      if (this.__playControlled !== null && this.__playControlled.__engine !== engine) {

        this.syncSpeed(time, this.__position, 0);

        if (this.__playControlled) this.__resetEngine();

        if (this.__playControlled === null && engine !== null) {
          this.__setEngine(engine);

          if (speed !== 0) this.syncSpeed(time, this.__position, speed);
        }
      }
    }

    /**
     * Sets the play control loop behavior.
     *
     * @type {Boolean}
     * @name loop
     * @memberof PlayControl
     * @instance
     */

  }, {
    key: 'setLoopBoundaries',


    /**
     * Sets loop start and end time.
     *
     * @param {Number} loopStart - loop start value.
     * @param {Number} loopEnd - loop end value.
     */
    value: function setLoopBoundaries(loopStart, loopEnd) {
      this.__loopStart = loopStart;
      this.__loopEnd = loopEnd;

      this.loop = this.loop;
    }

    /**
     * Sets loop start value
     *
     * @type {Number}
     * @name loopStart
     * @memberof PlayControl
     * @instance
     */

  }, {
    key: 'syncSpeed',


    // TimeEngine method (speed-controlled interface)
    value: function syncSpeed(time, position, speed) {
      var seek = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      var lastSpeed = this.__speed;

      if (speed !== lastSpeed || seek) {
        if ((seek || lastSpeed === 0) && this.__loopControl) position = this.__loopControl.applyLoopBoundaries(position, speed);

        this.__time = time;
        this.__position = position;
        this.__speed = speed;

        if (this.__playControlled) this.__playControlled.syncSpeed(time, position, speed, seek, lastSpeed);

        if (this.__loopControl) this.__loopControl.reschedule(speed);
      }
    }

    /**
     * Starts playback
     */

  }, {
    key: 'start',
    value: function start() {
      var time = this.__sync();
      this.syncSpeed(time, this.__position, this.__playingSpeed);
    }

    /**
     * Pauses playback and stays at the same position.
     */

  }, {
    key: 'pause',
    value: function pause() {
      var time = this.__sync();
      this.syncSpeed(time, this.__position, 0);
    }

    /**
     * Stops playback and seeks to initial (0) position.
     */

  }, {
    key: 'stop',
    value: function stop() {
      var time = this.__sync();
      this.syncSpeed(time, 0, 0, true);
    }

    /**
     * If speed if provided, sets the playback speed. The speed value should
     * be non-zero between -16 and -1/16 or between 1/16 and 16.
     *
     * @type {Number}
     * @name speed
     * @memberof PlayControl
     * @instance
     */

  }, {
    key: 'seek',


    /**
     * Set (jump to) playing position.
     *
     * @param {Number} position target position
     */
    value: function seek(position) {
      var time = this.__sync();
      this.__position = position;
      this.syncSpeed(time, position, this.__speed, true);
    }
  }, {
    key: 'currentTime',
    get: function get() {
      return this.__scheduler.currentTime;
    }

    /**
     * Get current master position.
     * This function will be replaced when the play-control is added to a master.
     *
     * @name currentPosition
     * @type {Number}
     * @memberof PlayControl
     * @instance
     * @readonly
     */

  }, {
    key: 'currentPosition',
    get: function get() {
      return this.__position + (this.__scheduler.currentTime - this.__time) * this.__speed;
    }

    /**
     * Returns if the play control is runnin g.
     *
     * @name running
     * @type {Boolean}
     * @memberof PlayControl
     * @instance
     * @readonly
     */

  }, {
    key: 'running',
    get: function get() {
      return !(this.__speed === 0);
    }
  }, {
    key: 'loop',
    set: function set(enable) {
      if (enable && this.__loopStart > -Infinity && this.__loopEnd < Infinity) {
        if (!this.__loopControl) {
          this.__loopControl = new LoopControl(this);
          this.__scheduler.add(this.__loopControl, Infinity);
        }

        if (this.__speed !== 0) {
          var position = this.currentPosition;
          var lower = Math.min(this.__loopStart, this.__loopEnd);
          var upper = Math.max(this.__loopStart, this.__loopEnd);

          if (this.__speed > 0 && position > upper) this.seek(upper);else if (this.__speed < 0 && position < lower) this.seek(lower);else this.__loopControl.reschedule(this.__speed);
        }
      } else if (this.__loopControl) {
        this.__scheduler.remove(this.__loopControl);
        this.__loopControl = null;
      }
    },
    get: function get() {
      return !!this.__loopControl;
    }
  }, {
    key: 'loopStart',
    set: function set(loopStart) {
      this.setLoopBoundaries(loopStart, this.__loopEnd);
    },
    get: function get() {
      return this.__loopStart;
    }

    /**
     * Sets loop end value
     *
     * @type {Number}
     * @name loopEnd
     * @memberof PlayControl
     * @instance
     */

  }, {
    key: 'loopEnd',
    set: function set(loopEnd) {
      this.setLoopBoundaries(this.__loopStart, loopEnd);
    },
    get: function get() {
      return this.__loopEnd;
    }
  }, {
    key: 'speed',
    set: function set(speed) {
      var time = this.__sync();

      if (speed >= 0) {
        if (speed < 0.01) speed = 0.01;else if (speed > 100) speed = 100;
      } else {
        if (speed < -100) speed = -100;else if (speed > -0.01) speed = -0.01;
      }

      this.__playingSpeed = speed;

      if (!this.master && this.__speed !== 0) this.syncSpeed(time, this.__position, speed);
    },
    get: function get() {
      return this.__playingSpeed;
    }
  }]);
  return PlayControl;
}(_timeEngine2.default);

exports.default = PlayControl;

},{"../core/audio-context":1,"../core/scheduling-queue":4,"../core/time-engine":5,"./factories":11,"babel-runtime/core-js/object/get-prototype-of":20,"babel-runtime/helpers/classCallCheck":26,"babel-runtime/helpers/createClass":27,"babel-runtime/helpers/get":28,"babel-runtime/helpers/inherits":29,"babel-runtime/helpers/possibleConstructorReturn":30}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _audioContext = require('../core/audio-context');

var _audioContext2 = _interopRequireDefault(_audioContext);

var _schedulingQueue = require('../core/scheduling-queue');

var _schedulingQueue2 = _interopRequireDefault(_schedulingQueue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)('wavesjs:audio');

/**
 * The `Scheduler` class implements a master for `TimeEngine` or `AudioTimeEngine`
 * instances that implement the *scheduled* interface such as the `Metronome`
 * `GranularEngine`.
 *
 * A `Scheduler` can also schedule simple callback functions.
 * The class is based on recursive calls to `setTimeOut` and uses the
 * `audioContext.currentTime` as logical passed to the `advanceTime` methods
 * of the scheduled engines or to the scheduled callback functions.
 * It extends the `SchedulingQueue` class that itself includes a `PriorityQueue`
 * to assure the order of the scheduled engines (see `SimpleScheduler` for a
 * simplified scheduler implementation without `PriorityQueue`).
 *
 * To get a unique instance of `Scheduler` as the global scheduler of an
 * application, the `getScheduler` factory function should be used. The
 * function accepts an audio context as optional argument and uses the Waves
 * default audio context (see `audioContext`) as
 * default. The factory creates a single scheduler for each audio context.
 *
 * Example that shows three Metronome engines running in a Scheduler:
 * {@link https://rawgit.com/wavesjs/waves-audio/master/examples/scheduler.html}
 *
 * @param {Object} [options={}] - default options
 * @param {Number} [options.period=0.025] - period of the scheduler.
 * @param {Number} [options.lookahead=0.1] - lookahead of the scheduler.
 *
 * @see TimeEngine
 * @see AudioTimeEngine
 * @see getScheduler
 * @see SimpleScheduler
 *
 * @example
 * import * as audio from 'waves-audio';
 * const scheduler = audio.getScheduler();
 *
 * scheduler.add(myEngine);
 */

var Scheduler = function (_SchedulingQueue) {
  (0, _inherits3.default)(Scheduler, _SchedulingQueue);

  function Scheduler() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, Scheduler);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Scheduler.__proto__ || (0, _getPrototypeOf2.default)(Scheduler)).call(this));

    _this.audioContext = options.audioContext || _audioContext2.default;

    _this.__currentTime = null;
    _this.__nextTime = Infinity;
    _this.__timeout = null;

    /**
     * scheduler (setTimeout) period
     * @type {Number}
     * @name period
     * @memberof Scheduler
     * @instance
     */
    _this.period = options.period || 0.025;

    /**
     * scheduler lookahead time (> period)
     * @type {Number}
     * @name lookahead
     * @memberof Scheduler
     * @instance
     */
    _this.lookahead = options.lookahead || 0.1;
    return _this;
  }

  // setTimeout scheduling loop


  (0, _createClass3.default)(Scheduler, [{
    key: '__tick',
    value: function __tick() {
      var audioContext = this.audioContext;
      var currentTime = audioContext.currentTime;
      var time = this.__nextTime;

      this.__timeout = null;

      while (time <= currentTime + this.lookahead) {
        this.__currentTime = time;
        time = this.advanceTime(time);
      }

      this.__currentTime = null;
      this.resetTime(time);
    }
  }, {
    key: 'resetTime',
    value: function resetTime() {
      var _this2 = this;

      var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.currentTime;

      if (this.master) {
        this.master.reset(this, time);
      } else {
        if (this.__timeout) {
          clearTimeout(this.__timeout);
          this.__timeout = null;
        }

        if (time !== Infinity) {
          if (this.__nextTime === Infinity) log('Scheduler Start');

          var timeOutDelay = Math.max(time - this.lookahead - this.audioContext.currentTime, this.period);

          this.__timeout = setTimeout(function () {
            _this2.__tick();
          }, Math.ceil(timeOutDelay * 1000));
        } else if (this.__nextTime !== Infinity) {
          log('Scheduler Stop');
        }

        this.__nextTime = time;
      }
    }

    /**
     * Scheduler current logical time.
     *
     * @name currentTime
     * @type {Number}
     * @memberof Scheduler
     * @instance
     */

  }, {
    key: 'currentTime',
    get: function get() {
      if (this.master) return this.master.currentTime;

      return this.__currentTime || this.audioContext.currentTime + this.lookahead;
    }
  }, {
    key: 'currentPosition',
    get: function get() {
      var master = this.master;

      if (master && master.currentPosition !== undefined) return master.currentPosition;

      return undefined;
    }

    // inherited from scheduling queue
    /**
     * Add a TimeEngine or a simple callback function to the scheduler at an
     * optionally given time. Whether the add method is called with a TimeEngine
     * or a callback function it returns a TimeEngine that can be used as argument
     * of the methods remove and resetEngineTime. A TimeEngine added to a scheduler
     * has to implement the scheduled interface. The callback function added to a
     * scheduler will be called at the given time and with the given time as
     * argument. The callback can return a new scheduling time (i.e. the next
     * time when it will be called) or it can return Infinity to suspend scheduling
     * without removing the function from the scheduler. A function that does
     * not return a value (or returns null or 0) is removed from the scheduler
     * and cannot be used as argument of the methods remove and resetEngineTime
     * anymore.
     *
     * @name add
     * @function
     * @memberof Scheduler
     * @instance
     * @param {TimeEngine|Function} engine - Engine to add to the scheduler
     * @param {Number} [time=this.currentTime] - Schedule time
     */
    /**
     * Remove a TimeEngine from the scheduler that has been added to the
     * scheduler using the add method.
     *
     * @name add
     * @function
     * @memberof Scheduler
     * @instance
     * @param {TimeEngine} engine - Engine to remove from the scheduler
     * @param {Number} [time=this.currentTime] - Schedule time
     */
    /**
     * Reschedule a scheduled time engine at a given time.
     *
     * @name resetEngineTime
     * @function
     * @memberof Scheduler
     * @instance
     * @param {TimeEngine} engine - Engine to reschedule
     * @param {Number} time - Schedule time
     */
    /**
     * Remove all scheduled callbacks and engines from the scheduler.
     *
     * @name clear
     * @function
     * @memberof Scheduler
     * @instance
     */

  }]);
  return Scheduler;
}(_schedulingQueue2.default);

exports.default = Scheduler;

},{"../core/audio-context":1,"../core/scheduling-queue":4,"babel-runtime/core-js/object/get-prototype-of":20,"babel-runtime/helpers/classCallCheck":26,"babel-runtime/helpers/createClass":27,"babel-runtime/helpers/inherits":29,"babel-runtime/helpers/possibleConstructorReturn":30,"debug":139}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _audioContext = require('../core/audio-context');

var _audioContext2 = _interopRequireDefault(_audioContext);

var _timeEngine = require('../core/time-engine');

var _timeEngine2 = _interopRequireDefault(_timeEngine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)('wavesjs:audio');

/**
 *
 *
 *
 * The SimpleScheduler class implements a simplified master for time engines
 * (see TimeEngine or AudioTimeEngine) that implement the scheduled interface
 * such as the Metronome and the GranularEngine. The API and funtionalities of
 * the SimpleScheduler class are identical to the Scheduler class. But, other
 * than the Scheduler, the SimpleScheduler class does not guarantee the order
 * of events (i.e. calls to the advanceTime method of scheduled time engines
 * and to scheduled callback functions) within a scheduling period (see period
 * attribute).
 *
 * To get a unique instance of SimpleScheduler as the global scheduler of an
 * application, the getSimpleScheduler factory function should be used. The
 * function accepts an audio context as optional argument and uses the Waves
 * default audio context (see Audio Context) as default. The factory creates
 * a single (simple) scheduler for each audio context.
 *
 * Example that shows three Metronome engines running in a SimpleScheduler:
 * {@link https://rawgit.com/wavesjs/waves-audio/master/examples/simple-scheduler.html}
 *
 * @param {Object} [options={}] - default options
 * @param {Number} [options.period=0.025] - period of the scheduler.
 * @param {Number} [options.lookahead=0.1] - lookahead of the scheduler.
 *
 * @see TimeEngine
 * @see AudioTimeEngine
 * @see getSimpleScheduler
 * @see Scheduler
 *
 * @example
 * import * as audio from 'waves-audio';
 * const scheduler = audio.getSimpleScheduler();
 *
 * scheduler.add(myEngine);
 */

var SimpleScheduler = function () {
  function SimpleScheduler() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, SimpleScheduler);

    this.audioContext = options.audioContext || _audioContext2.default;

    this.__engines = new _set2.default();

    this.__schedEngines = [];
    this.__schedTimes = [];

    this.__currentTime = null;
    this.__timeout = null;

    /**
     * scheduler (setTimeout) period
     * @type {Number}
     * @name period
     * @memberof Scheduler
     * @instance
     */
    this.period = options.period || 0.025;

    /**
     * scheduler lookahead time (> period)
     * @type {Number}
     * @name lookahead
     * @memberof Scheduler
     * @instance
     */
    this.lookahead = options.lookahead || 0.1;
  }

  (0, _createClass3.default)(SimpleScheduler, [{
    key: '__scheduleEngine',
    value: function __scheduleEngine(engine, time) {
      this.__schedEngines.push(engine);
      this.__schedTimes.push(time);
    }
  }, {
    key: '__rescheduleEngine',
    value: function __rescheduleEngine(engine, time) {
      var index = this.__schedEngines.indexOf(engine);

      if (index >= 0) {
        if (time !== Infinity) {
          this.__schedTimes[index] = time;
        } else {
          this.__schedEngines.splice(index, 1);
          this.__schedTimes.splice(index, 1);
        }
      } else if (time < Infinity) {
        this.__schedEngines.push(engine);
        this.__schedTimes.push(time);
      }
    }
  }, {
    key: '__unscheduleEngine',
    value: function __unscheduleEngine(engine) {
      var index = this.__schedEngines.indexOf(engine);

      if (index >= 0) {
        this.__schedEngines.splice(index, 1);
        this.__schedTimes.splice(index, 1);
      }
    }
  }, {
    key: '__resetTick',
    value: function __resetTick() {
      if (this.__schedEngines.length > 0) {
        if (!this.__timeout) {
          log('SimpleScheduler Start');
          this.__tick();
        }
      } else if (this.__timeout) {
        log('SimpleScheduler Stop');
        clearTimeout(this.__timeout);
        this.__timeout = null;
      }
    }
  }, {
    key: '__tick',
    value: function __tick() {
      var _this = this;

      var audioContext = this.audioContext;
      var currentTime = audioContext.currentTime;
      var i = 0;

      while (i < this.__schedEngines.length) {
        var engine = this.__schedEngines[i];
        var time = this.__schedTimes[i];

        while (time && time <= currentTime + this.lookahead) {
          time = Math.max(time, currentTime);
          this.__currentTime = time;
          time = engine.advanceTime(time);
        }

        if (time && time < Infinity) {
          this.__schedTimes[i++] = time;
        } else {
          this.__unscheduleEngine(engine);

          // remove engine from scheduler
          if (!time) {
            engine.master = null;
            this.__engines.delete(engine);
          }
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

    /**
     * Scheduler current logical time.
     *
     * @name currentTime
     * @type {Number}
     * @memberof Scheduler
     * @instance
     */

  }, {
    key: 'defer',


    // call a function at a given time
    /**
     * Defer the execution of a function at a given time.
     *
     * @param {Function} fun - Function to defer
     * @param {Number} [time=this.currentTime] - Schedule time
     */
    value: function defer(fun) {
      var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.currentTime;

      if (!(fun instanceof Function)) throw new Error("object cannot be defered by scheduler");

      this.add({
        advanceTime: function advanceTime(time) {
          fun(time);
        } // make sur that the advanceTime method does not returm anything
      }, time);
    }

    /**
     * Add a TimeEngine function to the scheduler at an optionally given time.
     *
     * @param {TimeEngine} engine - Engine to add to the scheduler
     * @param {Number} [time=this.currentTime] - Schedule time
     */

  }, {
    key: 'add',
    value: function add(engine) {
      var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.currentTime;

      if (!_timeEngine2.default.implementsScheduled(engine)) throw new Error("object cannot be added to scheduler");

      if (engine.master) throw new Error("object has already been added to a master");

      // set master and add to array
      engine.master = this;
      this.__engines.add(engine);

      // schedule engine
      this.__scheduleEngine(engine, time);
      this.__resetTick();
    }

    /**
     * Remove a TimeEngine from the scheduler that has been added to the
     * scheduler using the add method.
     *
     * @param {TimeEngine} engine - Engine to remove from the scheduler
     * @param {Number} [time=this.currentTime] - Schedule time
     */

  }, {
    key: 'remove',
    value: function remove(engine) {
      if (!engine.master || engine.master !== this) throw new Error("engine has not been added to this scheduler");

      // reset master and remove from array
      engine.master = null;
      this.__engines.delete(engine);

      // unschedule engine
      this.__unscheduleEngine(engine);
      this.__resetTick();
    }

    /**
     * Reschedule a scheduled time engine at a given time.
     *
     * @param {TimeEngine} engine - Engine to reschedule
     * @param {Number} time - Schedule time
     */

  }, {
    key: 'resetEngineTime',
    value: function resetEngineTime(engine) {
      var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.currentTime;

      this.__rescheduleEngine(engine, time);
      this.__resetTick();
    }

    /**
     * Check whether a given engine is scheduled.
     *
     * @param {TimeEngine} engine - Engine to check
     */

  }, {
    key: 'has',
    value: function has(engine) {
      return this.__engines.has(engine);
    }

    /**
     * Remove all engines from the scheduler.
     */

  }, {
    key: 'clear',
    value: function clear() {
      if (this.__timeout) {
        clearTimeout(this.__timeout);
        this.__timeout = null;
      }

      this.__schedEngines.length = 0;
      this.__schedTimes.length = 0;
    }
  }, {
    key: 'currentTime',
    get: function get() {
      return this.__currentTime || this.audioContext.currentTime + this.lookahead;
    }
  }, {
    key: 'currentPosition',
    get: function get() {
      return undefined;
    }
  }]);
  return SimpleScheduler;
}();

exports.default = SimpleScheduler;

},{"../core/audio-context":1,"../core/time-engine":5,"babel-runtime/core-js/set":22,"babel-runtime/helpers/classCallCheck":26,"babel-runtime/helpers/createClass":27,"debug":139}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _audioContext = require('../core/audio-context');

var _audioContext2 = _interopRequireDefault(_audioContext);

var _priorityQueue = require('../core/priority-queue');

var _priorityQueue2 = _interopRequireDefault(_priorityQueue);

var _schedulingQueue = require('../core/scheduling-queue');

var _schedulingQueue2 = _interopRequireDefault(_schedulingQueue);

var _timeEngine = require('../core/time-engine');

var _timeEngine2 = _interopRequireDefault(_timeEngine);

var _factories = require('./factories');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addDuplet(firstArray, secondArray, firstElement, secondElement) {
  firstArray.push(firstElement);
  secondArray.push(secondElement);
}

function removeDuplet(firstArray, secondArray, firstElement) {
  var index = firstArray.indexOf(firstElement);

  if (index >= 0) {
    var secondElement = secondArray[index];

    firstArray.splice(index, 1);
    secondArray.splice(index, 1);

    return secondElement;
  }

  return null;
}

// The Transported call is the base class of the adapters between
// different types of engines (i.e. transported, scheduled, play-controlled)
// The adapters are at the same time masters for the engines added to the transport
// and transported TimeEngines inserted into the transport's position-based pritority queue.

var Transported = function (_TimeEngine) {
  (0, _inherits3.default)(Transported, _TimeEngine);

  function Transported(transport, engine, start, duration, offset) {
    var stretch = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
    (0, _classCallCheck3.default)(this, Transported);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Transported.__proto__ || (0, _getPrototypeOf2.default)(Transported)).call(this));

    _this.master = transport;

    _this.__engine = engine;
    engine.master = _this;

    _this.__startPosition = start;
    _this.__endPosition = !isFinite(duration) ? Infinity : start + duration;
    _this.__offsetPosition = start + offset;
    _this.__stretchPosition = stretch;
    _this.__isRunning = false;
    return _this;
  }

  (0, _createClass3.default)(Transported, [{
    key: 'setBoundaries',
    value: function setBoundaries(start, duration) {
      var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var stretch = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;

      this.__startPosition = start;
      this.__endPosition = start + duration;
      this.__offsetPosition = start + offset;
      this.__stretchPosition = stretch;
      this.resetPosition();
    }
  }, {
    key: 'start',
    value: function start(time, position, speed) {}
  }, {
    key: 'stop',
    value: function stop(time, position) {}
  }, {
    key: 'resetPosition',
    value: function resetPosition(position) {
      if (position !== undefined) position += this.__offsetPosition;

      this.master.resetEnginePosition(this, position);
    }
  }, {
    key: 'syncPosition',
    value: function syncPosition(time, position, speed) {
      if (speed > 0) {
        if (position < this.__startPosition) {

          if (this.__isRunning) this.stop(time, position - this.__offsetPosition);

          this.__isRunning = false;
          return this.__startPosition;
        } else if (position < this.__endPosition) {
          this.start(time, position - this.__offsetPosition, speed);

          this.__isRunning = true;
          return this.__endPosition;
        }
      } else {
        if (position > this.__endPosition) {
          if (this.__isRunning) // if engine is running
            this.stop(time, position - this.__offsetPosition);

          this.__isRunning = false;
          return this.__endPosition;
        } else if (position > this.__startPosition) {
          this.start(time, position - this.__offsetPosition, speed);

          this.__isRunning = true;
          return this.__startPosition;
        }
      }

      if (this.__isRunning) // if engine is running
        this.stop(time, position);

      this.__isRunning = false;
      return Infinity * speed;
    }
  }, {
    key: 'advancePosition',
    value: function advancePosition(time, position, speed) {
      if (!this.__isRunning) {
        this.start(time, position - this.__offsetPosition, speed);
        this.__isRunning = true;

        if (speed > 0) return this.__endPosition;

        return this.__startPosition;
      }

      // stop engine
      this.stop(time, position - this.__offsetPosition);

      this.__isRunning = false;
      return Infinity * speed;
    }
  }, {
    key: 'syncSpeed',
    value: function syncSpeed(time, position, speed) {
      if (speed === 0) // stop
        this.stop(time, position - this.__offsetPosition);
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.master = null;

      this.__engine.master = null;
      this.__engine = null;
    }
  }, {
    key: 'currentTime',
    get: function get() {
      return this.master.currentTime;
    }
  }, {
    key: 'currentPosition',
    get: function get() {
      return this.master.currentPosition - this.__offsetPosition;
    }
  }]);
  return Transported;
}(_timeEngine2.default);

// TransportedTransported
// has to switch on and off the scheduled engines when the transport hits the engine's start and end position


var TransportedTransported = function (_Transported) {
  (0, _inherits3.default)(TransportedTransported, _Transported);

  function TransportedTransported(transport, engine, startPosition, endPosition, offsetPosition) {
    (0, _classCallCheck3.default)(this, TransportedTransported);
    return (0, _possibleConstructorReturn3.default)(this, (TransportedTransported.__proto__ || (0, _getPrototypeOf2.default)(TransportedTransported)).call(this, transport, engine, startPosition, endPosition, offsetPosition));
  }

  (0, _createClass3.default)(TransportedTransported, [{
    key: 'syncPosition',
    value: function syncPosition(time, position, speed) {
      if (speed > 0 && position < this.__endPosition) position = Math.max(position, this.__startPosition);else if (speed < 0 && position >= this.__startPosition) position = Math.min(position, this.__endPosition);

      return this.__offsetPosition + this.__engine.syncPosition(time, position - this.__offsetPosition, speed);
    }
  }, {
    key: 'advancePosition',
    value: function advancePosition(time, position, speed) {
      position = this.__offsetPosition + this.__engine.advancePosition(time, position - this.__offsetPosition, speed);

      if (speed > 0 && position < this.__endPosition || speed < 0 && position >= this.__startPosition) return position;

      return Infinity * speed;
    }
  }, {
    key: 'syncSpeed',
    value: function syncSpeed(time, position, speed) {
      if (this.__engine.syncSpeed) this.__engine.syncSpeed(time, position, speed);
    }
  }, {
    key: 'resetEnginePosition',
    value: function resetEnginePosition(engine) {
      var position = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      if (position !== undefined) position += this.__offsetPosition;

      this.resetPosition(position);
    }
  }]);
  return TransportedTransported;
}(Transported);

// TransportedSpeedControlled
// has to start and stop the speed-controlled engines when the transport hits the engine's start and end position


var TransportedSpeedControlled = function (_Transported2) {
  (0, _inherits3.default)(TransportedSpeedControlled, _Transported2);

  function TransportedSpeedControlled(transport, engine, startPosition, endPosition, offsetPosition) {
    (0, _classCallCheck3.default)(this, TransportedSpeedControlled);
    return (0, _possibleConstructorReturn3.default)(this, (TransportedSpeedControlled.__proto__ || (0, _getPrototypeOf2.default)(TransportedSpeedControlled)).call(this, transport, engine, startPosition, endPosition, offsetPosition));
  }

  (0, _createClass3.default)(TransportedSpeedControlled, [{
    key: 'start',
    value: function start(time, position, speed) {
      this.__engine.syncSpeed(time, position, speed, true);
    }
  }, {
    key: 'stop',
    value: function stop(time, position) {
      this.__engine.syncSpeed(time, position, 0);
    }
  }, {
    key: 'syncSpeed',
    value: function syncSpeed(time, position, speed) {
      if (this.__isRunning) this.__engine.syncSpeed(time, position, speed);
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.__engine.syncSpeed(this.master.currentTime, this.master.currentPosition - this.__offsetPosition, 0);
      (0, _get3.default)(TransportedSpeedControlled.prototype.__proto__ || (0, _getPrototypeOf2.default)(TransportedSpeedControlled.prototype), 'destroy', this).call(this);
    }
  }]);
  return TransportedSpeedControlled;
}(Transported);

// TransportedScheduled
// has to switch on and off the scheduled engines when the transport hits the engine's start and end position


var TransportedScheduled = function (_Transported3) {
  (0, _inherits3.default)(TransportedScheduled, _Transported3);

  function TransportedScheduled(transport, engine, startPosition, endPosition, offsetPosition) {
    (0, _classCallCheck3.default)(this, TransportedScheduled);

    // scheduling queue becomes master of engine
    var _this4 = (0, _possibleConstructorReturn3.default)(this, (TransportedScheduled.__proto__ || (0, _getPrototypeOf2.default)(TransportedScheduled)).call(this, transport, engine, startPosition, endPosition, offsetPosition));

    engine.master = null;
    transport.__schedulingQueue.add(engine, Infinity);
    return _this4;
  }

  (0, _createClass3.default)(TransportedScheduled, [{
    key: 'start',
    value: function start(time, position, speed) {
      this.master.__schedulingQueue.resetEngineTime(this.__engine, time);
    }
  }, {
    key: 'stop',
    value: function stop(time, position) {
      this.master.__schedulingQueue.resetEngineTime(this.__engine, Infinity);
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.master.__schedulingQueue.remove(this.__engine);
      (0, _get3.default)(TransportedScheduled.prototype.__proto__ || (0, _getPrototypeOf2.default)(TransportedScheduled.prototype), 'destroy', this).call(this);
    }
  }]);
  return TransportedScheduled;
}(Transported);

// translates advancePosition of *transported* engines into global scheduler times


var TransportSchedulerHook = function (_TimeEngine2) {
  (0, _inherits3.default)(TransportSchedulerHook, _TimeEngine2);

  function TransportSchedulerHook(transport) {
    (0, _classCallCheck3.default)(this, TransportSchedulerHook);

    var _this5 = (0, _possibleConstructorReturn3.default)(this, (TransportSchedulerHook.__proto__ || (0, _getPrototypeOf2.default)(TransportSchedulerHook)).call(this));

    _this5.__transport = transport;

    _this5.__nextPosition = Infinity;
    _this5.__nextTime = Infinity;
    transport.__scheduler.add(_this5, Infinity);
    return _this5;
  }

  // TimeEngine method (scheduled interface)


  (0, _createClass3.default)(TransportSchedulerHook, [{
    key: 'advanceTime',
    value: function advanceTime(time) {
      var transport = this.__transport;
      var position = this.__nextPosition;
      var speed = transport.__speed;
      var nextPosition = transport.advancePosition(time, position, speed);
      var nextTime = transport.__getTimeAtPosition(nextPosition);

      this.__nextPosition = nextPosition;
      this.__nextTime = nextTime;

      return nextTime;
    }
  }, {
    key: 'resetPosition',
    value: function resetPosition() {
      var position = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.__nextPosition;

      var transport = this.__transport;
      var time = transport.__getTimeAtPosition(position);

      this.__nextPosition = position;
      this.__nextTime = time;

      this.resetTime(time);
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.__transport.__scheduler.remove(this);
      this.__transport = null;
    }
  }]);
  return TransportSchedulerHook;
}(_timeEngine2.default);

// internal scheduling queue that returns the current position (and time) of the play control


var TransportSchedulingQueue = function (_SchedulingQueue) {
  (0, _inherits3.default)(TransportSchedulingQueue, _SchedulingQueue);

  function TransportSchedulingQueue(transport) {
    (0, _classCallCheck3.default)(this, TransportSchedulingQueue);

    var _this6 = (0, _possibleConstructorReturn3.default)(this, (TransportSchedulingQueue.__proto__ || (0, _getPrototypeOf2.default)(TransportSchedulingQueue)).call(this));

    _this6.__transport = transport;
    transport.__scheduler.add(_this6, Infinity);
    return _this6;
  }

  (0, _createClass3.default)(TransportSchedulingQueue, [{
    key: 'destroy',
    value: function destroy() {
      this.__transport.__scheduler.remove(this);
      this.__transport = null;
    }
  }, {
    key: 'currentTime',
    get: function get() {
      return this.__transport.currentTime;
    }
  }, {
    key: 'currentPosition',
    get: function get() {
      return this.__transport.currentPosition;
    }
  }]);
  return TransportSchedulingQueue;
}(_schedulingQueue2.default);

/**
 * Provides synchronized scheduling of Time Engine instances.
 *
 * [example]{@link https://rawgit.com/wavesjs/waves-audio/master/examples/transport.html}
 *
 * @example
 * import * as audio from 'waves-audio';
 * const transport = audio.Transport();
 * const playControl = new audio.PlayControl(transport);
 * const myEngine = new MyEngine();
 * const yourEngine = new yourEngine();
 *
 * transport.add(myEngine);
 * transport.add(yourEngine);
 *
 * playControl.start();
 */


var Transport = function (_TimeEngine3) {
  (0, _inherits3.default)(Transport, _TimeEngine3);

  function Transport() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, Transport);

    var _this7 = (0, _possibleConstructorReturn3.default)(this, (Transport.__proto__ || (0, _getPrototypeOf2.default)(Transport)).call(this));

    _this7.audioContext = options.audioContext || _audioContext2.default;

    _this7.__engines = [];
    _this7.__transported = [];

    _this7.__scheduler = (0, _factories.getScheduler)(_this7.audioContext);
    _this7.__schedulerHook = new TransportSchedulerHook(_this7);
    _this7.__transportedQueue = new _priorityQueue2.default();
    _this7.__schedulingQueue = new TransportSchedulingQueue(_this7);

    // syncronized time, position, and speed
    _this7.__time = 0;
    _this7.__position = 0;
    _this7.__speed = 0;
    return _this7;
  }

  (0, _createClass3.default)(Transport, [{
    key: '__getTimeAtPosition',
    value: function __getTimeAtPosition(position) {
      return this.__time + (position - this.__position) / this.__speed;
    }
  }, {
    key: '__getPositionAtTime',
    value: function __getPositionAtTime(time) {
      return this.__position + (time - this.__time) * this.__speed;
    }
  }, {
    key: '__syncTransportedPosition',
    value: function __syncTransportedPosition(time, position, speed) {
      var numTransportedEngines = this.__transported.length;
      var nextPosition = Infinity * speed;

      if (numTransportedEngines > 0) {
        this.__transportedQueue.clear();
        this.__transportedQueue.reverse = speed < 0;

        for (var i = 0; i < numTransportedEngines; i++) {
          var engine = this.__transported[i];
          var nextEnginePosition = engine.syncPosition(time, position, speed);
          this.__transportedQueue.insert(engine, nextEnginePosition);
        }

        nextPosition = this.__transportedQueue.time;
      }

      return nextPosition;
    }
  }, {
    key: '__syncTransportedSpeed',
    value: function __syncTransportedSpeed(time, position, speed) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(this.__transported), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var transported = _step.value;

          transported.syncSpeed(time, position, speed);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }

    /**
     * Get current master time. This getter will be replaced when the transport
     * is added to a master (i.e. transport or play-control).
     *
     * @type {Number}
     * @name currentTime
     * @memberof Transport
     * @instance
     * @readonly
     */

  }, {
    key: 'resetPosition',


    /**
     * Reset next transport position
     *
     * @param {Number} next - transport position
     */
    value: function resetPosition(position) {
      var master = this.master;

      if (master && master.resetEnginePosition !== undefined) master.resetEnginePosition(this, position);else this.__schedulerHook.resetPosition(position);
    }

    /**
     * Implementation of the transported time engine interface.
     *
     * @param {Number} time
     * @param {Number} position
     * @param {Number} speed
     */

  }, {
    key: 'syncPosition',
    value: function syncPosition(time, position, speed) {
      this.__time = time;
      this.__position = position;
      this.__speed = speed;

      return this.__syncTransportedPosition(time, position, speed);
    }

    /**
     * Implementation of the transported time engine interface.
     *
     * @param {Number} time
     * @param {Number} position
     * @param {Number} speed
     */

  }, {
    key: 'advancePosition',
    value: function advancePosition(time, position, speed) {
      var engine = this.__transportedQueue.head;
      var nextEnginePosition = engine.advancePosition(time, position, speed);
      return this.__transportedQueue.move(engine, nextEnginePosition);
    }

    /**
     * Implementation of the transported time engine interface.
     *
     * @param {Number} time
     * @param {Number} position
     * @param {Number} speed
     * @param {Boolean} [seek=false]
     */

  }, {
    key: 'syncSpeed',
    value: function syncSpeed(time, position, speed) {
      var seek = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      var lastSpeed = this.__speed;

      this.__time = time;
      this.__position = position;
      this.__speed = speed;

      if (speed !== lastSpeed || seek && speed !== 0) {
        var nextPosition = void 0;

        // resync transported engines
        if (seek || speed * lastSpeed < 0) {
          // seek or reverse direction
          nextPosition = this.__syncTransportedPosition(time, position, speed);
        } else if (lastSpeed === 0) {
          // start
          nextPosition = this.__syncTransportedPosition(time, position, speed);
        } else if (speed === 0) {
          // stop
          nextPosition = Infinity;
          this.__syncTransportedSpeed(time, position, 0);
        } else {
          // change speed without reversing direction
          this.__syncTransportedSpeed(time, position, speed);
        }

        this.resetPosition(nextPosition);
      }
    }

    /**
     * Add a time engine to the transport.
     *
     * @param {Object} engine - engine to be added to the transport
     * @param {Number} position - start position
     */

  }, {
    key: 'add',
    value: function add(engine) {
      var startPosition = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var endPosition = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Infinity;
      var offsetPosition = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

      var transported = null;

      if (offsetPosition === -Infinity) offsetPosition = 0;

      if (engine.master) throw new Error("object has already been added to a master");

      if (_timeEngine2.default.implementsTransported(engine)) transported = new TransportedTransported(this, engine, startPosition, endPosition, offsetPosition);else if (_timeEngine2.default.implementsSpeedControlled(engine)) transported = new TransportedSpeedControlled(this, engine, startPosition, endPosition, offsetPosition);else if (_timeEngine2.default.implementsScheduled(engine)) transported = new TransportedScheduled(this, engine, startPosition, endPosition, offsetPosition);else throw new Error("object cannot be added to a transport");

      if (transported) {
        var speed = this.__speed;

        addDuplet(this.__engines, this.__transported, engine, transported);

        if (speed !== 0) {
          // sync and start
          var nextEnginePosition = transported.syncPosition(this.currentTime, this.currentPosition, speed);
          var nextPosition = this.__transportedQueue.insert(transported, nextEnginePosition);

          this.resetPosition(nextPosition);
        }
      }

      return transported;
    }

    /**
     * Remove a time engine from the transport.
     *
     * @param {object} engineOrTransported - engine or transported to be removed from the transport
     */

  }, {
    key: 'remove',
    value: function remove(engineOrTransported) {
      var engine = engineOrTransported;
      var transported = removeDuplet(this.__engines, this.__transported, engineOrTransported);

      if (!transported) {
        engine = removeDuplet(this.__transported, this.__engines, engineOrTransported);
        transported = engineOrTransported;
      }

      if (engine && transported) {
        var nextPosition = this.__transportedQueue.remove(transported);

        transported.destroy();

        if (this.__speed !== 0) this.resetPosition(nextPosition);
      } else {
        throw new Error("object has not been added to this transport");
      }
    }

    /**
     * Reset position of the given engine.
     *
     * @param {TimeEngine} transported - Engine to reset
     * @param {Number} position - New position
     */

  }, {
    key: 'resetEnginePosition',
    value: function resetEnginePosition(transported) {
      var position = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      var speed = this.__speed;

      if (speed !== 0) {
        if (position === undefined) position = transported.syncPosition(this.currentTime, this.currentPosition, speed);

        var nextPosition = this.__transportedQueue.move(transported, position);
        this.resetPosition(nextPosition);
      }
    }

    /**
     * Remove all time engines from the transport.
     */

  }, {
    key: 'clear',
    value: function clear() {
      this.syncSpeed(this.currentTime, this.currentPosition, 0);

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = (0, _getIterator3.default)(this.__transported), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var transported = _step2.value;

          transported.destroy();
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: 'currentTime',
    get: function get() {
      return this.__scheduler.currentTime;
    }

    /**
     * Get current master position. This getter will be replaced when the transport
     * is added to a master (i.e. transport or play-control).
     *
     * @type {Number}
     * @name currentPosition
     * @memberof Transport
     * @instance
     * @readonly
     */

  }, {
    key: 'currentPosition',
    get: function get() {
      var master = this.master;

      if (master && master.currentPosition !== undefined) return master.currentPosition;

      return this.__position + (this.__scheduler.currentTime - this.__time) * this.__speed;
    }
  }]);
  return Transport;
}(_timeEngine2.default);

exports.default = Transport;

},{"../core/audio-context":1,"../core/priority-queue":3,"../core/scheduling-queue":4,"../core/time-engine":5,"./factories":11,"babel-runtime/core-js/get-iterator":16,"babel-runtime/core-js/object/get-prototype-of":20,"babel-runtime/helpers/classCallCheck":26,"babel-runtime/helpers/createClass":27,"babel-runtime/helpers/get":28,"babel-runtime/helpers/inherits":29,"babel-runtime/helpers/possibleConstructorReturn":30}],16:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/get-iterator"), __esModule: true };
},{"core-js/library/fn/get-iterator":32}],17:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/create"), __esModule: true };
},{"core-js/library/fn/object/create":33}],18:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/define-property"), __esModule: true };
},{"core-js/library/fn/object/define-property":34}],19:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/get-own-property-descriptor"), __esModule: true };
},{"core-js/library/fn/object/get-own-property-descriptor":35}],20:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/get-prototype-of"), __esModule: true };
},{"core-js/library/fn/object/get-prototype-of":36}],21:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/set-prototype-of"), __esModule: true };
},{"core-js/library/fn/object/set-prototype-of":37}],22:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/set"), __esModule: true };
},{"core-js/library/fn/set":38}],23:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/symbol"), __esModule: true };
},{"core-js/library/fn/symbol":39}],24:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/symbol/iterator"), __esModule: true };
},{"core-js/library/fn/symbol/iterator":40}],25:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/weak-map"), __esModule: true };
},{"core-js/library/fn/weak-map":41}],26:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports.default = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};
},{}],27:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _defineProperty = require("../core-js/object/define-property");

var _defineProperty2 = _interopRequireDefault(_defineProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      (0, _defineProperty2.default)(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();
},{"../core-js/object/define-property":18}],28:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _getPrototypeOf = require("../core-js/object/get-prototype-of");

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _getOwnPropertyDescriptor = require("../core-js/object/get-own-property-descriptor");

var _getOwnPropertyDescriptor2 = _interopRequireDefault(_getOwnPropertyDescriptor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = (0, _getOwnPropertyDescriptor2.default)(object, property);

  if (desc === undefined) {
    var parent = (0, _getPrototypeOf2.default)(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};
},{"../core-js/object/get-own-property-descriptor":19,"../core-js/object/get-prototype-of":20}],29:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _setPrototypeOf = require("../core-js/object/set-prototype-of");

var _setPrototypeOf2 = _interopRequireDefault(_setPrototypeOf);

var _create = require("../core-js/object/create");

var _create2 = _interopRequireDefault(_create);

var _typeof2 = require("../helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : (0, _typeof3.default)(superClass)));
  }

  subClass.prototype = (0, _create2.default)(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf2.default ? (0, _setPrototypeOf2.default)(subClass, superClass) : subClass.__proto__ = superClass;
};
},{"../core-js/object/create":17,"../core-js/object/set-prototype-of":21,"../helpers/typeof":31}],30:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _typeof2 = require("../helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && ((typeof call === "undefined" ? "undefined" : (0, _typeof3.default)(call)) === "object" || typeof call === "function") ? call : self;
};
},{"../helpers/typeof":31}],31:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _iterator = require("../core-js/symbol/iterator");

var _iterator2 = _interopRequireDefault(_iterator);

var _symbol = require("../core-js/symbol");

var _symbol2 = _interopRequireDefault(_symbol);

var _typeof = typeof _symbol2.default === "function" && typeof _iterator2.default === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? "symbol" : typeof obj; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = typeof _symbol2.default === "function" && _typeof(_iterator2.default) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof(obj);
} : function (obj) {
  return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof(obj);
};
},{"../core-js/symbol":23,"../core-js/symbol/iterator":24}],32:[function(require,module,exports){
require('../modules/web.dom.iterable');
require('../modules/es6.string.iterator');
module.exports = require('../modules/core.get-iterator');

},{"../modules/core.get-iterator":119,"../modules/es6.string.iterator":128,"../modules/web.dom.iterable":138}],33:[function(require,module,exports){
require('../../modules/es6.object.create');
var $Object = require('../../modules/_core').Object;
module.exports = function create(P, D) {
  return $Object.create(P, D);
};

},{"../../modules/_core":57,"../../modules/es6.object.create":121}],34:[function(require,module,exports){
require('../../modules/es6.object.define-property');
var $Object = require('../../modules/_core').Object;
module.exports = function defineProperty(it, key, desc) {
  return $Object.defineProperty(it, key, desc);
};

},{"../../modules/_core":57,"../../modules/es6.object.define-property":122}],35:[function(require,module,exports){
require('../../modules/es6.object.get-own-property-descriptor');
var $Object = require('../../modules/_core').Object;
module.exports = function getOwnPropertyDescriptor(it, key) {
  return $Object.getOwnPropertyDescriptor(it, key);
};

},{"../../modules/_core":57,"../../modules/es6.object.get-own-property-descriptor":123}],36:[function(require,module,exports){
require('../../modules/es6.object.get-prototype-of');
module.exports = require('../../modules/_core').Object.getPrototypeOf;

},{"../../modules/_core":57,"../../modules/es6.object.get-prototype-of":124}],37:[function(require,module,exports){
require('../../modules/es6.object.set-prototype-of');
module.exports = require('../../modules/_core').Object.setPrototypeOf;

},{"../../modules/_core":57,"../../modules/es6.object.set-prototype-of":125}],38:[function(require,module,exports){
require('../modules/es6.object.to-string');
require('../modules/es6.string.iterator');
require('../modules/web.dom.iterable');
require('../modules/es6.set');
require('../modules/es7.set.to-json');
require('../modules/es7.set.of');
require('../modules/es7.set.from');
module.exports = require('../modules/_core').Set;

},{"../modules/_core":57,"../modules/es6.object.to-string":126,"../modules/es6.set":127,"../modules/es6.string.iterator":128,"../modules/es7.set.from":131,"../modules/es7.set.of":132,"../modules/es7.set.to-json":133,"../modules/web.dom.iterable":138}],39:[function(require,module,exports){
require('../../modules/es6.symbol');
require('../../modules/es6.object.to-string');
require('../../modules/es7.symbol.async-iterator');
require('../../modules/es7.symbol.observable');
module.exports = require('../../modules/_core').Symbol;

},{"../../modules/_core":57,"../../modules/es6.object.to-string":126,"../../modules/es6.symbol":129,"../../modules/es7.symbol.async-iterator":134,"../../modules/es7.symbol.observable":135}],40:[function(require,module,exports){
require('../../modules/es6.string.iterator');
require('../../modules/web.dom.iterable');
module.exports = require('../../modules/_wks-ext').f('iterator');

},{"../../modules/_wks-ext":116,"../../modules/es6.string.iterator":128,"../../modules/web.dom.iterable":138}],41:[function(require,module,exports){
require('../modules/es6.object.to-string');
require('../modules/web.dom.iterable');
require('../modules/es6.weak-map');
require('../modules/es7.weak-map.of');
require('../modules/es7.weak-map.from');
module.exports = require('../modules/_core').WeakMap;

},{"../modules/_core":57,"../modules/es6.object.to-string":126,"../modules/es6.weak-map":130,"../modules/es7.weak-map.from":136,"../modules/es7.weak-map.of":137,"../modules/web.dom.iterable":138}],42:[function(require,module,exports){
module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};

},{}],43:[function(require,module,exports){
module.exports = function () { /* empty */ };

},{}],44:[function(require,module,exports){
module.exports = function (it, Constructor, name, forbiddenField) {
  if (!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)) {
    throw TypeError(name + ': incorrect invocation!');
  } return it;
};

},{}],45:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};

},{"./_is-object":75}],46:[function(require,module,exports){
var forOf = require('./_for-of');

module.exports = function (iter, ITERATOR) {
  var result = [];
  forOf(iter, false, result.push, result, ITERATOR);
  return result;
};

},{"./_for-of":66}],47:[function(require,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = require('./_to-iobject');
var toLength = require('./_to-length');
var toAbsoluteIndex = require('./_to-absolute-index');
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

},{"./_to-absolute-index":107,"./_to-iobject":109,"./_to-length":110}],48:[function(require,module,exports){
// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx = require('./_ctx');
var IObject = require('./_iobject');
var toObject = require('./_to-object');
var toLength = require('./_to-length');
var asc = require('./_array-species-create');
module.exports = function (TYPE, $create) {
  var IS_MAP = TYPE == 1;
  var IS_FILTER = TYPE == 2;
  var IS_SOME = TYPE == 3;
  var IS_EVERY = TYPE == 4;
  var IS_FIND_INDEX = TYPE == 6;
  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
  var create = $create || asc;
  return function ($this, callbackfn, that) {
    var O = toObject($this);
    var self = IObject(O);
    var f = ctx(callbackfn, that, 3);
    var length = toLength(self.length);
    var index = 0;
    var result = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
    var val, res;
    for (;length > index; index++) if (NO_HOLES || index in self) {
      val = self[index];
      res = f(val, index, O);
      if (TYPE) {
        if (IS_MAP) result[index] = res;   // map
        else if (res) switch (TYPE) {
          case 3: return true;             // some
          case 5: return val;              // find
          case 6: return index;            // findIndex
          case 2: result.push(val);        // filter
        } else if (IS_EVERY) return false; // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
  };
};

},{"./_array-species-create":50,"./_ctx":58,"./_iobject":72,"./_to-length":110,"./_to-object":111}],49:[function(require,module,exports){
var isObject = require('./_is-object');
var isArray = require('./_is-array');
var SPECIES = require('./_wks')('species');

module.exports = function (original) {
  var C;
  if (isArray(original)) {
    C = original.constructor;
    // cross-realm fallback
    if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
    if (isObject(C)) {
      C = C[SPECIES];
      if (C === null) C = undefined;
    }
  } return C === undefined ? Array : C;
};

},{"./_is-array":74,"./_is-object":75,"./_wks":117}],50:[function(require,module,exports){
// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var speciesConstructor = require('./_array-species-constructor');

module.exports = function (original, length) {
  return new (speciesConstructor(original))(length);
};

},{"./_array-species-constructor":49}],51:[function(require,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = require('./_cof');
var TAG = require('./_wks')('toStringTag');
// ES3 wrong here
var ARG = cof(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (e) { /* empty */ }
};

module.exports = function (it) {
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};

},{"./_cof":52,"./_wks":117}],52:[function(require,module,exports){
var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

},{}],53:[function(require,module,exports){
'use strict';
var dP = require('./_object-dp').f;
var create = require('./_object-create');
var redefineAll = require('./_redefine-all');
var ctx = require('./_ctx');
var anInstance = require('./_an-instance');
var forOf = require('./_for-of');
var $iterDefine = require('./_iter-define');
var step = require('./_iter-step');
var setSpecies = require('./_set-species');
var DESCRIPTORS = require('./_descriptors');
var fastKey = require('./_meta').fastKey;
var validate = require('./_validate-collection');
var SIZE = DESCRIPTORS ? '_s' : 'size';

var getEntry = function (that, key) {
  // fast case
  var index = fastKey(key);
  var entry;
  if (index !== 'F') return that._i[index];
  // frozen object case
  for (entry = that._f; entry; entry = entry.n) {
    if (entry.k == key) return entry;
  }
};

module.exports = {
  getConstructor: function (wrapper, NAME, IS_MAP, ADDER) {
    var C = wrapper(function (that, iterable) {
      anInstance(that, C, NAME, '_i');
      that._t = NAME;         // collection type
      that._i = create(null); // index
      that._f = undefined;    // first entry
      that._l = undefined;    // last entry
      that[SIZE] = 0;         // size
      if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear() {
        for (var that = validate(this, NAME), data = that._i, entry = that._f; entry; entry = entry.n) {
          entry.r = true;
          if (entry.p) entry.p = entry.p.n = undefined;
          delete data[entry.i];
        }
        that._f = that._l = undefined;
        that[SIZE] = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function (key) {
        var that = validate(this, NAME);
        var entry = getEntry(that, key);
        if (entry) {
          var next = entry.n;
          var prev = entry.p;
          delete that._i[entry.i];
          entry.r = true;
          if (prev) prev.n = next;
          if (next) next.p = prev;
          if (that._f == entry) that._f = next;
          if (that._l == entry) that._l = prev;
          that[SIZE]--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /* , that = undefined */) {
        validate(this, NAME);
        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3);
        var entry;
        while (entry = entry ? entry.n : this._f) {
          f(entry.v, entry.k, this);
          // revert to the last existing entry
          while (entry && entry.r) entry = entry.p;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key) {
        return !!getEntry(validate(this, NAME), key);
      }
    });
    if (DESCRIPTORS) dP(C.prototype, 'size', {
      get: function () {
        return validate(this, NAME)[SIZE];
      }
    });
    return C;
  },
  def: function (that, key, value) {
    var entry = getEntry(that, key);
    var prev, index;
    // change existing entry
    if (entry) {
      entry.v = value;
    // create new entry
    } else {
      that._l = entry = {
        i: index = fastKey(key, true), // <- index
        k: key,                        // <- key
        v: value,                      // <- value
        p: prev = that._l,             // <- previous entry
        n: undefined,                  // <- next entry
        r: false                       // <- removed
      };
      if (!that._f) that._f = entry;
      if (prev) prev.n = entry;
      that[SIZE]++;
      // add to index
      if (index !== 'F') that._i[index] = entry;
    } return that;
  },
  getEntry: getEntry,
  setStrong: function (C, NAME, IS_MAP) {
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    $iterDefine(C, NAME, function (iterated, kind) {
      this._t = validate(iterated, NAME); // target
      this._k = kind;                     // kind
      this._l = undefined;                // previous
    }, function () {
      var that = this;
      var kind = that._k;
      var entry = that._l;
      // revert to the last existing entry
      while (entry && entry.r) entry = entry.p;
      // get next entry
      if (!that._t || !(that._l = entry = entry ? entry.n : that._t._f)) {
        // or finish the iteration
        that._t = undefined;
        return step(1);
      }
      // return step by kind
      if (kind == 'keys') return step(0, entry.k);
      if (kind == 'values') return step(0, entry.v);
      return step(0, [entry.k, entry.v]);
    }, IS_MAP ? 'entries' : 'values', !IS_MAP, true);

    // add [@@species], 23.1.2.2, 23.2.2.2
    setSpecies(NAME);
  }
};

},{"./_an-instance":44,"./_ctx":58,"./_descriptors":60,"./_for-of":66,"./_iter-define":78,"./_iter-step":79,"./_meta":82,"./_object-create":84,"./_object-dp":85,"./_redefine-all":97,"./_set-species":102,"./_validate-collection":114}],54:[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var classof = require('./_classof');
var from = require('./_array-from-iterable');
module.exports = function (NAME) {
  return function toJSON() {
    if (classof(this) != NAME) throw TypeError(NAME + "#toJSON isn't generic");
    return from(this);
  };
};

},{"./_array-from-iterable":46,"./_classof":51}],55:[function(require,module,exports){
'use strict';
var redefineAll = require('./_redefine-all');
var getWeak = require('./_meta').getWeak;
var anObject = require('./_an-object');
var isObject = require('./_is-object');
var anInstance = require('./_an-instance');
var forOf = require('./_for-of');
var createArrayMethod = require('./_array-methods');
var $has = require('./_has');
var validate = require('./_validate-collection');
var arrayFind = createArrayMethod(5);
var arrayFindIndex = createArrayMethod(6);
var id = 0;

// fallback for uncaught frozen keys
var uncaughtFrozenStore = function (that) {
  return that._l || (that._l = new UncaughtFrozenStore());
};
var UncaughtFrozenStore = function () {
  this.a = [];
};
var findUncaughtFrozen = function (store, key) {
  return arrayFind(store.a, function (it) {
    return it[0] === key;
  });
};
UncaughtFrozenStore.prototype = {
  get: function (key) {
    var entry = findUncaughtFrozen(this, key);
    if (entry) return entry[1];
  },
  has: function (key) {
    return !!findUncaughtFrozen(this, key);
  },
  set: function (key, value) {
    var entry = findUncaughtFrozen(this, key);
    if (entry) entry[1] = value;
    else this.a.push([key, value]);
  },
  'delete': function (key) {
    var index = arrayFindIndex(this.a, function (it) {
      return it[0] === key;
    });
    if (~index) this.a.splice(index, 1);
    return !!~index;
  }
};

module.exports = {
  getConstructor: function (wrapper, NAME, IS_MAP, ADDER) {
    var C = wrapper(function (that, iterable) {
      anInstance(that, C, NAME, '_i');
      that._t = NAME;      // collection type
      that._i = id++;      // collection id
      that._l = undefined; // leak store for uncaught frozen objects
      if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.3.3.2 WeakMap.prototype.delete(key)
      // 23.4.3.3 WeakSet.prototype.delete(value)
      'delete': function (key) {
        if (!isObject(key)) return false;
        var data = getWeak(key);
        if (data === true) return uncaughtFrozenStore(validate(this, NAME))['delete'](key);
        return data && $has(data, this._i) && delete data[this._i];
      },
      // 23.3.3.4 WeakMap.prototype.has(key)
      // 23.4.3.4 WeakSet.prototype.has(value)
      has: function has(key) {
        if (!isObject(key)) return false;
        var data = getWeak(key);
        if (data === true) return uncaughtFrozenStore(validate(this, NAME)).has(key);
        return data && $has(data, this._i);
      }
    });
    return C;
  },
  def: function (that, key, value) {
    var data = getWeak(anObject(key), true);
    if (data === true) uncaughtFrozenStore(that).set(key, value);
    else data[that._i] = value;
    return that;
  },
  ufstore: uncaughtFrozenStore
};

},{"./_an-instance":44,"./_an-object":45,"./_array-methods":48,"./_for-of":66,"./_has":68,"./_is-object":75,"./_meta":82,"./_redefine-all":97,"./_validate-collection":114}],56:[function(require,module,exports){
'use strict';
var global = require('./_global');
var $export = require('./_export');
var meta = require('./_meta');
var fails = require('./_fails');
var hide = require('./_hide');
var redefineAll = require('./_redefine-all');
var forOf = require('./_for-of');
var anInstance = require('./_an-instance');
var isObject = require('./_is-object');
var setToStringTag = require('./_set-to-string-tag');
var dP = require('./_object-dp').f;
var each = require('./_array-methods')(0);
var DESCRIPTORS = require('./_descriptors');

module.exports = function (NAME, wrapper, methods, common, IS_MAP, IS_WEAK) {
  var Base = global[NAME];
  var C = Base;
  var ADDER = IS_MAP ? 'set' : 'add';
  var proto = C && C.prototype;
  var O = {};
  if (!DESCRIPTORS || typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function () {
    new C().entries().next();
  }))) {
    // create collection constructor
    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
    redefineAll(C.prototype, methods);
    meta.NEED = true;
  } else {
    C = wrapper(function (target, iterable) {
      anInstance(target, C, NAME, '_c');
      target._c = new Base();
      if (iterable != undefined) forOf(iterable, IS_MAP, target[ADDER], target);
    });
    each('add,clear,delete,forEach,get,has,set,keys,values,entries,toJSON'.split(','), function (KEY) {
      var IS_ADDER = KEY == 'add' || KEY == 'set';
      if (KEY in proto && !(IS_WEAK && KEY == 'clear')) hide(C.prototype, KEY, function (a, b) {
        anInstance(this, C, KEY);
        if (!IS_ADDER && IS_WEAK && !isObject(a)) return KEY == 'get' ? undefined : false;
        var result = this._c[KEY](a === 0 ? 0 : a, b);
        return IS_ADDER ? this : result;
      });
    });
    IS_WEAK || dP(C.prototype, 'size', {
      get: function () {
        return this._c.size;
      }
    });
  }

  setToStringTag(C, NAME);

  O[NAME] = C;
  $export($export.G + $export.W + $export.F, O);

  if (!IS_WEAK) common.setStrong(C, NAME, IS_MAP);

  return C;
};

},{"./_an-instance":44,"./_array-methods":48,"./_descriptors":60,"./_export":64,"./_fails":65,"./_for-of":66,"./_global":67,"./_hide":69,"./_is-object":75,"./_meta":82,"./_object-dp":85,"./_redefine-all":97,"./_set-to-string-tag":103}],57:[function(require,module,exports){
var core = module.exports = { version: '2.5.4' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef

},{}],58:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./_a-function');
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

},{"./_a-function":42}],59:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};

},{}],60:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_fails":65}],61:[function(require,module,exports){
var isObject = require('./_is-object');
var document = require('./_global').document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};

},{"./_global":67,"./_is-object":75}],62:[function(require,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');

},{}],63:[function(require,module,exports){
// all enumerable object keys, includes symbols
var getKeys = require('./_object-keys');
var gOPS = require('./_object-gops');
var pIE = require('./_object-pie');
module.exports = function (it) {
  var result = getKeys(it);
  var getSymbols = gOPS.f;
  if (getSymbols) {
    var symbols = getSymbols(it);
    var isEnum = pIE.f;
    var i = 0;
    var key;
    while (symbols.length > i) if (isEnum.call(it, key = symbols[i++])) result.push(key);
  } return result;
};

},{"./_object-gops":90,"./_object-keys":93,"./_object-pie":94}],64:[function(require,module,exports){
var global = require('./_global');
var core = require('./_core');
var ctx = require('./_ctx');
var hide = require('./_hide');
var has = require('./_has');
var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var IS_WRAP = type & $export.W;
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE];
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE];
  var key, own, out;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if (own && has(exports, key)) continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function (C) {
      var F = function (a, b, c) {
        if (this instanceof C) {
          switch (arguments.length) {
            case 0: return new C();
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if (IS_PROTO) {
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if (type & $export.R && expProto && !expProto[key]) hide(expProto, key, out);
    }
  }
};
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
module.exports = $export;

},{"./_core":57,"./_ctx":58,"./_global":67,"./_has":68,"./_hide":69}],65:[function(require,module,exports){
module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};

},{}],66:[function(require,module,exports){
var ctx = require('./_ctx');
var call = require('./_iter-call');
var isArrayIter = require('./_is-array-iter');
var anObject = require('./_an-object');
var toLength = require('./_to-length');
var getIterFn = require('./core.get-iterator-method');
var BREAK = {};
var RETURN = {};
var exports = module.exports = function (iterable, entries, fn, that, ITERATOR) {
  var iterFn = ITERATOR ? function () { return iterable; } : getIterFn(iterable);
  var f = ctx(fn, that, entries ? 2 : 1);
  var index = 0;
  var length, step, iterator, result;
  if (typeof iterFn != 'function') throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if (isArrayIter(iterFn)) for (length = toLength(iterable.length); length > index; index++) {
    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
    if (result === BREAK || result === RETURN) return result;
  } else for (iterator = iterFn.call(iterable); !(step = iterator.next()).done;) {
    result = call(iterator, f, step.value, entries);
    if (result === BREAK || result === RETURN) return result;
  }
};
exports.BREAK = BREAK;
exports.RETURN = RETURN;

},{"./_an-object":45,"./_ctx":58,"./_is-array-iter":73,"./_iter-call":76,"./_to-length":110,"./core.get-iterator-method":118}],67:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef

},{}],68:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};

},{}],69:[function(require,module,exports){
var dP = require('./_object-dp');
var createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"./_descriptors":60,"./_object-dp":85,"./_property-desc":96}],70:[function(require,module,exports){
var document = require('./_global').document;
module.exports = document && document.documentElement;

},{"./_global":67}],71:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function () {
  return Object.defineProperty(require('./_dom-create')('div'), 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_descriptors":60,"./_dom-create":61,"./_fails":65}],72:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./_cof');
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};

},{"./_cof":52}],73:[function(require,module,exports){
// check on default Array iterator
var Iterators = require('./_iterators');
var ITERATOR = require('./_wks')('iterator');
var ArrayProto = Array.prototype;

module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};

},{"./_iterators":80,"./_wks":117}],74:[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./_cof');
module.exports = Array.isArray || function isArray(arg) {
  return cof(arg) == 'Array';
};

},{"./_cof":52}],75:[function(require,module,exports){
module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

},{}],76:[function(require,module,exports){
// call something on iterator step with safe closing on error
var anObject = require('./_an-object');
module.exports = function (iterator, fn, value, entries) {
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (e) {
    var ret = iterator['return'];
    if (ret !== undefined) anObject(ret.call(iterator));
    throw e;
  }
};

},{"./_an-object":45}],77:[function(require,module,exports){
'use strict';
var create = require('./_object-create');
var descriptor = require('./_property-desc');
var setToStringTag = require('./_set-to-string-tag');
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./_hide')(IteratorPrototype, require('./_wks')('iterator'), function () { return this; });

module.exports = function (Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
  setToStringTag(Constructor, NAME + ' Iterator');
};

},{"./_hide":69,"./_object-create":84,"./_property-desc":96,"./_set-to-string-tag":103,"./_wks":117}],78:[function(require,module,exports){
'use strict';
var LIBRARY = require('./_library');
var $export = require('./_export');
var redefine = require('./_redefine');
var hide = require('./_hide');
var Iterators = require('./_iterators');
var $iterCreate = require('./_iter-create');
var setToStringTag = require('./_set-to-string-tag');
var getPrototypeOf = require('./_object-gpo');
var ITERATOR = require('./_wks')('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  $iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!LIBRARY && typeof IteratorPrototype[ITERATOR] != 'function') hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

},{"./_export":64,"./_hide":69,"./_iter-create":77,"./_iterators":80,"./_library":81,"./_object-gpo":91,"./_redefine":98,"./_set-to-string-tag":103,"./_wks":117}],79:[function(require,module,exports){
module.exports = function (done, value) {
  return { value: value, done: !!done };
};

},{}],80:[function(require,module,exports){
module.exports = {};

},{}],81:[function(require,module,exports){
module.exports = true;

},{}],82:[function(require,module,exports){
var META = require('./_uid')('meta');
var isObject = require('./_is-object');
var has = require('./_has');
var setDesc = require('./_object-dp').f;
var id = 0;
var isExtensible = Object.isExtensible || function () {
  return true;
};
var FREEZE = !require('./_fails')(function () {
  return isExtensible(Object.preventExtensions({}));
});
var setMeta = function (it) {
  setDesc(it, META, { value: {
    i: 'O' + ++id, // object ID
    w: {}          // weak collections IDs
  } });
};
var fastKey = function (it, create) {
  // return primitive with prefix
  if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMeta(it);
  // return object ID
  } return it[META].i;
};
var getWeak = function (it, create) {
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMeta(it);
  // return hash weak collections IDs
  } return it[META].w;
};
// add metadata on freeze-family methods calling
var onFreeze = function (it) {
  if (FREEZE && meta.NEED && isExtensible(it) && !has(it, META)) setMeta(it);
  return it;
};
var meta = module.exports = {
  KEY: META,
  NEED: false,
  fastKey: fastKey,
  getWeak: getWeak,
  onFreeze: onFreeze
};

},{"./_fails":65,"./_has":68,"./_is-object":75,"./_object-dp":85,"./_uid":113}],83:[function(require,module,exports){
'use strict';
// 19.1.2.1 Object.assign(target, source, ...)
var getKeys = require('./_object-keys');
var gOPS = require('./_object-gops');
var pIE = require('./_object-pie');
var toObject = require('./_to-object');
var IObject = require('./_iobject');
var $assign = Object.assign;

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = !$assign || require('./_fails')(function () {
  var A = {};
  var B = {};
  // eslint-disable-next-line no-undef
  var S = Symbol();
  var K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function (k) { B[k] = k; });
  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
}) ? function assign(target, source) { // eslint-disable-line no-unused-vars
  var T = toObject(target);
  var aLen = arguments.length;
  var index = 1;
  var getSymbols = gOPS.f;
  var isEnum = pIE.f;
  while (aLen > index) {
    var S = IObject(arguments[index++]);
    var keys = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S);
    var length = keys.length;
    var j = 0;
    var key;
    while (length > j) if (isEnum.call(S, key = keys[j++])) T[key] = S[key];
  } return T;
} : $assign;

},{"./_fails":65,"./_iobject":72,"./_object-gops":90,"./_object-keys":93,"./_object-pie":94,"./_to-object":111}],84:[function(require,module,exports){
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = require('./_an-object');
var dPs = require('./_object-dps');
var enumBugKeys = require('./_enum-bug-keys');
var IE_PROTO = require('./_shared-key')('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = require('./_dom-create')('iframe');
  var i = enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  require('./_html').appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};

},{"./_an-object":45,"./_dom-create":61,"./_enum-bug-keys":62,"./_html":70,"./_object-dps":86,"./_shared-key":104}],85:[function(require,module,exports){
var anObject = require('./_an-object');
var IE8_DOM_DEFINE = require('./_ie8-dom-define');
var toPrimitive = require('./_to-primitive');
var dP = Object.defineProperty;

exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"./_an-object":45,"./_descriptors":60,"./_ie8-dom-define":71,"./_to-primitive":112}],86:[function(require,module,exports){
var dP = require('./_object-dp');
var anObject = require('./_an-object');
var getKeys = require('./_object-keys');

module.exports = require('./_descriptors') ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = getKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) dP.f(O, P = keys[i++], Properties[P]);
  return O;
};

},{"./_an-object":45,"./_descriptors":60,"./_object-dp":85,"./_object-keys":93}],87:[function(require,module,exports){
var pIE = require('./_object-pie');
var createDesc = require('./_property-desc');
var toIObject = require('./_to-iobject');
var toPrimitive = require('./_to-primitive');
var has = require('./_has');
var IE8_DOM_DEFINE = require('./_ie8-dom-define');
var gOPD = Object.getOwnPropertyDescriptor;

exports.f = require('./_descriptors') ? gOPD : function getOwnPropertyDescriptor(O, P) {
  O = toIObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return gOPD(O, P);
  } catch (e) { /* empty */ }
  if (has(O, P)) return createDesc(!pIE.f.call(O, P), O[P]);
};

},{"./_descriptors":60,"./_has":68,"./_ie8-dom-define":71,"./_object-pie":94,"./_property-desc":96,"./_to-iobject":109,"./_to-primitive":112}],88:[function(require,module,exports){
// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject = require('./_to-iobject');
var gOPN = require('./_object-gopn').f;
var toString = {}.toString;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function (it) {
  try {
    return gOPN(it);
  } catch (e) {
    return windowNames.slice();
  }
};

module.exports.f = function getOwnPropertyNames(it) {
  return windowNames && toString.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(toIObject(it));
};

},{"./_object-gopn":89,"./_to-iobject":109}],89:[function(require,module,exports){
// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
var $keys = require('./_object-keys-internal');
var hiddenKeys = require('./_enum-bug-keys').concat('length', 'prototype');

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return $keys(O, hiddenKeys);
};

},{"./_enum-bug-keys":62,"./_object-keys-internal":92}],90:[function(require,module,exports){
exports.f = Object.getOwnPropertySymbols;

},{}],91:[function(require,module,exports){
// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = require('./_has');
var toObject = require('./_to-object');
var IE_PROTO = require('./_shared-key')('IE_PROTO');
var ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};

},{"./_has":68,"./_shared-key":104,"./_to-object":111}],92:[function(require,module,exports){
var has = require('./_has');
var toIObject = require('./_to-iobject');
var arrayIndexOf = require('./_array-includes')(false);
var IE_PROTO = require('./_shared-key')('IE_PROTO');

module.exports = function (object, names) {
  var O = toIObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};

},{"./_array-includes":47,"./_has":68,"./_shared-key":104,"./_to-iobject":109}],93:[function(require,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = require('./_object-keys-internal');
var enumBugKeys = require('./_enum-bug-keys');

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};

},{"./_enum-bug-keys":62,"./_object-keys-internal":92}],94:[function(require,module,exports){
exports.f = {}.propertyIsEnumerable;

},{}],95:[function(require,module,exports){
// most Object methods by ES6 should accept primitives
var $export = require('./_export');
var core = require('./_core');
var fails = require('./_fails');
module.exports = function (KEY, exec) {
  var fn = (core.Object || {})[KEY] || Object[KEY];
  var exp = {};
  exp[KEY] = exec(fn);
  $export($export.S + $export.F * fails(function () { fn(1); }), 'Object', exp);
};

},{"./_core":57,"./_export":64,"./_fails":65}],96:[function(require,module,exports){
module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],97:[function(require,module,exports){
var hide = require('./_hide');
module.exports = function (target, src, safe) {
  for (var key in src) {
    if (safe && target[key]) target[key] = src[key];
    else hide(target, key, src[key]);
  } return target;
};

},{"./_hide":69}],98:[function(require,module,exports){
module.exports = require('./_hide');

},{"./_hide":69}],99:[function(require,module,exports){
'use strict';
// https://tc39.github.io/proposal-setmap-offrom/
var $export = require('./_export');
var aFunction = require('./_a-function');
var ctx = require('./_ctx');
var forOf = require('./_for-of');

module.exports = function (COLLECTION) {
  $export($export.S, COLLECTION, { from: function from(source /* , mapFn, thisArg */) {
    var mapFn = arguments[1];
    var mapping, A, n, cb;
    aFunction(this);
    mapping = mapFn !== undefined;
    if (mapping) aFunction(mapFn);
    if (source == undefined) return new this();
    A = [];
    if (mapping) {
      n = 0;
      cb = ctx(mapFn, arguments[2], 2);
      forOf(source, false, function (nextItem) {
        A.push(cb(nextItem, n++));
      });
    } else {
      forOf(source, false, A.push, A);
    }
    return new this(A);
  } });
};

},{"./_a-function":42,"./_ctx":58,"./_export":64,"./_for-of":66}],100:[function(require,module,exports){
'use strict';
// https://tc39.github.io/proposal-setmap-offrom/
var $export = require('./_export');

module.exports = function (COLLECTION) {
  $export($export.S, COLLECTION, { of: function of() {
    var length = arguments.length;
    var A = new Array(length);
    while (length--) A[length] = arguments[length];
    return new this(A);
  } });
};

},{"./_export":64}],101:[function(require,module,exports){
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var isObject = require('./_is-object');
var anObject = require('./_an-object');
var check = function (O, proto) {
  anObject(O);
  if (!isObject(proto) && proto !== null) throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function (test, buggy, set) {
      try {
        set = require('./_ctx')(Function.call, require('./_object-gopd').f(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch (e) { buggy = true; }
      return function setPrototypeOf(O, proto) {
        check(O, proto);
        if (buggy) O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};

},{"./_an-object":45,"./_ctx":58,"./_is-object":75,"./_object-gopd":87}],102:[function(require,module,exports){
'use strict';
var global = require('./_global');
var core = require('./_core');
var dP = require('./_object-dp');
var DESCRIPTORS = require('./_descriptors');
var SPECIES = require('./_wks')('species');

module.exports = function (KEY) {
  var C = typeof core[KEY] == 'function' ? core[KEY] : global[KEY];
  if (DESCRIPTORS && C && !C[SPECIES]) dP.f(C, SPECIES, {
    configurable: true,
    get: function () { return this; }
  });
};

},{"./_core":57,"./_descriptors":60,"./_global":67,"./_object-dp":85,"./_wks":117}],103:[function(require,module,exports){
var def = require('./_object-dp').f;
var has = require('./_has');
var TAG = require('./_wks')('toStringTag');

module.exports = function (it, tag, stat) {
  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};

},{"./_has":68,"./_object-dp":85,"./_wks":117}],104:[function(require,module,exports){
var shared = require('./_shared')('keys');
var uid = require('./_uid');
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};

},{"./_shared":105,"./_uid":113}],105:[function(require,module,exports){
var global = require('./_global');
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});
module.exports = function (key) {
  return store[key] || (store[key] = {});
};

},{"./_global":67}],106:[function(require,module,exports){
var toInteger = require('./_to-integer');
var defined = require('./_defined');
// true  -> String#at
// false -> String#codePointAt
module.exports = function (TO_STRING) {
  return function (that, pos) {
    var s = String(defined(that));
    var i = toInteger(pos);
    var l = s.length;
    var a, b;
    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};

},{"./_defined":59,"./_to-integer":108}],107:[function(require,module,exports){
var toInteger = require('./_to-integer');
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};

},{"./_to-integer":108}],108:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

},{}],109:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./_iobject');
var defined = require('./_defined');
module.exports = function (it) {
  return IObject(defined(it));
};

},{"./_defined":59,"./_iobject":72}],110:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./_to-integer');
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

},{"./_to-integer":108}],111:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./_defined');
module.exports = function (it) {
  return Object(defined(it));
};

},{"./_defined":59}],112:[function(require,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};

},{"./_is-object":75}],113:[function(require,module,exports){
var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

},{}],114:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function (it, TYPE) {
  if (!isObject(it) || it._t !== TYPE) throw TypeError('Incompatible receiver, ' + TYPE + ' required!');
  return it;
};

},{"./_is-object":75}],115:[function(require,module,exports){
var global = require('./_global');
var core = require('./_core');
var LIBRARY = require('./_library');
var wksExt = require('./_wks-ext');
var defineProperty = require('./_object-dp').f;
module.exports = function (name) {
  var $Symbol = core.Symbol || (core.Symbol = LIBRARY ? {} : global.Symbol || {});
  if (name.charAt(0) != '_' && !(name in $Symbol)) defineProperty($Symbol, name, { value: wksExt.f(name) });
};

},{"./_core":57,"./_global":67,"./_library":81,"./_object-dp":85,"./_wks-ext":116}],116:[function(require,module,exports){
exports.f = require('./_wks');

},{"./_wks":117}],117:[function(require,module,exports){
var store = require('./_shared')('wks');
var uid = require('./_uid');
var Symbol = require('./_global').Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;

},{"./_global":67,"./_shared":105,"./_uid":113}],118:[function(require,module,exports){
var classof = require('./_classof');
var ITERATOR = require('./_wks')('iterator');
var Iterators = require('./_iterators');
module.exports = require('./_core').getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};

},{"./_classof":51,"./_core":57,"./_iterators":80,"./_wks":117}],119:[function(require,module,exports){
var anObject = require('./_an-object');
var get = require('./core.get-iterator-method');
module.exports = require('./_core').getIterator = function (it) {
  var iterFn = get(it);
  if (typeof iterFn != 'function') throw TypeError(it + ' is not iterable!');
  return anObject(iterFn.call(it));
};

},{"./_an-object":45,"./_core":57,"./core.get-iterator-method":118}],120:[function(require,module,exports){
'use strict';
var addToUnscopables = require('./_add-to-unscopables');
var step = require('./_iter-step');
var Iterators = require('./_iterators');
var toIObject = require('./_to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = require('./_iter-define')(Array, 'Array', function (iterated, kind) {
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var kind = this._k;
  var index = this._i++;
  if (!O || index >= O.length) {
    this._t = undefined;
    return step(1);
  }
  if (kind == 'keys') return step(0, index);
  if (kind == 'values') return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

},{"./_add-to-unscopables":43,"./_iter-define":78,"./_iter-step":79,"./_iterators":80,"./_to-iobject":109}],121:[function(require,module,exports){
var $export = require('./_export');
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
$export($export.S, 'Object', { create: require('./_object-create') });

},{"./_export":64,"./_object-create":84}],122:[function(require,module,exports){
var $export = require('./_export');
// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
$export($export.S + $export.F * !require('./_descriptors'), 'Object', { defineProperty: require('./_object-dp').f });

},{"./_descriptors":60,"./_export":64,"./_object-dp":85}],123:[function(require,module,exports){
// 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
var toIObject = require('./_to-iobject');
var $getOwnPropertyDescriptor = require('./_object-gopd').f;

require('./_object-sap')('getOwnPropertyDescriptor', function () {
  return function getOwnPropertyDescriptor(it, key) {
    return $getOwnPropertyDescriptor(toIObject(it), key);
  };
});

},{"./_object-gopd":87,"./_object-sap":95,"./_to-iobject":109}],124:[function(require,module,exports){
// 19.1.2.9 Object.getPrototypeOf(O)
var toObject = require('./_to-object');
var $getPrototypeOf = require('./_object-gpo');

require('./_object-sap')('getPrototypeOf', function () {
  return function getPrototypeOf(it) {
    return $getPrototypeOf(toObject(it));
  };
});

},{"./_object-gpo":91,"./_object-sap":95,"./_to-object":111}],125:[function(require,module,exports){
// 19.1.3.19 Object.setPrototypeOf(O, proto)
var $export = require('./_export');
$export($export.S, 'Object', { setPrototypeOf: require('./_set-proto').set });

},{"./_export":64,"./_set-proto":101}],126:[function(require,module,exports){

},{}],127:[function(require,module,exports){
'use strict';
var strong = require('./_collection-strong');
var validate = require('./_validate-collection');
var SET = 'Set';

// 23.2 Set Objects
module.exports = require('./_collection')(SET, function (get) {
  return function Set() { return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.2.3.1 Set.prototype.add(value)
  add: function add(value) {
    return strong.def(validate(this, SET), value = value === 0 ? 0 : value, value);
  }
}, strong);

},{"./_collection":56,"./_collection-strong":53,"./_validate-collection":114}],128:[function(require,module,exports){
'use strict';
var $at = require('./_string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
require('./_iter-define')(String, 'String', function (iterated) {
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var index = this._i;
  var point;
  if (index >= O.length) return { value: undefined, done: true };
  point = $at(O, index);
  this._i += point.length;
  return { value: point, done: false };
});

},{"./_iter-define":78,"./_string-at":106}],129:[function(require,module,exports){
'use strict';
// ECMAScript 6 symbols shim
var global = require('./_global');
var has = require('./_has');
var DESCRIPTORS = require('./_descriptors');
var $export = require('./_export');
var redefine = require('./_redefine');
var META = require('./_meta').KEY;
var $fails = require('./_fails');
var shared = require('./_shared');
var setToStringTag = require('./_set-to-string-tag');
var uid = require('./_uid');
var wks = require('./_wks');
var wksExt = require('./_wks-ext');
var wksDefine = require('./_wks-define');
var enumKeys = require('./_enum-keys');
var isArray = require('./_is-array');
var anObject = require('./_an-object');
var isObject = require('./_is-object');
var toIObject = require('./_to-iobject');
var toPrimitive = require('./_to-primitive');
var createDesc = require('./_property-desc');
var _create = require('./_object-create');
var gOPNExt = require('./_object-gopn-ext');
var $GOPD = require('./_object-gopd');
var $DP = require('./_object-dp');
var $keys = require('./_object-keys');
var gOPD = $GOPD.f;
var dP = $DP.f;
var gOPN = gOPNExt.f;
var $Symbol = global.Symbol;
var $JSON = global.JSON;
var _stringify = $JSON && $JSON.stringify;
var PROTOTYPE = 'prototype';
var HIDDEN = wks('_hidden');
var TO_PRIMITIVE = wks('toPrimitive');
var isEnum = {}.propertyIsEnumerable;
var SymbolRegistry = shared('symbol-registry');
var AllSymbols = shared('symbols');
var OPSymbols = shared('op-symbols');
var ObjectProto = Object[PROTOTYPE];
var USE_NATIVE = typeof $Symbol == 'function';
var QObject = global.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var setter = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = DESCRIPTORS && $fails(function () {
  return _create(dP({}, 'a', {
    get: function () { return dP(this, 'a', { value: 7 }).a; }
  })).a != 7;
}) ? function (it, key, D) {
  var protoDesc = gOPD(ObjectProto, key);
  if (protoDesc) delete ObjectProto[key];
  dP(it, key, D);
  if (protoDesc && it !== ObjectProto) dP(ObjectProto, key, protoDesc);
} : dP;

var wrap = function (tag) {
  var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE]);
  sym._k = tag;
  return sym;
};

var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  return it instanceof $Symbol;
};

var $defineProperty = function defineProperty(it, key, D) {
  if (it === ObjectProto) $defineProperty(OPSymbols, key, D);
  anObject(it);
  key = toPrimitive(key, true);
  anObject(D);
  if (has(AllSymbols, key)) {
    if (!D.enumerable) {
      if (!has(it, HIDDEN)) dP(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if (has(it, HIDDEN) && it[HIDDEN][key]) it[HIDDEN][key] = false;
      D = _create(D, { enumerable: createDesc(0, false) });
    } return setSymbolDesc(it, key, D);
  } return dP(it, key, D);
};
var $defineProperties = function defineProperties(it, P) {
  anObject(it);
  var keys = enumKeys(P = toIObject(P));
  var i = 0;
  var l = keys.length;
  var key;
  while (l > i) $defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P) {
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key) {
  var E = isEnum.call(this, key = toPrimitive(key, true));
  if (this === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return false;
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key) {
  it = toIObject(it);
  key = toPrimitive(key, true);
  if (it === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return;
  var D = gOPD(it, key);
  if (D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it) {
  var names = gOPN(toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META) result.push(key);
  } return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it) {
  var IS_OP = it === ObjectProto;
  var names = gOPN(IS_OP ? OPSymbols : toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (has(AllSymbols, key = names[i++]) && (IS_OP ? has(ObjectProto, key) : true)) result.push(AllSymbols[key]);
  } return result;
};

// 19.4.1.1 Symbol([description])
if (!USE_NATIVE) {
  $Symbol = function Symbol() {
    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor!');
    var tag = uid(arguments.length > 0 ? arguments[0] : undefined);
    var $set = function (value) {
      if (this === ObjectProto) $set.call(OPSymbols, value);
      if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    };
    if (DESCRIPTORS && setter) setSymbolDesc(ObjectProto, tag, { configurable: true, set: $set });
    return wrap(tag);
  };
  redefine($Symbol[PROTOTYPE], 'toString', function toString() {
    return this._k;
  });

  $GOPD.f = $getOwnPropertyDescriptor;
  $DP.f = $defineProperty;
  require('./_object-gopn').f = gOPNExt.f = $getOwnPropertyNames;
  require('./_object-pie').f = $propertyIsEnumerable;
  require('./_object-gops').f = $getOwnPropertySymbols;

  if (DESCRIPTORS && !require('./_library')) {
    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }

  wksExt.f = function (name) {
    return wrap(wks(name));
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, { Symbol: $Symbol });

for (var es6Symbols = (
  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
).split(','), j = 0; es6Symbols.length > j;)wks(es6Symbols[j++]);

for (var wellKnownSymbols = $keys(wks.store), k = 0; wellKnownSymbols.length > k;) wksDefine(wellKnownSymbols[k++]);

$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {
  // 19.4.2.1 Symbol.for(key)
  'for': function (key) {
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(sym) {
    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol!');
    for (var key in SymbolRegistry) if (SymbolRegistry[key] === sym) return key;
  },
  useSetter: function () { setter = true; },
  useSimple: function () { setter = false; }
});

$export($export.S + $export.F * !USE_NATIVE, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export($export.S + $export.F * (!USE_NATIVE || $fails(function () {
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({ a: S }) != '{}' || _stringify(Object(S)) != '{}';
})), 'JSON', {
  stringify: function stringify(it) {
    var args = [it];
    var i = 1;
    var replacer, $replacer;
    while (arguments.length > i) args.push(arguments[i++]);
    $replacer = replacer = args[1];
    if (!isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
    if (!isArray(replacer)) replacer = function (key, value) {
      if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
      if (!isSymbol(value)) return value;
    };
    args[1] = replacer;
    return _stringify.apply($JSON, args);
  }
});

// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
$Symbol[PROTOTYPE][TO_PRIMITIVE] || require('./_hide')($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON, 'JSON', true);

},{"./_an-object":45,"./_descriptors":60,"./_enum-keys":63,"./_export":64,"./_fails":65,"./_global":67,"./_has":68,"./_hide":69,"./_is-array":74,"./_is-object":75,"./_library":81,"./_meta":82,"./_object-create":84,"./_object-dp":85,"./_object-gopd":87,"./_object-gopn":89,"./_object-gopn-ext":88,"./_object-gops":90,"./_object-keys":93,"./_object-pie":94,"./_property-desc":96,"./_redefine":98,"./_set-to-string-tag":103,"./_shared":105,"./_to-iobject":109,"./_to-primitive":112,"./_uid":113,"./_wks":117,"./_wks-define":115,"./_wks-ext":116}],130:[function(require,module,exports){
'use strict';
var each = require('./_array-methods')(0);
var redefine = require('./_redefine');
var meta = require('./_meta');
var assign = require('./_object-assign');
var weak = require('./_collection-weak');
var isObject = require('./_is-object');
var fails = require('./_fails');
var validate = require('./_validate-collection');
var WEAK_MAP = 'WeakMap';
var getWeak = meta.getWeak;
var isExtensible = Object.isExtensible;
var uncaughtFrozenStore = weak.ufstore;
var tmp = {};
var InternalMap;

var wrapper = function (get) {
  return function WeakMap() {
    return get(this, arguments.length > 0 ? arguments[0] : undefined);
  };
};

var methods = {
  // 23.3.3.3 WeakMap.prototype.get(key)
  get: function get(key) {
    if (isObject(key)) {
      var data = getWeak(key);
      if (data === true) return uncaughtFrozenStore(validate(this, WEAK_MAP)).get(key);
      return data ? data[this._i] : undefined;
    }
  },
  // 23.3.3.5 WeakMap.prototype.set(key, value)
  set: function set(key, value) {
    return weak.def(validate(this, WEAK_MAP), key, value);
  }
};

// 23.3 WeakMap Objects
var $WeakMap = module.exports = require('./_collection')(WEAK_MAP, wrapper, methods, weak, true, true);

// IE11 WeakMap frozen keys fix
if (fails(function () { return new $WeakMap().set((Object.freeze || Object)(tmp), 7).get(tmp) != 7; })) {
  InternalMap = weak.getConstructor(wrapper, WEAK_MAP);
  assign(InternalMap.prototype, methods);
  meta.NEED = true;
  each(['delete', 'has', 'get', 'set'], function (key) {
    var proto = $WeakMap.prototype;
    var method = proto[key];
    redefine(proto, key, function (a, b) {
      // store frozen objects on internal weakmap shim
      if (isObject(a) && !isExtensible(a)) {
        if (!this._f) this._f = new InternalMap();
        var result = this._f[key](a, b);
        return key == 'set' ? this : result;
      // store all the rest on native weakmap
      } return method.call(this, a, b);
    });
  });
}

},{"./_array-methods":48,"./_collection":56,"./_collection-weak":55,"./_fails":65,"./_is-object":75,"./_meta":82,"./_object-assign":83,"./_redefine":98,"./_validate-collection":114}],131:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-set.from
require('./_set-collection-from')('Set');

},{"./_set-collection-from":99}],132:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-set.of
require('./_set-collection-of')('Set');

},{"./_set-collection-of":100}],133:[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export = require('./_export');

$export($export.P + $export.R, 'Set', { toJSON: require('./_collection-to-json')('Set') });

},{"./_collection-to-json":54,"./_export":64}],134:[function(require,module,exports){
require('./_wks-define')('asyncIterator');

},{"./_wks-define":115}],135:[function(require,module,exports){
require('./_wks-define')('observable');

},{"./_wks-define":115}],136:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-weakmap.from
require('./_set-collection-from')('WeakMap');

},{"./_set-collection-from":99}],137:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-weakmap.of
require('./_set-collection-of')('WeakMap');

},{"./_set-collection-of":100}],138:[function(require,module,exports){
require('./es6.array.iterator');
var global = require('./_global');
var hide = require('./_hide');
var Iterators = require('./_iterators');
var TO_STRING_TAG = require('./_wks')('toStringTag');

var DOMIterables = ('CSSRuleList,CSSStyleDeclaration,CSSValueList,ClientRectList,DOMRectList,DOMStringList,' +
  'DOMTokenList,DataTransferItemList,FileList,HTMLAllCollection,HTMLCollection,HTMLFormElement,HTMLSelectElement,' +
  'MediaList,MimeTypeArray,NamedNodeMap,NodeList,PaintRequestList,Plugin,PluginArray,SVGLengthList,SVGNumberList,' +
  'SVGPathSegList,SVGPointList,SVGStringList,SVGTransformList,SourceBufferList,StyleSheetList,TextTrackCueList,' +
  'TextTrackList,TouchList').split(',');

for (var i = 0; i < DOMIterables.length; i++) {
  var NAME = DOMIterables[i];
  var Collection = global[NAME];
  var proto = Collection && Collection.prototype;
  if (proto && !proto[TO_STRING_TAG]) hide(proto, TO_STRING_TAG, NAME);
  Iterators[NAME] = Iterators.Array;
}

},{"./_global":67,"./_hide":69,"./_iterators":80,"./_wks":117,"./es6.array.iterator":120}],139:[function(require,module,exports){
(function (process){
/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}

}).call(this,require('_process'))

},{"./debug":140,"_process":142}],140:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  return debug;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":141}],141:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],142:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[10])(10)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2NvcmUvYXVkaW8tY29udGV4dC5qcyIsImRpc3QvY29yZS9hdWRpby10aW1lLWVuZ2luZS5qcyIsImRpc3QvY29yZS9wcmlvcml0eS1xdWV1ZS5qcyIsImRpc3QvY29yZS9zY2hlZHVsaW5nLXF1ZXVlLmpzIiwiZGlzdC9jb3JlL3RpbWUtZW5naW5lLmpzIiwiZGlzdC9lbmdpbmVzL2dyYW51bGFyLWVuZ2luZS5qcyIsImRpc3QvZW5naW5lcy9tZXRyb25vbWUuanMiLCJkaXN0L2VuZ2luZXMvcGxheWVyLWVuZ2luZS5qcyIsImRpc3QvZW5naW5lcy9zZWdtZW50LWVuZ2luZS5qcyIsImRpc3QvaW5kZXguanMiLCJkaXN0L21hc3RlcnMvZmFjdG9yaWVzLmpzIiwiZGlzdC9tYXN0ZXJzL3BsYXktY29udHJvbC5qcyIsImRpc3QvbWFzdGVycy9zY2hlZHVsZXIuanMiLCJkaXN0L21hc3RlcnMvc2ltcGxlLXNjaGVkdWxlci5qcyIsImRpc3QvbWFzdGVycy90cmFuc3BvcnQuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL2dldC1pdGVyYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2NyZWF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2RlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2dldC1vd24tcHJvcGVydHktZGVzY3JpcHRvci5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2dldC1wcm90b3R5cGUtb2YuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9zZXQtcHJvdG90eXBlLW9mLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9zZXQuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL3N5bWJvbC5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMvc3ltYm9sL2l0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvY29yZS1qcy93ZWFrLW1hcC5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2hlbHBlcnMvY2xhc3NDYWxsQ2hlY2suanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9oZWxwZXJzL2NyZWF0ZUNsYXNzLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvaGVscGVycy9nZXQuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9oZWxwZXJzL2luaGVyaXRzLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvaGVscGVycy9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvaGVscGVycy90eXBlb2YuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL2dldC1pdGVyYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2NyZWF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2RlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2dldC1vd24tcHJvcGVydHktZGVzY3JpcHRvci5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2dldC1wcm90b3R5cGUtb2YuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9zZXQtcHJvdG90eXBlLW9mLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9mbi9zZXQuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL3N5bWJvbC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvZm4vc3ltYm9sL2l0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9mbi93ZWFrLW1hcC5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fYS1mdW5jdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fYWRkLXRvLXVuc2NvcGFibGVzLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19hbi1pbnN0YW5jZS5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fYW4tb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19hcnJheS1mcm9tLWl0ZXJhYmxlLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19hcnJheS1pbmNsdWRlcy5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fYXJyYXktbWV0aG9kcy5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fYXJyYXktc3BlY2llcy1jb25zdHJ1Y3Rvci5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fYXJyYXktc3BlY2llcy1jcmVhdGUuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2NsYXNzb2YuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2NvZi5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fY29sbGVjdGlvbi1zdHJvbmcuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2NvbGxlY3Rpb24tdG8tanNvbi5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fY29sbGVjdGlvbi13ZWFrLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19jb2xsZWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19jb3JlLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19jdHguanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2RlZmluZWQuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2Rlc2NyaXB0b3JzLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19kb20tY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19lbnVtLWJ1Zy1rZXlzLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19lbnVtLWtleXMuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2V4cG9ydC5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fZmFpbHMuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2Zvci1vZi5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fZ2xvYmFsLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19oYXMuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2hpZGUuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2h0bWwuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2llOC1kb20tZGVmaW5lLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19pb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19pcy1hcnJheS1pdGVyLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19pcy1hcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9faXMtb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19pdGVyLWNhbGwuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2l0ZXItY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19pdGVyLWRlZmluZS5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9faXRlci1zdGVwLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19pdGVyYXRvcnMuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2xpYnJhcnkuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX21ldGEuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX29iamVjdC1hc3NpZ24uanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX29iamVjdC1jcmVhdGUuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX29iamVjdC1kcC5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fb2JqZWN0LWRwcy5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fb2JqZWN0LWdvcGQuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX29iamVjdC1nb3BuLWV4dC5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fb2JqZWN0LWdvcG4uanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX29iamVjdC1nb3BzLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19vYmplY3QtZ3BvLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19vYmplY3Qta2V5cy1pbnRlcm5hbC5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fb2JqZWN0LWtleXMuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX29iamVjdC1waWUuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX29iamVjdC1zYXAuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3Byb3BlcnR5LWRlc2MuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3JlZGVmaW5lLWFsbC5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fcmVkZWZpbmUuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3NldC1jb2xsZWN0aW9uLWZyb20uanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3NldC1jb2xsZWN0aW9uLW9mLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19zZXQtcHJvdG8uanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3NldC1zcGVjaWVzLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19zZXQtdG8tc3RyaW5nLXRhZy5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fc2hhcmVkLWtleS5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fc2hhcmVkLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19zdHJpbmctYXQuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3RvLWFic29sdXRlLWluZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL190by1pbnRlZ2VyLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL190by1pb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL190by1sZW5ndGguanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3RvLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fdG8tcHJpbWl0aXZlLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL191aWQuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3ZhbGlkYXRlLWNvbGxlY3Rpb24uanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3drcy1kZWZpbmUuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3drcy1leHQuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3drcy5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9jb3JlLmdldC1pdGVyYXRvci1tZXRob2QuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvY29yZS5nZXQtaXRlcmF0b3IuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2LmFycmF5Lml0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5vYmplY3QuY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5vYmplY3QuZGVmaW5lLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5vYmplY3QuZ2V0LW93bi1wcm9wZXJ0eS1kZXNjcmlwdG9yLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5vYmplY3QuZ2V0LXByb3RvdHlwZS1vZi5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYub2JqZWN0LnNldC1wcm90b3R5cGUtb2YuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2Lm9iamVjdC50by1zdHJpbmcuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2LnNldC5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYuc3RyaW5nLml0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5zeW1ib2wuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2LndlYWstbWFwLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNy5zZXQuZnJvbS5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczcuc2V0Lm9mLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNy5zZXQudG8tanNvbi5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczcuc3ltYm9sLmFzeW5jLWl0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNy5zeW1ib2wub2JzZXJ2YWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczcud2Vhay1tYXAuZnJvbS5qcyIsIm5vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczcud2Vhay1tYXAub2YuanMiLCJub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvd2ViLmRvbS5pdGVyYWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9zcmMvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9zcmMvZGVidWcuanMiLCJub2RlX21vZHVsZXMvbXMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7QUNBQSxJQUFNLGVBQWUsT0FBTyxZQUFQLElBQXVCLE9BQU8sa0JBQW5EOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7QUFlQSxJQUFJLGVBQWUsSUFBbkI7O0FBRUEsSUFBSSxZQUFKLEVBQWtCO0FBQ2hCLGlCQUFlLElBQUksWUFBSixFQUFmOztBQUVBLE1BQUksaUJBQWlCLElBQWpCLENBQXNCLFVBQVUsU0FBaEMsS0FBOEMsYUFBYSxVQUFiLEdBQTBCLEtBQTVFLEVBQW1GO0FBQ2pGLFFBQU0sU0FBUyxhQUFhLFlBQWIsQ0FBMEIsQ0FBMUIsRUFBNkIsQ0FBN0IsRUFBZ0MsS0FBaEMsQ0FBZjtBQUNBLFFBQU0sUUFBUSxhQUFhLGtCQUFiLEVBQWQ7QUFDQSxVQUFNLE1BQU4sR0FBZSxNQUFmO0FBQ0EsVUFBTSxPQUFOLENBQWMsYUFBYSxXQUEzQjtBQUNBLFVBQU0sS0FBTixDQUFZLENBQVo7QUFDQSxVQUFNLFVBQU47QUFDRDtBQUNGOztrQkFFYyxZOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2hDZjs7OztBQUNBOzs7Ozs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW1CTSxlOzs7QUFDSiw2QkFBZ0Q7QUFBQSxRQUFwQyxZQUFvQztBQUFBOztBQUc5Qzs7Ozs7Ozs7QUFIOEM7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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfXJldHVybiBlfSkoKSIsImNvbnN0IEF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcclxuXHJcbi8qKlxyXG4gKiBFeHBvc2UgYSB1bmlxdWUgYXVkaW8gY29udGV4dCBzaW5nbGV0b24gYXMgdGhlIGRlZmF1bHQgYXVkaW9cclxuICogY29udGV4dCB1c2VkIGJ5IHRoZSBjb21wb25lbnRzIG9mIHRoZSBXYXZlcyBBdWRpbyBsaWJyYXJ5IGFuZFxyXG4gKiBhcHBsaWNhdGlvbnMgdXNpbmcgdGhlIGxpYnJhcnkuXHJcbiAqXHJcbiAqIEB0eXBlIEF1ZGlvQ29udGV4dFxyXG4gKiBAbmFtZSBhdWRpb0NvbnRleHRcclxuICogQGNvbnN0YW50XHJcbiAqIEBnbG9iYWxcclxuICogQGluc3RhbmNlXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGltcG9ydCAqIGFzIGF1ZGlvIGZyb20gJ3dhdmVzLWF1ZGlvJztcclxuICogY29uc3QgYXVkaW9Db250ZXh0ID0gYXVkaW8uYXVkaW9Db250ZXh0O1xyXG4gKi9cclxubGV0IGF1ZGlvQ29udGV4dCA9IG51bGw7XHJcblxyXG5pZiAoQXVkaW9Db250ZXh0KSB7XHJcbiAgYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xyXG5cclxuICBpZiAoLyhpUGhvbmV8aVBhZCkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmIGF1ZGlvQ29udGV4dC5zYW1wbGVSYXRlIDwgNDQxMDApIHtcclxuICAgIGNvbnN0IGJ1ZmZlciA9IGF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXIoMSwgMSwgNDQxMDApO1xyXG4gICAgY29uc3QgZHVtbXkgPSBhdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcbiAgICBkdW1teS5idWZmZXIgPSBidWZmZXI7XHJcbiAgICBkdW1teS5jb25uZWN0KGF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XHJcbiAgICBkdW1teS5zdGFydCgwKTtcclxuICAgIGR1bW15LmRpc2Nvbm5lY3QoKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGF1ZGlvQ29udGV4dDtcclxuIiwiaW1wb3J0IFRpbWVFbmdpbmUgZnJvbSAnLi90aW1lLWVuZ2luZSc7XHJcbmltcG9ydCBkZWZhdWx0QXVkaW9Db250ZXh0IGZyb20gJy4vYXVkaW8tY29udGV4dCc7XHJcblxyXG4vKipcclxuICogVGhpcyBpcyB0aGUgYmFzZSBjbGFzcyBmb3IgYWxsIGF1ZGlvIHJlbGF0ZWQgdGltZSBlbmdpbmUgY29tcG9uZW50cy4gSXQgaXNcclxuICogdXNlZCB0byBoYW5kbGUgYXVkaW8gcmVsYXRlZCBldmVudHMgc3VjaCBhcyB0aGUgcGxheWJhY2sgb2YgYSBtZWRpYSBzdHJlYW0uXHJcbiAqIEl0IGV4dGVuZHMgdGhlIFRpbWVFbmdpbmUgY2xhc3MgYnkgdGhlIHN0YW5kYXJkIHdlYiBhdWRpbyBub2RlIG1ldGhvZHNcclxuICogY29ubmVjdCBhbmQgZGlzY29ubmVjdC5cclxuICpcclxuICogW2V4YW1wbGVde0BsaW5rIGh0dHBzOi8vcmF3Z2l0LmNvbS93YXZlc2pzL3dhdmVzLWF1ZGlvL21hc3Rlci9leGFtcGxlcy9hdWRpby10aW1lLWVuZ2luZS5odG1sfVxyXG4gKlxyXG4gKiBAZXh0ZW5kcyBUaW1lRW5naW5lXHJcbiAqIEBleGFtcGxlXHJcbiAqIGltcG9ydCBhdWRpbyBmcm9tICd3YXZlcy1hdWRpbyc7XHJcbiAqXHJcbiAqIGNsYXNzIE15RW5naW5lIGV4dGVuZHMgYXVkaW8uQXVkaW9UaW1lRW5naW5lIHtcclxuICogICBjb25zdHJ1Y3RvcigpIHtcclxuICogICAgIHN1cGVyKCk7XHJcbiAqICAgICAvLyAuLi5cclxuICogICB9XHJcbiAqIH1cclxuICovXHJcbmNsYXNzIEF1ZGlvVGltZUVuZ2luZSBleHRlbmRzIFRpbWVFbmdpbmUge1xyXG4gIGNvbnN0cnVjdG9yKGF1ZGlvQ29udGV4dCA9IGRlZmF1bHRBdWRpb0NvbnRleHQpIHtcclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBdWRpbyBjb250ZXh0IHVzZWQgYnkgdGhlIFRpbWVFbmdpbmUsIGRlZmF1bHQgdG8gdGhlIGdsb2JhbCBhdWRpb0NvbnRleHRcclxuICAgICAqXHJcbiAgICAgKiBAbmFtZSBhdWRpb0NvbnRleHRcclxuICAgICAqIEB0eXBlIEF1ZGlvQ29udGV4dFxyXG4gICAgICogQG1lbWJlcm9mIEF1ZGlvVGltZUVuZ2luZVxyXG4gICAgICogQHNlZSBhdWRpb0NvbnRleHRcclxuICAgICAqL1xyXG4gICAgdGhpcy5hdWRpb0NvbnRleHQgPSBhdWRpb0NvbnRleHQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPdXRwdXQgYXVkaW8gbm9kZS4gQnkgZGVmYXVsdCB0aGUgY29ubmVjdCBtZXRob2QgY29ubmVjdHMgYSBnaXZlbiBub2RlXHJcbiAgICAgKiB0byB0aGlzIG91dHB1dCBub2RlLlxyXG4gICAgICpcclxuICAgICAqIEBuYW1lIG91dHB1dE5vZGVcclxuICAgICAqIEB0eXBlIEF1ZGlvTm9kZVxyXG4gICAgICogQG1lbWJlcm9mIEF1ZGlvVGltZUVuZ2luZVxyXG4gICAgICogQGRlZmF1bHQgbnVsbFxyXG4gICAgICovXHJcbiAgICB0aGlzLm91dHB1dE5vZGUgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29ubmVjdCB0byBhbiBhdWRpbyBub2RlIChlLmcuIGF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbilcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7QXVkaW9Ob2RlfSB0YXJnZXQgLSBUYXJnZXQgYXVkaW8gbm9kZVxyXG4gICAqL1xyXG4gIGNvbm5lY3QodGFyZ2V0KSB7XHJcbiAgICB0aGlzLm91dHB1dE5vZGUuY29ubmVjdCh0YXJnZXQpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEaXNjb25uZWN0IGZyb20gYW4gYXVkaW8gbm9kZSAoZS5nLiBhdWRpb0NvbnRleHQuZGVzdGluYXRpb24pLiBJZiB1bmRlZmluZWRcclxuICAgKiBkaXNjb25uZWN0IGZyb20gYWxsIHRhcmdldCBub2Rlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7QXVkaW9Ob2RlfSB0YXJnZXQgLSBUYXJnZXQgYXVkaW8gbm9kZS5cclxuICAgKi9cclxuICBkaXNjb25uZWN0KGNvbm5lY3Rpb24pIHtcclxuICAgIHRoaXMub3V0cHV0Tm9kZS5kaXNjb25uZWN0KGNvbm5lY3Rpb24pO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBBdWRpb1RpbWVFbmdpbmU7XHJcbiIsIi8vIHdvcmtzIGJ5IHJlZmVyZW5jZVxyXG5mdW5jdGlvbiBzd2FwKGFyciwgaTEsIGkyKSB7XHJcbiAgY29uc3QgdG1wID0gYXJyW2kxXTtcclxuICBhcnJbaTFdID0gYXJyW2kyXTtcclxuICBhcnJbaTJdID0gdG1wO1xyXG59XHJcblxyXG4vLyBodHRwczovL2pzcGVyZi5jb20vanMtZm9yLWxvb3AtdnMtYXJyYXktaW5kZXhvZi8zNDZcclxuZnVuY3Rpb24gaW5kZXhPZihhcnIsIGVsKSB7XHJcbiAgY29uc3QgbCA9IGFyci5sZW5ndGg7XHJcbiAgLy8gaWdub3JlIGZpcnN0IGVsZW1lbnQgYXMgaXQgY2FuJ3QgYmUgYSBlbnRyeVxyXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgbDsgaSsrKSB7XHJcbiAgICBpZiAoYXJyW2ldID09PSBlbCkge1xyXG4gICAgICByZXR1cm4gaTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiAtMTtcclxufVxyXG5cclxuLyoqXHJcbiAqIERlZmluZSBpZiBgdGltZTFgIHNob3VsZCBiZSBsb3dlciBpbiB0aGUgdG9wb2dyYXBoeSB0aGFuIGB0aW1lMmAuXHJcbiAqIElzIGR5bmFtaWNhbGx5IGFmZmVjdGVkIHRvIHRoZSBwcmlvcml0eSBxdWV1ZSBhY2NvcmRpbmcgdG8gaGFuZGxlIGBtaW5gIGFuZCBgbWF4YCBoZWFwLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0ge051bWJlcn0gdGltZTFcclxuICogQHBhcmFtIHtOdW1iZXJ9IHRpbWUyXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59XHJcbiAqL1xyXG5jb25zdCBfaXNMb3dlck1heEhlYXAgPSBmdW5jdGlvbih0aW1lMSwgdGltZTIpIHtcclxuICByZXR1cm4gdGltZTEgPCB0aW1lMjtcclxufTtcclxuXHJcbmNvbnN0IF9pc0xvd2VyTWluSGVhcCA9IGZ1bmN0aW9uKHRpbWUxLCB0aW1lMikge1xyXG4gIHJldHVybiB0aW1lMSA+IHRpbWUyO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlZmluZSBpZiBgdGltZTFgIHNob3VsZCBiZSBoaWdoZXIgaW4gdGhlIHRvcG9ncmFwaHkgdGhhbiBgdGltZTJgLlxyXG4gKiBJcyBkeW5hbWljYWxseSBhZmZlY3RlZCB0byB0aGUgcHJpb3JpdHkgcXVldWUgYWNjb3JkaW5nIHRvIGhhbmRsZSBgbWluYCBhbmQgYG1heGAgaGVhcC5cclxuICpcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtIHtOdW1iZXJ9IHRpbWUxXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lMlxyXG4gKiBAcmV0dXJuIHtCb29sZWFufVxyXG4gKi9cclxuY29uc3QgX2lzSGlnaGVyTWF4SGVhcCA9IGZ1bmN0aW9uKHRpbWUxLCB0aW1lMikge1xyXG4gIHJldHVybiB0aW1lMSA+IHRpbWUyO1xyXG59O1xyXG5cclxuY29uc3QgX2lzSGlnaGVyTWluSGVhcCA9IGZ1bmN0aW9uKHRpbWUxLCB0aW1lMikge1xyXG4gIHJldHVybiB0aW1lMSA8IHRpbWUyO1xyXG59O1xyXG5cclxuY29uc3QgUE9TSVRJVkVfSU5GSU5JVFkgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XHJcblxyXG4vKipcclxuICogUHJpb3JpdHkgcXVldWUgaW1wbGVtZW50aW5nIGEgYmluYXJ5IGhlYXAuXHJcbiAqIEFjdHMgYXMgYSBtaW4gaGVhcCBieSBkZWZhdWx0LCBjYW4gYmUgZHluYW1pY2FsbHkgY2hhbmdlZCB0byBhIG1heCBoZWFwXHJcbiAqIGJ5IHNldHRpbmcgYHJldmVyc2VgIHRvIHRydWUuXHJcbiAqXHJcbiAqIF9ub3RlXzogdGhlIHF1ZXVlIGNyZWF0ZXMgYW5kIG1haW50YWlucyBhIG5ldyBwcm9wZXJ0eSAoaS5lLiBgcXVldWVUaW1lYClcclxuICogdG8gZWFjaCBvYmplY3QgYWRkZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbaGVhcExlbmd0aD0xMDBdIC0gRGVmYXVsdCBzaXplIG9mIHRoZSBhcnJheSB1c2VkIHRvIGNyZWF0ZSB0aGUgaGVhcC5cclxuICovXHJcbmNsYXNzIFByaW9yaXR5UXVldWUge1xyXG4gIGNvbnN0cnVjdG9yKGhlYXBMZW5ndGggPSAxMDApIHtcclxuICAgIC8qKlxyXG4gICAgICogUG9pbnRlciB0byB0aGUgZmlyc3QgZW1wdHkgaW5kZXggb2YgdGhlIGhlYXAuXHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQG1lbWJlcm9mIFByaW9yaXR5UXVldWVcclxuICAgICAqIEBuYW1lIF9jdXJyZW50TGVuZ3RoXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICB0aGlzLl9jdXJyZW50TGVuZ3RoID0gMTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFycmF5IG9mIHRoZSBzb3J0ZWQgaW5kZXhlcyBvZiB0aGUgZW50cmllcywgdGhlIGFjdHVhbCBoZWFwLiBJZ25vcmUgdGhlIGluZGV4IDAuXHJcbiAgICAgKiBAdHlwZSB7QXJyYXl9XHJcbiAgICAgKiBAbWVtYmVyb2YgUHJpb3JpdHlRdWV1ZVxyXG4gICAgICogQG5hbWUgX2hlYXBcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuX2hlYXAgPSBuZXcgQXJyYXkoaGVhcExlbmd0aCArIDEpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHlwZSBvZiB0aGUgcXVldWU6IGBtaW5gIGhlYXAgaWYgYGZhbHNlYCwgYG1heGAgaGVhcCBpZiBgdHJ1ZWBcclxuICAgICAqIEB0eXBlIHtCb29sZWFufVxyXG4gICAgICogQG1lbWJlcm9mIFByaW9yaXR5UXVldWVcclxuICAgICAqIEBuYW1lIF9yZXZlcnNlXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICB0aGlzLl9yZXZlcnNlID0gbnVsbDtcclxuXHJcbiAgICAvLyBpbml0aWFsaXplIGNvbXBhcmUgZnVuY3Rpb25zXHJcbiAgICB0aGlzLnJldmVyc2UgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRpbWUgb2YgdGhlIGZpcnN0IGVsZW1lbnQgaW4gdGhlIGJpbmFyeSBoZWFwLlxyXG4gICAqIEByZXR1cm5zIHtOdW1iZXJ9XHJcbiAgICovXHJcbiAgZ2V0IHRpbWUoKSB7XHJcbiAgICBpZiAodGhpcy5fY3VycmVudExlbmd0aCA+IDEpXHJcbiAgICAgIHJldHVybiB0aGlzLl9oZWFwWzFdLnF1ZXVlVGltZTtcclxuXHJcbiAgICByZXR1cm4gSW5maW5pdHk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGaXJzdCBlbGVtZW50IGluIHRoZSBiaW5hcnkgaGVhcC5cclxuICAgKiBAcmV0dXJucyB7TnVtYmVyfVxyXG4gICAqIEByZWFkb25seVxyXG4gICAqL1xyXG4gIGdldCBoZWFkKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX2hlYXBbMV07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGFuZ2UgdGhlIG9yZGVyIG9mIHRoZSBxdWV1ZSAobWF4IGhlYXAgaWYgdHJ1ZSwgbWluIGhlYXAgaWYgZmFsc2UpLFxyXG4gICAqIHJlYnVpbGQgdGhlIGhlYXAgd2l0aCB0aGUgZXhpc3RpbmcgZW50cmllcy5cclxuICAgKlxyXG4gICAqIEB0eXBlIHtCb29sZWFufVxyXG4gICAqL1xyXG4gIHNldCByZXZlcnNlKHZhbHVlKSB7XHJcbiAgICBpZiAodmFsdWUgIT09IHRoaXMuX3JldmVyc2UpIHtcclxuICAgICAgdGhpcy5fcmV2ZXJzZSA9IHZhbHVlO1xyXG5cclxuICAgICAgaWYgKHRoaXMuX3JldmVyc2UgPT09IHRydWUpIHtcclxuICAgICAgICB0aGlzLl9pc0xvd2VyID0gX2lzTG93ZXJNYXhIZWFwO1xyXG4gICAgICAgIHRoaXMuX2lzSGlnaGVyID0gX2lzSGlnaGVyTWF4SGVhcDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLl9pc0xvd2VyID0gX2lzTG93ZXJNaW5IZWFwO1xyXG4gICAgICAgIHRoaXMuX2lzSGlnaGVyID0gX2lzSGlnaGVyTWluSGVhcDtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5idWlsZEhlYXAoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGdldCByZXZlcnNlKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX3JldmVyc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGaXggdGhlIGhlYXAgYnkgbW92aW5nIGFuIGVudHJ5IHRvIGEgbmV3IHVwcGVyIHBvc2l0aW9uLlxyXG4gICAqXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge051bWJlcn0gc3RhcnRJbmRleCAtIFRoZSBpbmRleCBvZiB0aGUgZW50cnkgdG8gbW92ZS5cclxuICAgKi9cclxuICBfYnViYmxlVXAoc3RhcnRJbmRleCkge1xyXG4gICAgbGV0IGVudHJ5ID0gdGhpcy5faGVhcFtzdGFydEluZGV4XTtcclxuXHJcbiAgICBsZXQgaW5kZXggPSBzdGFydEluZGV4O1xyXG4gICAgbGV0IHBhcmVudEluZGV4ID0gTWF0aC5mbG9vcihpbmRleCAvIDIpO1xyXG4gICAgbGV0IHBhcmVudCA9IHRoaXMuX2hlYXBbcGFyZW50SW5kZXhdO1xyXG5cclxuICAgIHdoaWxlIChwYXJlbnQgJiYgdGhpcy5faXNIaWdoZXIoZW50cnkucXVldWVUaW1lLCBwYXJlbnQucXVldWVUaW1lKSkge1xyXG4gICAgICBzd2FwKHRoaXMuX2hlYXAsIGluZGV4LCBwYXJlbnRJbmRleCk7XHJcblxyXG4gICAgICBpbmRleCA9IHBhcmVudEluZGV4O1xyXG4gICAgICBwYXJlbnRJbmRleCA9IE1hdGguZmxvb3IoaW5kZXggLyAyKTtcclxuICAgICAgcGFyZW50ID0gdGhpcy5faGVhcFtwYXJlbnRJbmRleF07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGaXggdGhlIGhlYXAgYnkgbW92aW5nIGFuIGVudHJ5IHRvIGEgbmV3IGxvd2VyIHBvc2l0aW9uLlxyXG4gICAqXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge051bWJlcn0gc3RhcnRJbmRleCAtIFRoZSBpbmRleCBvZiB0aGUgZW50cnkgdG8gbW92ZS5cclxuICAgKi9cclxuICBfYnViYmxlRG93bihzdGFydEluZGV4KSB7XHJcbiAgICBsZXQgZW50cnkgPSB0aGlzLl9oZWFwW3N0YXJ0SW5kZXhdO1xyXG5cclxuICAgIGxldCBpbmRleCA9IHN0YXJ0SW5kZXg7XHJcbiAgICBsZXQgYzFpbmRleCA9IGluZGV4ICogMjtcclxuICAgIGxldCBjMmluZGV4ID0gYzFpbmRleCArIDE7XHJcbiAgICBsZXQgY2hpbGQxID0gdGhpcy5faGVhcFtjMWluZGV4XTtcclxuICAgIGxldCBjaGlsZDIgPSB0aGlzLl9oZWFwW2MyaW5kZXhdO1xyXG5cclxuICAgIHdoaWxlICgoY2hpbGQxICYmIHRoaXMuX2lzTG93ZXIoZW50cnkucXVldWVUaW1lLCBjaGlsZDEucXVldWVUaW1lKSnCoHx8XHJcbiAgICAgICAgICAgKGNoaWxkMiAmJiB0aGlzLl9pc0xvd2VyKGVudHJ5LnF1ZXVlVGltZSwgY2hpbGQyLnF1ZXVlVGltZSkpKVxyXG4gICAge1xyXG4gICAgICAvLyBzd2FwIHdpdGggdGhlIG1pbmltdW0gY2hpbGRcclxuICAgICAgbGV0IHRhcmdldEluZGV4O1xyXG5cclxuICAgICAgaWYgKGNoaWxkMilcclxuICAgICAgICB0YXJnZXRJbmRleCA9IHRoaXMuX2lzSGlnaGVyKGNoaWxkMS5xdWV1ZVRpbWUsIGNoaWxkMi5xdWV1ZVRpbWUpID8gYzFpbmRleCA6IGMyaW5kZXg7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICB0YXJnZXRJbmRleCA9IGMxaW5kZXg7XHJcblxyXG4gICAgICBzd2FwKHRoaXMuX2hlYXAsIGluZGV4LCB0YXJnZXRJbmRleCk7XHJcblxyXG4gICAgICAvLyB1cGRhdGUgdG8gZmluZCBuZXh0IGNoaWxkcmVuXHJcbiAgICAgIGluZGV4ID0gdGFyZ2V0SW5kZXg7XHJcbiAgICAgIGMxaW5kZXggPSBpbmRleCAqIDI7XHJcbiAgICAgIGMyaW5kZXggPSBjMWluZGV4ICsgMTtcclxuICAgICAgY2hpbGQxID0gdGhpcy5faGVhcFtjMWluZGV4XTtcclxuICAgICAgY2hpbGQyID0gdGhpcy5faGVhcFtjMmluZGV4XTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEJ1aWxkIHRoZSBoZWFwIChmcm9tIGJvdHRvbSB1cCkuXHJcbiAgICovXHJcbiAgYnVpbGRIZWFwKCkge1xyXG4gICAgLy8gZmluZCB0aGUgaW5kZXggb2YgdGhlIGxhc3QgaW50ZXJuYWwgbm9kZVxyXG4gICAgLy8gQHRvZG8gLSBtYWtlIHN1cmUgdGhhdCdzIHRoZSByaWdodCB3YXkgdG8gZG8uXHJcbiAgICBsZXQgbWF4SW5kZXggPSBNYXRoLmZsb29yKCh0aGlzLl9jdXJyZW50TGVuZ3RoIC0gMSkgLyAyKTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gbWF4SW5kZXg7IGkgPiAwOyBpLS0pXHJcbiAgICAgIHRoaXMuX2J1YmJsZURvd24oaSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbnNlcnQgYSBuZXcgb2JqZWN0IGluIHRoZSBiaW5hcnkgaGVhcCBhbmQgc29ydCBpdC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbnRyeSAtIEVudHJ5IHRvIGluc2VydC5cclxuICAgKiBAcGFyYW0ge051bWJlcn0gdGltZSAtIFRpbWUgYXQgd2hpY2ggdGhlIGVudHJ5IHNob3VsZCBiZSBvcmRlcmVyLlxyXG4gICAqIEByZXR1cm5zIHtOdW1iZXJ9IC0gVGltZSBvZiB0aGUgZmlyc3QgZW50cnkgaW4gdGhlIGhlYXAuXHJcbiAgICovXHJcbiAgaW5zZXJ0KGVudHJ5LCB0aW1lKSB7XHJcbiAgICBpZiAoTWF0aC5hYnModGltZSkgIT09IFBPU0lUSVZFX0lORklOSVRZKSB7XHJcbiAgICAgIGVudHJ5LnF1ZXVlVGltZSA9IHRpbWU7XHJcbiAgICAgIC8vIGFkZCB0aGUgbmV3IGVudHJ5IGF0IHRoZSBlbmQgb2YgdGhlIGhlYXBcclxuICAgICAgdGhpcy5faGVhcFt0aGlzLl9jdXJyZW50TGVuZ3RoXSA9IGVudHJ5O1xyXG4gICAgICAvLyBidWJibGUgaXQgdXBcclxuICAgICAgdGhpcy5fYnViYmxlVXAodGhpcy5fY3VycmVudExlbmd0aCk7XHJcbiAgICAgIHRoaXMuX2N1cnJlbnRMZW5ndGggKz0gMTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLnRpbWU7XHJcbiAgICB9XHJcblxyXG4gICAgZW50cnkucXVldWVUaW1lID0gdW5kZWZpbmVkO1xyXG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlKGVudHJ5KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vdmUgYSBnaXZlbiBlbnRyeSB0byBhIG5ldyBwb3NpdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbnRyeSAtIEVudHJ5IHRvIG1vdmUuXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHRpbWUgLSBUaW1lIGF0IHdoaWNoIHRoZSBlbnRyeSBzaG91bGQgYmUgb3JkZXJlci5cclxuICAgKiBAcmV0dXJuIHtOdW1iZXJ9IC0gVGltZSBvZiBmaXJzdCBlbnRyeSBpbiB0aGUgaGVhcC5cclxuICAgKi9cclxuICBtb3ZlKGVudHJ5LCB0aW1lKSB7XHJcbiAgICBpZiAoTWF0aC5hYnModGltZSkgIT09IFBPU0lUSVZFX0lORklOSVRZKSB7XHJcbiAgICAgIGNvbnN0IGluZGV4ID0gaW5kZXhPZih0aGlzLl9oZWFwLCBlbnRyeSk7XHJcblxyXG4gICAgICBpZiAoaW5kZXggIT09IC0xKSB7XHJcbiAgICAgICAgZW50cnkucXVldWVUaW1lID0gdGltZTtcclxuICAgICAgICAvLyBkZWZpbmUgaWYgdGhlIGVudHJ5IHNob3VsZCBiZSBidWJibGVkIHVwIG9yIGRvd25cclxuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9oZWFwW01hdGguZmxvb3IoaW5kZXggLyAyKV07XHJcblxyXG4gICAgICAgIGlmIChwYXJlbnQgJiYgdGhpcy5faXNIaWdoZXIodGltZSwgcGFyZW50LnF1ZXVlVGltZSkpXHJcbiAgICAgICAgICB0aGlzLl9idWJibGVVcChpbmRleCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgdGhpcy5fYnViYmxlRG93bihpbmRleCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzLnRpbWU7XHJcbiAgICB9XHJcblxyXG4gICAgZW50cnkucXVldWVUaW1lID0gdW5kZWZpbmVkO1xyXG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlKGVudHJ5KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSBhbiBlbnRyeSBmcm9tIHRoZSBoZWFwIGFuZCBmaXggdGhlIGhlYXAuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZW50cnkgLSBFbnRyeSB0byByZW1vdmUuXHJcbiAgICogQHJldHVybiB7TnVtYmVyfSAtIFRpbWUgb2YgZmlyc3QgZW50cnkgaW4gdGhlIGhlYXAuXHJcbiAgICovXHJcbiAgcmVtb3ZlKGVudHJ5KSB7XHJcbiAgICAvLyBmaW5kIHRoZSBpbmRleCBvZiB0aGUgZW50cnlcclxuICAgIGNvbnN0IGluZGV4ID0gaW5kZXhPZih0aGlzLl9oZWFwLCBlbnRyeSk7XHJcblxyXG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xyXG4gICAgICBjb25zdCBsYXN0SW5kZXggPSB0aGlzLl9jdXJyZW50TGVuZ3RoIC0gMTtcclxuXHJcbiAgICAgIC8vIGlmIHRoZSBlbnRyeSBpcyB0aGUgbGFzdCBvbmVcclxuICAgICAgaWYgKGluZGV4ID09PSBsYXN0SW5kZXgpIHtcclxuICAgICAgICAvLyByZW1vdmUgdGhlIGVsZW1lbnQgZnJvbSBoZWFwXHJcbiAgICAgICAgdGhpcy5faGVhcFtsYXN0SW5kZXhdID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIC8vIHVwZGF0ZSBjdXJyZW50IGxlbmd0aFxyXG4gICAgICAgIHRoaXMuX2N1cnJlbnRMZW5ndGggPSBsYXN0SW5kZXg7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnRpbWU7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gc3dhcCB3aXRoIHRoZSBsYXN0IGVsZW1lbnQgb2YgdGhlIGhlYXBcclxuICAgICAgICBzd2FwKHRoaXMuX2hlYXAsIGluZGV4LCBsYXN0SW5kZXgpO1xyXG4gICAgICAgIC8vIHJlbW92ZSB0aGUgZWxlbWVudCBmcm9tIGhlYXBcclxuICAgICAgICB0aGlzLl9oZWFwW2xhc3RJbmRleF0gPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgIGlmIChpbmRleCA9PT0gMSkge1xyXG4gICAgICAgICAgdGhpcy5fYnViYmxlRG93bigxKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gYnViYmxlIHRoZSAoZXggbGFzdCkgZWxlbWVudCB1cCBvciBkb3duIGFjY29yZGluZyB0byBpdHMgbmV3IGNvbnRleHRcclxuICAgICAgICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5faGVhcFtpbmRleF07XHJcbiAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9oZWFwW01hdGguZmxvb3IoaW5kZXggLyAyKV07XHJcblxyXG4gICAgICAgICAgaWYgKHBhcmVudCAmJiB0aGlzLl9pc0hpZ2hlcihlbnRyeS5xdWV1ZVRpbWUsIHBhcmVudC5xdWV1ZVRpbWUpKVxyXG4gICAgICAgICAgICB0aGlzLl9idWJibGVVcChpbmRleCk7XHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHRoaXMuX2J1YmJsZURvd24oaW5kZXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gdXBkYXRlIGN1cnJlbnQgbGVuZ3RoXHJcbiAgICAgIHRoaXMuX2N1cnJlbnRMZW5ndGggPSBsYXN0SW5kZXg7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMudGltZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsZWFyIHRoZSBxdWV1ZS5cclxuICAgKi9cclxuICBjbGVhcigpIHtcclxuICAgIHRoaXMuX2N1cnJlbnRMZW5ndGggPSAxO1xyXG4gICAgdGhpcy5faGVhcCA9IG5ldyBBcnJheSh0aGlzLl9oZWFwLmxlbmd0aCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWZpbmVzIGlmIHRoZSBxdWV1ZSBjb250YWlucyB0aGUgZ2l2ZW4gYGVudHJ5YC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbnRyeSAtIEVudHJ5IHRvIGJlIGNoZWNrZWRcclxuICAgKiBAcmV0dXJuIHtCb29sZWFufVxyXG4gICAqL1xyXG4gIGhhcyhlbnRyeSkge1xyXG4gICAgcmV0dXJuIHRoaXMuX2hlYXAuaW5kZXhPZihlbnRyeSkgIT09IC0xO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgUHJpb3JpdHlRdWV1ZTtcclxuIiwiLyoqXHJcbiAqIFNjaGVkdWxpbmdRdWV1ZSBiYXNlIGNsYXNzXHJcbiAqIGh0dHA6Ly93YXZlc2pzLmdpdGh1Yi5pby9hdWRpby8jYXVkaW8tc2NoZWR1bGluZy1xdWV1ZVxyXG4gKlxyXG4gKiBOb3JiZXJ0LlNjaG5lbGxAaXJjYW0uZnJcclxuICogQ29weXJpZ2h0IDIwMTQsIDIwMTUgSVJDQU0g4oCTwqBDZW50cmUgUG9tcGlkb3VcclxuICovXHJcblxyXG5pbXBvcnQgUHJpb3JpdHlRdWV1ZSBmcm9tICcuL3ByaW9yaXR5LXF1ZXVlJztcclxuaW1wb3J0IFRpbWVFbmdpbmUgZnJvbSAnLi90aW1lLWVuZ2luZSc7XHJcblxyXG4vKipcclxuICogQGNsYXNzIFNjaGVkdWxpbmdRdWV1ZVxyXG4gKiBAZXh0ZW5kcyBUaW1lRW5naW5lXHJcbiAqL1xyXG5jbGFzcyBTY2hlZHVsaW5nUXVldWUgZXh0ZW5kcyBUaW1lRW5naW5lIHtcclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgdGhpcy5fX3F1ZXVlID0gbmV3IFByaW9yaXR5UXVldWUoKTtcclxuICAgIHRoaXMuX19lbmdpbmVzID0gbmV3IFNldCgpO1xyXG4gIH1cclxuXHJcbiAgLy8gVGltZUVuZ2luZSAnc2NoZWR1bGVkJyBpbnRlcmZhY2VcclxuICBhZHZhbmNlVGltZSh0aW1lKSB7XHJcbiAgICBjb25zdCBlbmdpbmUgPSB0aGlzLl9fcXVldWUuaGVhZDtcclxuICAgIGNvbnN0IG5leHRFbmdpbmVUaW1lID0gZW5naW5lLmFkdmFuY2VUaW1lKHRpbWUpO1xyXG5cclxuICAgIGlmICghbmV4dEVuZ2luZVRpbWUpIHtcclxuICAgICAgZW5naW5lLm1hc3RlciA9IG51bGw7XHJcbiAgICAgIHRoaXMuX19lbmdpbmVzLmRlbGV0ZShlbmdpbmUpO1xyXG4gICAgICB0aGlzLl9fcXVldWUucmVtb3ZlKGVuZ2luZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLl9fcXVldWUubW92ZShlbmdpbmUsIG5leHRFbmdpbmVUaW1lKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5fX3F1ZXVlLnRpbWU7XHJcbiAgfVxyXG5cclxuICAvLyBUaW1lRW5naW5lIG1hc3RlciBtZXRob2QgdG8gYmUgaW1wbGVtZW50ZWQgYnkgZGVyaXZlZCBjbGFzc1xyXG4gIGdldCBjdXJyZW50VGltZSgpIHtcclxuICAgIHJldHVybiAwO1xyXG4gIH1cclxuXHJcbiAgLy8gY2FsbCBhIGZ1bmN0aW9uIGF0IGEgZ2l2ZW4gdGltZVxyXG4gIGRlZmVyKGZ1biwgdGltZSA9IHRoaXMuY3VycmVudFRpbWUpIHtcclxuICAgIGlmICghKGZ1biBpbnN0YW5jZW9mIEZ1bmN0aW9uKSlcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwib2JqZWN0IGNhbm5vdCBiZSBkZWZlcmVkIGJ5IHNjaGVkdWxlclwiKTtcclxuXHJcbiAgICB0aGlzLmFkZCh7XHJcbiAgICAgIGFkdmFuY2VUaW1lOiBmdW5jdGlvbih0aW1lKSB7IGZ1bih0aW1lKTsgfSwgLy8gbWFrZSBzdXIgdGhhdCB0aGUgYWR2YW5jZVRpbWUgbWV0aG9kIGRvZXMgbm90IHJldHVybSBhbnl0aGluZ1xyXG4gICAgfSwgdGltZSk7XHJcbiAgfVxyXG5cclxuICAvLyBhZGQgYSB0aW1lIGVuZ2luZSB0byB0aGUgc2NoZWR1bGVyXHJcbiAgYWRkKGVuZ2luZSwgdGltZSA9IHRoaXMuY3VycmVudFRpbWUpIHtcclxuICAgIGlmICghVGltZUVuZ2luZS5pbXBsZW1lbnRzU2NoZWR1bGVkKGVuZ2luZSkpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIm9iamVjdCBjYW5ub3QgYmUgYWRkZWQgdG8gc2NoZWR1bGVyXCIpO1xyXG5cclxuICAgIGlmIChlbmdpbmUubWFzdGVyKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvYmplY3QgaGFzIGFscmVhZHkgYmVlbiBhZGRlZCB0byBhIG1hc3RlclwiKTtcclxuXHJcbiAgICBlbmdpbmUubWFzdGVyID0gdGhpcztcclxuXHJcbiAgICAvLyBhZGQgdG8gZW5naW5lcyBhbmQgcXVldWVcclxuICAgIHRoaXMuX19lbmdpbmVzLmFkZChlbmdpbmUpO1xyXG4gICAgY29uc3QgbmV4dFRpbWUgPSB0aGlzLl9fcXVldWUuaW5zZXJ0KGVuZ2luZSwgdGltZSk7XHJcblxyXG4gICAgLy8gcmVzY2hlZHVsZSBxdWV1ZVxyXG4gICAgdGhpcy5yZXNldFRpbWUobmV4dFRpbWUpO1xyXG4gIH1cclxuXHJcbiAgLy8gcmVtb3ZlIGEgdGltZSBlbmdpbmUgZnJvbSB0aGUgcXVldWVcclxuICByZW1vdmUoZW5naW5lKSB7XHJcbiAgICBpZiAoZW5naW5lLm1hc3RlciAhPT0gdGhpcylcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwib2JqZWN0IGhhcyBub3QgYmVlbiBhZGRlZCB0byB0aGlzIHNjaGVkdWxlclwiKTtcclxuXHJcbiAgICBlbmdpbmUubWFzdGVyID0gbnVsbDtcclxuXHJcbiAgICAvLyByZW1vdmUgZnJvbSBhcnJheSBhbmQgcXVldWVcclxuICAgIHRoaXMuX19lbmdpbmVzLmRlbGV0ZShlbmdpbmUpO1xyXG4gICAgY29uc3QgbmV4dFRpbWUgPSB0aGlzLl9fcXVldWUucmVtb3ZlKGVuZ2luZSk7XHJcblxyXG4gICAgLy8gcmVzY2hlZHVsZSBxdWV1ZVxyXG4gICAgdGhpcy5yZXNldFRpbWUobmV4dFRpbWUpO1xyXG4gIH1cclxuXHJcbiAgLy8gcmVzZXQgbmV4dCBlbmdpbmUgdGltZVxyXG4gIHJlc2V0RW5naW5lVGltZShlbmdpbmUsIHRpbWUgPSB0aGlzLmN1cnJlbnRUaW1lKSB7XHJcbiAgICBpZiAoZW5naW5lLm1hc3RlciAhPT0gdGhpcylcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwib2JqZWN0IGhhcyBub3QgYmVlbiBhZGRlZCB0byB0aGlzIHNjaGVkdWxlclwiKTtcclxuXHJcbiAgICBsZXQgbmV4dFRpbWU7XHJcblxyXG4gICAgaWYgKHRoaXMuX19xdWV1ZS5oYXMoZW5naW5lKSlcclxuICAgICAgbmV4dFRpbWUgPSB0aGlzLl9fcXVldWUubW92ZShlbmdpbmUsIHRpbWUpO1xyXG4gICAgZWxzZVxyXG4gICAgICBuZXh0VGltZSA9IHRoaXMuX19xdWV1ZS5pbnNlcnQoZW5naW5lLCB0aW1lKTtcclxuXHJcbiAgICB0aGlzLnJlc2V0VGltZShuZXh0VGltZSk7XHJcbiAgfVxyXG5cclxuICAvLyBjaGVjayB3aGV0aGVyIGEgZ2l2ZW4gZW5naW5lIGlzIHNjaGVkdWxlZFxyXG4gIGhhcyhlbmdpbmUpIHtcclxuICAgIHJldHVybiB0aGlzLl9fZW5naW5lcy5oYXMoZW5naW5lKTtcclxuICB9XHJcblxyXG4gIC8vIGNsZWFyIHF1ZXVlXHJcbiAgY2xlYXIoKSB7XHJcbiAgICBmb3IobGV0IGVuZ2luZSBvZiB0aGlzLl9fZW5naW5lcylcclxuICAgICAgZW5naW5lLm1hc3RlciA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5fX3F1ZXVlLmNsZWFyKCk7XHJcbiAgICB0aGlzLl9fZW5naW5lcy5jbGVhcigpO1xyXG4gICAgdGhpcy5yZXNldFRpbWUoSW5maW5pdHkpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgU2NoZWR1bGluZ1F1ZXVlXHJcbiIsIi8qKlxyXG4gKiBCYXNlIGNsYXNzIGZvciB0aW1lIGVuZ2luZXNcclxuICpcclxuICogQSB0aW1lIGVuZ2luZSBnZW5lcmF0ZXMgbW9yZSBvciBsZXNzIHJlZ3VsYXIgZXZlbnRzIGFuZC9vciBwbGF5cyBiYWNrIGFcclxuICogbWVkaWEgc3RyZWFtLiBJdCBpbXBsZW1lbnRzIG9uZSBvciBtdWx0aXBsZSBpbnRlcmZhY2VzIHRvIGJlIGRyaXZlbiBieSBhXHJcbiAqIG1hc3RlciAoaS5lLiBhIFNjaGVkdWxlciwgYSBUcmFuc3BvcnQgb3IgYSBQbGF5Q29udHJvbCkgaW4gc3luY2hyb25pemF0aW9uXHJcbiAqIHdpdGggb3RoZXIgZW5naW5lcy4gVGhlIHByb3ZpZGVkIGludGVyZmFjZXMgYXJlIHNjaGVkdWxlZCwgdHJhbnNwb3J0ZWQsXHJcbiAqIGFuZCBwbGF5LWNvbnRyb2xsZWQuXHJcbiAqXHJcbiAqXHJcbiAqICMjIyMgVGhlIGBzY2hlZHVsZWRgIGludGVyZmFjZVxyXG4gKlxyXG4gKiBUaGUgc2NoZWR1bGVkIGludGVyZmFjZSBhbGxvd3MgZm9yIHN5bmNocm9uaXppbmcgYW4gZW5naW5lIHRvIGEgbW9ub3Rvbm91cyB0aW1lXHJcbiAqIGFzIGl0IGlzIHByb3ZpZGVkIGJ5IHRoZSBTY2hlZHVsZXIgbWFzdGVyLlxyXG4gKlxyXG4gKiAjIyMjIyMgYGFkdmFuY2VUaW1lKHRpbWUgOk51bWJlcikgLT4ge051bWJlcn1gXHJcbiAqXHJcbiAqIFRoZSBgYWR2YW5jZVRpbWVgIG1ldGhvZCBoYXMgdG8gYmUgaW1wbGVtZW50ZWQgYnkgYW4gYFRpbWVFbmdpbmVgIGFzIHBhcnQgb2YgdGhlXHJcbiAqIHNjaGVkdWxlZCBpbnRlcmZhY2UuIFRoZSBtZXRob2QgaXMgY2FsbGVkIGJ5IHRoZSBtYXN0ZXIgKGUuZy4gdGhlIHNjaGVkdWxlcikuXHJcbiAqIEl0IGdlbmVyYXRlcyBhbiBldmVudCBhbmQgdG8gcmV0dXJucyB0aGUgdGltZSBvZiB0aGUgbmV4dCBldmVudCAoaS5lLiB0aGUgbmV4dFxyXG4gKiBjYWxsIG9mIGFkdmFuY2VUaW1lKS4gVGhlIHJldHVybmVkIHRpbWUgaGFzIHRvIGJlIGdyZWF0ZXIgdGhhbiB0aGUgdGltZVxyXG4gKiByZWNlaXZlZCBhcyBhcmd1bWVudCBvZiB0aGUgbWV0aG9kLiBJbiBjYXNlIHRoYXQgYSBUaW1lRW5naW5lIGhhcyB0byBnZW5lcmF0ZVxyXG4gKiBtdWx0aXBsZSBldmVudHMgYXQgdGhlIHNhbWUgdGltZSwgdGhlIGVuZ2luZSBoYXMgdG8gaW1wbGVtZW50IGl0cyBvd24gbG9vcFxyXG4gKiB3aGlsZShldmVudC50aW1lIDw9IHRpbWUpIGFuZCByZXR1cm4gdGhlIHRpbWUgb2YgdGhlIG5leHQgZXZlbnQgKGlmIGFueSkuXHJcbiAqXHJcbiAqICMjIyMjIyBgcmVzZXRUaW1lKHRpbWU9dW5kZWZpbmVkIDpOdW1iZXIpYFxyXG4gKlxyXG4gKiBUaGUgYHJlc2V0VGltZWAgbWV0aG9kIGlzIHByb3ZpZGVkIGJ5IHRoZSBgVGltZUVuZ2luZWAgYmFzZSBjbGFzcy4gQW4gZW5naW5lIG1heVxyXG4gKiBjYWxsIHRoaXMgbWV0aG9kIHRvIHJlc2V0IGl0cyBuZXh0IGV2ZW50IHRpbWUgKGUuZy4gd2hlbiBhIHBhcmFtZXRlciBpc1xyXG4gKiBjaGFuZ2VkIHRoYXQgaW5mbHVlbmNlcyB0aGUgZW5naW5lJ3MgdGVtcG9yYWwgYmVoYXZpb3IpLiBXaGVuIG5vIGFyZ3VtZW50XHJcbiAqIGlzIGdpdmVuLCB0aGUgdGltZSBpcyByZXNldCB0byB0aGUgY3VycmVudCBtYXN0ZXIgdGltZS4gV2hlbiBjYWxsaW5nIHRoZVxyXG4gKiBtZXRob2Qgd2l0aCBJbmZpbml0eSB0aGUgZW5naW5lIGlzIHN1c3BlbmRlZCB3aXRob3V0IGJlaW5nIHJlbW92ZWQgZnJvbSB0aGVcclxuICogbWFzdGVyLlxyXG4gKlxyXG4gKlxyXG4gKiAjIyMjIFRoZSBgdHJhbnNwb3J0ZWRgIGludGVyZmFjZVxyXG4gKlxyXG4gKiBUaGUgdHJhbnNwb3J0ZWQgaW50ZXJmYWNlIGFsbG93cyBmb3Igc3luY2hyb25pemluZyBhbiBlbmdpbmUgdG8gYSBwb3NpdGlvblxyXG4gKiAoaS5lLiBtZWRpYSBwbGF5YmFjayB0aW1lKSB0aGF0IGNhbiBydW4gZm9yd2FyZCBhbmQgYmFja3dhcmQgYW5kIGp1bXAgYXMgaXRcclxuICogaXMgcHJvdmlkZWQgYnkgdGhlIFRyYW5zcG9ydCBtYXN0ZXIuXHJcbiAqXHJcbiAqICMjIyMjIyBgc3luY1Bvc2l0aW9uKHRpbWUgOk51bWJlciwgcG9zaXRpb24gOk51bWJlciwgc3BlZWQgOk51bWJlcikgLT4ge051bWJlcn1gXHJcbiAqXHJcbiAqIFRoZSBgc3luY1Bvc2l0b25gIG1ldGhvZCBoYXMgdG8gYmUgaW1wbGVtZW50ZWQgYnkgYSBgVGltZUVuZ2luZWAgYXMgcGFydCBvZiB0aGVcclxuICogdHJhbnNwb3J0ZWQgaW50ZXJmYWNlLiBUaGUgbWV0aG9kIHN5bmNQb3NpdG9uIGlzIGNhbGxlZCB3aGVuZXZlciB0aGUgbWFzdGVyXHJcbiAqIG9mIGEgdHJhbnNwb3J0ZWQgZW5naW5lIGhhcyB0byAocmUtKXN5bmNocm9uaXplIHRoZSBlbmdpbmUncyBwb3NpdGlvbi4gVGhpc1xyXG4gKiBpcyBmb3IgZXhhbXBsZSByZXF1aXJlZCB3aGVuIHRoZSBtYXN0ZXIgKHJlLSlzdGFydHMgcGxheWJhY2ssIGp1bXBzIHRvIGFuXHJcbiAqIGFyYml0cmFyeSBwb3NpdGlvbiwgYW5kIHdoZW4gcmV2ZXJzaW5nIHBsYXliYWNrIGRpcmVjdGlvbi4gVGhlIG1ldGhvZCByZXR1cm5zXHJcbiAqIHRoZSBuZXh0IHBvc2l0aW9uIG9mIHRoZSBlbmdpbmUgaW4gdGhlIGdpdmVuIHBsYXliYWNrIGRpcmVjdGlvblxyXG4gKiAoaS5lLiBgc3BlZWQgPCAwYCBvciBgc3BlZWQgPiAwYCkuXHJcbiAqXHJcbiAqICMjIyMjIyBgYWR2YW5jZVBvc2l0aW9uKHRpbWUgOk51bWJlciwgcG9zaXRpb24gOk51bWJlciwgc3BlZWQgOk51bWJlcikgLT4ge051bWJlcn1gXHJcbiAqXHJcbiAqIFRoZSBgYWR2YW5jZVBvc2l0aW9uYCBtZXRob2QgaGFzIHRvIGJlIGltcGxlbWVudGVkIGJ5IGEgYFRpbWVFbmdpbmVgIGFzIHBhcnRcclxuICogb2YgdGhlIHRyYW5zcG9ydGVkIGludGVyZmFjZS4gVGhlIG1hc3RlciBjYWxscyB0aGUgYWR2YW5jZVBvc2l0b24gbWV0aG9kIHdoZW5cclxuICogdGhlIGVuZ2luZSdzIGV2ZW50IHBvc2l0aW9uIGlzIHJlYWNoZWQuIFRoZSBtZXRob2QgZ2VuZXJhdGVzIGFuIGV2ZW50IGFuZFxyXG4gKiByZXR1cm5zIHRoZSBuZXh0IHBvc2l0aW9uIGluIHRoZSBnaXZlbiBwbGF5YmFjayBkaXJlY3Rpb24gKGkuZS4gc3BlZWQgPCAwIG9yXHJcbiAqIHNwZWVkID4gMCkuIFRoZSByZXR1cm5lZCBwb3NpdGlvbiBoYXMgdG8gYmUgZ3JlYXRlciAoaS5lLiB3aGVuIHNwZWVkID4gMClcclxuICogb3IgbGVzcyAoaS5lLiB3aGVuIHNwZWVkIDwgMCkgdGhhbiB0aGUgcG9zaXRpb24gcmVjZWl2ZWQgYXMgYXJndW1lbnQgb2YgdGhlXHJcbiAqIG1ldGhvZC5cclxuICpcclxuICogIyMjIyMjIGByZXNldFBvc2l0aW9uKHBvc2l0aW9uPXVuZGVmaW5lZCA6TnVtYmVyKWBcclxuICpcclxuICogVGhlIHJlc2V0UG9zaXRpb24gbWV0aG9kIGlzIHByb3ZpZGVkIGJ5IHRoZSBUaW1lRW5naW5lIGJhc2UgY2xhc3MuIEFuIGVuZ2luZVxyXG4gKiBtYXkgY2FsbCB0aGlzIG1ldGhvZCB0byByZXNldCBpdHMgbmV4dCBldmVudCBwb3NpdGlvbi4gV2hlbiBubyBhcmd1bWVudFxyXG4gKiBpcyBnaXZlbiwgdGhlIHRpbWUgaXMgcmVzZXQgdG8gdGhlIGN1cnJlbnQgbWFzdGVyIHRpbWUuIFdoZW4gY2FsbGluZyB0aGVcclxuICogbWV0aG9kIHdpdGggSW5maW5pdHkgdGhlIGVuZ2luZSBpcyBzdXNwZW5kZWQgd2l0aG91dCBiZWluZyByZW1vdmVkIGZyb21cclxuICogdGhlIG1hc3Rlci5cclxuICpcclxuICpcclxuICogIyMjIyBUaGUgc3BlZWQtY29udHJvbGxlZCBpbnRlcmZhY2VcclxuICpcclxuICogVGhlIFwic3BlZWQtY29udHJvbGxlZFwiIGludGVyZmFjZSBhbGxvd3MgZm9yIHN5bmNyb25pemluZyBhbiBlbmdpbmUgdGhhdCBpc1xyXG4gKiBuZWl0aGVyIGRyaXZlbiB0aHJvdWdoIHRoZSBzY2hlZHVsZWQgbm9yIHRoZSB0cmFuc3BvcnRlZCBpbnRlcmZhY2UuIFRoZVxyXG4gKiBpbnRlcmZhY2UgYWxsb3dzIGluIHBhcnRpY3VsYXIgdG8gc3luY2hyb25pemUgZW5naW5lcyB0aGF0IGFzc3VyZSB0aGVpciBvd25cclxuICogc2NoZWR1bGluZyAoaS5lLiBhdWRpbyBwbGF5ZXIgb3IgYW4gb3NjaWxsYXRvcikgdG8gdGhlIGV2ZW50LWJhc2VkIHNjaGVkdWxlZFxyXG4gKiBhbmQgdHJhbnNwb3J0ZWQgZW5naW5lcy5cclxuICpcclxuICogIyMjIyMjIGBzeW5jU3BlZWQodGltZSA6TnVtYmVyLCBwb3NpdGlvbiA6TnVtYmVyLCBzcGVlZCA6TnVtYmVyLCBzZWVrPWZhbHNlIDpCb29sZWFuKWBcclxuICpcclxuICogVGhlIHN5bmNTcGVlZCBtZXRob2QgaGFzIHRvIGJlIGltcGxlbWVudGVkIGJ5IGEgVGltZUVuZ2luZSBhcyBwYXJ0IG9mIHRoZVxyXG4gKiBzcGVlZC1jb250cm9sbGVkIGludGVyZmFjZS4gVGhlIG1ldGhvZCBpcyBjYWxsZWQgYnkgdGhlIG1hc3RlciB3aGVuZXZlciB0aGVcclxuICogcGxheWJhY2sgc3BlZWQgY2hhbmdlcyBvciB0aGUgcG9zaXRpb24ganVtcHMgYXJiaXRhcmlseSAoaS5lLiBvbiBhIHNlZWspLlxyXG4gKlxyXG4gKlxyXG4gKiA8aHIgLz5cclxuICpcclxuICogRXhhbXBsZSB0aGF0IHNob3dzIGEgYFRpbWVFbmdpbmVgIHJ1bm5pbmcgaW4gYSBgU2NoZWR1bGVyYCB0aGF0IGNvdW50cyB1cFxyXG4gKiBhdCBhIGdpdmVuIGZyZXF1ZW5jeTpcclxuICoge0BsaW5rIGh0dHBzOi8vcmF3Z2l0LmNvbS93YXZlc2pzL3dhdmVzLWF1ZGlvL21hc3Rlci9leGFtcGxlcy90aW1lLWVuZ2luZS5odG1sfVxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBpbXBvcnQgKiBhcyBhdWRpbyBmcm9tICd3YXZlcy1hdWRpbyc7XHJcbiAqXHJcbiAqIGNsYXNzIE15RW5naW5lIGV4dGVuZHMgYXVkaW8uVGltZUVuZ2luZSB7XHJcbiAqICAgY29uc3RydWN0b3IoKSB7XHJcbiAqICAgICBzdXBlcigpO1xyXG4gKiAgICAgLy8gLi4uXHJcbiAqICAgfVxyXG4gKiB9XHJcbiAqXHJcbiAqL1xyXG5jbGFzcyBUaW1lRW5naW5lIHtcclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIC8qKlxyXG4gICAgICogVGhlIGVuZ2luZSdzIG1hc3Rlci5cclxuICAgICAqXHJcbiAgICAgKiBAdHlwZSB7TWl4ZWR9XHJcbiAgICAgKiBAbmFtZSBtYXN0ZXJcclxuICAgICAqIEBtZW1iZXJvZiBUaW1lRW5naW5lXHJcbiAgICAgKi9cclxuICAgIHRoaXMubWFzdGVyID0gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSB0aW1lIGVuZ2luZSdzIGN1cnJlbnQgKG1hc3RlcikgdGltZS5cclxuICAgKlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICogQG1lbWJlcm9mIFRpbWVFbmdpbmVcclxuICAgKiBAcmVhZG9ubHlcclxuICAgKi9cclxuICBnZXQgY3VycmVudFRpbWUoKSB7XHJcbiAgICBpZiAodGhpcy5tYXN0ZXIpXHJcbiAgICAgIHJldHVybiB0aGlzLm1hc3Rlci5jdXJyZW50VGltZTtcclxuXHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHRpbWUgZW5naW5lJ3MgY3VycmVudCAobWFzdGVyKSBwb3NpdGlvbi5cclxuICAgKlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICogQG1lbWJlcm9mIFRpbWVFbmdpbmVcclxuICAgKiBAcmVhZG9ubHlcclxuICAgKi9cclxuICBnZXQgY3VycmVudFBvc2l0aW9uKCkge1xyXG4gICAgdmFyIG1hc3RlciA9IHRoaXMubWFzdGVyO1xyXG5cclxuICAgIGlmIChtYXN0ZXIgJiYgbWFzdGVyLmN1cnJlbnRQb3NpdGlvbiAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICByZXR1cm4gbWFzdGVyLmN1cnJlbnRQb3NpdGlvbjtcclxuXHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2NoZWR1bGVkIGludGVyZmFjZVxyXG4gICAqICAgLSBhZHZhbmNlVGltZSh0aW1lKSwgY2FsbGVkIHRvIGdlbmVyYXRlIG5leHQgZXZlbnQgYXQgZ2l2ZW4gdGltZSwgcmV0dXJucyBuZXh0IHRpbWVcclxuICAgKlxyXG4gICAqIEBzdGF0aWNcclxuICAgKiBAbWVtYmVyb2YgVGltZUVuZ2luZVxyXG4gICAqL1xyXG4gIHN0YXRpYyBpbXBsZW1lbnRzU2NoZWR1bGVkKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIChlbmdpbmUuYWR2YW5jZVRpbWUgJiYgZW5naW5lLmFkdmFuY2VUaW1lIGluc3RhbmNlb2YgRnVuY3Rpb24pO1xyXG4gIH1cclxuXHJcbiAgcmVzZXRUaW1lKHRpbWUgPSB1bmRlZmluZWQpIHtcclxuICAgIGlmICh0aGlzLm1hc3RlcilcclxuICAgICAgdGhpcy5tYXN0ZXIucmVzZXRFbmdpbmVUaW1lKHRoaXMsIHRpbWUpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJhbnNwb3J0ZWQgaW50ZXJmYWNlXHJcbiAgICogICAtIHN5bmNQb3NpdGlvbih0aW1lLCBwb3NpdGlvbiwgc3BlZWQpLCBjYWxsZWQgdG8gcmVwb3NpdGlvbiBUaW1lRW5naW5lLCByZXR1cm5zIG5leHQgcG9zaXRpb25cclxuICAgKiAgIC0gYWR2YW5jZVBvc2l0aW9uKHRpbWUsIHBvc2l0aW9uLCBzcGVlZCksIGNhbGxlZCB0byBnZW5lcmF0ZSBuZXh0IGV2ZW50IGF0IGdpdmVuIHRpbWUgYW5kIHBvc2l0aW9uLCByZXR1cm5zIG5leHQgcG9zaXRpb25cclxuICAgKlxyXG4gICAqIEBzdGF0aWNcclxuICAgKiBAbWVtYmVyb2YgVGltZUVuZ2luZVxyXG4gICAqL1xyXG4gIHN0YXRpYyBpbXBsZW1lbnRzVHJhbnNwb3J0ZWQoZW5naW5lKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICBlbmdpbmUuc3luY1Bvc2l0aW9uICYmIGVuZ2luZS5zeW5jUG9zaXRpb24gaW5zdGFuY2VvZiBGdW5jdGlvbiAmJlxyXG4gICAgICBlbmdpbmUuYWR2YW5jZVBvc2l0aW9uICYmIGVuZ2luZS5hZHZhbmNlUG9zaXRpb24gaW5zdGFuY2VvZiBGdW5jdGlvblxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHJlc2V0UG9zaXRpb24ocG9zaXRpb24gPSB1bmRlZmluZWQpIHtcclxuICAgIGlmICh0aGlzLm1hc3RlcilcclxuICAgICAgdGhpcy5tYXN0ZXIucmVzZXRFbmdpbmVQb3NpdGlvbih0aGlzLCBwb3NpdGlvbik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTcGVlZC1jb250cm9sbGVkIGludGVyZmFjZVxyXG4gICAqICAgLSBzeW5jU3BlZWQodGltZSwgcG9zaXRpb24sIHNwZWVkLCApLCBjYWxsZWQgdG9cclxuICAgKlxyXG4gICAqIEBzdGF0aWNcclxuICAgKiBAbWVtYmVyb2YgVGltZUVuZ2luZVxyXG4gICAqL1xyXG4gIHN0YXRpYyBpbXBsZW1lbnRzU3BlZWRDb250cm9sbGVkKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIChlbmdpbmUuc3luY1NwZWVkICYmIGVuZ2luZS5zeW5jU3BlZWQgaW5zdGFuY2VvZiBGdW5jdGlvbik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBUaW1lRW5naW5lO1xyXG4iLCJpbXBvcnQgQXVkaW9UaW1lRW5naW5lIGZyb20gJy4uL2NvcmUvYXVkaW8tdGltZS1lbmdpbmUnO1xyXG5cclxuZnVuY3Rpb24gb3B0T3JEZWYob3B0LCBkZWYpIHtcclxuICBpZiAob3B0ICE9PSB1bmRlZmluZWQpXHJcbiAgICByZXR1cm4gb3B0O1xyXG5cclxuICByZXR1cm4gZGVmO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEdyYW51bGFyIHN5bnRoZXNpcyBUaW1lRW5naW5lIGltcGxlbWVudGluZyB0aGUgc2NoZWR1bGVkIGludGVyZmFjZS5cclxuICogVGhlIGdyYWluIHBvc2l0aW9uIChncmFpbiBvbnNldCBvciBjZW50ZXIgdGltZSBpbiB0aGUgYXVkaW8gYnVmZmVyKSBpc1xyXG4gKiBvcHRpb25hbGx5IGRldGVybWluZWQgYnkgdGhlIGVuZ2luZSdzIGN1cnJlbnRQb3NpdGlvbiBhdHRyaWJ1dGUuXHJcbiAqXHJcbiAqIEV4YW1wbGUgdGhhdCBzaG93cyBhIGBHcmFudWxhckVuZ2luZWAgKHdpdGggYSBmZXcgcGFyYW1ldGVyIGNvbnRyb2xzKSBkcml2ZW5cclxuICogYnkgYSBgU2NoZWR1bGVyYCBhbmQgYSBgUGxheUNvbnRyb2xgOlxyXG4gKiB7QGxpbmsgaHR0cHM6Ly9yYXdnaXQuY29tL3dhdmVzanMvd2F2ZXMtYXVkaW8vbWFzdGVyL2V4YW1wbGVzL2dyYW51bGFyLWVuZ2luZS5odG1sfVxyXG4gKlxyXG4gKiBAZXh0ZW5kcyBBdWRpb1RpbWVFbmdpbmVcclxuICogQGV4YW1wbGVcclxuICogaW1wb3J0ICogYXMgYXVkaW8gZnJvbSAnd2F2ZXMtYXVkaW8nO1xyXG4gKiBjb25zdCBzY2hlZHVsZXIgPSBhdWRpby5nZXRTY2hlZHVsZXIoKTtcclxuICogY29uc3QgZ3JhbnVsYXJFbmdpbmUgPSBuZXcgYXVkaW8uR3JhbnVsYXJFbmdpbmUoKTtcclxuICpcclxuICogc2NoZWR1bGVyLmFkZChncmFudWxhckVuZ2luZSk7XHJcbiAqXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zPXt9IC0gUGFyYW1ldGVyc1xyXG4gKiBAcGFyYW0ge0F1ZGlvQnVmZmVyfSBbb3B0aW9ucy5idWZmZXI9bnVsbF0gLSBBdWRpbyBidWZmZXJcclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnBlcmlvZEFicz0wLjAxXSAtIEFic29sdXRlIGdyYWluIHBlcmlvZCBpbiBzZWNcclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnBlcmlvZFJlbD0wXSAtIEdyYWluIHBlcmlvZCByZWxhdGl2ZSB0byBhYnNvbHV0ZVxyXG4gKiAgZHVyYXRpb25cclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnBlcmlvZFZhcj0wXSAtIEFtb3V0IG9mIHJhbmRvbSBncmFpbiBwZXJpb2RcclxuICogIHZhcmlhdGlvbiByZWxhdGl2ZSB0byBncmFpbiBwZXJpb2RcclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnBlcmlvZE1pbj0wLjAwMV0gLSBNaW5pbXVtIGdyYWluIHBlcmlvZFxyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMucG9zaXRpb249MF0gLSBHcmFpbiBwb3NpdGlvbiAob25zZXQgdGltZSBpbiBhdWRpb1xyXG4gKiAgYnVmZmVyKSBpbiBzZWNcclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnBvc2l0aW9uVmFyPTAuMDAzXSAtIEFtb3V0IG9mIHJhbmRvbSBncmFpbiBwb3NpdGlvblxyXG4gKiAgdmFyaWF0aW9uIGluIHNlY1xyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuZHVyYXRpb25BYnM9MC4xXSAtIEFic29sdXRlIGdyYWluIGR1cmF0aW9uIGluIHNlY1xyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuZHVyYXRpb25SZWw9MF0gLSBHcmFpbiBkdXJhdGlvbiByZWxhdGl2ZSB0byBncmFpblxyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuZHVyYXRpb25WYXI9MF0gLSBBbW91dCBvZiByYW5kb20gZ3JhaW4gZHVyYXRpb25cclxuICogIHBlcmlvZCAob3ZlcmxhcClcclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmF0dGFja0Ficz0wXSAtIEFic29sdXRlIGF0dGFjayB0aW1lIGluIHNlY1xyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuYXR0YWNrUmVsPTAuNV0gLSBBdHRhY2sgdGltZSByZWxhdGl2ZSB0byBncmFpbiBkdXJhdGlvblxyXG4gKiBAcGFyYW0ge1N0cmluZ30gW29wdGlvbnMuYXR0YWNrU2hhcGU9J2xpbiddIC0gU2hhcGUgb2YgYXR0YWNrXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5yZWxlYXNlQWJzPTBdIC0gQWJzb2x1dGUgcmVsZWFzZSB0aW1lIGluIHNlY1xyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMucmVsZWFzZVJlbD0wLjVdIC0gUmVsZWFzZSB0aW1lIHJlbGF0aXZlIHRvIGdyYWluIGR1cmF0aW9uXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5yZWxlYXNlU2hhcGU9J2xpbiddIC0gU2hhcGUgb2YgcmVsZWFzZVxyXG4gKiBAcGFyYW0ge1N0cmluZ30gW29wdGlvbnMuZXhwUmFtcE9mZnNldD0wLjAwMDFdIC0gT2Zmc2V0IChzdGFydC9lbmQgdmFsdWUpXHJcbiAqICBmb3IgZXhwb25lbnRpYWwgYXR0YWNrL3JlbGVhc2VcclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnJlc2FtcGxpbmc9MF0gLSBHcmFpbiByZXNhbXBsaW5nIGluIGNlbnRcclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnJlc2FtcGxpbmdWYXI9MF0gLSBBbW91dCBvZiByYW5kb20gcmVzYW1wbGluZyB2YXJpYXRpb24gaW4gY2VudFxyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuZ2Fpbj0xXSAtIExpbmVhciBnYWluIGZhY3RvclxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLmNlbnRlcmVkPXRydWVdIC0gV2hldGhlciB0aGUgZ3JhaW4gcG9zaXRpb24gcmVmZXJzXHJcbiAqICB0byB0aGUgY2VudGVyIG9mIHRoZSBncmFpbiAob3IgdGhlIGJlZ2lubmluZylcclxuICogQHBhcmFtIHtCb29sZWFufSBbb3B0aW9ucy5jeWNsaWM9ZmFsc2VdIC0gV2hldGhlciB0aGUgYXVkaW8gYnVmZmVyIGFuZCBncmFpblxyXG4gKiAgcG9zaXRpb24gYXJlIGNvbnNpZGVyZWQgYXMgY3ljbGljXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy53cmFwQXJvdW5kRXh0ZW5zaW9uPTBdIC0gUG9ydGlvbiBhdCB0aGUgZW5kIG9mIHRoZVxyXG4gKiAgYXVkaW8gYnVmZmVyIHRoYXQgaGFzIGJlZW4gY29waWVkIGZyb20gdGhlIGJlZ2lubmluZyB0byBhc3N1cmUgY3ljbGljIGJlaGF2aW9yXHJcbiAqL1xyXG5jbGFzcyBHcmFudWxhckVuZ2luZSBleHRlbmRzIEF1ZGlvVGltZUVuZ2luZSB7XHJcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XHJcbiAgICBzdXBlcihvcHRpb25zLmF1ZGlvQ29udGV4dCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBdWRpbyBidWZmZXJcclxuICAgICAqXHJcbiAgICAgKiBAdHlwZSB7QXVkaW9CdWZmZXJ9XHJcbiAgICAgKiBAbmFtZSBidWZmZXJcclxuICAgICAqIEBkZWZhdWx0IG51bGxcclxuICAgICAqIEBtZW1iZXJvZiBHcmFudWxhckVuZ2luZVxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuYnVmZmVyID0gb3B0T3JEZWYob3B0aW9ucy5idWZmZXIsIG51bGwpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWJzb2x1dGUgZ3JhaW4gcGVyaW9kIGluIHNlY1xyXG4gICAgICpcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAbmFtZSBwZXJpb2RBYnNcclxuICAgICAqIEBkZWZhdWx0IDAuMDFcclxuICAgICAqIEBtZW1iZXJvZiBHcmFudWxhckVuZ2luZVxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHRoaXMucGVyaW9kQWJzID0gb3B0T3JEZWYob3B0aW9ucy5wZXJpb2RBYnMsIDAuMDEpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogR3JhaW4gcGVyaW9kIHJlbGF0aXZlIHRvIGFic29sdXRlIGR1cmF0aW9uXHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBuYW1lIHBlcmlvZFJlbFxyXG4gICAgICogQGRlZmF1bHQgMFxyXG4gICAgICogQG1lbWJlcm9mIEdyYW51bGFyRW5naW5lXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5wZXJpb2RSZWwgPSBvcHRPckRlZihvcHRpb25zLnBlcmlvZFJlbCwgMCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBbW91dCBvZiByYW5kb20gZ3JhaW4gcGVyaW9kIHZhcmlhdGlvbiByZWxhdGl2ZSB0byBncmFpbiBwZXJpb2RcclxuICAgICAqXHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQG5hbWUgcGVyaW9kVmFyXHJcbiAgICAgKiBAZGVmYXVsdCAwXHJcbiAgICAgKiBAbWVtYmVyb2YgR3JhbnVsYXJFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLnBlcmlvZFZhciA9IG9wdE9yRGVmKG9wdGlvbnMucGVyaW9kVmFyLCAwKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1pbmltdW0gZ3JhaW4gcGVyaW9kXHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBuYW1lIHBlcmlvZE1pblxyXG4gICAgICogQGRlZmF1bHQgMC4wMDFcclxuICAgICAqIEBtZW1iZXJvZiBHcmFudWxhckVuZ2luZVxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHRoaXMucGVyaW9kTWluID0gb3B0T3JEZWYob3B0aW9ucy5wZXJpb2RNaW4sIDAuMDAxKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdyYWluIHBvc2l0aW9uIChvbnNldCB0aW1lIGluIGF1ZGlvIGJ1ZmZlcikgaW4gc2VjXHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBuYW1lIHBvc2l0aW9uXHJcbiAgICAgKiBAZGVmYXVsdCAwXHJcbiAgICAgKiBAbWVtYmVyb2YgR3JhbnVsYXJFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLnBvc2l0aW9uID0gb3B0T3JEZWYob3B0aW9ucy5wb3NpdGlvbiwgMCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBbW91dCBvZiByYW5kb20gZ3JhaW4gcG9zaXRpb24gdmFyaWF0aW9uIGluIHNlY1xyXG4gICAgICpcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAbmFtZSBwb3NpdGlvblZhclxyXG4gICAgICogQGRlZmF1bHQgMC4wMDNcclxuICAgICAqIEBtZW1iZXJvZiBHcmFudWxhckVuZ2luZVxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHRoaXMucG9zaXRpb25WYXIgPSBvcHRPckRlZihvcHRpb25zLnBvc2l0aW9uVmFyLCAwLjAwMyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBYnNvbHV0ZSBncmFpbiBkdXJhdGlvbiBpbiBzZWNcclxuICAgICAqXHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQG5hbWUgZHVyYXRpb25BYnNcclxuICAgICAqIEBkZWZhdWx0IDAuMVxyXG4gICAgICogQG1lbWJlcm9mIEdyYW51bGFyRW5naW5lXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5kdXJhdGlvbkFicyA9IG9wdE9yRGVmKG9wdGlvbnMuZHVyYXRpb25BYnMsIDAuMSk7IC8vIGFic29sdXRlIGdyYWluIGR1cmF0aW9uXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHcmFpbiBkdXJhdGlvbiByZWxhdGl2ZSB0byBncmFpbiBwZXJpb2QgKG92ZXJsYXApXHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBuYW1lIGR1cmF0aW9uUmVsXHJcbiAgICAgKiBAZGVmYXVsdCAwXHJcbiAgICAgKiBAbWVtYmVyb2YgR3JhbnVsYXJFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLmR1cmF0aW9uUmVsID0gb3B0T3JEZWYob3B0aW9ucy5kdXJhdGlvblJlbCwgMCk7XHJcbiAgICBcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBbW91dCBvZiByYW5kb20gZ3JhaW4gZHVyYXRpb24gdmFyaWF0aW9uIGluIHNlY1xyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAgICAgKiBAbmFtZSBkdXJhdGlvblZhclxyXG4gICAgICAgICAqIEBkZWZhdWx0IDBcclxuICAgICAgICAgKiBAbWVtYmVyb2YgR3JhbnVsYXJFbmdpbmVcclxuICAgICAgICAgKiBAaW5zdGFuY2VcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmR1cmF0aW9uVmFyID0gb3B0T3JEZWYob3B0aW9ucy5kdXJhdGlvblZhciwgMCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBYnNvbHV0ZSBhdHRhY2sgdGltZSBpbiBzZWNcclxuICAgICAqXHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQG5hbWUgYXR0YWNrQWJzXHJcbiAgICAgKiBAZGVmYXVsdCAwXHJcbiAgICAgKiBAbWVtYmVyb2YgR3JhbnVsYXJFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLmF0dGFja0FicyA9IG9wdE9yRGVmKG9wdGlvbnMuYXR0YWNrQWJzLCAwKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEF0dGFjayB0aW1lIHJlbGF0aXZlIHRvIGdyYWluIGR1cmF0aW9uXHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBuYW1lIGF0dGFja1JlbFxyXG4gICAgICogQGRlZmF1bHQgMC41XHJcbiAgICAgKiBAbWVtYmVyb2YgR3JhbnVsYXJFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLmF0dGFja1JlbCA9IG9wdE9yRGVmKG9wdGlvbnMuYXR0YWNrUmVsLCAwLjUpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2hhcGUgb2YgYXR0YWNrICgnbGluJyBmb3IgbGluZWFyIHJhbXAsICdleHAnIGZvciBleHBvbmVudGlhbCByYW1wKVxyXG4gICAgICpcclxuICAgICAqIEB0eXBlIHtTdHJpbmd9XHJcbiAgICAgKiBAbmFtZSBhdHRhY2tTaGFwZVxyXG4gICAgICogQGRlZmF1bHQgJ2xpbidcclxuICAgICAqIEBtZW1iZXJvZiBHcmFudWxhckVuZ2luZVxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuYXR0YWNrU2hhcGUgPSBvcHRPckRlZihvcHRpb25zLmF0dGFja1NoYXBlLCAnbGluJyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBYnNvbHV0ZSByZWxlYXNlIHRpbWUgaW4gc2VjXHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBuYW1lIHJlbGVhc2VBYnNcclxuICAgICAqIEBkZWZhdWx0IDBcclxuICAgICAqIEBtZW1iZXJvZiBHcmFudWxhckVuZ2luZVxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVsZWFzZUFicyA9IG9wdE9yRGVmKG9wdGlvbnMucmVsZWFzZUFicywgMCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWxlYXNlIHRpbWUgcmVsYXRpdmUgdG8gZ3JhaW4gZHVyYXRpb25cclxuICAgICAqXHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQG5hbWUgcmVsZWFzZVJlbFxyXG4gICAgICogQGRlZmF1bHQgMC41XHJcbiAgICAgKiBAbWVtYmVyb2YgR3JhbnVsYXJFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLnJlbGVhc2VSZWwgPSBvcHRPckRlZihvcHRpb25zLnJlbGVhc2VSZWwsIDAuNSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaGFwZSBvZiByZWxlYXNlICgnbGluJyBmb3IgbGluZWFyIHJhbXAsICdleHAnIGZvciBleHBvbmVudGlhbCByYW1wKVxyXG4gICAgICpcclxuICAgICAqIEB0eXBlIHtTdHJpbmd9XHJcbiAgICAgKiBAbmFtZSByZWxlYXNlU2hhcGVcclxuICAgICAqIEBkZWZhdWx0ICdsaW4nXHJcbiAgICAgKiBAbWVtYmVyb2YgR3JhbnVsYXJFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLnJlbGVhc2VTaGFwZSA9IG9wdE9yRGVmKG9wdGlvbnMucmVsZWFzZVNoYXBlLCAnbGluJyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPZmZzZXQgKHN0YXJ0L2VuZCB2YWx1ZSkgZm9yIGV4cG9uZW50aWFsIGF0dGFjay9yZWxlYXNlXHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBuYW1lIGV4cFJhbXBPZmZzZXRcclxuICAgICAqIEBkZWZhdWx0IDAuMDAwMVxyXG4gICAgICogQG1lbWJlcm9mIEdyYW51bGFyRW5naW5lXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5leHBSYW1wT2Zmc2V0ID0gb3B0T3JEZWYob3B0aW9ucy5leHBSYW1wT2Zmc2V0LCAwLjAwMDEpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogR3JhaW4gcmVzYW1wbGluZyBpbiBjZW50XHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBuYW1lIHJlc2FtcGxpbmdcclxuICAgICAqIEBkZWZhdWx0IDBcclxuICAgICAqIEBtZW1iZXJvZiBHcmFudWxhckVuZ2luZVxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVzYW1wbGluZyA9IG9wdE9yRGVmKG9wdGlvbnMucmVzYW1wbGluZywgMCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBbW91dCBvZiByYW5kb20gcmVzYW1wbGluZyB2YXJpYXRpb24gaW4gY2VudFxyXG4gICAgICpcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAbmFtZSByZXNhbXBsaW5nVmFyXHJcbiAgICAgKiBAZGVmYXVsdCAwXHJcbiAgICAgKiBAbWVtYmVyb2YgR3JhbnVsYXJFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLnJlc2FtcGxpbmdWYXIgPSBvcHRPckRlZihvcHRpb25zLnJlc2FtcGxpbmdWYXIsIDApO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTGluZWFyIGdhaW4gZmFjdG9yXHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBuYW1lIGdhaW5cclxuICAgICAqIEBkZWZhdWx0IDFcclxuICAgICAqIEBtZW1iZXJvZiBHcmFudWxhckVuZ2luZVxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuZ2FpbiA9IG9wdE9yRGVmKG9wdGlvbnMuZ2FpbiwgMSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGV0aGVyIHRoZSBncmFpbiBwb3NpdGlvbiByZWZlcnMgdG8gdGhlIGNlbnRlciBvZiB0aGUgZ3JhaW4gKG9yIHRoZSBiZWdpbm5pbmcpXHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge0Jvb2xlYW59XHJcbiAgICAgKiBAbmFtZSBjZW50ZXJlZFxyXG4gICAgICogQGRlZmF1bHQgdHJ1ZVxyXG4gICAgICogQG1lbWJlcm9mIEdyYW51bGFyRW5naW5lXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5jZW50ZXJlZCA9IG9wdE9yRGVmKG9wdGlvbnMuY2VudGVyZWQsIHRydWUpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciB0aGUgYXVkaW8gYnVmZmVyIGFuZCBncmFpbiBwb3NpdGlvbiBhcmUgY29uc2lkZXJlZCBhcyBjeWNsaWNcclxuICAgICAqXHJcbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cclxuICAgICAqIEBuYW1lIGN5Y2xpY1xyXG4gICAgICogQGRlZmF1bHQgZmFsc2VcclxuICAgICAqIEBtZW1iZXJvZiBHcmFudWxhckVuZ2luZVxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuY3ljbGljID0gb3B0T3JEZWYob3B0aW9ucy5jeWNsaWMsIGZhbHNlKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFBvcnRpb24gYXQgdGhlIGVuZCBvZiB0aGUgYXVkaW8gYnVmZmVyIHRoYXQgaGFzIGJlZW4gY29waWVkIGZyb20gdGhlXHJcbiAgICAgKiBiZWdpbm5pbmcgdG8gYXNzdXJlIGN5Y2xpYyBiZWhhdmlvclxyXG4gICAgICpcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAbmFtZSB3cmFwQXJvdW5kRXh0ZW5zaW9uXHJcbiAgICAgKiBAZGVmYXVsdCAwXHJcbiAgICAgKiBAbWVtYmVyb2YgR3JhbnVsYXJFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLndyYXBBcm91bmRFeHRlbnNpb24gPSBvcHRPckRlZihvcHRpb25zLndyYXBBcm91bmRFeHRlbnNpb24sIDApO1xyXG5cclxuICAgIHRoaXMub3V0cHV0Tm9kZSA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBidWZmZXIgZHVyYXRpb24gKGV4Y2x1ZGluZyB3cmFwQXJvdW5kRXh0ZW5zaW9uKVxyXG4gICAqXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKiBAbmFtZSBidWZmZXJEdXJhdGlvblxyXG4gICAqIEBtZW1iZXJvZiBHcmFudWxhckVuZ2luZVxyXG4gICAqIEBpbnN0YW5jZVxyXG4gICAqIEByZWFkb25seVxyXG4gICAqL1xyXG4gIGdldCBidWZmZXJEdXJhdGlvbigpIHtcclxuICAgIGlmICh0aGlzLmJ1ZmZlcikge1xyXG4gICAgICB2YXIgYnVmZmVyRHVyYXRpb24gPSB0aGlzLmJ1ZmZlci5kdXJhdGlvbjtcclxuXHJcbiAgICAgIGlmICh0aGlzLndyYXBBcm91bmRFeHRlbnNpb24pXHJcbiAgICAgICAgYnVmZmVyRHVyYXRpb24gLT0gdGhpcy53cmFwQXJvdW5kRXh0ZW5zaW9uO1xyXG5cclxuICAgICAgcmV0dXJuIGJ1ZmZlckR1cmF0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3VycmVudCBwb3NpdGlvblxyXG4gICAqXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKiBAbmFtZSBjdXJyZW50UG9zaXRpb25cclxuICAgKiBAbWVtYmVyb2YgR3JhbnVsYXJFbmdpbmVcclxuICAgKiBAaW5zdGFuY2VcclxuICAgKiBAcmVhZG9ubHlcclxuICAgKi9cclxuICBnZXQgY3VycmVudFBvc2l0aW9uKCkge1xyXG4gICAgdmFyIG1hc3RlciA9IHRoaXMubWFzdGVyO1xyXG5cclxuICAgIGlmIChtYXN0ZXIgJiYgbWFzdGVyLmN1cnJlbnRQb3NpdGlvbiAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICByZXR1cm4gbWFzdGVyLmN1cnJlbnRQb3NpdGlvbjtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5wb3NpdGlvbjtcclxuICB9XHJcblxyXG4gIGFkdmFuY2VUaW1lKHRpbWUpIHtcclxuICAgIHRpbWUgPSBNYXRoLm1heCh0aW1lLCB0aGlzLmF1ZGlvQ29udGV4dC5jdXJyZW50VGltZSk7XHJcbiAgICByZXR1cm4gdGltZSArIHRoaXMudHJpZ2dlcih0aW1lKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyaWdnZXIgYSBncmFpbi4gVGhpcyBmdW5jdGlvbiBjYW4gYmUgY2FsbGVkIGF0IGFueSB0aW1lICh3aGV0aGVyIHRoZVxyXG4gICAqIGVuZ2luZSBpcyBzY2hlZHVsZWQgb3Igbm90KSB0byBnZW5lcmF0ZSBhIHNpbmdsZSBncmFpbiBhY2NvcmRpbmcgdG8gdGhlXHJcbiAgICogY3VycmVudCBncmFpbiBwYXJhbWV0ZXJzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHRpbWUgLSBncmFpbiBzeW50aGVzaXMgYXVkaW8gdGltZVxyXG4gICAqIEByZXR1cm4ge051bWJlcn0gLSBwZXJpb2QgdG8gbmV4dCBncmFpblxyXG4gICAqL1xyXG4gIHRyaWdnZXIodGltZSkge1xyXG4gICAgdmFyIGF1ZGlvQ29udGV4dCA9IHRoaXMuYXVkaW9Db250ZXh0O1xyXG4gICAgdmFyIGdyYWluVGltZSA9IHRpbWUgfHwgYXVkaW9Db250ZXh0LmN1cnJlbnRUaW1lO1xyXG4gICAgdmFyIGdyYWluUGVyaW9kID0gdGhpcy5wZXJpb2RBYnM7XHJcbiAgICB2YXIgZ3JhaW5Qb3NpdGlvbiA9IHRoaXMuY3VycmVudFBvc2l0aW9uO1xyXG4gICAgdmFyIGdyYWluRHVyYXRpb24gPSB0aGlzLmR1cmF0aW9uQWJzO1xyXG5cclxuICAgIGlmICh0aGlzLmJ1ZmZlcikge1xyXG4gICAgICB2YXIgcmVzYW1wbGluZ1JhdGUgPSAxLjA7XHJcblxyXG4gICAgICAvLyBjYWxjdWxhdGUgcmVzYW1wbGluZ1xyXG4gICAgICBpZiAodGhpcy5yZXNhbXBsaW5nICE9PSAwIHx8IHRoaXMucmVzYW1wbGluZ1ZhciA+IDApIHtcclxuICAgICAgICB2YXIgcmFuZG9tUmVzYW1wbGluZyA9IChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIDIuMCAqIHRoaXMucmVzYW1wbGluZ1ZhcjtcclxuICAgICAgICByZXNhbXBsaW5nUmF0ZSA9IE1hdGgucG93KDIuMCwgKHRoaXMucmVzYW1wbGluZyArIHJhbmRvbVJlc2FtcGxpbmcpIC8gMTIwMC4wKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gcmFuZG9taXplIGdyYWluIGR1cmF0aW9uXHJcbiAgICAgIGlmICh0aGlzLmR1cmF0aW9uVmFyID4gMCkgZ3JhaW5EdXJhdGlvbiArPSAoMi4wICogTWF0aC5yYW5kb20oKSAtIDEpICogdGhpcy5kdXJhdGlvblZhcjtcclxuXHJcbiAgICAgIGdyYWluUGVyaW9kICs9IHRoaXMucGVyaW9kUmVsICogZ3JhaW5EdXJhdGlvbjtcclxuICAgICAgZ3JhaW5EdXJhdGlvbiArPSB0aGlzLmR1cmF0aW9uUmVsICogZ3JhaW5QZXJpb2Q7XHJcblxyXG4gICAgICAvLyBncmFpbiBwZXJpb2QgcmFuZG9uIHZhcmlhdGlvblxyXG4gICAgICBpZiAodGhpcy5wZXJpb2RWYXIgPiAwLjApXHJcbiAgICAgICAgZ3JhaW5QZXJpb2QgKz0gMi4wICogKE1hdGgucmFuZG9tKCkgLSAwLjUpICogdGhpcy5wZXJpb2RWYXIgKiBncmFpblBlcmlvZDtcclxuXHJcbiAgICAgIC8vIGNlbnRlciBncmFpblxyXG4gICAgICBpZiAodGhpcy5jZW50ZXJlZClcclxuICAgICAgICBncmFpblBvc2l0aW9uIC09IDAuNSAqIGdyYWluRHVyYXRpb247XHJcblxyXG4gICAgICAvLyByYW5kb21pemUgZ3JhaW4gcG9zaXRpb25cclxuICAgICAgaWYgKHRoaXMucG9zaXRpb25WYXIgPiAwKVxyXG4gICAgICAgIGdyYWluUG9zaXRpb24gKz0gKDIuMCAqIE1hdGgucmFuZG9tKCkgLSAxKSAqIHRoaXMucG9zaXRpb25WYXI7XHJcblxyXG4gICAgICB2YXIgYnVmZmVyRHVyYXRpb24gPSB0aGlzLmJ1ZmZlckR1cmF0aW9uO1xyXG5cclxuICAgICAgLy8gd3JhcCBvciBjbGlwIGdyYWluIHBvc2l0aW9uIGFuZCBkdXJhdGlvbiBpbnRvIGJ1ZmZlciBkdXJhdGlvblxyXG4gICAgICBpZiAoZ3JhaW5Qb3NpdGlvbiA8IDAgfHwgZ3JhaW5Qb3NpdGlvbiA+PSBidWZmZXJEdXJhdGlvbikge1xyXG4gICAgICAgIGlmICh0aGlzLmN5Y2xpYykge1xyXG4gICAgICAgICAgdmFyIGN5Y2xlcyA9IGdyYWluUG9zaXRpb24gLyBidWZmZXJEdXJhdGlvbjtcclxuICAgICAgICAgIGdyYWluUG9zaXRpb24gPSAoY3ljbGVzIC0gTWF0aC5mbG9vcihjeWNsZXMpKSAqIGJ1ZmZlckR1cmF0aW9uO1xyXG5cclxuICAgICAgICAgIGlmIChncmFpblBvc2l0aW9uICsgZ3JhaW5EdXJhdGlvbiA+IHRoaXMuYnVmZmVyLmR1cmF0aW9uKVxyXG4gICAgICAgICAgICBncmFpbkR1cmF0aW9uID0gdGhpcy5idWZmZXIuZHVyYXRpb24gLSBncmFpblBvc2l0aW9uO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAoZ3JhaW5Qb3NpdGlvbiA8IDApIHtcclxuICAgICAgICAgICAgZ3JhaW5UaW1lIC09IGdyYWluUG9zaXRpb247XHJcbiAgICAgICAgICAgIGdyYWluRHVyYXRpb24gKz0gZ3JhaW5Qb3NpdGlvbjtcclxuICAgICAgICAgICAgZ3JhaW5Qb3NpdGlvbiA9IDA7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKGdyYWluUG9zaXRpb24gKyBncmFpbkR1cmF0aW9uID4gYnVmZmVyRHVyYXRpb24pXHJcbiAgICAgICAgICAgIGdyYWluRHVyYXRpb24gPSBidWZmZXJEdXJhdGlvbiAtIGdyYWluUG9zaXRpb247XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBtYWtlIGdyYWluXHJcbiAgICAgIGlmICh0aGlzLmdhaW4gPiAwICYmIGdyYWluRHVyYXRpb24gPj0gMC4wMDEpIHtcclxuICAgICAgICAvLyBtYWtlIGdyYWluIGVudmVsb3BlXHJcbiAgICAgICAgdmFyIGVudmVsb3BlID0gYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKTtcclxuICAgICAgICB2YXIgYXR0YWNrID0gdGhpcy5hdHRhY2tBYnMgKyB0aGlzLmF0dGFja1JlbCAqIGdyYWluRHVyYXRpb247XHJcbiAgICAgICAgdmFyIHJlbGVhc2UgPSB0aGlzLnJlbGVhc2VBYnMgKyB0aGlzLnJlbGVhc2VSZWwgKiBncmFpbkR1cmF0aW9uO1xyXG5cclxuICAgICAgICBpZiAoYXR0YWNrICsgcmVsZWFzZSA+IGdyYWluRHVyYXRpb24pIHtcclxuICAgICAgICAgIHZhciBmYWN0b3IgPSBncmFpbkR1cmF0aW9uIC8gKGF0dGFjayArIHJlbGVhc2UpO1xyXG4gICAgICAgICAgYXR0YWNrICo9IGZhY3RvcjtcclxuICAgICAgICAgIHJlbGVhc2UgKj0gZmFjdG9yO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGF0dGFja0VuZFRpbWUgPSBncmFpblRpbWUgKyBhdHRhY2s7XHJcbiAgICAgICAgdmFyIGdyYWluRW5kVGltZSA9IGdyYWluVGltZSArIGdyYWluRHVyYXRpb24gLyByZXNhbXBsaW5nUmF0ZTtcclxuICAgICAgICB2YXIgcmVsZWFzZVN0YXJ0VGltZSA9IGdyYWluRW5kVGltZSAtIHJlbGVhc2U7XHJcblxyXG4gICAgICAgIGVudmVsb3BlLmdhaW4udmFsdWUgPSAwO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5hdHRhY2tTaGFwZSA9PT0gJ2xpbicpIHtcclxuICAgICAgICAgIGVudmVsb3BlLmdhaW4uc2V0VmFsdWVBdFRpbWUoMC4wLCBncmFpblRpbWUpO1xyXG4gICAgICAgICAgZW52ZWxvcGUuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSh0aGlzLmdhaW4sIGF0dGFja0VuZFRpbWUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBlbnZlbG9wZS5nYWluLnNldFZhbHVlQXRUaW1lKHRoaXMuZXhwUmFtcE9mZnNldCwgZ3JhaW5UaW1lKTtcclxuICAgICAgICAgIGVudmVsb3BlLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSh0aGlzLmdhaW4sIGF0dGFja0VuZFRpbWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlbGVhc2VTdGFydFRpbWUgPiBhdHRhY2tFbmRUaW1lKVxyXG4gICAgICAgICAgZW52ZWxvcGUuZ2Fpbi5zZXRWYWx1ZUF0VGltZSh0aGlzLmdhaW4sIHJlbGVhc2VTdGFydFRpbWUpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5yZWxlYXNlU2hhcGUgPT09ICdsaW4nKSB7XHJcbiAgICAgICAgICBlbnZlbG9wZS5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDAuMCwgZ3JhaW5FbmRUaW1lKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZW52ZWxvcGUuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKHRoaXMuZXhwUmFtcE9mZnNldCwgZ3JhaW5FbmRUaW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVudmVsb3BlLmNvbm5lY3QodGhpcy5vdXRwdXROb2RlKTtcclxuXHJcbiAgICAgICAgLy8gbWFrZSBzb3VyY2VcclxuICAgICAgICB2YXIgc291cmNlID0gYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG5cclxuICAgICAgICBzb3VyY2UuYnVmZmVyID0gdGhpcy5idWZmZXI7XHJcbiAgICAgICAgc291cmNlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IHJlc2FtcGxpbmdSYXRlO1xyXG4gICAgICAgIHNvdXJjZS5jb25uZWN0KGVudmVsb3BlKTtcclxuXHJcbiAgICAgICAgc291cmNlLnN0YXJ0KGdyYWluVGltZSwgZ3JhaW5Qb3NpdGlvbik7XHJcbiAgICAgICAgc291cmNlLnN0b3AoZ3JhaW5FbmRUaW1lKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBNYXRoLm1heCh0aGlzLnBlcmlvZE1pbiwgZ3JhaW5QZXJpb2QpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgR3JhbnVsYXJFbmdpbmU7XHJcbiIsImltcG9ydCBBdWRpb1RpbWVFbmdpbmUgZnJvbSAnLi4vY29yZS9hdWRpby10aW1lLWVuZ2luZSc7XHJcblxyXG5mdW5jdGlvbiBvcHRPckRlZihvcHQsIGRlZikge1xyXG4gIGlmKG9wdCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgcmV0dXJuIG9wdDtcclxuXHJcbiAgcmV0dXJuIGRlZjtcclxufVxyXG5cclxuLyoqXHJcbiAqIE1ldHJvbm9tZSBhdWRpbyBlbmdpbmUuIEl0IGV4dGVuZHMgVGltZSBFbmdpbmUgYXMgYSB0cmFuc3BvcnRlZCBpbnRlcmZhY2UuXHJcbiAqIFtleGFtcGxlXXtAbGluayBodHRwczovL3Jhd2dpdC5jb20vd2F2ZXNqcy93YXZlcy1hdWRpby9tYXN0ZXIvZXhhbXBsZXMvbWV0cm9ub21lLmh0bWx9XHJcbiAqXHJcbiAqIEBleHRlbmRzIEF1ZGlvVGltZUVuZ2luZVxyXG4gKiBAZXhhbXBsZVxyXG4gKiBpbXBvcnQgKiBhcyBhdWRpbyBmcm9tICd3YXZlcy1hdWRpbyc7XHJcbiAqIGNvbnN0IHNjaGVkdWxlciA9IGF1ZGlvLmdldFNjaGVkdWxlcigpO1xyXG4gKiBjb25zdCBtZXRyb25vbWUgPSBuZXcgYXVkaW8uTWV0cm9ub21lKHtwZXJpb2Q6IDAuMzMzfSk7XHJcbiAqXHJcbiAqIHNjaGVkdWxlci5hZGQobWV0cm9ub21lKTtcclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSAtIERlZmF1bHQgb3B0aW9uc1xyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMucGVyaW9kPTFdIC0gTWV0cm9ub21lIHBlcmlvZFxyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuY2xpY2tGcmVxPTYwMF0gLSBNZXRyb25vbWUgY2xpY2sgZnJlcXVlbmN5XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5jbGlja0F0dGFjaz0wLjAwMl0gLSBNZXRyb25vbWUgY2xpY2sgYXR0YWNrIHRpbWVcclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmNsaWNrUmVsZWFzZT0wLjA5OF0gLSBNZXRyb25vbWUgY2xpY2sgcmVsZWFzZSB0aW1lXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5nYWluPTFdIC0gR2FpblxyXG4gKi9cclxuY2xhc3MgTWV0cm9ub21lIGV4dGVuZHMgQXVkaW9UaW1lRW5naW5lIHtcclxuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcclxuICAgIHN1cGVyKG9wdGlvbnMuYXVkaW9Db250ZXh0KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1ldHJvbm9tZSBwZXJpb2RcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICB0aGlzLl9fcGVyaW9kID0gb3B0T3JEZWYob3B0aW9ucy5wZXJpb2QsIDEpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWV0cm9ub21lIGNsaWNrIGZyZXF1ZW5jeVxyXG4gICAgICpcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAbWVtYmVyb2YgTWV0cm9ub21lXHJcbiAgICAgKiBAbmFtZSBjbGlja0ZyZXFcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLmNsaWNrRnJlcSA9IG9wdE9yRGVmKG9wdGlvbnMuY2xpY2tGcmVxLCA2MDApO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWV0cm9ub21lIGNsaWNrIGF0dGFjayB0aW1lXHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBtZW1iZXJvZiBNZXRyb25vbWVcclxuICAgICAqIEBuYW1lIGNsaWNrQXR0YWNrXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5jbGlja0F0dGFjayA9IG9wdE9yRGVmKG9wdGlvbnMuY2xpY2tBdHRhY2ssIDAuMDAyKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1ldHJvbm9tZSBjbGljayByZWxlYXNlIHRpbWVcclxuICAgICAqXHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQG1lbWJlcm9mIE1ldHJvbm9tZVxyXG4gICAgICogQG5hbWUgY2xpY2tSZWxlYXNlXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5jbGlja1JlbGVhc2UgPSBvcHRPckRlZihvcHRpb25zLmNsaWNrUmVsZWFzZSwgMC4wOTgpO1xyXG5cclxuICAgIHRoaXMuX19sYXN0VGltZSA9IDA7XHJcbiAgICB0aGlzLl9fcGhhc2UgPSAwO1xyXG5cclxuICAgIHRoaXMuX19nYWluTm9kZSA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKTtcclxuICAgIHRoaXMuX19nYWluTm9kZS5nYWluLnZhbHVlID0gb3B0T3JEZWYob3B0aW9ucy5nYWluLCAxKTtcclxuXHJcbiAgICB0aGlzLm91dHB1dE5vZGUgPSB0aGlzLl9fZ2Fpbk5vZGU7XHJcbiAgfVxyXG5cclxuICAvLyBUaW1lRW5naW5lIG1ldGhvZCAoc2NoZWR1bGVkIGludGVyZmFjZSlcclxuICBhZHZhbmNlVGltZSh0aW1lKSB7XHJcbiAgICB0aGlzLnRyaWdnZXIodGltZSk7XHJcbiAgICB0aGlzLl9fbGFzdFRpbWUgPSB0aW1lO1xyXG4gICAgcmV0dXJuIHRpbWUgKyB0aGlzLl9fcGVyaW9kO1xyXG4gIH1cclxuXHJcbiAgLy8gVGltZUVuZ2luZSBtZXRob2QgKHRyYW5zcG9ydGVkIGludGVyZmFjZSlcclxuICBzeW5jUG9zaXRpb24odGltZSwgcG9zaXRpb24sIHNwZWVkKSB7XHJcbiAgICBpZiAodGhpcy5fX3BlcmlvZCA+IDApIHtcclxuICAgICAgdmFyIG5leHRQb3NpdGlvbiA9IChNYXRoLmZsb29yKHBvc2l0aW9uIC8gdGhpcy5fX3BlcmlvZCkgKyB0aGlzLl9fcGhhc2UpICogdGhpcy5fX3BlcmlvZDtcclxuXHJcbiAgICAgIGlmIChzcGVlZCA+IDAgJiYgbmV4dFBvc2l0aW9uIDwgcG9zaXRpb24pXHJcbiAgICAgICAgbmV4dFBvc2l0aW9uICs9IHRoaXMuX19wZXJpb2Q7XHJcbiAgICAgIGVsc2UgaWYgKHNwZWVkIDwgMCAmJiBuZXh0UG9zaXRpb24gPiBwb3NpdGlvbilcclxuICAgICAgICBuZXh0UG9zaXRpb24gLT0gdGhpcy5fX3BlcmlvZDtcclxuXHJcbiAgICAgIHJldHVybiBuZXh0UG9zaXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIEluZmluaXR5ICogc3BlZWQ7XHJcbiAgfVxyXG5cclxuICAvLyBUaW1lRW5naW5lIG1ldGhvZCAodHJhbnNwb3J0ZWQgaW50ZXJmYWNlKVxyXG4gIGFkdmFuY2VQb3NpdGlvbih0aW1lLCBwb3NpdGlvbiwgc3BlZWQpIHtcclxuICAgIHRoaXMudHJpZ2dlcih0aW1lKTtcclxuXHJcbiAgICBpZiAoc3BlZWQgPCAwKVxyXG4gICAgICByZXR1cm4gcG9zaXRpb24gLSB0aGlzLl9fcGVyaW9kO1xyXG5cclxuICAgIHJldHVybiBwb3NpdGlvbiArIHRoaXMuX19wZXJpb2Q7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmlnZ2VyIG1ldHJvbm9tZSBjbGlja1xyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lIG1ldHJvbm9tZSBjbGljayBzeW50aGVzaXMgYXVkaW8gdGltZVxyXG4gICAqL1xyXG4gIHRyaWdnZXIodGltZSkge1xyXG4gICAgY29uc3QgYXVkaW9Db250ZXh0ID0gdGhpcy5hdWRpb0NvbnRleHQ7XHJcbiAgICBjb25zdCBjbGlja0F0dGFjayA9IHRoaXMuY2xpY2tBdHRhY2s7XHJcbiAgICBjb25zdCBjbGlja1JlbGVhc2UgPSB0aGlzLmNsaWNrUmVsZWFzZTtcclxuXHJcbiAgICBjb25zdCBlbnYgPSBhdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpO1xyXG4gICAgZW52LmdhaW4udmFsdWUgPSAwLjA7XHJcbiAgICBlbnYuZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLCB0aW1lKTtcclxuICAgIGVudi5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDEuMCwgdGltZSArIGNsaWNrQXR0YWNrKTtcclxuICAgIGVudi5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoMC4wMDAwMDAxLCB0aW1lICsgY2xpY2tBdHRhY2sgKyBjbGlja1JlbGVhc2UpO1xyXG4gICAgZW52LmdhaW4uc2V0VmFsdWVBdFRpbWUoMCwgdGltZSk7XHJcbiAgICBlbnYuY29ubmVjdCh0aGlzLm91dHB1dE5vZGUpO1xyXG5cclxuICAgIGNvbnN0IG9zYyA9IGF1ZGlvQ29udGV4dC5jcmVhdGVPc2NpbGxhdG9yKCk7XHJcbiAgICBvc2MuZnJlcXVlbmN5LnZhbHVlID0gdGhpcy5jbGlja0ZyZXE7XHJcbiAgICBvc2Muc3RhcnQodGltZSk7XHJcbiAgICBvc2Muc3RvcCh0aW1lICsgY2xpY2tBdHRhY2sgKyBjbGlja1JlbGVhc2UpO1xyXG4gICAgb3NjLmNvbm5lY3QoZW52KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIGxpbmVhciBnYWluIGZhY3RvclxyXG4gICAqXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKiBAbmFtZSBnYWluXHJcbiAgICogQG1lbWJlcm9mIE1ldHJvbm9tZVxyXG4gICAqIEBpbnN0YW5jZVxyXG4gICAqL1xyXG4gIHNldCBnYWluKHZhbHVlKSB7XHJcbiAgICB0aGlzLl9fZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgZ2V0IGdhaW4oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fX2dhaW5Ob2RlLmdhaW4udmFsdWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBtZXRyb25vbWUgcGVyaW9kXHJcbiAgICpcclxuICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAqIEBuYW1lIHBlcmlvZFxyXG4gICAqIEBtZW1iZXJvZiBNZXRyb25vbWVcclxuICAgKiBAaW5zdGFuY2VcclxuICAgKi9cclxuICBzZXQgcGVyaW9kKHBlcmlvZCkge1xyXG4gICAgdGhpcy5fX3BlcmlvZCA9IHBlcmlvZDtcclxuXHJcbiAgICBjb25zdCBtYXN0ZXIgPSB0aGlzLm1hc3RlcjtcclxuXHJcbiAgICBpZiAobWFzdGVyKSB7XHJcbiAgICAgIGlmIChtYXN0ZXIucmVzZXRFbmdpbmVUaW1lKVxyXG4gICAgICAgIG1hc3Rlci5yZXNldEVuZ2luZVRpbWUodGhpcywgdGhpcy5fX2xhc3RUaW1lICsgcGVyaW9kKTtcclxuICAgICAgZWxzZSBpZiAobWFzdGVyLnJlc2V0RW5naW5lUG9zaXRpb24pXHJcbiAgICAgICAgbWFzdGVyLnJlc2V0RW5naW5lUG9zaXRpb24odGhpcyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBnZXQgcGVyaW9kKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX19wZXJpb2Q7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgcGhhc2UgcGFyYW1ldGVyIChhdmFpbGFibGUgb25seSB3aGVuICd0cmFuc3BvcnRlZCcpLCBzaG91bGQgYmVcclxuICAgKiBiZXR3ZWVuIFswLCAxW1xyXG4gICAqXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKiBAbmFtZSBwaGFzZVxyXG4gICAqIEBtZW1iZXJvZiBNZXRyb25vbWVcclxuICAgKiBAaW5zdGFuY2VcclxuICAgKi9cclxuICBzZXQgcGhhc2UocGhhc2UpIHtcclxuICAgIHRoaXMuX19waGFzZSA9IHBoYXNlIC0gTWF0aC5mbG9vcihwaGFzZSk7XHJcblxyXG4gICAgY29uc3QgbWFzdGVyID0gdGhpcy5tYXN0ZXI7XHJcblxyXG4gICAgaWYgKG1hc3RlciAmJiBtYXN0ZXIucmVzZXRFbmdpbmVQb3NpdGlvbiAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICBtYXN0ZXIucmVzZXRFbmdpbmVQb3NpdGlvbih0aGlzKTtcclxuICB9XHJcblxyXG4gIGdldCBwaGFzZSgpIHtcclxuICAgIHJldHVybiB0aGlzLl9fcGhhc2U7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBNZXRyb25vbWU7XHJcbiIsImltcG9ydCBBdWRpb1RpbWVFbmdpbmUgZnJvbSAnLi4vY29yZS9hdWRpby10aW1lLWVuZ2luZSc7XHJcblxyXG5mdW5jdGlvbiBvcHRPckRlZihvcHQsIGRlZikge1xyXG4gIGlmKG9wdCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgcmV0dXJuIG9wdDtcclxuXHJcbiAgcmV0dXJuIGRlZjtcclxufVxyXG5cclxuLyoqXHJcbiAqIFVzZWQgd2l0aCBhIGJ1ZmZlciB0byBzZXJ2ZSBhdWRpbyBmaWxlcy5cclxuICpcclxuICogW2V4YW1wbGVde0BsaW5rIGh0dHBzOi8vcmF3Z2l0LmNvbS93YXZlc2pzL3dhdmVzLWF1ZGlvL21hc3Rlci9leGFtcGxlcy9wbGF5ZXItZW5naW5lLmh0bWx9XHJcbiAqXHJcbiAqIEBleHRlbmRzIEF1ZGlvVGltZUVuZ2luZVxyXG4gKiBAZXhhbXBsZVxyXG4gKiBpbXBvcnQgKiBhcyBhdWRpbyBmcm9tICd3YXZlcy1hdWRpbyc7XHJcbiAqIGNvbnN0IHBsYXllckVuZ2luZSA9IGF1ZGlvLlBsYXllckVuZ2luZSgpO1xyXG4gKiBjb25zdCBwbGF5Q29udHJvbCA9IG5ldyBhdWRpby5QbGF5Q29udHJvbChwbGF5ZXJFbmdpbmUpO1xyXG4gKlxyXG4gKiBwbGF5Q29udHJvbC5zdGFydCgpO1xyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIC0gRGVmYXVsdCBvcHRpb25zXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5idWZmZXI9MV0gLSBBdWRpbyBidWZmZXJcclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmZhZGVUaW1lPTYwMF0gLSBGYWRlIHRpbWUgZm9yIGNoYWluaW5nIHNlZ21lbnRzXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5jeWNsaWM9ZmFsc2VdIC0gTG9vcCBtb2RlXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5nYWluPTFdIC0gR2FpblxyXG4gKi9cclxuY2xhc3MgUGxheWVyRW5naW5lIGV4dGVuZHMgQXVkaW9UaW1lRW5naW5lIHtcclxuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcclxuICAgIHN1cGVyKG9wdGlvbnMuYXVkaW9Db250ZXh0KTtcclxuXHJcbiAgICB0aGlzLnRyYW5zcG9ydCA9IG51bGw7IC8vIHNldCB3aGVuIGFkZGVkIHRvIHRyYW5zcG9ydGVyXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBdWRpbyBidWZmZXJcclxuICAgICAqXHJcbiAgICAgKiBAdHlwZSB7QXVkaW9CdWZmZXJ9XHJcbiAgICAgKiBAbmFtZSBidWZmZXJcclxuICAgICAqIEBtZW1iZXJvZiBQbGF5ZXJFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICogQGRlZmF1bHQgbnVsbFxyXG4gICAgICovXHJcbiAgICB0aGlzLmJ1ZmZlciA9IG9wdE9yRGVmKG9wdGlvbnMuYnVmZmVyLCBudWxsKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZhZGUgdGltZSBmb3IgY2hhaW5pbmcgc2VnbWVudHMgKGUuZy4gaW4gc3RhcnQsIHN0b3AsIGFuZCBzZWVrKVxyXG4gICAgICpcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAbmFtZSBmYWRlVGltZVxyXG4gICAgICogQG1lbWJlcm9mIFBsYXllckVuZ2luZVxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKiBAZGVmYXVsdCAwLjAwNVxyXG4gICAgICovXHJcbiAgICB0aGlzLmZhZGVUaW1lID0gb3B0T3JEZWYob3B0aW9ucy5mYWRlVGltZSwgMC4wMDUpO1xyXG5cclxuICAgIHRoaXMuX190aW1lID0gMDtcclxuICAgIHRoaXMuX19wb3NpdGlvbiA9IDA7XHJcbiAgICB0aGlzLl9fc3BlZWQgPSAwO1xyXG5cclxuICAgIHRoaXMuX19idWZmZXJTb3VyY2UgPSBudWxsO1xyXG4gICAgdGhpcy5fX2Vudk5vZGUgPSBudWxsO1xyXG5cclxuICAgIHRoaXMuX19nYWluTm9kZSA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKTtcclxuICAgIHRoaXMuX19nYWluTm9kZS5nYWluLnZhbHVlID0gb3B0T3JEZWYob3B0aW9ucy5nYWluLCAxKTtcclxuXHJcbiAgICB0aGlzLl9fY3ljbGljID0gb3B0T3JEZWYob3B0aW9ucy5jeWNsaWMsIGZhbHNlKTtcclxuXHJcbiAgICB0aGlzLm91dHB1dE5vZGUgPSB0aGlzLl9fZ2Fpbk5vZGU7XHJcbiAgfVxyXG5cclxuICBfX3N0YXJ0KHRpbWUsIHBvc2l0aW9uLCBzcGVlZCkge1xyXG4gICAgdmFyIGF1ZGlvQ29udGV4dCA9IHRoaXMuYXVkaW9Db250ZXh0O1xyXG5cclxuICAgIGlmICh0aGlzLmJ1ZmZlcikge1xyXG4gICAgICB2YXIgYnVmZmVyRHVyYXRpb24gPSB0aGlzLmJ1ZmZlci5kdXJhdGlvbjtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9fY3ljbGljICYmIChwb3NpdGlvbiA8IDAgfHwgcG9zaXRpb24gPj0gYnVmZmVyRHVyYXRpb24pKSB7XHJcbiAgICAgICAgdmFyIHBoYXNlID0gcG9zaXRpb24gLyBidWZmZXJEdXJhdGlvbjtcclxuICAgICAgICBwb3NpdGlvbiA9IChwaGFzZSAtIE1hdGguZmxvb3IocGhhc2UpKSAqIGJ1ZmZlckR1cmF0aW9uO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAocG9zaXRpb24gPj0gMCAmJiBwb3NpdGlvbiA8IGJ1ZmZlckR1cmF0aW9uICYmIHNwZWVkID4gMCkge1xyXG4gICAgICAgIHRoaXMuX19lbnZOb2RlID0gYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKTtcclxuICAgICAgICB0aGlzLl9fZW52Tm9kZS5nYWluLnNldFZhbHVlQXRUaW1lKDAsIHRpbWUpO1xyXG4gICAgICAgIHRoaXMuX19lbnZOb2RlLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoMSwgdGltZSArIHRoaXMuZmFkZVRpbWUpO1xyXG4gICAgICAgIHRoaXMuX19lbnZOb2RlLmNvbm5lY3QodGhpcy5fX2dhaW5Ob2RlKTtcclxuXHJcbiAgICAgICAgdGhpcy5fX2J1ZmZlclNvdXJjZSA9IGF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuICAgICAgICB0aGlzLl9fYnVmZmVyU291cmNlLmJ1ZmZlciA9IHRoaXMuYnVmZmVyO1xyXG4gICAgICAgIHRoaXMuX19idWZmZXJTb3VyY2UucGxheWJhY2tSYXRlLnZhbHVlID0gc3BlZWQ7XHJcbiAgICAgICAgdGhpcy5fX2J1ZmZlclNvdXJjZS5sb29wID0gdGhpcy5fX2N5Y2xpYztcclxuICAgICAgICB0aGlzLl9fYnVmZmVyU291cmNlLmxvb3BTdGFydCA9IDA7XHJcbiAgICAgICAgdGhpcy5fX2J1ZmZlclNvdXJjZS5sb29wRW5kID0gYnVmZmVyRHVyYXRpb247XHJcbiAgICAgICAgdGhpcy5fX2J1ZmZlclNvdXJjZS5zdGFydCh0aW1lLCBwb3NpdGlvbik7XHJcbiAgICAgICAgdGhpcy5fX2J1ZmZlclNvdXJjZS5jb25uZWN0KHRoaXMuX19lbnZOb2RlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgX19oYWx0KHRpbWUpIHtcclxuICAgIGlmICh0aGlzLl9fYnVmZmVyU291cmNlKSB7XHJcbiAgICAgIHRoaXMuX19lbnZOb2RlLmdhaW4uY2FuY2VsU2NoZWR1bGVkVmFsdWVzKHRpbWUpO1xyXG4gICAgICB0aGlzLl9fZW52Tm9kZS5nYWluLnNldFZhbHVlQXRUaW1lKHRoaXMuX19lbnZOb2RlLmdhaW4udmFsdWUsIHRpbWUpO1xyXG4gICAgICB0aGlzLl9fZW52Tm9kZS5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDAsIHRpbWUgKyB0aGlzLmZhZGVUaW1lKTtcclxuICAgICAgdGhpcy5fX2J1ZmZlclNvdXJjZS5zdG9wKHRpbWUgKyB0aGlzLmZhZGVUaW1lKTtcclxuXHJcbiAgICAgIHRoaXMuX19idWZmZXJTb3VyY2UgPSBudWxsO1xyXG4gICAgICB0aGlzLl9fZW52Tm9kZSA9IG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBUaW1lRW5naW5lIG1ldGhvZCAoc3BlZWQtY29udHJvbGxlZCBpbnRlcmZhY2UpXHJcbiAgc3luY1NwZWVkKHRpbWUsIHBvc2l0aW9uLCBzcGVlZCwgc2VlayA9IGZhbHNlKSB7XHJcbiAgICB2YXIgbGFzdFNwZWVkID0gdGhpcy5fX3NwZWVkO1xyXG5cclxuICAgIGlmIChzcGVlZCAhPT0gbGFzdFNwZWVkIHx8IHNlZWspIHtcclxuICAgICAgaWYgKHNlZWsgfHwgbGFzdFNwZWVkICogc3BlZWQgPCAwKSB7XHJcbiAgICAgICAgdGhpcy5fX2hhbHQodGltZSk7XHJcbiAgICAgICAgdGhpcy5fX3N0YXJ0KHRpbWUsIHBvc2l0aW9uLCBzcGVlZCk7XHJcbiAgICAgIH0gZWxzZSBpZiAobGFzdFNwZWVkID09PSAwIHx8IHNlZWspIHtcclxuICAgICAgICB0aGlzLl9fc3RhcnQodGltZSwgcG9zaXRpb24sIHNwZWVkKTtcclxuICAgICAgfSBlbHNlIGlmIChzcGVlZCA9PT0gMCkge1xyXG4gICAgICAgIHRoaXMuX19oYWx0KHRpbWUpO1xyXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX19idWZmZXJTb3VyY2UpIHtcclxuICAgICAgICB0aGlzLl9fYnVmZmVyU291cmNlLnBsYXliYWNrUmF0ZS5zZXRWYWx1ZUF0VGltZShzcGVlZCwgdGltZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX19zcGVlZCA9IHNwZWVkO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHdoZXRoZXIgdGhlIGF1ZGlvIGJ1ZmZlciBpcyBjb25zaWRlcmVkIGFzIGN5Y2xpY1xyXG4gICAqIEB0eXBlIHtCb29sfVxyXG4gICAqIEBuYW1lIGN5Y2xpY1xyXG4gICAqIEBtZW1iZXJvZiBQbGF5ZXJFbmdpbmVcclxuICAgKiBAaW5zdGFuY2VcclxuICAgKi9cclxuICBzZXQgY3ljbGljKGN5Y2xpYykge1xyXG4gICAgaWYgKGN5Y2xpYyAhPT0gdGhpcy5fX2N5Y2xpYykge1xyXG4gICAgICB2YXIgdGltZSA9IHRoaXMuY3VycmVudFRpbWU7XHJcbiAgICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuY3VycmVudG9zaXRpb247XHJcblxyXG4gICAgICB0aGlzLl9faGFsdCh0aW1lKTtcclxuICAgICAgdGhpcy5fX2N5Y2xpYyA9IGN5Y2xpYztcclxuXHJcbiAgICAgIGlmICh0aGlzLl9fc3BlZWQgIT09IDApXHJcbiAgICAgICAgdGhpcy5fX3N0YXJ0KHRpbWUsIHBvc2l0aW9uLCB0aGlzLl9fc3BlZWQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZ2V0IGN5Y2xpYygpIHtcclxuICAgIHJldHVybiB0aGlzLl9fY3ljbGljO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTGluZWFyIGdhaW4gZmFjdG9yXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKiBAbmFtZSBnYWluXHJcbiAgICogQG1lbWJlcm9mIFBsYXllckVuZ2luZVxyXG4gICAqIEBpbnN0YW5jZVxyXG4gICAqL1xyXG4gIHNldCBnYWluKHZhbHVlKSB7XHJcbiAgICB2YXIgdGltZSA9IHRoaXMuY3VycmVudFRpbWU7XHJcbiAgICB0aGlzLl9fZ2Fpbk5vZGUuY2FuY2VsU2NoZWR1bGVkVmFsdWVzKHRpbWUpO1xyXG4gICAgdGhpcy5fX2dhaW5Ob2RlLnNldFZhbHVlQXRUaW1lKHRoaXMuX19nYWluTm9kZS5nYWluLnZhbHVlLCB0aW1lKTtcclxuICAgIHRoaXMuX19nYWluTm9kZS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSgwLCB0aW1lICsgdGhpcy5mYWRlVGltZSk7XHJcbiAgfVxyXG5cclxuICBnZXQgZ2FpbigpIHtcclxuICAgIHJldHVybiB0aGlzLl9fZ2Fpbk5vZGUuZ2Fpbi52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBidWZmZXIgZHVyYXRpb25cclxuICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAqIEBuYW1lIGJ1ZmZlckR1cmF0aW9uXHJcbiAgICogQG1lbWJlcm9mIFBsYXllckVuZ2luZVxyXG4gICAqIEBpbnN0YW5jZVxyXG4gICAqIEByZWFkb25seVxyXG4gICAqL1xyXG4gIGdldCBidWZmZXJEdXJhdGlvbigpIHtcclxuICAgIGlmKHRoaXMuYnVmZmVyKVxyXG4gICAgICByZXR1cm4gdGhpcy5idWZmZXIuZHVyYXRpb247XHJcblxyXG4gICAgcmV0dXJuIDA7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBQbGF5ZXJFbmdpbmU7XHJcbiIsImltcG9ydCBBdWRpb1RpbWVFbmdpbmUgZnJvbSAnLi4vY29yZS9hdWRpby10aW1lLWVuZ2luZSc7XHJcblxyXG5mdW5jdGlvbiBvcHRPckRlZihvcHQsIGRlZikge1xyXG4gIGlmIChvcHQgIT09IHVuZGVmaW5lZClcclxuICAgIHJldHVybiBvcHQ7XHJcblxyXG4gIHJldHVybiBkZWY7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEN1cnJlbnRPclByZXZpb3VzSW5kZXgoc29ydGVkQXJyYXksIHZhbHVlLCBpbmRleCA9IC0xKSB7XHJcbiAgdmFyIHNpemUgPSBzb3J0ZWRBcnJheS5sZW5ndGg7XHJcblxyXG4gIGlmIChzaXplID4gMCkge1xyXG4gICAgdmFyIGZpcnN0VmFsID0gc29ydGVkQXJyYXlbMF07XHJcbiAgICB2YXIgbGFzdFZhbCA9IHNvcnRlZEFycmF5W3NpemUgLSAxXTtcclxuXHJcbiAgICBpZiAodmFsdWUgPCBmaXJzdFZhbClcclxuICAgICAgaW5kZXggPSAtMTtcclxuICAgIGVsc2UgaWYgKHZhbHVlID49IGxhc3RWYWwpXHJcbiAgICAgIGluZGV4ID0gc2l6ZSAtIDE7XHJcbiAgICBlbHNlIHtcclxuICAgICAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSBzaXplKVxyXG4gICAgICAgIGluZGV4ID0gTWF0aC5mbG9vcigoc2l6ZSAtIDEpICogKHZhbHVlIC0gZmlyc3RWYWwpIC8gKGxhc3RWYWwgLSBmaXJzdFZhbCkpO1xyXG5cclxuICAgICAgd2hpbGUgKHNvcnRlZEFycmF5W2luZGV4XSA+IHZhbHVlKVxyXG4gICAgICAgIGluZGV4LS07XHJcblxyXG4gICAgICB3aGlsZSAoc29ydGVkQXJyYXlbaW5kZXggKyAxXSA8PSB2YWx1ZSlcclxuICAgICAgICBpbmRleCsrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGluZGV4O1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRDdXJyZW50T3JOZXh0SW5kZXgoc29ydGVkQXJyYXksIHZhbHVlLCBpbmRleCA9IC0xKSB7XHJcbiAgdmFyIHNpemUgPSBzb3J0ZWRBcnJheS5sZW5ndGg7XHJcblxyXG4gIGlmIChzaXplID4gMCkge1xyXG4gICAgdmFyIGZpcnN0VmFsID0gc29ydGVkQXJyYXlbMF07XHJcbiAgICB2YXIgbGFzdFZhbCA9IHNvcnRlZEFycmF5W3NpemUgLSAxXTtcclxuXHJcbiAgICBpZiAodmFsdWUgPD0gZmlyc3RWYWwpXHJcbiAgICAgIGluZGV4ID0gMDtcclxuICAgIGVsc2UgaWYgKHZhbHVlID49IGxhc3RWYWwpXHJcbiAgICAgIGluZGV4ID0gc2l6ZTtcclxuICAgIGVsc2Uge1xyXG4gICAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHNpemUpXHJcbiAgICAgICAgaW5kZXggPSBNYXRoLmZsb29yKChzaXplIC0gMSkgKiAodmFsdWUgLSBmaXJzdFZhbCkgLyAobGFzdFZhbCAtIGZpcnN0VmFsKSk7XHJcblxyXG4gICAgICB3aGlsZSAoc29ydGVkQXJyYXlbaW5kZXhdIDwgdmFsdWUpXHJcbiAgICAgICAgaW5kZXgrKztcclxuXHJcbiAgICAgIHdoaWxlIChzb3J0ZWRBcnJheVtpbmRleCAtIDFdID49IHZhbHVlKVxyXG4gICAgICAgIGluZGV4LS07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gaW5kZXg7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBVc2VkIHdpdGggYSBidWZmZXIgdG8gc2VydmUgYXVkaW8gZmlsZXMgdmlhIGdyYW51bGFyIHN5bnRoZXNpcy5cclxuICpcclxuICogVGhlIGVuZ2luZSBpbXBsZW1lbnRzIHRoZSBcInNjaGVkdWxlZFwiIGFuZCBcInRyYW5zcG9ydGVkXCIgaW50ZXJmYWNlcy5cclxuICogV2hlbiBcInNjaGVkdWxlZFwiLCB0aGUgZW5naW5lICBnZW5lcmF0ZXMgc2VnbWVudHMgbW9yZSBvciBsZXNzwqBwZXJpb2RpY2FsbHlcclxuICogKGNvbnRyb2xsZWQgYnkgdGhlIHBlcmlvZEFicywgcGVyaW9kUmVsLCBhbmQgcGVyaW9WYXIgYXR0cmlidXRlcykuXHJcbiAqIFdoZW4gXCJ0cmFuc3BvcnRlZFwiLCB0aGUgZW5naW5lIGdlbmVyYXRlcyBzZWdtZW50cyBhdCB0aGUgcG9zaXRpb24gb2YgdGhlaXIgb25zZXQgdGltZS5cclxuICpcclxuICogRXhhbXBsZSB0aGF0IHNob3dzIGEgYFNlZ21lbnRFbmdpbmVgIHdpdGggYSBmZXcgcGFyYW1ldGVyIGNvbnRyb2xzIHJ1bm5pbmcgaW4gYSBgU2NoZWR1bGVyYC5cclxuICoge0BsaW5rIGh0dHBzOi8vcmF3Z2l0LmNvbS93YXZlc2pzL3dhdmVzLWF1ZGlvL21hc3Rlci9leGFtcGxlcy9zZWdtZW50LWVuZ2luZS5odG1sfVxyXG4gKlxyXG4gKiBAZXh0ZW5kcyBBdWRpb1RpbWVFbmdpbmVcclxuICogQGV4YW1wbGVcclxuICogaW1wb3J0ICogYXMgYXVkaW8gZnJvbSAnd2F2ZXMtYXVkaW8nO1xyXG4gKiBjb25zdCBzY2hlZHVsZXIgPSBhdWRpby5nZXRTY2hlZHVsZXIoKTtcclxuICogY29uc3Qgc2VnbWVudEVuZ2luZSA9IG5ldyBhdWRpby5TZWdtZW50RW5naW5lKCk7XHJcbiAqXHJcbiAqIHNjaGVkdWxlci5hZGQoc2VnbWVudEVuZ2luZSk7XHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gLSBEZWZhdWx0IG9wdGlvbnNcclxuICogQHBhcmFtIHtBdWRpb0J1ZmZlcn0gW29wdGlvbnMuYnVmZmVyPW51bGxdIC0gQXVkaW8gYnVmZmVyXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5wZXJpb2RBYnM9MF0gLSBBYnNvbHV0ZSBzZWdtZW50IHBlcmlvZCBpbiBzZWNcclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnBlcmlvZFJlbD0xXSAtIFNlZ21lbnQgcGVyaW9kIHJlbGF0aXZlIHRvIGludGVyLXNlZ21lbnQgZGlzdGFuY2VcclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnBlcmlvZFZhcj0wXSAtIEFtb3V0IG9mIHJhbmRvbSBzZWdtZW50IHBlcmlvZCB2YXJpYXRpb24gcmVsYXRpdmVcclxuICogIHRvIHNlZ21lbnQgcGVyaW9kXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5wZXJpb2RNaW49MC4wMDFdIC0gTWluaW11bSBzZWdtZW50IHBlcmlvZFxyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMucG9zaXRpb25BcnJheT1bMC4wXV0gLSBBcnJheSBvZiBzZWdtZW50IHBvc2l0aW9ucyAob25zZXQgdGltZXNcclxuICogIGluIGF1ZGlvIGJ1ZmZlcikgaW4gc2VjXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5wb3NpdGlvblZhcj0wXSAtIEFtb3V0IG9mIHJhbmRvbSBzZWdtZW50IHBvc2l0aW9uIHZhcmlhdGlvbiBpbiBzZWNcclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmR1cmF0aW9uQXJyYXk9WzAuMF1dIC0gQXJyYXkgb2Ygc2VnbWVudCBkdXJhdGlvbnMgaW4gc2VjXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5kdXJhdGlvbkFicz0wXSAtIEFic29sdXRlIHNlZ21lbnQgZHVyYXRpb24gaW4gc2VjXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5kdXJhdGlvblJlbD0xXSAtIFNlZ21lbnQgZHVyYXRpb24gcmVsYXRpdmUgdG8gZ2l2ZW4gc2VnbWVudFxyXG4gKiAgZHVyYXRpb24gb3IgaW50ZXItc2VnbWVudCBkaXN0YW5jZVxyXG4gKiBAcGFyYW0ge0FycmF5fSBbb3B0aW9ucy5vZmZzZXRBcnJheT1bMC4wXV0gLSBBcnJheSBvZiBzZWdtZW50IG9mZnNldHMgaW4gc2VjXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5vZmZzZXRBYnM9LTAuMDA1XSAtIEFic29sdXRlIHNlZ21lbnQgb2Zmc2V0IGluIHNlY1xyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMub2Zmc2V0UmVsPTBdIC0gU2VnbWVudCBvZmZzZXQgcmVsYXRpdmUgdG8gc2VnbWVudCBkdXJhdGlvblxyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuZGVsYXk9MC4wMDVdIC0gVGltZSBieSB3aGljaCBhbGwgc2VnbWVudHMgYXJlIGRlbGF5ZWQgKGVzcGVjaWFsbHlcclxuICogIHRvIHJlYWxpemUgc2VnbWVudCBvZmZzZXRzKVxyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuYXR0YWNrQWJzPTAuMDA1XSAtIEFic29sdXRlIGF0dGFjayB0aW1lIGluIHNlY1xyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuYXR0YWNrUmVsPTBdIC0gQXR0YWNrIHRpbWUgcmVsYXRpdmUgdG8gc2VnbWVudCBkdXJhdGlvblxyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMucmVsZWFzZUFicz0wLjAwNV0gLSBBYnNvbHV0ZSByZWxlYXNlIHRpbWUgaW4gc2VjXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5yZWxlYXNlUmVsPTBdIC0gUmVsZWFzZSB0aW1lIHJlbGF0aXZlIHRvIHNlZ21lbnQgZHVyYXRpb25cclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnJlc2FtcGxpbmc9MF0gLSBTZWdtZW50IHJlc2FtcGxpbmcgaW4gY2VudFxyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMucmVzYW1wbGluZ1Zhcj0wXSAtIEFtb3V0IG9mIHJhbmRvbSByZXNhbXBsaW5nIHZhcmlhdGlvbiBpbiBjZW50XHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5nYWluPTFdIC0gTGluZWFyIGdhaW4gZmFjdG9yXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5hYm9ydFRpbWU9MC4wMDVdIC0gZmFkZS1vdXQgdGltZSB3aGVuIGFib3J0ZWRcclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnNlZ21lbnRJbmRleD0wXSAtIEluZGV4IG9mIHRoZSBzZWdtZW50IHRvIHN5bnRoZXNpemUgKGkuZS4gb2ZcclxuICogIHRoaXMucG9zaXRpb25BcnJheS9kdXJhdGlvbkFycmF5L29mZnNldEFycmF5KVxyXG4gKiBAcGFyYW0ge0Jvb2x9IFtvcHRpb25zLmN5Y2xpYz1mYWxzZV0gLSBXaGV0aGVyIHRoZSBhdWRpbyBidWZmZXIgYW5kIHNlZ21lbnQgaW5kaWNlcyBhcmVcclxuICogIGNvbnNpZGVyZWQgYXMgY3ljbGljXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy53cmFwQXJvdW5kRXh0ZW5zaW9uPTBdIC0gUG9ydGlvbiBhdCB0aGUgZW5kIG9mIHRoZSBhdWRpbyBidWZmZXJcclxuICogIHRoYXQgaGFzIGJlZW4gY29waWVkIGZyb20gdGhlIGJlZ2lubmluZyB0byBhc3N1cmUgY3ljbGljIGJlaGF2aW9yXHJcbiAqL1xyXG5jbGFzcyBTZWdtZW50RW5naW5lIGV4dGVuZHMgQXVkaW9UaW1lRW5naW5lIHtcclxuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcclxuICAgIHN1cGVyKG9wdGlvbnMuYXVkaW9Db250ZXh0KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEF1ZGlvIGJ1ZmZlclxyXG4gICAgICogQG5hbWUgYnVmZmVyXHJcbiAgICAgKiBAdHlwZSB7QXVkaW9CdWZmZXJ9XHJcbiAgICAgKiBAZGVmYXVsdCBudWxsXHJcbiAgICAgKiBAbWVtYmVyb2YgU2VnbWVudEVuZ2luZVxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuYnVmZmVyID0gb3B0T3JEZWYob3B0aW9ucy5idWZmZXIsIG51bGwpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWJzb2x1dGUgc2VnbWVudCBwZXJpb2QgaW4gc2VjXHJcbiAgICAgKiBAbmFtZSBwZXJpb2RBYnNcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAZGVmYXVsdCAwXHJcbiAgICAgKiBAbWVtYmVyb2YgU2VnbWVudEVuZ2luZVxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHRoaXMucGVyaW9kQWJzID0gb3B0T3JEZWYob3B0aW9ucy5wZXJpb2RBYnMsIDApO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2VnbWVudCBwZXJpb2QgcmVsYXRpdmUgdG8gaW50ZXItc2VnbWVudCBkaXN0YW5jZVxyXG4gICAgICogQG5hbWUgcGVyaW9kUmVsXHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQGRlZmF1bHQgMVxyXG4gICAgICogQG1lbWJlcm9mIFNlZ21lbnRFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLnBlcmlvZFJlbCA9IG9wdE9yRGVmKG9wdGlvbnMucGVyaW9kUmVsLCAxKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFtb3V0IG9mIHJhbmRvbSBzZWdtZW50IHBlcmlvZCB2YXJpYXRpb24gcmVsYXRpdmUgdG8gc2VnbWVudCBwZXJpb2RcclxuICAgICAqIEBuYW1lIHBlcmlvZFZhclxyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBkZWZhdWx0IDBcclxuICAgICAqIEBtZW1iZXJvZiBTZWdtZW50RW5naW5lXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5wZXJpb2RWYXIgPSBvcHRPckRlZihvcHRpb25zLnBlcmlvZFZhciwgMCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNaW5pbXVtIHNlZ21lbnQgcGVyaW9kXHJcbiAgICAgKiBAbmFtZSBwZXJpb2RNaW5cclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAZGVmYXVsdCAwLjAwMVxyXG4gICAgICogQG1lbWJlcm9mIFNlZ21lbnRFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLnBlcmlvZE1pbiA9IG9wdE9yRGVmKG9wdGlvbnMucGVyaW9kTWluLCAwLjAwMSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBcnJheSBvZiBzZWdtZW50IHBvc2l0aW9ucyAob25zZXQgdGltZXMgaW4gYXVkaW8gYnVmZmVyKSBpbiBzZWNcclxuICAgICAqIEBuYW1lIHBvc2l0aW9uQXJyYXlcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAZGVmYXVsdCBbMC4wXVxyXG4gICAgICogQG1lbWJlcm9mIFNlZ21lbnRFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLnBvc2l0aW9uQXJyYXkgPSBvcHRPckRlZihvcHRpb25zLnBvc2l0aW9uQXJyYXksIFswLjBdKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFtb3V0IG9mIHJhbmRvbSBzZWdtZW50IHBvc2l0aW9uIHZhcmlhdGlvbiBpbiBzZWNcclxuICAgICAqIEBuYW1lIHBvc2l0aW9uVmFyXHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQGRlZmF1bHQgMFxyXG4gICAgICogQG1lbWJlcm9mIFNlZ21lbnRFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLnBvc2l0aW9uVmFyID0gb3B0T3JEZWYob3B0aW9ucy5wb3NpdGlvblZhciwgMCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBcnJheSBvZiBzZWdtZW50IGR1cmF0aW9ucyBpbiBzZWNcclxuICAgICAqIEBuYW1lIGR1cmF0aW9uQXJyYXlcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAZGVmYXVsdCBbMC4wXVxyXG4gICAgICogQG1lbWJlcm9mIFNlZ21lbnRFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLmR1cmF0aW9uQXJyYXkgPSBvcHRPckRlZihvcHRpb25zLmR1cmF0aW9uQXJyYXksIFswLjBdKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFic29sdXRlIHNlZ21lbnQgZHVyYXRpb24gaW4gc2VjXHJcbiAgICAgKiBAbmFtZSBkdXJhdGlvbkFic1xyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBkZWZhdWx0IDBcclxuICAgICAqIEBtZW1iZXJvZiBTZWdtZW50RW5naW5lXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5kdXJhdGlvbkFicyA9IG9wdE9yRGVmKG9wdGlvbnMuZHVyYXRpb25BYnMsIDApO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2VnbWVudCBkdXJhdGlvbiByZWxhdGl2ZSB0byBnaXZlbiBzZWdtZW50IGR1cmF0aW9uIG9yIGludGVyLXNlZ21lbnQgZGlzdGFuY2VcclxuICAgICAqIEBuYW1lIGR1cmF0aW9uUmVsXHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQGRlZmF1bHQgMVxyXG4gICAgICogQG1lbWJlcm9mIFNlZ21lbnRFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLmR1cmF0aW9uUmVsID0gb3B0T3JEZWYob3B0aW9ucy5kdXJhdGlvblJlbCwgMSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBcnJheSBvZiBzZWdtZW50IG9mZnNldHMgaW4gc2VjXHJcbiAgICAgKlxyXG4gICAgICogb2Zmc2V0ID4gMDogdGhlIHNlZ21lbnQncyByZWZlcmVuY2UgcG9zaXRpb24gaXMgYWZ0ZXIgdGhlIGdpdmVuIHNlZ21lbnQgcG9zaXRpb25cclxuICAgICAqIG9mZnNldCA8IDA6IHRoZSBnaXZlbiBzZWdtZW50IHBvc2l0aW9uIGlzIHRoZSBzZWdtZW50J3MgcmVmZXJlbmNlIHBvc2l0aW9uXHJcbiAgICAgKiBhbmQgdGhlIGR1cmF0aW9uIGhhcyB0byBiZSBjb3JyZWN0ZWQgYnkgdGhlIG9mZnNldFxyXG4gICAgICpcclxuICAgICAqIEBuYW1lIG9mZnNldEFycmF5XHJcbiAgICAgKiBAdHlwZSB7QXJyYXl9XHJcbiAgICAgKiBAZGVmYXVsdCBbMC4wXVxyXG4gICAgICogQG1lbWJlcm9mIFNlZ21lbnRFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLm9mZnNldEFycmF5ID0gb3B0T3JEZWYob3B0aW9ucy5vZmZzZXRBcnJheSwgWzAuMF0pO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWJzb2x1dGUgc2VnbWVudCBvZmZzZXQgaW4gc2VjXHJcbiAgICAgKiBAbmFtZSBvZmZzZXRBYnNcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAZGVmYXVsdCAtMC4wMDVcclxuICAgICAqIEBtZW1iZXJvZiBTZWdtZW50RW5naW5lXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5vZmZzZXRBYnMgPSBvcHRPckRlZihvcHRpb25zLm9mZnNldEFicywgLTAuMDA1KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNlZ21lbnQgb2Zmc2V0IHJlbGF0aXZlIHRvIHNlZ21lbnQgZHVyYXRpb25cclxuICAgICAqIEBuYW1lIG9mZnNldFJlbFxyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBkZWZhdWx0IDBcclxuICAgICAqIEBtZW1iZXJvZiBTZWdtZW50RW5naW5lXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5vZmZzZXRSZWwgPSBvcHRPckRlZihvcHRpb25zLm9mZnNldFJlbCwgMCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaW1lIGJ5IHdoaWNoIGFsbCBzZWdtZW50cyBhcmUgZGVsYXllZCAoZXNwZWNpYWxseSB0byByZWFsaXplIHNlZ21lbnQgb2Zmc2V0cylcclxuICAgICAqIEBuYW1lIGRlbGF5XHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQGRlZmF1bHQgMC4wMDVcclxuICAgICAqIEBtZW1iZXJvZiBTZWdtZW50RW5naW5lXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5kZWxheSA9IG9wdE9yRGVmKG9wdGlvbnMuZGVsYXksIDAuMDA1KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFic29sdXRlIGF0dGFjayB0aW1lIGluIHNlY1xyXG4gICAgICogQG5hbWUgYXR0YWNrQWJzXHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQGRlZmF1bHQgMC4wMDVcclxuICAgICAqIEBtZW1iZXJvZiBTZWdtZW50RW5naW5lXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5hdHRhY2tBYnMgPSBvcHRPckRlZihvcHRpb25zLmF0dGFja0FicywgMC4wMDUpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0YWNrIHRpbWUgcmVsYXRpdmUgdG8gc2VnbWVudCBkdXJhdGlvblxyXG4gICAgICogQG5hbWUgYXR0YWNrUmVsXHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQGRlZmF1bHQgMFxyXG4gICAgICogQG1lbWJlcm9mIFNlZ21lbnRFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLmF0dGFja1JlbCA9IG9wdE9yRGVmKG9wdGlvbnMuYXR0YWNrUmVsLCAwKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFic29sdXRlIHJlbGVhc2UgdGltZSBpbiBzZWNcclxuICAgICAqIEBuYW1lIHJlbGVhc2VBYnNcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAZGVmYXVsdCAwLjAwNVxyXG4gICAgICogQG1lbWJlcm9mIFNlZ21lbnRFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLnJlbGVhc2VBYnMgPSBvcHRPckRlZihvcHRpb25zLnJlbGVhc2VBYnMsIDAuMDA1KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbGVhc2UgdGltZSByZWxhdGl2ZSB0byBzZWdtZW50IGR1cmF0aW9uXHJcbiAgICAgKiBAbmFtZSByZWxlYXNlUmVsXHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQGRlZmF1bHQgMFxyXG4gICAgICogQG1lbWJlcm9mIFNlZ21lbnRFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLnJlbGVhc2VSZWwgPSBvcHRPckRlZihvcHRpb25zLnJlbGVhc2VSZWwsIDApO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2VnbWVudCByZXNhbXBsaW5nIGluIGNlbnRcclxuICAgICAqIEBuYW1lIHJlc2FtcGxpbmdcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAZGVmYXVsdCAwXHJcbiAgICAgKiBAbWVtYmVyb2YgU2VnbWVudEVuZ2luZVxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVzYW1wbGluZyA9IG9wdE9yRGVmKG9wdGlvbnMucmVzYW1wbGluZywgMCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBbW91dCBvZiByYW5kb20gcmVzYW1wbGluZyB2YXJpYXRpb24gaW4gY2VudFxyXG4gICAgICogQG5hbWUgcmVzYW1wbGluZ1ZhclxyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBkZWZhdWx0IDBcclxuICAgICAqIEBtZW1iZXJvZiBTZWdtZW50RW5naW5lXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5yZXNhbXBsaW5nVmFyID0gb3B0T3JEZWYob3B0aW9ucy5yZXNhbXBsaW5nVmFyLCAwKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIExpbmVhciBnYWluIGZhY3RvclxyXG4gICAgICogQG5hbWUgZ2FpblxyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBkZWZhdWx0IDFcclxuICAgICAqIEBtZW1iZXJvZiBTZWdtZW50RW5naW5lXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5nYWluID0gb3B0T3JEZWYob3B0aW9ucy5nYWluLCAxKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluZGV4IG9mIHRoZSBzZWdtZW50IHRvIHN5bnRoZXNpemUgKGkuZS4gb2YgdGhpcy5wb3NpdGlvbkFycmF5L2R1cmF0aW9uQXJyYXkvb2Zmc2V0QXJyYXkpXHJcbiAgICAgKiBAbmFtZSBzZWdtZW50SW5kZXhcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAZGVmYXVsdCAwXHJcbiAgICAgKiBAbWVtYmVyb2YgU2VnbWVudEVuZ2luZVxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuc2VnbWVudEluZGV4ID0gb3B0T3JEZWYob3B0aW9ucy5zZWdtZW50SW5kZXgsIDApO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciB0aGUgYXVkaW8gYnVmZmVyIGFuZCBzZWdtZW50IGluZGljZXMgYXJlIGNvbnNpZGVyZWQgYXMgY3ljbGljXHJcbiAgICAgKiBAbmFtZSBjeWNsaWNcclxuICAgICAqIEB0eXBlIHtCb29sfVxyXG4gICAgICogQGRlZmF1bHQgZmFsc2VcclxuICAgICAqIEBtZW1iZXJvZiBTZWdtZW50RW5naW5lXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5jeWNsaWMgPSBvcHRPckRlZihvcHRpb25zLmN5Y2xpYywgZmFsc2UpO1xyXG4gICAgdGhpcy5fX2N5Y2xpY09mZnNldCA9IDA7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGV0aGVyIHRoZSBsYXN0IHNlZ21lbnQgaXMgYWJvcnRlZCB3aGVuIHRyaWdnZXJpbmcgdGhlIG5leHRcclxuICAgICAqIEBuYW1lIG1vbm9waG9uaWNcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAZGVmYXVsdCBmYWxzZVxyXG4gICAgICogQG1lbWJlcm9mIFNlZ21lbnRFbmdpbmVcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLm1vbm9waG9uaWMgPSBvcHRPckRlZihvcHRpb25zLm1vbm9waG9uaWMsIGZhbHNlKTtcclxuICAgIHRoaXMuX19jdXJyZW50U3JjID0gbnVsbDtcclxuICAgIHRoaXMuX19jdXJyZW50RW52ID0gbnVsbDtcclxuICAgIHRoaXMuX19yZWxlYXNlU3RhcnRUaW1lID0gMDtcclxuICAgIHRoaXMuX19jdXJyZW50R2FpbiA9IDA7XHJcbiAgICB0aGlzLl9fY3VycmVudEVuZFRpbWUgPSAwO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmFkZS1vdXQgdGltZSAod2hlbiBhYm9ydGVkKVxyXG4gICAgICogQG5hbWUgYWJvcnRUaW1lXHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQGRlZmF1bHQgMC4wMDVcclxuICAgICAqIEBtZW1iZXJvZiBTZWdtZW50RW5naW5lXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5hYm9ydFRpbWUgPSBvcHRPckRlZihvcHRpb25zLmFib3J0VGltZSwgMC4wMDUpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUG9ydGlvbiBhdCB0aGUgZW5kIG9mIHRoZSBhdWRpbyBidWZmZXIgdGhhdCBoYXMgYmVlbiBjb3BpZWQgZnJvbSB0aGUgYmVnaW5uaW5nIHRvIGFzc3VyZSBjeWNsaWMgYmVoYXZpb3JcclxuICAgICAqIEBuYW1lIHdyYXBBcm91bmRFeHRlbnNpb25cclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAZGVmYXVsdCAwXHJcbiAgICAgKiBAbWVtYmVyb2YgU2VnbWVudEVuZ2luZVxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHRoaXMud3JhcEFyb3VuZEV4dGVuc2lvbiA9IG9wdE9yRGVmKG9wdGlvbnMud3JhcEFyb3VuZEV4dGVuc2lvbiwgMCk7XHJcblxyXG4gICAgdGhpcy5vdXRwdXROb2RlID0gdGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IGJ1ZmZlciBkdXJhdGlvbiAoZXhjbHVkaW5nIHdyYXBBcm91bmRFeHRlbnNpb24pXHJcbiAgICpcclxuICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAqIEBkZWZhdWx0IDBcclxuICAgKiBAbWVtYmVyb2YgU2VnbWVudEVuZ2luZVxyXG4gICAqIEBpbnN0YW5jZVxyXG4gICAqL1xyXG4gIGdldCBidWZmZXJEdXJhdGlvbigpIHtcclxuICAgIGlmICh0aGlzLmJ1ZmZlcikge1xyXG4gICAgICB2YXIgYnVmZmVyRHVyYXRpb24gPSB0aGlzLmJ1ZmZlci5kdXJhdGlvbjtcclxuXHJcbiAgICAgIGlmICh0aGlzLndyYXBBcm91bmRFeHRlbnNpb24pXHJcbiAgICAgICAgYnVmZmVyRHVyYXRpb24gLT0gdGhpcy53cmFwQXJvdW5kRXh0ZW5zaW9uO1xyXG5cclxuICAgICAgcmV0dXJuIGJ1ZmZlckR1cmF0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAwO1xyXG4gIH1cclxuXHJcbiAgLy8gVGltZUVuZ2luZSBtZXRob2QgKHRyYW5zcG9ydGVkIGludGVyZmFjZSlcclxuICBhZHZhbmNlVGltZSh0aW1lKSB7XHJcbiAgICB0aW1lID0gTWF0aC5tYXgodGltZSwgdGhpcy5hdWRpb0NvbnRleHQuY3VycmVudFRpbWUpO1xyXG4gICAgcmV0dXJuIHRpbWUgKyB0aGlzLnRyaWdnZXIodGltZSk7XHJcbiAgfVxyXG5cclxuICAvLyBUaW1lRW5naW5lIG1ldGhvZCAodHJhbnNwb3J0ZWQgaW50ZXJmYWNlKVxyXG4gIHN5bmNQb3NpdGlvbih0aW1lLCBwb3NpdGlvbiwgc3BlZWQpIHtcclxuICAgIHZhciBpbmRleCA9IHRoaXMuc2VnbWVudEluZGV4O1xyXG4gICAgdmFyIGN5Y2xpY09mZnNldCA9IDA7XHJcbiAgICB2YXIgYnVmZmVyRHVyYXRpb24gPSB0aGlzLmJ1ZmZlckR1cmF0aW9uO1xyXG5cclxuICAgIGlmICh0aGlzLmN5Y2xpYykge1xyXG4gICAgICB2YXIgY3ljbGVzID0gcG9zaXRpb24gLyBidWZmZXJEdXJhdGlvbjtcclxuXHJcbiAgICAgIGN5Y2xpY09mZnNldCA9IE1hdGguZmxvb3IoY3ljbGVzKSAqIGJ1ZmZlckR1cmF0aW9uO1xyXG4gICAgICBwb3NpdGlvbiAtPSBjeWNsaWNPZmZzZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHNwZWVkID4gMCkge1xyXG4gICAgICBpbmRleCA9IGdldEN1cnJlbnRPck5leHRJbmRleCh0aGlzLnBvc2l0aW9uQXJyYXksIHBvc2l0aW9uKTtcclxuXHJcbiAgICAgIGlmIChpbmRleCA+PSB0aGlzLnBvc2l0aW9uQXJyYXkubGVuZ3RoKSB7XHJcbiAgICAgICAgaW5kZXggPSAwO1xyXG4gICAgICAgIGN5Y2xpY09mZnNldCArPSBidWZmZXJEdXJhdGlvbjtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmN5Y2xpYylcclxuICAgICAgICAgIHJldHVybiBJbmZpbml0eTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChzcGVlZCA8IDApIHtcclxuICAgICAgaW5kZXggPSBnZXRDdXJyZW50T3JQcmV2aW91c0luZGV4KHRoaXMucG9zaXRpb25BcnJheSwgcG9zaXRpb24pO1xyXG5cclxuICAgICAgaWYgKGluZGV4IDwgMCkge1xyXG4gICAgICAgIGluZGV4ID0gdGhpcy5wb3NpdGlvbkFycmF5Lmxlbmd0aCAtIDE7XHJcbiAgICAgICAgY3ljbGljT2Zmc2V0IC09IGJ1ZmZlckR1cmF0aW9uO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuY3ljbGljKVxyXG4gICAgICAgICAgcmV0dXJuIC1JbmZpbml0eTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIEluZmluaXR5O1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc2VnbWVudEluZGV4ID0gaW5kZXg7XHJcbiAgICB0aGlzLl9fY3ljbGljT2Zmc2V0ID0gY3ljbGljT2Zmc2V0O1xyXG5cclxuICAgIHJldHVybiBjeWNsaWNPZmZzZXQgKyB0aGlzLnBvc2l0aW9uQXJyYXlbaW5kZXhdO1xyXG4gIH1cclxuXHJcbiAgLy8gVGltZUVuZ2luZSBtZXRob2QgKHRyYW5zcG9ydGVkIGludGVyZmFjZSlcclxuICBhZHZhbmNlUG9zaXRpb24odGltZSwgcG9zaXRpb24sIHNwZWVkKSB7XHJcbiAgICB2YXIgaW5kZXggPSB0aGlzLnNlZ21lbnRJbmRleDtcclxuICAgIHZhciBjeWNsaWNPZmZzZXQgPSB0aGlzLl9fY3ljbGljT2Zmc2V0O1xyXG5cclxuICAgIHRoaXMudHJpZ2dlcih0aW1lKTtcclxuXHJcbiAgICBpZiAoc3BlZWQgPiAwKSB7XHJcbiAgICAgIGluZGV4Kys7XHJcblxyXG4gICAgICBpZiAoaW5kZXggPj0gdGhpcy5wb3NpdGlvbkFycmF5Lmxlbmd0aCkge1xyXG4gICAgICAgIGluZGV4ID0gMDtcclxuICAgICAgICBjeWNsaWNPZmZzZXQgKz0gdGhpcy5idWZmZXJEdXJhdGlvbjtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmN5Y2xpYylcclxuICAgICAgICAgIHJldHVybiBJbmZpbml0eTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaW5kZXgtLTtcclxuXHJcbiAgICAgIGlmIChpbmRleCA8IDApIHtcclxuICAgICAgICBpbmRleCA9IHRoaXMucG9zaXRpb25BcnJheS5sZW5ndGggLSAxO1xyXG4gICAgICAgIGN5Y2xpY09mZnNldCAtPSB0aGlzLmJ1ZmZlckR1cmF0aW9uO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuY3ljbGljKVxyXG4gICAgICAgICAgcmV0dXJuIC1JbmZpbml0eTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc2VnbWVudEluZGV4ID0gaW5kZXg7XHJcbiAgICB0aGlzLl9fY3ljbGljT2Zmc2V0ID0gY3ljbGljT2Zmc2V0O1xyXG5cclxuICAgIHJldHVybiBjeWNsaWNPZmZzZXQgKyB0aGlzLnBvc2l0aW9uQXJyYXlbaW5kZXhdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJpZ2dlciBhIHNlZ21lbnQuXHJcbiAgICogVGhpcyBmdW5jdGlvbiBjYW4gYmUgY2FsbGVkIGF0IGFueSB0aW1lICh3aGV0aGVyIHRoZSBlbmdpbmUgaXMgc2NoZWR1bGVkL3RyYW5zcG9ydGVkIG9yIG5vdClcclxuICAgKiB0byBnZW5lcmF0ZSBhIHNpbmdsZSBzZWdtZW50IGFjY29yZGluZyB0byB0aGUgY3VycmVudCBzZWdtZW50IHBhcmFtZXRlcnMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge051bWJlcn0gdGltZSBzZWdtZW50IHN5bnRoZXNpcyBhdWRpbyB0aW1lXHJcbiAgICogQHJldHVybiB7TnVtYmVyfSBwZXJpb2QgdG8gbmV4dCBzZWdtZW50XHJcbiAgICovXHJcbiAgdHJpZ2dlcih0aW1lKSB7XHJcbiAgICB2YXIgYXVkaW9Db250ZXh0ID0gdGhpcy5hdWRpb0NvbnRleHQ7XHJcbiAgICB2YXIgc2VnbWVudFRpbWUgPSAodGltZSB8fCBhdWRpb0NvbnRleHQuY3VycmVudFRpbWUpICsgdGhpcy5kZWxheTtcclxuICAgIHZhciBzZWdtZW50UGVyaW9kID0gdGhpcy5wZXJpb2RBYnM7XHJcbiAgICB2YXIgc2VnbWVudEluZGV4ID0gdGhpcy5zZWdtZW50SW5kZXg7XHJcblxyXG4gICAgaWYgKHRoaXMuYnVmZmVyKSB7XHJcbiAgICAgIHZhciBzZWdtZW50UG9zaXRpb24gPSAwLjA7XHJcbiAgICAgIHZhciBzZWdtZW50RHVyYXRpb24gPSAwLjA7XHJcbiAgICAgIHZhciBzZWdtZW50T2Zmc2V0ID0gMC4wO1xyXG4gICAgICB2YXIgcmVzYW1wbGluZ1JhdGUgPSAxLjA7XHJcbiAgICAgIHZhciBidWZmZXJEdXJhdGlvbiA9IHRoaXMuYnVmZmVyRHVyYXRpb247XHJcblxyXG4gICAgICBpZiAodGhpcy5jeWNsaWMpXHJcbiAgICAgICAgc2VnbWVudEluZGV4ID0gc2VnbWVudEluZGV4ICUgdGhpcy5wb3NpdGlvbkFycmF5Lmxlbmd0aDtcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHNlZ21lbnRJbmRleCA9IE1hdGgubWF4KDAsIE1hdGgubWluKHNlZ21lbnRJbmRleCwgdGhpcy5wb3NpdGlvbkFycmF5Lmxlbmd0aCAtIDEpKTtcclxuXHJcbiAgICAgIGlmICh0aGlzLnBvc2l0aW9uQXJyYXkpXHJcbiAgICAgICAgc2VnbWVudFBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbkFycmF5W3NlZ21lbnRJbmRleF0gfHwgMDtcclxuXHJcbiAgICAgIGlmICh0aGlzLmR1cmF0aW9uQXJyYXkpXHJcbiAgICAgICAgc2VnbWVudER1cmF0aW9uID0gdGhpcy5kdXJhdGlvbkFycmF5W3NlZ21lbnRJbmRleF0gfHwgMDtcclxuXHJcbiAgICAgIGlmICh0aGlzLm9mZnNldEFycmF5KVxyXG4gICAgICAgIHNlZ21lbnRPZmZzZXQgPSB0aGlzLm9mZnNldEFycmF5W3NlZ21lbnRJbmRleF0gfHwgMDtcclxuXHJcbiAgICAgIC8vIGNhbGN1bGF0ZSByZXNhbXBsaW5nXHJcbiAgICAgIGlmICh0aGlzLnJlc2FtcGxpbmcgIT09IDAgfHwgdGhpcy5yZXNhbXBsaW5nVmFyID4gMCkge1xyXG4gICAgICAgIHZhciByYW5kb21SZXNhbXBsaW5nID0gKE1hdGgucmFuZG9tKCkgLSAwLjUpICogMi4wICogdGhpcy5yZXNhbXBsaW5nVmFyO1xyXG4gICAgICAgIHJlc2FtcGxpbmdSYXRlID0gTWF0aC5wb3coMi4wLCAodGhpcy5yZXNhbXBsaW5nICsgcmFuZG9tUmVzYW1wbGluZykgLyAxMjAwLjApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBjYWxjdWxhdGUgaW50ZXItc2VnbWVudCBkaXN0YW5jZVxyXG4gICAgICBpZiAoc2VnbWVudER1cmF0aW9uID09PSAwIHx8IHRoaXMucGVyaW9kUmVsID4gMCkge1xyXG4gICAgICAgIHZhciBuZXh0U2VnbWVudEluZGV4ID0gc2VnbWVudEluZGV4ICsgMTtcclxuICAgICAgICB2YXIgbmV4dFBvc2l0aW9uLCBuZXh0T2Zmc2V0O1xyXG5cclxuICAgICAgICBpZiAobmV4dFNlZ21lbnRJbmRleCA9PT0gdGhpcy5wb3NpdGlvbkFycmF5Lmxlbmd0aCkge1xyXG4gICAgICAgICAgaWYgKHRoaXMuY3ljbGljKSB7XHJcbiAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IHRoaXMucG9zaXRpb25BcnJheVswXSArIGJ1ZmZlckR1cmF0aW9uO1xyXG4gICAgICAgICAgICBuZXh0T2Zmc2V0ID0gdGhpcy5vZmZzZXRBcnJheVswXTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG5leHRQb3NpdGlvbiA9IGJ1ZmZlckR1cmF0aW9uO1xyXG4gICAgICAgICAgICBuZXh0T2Zmc2V0ID0gMDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgbmV4dFBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbkFycmF5W25leHRTZWdtZW50SW5kZXhdO1xyXG4gICAgICAgICAgbmV4dE9mZnNldCA9IHRoaXMub2Zmc2V0QXJyYXlbbmV4dFNlZ21lbnRJbmRleF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgaW50ZXJTZWdtZW50RGlzdGFuY2UgPSBuZXh0UG9zaXRpb24gLSBzZWdtZW50UG9zaXRpb247XHJcblxyXG4gICAgICAgIC8vIGNvcnJlY3QgaW50ZXItc2VnbWVudCBkaXN0YW5jZSBieSBvZmZzZXRzXHJcbiAgICAgICAgLy8gICBvZmZzZXQgPiAwOiB0aGUgc2VnbWVudCdzIHJlZmVyZW5jZSBwb3NpdGlvbiBpcyBhZnRlciB0aGUgZ2l2ZW4gc2VnbWVudCBwb3NpdGlvblxyXG4gICAgICAgIGlmIChzZWdtZW50T2Zmc2V0ID4gMClcclxuICAgICAgICAgIGludGVyU2VnbWVudERpc3RhbmNlIC09IHNlZ21lbnRPZmZzZXQ7XHJcblxyXG4gICAgICAgIGlmIChuZXh0T2Zmc2V0ID4gMClcclxuICAgICAgICAgIGludGVyU2VnbWVudERpc3RhbmNlICs9IG5leHRPZmZzZXQ7XHJcblxyXG4gICAgICAgIGlmIChpbnRlclNlZ21lbnREaXN0YW5jZSA8IDApXHJcbiAgICAgICAgICBpbnRlclNlZ21lbnREaXN0YW5jZSA9IDA7XHJcblxyXG4gICAgICAgIC8vIHVzZSBpbnRlci1zZWdtZW50IGRpc3RhbmNlIGluc3RlYWQgb2Ygc2VnbWVudCBkdXJhdGlvblxyXG4gICAgICAgIGlmIChzZWdtZW50RHVyYXRpb24gPT09IDApXHJcbiAgICAgICAgICBzZWdtZW50RHVyYXRpb24gPSBpbnRlclNlZ21lbnREaXN0YW5jZTtcclxuXHJcbiAgICAgICAgLy8gY2FsY3VsYXRlIHBlcmlvZCByZWxhdGl2ZSB0byBpbnRlciBtYXJrZXIgZGlzdGFuY2VcclxuICAgICAgICBzZWdtZW50UGVyaW9kICs9IHRoaXMucGVyaW9kUmVsICogaW50ZXJTZWdtZW50RGlzdGFuY2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGFkZCByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgc2VnbWVudCBkdXJhdGlvblxyXG4gICAgICBzZWdtZW50RHVyYXRpb24gKj0gdGhpcy5kdXJhdGlvblJlbDtcclxuICAgICAgc2VnbWVudER1cmF0aW9uICs9IHRoaXMuZHVyYXRpb25BYnM7XHJcblxyXG4gICAgICAvLyBhZGQgcmVsYXRpdmUgYW5kIGFic29sdXRlIHNlZ21lbnQgb2Zmc2V0XHJcbiAgICAgIHNlZ21lbnRPZmZzZXQgKj0gdGhpcy5vZmZzZXRSZWw7XHJcbiAgICAgIHNlZ21lbnRPZmZzZXQgKz0gdGhpcy5vZmZzZXRBYnM7XHJcblxyXG4gICAgICAvLyBhcHBseSBzZWdtZW50IG9mZnNldFxyXG4gICAgICAvLyAgIG9mZnNldCA+IDA6IHRoZSBzZWdtZW50J3MgcmVmZXJlbmNlIHBvc2l0aW9uIGlzIGFmdGVyIHRoZSBnaXZlbiBzZWdtZW50IHBvc2l0aW9uXHJcbiAgICAgIC8vICAgb2Zmc2V0IDwgMDogdGhlIGdpdmVuIHNlZ21lbnQgcG9zaXRpb24gaXMgdGhlIHNlZ21lbnQncyByZWZlcmVuY2UgcG9zaXRpb24gYW5kIHRoZSBkdXJhdGlvbiBoYXMgdG8gYmUgY29ycmVjdGVkIGJ5IHRoZSBvZmZzZXRcclxuICAgICAgaWYgKHNlZ21lbnRPZmZzZXQgPCAwKSB7XHJcbiAgICAgICAgc2VnbWVudER1cmF0aW9uIC09IHNlZ21lbnRPZmZzZXQ7XHJcbiAgICAgICAgc2VnbWVudFBvc2l0aW9uICs9IHNlZ21lbnRPZmZzZXQ7XHJcbiAgICAgICAgc2VnbWVudFRpbWUgKz0gKHNlZ21lbnRPZmZzZXQgLyByZXNhbXBsaW5nUmF0ZSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2VnbWVudFRpbWUgLT0gKHNlZ21lbnRPZmZzZXQgLyByZXNhbXBsaW5nUmF0ZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHJhbmRvbWl6ZSBzZWdtZW50IHBvc2l0aW9uXHJcbiAgICAgIGlmICh0aGlzLnBvc2l0aW9uVmFyID4gMClcclxuICAgICAgICBzZWdtZW50UG9zaXRpb24gKz0gMi4wICogKE1hdGgucmFuZG9tKCkgLSAwLjUpICogdGhpcy5wb3NpdGlvblZhcjtcclxuXHJcbiAgICAgIC8vIHNob3J0ZW4gZHVyYXRpb24gb2Ygc2VnbWVudHMgb3ZlciB0aGUgZWRnZXMgb2YgdGhlIGJ1ZmZlclxyXG4gICAgICBpZiAoc2VnbWVudFBvc2l0aW9uIDwgMCkge1xyXG4gICAgICAgIC8vc2VnbWVudFRpbWUgLT0gZ3JhaW5Qb3NpdGlvbjsgaG0sIG5vdCBzdXJlIGlmIHdlIHdhbnQgdG8gZG8gdGhpc1xyXG4gICAgICAgIHNlZ21lbnREdXJhdGlvbiArPSBzZWdtZW50UG9zaXRpb247XHJcbiAgICAgICAgc2VnbWVudFBvc2l0aW9uID0gMDtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHNlZ21lbnRQb3NpdGlvbiArIHNlZ21lbnREdXJhdGlvbiA+IHRoaXMuYnVmZmVyLmR1cmF0aW9uKVxyXG4gICAgICAgIHNlZ21lbnREdXJhdGlvbiA9IHRoaXMuYnVmZmVyLmR1cmF0aW9uIC0gc2VnbWVudFBvc2l0aW9uO1xyXG5cclxuICAgICAgc2VnbWVudER1cmF0aW9uIC89IHJlc2FtcGxpbmdSYXRlO1xyXG5cclxuICAgICAgaWYgKHRoaXMubW9ub3Bob25pYylcclxuICAgICAgICB0aGlzLmFib3J0KHNlZ21lbnRUaW1lKTtcclxuXHJcbiAgICAgIC8vIG1ha2Ugc2VnbWVudFxyXG4gICAgICBpZiAodGhpcy5nYWluID4gMCAmJiBzZWdtZW50RHVyYXRpb24gPiAwKSB7XHJcbiAgICAgICAgLy8gbWFrZSBzZWdtZW50IGVudmVsb3BlXHJcbiAgICAgICAgdmFyIGVudmVsb3BlID0gYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKTtcclxuICAgICAgICB2YXIgYXR0YWNrID0gdGhpcy5hdHRhY2tBYnMgKyB0aGlzLmF0dGFja1JlbCAqIHNlZ21lbnREdXJhdGlvbjtcclxuICAgICAgICB2YXIgcmVsZWFzZSA9IHRoaXMucmVsZWFzZUFicyArIHRoaXMucmVsZWFzZVJlbCAqIHNlZ21lbnREdXJhdGlvbjtcclxuXHJcbiAgICAgICAgaWYgKGF0dGFjayArIHJlbGVhc2UgPiBzZWdtZW50RHVyYXRpb24pIHtcclxuICAgICAgICAgIHZhciBmYWN0b3IgPSBzZWdtZW50RHVyYXRpb24gLyAoYXR0YWNrICsgcmVsZWFzZSk7XHJcbiAgICAgICAgICBhdHRhY2sgKj0gZmFjdG9yO1xyXG4gICAgICAgICAgcmVsZWFzZSAqPSBmYWN0b3I7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgYXR0YWNrRW5kVGltZSA9IHNlZ21lbnRUaW1lICsgYXR0YWNrO1xyXG4gICAgICAgIHZhciBzZWdtZW50RW5kVGltZSA9IHNlZ21lbnRUaW1lICsgc2VnbWVudER1cmF0aW9uO1xyXG4gICAgICAgIHZhciByZWxlYXNlU3RhcnRUaW1lID0gc2VnbWVudEVuZFRpbWUgLSByZWxlYXNlO1xyXG5cclxuICAgICAgICBlbnZlbG9wZS5nYWluLnZhbHVlID0gMDtcclxuICAgICAgICBlbnZlbG9wZS5nYWluLnNldFZhbHVlQXRUaW1lKDAuMCwgc2VnbWVudFRpbWUpO1xyXG4gICAgICAgIGVudmVsb3BlLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUodGhpcy5nYWluLCBhdHRhY2tFbmRUaW1lKTtcclxuXHJcbiAgICAgICAgaWYgKHJlbGVhc2VTdGFydFRpbWUgPiBhdHRhY2tFbmRUaW1lKVxyXG4gICAgICAgICAgZW52ZWxvcGUuZ2Fpbi5zZXRWYWx1ZUF0VGltZSh0aGlzLmdhaW4sIHJlbGVhc2VTdGFydFRpbWUpO1xyXG5cclxuICAgICAgICBlbnZlbG9wZS5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDAuMCwgc2VnbWVudEVuZFRpbWUpO1xyXG4gICAgICAgIGVudmVsb3BlLmNvbm5lY3QodGhpcy5vdXRwdXROb2RlKTtcclxuXHJcbiAgICAgICAgdGhpcy5fX2N1cnJlbnRFbnYgPSBlbnZlbG9wZTtcclxuXHJcbiAgICAgICAgLy8gbWFrZSBzb3VyY2VcclxuICAgICAgICB2YXIgc291cmNlID0gYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG5cclxuICAgICAgICBzb3VyY2UuYnVmZmVyID0gdGhpcy5idWZmZXI7XHJcbiAgICAgICAgc291cmNlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IHJlc2FtcGxpbmdSYXRlO1xyXG4gICAgICAgIHNvdXJjZS5jb25uZWN0KGVudmVsb3BlKTtcclxuXHJcbiAgICAgICAgc291cmNlLnN0YXJ0KHNlZ21lbnRUaW1lLCBzZWdtZW50UG9zaXRpb24pO1xyXG4gICAgICAgIHNvdXJjZS5zdG9wKHNlZ21lbnRUaW1lICsgc2VnbWVudER1cmF0aW9uKTtcclxuXHJcbiAgICAgICAgdGhpcy5fX2N1cnJlbnRTcmMgPSBzb3VyY2U7XHJcbiAgICAgICAgdGhpcy5fX3JlbGVhc2VTdGFydFRpbWUgPSByZWxlYXNlU3RhcnRUaW1lO1xyXG4gICAgICAgIHRoaXMuX19jdXJyZW50R2FpbiA9IHRoaXMuZ2FpbjtcclxuICAgICAgICB0aGlzLl9fY3VycmVudEVuZFRpbWUgPSBzZWdtZW50RW5kVGltZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGdyYWluIHBlcmlvZCByYW5kb24gdmFyaWF0aW9uXHJcbiAgICBpZiAodGhpcy5wZXJpb2RWYXIgPiAwLjApXHJcbiAgICAgIHNlZ21lbnRQZXJpb2QgKz0gMi4wICogKE1hdGgucmFuZG9tKCkgLSAwLjUpICogdGhpcy5wZXJpb2RWYXIgKiBncmFpblBlcmlvZDtcclxuXHJcbiAgICByZXR1cm4gTWF0aC5tYXgodGhpcy5wZXJpb2RNaW4sIHNlZ21lbnRQZXJpb2QpO1xyXG4gIH1cclxuXHJcbiAgYWJvcnQodGltZSkge1xyXG4gICAgY29uc3QgYXVkaW9Db250ZXh0ID0gdGhpcy5hdWRpb0NvbnRleHQ7XHJcbiAgICBjb25zdCBlbmRUaW1lID0gdGhpcy5fX2N1cnJlbnRFbmRUaW1lO1xyXG4gICAgY29uc3QgYWJvcnRUaW1lID0gdGltZSB8fCBhdWRpb0NvbnRleHQuY3VycmVudFRpbWU7XHJcblxyXG4gICAgaWYgKGFib3J0VGltZSA8IGVuZFRpbWUpIHtcclxuICAgICAgY29uc3Qgc2VnbWVudEVuZFRpbWUgPSBNYXRoLm1pbihhYm9ydFRpbWUgKyB0aGlzLmFib3J0VGltZSwgZW5kVGltZSk7XHJcbiAgICAgIGNvbnN0IGVudmVsb3BlID0gdGhpcy5fX2N1cnJlbnRFbnY7XHJcbiAgICAgIGxldCBjdXJyZW50R2FpblZhbHVlID0gdGhpcy5fX2N1cnJlbnRHYWluO1xyXG5cclxuICAgICAgaWYgKGFib3J0VGltZSA+IHRoaXMuX19yZWxlYXNlU3RhcnRUaW1lKSB7XHJcbiAgICAgICAgY29uc3QgcmVsZWFzZVN0YXJ0ID0gdGhpcy5fX3JlbGVhc2VTdGFydFRpbWU7XHJcbiAgICAgICAgY3VycmVudEdhaW5WYWx1ZSAqPSAoYWJvcnRUaW1lIC0gcmVsZWFzZVN0YXJ0KSAvIChlbmRUaW1lIC0gcmVsZWFzZVN0YXJ0KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZW52ZWxvcGUuZ2Fpbi5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoYWJvcnRUaW1lKTtcclxuICAgICAgZW52ZWxvcGUuZ2Fpbi5zZXRWYWx1ZUF0VGltZShjdXJyZW50R2FpblZhbHVlLCBhYm9ydFRpbWUpO1xyXG4gICAgICBlbnZlbG9wZS5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDAsIHNlZ21lbnRFbmRUaW1lKTtcclxuXHJcbiAgICAgIHRoaXMuX19jdXJyZW50U3JjID0gbnVsbDtcclxuICAgICAgdGhpcy5fX2N1cnJlbnRFbnYgPSBudWxsO1xyXG4gICAgICB0aGlzLl9fcmVsZWFzZVN0YXJ0VGltZSA9IDA7XHJcbiAgICAgIHRoaXMuX19jdXJyZW50R2FpbiA9IDA7XHJcbiAgICAgIHRoaXMuX19jdXJyZW50RW5kVGltZSA9IDA7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTZWdtZW50RW5naW5lO1xyXG4iLCIvLyBjb3JlXHJcbmV4cG9ydCB7IGRlZmF1bHQgYXMgYXVkaW9Db250ZXh0IH0gZnJvbSAnLi9jb3JlL2F1ZGlvLWNvbnRleHQnO1xyXG5leHBvcnQgeyBkZWZhdWx0IGFzIFRpbWVFbmdpbmUgfSBmcm9tICcuL2NvcmUvdGltZS1lbmdpbmUnO1xyXG5leHBvcnQgeyBkZWZhdWx0IGFzIEF1ZGlvVGltZUVuZ2luZSB9IGZyb20gJy4vY29yZS9hdWRpby10aW1lLWVuZ2luZSc7XHJcbmV4cG9ydCB7IGRlZmF1bHQgYXMgUHJpb3JpdHlRdWV1ZSB9IGZyb20gJy4vY29yZS9wcmlvcml0eS1xdWV1ZSc7XHJcbmV4cG9ydCB7IGRlZmF1bHQgYXMgU2NoZWR1bGluZ1F1ZXVlIH0gZnJvbSAnLi9jb3JlL3NjaGVkdWxpbmctcXVldWUnO1xyXG5cclxuLy8gZW5naW5lc1xyXG5leHBvcnQgeyBkZWZhdWx0IGFzIEdyYW51bGFyRW5naW5lIH0gZnJvbSAnLi9lbmdpbmVzL2dyYW51bGFyLWVuZ2luZSc7XHJcbmV4cG9ydCB7IGRlZmF1bHQgYXMgTWV0cm9ub21lIH0gZnJvbSAnLi9lbmdpbmVzL21ldHJvbm9tZSc7XHJcbmV4cG9ydCB7IGRlZmF1bHQgYXMgUGxheWVyRW5naW5lIH0gZnJvbSAnLi9lbmdpbmVzL3BsYXllci1lbmdpbmUnO1xyXG5leHBvcnQgeyBkZWZhdWx0IGFzIFNlZ21lbnRFbmdpbmUgfSBmcm9tICcuL2VuZ2luZXMvc2VnbWVudC1lbmdpbmUnO1xyXG5cclxuLy8gbWFzdGVyc1xyXG5leHBvcnQgeyBkZWZhdWx0IGFzIFBsYXlDb250cm9sIH0gZnJvbSAnLi9tYXN0ZXJzL3BsYXktY29udHJvbCc7XHJcbmV4cG9ydCB7IGRlZmF1bHQgYXMgVHJhbnNwb3J0IH0gZnJvbSAnLi9tYXN0ZXJzL3RyYW5zcG9ydCc7XHJcbmV4cG9ydCB7IGRlZmF1bHQgYXMgU2NoZWR1bGVyIH0gZnJvbSAnLi9tYXN0ZXJzL3NjaGVkdWxlcic7XHJcbmV4cG9ydCB7IGRlZmF1bHQgYXMgU2ltcGxlU2NoZWR1bGVyIH0gZnJvbSAnLi9tYXN0ZXJzL3NpbXBsZS1zY2hlZHVsZXInO1xyXG5cclxuLy8gZmFjdG9yaWVzXHJcbmV4cG9ydCB7IGdldFNjaGVkdWxlciB9IGZyb20gJy4vbWFzdGVycy9mYWN0b3JpZXMnO1xyXG5leHBvcnQgeyBnZXRTaW1wbGVTY2hlZHVsZXIgfSBmcm9tICcuL21hc3RlcnMvZmFjdG9yaWVzJztcclxuIiwiLy8gc2NoZWR1bGVycyBzaG91bGQgYmUgc2luZ2xldG9uc1xyXG5pbXBvcnQgZGVmYXVsdEF1ZGlvQ29udGV4dCBmcm9tICcuLi9jb3JlL2F1ZGlvLWNvbnRleHQnO1xyXG5pbXBvcnQgU2NoZWR1bGVyIGZyb20gJy4vc2NoZWR1bGVyJztcclxuaW1wb3J0IFNpbXBsZVNjaGVkdWxlciBmcm9tICcuL3NpbXBsZS1zY2hlZHVsZXInO1xyXG5cclxuY29uc3Qgc2NoZWR1bGVyTWFwID0gbmV3IFdlYWtNYXAoKTtcclxuY29uc3Qgc2ltcGxlU2NoZWR1bGVyTWFwID0gbmV3IFdlYWtNYXAoKTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgdW5pcXVlIGluc3RhbmNlIG9mIGBTY2hlZHVsZXJgXHJcbiAqXHJcbiAqIEBnbG9iYWxcclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtTY2hlZHVsZXJ9XHJcbiAqIEBzZWUgU2NoZWR1bGVyXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgZ2V0U2NoZWR1bGVyID0gZnVuY3Rpb24oYXVkaW9Db250ZXh0ID0gZGVmYXVsdEF1ZGlvQ29udGV4dCkge1xyXG4gIGxldCBzY2hlZHVsZXIgPSBzY2hlZHVsZXJNYXAuZ2V0KGF1ZGlvQ29udGV4dCk7XHJcblxyXG4gIGlmICghc2NoZWR1bGVyKSB7XHJcbiAgICBzY2hlZHVsZXIgPSBuZXcgU2NoZWR1bGVyKHsgYXVkaW9Db250ZXh0OiBhdWRpb0NvbnRleHQgfSk7XHJcbiAgICBzY2hlZHVsZXJNYXAuc2V0KGF1ZGlvQ29udGV4dCwgc2NoZWR1bGVyKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBzY2hlZHVsZXI7XHJcbn07XHJcblxyXG4vKipcclxuICogUmV0dXJucyBhIHVuaXF1ZSBpbnN0YW5jZSBvZiBgU2ltcGxlU2NoZWR1bGVyYFxyXG4gKlxyXG4gKiBAZ2xvYmFsXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7U2ltcGxlU2NoZWR1bGVyfVxyXG4gKiBAc2VlIFNpbXBsZVNjaGVkdWxlclxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGdldFNpbXBsZVNjaGVkdWxlciA9IGZ1bmN0aW9uKGF1ZGlvQ29udGV4dCA9IGRlZmF1bHRBdWRpb0NvbnRleHQpIHtcclxuICBsZXQgc2ltcGxlU2NoZWR1bGVyID0gc2ltcGxlU2NoZWR1bGVyTWFwLmdldChhdWRpb0NvbnRleHQpO1xyXG5cclxuICBpZiAoIXNpbXBsZVNjaGVkdWxlcikge1xyXG4gICAgc2ltcGxlU2NoZWR1bGVyID0gbmV3IFNpbXBsZVNjaGVkdWxlcih7IGF1ZGlvQ29udGV4dDogYXVkaW9Db250ZXh0IH0pO1xyXG4gICAgc2ltcGxlU2NoZWR1bGVyTWFwLnNldChhdWRpb0NvbnRleHQsIHNpbXBsZVNjaGVkdWxlcik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gc2ltcGxlU2NoZWR1bGVyO1xyXG59O1xyXG4iLCJpbXBvcnQgZGVmYXVsdEF1ZGlvQ29udGV4dCBmcm9tICcuLi9jb3JlL2F1ZGlvLWNvbnRleHQnO1xyXG5pbXBvcnQgU2NoZWR1bGluZ1F1ZXVlIGZyb20gJy4uL2NvcmUvc2NoZWR1bGluZy1xdWV1ZSc7XHJcbmltcG9ydCBUaW1lRW5naW5lIGZyb20gJy4uL2NvcmUvdGltZS1lbmdpbmUnO1xyXG5pbXBvcnQgeyBnZXRTY2hlZHVsZXIgfSBmcm9tICcuL2ZhY3Rvcmllcyc7XHJcblxyXG5jb25zdCBFUFNJTE9OID0gMWUtODtcclxuXHJcbmNsYXNzIExvb3BDb250cm9sIGV4dGVuZHMgVGltZUVuZ2luZSB7XHJcbiAgY29uc3RydWN0b3IocGxheUNvbnRyb2wpIHtcclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgdGhpcy5fX3BsYXlDb250cm9sID0gcGxheUNvbnRyb2w7XHJcbiAgICB0aGlzLnNwZWVkID0gMTtcclxuICAgIHRoaXMubG93ZXIgPSAtSW5maW5pdHk7XHJcbiAgICB0aGlzLnVwcGVyID0gSW5maW5pdHk7XHJcbiAgfVxyXG5cclxuICAvLyBUaW1lRW5naW5lIG1ldGhvZCAoc2NoZWR1bGVkIGludGVyZmFjZSlcclxuICBhZHZhbmNlVGltZSh0aW1lKSB7XHJcbiAgICBjb25zdCBwbGF5Q29udHJvbCA9IHRoaXMuX19wbGF5Q29udHJvbDtcclxuICAgIGNvbnN0IHNwZWVkID0gdGhpcy5zcGVlZDtcclxuICAgIGNvbnN0IGxvd2VyID0gdGhpcy5sb3dlcjtcclxuICAgIGNvbnN0IHVwcGVyID0gdGhpcy51cHBlcjtcclxuXHJcbiAgICBpZiAoc3BlZWQgPiAwKVxyXG4gICAgICB0aW1lICs9IEVQU0lMT047XHJcbiAgICBlbHNlXHJcbiAgICAgIHRpbWUgLT0gRVBTSUxPTjtcclxuXHJcbiAgICBpZiAoc3BlZWQgPiAwKSB7XHJcbiAgICAgIHBsYXlDb250cm9sLnN5bmNTcGVlZCh0aW1lLCBsb3dlciwgc3BlZWQsIHRydWUpO1xyXG4gICAgICByZXR1cm4gcGxheUNvbnRyb2wuX19nZXRUaW1lQXRQb3NpdGlvbih1cHBlcikgLSBFUFNJTE9OO1xyXG4gICAgfSBlbHNlIGlmIChzcGVlZCA8IDApIHtcclxuICAgICAgcGxheUNvbnRyb2wuc3luY1NwZWVkKHRpbWUsIHVwcGVyLCBzcGVlZCwgdHJ1ZSk7XHJcbiAgICAgIHJldHVybiBwbGF5Q29udHJvbC5fX2dldFRpbWVBdFBvc2l0aW9uKGxvd2VyKSArIEVQU0lMT047XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIEluZmluaXR5O1xyXG4gIH1cclxuXHJcbiAgcmVzY2hlZHVsZShzcGVlZCkge1xyXG4gICAgY29uc3QgcGxheUNvbnRyb2wgPSB0aGlzLl9fcGxheUNvbnRyb2w7XHJcbiAgICBjb25zdCBsb3dlciA9IE1hdGgubWluKHBsYXlDb250cm9sLl9fbG9vcFN0YXJ0LCBwbGF5Q29udHJvbC5fX2xvb3BFbmQpO1xyXG4gICAgY29uc3QgdXBwZXIgPSBNYXRoLm1heChwbGF5Q29udHJvbC5fX2xvb3BTdGFydCwgcGxheUNvbnRyb2wuX19sb29wRW5kKTtcclxuXHJcbiAgICB0aGlzLnNwZWVkID0gc3BlZWQ7XHJcbiAgICB0aGlzLmxvd2VyID0gbG93ZXI7XHJcbiAgICB0aGlzLnVwcGVyID0gdXBwZXI7XHJcblxyXG4gICAgaWYgKGxvd2VyID09PSB1cHBlcilcclxuICAgICAgc3BlZWQgPSAwO1xyXG5cclxuICAgIGlmIChzcGVlZCA+IDApXHJcbiAgICAgIHRoaXMucmVzZXRUaW1lKHBsYXlDb250cm9sLl9fZ2V0VGltZUF0UG9zaXRpb24odXBwZXIpIC0gRVBTSUxPTik7XHJcbiAgICBlbHNlIGlmIChzcGVlZCA8IDApXHJcbiAgICAgIHRoaXMucmVzZXRUaW1lKHBsYXlDb250cm9sLl9fZ2V0VGltZUF0UG9zaXRpb24obG93ZXIpICsgRVBTSUxPTik7XHJcbiAgICBlbHNlXHJcbiAgICAgIHRoaXMucmVzZXRUaW1lKEluZmluaXR5KTtcclxuICB9XHJcblxyXG4gIGFwcGx5TG9vcEJvdW5kYXJpZXMocG9zaXRpb24sIHNwZWVkKSB7XHJcbiAgICBjb25zdCBsb3dlciA9IHRoaXMubG93ZXI7XHJcbiAgICBjb25zdCB1cHBlciA9IHRoaXMudXBwZXI7XHJcblxyXG4gICAgaWYgKHNwZWVkID4gMCAmJiBwb3NpdGlvbiA+PSB1cHBlcilcclxuICAgICAgcmV0dXJuIGxvd2VyICsgKHBvc2l0aW9uIC0gbG93ZXIpICUgKHVwcGVyIC0gbG93ZXIpO1xyXG4gICAgZWxzZSBpZiAoc3BlZWQgPCAwICYmIHBvc2l0aW9uIDwgbG93ZXIpXHJcbiAgICAgIHJldHVybiB1cHBlciAtICh1cHBlciAtIHBvc2l0aW9uKSAlICh1cHBlciAtIGxvd2VyKTtcclxuXHJcbiAgICByZXR1cm4gcG9zaXRpb247XHJcbiAgfVxyXG59XHJcblxyXG4vLyBwbGF5IGNvbnRyb2xsZWQgYmFzZSBjbGFzc1xyXG5jbGFzcyBQbGF5Q29udHJvbGxlZCB7XHJcbiAgY29uc3RydWN0b3IocGxheUNvbnRyb2wsIGVuZ2luZSkge1xyXG4gICAgdGhpcy5fX3BsYXlDb250cm9sID0gcGxheUNvbnRyb2w7XHJcblxyXG4gICAgZW5naW5lLm1hc3RlciA9IHRoaXM7XHJcbiAgICB0aGlzLl9fZW5naW5lID0gZW5naW5lO1xyXG4gIH1cclxuXHJcbiAgc3luY1NwZWVkKHRpbWUsIHBvc2l0aW9uLCBzcGVlZCwgc2VlaywgbGFzdFNwZWVkKSB7XHJcbiAgICB0aGlzLl9fZW5naW5lLnN5bmNTcGVlZCh0aW1lLCBwb3NpdGlvbiwgc3BlZWQsIHNlZWspO1xyXG4gIH1cclxuXHJcbiAgZ2V0IGN1cnJlbnRUaW1lKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX19wbGF5Q29udHJvbC5jdXJyZW50VGltZTtcclxuICB9XHJcblxyXG4gIGdldCBjdXJyZW50UG9zaXRpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fX3BsYXlDb250cm9sLmN1cnJlbnRQb3NpdGlvbjtcclxuICB9XHJcblxyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLl9fcGxheUNvbnRyb2wgPSBudWxsO1xyXG5cclxuICAgIHRoaXMuX19lbmdpbmUubWFzdGVyID0gbnVsbDtcclxuICAgIHRoaXMuX19lbmdpbmUgPSBudWxsO1xyXG4gIH1cclxufVxyXG5cclxuLy8gcGxheSBjb250cm9sIGZvciBlbmdpbmVzIGltcGxlbWVudGluZyB0aGUgKnNwZWVkLWNvbnRyb2xsZWQqIGludGVyZmFjZVxyXG5jbGFzcyBQbGF5Q29udHJvbGxlZFNwZWVkQ29udHJvbGxlZCBleHRlbmRzIFBsYXlDb250cm9sbGVkIHtcclxuICBjb25zdHJ1Y3RvcihwbGF5Q29udHJvbCwgZW5naW5lKSB7XHJcbiAgICBzdXBlcihwbGF5Q29udHJvbCwgZW5naW5lKTtcclxuICB9XHJcbn1cclxuXHJcbi8vIHBsYXkgY29udHJvbCBmb3IgZW5naW5lcyBpbXBsbWVudGluZyB0aGUgKnRyYW5zcG9ydGVkKiBpbnRlcmZhY2VcclxuY2xhc3MgUGxheUNvbnRyb2xsZWRUcmFuc3BvcnRlZCBleHRlbmRzIFBsYXlDb250cm9sbGVkIHtcclxuICBjb25zdHJ1Y3RvcihwbGF5Q29udHJvbCwgZW5naW5lKSB7XHJcbiAgICBzdXBlcihwbGF5Q29udHJvbCwgZW5naW5lKTtcclxuXHJcbiAgICB0aGlzLl9fc2NoZWR1bGVySG9vayA9IG5ldyBQbGF5Q29udHJvbGxlZFNjaGVkdWxlckhvb2socGxheUNvbnRyb2wsIGVuZ2luZSk7XHJcbiAgfVxyXG5cclxuICBzeW5jU3BlZWQodGltZSwgcG9zaXRpb24sIHNwZWVkLCBzZWVrLCBsYXN0U3BlZWQpIHtcclxuICAgIGlmIChzcGVlZCAhPT0gbGFzdFNwZWVkIHx8IChzZWVrICYmIHNwZWVkICE9PSAwKSkge1xyXG4gICAgICB2YXIgbmV4dFBvc2l0aW9uO1xyXG5cclxuICAgICAgLy8gcmVzeW5jIHRyYW5zcG9ydGVkIGVuZ2luZXNcclxuICAgICAgaWYgKHNlZWsgfHwgc3BlZWQgKiBsYXN0U3BlZWQgPCAwKSB7XHJcbiAgICAgICAgLy8gc2VlayBvciByZXZlcnNlIGRpcmVjdGlvblxyXG4gICAgICAgIG5leHRQb3NpdGlvbiA9IHRoaXMuX19lbmdpbmUuc3luY1Bvc2l0aW9uKHRpbWUsIHBvc2l0aW9uLCBzcGVlZCk7XHJcbiAgICAgIH0gZWxzZSBpZiAobGFzdFNwZWVkID09PSAwKSB7XHJcbiAgICAgICAgLy8gc3RhcnRcclxuICAgICAgICBuZXh0UG9zaXRpb24gPSB0aGlzLl9fZW5naW5lLnN5bmNQb3NpdGlvbih0aW1lLCBwb3NpdGlvbiwgc3BlZWQpO1xyXG4gICAgICB9IGVsc2UgaWYgKHNwZWVkID09PSAwKSB7XHJcbiAgICAgICAgLy8gc3RvcFxyXG4gICAgICAgIG5leHRQb3NpdGlvbiA9IEluZmluaXR5O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fX2VuZ2luZS5zeW5jU3BlZWQpXHJcbiAgICAgICAgICB0aGlzLl9fZW5naW5lLnN5bmNTcGVlZCh0aW1lLCBwb3NpdGlvbiwgMCk7XHJcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fX2VuZ2luZS5zeW5jU3BlZWQpIHtcclxuICAgICAgICAvLyBjaGFuZ2Ugc3BlZWQgd2l0aG91dCByZXZlcnNpbmcgZGlyZWN0aW9uXHJcbiAgICAgICAgdGhpcy5fX2VuZ2luZS5zeW5jU3BlZWQodGltZSwgcG9zaXRpb24sIHNwZWVkKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5fX3NjaGVkdWxlckhvb2sucmVzZXRQb3NpdGlvbihuZXh0UG9zaXRpb24pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmVzZXRFbmdpbmVQb3NpdGlvbihlbmdpbmUsIHBvc2l0aW9uID0gdW5kZWZpbmVkKSB7XHJcbiAgICBpZiAocG9zaXRpb24gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB2YXIgcGxheUNvbnRyb2wgPSB0aGlzLl9fcGxheUNvbnRyb2w7XHJcbiAgICAgIHZhciB0aW1lID0gcGxheUNvbnRyb2wuX19zeW5jKCk7XHJcblxyXG4gICAgICBwb3NpdGlvbiA9IHRoaXMuX19lbmdpbmUuc3luY1Bvc2l0aW9uKHRpbWUsIHBsYXlDb250cm9sLl9fcG9zaXRpb24sIHBsYXlDb250cm9sLl9fc3BlZWQpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX19zY2hlZHVsZXJIb29rLnJlc2V0UG9zaXRpb24ocG9zaXRpb24pO1xyXG4gIH1cclxuXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuX19zY2hlZHVsZXJIb29rLmRlc3Ryb3koKTtcclxuICAgIHRoaXMuX19zY2hlZHVsZXJIb29rID0gbnVsbDtcclxuXHJcbiAgICBzdXBlci5kZXN0cm95KCk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBwbGF5IGNvbnRyb2wgZm9yIHRpbWUgZW5naW5lcyBpbXBsZW1lbnRpbmcgdGhlICpzY2hlZHVsZWQqIGludGVyZmFjZVxyXG5jbGFzcyBQbGF5Q29udHJvbGxlZFNjaGVkdWxlZCBleHRlbmRzIFBsYXlDb250cm9sbGVkIHtcclxuICBjb25zdHJ1Y3RvcihwbGF5Q29udHJvbCwgZW5naW5lKSB7XHJcbiAgICBzdXBlcihwbGF5Q29udHJvbCwgZW5naW5lKTtcclxuXHJcbiAgICAvLyBzY2hlZHVsaW5nIHF1ZXVlIGJlY29tZXMgbWFzdGVyIG9mIGVuZ2luZVxyXG4gICAgZW5naW5lLm1hc3RlciA9IG51bGw7XHJcbiAgICB0aGlzLl9fc2NoZWR1bGluZ1F1ZXVlID0gbmV3IFBsYXlDb250cm9sbGVkU2NoZWR1bGluZ1F1ZXVlKHBsYXlDb250cm9sLCBlbmdpbmUpO1xyXG4gIH1cclxuXHJcbiAgc3luY1NwZWVkKHRpbWUsIHBvc2l0aW9uLCBzcGVlZCwgc2VlaywgbGFzdFNwZWVkKSB7XHJcbiAgICBpZiAobGFzdFNwZWVkID09PSAwICYmIHNwZWVkICE9PSAwKSAvLyBzdGFydCBvciBzZWVrXHJcbiAgICAgIHRoaXMuX19lbmdpbmUucmVzZXRUaW1lKCk7XHJcbiAgICBlbHNlIGlmIChsYXN0U3BlZWQgIT09IDAgJiYgc3BlZWQgPT09IDApIC8vIHN0b3BcclxuICAgICAgdGhpcy5fX2VuZ2luZS5yZXNldFRpbWUoSW5maW5pdHkpO1xyXG4gIH1cclxuXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuX19zY2hlZHVsaW5nUXVldWUuZGVzdHJveSgpO1xyXG4gICAgc3VwZXIuZGVzdHJveSgpO1xyXG4gIH1cclxufVxyXG5cclxuLy8gdHJhbnNsYXRlcyB0cmFuc3BvcnRlZCBlbmdpbmUgYWR2YW5jZVBvc2l0aW9uIGludG8gZ2xvYmFsIHNjaGVkdWxlciB0aW1lc1xyXG5jbGFzcyBQbGF5Q29udHJvbGxlZFNjaGVkdWxlckhvb2sgZXh0ZW5kcyBUaW1lRW5naW5lIHtcclxuICBjb25zdHJ1Y3RvcihwbGF5Q29udHJvbCwgZW5naW5lKSB7XHJcbiAgICBzdXBlcigpO1xyXG5cclxuICAgIHRoaXMuX19wbGF5Q29udHJvbCA9IHBsYXlDb250cm9sO1xyXG4gICAgdGhpcy5fX2VuZ2luZSA9IGVuZ2luZTtcclxuXHJcbiAgICB0aGlzLl9fbmV4dFBvc2l0aW9uID0gSW5maW5pdHk7XHJcbiAgICBwbGF5Q29udHJvbC5fX3NjaGVkdWxlci5hZGQodGhpcywgSW5maW5pdHkpO1xyXG4gIH1cclxuXHJcbiAgYWR2YW5jZVRpbWUodGltZSkge1xyXG4gICAgdmFyIHBsYXlDb250cm9sID0gdGhpcy5fX3BsYXlDb250cm9sO1xyXG4gICAgdmFyIGVuZ2luZSA9IHRoaXMuX19lbmdpbmU7XHJcbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLl9fbmV4dFBvc2l0aW9uO1xyXG4gICAgdmFyIG5leHRQb3NpdGlvbiA9IGVuZ2luZS5hZHZhbmNlUG9zaXRpb24odGltZSwgcG9zaXRpb24sIHBsYXlDb250cm9sLl9fc3BlZWQpO1xyXG4gICAgdmFyIG5leHRUaW1lID0gcGxheUNvbnRyb2wuX19nZXRUaW1lQXRQb3NpdGlvbihuZXh0UG9zaXRpb24pO1xyXG5cclxuICAgIHRoaXMuX19uZXh0UG9zaXRpb24gPSBuZXh0UG9zaXRpb247XHJcbiAgICByZXR1cm4gbmV4dFRpbWU7XHJcbiAgfVxyXG5cclxuICBnZXQgY3VycmVudFRpbWUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fX3BsYXlDb250cm9sLmN1cnJlbnRUaW1lO1xyXG4gIH1cclxuXHJcbiAgZ2V0IGN1cnJlbnRQb3NpdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLl9fcGxheUNvbnRyb2wuY3VycmVudFBvc2l0aW9uO1xyXG4gIH1cclxuXHJcbiAgcmVzZXRQb3NpdGlvbihwb3NpdGlvbiA9IHRoaXMuX19uZXh0UG9zaXRpb24pIHtcclxuICAgIHZhciB0aW1lID0gdGhpcy5fX3BsYXlDb250cm9sLl9fZ2V0VGltZUF0UG9zaXRpb24ocG9zaXRpb24pO1xyXG4gICAgdGhpcy5fX25leHRQb3NpdGlvbiA9IHBvc2l0aW9uO1xyXG4gICAgdGhpcy5yZXNldFRpbWUodGltZSk7XHJcbiAgfVxyXG5cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy5fX3BsYXlDb250cm9sLl9fc2NoZWR1bGVyLnJlbW92ZSh0aGlzKTtcclxuICAgIHRoaXMuX19wbGF5Q29udHJvbCA9IG51bGw7XHJcbiAgICB0aGlzLl9fZW5naW5lID0gbnVsbDtcclxuICB9XHJcbn1cclxuXHJcbi8vIGludGVybmFsIHNjaGVkdWxpbmcgcXVldWUgdGhhdCByZXR1cm5zIHRoZSBjdXJyZW50IHBvc2l0aW9uIChhbmQgdGltZSkgb2YgdGhlIHBsYXkgY29udHJvbFxyXG5jbGFzcyBQbGF5Q29udHJvbGxlZFNjaGVkdWxpbmdRdWV1ZSBleHRlbmRzIFNjaGVkdWxpbmdRdWV1ZSB7XHJcbiAgY29uc3RydWN0b3IocGxheUNvbnRyb2wsIGVuZ2luZSkge1xyXG4gICAgc3VwZXIoKTtcclxuICAgIHRoaXMuX19wbGF5Q29udHJvbCA9IHBsYXlDb250cm9sO1xyXG4gICAgdGhpcy5fX2VuZ2luZSA9IGVuZ2luZTtcclxuXHJcbiAgICB0aGlzLmFkZChlbmdpbmUsIEluZmluaXR5KTtcclxuICAgIHBsYXlDb250cm9sLl9fc2NoZWR1bGVyLmFkZCh0aGlzLCBJbmZpbml0eSk7XHJcbiAgfVxyXG5cclxuICBnZXQgY3VycmVudFRpbWUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fX3BsYXlDb250cm9sLmN1cnJlbnRUaW1lO1xyXG4gIH1cclxuXHJcbiAgZ2V0IGN1cnJlbnRQb3NpdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLl9fcGxheUNvbnRyb2wuY3VycmVudFBvc2l0aW9uO1xyXG4gIH1cclxuXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuX19wbGF5Q29udHJvbC5fX3NjaGVkdWxlci5yZW1vdmUodGhpcyk7XHJcbiAgICB0aGlzLnJlbW92ZSh0aGlzLl9fZW5naW5lKTtcclxuXHJcbiAgICB0aGlzLl9fcGxheUNvbnRyb2wgPSBudWxsO1xyXG4gICAgdGhpcy5fX2VuZ2luZSA9IG51bGw7XHJcbiAgfVxyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgVGltZSBFbmdpbmUgdG8gcHJvdmlkZSBwbGF5YmFjayBjb250cm9sIG9mIGEgVGltZSBFbmdpbmUgaW5zdGFuY2UuXHJcbiAqXHJcbiAqIFtleGFtcGxlXXtAbGluayBodHRwczovL3Jhd2dpdC5jb20vd2F2ZXNqcy93YXZlcy1hdWRpby9tYXN0ZXIvZXhhbXBsZXMvcGxheS1jb250cm9sLmh0bWx9XHJcbiAqXHJcbiAqIEBleHRlbmRzIFRpbWVFbmdpbmVcclxuICogQHBhcmFtIHtUaW1lRW5naW5lfSBlbmdpbmUgLSBlbmdpbmUgdG8gY29udHJvbFxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBpbXBvcnQgKiBhcyBhdWRpbyBmcm9tICd3YXZlcy1hdWRpbyc7XHJcbiAqIGNvbnN0IHBsYXllckVuZ2luZSA9IGF1ZGlvLlBsYXllckVuZ2luZSgpO1xyXG4gKiBjb25zdCBwbGF5Q29udHJvbCA9IG5ldyBhdWRpby5QbGF5Q29udHJvbChwbGF5ZXJFbmdpbmUpO1xyXG4gKlxyXG4gKiBwbGF5Q29udHJvbC5zdGFydCgpO1xyXG4gKi9cclxuY2xhc3MgUGxheUNvbnRyb2wgZXh0ZW5kcyBUaW1lRW5naW5lIHtcclxuICBjb25zdHJ1Y3RvcihlbmdpbmUsIG9wdGlvbnMgPSB7fSkge1xyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICB0aGlzLmF1ZGlvQ29udGV4dCA9IG9wdGlvbnMuYXVkaW9Db250ZXh0IHx8IGRlZmF1bHRBdWRpb0NvbnRleHQ7XHJcbiAgICB0aGlzLl9fc2NoZWR1bGVyID0gZ2V0U2NoZWR1bGVyKHRoaXMuYXVkaW9Db250ZXh0KTtcclxuXHJcbiAgICB0aGlzLl9fcGxheUNvbnRyb2xsZWQgPSBudWxsO1xyXG5cclxuICAgIHRoaXMuX19sb29wQ29udHJvbCA9IG51bGw7XHJcbiAgICB0aGlzLl9fbG9vcFN0YXJ0ID0gMDtcclxuICAgIHRoaXMuX19sb29wRW5kID0gMTtcclxuXHJcbiAgICAvLyBzeW5jaHJvbml6ZWQgdGllLCBwb3NpdGlvbiwgYW5kIHNwZWVkXHJcbiAgICB0aGlzLl9fdGltZSA9IDA7XHJcbiAgICB0aGlzLl9fcG9zaXRpb24gPSAwO1xyXG4gICAgdGhpcy5fX3NwZWVkID0gMDtcclxuXHJcbiAgICAvLyBub24temVybyBcInVzZXJcIiBzcGVlZFxyXG4gICAgdGhpcy5fX3BsYXlpbmdTcGVlZCA9IDE7XHJcblxyXG4gICAgaWYgKGVuZ2luZSlcclxuICAgICAgdGhpcy5fX3NldEVuZ2luZShlbmdpbmUpO1xyXG4gIH1cclxuXHJcbiAgX19zZXRFbmdpbmUoZW5naW5lKSB7XHJcbiAgICBpZiAoZW5naW5lLm1hc3RlcilcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwib2JqZWN0IGhhcyBhbHJlYWR5IGJlZW4gYWRkZWQgdG8gYSBtYXN0ZXJcIik7XHJcblxyXG4gICAgaWYgKFRpbWVFbmdpbmUuaW1wbGVtZW50c1NwZWVkQ29udHJvbGxlZChlbmdpbmUpKVxyXG4gICAgICB0aGlzLl9fcGxheUNvbnRyb2xsZWQgPSBuZXcgUGxheUNvbnRyb2xsZWRTcGVlZENvbnRyb2xsZWQodGhpcywgZW5naW5lKTtcclxuICAgIGVsc2UgaWYgKFRpbWVFbmdpbmUuaW1wbGVtZW50c1RyYW5zcG9ydGVkKGVuZ2luZSkpXHJcbiAgICAgIHRoaXMuX19wbGF5Q29udHJvbGxlZCA9IG5ldyBQbGF5Q29udHJvbGxlZFRyYW5zcG9ydGVkKHRoaXMsIGVuZ2luZSk7XHJcbiAgICBlbHNlIGlmIChUaW1lRW5naW5lLmltcGxlbWVudHNTY2hlZHVsZWQoZW5naW5lKSlcclxuICAgICAgdGhpcy5fX3BsYXlDb250cm9sbGVkID0gbmV3IFBsYXlDb250cm9sbGVkU2NoZWR1bGVkKHRoaXMsIGVuZ2luZSk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIm9iamVjdCBjYW5ub3QgYmUgYWRkZWQgdG8gcGxheSBjb250cm9sXCIpO1xyXG4gIH1cclxuXHJcbiAgX19yZXNldEVuZ2luZSgpIHtcclxuICAgIHRoaXMuX19wbGF5Q29udHJvbGxlZC5kZXN0cm95KCk7XHJcbiAgICB0aGlzLl9fcGxheUNvbnRyb2xsZWQgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsY3VsYXRlL2V4dHJhcG9sYXRlIHBsYXlpbmcgdGltZSBmb3IgZ2l2ZW4gcG9zaXRpb25cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBwb3NpdGlvbiBwb3NpdGlvblxyXG4gICAqIEByZXR1cm4ge051bWJlcn0gZXh0cmFwb2xhdGVkIHRpbWVcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9fZ2V0VGltZUF0UG9zaXRpb24ocG9zaXRpb24pIHtcclxuICAgIHJldHVybiB0aGlzLl9fdGltZSArIChwb3NpdGlvbiAtIHRoaXMuX19wb3NpdGlvbikgLyB0aGlzLl9fc3BlZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxjdWxhdGUvZXh0cmFwb2xhdGUgcGxheWluZyBwb3NpdGlvbiBmb3IgZ2l2ZW4gdGltZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHRpbWUgdGltZVxyXG4gICAqIEByZXR1cm4ge051bWJlcn0gZXh0cmFwb2xhdGVkIHBvc2l0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfX2dldFBvc2l0aW9uQXRUaW1lKHRpbWUpIHtcclxuICAgIHJldHVybiB0aGlzLl9fcG9zaXRpb24gKyAodGltZSAtIHRoaXMuX190aW1lKSAqIHRoaXMuX19zcGVlZDtcclxuICB9XHJcblxyXG4gIF9fc3luYygpIHtcclxuICAgIGNvbnN0IG5vdyA9IHRoaXMuY3VycmVudFRpbWU7XHJcbiAgICB0aGlzLl9fcG9zaXRpb24gKz0gKG5vdyAtIHRoaXMuX190aW1lKSAqIHRoaXMuX19zcGVlZDtcclxuICAgIHRoaXMuX190aW1lID0gbm93O1xyXG4gICAgcmV0dXJuIG5vdztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBjdXJyZW50IG1hc3RlciB0aW1lLlxyXG4gICAqIFRoaXMgZnVuY3Rpb24gd2lsbCBiZSByZXBsYWNlZCB3aGVuIHRoZSBwbGF5LWNvbnRyb2wgaXMgYWRkZWQgdG8gYSBtYXN0ZXIuXHJcbiAgICpcclxuICAgKiBAbmFtZSBjdXJyZW50VGltZVxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICogQG1lbWJlcm9mIFBsYXlDb250cm9sXHJcbiAgICogQGluc3RhbmNlXHJcbiAgICogQHJlYWRvbmx5XHJcbiAgICovXHJcbiAgZ2V0IGN1cnJlbnRUaW1lKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX19zY2hlZHVsZXIuY3VycmVudFRpbWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgY3VycmVudCBtYXN0ZXIgcG9zaXRpb24uXHJcbiAgICogVGhpcyBmdW5jdGlvbiB3aWxsIGJlIHJlcGxhY2VkIHdoZW4gdGhlIHBsYXktY29udHJvbCBpcyBhZGRlZCB0byBhIG1hc3Rlci5cclxuICAgKlxyXG4gICAqIEBuYW1lIGN1cnJlbnRQb3NpdGlvblxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICogQG1lbWJlcm9mIFBsYXlDb250cm9sXHJcbiAgICogQGluc3RhbmNlXHJcbiAgICogQHJlYWRvbmx5XHJcbiAgICovXHJcbiAgZ2V0IGN1cnJlbnRQb3NpdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLl9fcG9zaXRpb24gKyAodGhpcy5fX3NjaGVkdWxlci5jdXJyZW50VGltZSAtIHRoaXMuX190aW1lKSAqIHRoaXMuX19zcGVlZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgaWYgdGhlIHBsYXkgY29udHJvbCBpcyBydW5uaW4gZy5cclxuICAgKlxyXG4gICAqIEBuYW1lIHJ1bm5pbmdcclxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cclxuICAgKiBAbWVtYmVyb2YgUGxheUNvbnRyb2xcclxuICAgKiBAaW5zdGFuY2VcclxuICAgKiBAcmVhZG9ubHlcclxuICAgKi9cclxuICBnZXQgcnVubmluZygpIHtcclxuICAgIHJldHVybiAhKHRoaXMuX19zcGVlZCA9PT0gMCk7XHJcbiAgfVxyXG5cclxuICBzZXQoZW5naW5lID0gbnVsbCkge1xyXG4gICAgY29uc3QgdGltZSA9IHRoaXMuX19zeW5jKCk7XHJcbiAgICBjb25zdCBzcGVlZCA9IHRoaXMuX19zcGVlZDtcclxuXHJcbiAgICBpZiAodGhpcy5fX3BsYXlDb250cm9sbGVkICE9PSBudWxsICYmIHRoaXMuX19wbGF5Q29udHJvbGxlZC5fX2VuZ2luZSAhPT0gZW5naW5lKSB7XHJcblxyXG4gICAgICB0aGlzLnN5bmNTcGVlZCh0aW1lLCB0aGlzLl9fcG9zaXRpb24sIDApO1xyXG5cclxuICAgICAgaWYgKHRoaXMuX19wbGF5Q29udHJvbGxlZClcclxuICAgICAgICB0aGlzLl9fcmVzZXRFbmdpbmUoKTtcclxuXHJcblxyXG4gICAgICBpZiAodGhpcy5fX3BsYXlDb250cm9sbGVkID09PSBudWxsICYmIGVuZ2luZSAhPT0gbnVsbCkge1xyXG4gICAgICAgIHRoaXMuX19zZXRFbmdpbmUoZW5naW5lKTtcclxuXHJcbiAgICAgICAgaWYgKHNwZWVkICE9PSAwKVxyXG4gICAgICAgICAgdGhpcy5zeW5jU3BlZWQodGltZSwgdGhpcy5fX3Bvc2l0aW9uLCBzcGVlZCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHBsYXkgY29udHJvbCBsb29wIGJlaGF2aW9yLlxyXG4gICAqXHJcbiAgICogQHR5cGUge0Jvb2xlYW59XHJcbiAgICogQG5hbWUgbG9vcFxyXG4gICAqIEBtZW1iZXJvZiBQbGF5Q29udHJvbFxyXG4gICAqIEBpbnN0YW5jZVxyXG4gICAqL1xyXG4gIHNldCBsb29wKGVuYWJsZSkge1xyXG4gICAgaWYgKGVuYWJsZSAmJiB0aGlzLl9fbG9vcFN0YXJ0ID4gLUluZmluaXR5ICYmIHRoaXMuX19sb29wRW5kIDwgSW5maW5pdHkpIHtcclxuICAgICAgaWYgKCF0aGlzLl9fbG9vcENvbnRyb2wpIHtcclxuICAgICAgICB0aGlzLl9fbG9vcENvbnRyb2wgPSBuZXcgTG9vcENvbnRyb2wodGhpcyk7XHJcbiAgICAgICAgdGhpcy5fX3NjaGVkdWxlci5hZGQodGhpcy5fX2xvb3BDb250cm9sLCBJbmZpbml0eSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLl9fc3BlZWQgIT09IDApIHtcclxuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuY3VycmVudFBvc2l0aW9uO1xyXG4gICAgICAgIGNvbnN0IGxvd2VyID0gTWF0aC5taW4odGhpcy5fX2xvb3BTdGFydCwgdGhpcy5fX2xvb3BFbmQpO1xyXG4gICAgICAgIGNvbnN0IHVwcGVyID0gTWF0aC5tYXgodGhpcy5fX2xvb3BTdGFydCwgdGhpcy5fX2xvb3BFbmQpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fX3NwZWVkID4gMCAmJiBwb3NpdGlvbiA+IHVwcGVyKVxyXG4gICAgICAgICAgdGhpcy5zZWVrKHVwcGVyKTtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLl9fc3BlZWQgPCAwICYmIHBvc2l0aW9uIDwgbG93ZXIpXHJcbiAgICAgICAgICB0aGlzLnNlZWsobG93ZXIpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIHRoaXMuX19sb29wQ29udHJvbC5yZXNjaGVkdWxlKHRoaXMuX19zcGVlZCk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAodGhpcy5fX2xvb3BDb250cm9sKSB7XHJcbiAgICAgIHRoaXMuX19zY2hlZHVsZXIucmVtb3ZlKHRoaXMuX19sb29wQ29udHJvbCk7XHJcbiAgICAgIHRoaXMuX19sb29wQ29udHJvbCA9IG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBnZXQgbG9vcCgpIHtcclxuICAgIHJldHVybiAoISF0aGlzLl9fbG9vcENvbnRyb2wpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyBsb29wIHN0YXJ0IGFuZCBlbmQgdGltZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsb29wU3RhcnQgLSBsb29wIHN0YXJ0IHZhbHVlLlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsb29wRW5kIC0gbG9vcCBlbmQgdmFsdWUuXHJcbiAgICovXHJcbiAgc2V0TG9vcEJvdW5kYXJpZXMobG9vcFN0YXJ0LCBsb29wRW5kKSB7XHJcbiAgICB0aGlzLl9fbG9vcFN0YXJ0ID0gbG9vcFN0YXJ0O1xyXG4gICAgdGhpcy5fX2xvb3BFbmQgPSBsb29wRW5kO1xyXG5cclxuICAgIHRoaXMubG9vcCA9IHRoaXMubG9vcDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgbG9vcCBzdGFydCB2YWx1ZVxyXG4gICAqXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKiBAbmFtZSBsb29wU3RhcnRcclxuICAgKiBAbWVtYmVyb2YgUGxheUNvbnRyb2xcclxuICAgKiBAaW5zdGFuY2VcclxuICAgKi9cclxuICBzZXQgbG9vcFN0YXJ0KGxvb3BTdGFydCkge1xyXG4gICAgdGhpcy5zZXRMb29wQm91bmRhcmllcyhsb29wU3RhcnQsIHRoaXMuX19sb29wRW5kKTtcclxuICB9XHJcblxyXG4gIGdldCBsb29wU3RhcnQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fX2xvb3BTdGFydDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgbG9vcCBlbmQgdmFsdWVcclxuICAgKlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICogQG5hbWUgbG9vcEVuZFxyXG4gICAqIEBtZW1iZXJvZiBQbGF5Q29udHJvbFxyXG4gICAqIEBpbnN0YW5jZVxyXG4gICAqL1xyXG4gIHNldCBsb29wRW5kKGxvb3BFbmQpIHtcclxuICAgIHRoaXMuc2V0TG9vcEJvdW5kYXJpZXModGhpcy5fX2xvb3BTdGFydCwgbG9vcEVuZCk7XHJcbiAgfVxyXG5cclxuICBnZXQgbG9vcEVuZCgpIHtcclxuICAgIHJldHVybiB0aGlzLl9fbG9vcEVuZDtcclxuICB9XHJcblxyXG4gIC8vIFRpbWVFbmdpbmUgbWV0aG9kIChzcGVlZC1jb250cm9sbGVkIGludGVyZmFjZSlcclxuICBzeW5jU3BlZWQodGltZSwgcG9zaXRpb24sIHNwZWVkLCBzZWVrID0gZmFsc2UpIHtcclxuICAgIGNvbnN0IGxhc3RTcGVlZCA9IHRoaXMuX19zcGVlZDtcclxuXHJcbiAgICBpZiAoc3BlZWQgIT09IGxhc3RTcGVlZCB8fCBzZWVrKSB7XHJcbiAgICAgIGlmICgoc2VlayB8fCBsYXN0U3BlZWQgPT09IDApICYmIHRoaXMuX19sb29wQ29udHJvbClcclxuICAgICAgICBwb3NpdGlvbiA9IHRoaXMuX19sb29wQ29udHJvbC5hcHBseUxvb3BCb3VuZGFyaWVzKHBvc2l0aW9uLCBzcGVlZCk7XHJcblxyXG4gICAgICB0aGlzLl9fdGltZSA9IHRpbWU7XHJcbiAgICAgIHRoaXMuX19wb3NpdGlvbiA9IHBvc2l0aW9uO1xyXG4gICAgICB0aGlzLl9fc3BlZWQgPSBzcGVlZDtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9fcGxheUNvbnRyb2xsZWQpXHJcbiAgICAgICAgdGhpcy5fX3BsYXlDb250cm9sbGVkLnN5bmNTcGVlZCh0aW1lLCBwb3NpdGlvbiwgc3BlZWQsIHNlZWssIGxhc3RTcGVlZCk7XHJcblxyXG4gICAgICBpZiAodGhpcy5fX2xvb3BDb250cm9sKVxyXG4gICAgICAgIHRoaXMuX19sb29wQ29udHJvbC5yZXNjaGVkdWxlKHNwZWVkKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN0YXJ0cyBwbGF5YmFja1xyXG4gICAqL1xyXG4gIHN0YXJ0KCkge1xyXG4gICAgY29uc3QgdGltZSA9IHRoaXMuX19zeW5jKCk7XHJcbiAgICB0aGlzLnN5bmNTcGVlZCh0aW1lLCB0aGlzLl9fcG9zaXRpb24sIHRoaXMuX19wbGF5aW5nU3BlZWQpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUGF1c2VzIHBsYXliYWNrIGFuZCBzdGF5cyBhdCB0aGUgc2FtZSBwb3NpdGlvbi5cclxuICAgKi9cclxuICBwYXVzZSgpIHtcclxuICAgIGNvbnN0IHRpbWUgPSB0aGlzLl9fc3luYygpO1xyXG4gICAgdGhpcy5zeW5jU3BlZWQodGltZSwgdGhpcy5fX3Bvc2l0aW9uLCAwKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN0b3BzIHBsYXliYWNrIGFuZCBzZWVrcyB0byBpbml0aWFsICgwKSBwb3NpdGlvbi5cclxuICAgKi9cclxuICBzdG9wKCkge1xyXG4gICAgY29uc3QgdGltZSA9IHRoaXMuX19zeW5jKCk7XHJcbiAgICB0aGlzLnN5bmNTcGVlZCh0aW1lLCAwLCAwLCB0cnVlKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIElmIHNwZWVkIGlmIHByb3ZpZGVkLCBzZXRzIHRoZSBwbGF5YmFjayBzcGVlZC4gVGhlIHNwZWVkIHZhbHVlIHNob3VsZFxyXG4gICAqIGJlIG5vbi16ZXJvIGJldHdlZW4gLTE2IGFuZCAtMS8xNiBvciBiZXR3ZWVuIDEvMTYgYW5kIDE2LlxyXG4gICAqXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKiBAbmFtZSBzcGVlZFxyXG4gICAqIEBtZW1iZXJvZiBQbGF5Q29udHJvbFxyXG4gICAqIEBpbnN0YW5jZVxyXG4gICAqL1xyXG4gIHNldCBzcGVlZChzcGVlZCkge1xyXG4gICAgY29uc3QgdGltZSA9IHRoaXMuX19zeW5jKCk7XHJcblxyXG4gICAgaWYgKHNwZWVkID49IDApIHtcclxuICAgICAgaWYgKHNwZWVkIDwgMC4wMSlcclxuICAgICAgICBzcGVlZCA9IDAuMDE7XHJcbiAgICAgIGVsc2UgaWYgKHNwZWVkID4gMTAwKVxyXG4gICAgICAgIHNwZWVkID0gMTAwO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKHNwZWVkIDwgLTEwMClcclxuICAgICAgICBzcGVlZCA9IC0xMDA7XHJcbiAgICAgIGVsc2UgaWYgKHNwZWVkID4gLTAuMDEpXHJcbiAgICAgICAgc3BlZWQgPSAtMC4wMTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9fcGxheWluZ1NwZWVkID0gc3BlZWQ7XHJcblxyXG4gICAgaWYgKCF0aGlzLm1hc3RlciAmJiB0aGlzLl9fc3BlZWQgIT09IDApXHJcbiAgICAgIHRoaXMuc3luY1NwZWVkKHRpbWUsIHRoaXMuX19wb3NpdGlvbiwgc3BlZWQpO1xyXG4gIH1cclxuXHJcbiAgZ2V0IHNwZWVkKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX19wbGF5aW5nU3BlZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgKGp1bXAgdG8pIHBsYXlpbmcgcG9zaXRpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge051bWJlcn0gcG9zaXRpb24gdGFyZ2V0IHBvc2l0aW9uXHJcbiAgICovXHJcbiAgc2Vlayhwb3NpdGlvbikge1xyXG4gICAgY29uc3QgdGltZSA9IHRoaXMuX19zeW5jKCk7XHJcbiAgICB0aGlzLl9fcG9zaXRpb24gPSBwb3NpdGlvbjtcclxuICAgIHRoaXMuc3luY1NwZWVkKHRpbWUsIHBvc2l0aW9uLCB0aGlzLl9fc3BlZWQsIHRydWUpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgUGxheUNvbnRyb2w7XHJcbiIsImltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XHJcbmltcG9ydCBkZWZhdWx0QXVkaW9Db250ZXh0IGZyb20gJy4uL2NvcmUvYXVkaW8tY29udGV4dCc7XHJcbmltcG9ydCBTY2hlZHVsaW5nUXVldWUgZnJvbSAnLi4vY29yZS9zY2hlZHVsaW5nLXF1ZXVlJztcclxuXHJcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXZlc2pzOmF1ZGlvJyk7XHJcblxyXG4vKipcclxuICogVGhlIGBTY2hlZHVsZXJgIGNsYXNzIGltcGxlbWVudHMgYSBtYXN0ZXIgZm9yIGBUaW1lRW5naW5lYCBvciBgQXVkaW9UaW1lRW5naW5lYFxyXG4gKiBpbnN0YW5jZXMgdGhhdCBpbXBsZW1lbnQgdGhlICpzY2hlZHVsZWQqIGludGVyZmFjZSBzdWNoIGFzIHRoZSBgTWV0cm9ub21lYFxyXG4gKiBgR3JhbnVsYXJFbmdpbmVgLlxyXG4gKlxyXG4gKiBBIGBTY2hlZHVsZXJgIGNhbiBhbHNvIHNjaGVkdWxlIHNpbXBsZSBjYWxsYmFjayBmdW5jdGlvbnMuXHJcbiAqIFRoZSBjbGFzcyBpcyBiYXNlZCBvbiByZWN1cnNpdmUgY2FsbHMgdG8gYHNldFRpbWVPdXRgIGFuZCB1c2VzIHRoZVxyXG4gKiBgYXVkaW9Db250ZXh0LmN1cnJlbnRUaW1lYCBhcyBsb2dpY2FsIHBhc3NlZCB0byB0aGUgYGFkdmFuY2VUaW1lYCBtZXRob2RzXHJcbiAqIG9mIHRoZSBzY2hlZHVsZWQgZW5naW5lcyBvciB0byB0aGUgc2NoZWR1bGVkIGNhbGxiYWNrIGZ1bmN0aW9ucy5cclxuICogSXQgZXh0ZW5kcyB0aGUgYFNjaGVkdWxpbmdRdWV1ZWAgY2xhc3MgdGhhdCBpdHNlbGYgaW5jbHVkZXMgYSBgUHJpb3JpdHlRdWV1ZWBcclxuICogdG8gYXNzdXJlIHRoZSBvcmRlciBvZiB0aGUgc2NoZWR1bGVkIGVuZ2luZXMgKHNlZSBgU2ltcGxlU2NoZWR1bGVyYCBmb3IgYVxyXG4gKiBzaW1wbGlmaWVkIHNjaGVkdWxlciBpbXBsZW1lbnRhdGlvbiB3aXRob3V0IGBQcmlvcml0eVF1ZXVlYCkuXHJcbiAqXHJcbiAqIFRvIGdldCBhIHVuaXF1ZSBpbnN0YW5jZSBvZiBgU2NoZWR1bGVyYCBhcyB0aGUgZ2xvYmFsIHNjaGVkdWxlciBvZiBhblxyXG4gKiBhcHBsaWNhdGlvbiwgdGhlIGBnZXRTY2hlZHVsZXJgIGZhY3RvcnkgZnVuY3Rpb24gc2hvdWxkIGJlIHVzZWQuIFRoZVxyXG4gKiBmdW5jdGlvbiBhY2NlcHRzIGFuIGF1ZGlvIGNvbnRleHQgYXMgb3B0aW9uYWwgYXJndW1lbnQgYW5kIHVzZXMgdGhlIFdhdmVzXHJcbiAqIGRlZmF1bHQgYXVkaW8gY29udGV4dCAoc2VlIGBhdWRpb0NvbnRleHRgKSBhc1xyXG4gKiBkZWZhdWx0LiBUaGUgZmFjdG9yeSBjcmVhdGVzIGEgc2luZ2xlIHNjaGVkdWxlciBmb3IgZWFjaCBhdWRpbyBjb250ZXh0LlxyXG4gKlxyXG4gKiBFeGFtcGxlIHRoYXQgc2hvd3MgdGhyZWUgTWV0cm9ub21lIGVuZ2luZXMgcnVubmluZyBpbiBhIFNjaGVkdWxlcjpcclxuICoge0BsaW5rIGh0dHBzOi8vcmF3Z2l0LmNvbS93YXZlc2pzL3dhdmVzLWF1ZGlvL21hc3Rlci9leGFtcGxlcy9zY2hlZHVsZXIuaHRtbH1cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSAtIGRlZmF1bHQgb3B0aW9uc1xyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMucGVyaW9kPTAuMDI1XSAtIHBlcmlvZCBvZiB0aGUgc2NoZWR1bGVyLlxyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMubG9va2FoZWFkPTAuMV0gLSBsb29rYWhlYWQgb2YgdGhlIHNjaGVkdWxlci5cclxuICpcclxuICogQHNlZSBUaW1lRW5naW5lXHJcbiAqIEBzZWUgQXVkaW9UaW1lRW5naW5lXHJcbiAqIEBzZWUgZ2V0U2NoZWR1bGVyXHJcbiAqIEBzZWUgU2ltcGxlU2NoZWR1bGVyXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGltcG9ydCAqIGFzIGF1ZGlvIGZyb20gJ3dhdmVzLWF1ZGlvJztcclxuICogY29uc3Qgc2NoZWR1bGVyID0gYXVkaW8uZ2V0U2NoZWR1bGVyKCk7XHJcbiAqXHJcbiAqIHNjaGVkdWxlci5hZGQobXlFbmdpbmUpO1xyXG4gKi9cclxuY2xhc3MgU2NoZWR1bGVyIGV4dGVuZHMgU2NoZWR1bGluZ1F1ZXVlIHtcclxuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgdGhpcy5hdWRpb0NvbnRleHQgPSBvcHRpb25zLmF1ZGlvQ29udGV4dCB8fCDCoGRlZmF1bHRBdWRpb0NvbnRleHQ7XHJcblxyXG4gICAgdGhpcy5fX2N1cnJlbnRUaW1lID0gbnVsbDtcclxuICAgIHRoaXMuX19uZXh0VGltZSA9IEluZmluaXR5O1xyXG4gICAgdGhpcy5fX3RpbWVvdXQgPSBudWxsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2NoZWR1bGVyIChzZXRUaW1lb3V0KSBwZXJpb2RcclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgKiBAbmFtZSBwZXJpb2RcclxuICAgICAqIEBtZW1iZXJvZiBTY2hlZHVsZXJcclxuICAgICAqIEBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICB0aGlzLnBlcmlvZCA9IG9wdGlvbnMucGVyaW9kIHx8IMKgMC4wMjU7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzY2hlZHVsZXIgbG9va2FoZWFkIHRpbWUgKD4gcGVyaW9kKVxyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBuYW1lIGxvb2thaGVhZFxyXG4gICAgICogQG1lbWJlcm9mIFNjaGVkdWxlclxyXG4gICAgICogQGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIHRoaXMubG9va2FoZWFkID0gb3B0aW9ucy5sb29rYWhlYWQgfHwgwqAwLjE7XHJcbiAgfVxyXG5cclxuICAvLyBzZXRUaW1lb3V0IHNjaGVkdWxpbmcgbG9vcFxyXG4gIF9fdGljaygpIHtcclxuICAgIGNvbnN0IGF1ZGlvQ29udGV4dCA9IHRoaXMuYXVkaW9Db250ZXh0O1xyXG4gICAgY29uc3QgY3VycmVudFRpbWUgPSBhdWRpb0NvbnRleHQuY3VycmVudFRpbWU7XHJcbiAgICBsZXQgdGltZSA9IHRoaXMuX19uZXh0VGltZTtcclxuXHJcbiAgICB0aGlzLl9fdGltZW91dCA9IG51bGw7XHJcblxyXG4gICAgd2hpbGUgKHRpbWUgPD0gY3VycmVudFRpbWUgKyB0aGlzLmxvb2thaGVhZCkge1xyXG4gICAgICB0aGlzLl9fY3VycmVudFRpbWUgPSB0aW1lO1xyXG4gICAgICB0aW1lID0gdGhpcy5hZHZhbmNlVGltZSh0aW1lKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9fY3VycmVudFRpbWUgPSBudWxsO1xyXG4gICAgdGhpcy5yZXNldFRpbWUodGltZSk7XHJcbiAgfVxyXG5cclxuICByZXNldFRpbWUodGltZSA9IHRoaXMuY3VycmVudFRpbWUpIHtcclxuICAgIGlmICh0aGlzLm1hc3Rlcikge1xyXG4gICAgICB0aGlzLm1hc3Rlci5yZXNldCh0aGlzLCB0aW1lKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICh0aGlzLl9fdGltZW91dCkge1xyXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9fdGltZW91dCk7XHJcbiAgICAgICAgdGhpcy5fX3RpbWVvdXQgPSBudWxsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGltZSAhPT0gSW5maW5pdHkpIHtcclxuICAgICAgICBpZiAodGhpcy5fX25leHRUaW1lID09PSBJbmZpbml0eSlcclxuICAgICAgICAgIGxvZygnU2NoZWR1bGVyIFN0YXJ0Jyk7XHJcblxyXG4gICAgICAgIGNvbnN0IHRpbWVPdXREZWxheSA9IE1hdGgubWF4KCh0aW1lIC0gdGhpcy5sb29rYWhlYWQgLSB0aGlzLmF1ZGlvQ29udGV4dC5jdXJyZW50VGltZSksIHRoaXMucGVyaW9kKTtcclxuXHJcbiAgICAgICAgdGhpcy5fX3RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgIHRoaXMuX190aWNrKCk7XHJcbiAgICAgICAgfSwgTWF0aC5jZWlsKHRpbWVPdXREZWxheSAqIDEwMDApKTtcclxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9fbmV4dFRpbWUgIT09IEluZmluaXR5KSB7XHJcbiAgICAgICAgbG9nKCdTY2hlZHVsZXIgU3RvcCcpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl9fbmV4dFRpbWUgPSB0aW1lO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2NoZWR1bGVyIGN1cnJlbnQgbG9naWNhbCB0aW1lLlxyXG4gICAqXHJcbiAgICogQG5hbWUgY3VycmVudFRpbWVcclxuICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAqIEBtZW1iZXJvZiBTY2hlZHVsZXJcclxuICAgKiBAaW5zdGFuY2VcclxuICAgKi9cclxuICBnZXQgY3VycmVudFRpbWUoKSB7XHJcbiAgICBpZiAodGhpcy5tYXN0ZXIpXHJcbiAgICAgIHJldHVybiB0aGlzLm1hc3Rlci5jdXJyZW50VGltZTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5fX2N1cnJlbnRUaW1lIHx8IHRoaXMuYXVkaW9Db250ZXh0LmN1cnJlbnRUaW1lICsgdGhpcy5sb29rYWhlYWQ7XHJcbiAgfVxyXG5cclxuICBnZXQgY3VycmVudFBvc2l0aW9uKCkge1xyXG4gICAgY29uc3QgbWFzdGVyID0gdGhpcy5tYXN0ZXI7XHJcblxyXG4gICAgaWYgKG1hc3RlciAmJiBtYXN0ZXIuY3VycmVudFBvc2l0aW9uICE9PSB1bmRlZmluZWQpXHJcbiAgICAgIHJldHVybiBtYXN0ZXIuY3VycmVudFBvc2l0aW9uO1xyXG5cclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICAvLyBpbmhlcml0ZWQgZnJvbSBzY2hlZHVsaW5nIHF1ZXVlXHJcbiAgLyoqXHJcbiAgICogQWRkIGEgVGltZUVuZ2luZSBvciBhIHNpbXBsZSBjYWxsYmFjayBmdW5jdGlvbiB0byB0aGUgc2NoZWR1bGVyIGF0IGFuXHJcbiAgICogb3B0aW9uYWxseSBnaXZlbiB0aW1lLiBXaGV0aGVyIHRoZSBhZGQgbWV0aG9kIGlzIGNhbGxlZCB3aXRoIGEgVGltZUVuZ2luZVxyXG4gICAqIG9yIGEgY2FsbGJhY2sgZnVuY3Rpb24gaXQgcmV0dXJucyBhIFRpbWVFbmdpbmUgdGhhdCBjYW4gYmUgdXNlZCBhcyBhcmd1bWVudFxyXG4gICAqIG9mIHRoZSBtZXRob2RzIHJlbW92ZSBhbmQgcmVzZXRFbmdpbmVUaW1lLiBBIFRpbWVFbmdpbmUgYWRkZWQgdG8gYSBzY2hlZHVsZXJcclxuICAgKiBoYXMgdG8gaW1wbGVtZW50IHRoZSBzY2hlZHVsZWQgaW50ZXJmYWNlLiBUaGUgY2FsbGJhY2sgZnVuY3Rpb24gYWRkZWQgdG8gYVxyXG4gICAqIHNjaGVkdWxlciB3aWxsIGJlIGNhbGxlZCBhdCB0aGUgZ2l2ZW4gdGltZSBhbmQgd2l0aCB0aGUgZ2l2ZW4gdGltZSBhc1xyXG4gICAqIGFyZ3VtZW50LiBUaGUgY2FsbGJhY2sgY2FuIHJldHVybiBhIG5ldyBzY2hlZHVsaW5nIHRpbWUgKGkuZS4gdGhlIG5leHRcclxuICAgKiB0aW1lIHdoZW4gaXQgd2lsbCBiZSBjYWxsZWQpIG9yIGl0IGNhbiByZXR1cm4gSW5maW5pdHkgdG8gc3VzcGVuZCBzY2hlZHVsaW5nXHJcbiAgICogd2l0aG91dCByZW1vdmluZyB0aGUgZnVuY3Rpb24gZnJvbSB0aGUgc2NoZWR1bGVyLiBBIGZ1bmN0aW9uIHRoYXQgZG9lc1xyXG4gICAqIG5vdCByZXR1cm4gYSB2YWx1ZSAob3IgcmV0dXJucyBudWxsIG9yIDApIGlzIHJlbW92ZWQgZnJvbSB0aGUgc2NoZWR1bGVyXHJcbiAgICogYW5kIGNhbm5vdCBiZSB1c2VkIGFzIGFyZ3VtZW50IG9mIHRoZSBtZXRob2RzIHJlbW92ZSBhbmQgcmVzZXRFbmdpbmVUaW1lXHJcbiAgICogYW55bW9yZS5cclxuICAgKlxyXG4gICAqIEBuYW1lIGFkZFxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBtZW1iZXJvZiBTY2hlZHVsZXJcclxuICAgKiBAaW5zdGFuY2VcclxuICAgKiBAcGFyYW0ge1RpbWVFbmdpbmV8RnVuY3Rpb259IGVuZ2luZSAtIEVuZ2luZSB0byBhZGQgdG8gdGhlIHNjaGVkdWxlclxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBbdGltZT10aGlzLmN1cnJlbnRUaW1lXSAtIFNjaGVkdWxlIHRpbWVcclxuICAgKi9cclxuICAvKipcclxuICAgKiBSZW1vdmUgYSBUaW1lRW5naW5lIGZyb20gdGhlIHNjaGVkdWxlciB0aGF0IGhhcyBiZWVuIGFkZGVkIHRvIHRoZVxyXG4gICAqIHNjaGVkdWxlciB1c2luZyB0aGUgYWRkIG1ldGhvZC5cclxuICAgKlxyXG4gICAqIEBuYW1lIGFkZFxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBtZW1iZXJvZiBTY2hlZHVsZXJcclxuICAgKiBAaW5zdGFuY2VcclxuICAgKiBAcGFyYW0ge1RpbWVFbmdpbmV9IGVuZ2luZSAtIEVuZ2luZSB0byByZW1vdmUgZnJvbSB0aGUgc2NoZWR1bGVyXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IFt0aW1lPXRoaXMuY3VycmVudFRpbWVdIC0gU2NoZWR1bGUgdGltZVxyXG4gICAqL1xyXG4gIC8qKlxyXG4gICAqIFJlc2NoZWR1bGUgYSBzY2hlZHVsZWQgdGltZSBlbmdpbmUgYXQgYSBnaXZlbiB0aW1lLlxyXG4gICAqXHJcbiAgICogQG5hbWUgcmVzZXRFbmdpbmVUaW1lXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQG1lbWJlcm9mIFNjaGVkdWxlclxyXG4gICAqIEBpbnN0YW5jZVxyXG4gICAqIEBwYXJhbSB7VGltZUVuZ2luZX0gZW5naW5lIC0gRW5naW5lIHRvIHJlc2NoZWR1bGVcclxuICAgKiBAcGFyYW0ge051bWJlcn0gdGltZSAtIFNjaGVkdWxlIHRpbWVcclxuICAgKi9cclxuICAvKipcclxuICAgKiBSZW1vdmUgYWxsIHNjaGVkdWxlZCBjYWxsYmFja3MgYW5kIGVuZ2luZXMgZnJvbSB0aGUgc2NoZWR1bGVyLlxyXG4gICAqXHJcbiAgICogQG5hbWUgY2xlYXJcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAbWVtYmVyb2YgU2NoZWR1bGVyXHJcbiAgICogQGluc3RhbmNlXHJcbiAgICovXHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTY2hlZHVsZXI7XHJcbiIsImltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XHJcbmltcG9ydCBkZWZhdWx0QXVkaW9Db250ZXh0IGZyb20gJy4uL2NvcmUvYXVkaW8tY29udGV4dCc7XHJcbmltcG9ydCBUaW1lRW5naW5lIGZyb20gJy4uL2NvcmUvdGltZS1lbmdpbmUnO1xyXG5cclxuY29uc3QgbG9nID0gZGVidWcoJ3dhdmVzanM6YXVkaW8nKTtcclxuXHJcbi8qKlxyXG4gKlxyXG4gKlxyXG4gKlxyXG4gKiBUaGUgU2ltcGxlU2NoZWR1bGVyIGNsYXNzIGltcGxlbWVudHMgYSBzaW1wbGlmaWVkIG1hc3RlciBmb3IgdGltZSBlbmdpbmVzXHJcbiAqIChzZWUgVGltZUVuZ2luZSBvciBBdWRpb1RpbWVFbmdpbmUpIHRoYXQgaW1wbGVtZW50IHRoZSBzY2hlZHVsZWQgaW50ZXJmYWNlXHJcbiAqIHN1Y2ggYXMgdGhlIE1ldHJvbm9tZSBhbmQgdGhlIEdyYW51bGFyRW5naW5lLiBUaGUgQVBJIGFuZCBmdW50aW9uYWxpdGllcyBvZlxyXG4gKiB0aGUgU2ltcGxlU2NoZWR1bGVyIGNsYXNzIGFyZSBpZGVudGljYWwgdG8gdGhlIFNjaGVkdWxlciBjbGFzcy4gQnV0LCBvdGhlclxyXG4gKiB0aGFuIHRoZSBTY2hlZHVsZXIsIHRoZSBTaW1wbGVTY2hlZHVsZXIgY2xhc3MgZG9lcyBub3QgZ3VhcmFudGVlIHRoZSBvcmRlclxyXG4gKiBvZiBldmVudHMgKGkuZS4gY2FsbHMgdG8gdGhlIGFkdmFuY2VUaW1lIG1ldGhvZCBvZiBzY2hlZHVsZWQgdGltZSBlbmdpbmVzXHJcbiAqIGFuZCB0byBzY2hlZHVsZWQgY2FsbGJhY2sgZnVuY3Rpb25zKSB3aXRoaW4gYSBzY2hlZHVsaW5nIHBlcmlvZCAoc2VlIHBlcmlvZFxyXG4gKiBhdHRyaWJ1dGUpLlxyXG4gKlxyXG4gKiBUbyBnZXQgYSB1bmlxdWUgaW5zdGFuY2Ugb2YgU2ltcGxlU2NoZWR1bGVyIGFzIHRoZSBnbG9iYWwgc2NoZWR1bGVyIG9mIGFuXHJcbiAqIGFwcGxpY2F0aW9uLCB0aGUgZ2V0U2ltcGxlU2NoZWR1bGVyIGZhY3RvcnkgZnVuY3Rpb24gc2hvdWxkIGJlIHVzZWQuIFRoZVxyXG4gKiBmdW5jdGlvbiBhY2NlcHRzIGFuIGF1ZGlvIGNvbnRleHQgYXMgb3B0aW9uYWwgYXJndW1lbnQgYW5kIHVzZXMgdGhlIFdhdmVzXHJcbiAqIGRlZmF1bHQgYXVkaW8gY29udGV4dCAoc2VlIEF1ZGlvIENvbnRleHQpIGFzIGRlZmF1bHQuIFRoZSBmYWN0b3J5IGNyZWF0ZXNcclxuICogYSBzaW5nbGUgKHNpbXBsZSkgc2NoZWR1bGVyIGZvciBlYWNoIGF1ZGlvIGNvbnRleHQuXHJcbiAqXHJcbiAqIEV4YW1wbGUgdGhhdCBzaG93cyB0aHJlZSBNZXRyb25vbWUgZW5naW5lcyBydW5uaW5nIGluIGEgU2ltcGxlU2NoZWR1bGVyOlxyXG4gKiB7QGxpbmsgaHR0cHM6Ly9yYXdnaXQuY29tL3dhdmVzanMvd2F2ZXMtYXVkaW8vbWFzdGVyL2V4YW1wbGVzL3NpbXBsZS1zY2hlZHVsZXIuaHRtbH1cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSAtIGRlZmF1bHQgb3B0aW9uc1xyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMucGVyaW9kPTAuMDI1XSAtIHBlcmlvZCBvZiB0aGUgc2NoZWR1bGVyLlxyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMubG9va2FoZWFkPTAuMV0gLSBsb29rYWhlYWQgb2YgdGhlIHNjaGVkdWxlci5cclxuICpcclxuICogQHNlZSBUaW1lRW5naW5lXHJcbiAqIEBzZWUgQXVkaW9UaW1lRW5naW5lXHJcbiAqIEBzZWUgZ2V0U2ltcGxlU2NoZWR1bGVyXHJcbiAqIEBzZWUgU2NoZWR1bGVyXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGltcG9ydCAqIGFzIGF1ZGlvIGZyb20gJ3dhdmVzLWF1ZGlvJztcclxuICogY29uc3Qgc2NoZWR1bGVyID0gYXVkaW8uZ2V0U2ltcGxlU2NoZWR1bGVyKCk7XHJcbiAqXHJcbiAqIHNjaGVkdWxlci5hZGQobXlFbmdpbmUpO1xyXG4gKi9cclxuY2xhc3MgU2ltcGxlU2NoZWR1bGVyIHtcclxuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcclxuICAgIHRoaXMuYXVkaW9Db250ZXh0ID0gb3B0aW9ucy5hdWRpb0NvbnRleHQgfHwgwqBkZWZhdWx0QXVkaW9Db250ZXh0O1xyXG5cclxuICAgIHRoaXMuX19lbmdpbmVzID0gbmV3IFNldCgpO1xyXG5cclxuICAgIHRoaXMuX19zY2hlZEVuZ2luZXMgPSBbXTtcclxuICAgIHRoaXMuX19zY2hlZFRpbWVzID0gW107XHJcblxyXG4gICAgdGhpcy5fX2N1cnJlbnRUaW1lID0gbnVsbDtcclxuICAgIHRoaXMuX190aW1lb3V0ID0gbnVsbDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIHNjaGVkdWxlciAoc2V0VGltZW91dCkgcGVyaW9kXHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQG5hbWUgcGVyaW9kXHJcbiAgICAgKiBAbWVtYmVyb2YgU2NoZWR1bGVyXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5wZXJpb2QgPSBvcHRpb25zLnBlcmlvZCB8fCAwLjAyNTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIHNjaGVkdWxlciBsb29rYWhlYWQgdGltZSAoPiBwZXJpb2QpXHJcbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAgICogQG5hbWUgbG9va2FoZWFkXHJcbiAgICAgKiBAbWVtYmVyb2YgU2NoZWR1bGVyXHJcbiAgICAgKiBAaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5sb29rYWhlYWQgPSBvcHRpb25zLmxvb2thaGVhZCB8fCAwLjE7XHJcbiAgfVxyXG5cclxuICBfX3NjaGVkdWxlRW5naW5lKGVuZ2luZSwgdGltZSkge1xyXG4gICAgdGhpcy5fX3NjaGVkRW5naW5lcy5wdXNoKGVuZ2luZSk7XHJcbiAgICB0aGlzLl9fc2NoZWRUaW1lcy5wdXNoKHRpbWUpO1xyXG4gIH1cclxuXHJcbiAgX19yZXNjaGVkdWxlRW5naW5lKGVuZ2luZSwgdGltZSkge1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5fX3NjaGVkRW5naW5lcy5pbmRleE9mKGVuZ2luZSk7XHJcblxyXG4gICAgaWYgKGluZGV4ID49IDApIHtcclxuICAgICAgaWYgKHRpbWUgIT09IEluZmluaXR5KSB7XHJcbiAgICAgICAgdGhpcy5fX3NjaGVkVGltZXNbaW5kZXhdID0gdGltZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLl9fc2NoZWRFbmdpbmVzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgdGhpcy5fX3NjaGVkVGltZXMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmICh0aW1lIDwgSW5maW5pdHkpIHtcclxuICAgICAgdGhpcy5fX3NjaGVkRW5naW5lcy5wdXNoKGVuZ2luZSk7XHJcbiAgICAgIHRoaXMuX19zY2hlZFRpbWVzLnB1c2godGltZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBfX3Vuc2NoZWR1bGVFbmdpbmUoZW5naW5lKSB7XHJcbiAgICB2YXIgaW5kZXggPSB0aGlzLl9fc2NoZWRFbmdpbmVzLmluZGV4T2YoZW5naW5lKTtcclxuXHJcbiAgICBpZiAoaW5kZXggPj0gMCkge1xyXG4gICAgICB0aGlzLl9fc2NoZWRFbmdpbmVzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgIHRoaXMuX19zY2hlZFRpbWVzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBfX3Jlc2V0VGljaygpIHtcclxuICAgIGlmICh0aGlzLl9fc2NoZWRFbmdpbmVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgaWYgKCF0aGlzLl9fdGltZW91dCkge1xyXG4gICAgICAgIGxvZygnU2ltcGxlU2NoZWR1bGVyIFN0YXJ0Jyk7XHJcbiAgICAgICAgdGhpcy5fX3RpY2soKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmICh0aGlzLl9fdGltZW91dCkge1xyXG4gICAgICBsb2coJ1NpbXBsZVNjaGVkdWxlciBTdG9wJyk7XHJcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9fdGltZW91dCk7XHJcbiAgICAgIHRoaXMuX190aW1lb3V0ID0gbnVsbDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIF9fdGljaygpIHtcclxuICAgIHZhciBhdWRpb0NvbnRleHQgPSB0aGlzLmF1ZGlvQ29udGV4dDtcclxuICAgIHZhciBjdXJyZW50VGltZSA9IGF1ZGlvQ29udGV4dC5jdXJyZW50VGltZTtcclxuICAgIHZhciBpID0gMDtcclxuXHJcbiAgICB3aGlsZSAoaSA8IHRoaXMuX19zY2hlZEVuZ2luZXMubGVuZ3RoKSB7XHJcbiAgICAgIHZhciBlbmdpbmUgPSB0aGlzLl9fc2NoZWRFbmdpbmVzW2ldO1xyXG4gICAgICB2YXIgdGltZSA9IHRoaXMuX19zY2hlZFRpbWVzW2ldO1xyXG5cclxuICAgICAgd2hpbGUgKHRpbWUgJiYgdGltZSA8PSBjdXJyZW50VGltZSArIHRoaXMubG9va2FoZWFkKSB7XHJcbiAgICAgICAgdGltZSA9IE1hdGgubWF4KHRpbWUsIGN1cnJlbnRUaW1lKTtcclxuICAgICAgICB0aGlzLl9fY3VycmVudFRpbWUgPSB0aW1lO1xyXG4gICAgICAgIHRpbWUgPSBlbmdpbmUuYWR2YW5jZVRpbWUodGltZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aW1lICYmIHRpbWUgPCBJbmZpbml0eSkge1xyXG4gICAgICAgIHRoaXMuX19zY2hlZFRpbWVzW2krK10gPSB0aW1lO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuX191bnNjaGVkdWxlRW5naW5lKGVuZ2luZSk7XHJcblxyXG4gICAgICAgIC8vIHJlbW92ZSBlbmdpbmUgZnJvbSBzY2hlZHVsZXJcclxuICAgICAgICBpZiAoIXRpbWUpIHtcclxuICAgICAgICAgIGVuZ2luZS5tYXN0ZXIgPSBudWxsO1xyXG4gICAgICAgICAgdGhpcy5fX2VuZ2luZXMuZGVsZXRlKGVuZ2luZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fX2N1cnJlbnRUaW1lID0gbnVsbDtcclxuICAgIHRoaXMuX190aW1lb3V0ID0gbnVsbDtcclxuXHJcbiAgICBpZiAodGhpcy5fX3NjaGVkRW5naW5lcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHRoaXMuX190aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5fX3RpY2soKTtcclxuICAgICAgfSwgdGhpcy5wZXJpb2QgKiAxMDAwKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNjaGVkdWxlciBjdXJyZW50IGxvZ2ljYWwgdGltZS5cclxuICAgKlxyXG4gICAqIEBuYW1lIGN1cnJlbnRUaW1lXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKiBAbWVtYmVyb2YgU2NoZWR1bGVyXHJcbiAgICogQGluc3RhbmNlXHJcbiAgICovXHJcbiAgZ2V0IGN1cnJlbnRUaW1lKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX19jdXJyZW50VGltZSB8fCB0aGlzLmF1ZGlvQ29udGV4dC5jdXJyZW50VGltZSArIHRoaXMubG9va2FoZWFkO1xyXG4gIH1cclxuXHJcbiAgZ2V0IGN1cnJlbnRQb3NpdGlvbigpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICAvLyBjYWxsIGEgZnVuY3Rpb24gYXQgYSBnaXZlbiB0aW1lXHJcbiAgLyoqXHJcbiAgICogRGVmZXIgdGhlIGV4ZWN1dGlvbiBvZiBhIGZ1bmN0aW9uIGF0IGEgZ2l2ZW4gdGltZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1biAtIEZ1bmN0aW9uIHRvIGRlZmVyXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IFt0aW1lPXRoaXMuY3VycmVudFRpbWVdIC0gU2NoZWR1bGUgdGltZVxyXG4gICAqL1xyXG4gIGRlZmVyKGZ1biwgdGltZSA9IHRoaXMuY3VycmVudFRpbWUpIHtcclxuICAgIGlmICghKGZ1biBpbnN0YW5jZW9mIEZ1bmN0aW9uKSlcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwib2JqZWN0IGNhbm5vdCBiZSBkZWZlcmVkIGJ5IHNjaGVkdWxlclwiKTtcclxuXHJcbiAgICB0aGlzLmFkZCh7XHJcbiAgICAgIGFkdmFuY2VUaW1lOiBmdW5jdGlvbih0aW1lKSB7IGZ1bih0aW1lKTsgfSwgLy8gbWFrZSBzdXIgdGhhdCB0aGUgYWR2YW5jZVRpbWUgbWV0aG9kIGRvZXMgbm90IHJldHVybSBhbnl0aGluZ1xyXG4gICAgfSwgdGltZSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGQgYSBUaW1lRW5naW5lIGZ1bmN0aW9uIHRvIHRoZSBzY2hlZHVsZXIgYXQgYW4gb3B0aW9uYWxseSBnaXZlbiB0aW1lLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtUaW1lRW5naW5lfSBlbmdpbmUgLSBFbmdpbmUgdG8gYWRkIHRvIHRoZSBzY2hlZHVsZXJcclxuICAgKiBAcGFyYW0ge051bWJlcn0gW3RpbWU9dGhpcy5jdXJyZW50VGltZV0gLSBTY2hlZHVsZSB0aW1lXHJcbiAgICovXHJcbiAgYWRkKGVuZ2luZSwgdGltZSA9IHRoaXMuY3VycmVudFRpbWUpIHtcclxuICAgIGlmICghVGltZUVuZ2luZS5pbXBsZW1lbnRzU2NoZWR1bGVkKGVuZ2luZSkpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIm9iamVjdCBjYW5ub3QgYmUgYWRkZWQgdG8gc2NoZWR1bGVyXCIpO1xyXG5cclxuICAgIGlmIChlbmdpbmUubWFzdGVyKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvYmplY3QgaGFzIGFscmVhZHkgYmVlbiBhZGRlZCB0byBhIG1hc3RlclwiKTtcclxuXHJcbiAgICAvLyBzZXQgbWFzdGVyIGFuZCBhZGQgdG8gYXJyYXlcclxuICAgIGVuZ2luZS5tYXN0ZXIgPSB0aGlzO1xyXG4gICAgdGhpcy5fX2VuZ2luZXMuYWRkKGVuZ2luZSk7XHJcblxyXG4gICAgLy8gc2NoZWR1bGUgZW5naW5lXHJcbiAgICB0aGlzLl9fc2NoZWR1bGVFbmdpbmUoZW5naW5lLCB0aW1lKTtcclxuICAgIHRoaXMuX19yZXNldFRpY2soKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSBhIFRpbWVFbmdpbmUgZnJvbSB0aGUgc2NoZWR1bGVyIHRoYXQgaGFzIGJlZW4gYWRkZWQgdG8gdGhlXHJcbiAgICogc2NoZWR1bGVyIHVzaW5nIHRoZSBhZGQgbWV0aG9kLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtUaW1lRW5naW5lfSBlbmdpbmUgLSBFbmdpbmUgdG8gcmVtb3ZlIGZyb20gdGhlIHNjaGVkdWxlclxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBbdGltZT10aGlzLmN1cnJlbnRUaW1lXSAtIFNjaGVkdWxlIHRpbWVcclxuICAgKi9cclxuICByZW1vdmUoZW5naW5lKSB7XHJcbiAgICBpZiAoIWVuZ2luZS5tYXN0ZXIgfHwgZW5naW5lLm1hc3RlciAhPT0gdGhpcylcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZW5naW5lIGhhcyBub3QgYmVlbiBhZGRlZCB0byB0aGlzIHNjaGVkdWxlclwiKTtcclxuXHJcbiAgICAvLyByZXNldCBtYXN0ZXIgYW5kIHJlbW92ZSBmcm9tIGFycmF5XHJcbiAgICBlbmdpbmUubWFzdGVyID0gbnVsbDtcclxuICAgIHRoaXMuX19lbmdpbmVzLmRlbGV0ZShlbmdpbmUpO1xyXG5cclxuICAgIC8vIHVuc2NoZWR1bGUgZW5naW5lXHJcbiAgICB0aGlzLl9fdW5zY2hlZHVsZUVuZ2luZShlbmdpbmUpO1xyXG4gICAgdGhpcy5fX3Jlc2V0VGljaygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzY2hlZHVsZSBhIHNjaGVkdWxlZCB0aW1lIGVuZ2luZSBhdCBhIGdpdmVuIHRpbWUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1RpbWVFbmdpbmV9IGVuZ2luZSAtIEVuZ2luZSB0byByZXNjaGVkdWxlXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHRpbWUgLSBTY2hlZHVsZSB0aW1lXHJcbiAgICovXHJcbiAgcmVzZXRFbmdpbmVUaW1lKGVuZ2luZSwgdGltZSA9IHRoaXMuY3VycmVudFRpbWUpIHtcclxuICAgIHRoaXMuX19yZXNjaGVkdWxlRW5naW5lKGVuZ2luZSwgdGltZSk7XHJcbiAgICB0aGlzLl9fcmVzZXRUaWNrKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGVjayB3aGV0aGVyIGEgZ2l2ZW4gZW5naW5lIGlzIHNjaGVkdWxlZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VGltZUVuZ2luZX0gZW5naW5lIC0gRW5naW5lIHRvIGNoZWNrXHJcbiAgICovXHJcbiAgaGFzKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuX19lbmdpbmVzLmhhcyhlbmdpbmUpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIGFsbCBlbmdpbmVzIGZyb20gdGhlIHNjaGVkdWxlci5cclxuICAgKi9cclxuICBjbGVhcigpIHtcclxuICAgIGlmICh0aGlzLl9fdGltZW91dCkge1xyXG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fX3RpbWVvdXQpO1xyXG4gICAgICB0aGlzLl9fdGltZW91dCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fX3NjaGVkRW5naW5lcy5sZW5ndGggPSAwO1xyXG4gICAgdGhpcy5fX3NjaGVkVGltZXMubGVuZ3RoID0gMDtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFNpbXBsZVNjaGVkdWxlcjtcclxuIiwiaW1wb3J0IGRlZmF1bHRBdWRpb0NvbnRleHQgZnJvbSAnLi4vY29yZS9hdWRpby1jb250ZXh0JztcclxuaW1wb3J0IFByaW9yaXR5UXVldWUgZnJvbSAnLi4vY29yZS9wcmlvcml0eS1xdWV1ZSc7XHJcbmltcG9ydCBTY2hlZHVsaW5nUXVldWUgZnJvbSAnLi4vY29yZS9zY2hlZHVsaW5nLXF1ZXVlJztcclxuaW1wb3J0IFRpbWVFbmdpbmUgZnJvbSAnLi4vY29yZS90aW1lLWVuZ2luZSc7XHJcbmltcG9ydCB7IGdldFNjaGVkdWxlciB9IGZyb20gJy4vZmFjdG9yaWVzJztcclxuXHJcblxyXG5mdW5jdGlvbiBhZGREdXBsZXQoZmlyc3RBcnJheSwgc2Vjb25kQXJyYXksIGZpcnN0RWxlbWVudCwgc2Vjb25kRWxlbWVudCkge1xyXG4gIGZpcnN0QXJyYXkucHVzaChmaXJzdEVsZW1lbnQpO1xyXG4gIHNlY29uZEFycmF5LnB1c2goc2Vjb25kRWxlbWVudCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbW92ZUR1cGxldChmaXJzdEFycmF5LCBzZWNvbmRBcnJheSwgZmlyc3RFbGVtZW50KSB7XHJcbiAgY29uc3QgaW5kZXggPSBmaXJzdEFycmF5LmluZGV4T2YoZmlyc3RFbGVtZW50KTtcclxuXHJcbiAgaWYgKGluZGV4ID49IDApIHtcclxuICAgIGNvbnN0IHNlY29uZEVsZW1lbnQgPSBzZWNvbmRBcnJheVtpbmRleF07XHJcblxyXG4gICAgZmlyc3RBcnJheS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgc2Vjb25kQXJyYXkuc3BsaWNlKGluZGV4LCAxKTtcclxuXHJcbiAgICByZXR1cm4gc2Vjb25kRWxlbWVudDtcclxuICB9XHJcblxyXG4gIHJldHVybiBudWxsO1xyXG59XHJcblxyXG4vLyBUaGUgVHJhbnNwb3J0ZWQgY2FsbCBpcyB0aGUgYmFzZSBjbGFzcyBvZiB0aGUgYWRhcHRlcnMgYmV0d2VlblxyXG4vLyBkaWZmZXJlbnQgdHlwZXMgb2YgZW5naW5lcyAoaS5lLiB0cmFuc3BvcnRlZCwgc2NoZWR1bGVkLCBwbGF5LWNvbnRyb2xsZWQpXHJcbi8vIFRoZSBhZGFwdGVycyBhcmUgYXQgdGhlIHNhbWUgdGltZSBtYXN0ZXJzIGZvciB0aGUgZW5naW5lcyBhZGRlZCB0byB0aGUgdHJhbnNwb3J0XHJcbi8vIGFuZCB0cmFuc3BvcnRlZCBUaW1lRW5naW5lcyBpbnNlcnRlZCBpbnRvIHRoZSB0cmFuc3BvcnQncyBwb3NpdGlvbi1iYXNlZCBwcml0b3JpdHkgcXVldWUuXHJcbmNsYXNzIFRyYW5zcG9ydGVkIGV4dGVuZHMgVGltZUVuZ2luZSB7XHJcbiAgY29uc3RydWN0b3IodHJhbnNwb3J0LCBlbmdpbmUsIHN0YXJ0LCBkdXJhdGlvbiwgb2Zmc2V0LCBzdHJldGNoID0gMSkge1xyXG4gICAgc3VwZXIoKTtcclxuICAgIHRoaXMubWFzdGVyID0gdHJhbnNwb3J0O1xyXG5cclxuICAgIHRoaXMuX19lbmdpbmUgPSBlbmdpbmU7XHJcbiAgICBlbmdpbmUubWFzdGVyID0gdGhpcztcclxuXHJcbiAgICB0aGlzLl9fc3RhcnRQb3NpdGlvbiA9IHN0YXJ0O1xyXG4gICAgdGhpcy5fX2VuZFBvc2l0aW9uID0gIWlzRmluaXRlKGR1cmF0aW9uKSA/IEluZmluaXR5IDogc3RhcnQgKyBkdXJhdGlvbjtcclxuICAgIHRoaXMuX19vZmZzZXRQb3NpdGlvbiA9IHN0YXJ0ICsgb2Zmc2V0O1xyXG4gICAgdGhpcy5fX3N0cmV0Y2hQb3NpdGlvbiA9IHN0cmV0Y2g7XHJcbiAgICB0aGlzLl9faXNSdW5uaW5nID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBzZXRCb3VuZGFyaWVzKHN0YXJ0LCBkdXJhdGlvbiwgb2Zmc2V0ID0gMCwgc3RyZXRjaCA9IDEpIHtcclxuICAgIHRoaXMuX19zdGFydFBvc2l0aW9uID0gc3RhcnQ7XHJcbiAgICB0aGlzLl9fZW5kUG9zaXRpb24gPSBzdGFydCArIGR1cmF0aW9uO1xyXG4gICAgdGhpcy5fX29mZnNldFBvc2l0aW9uID0gc3RhcnQgKyBvZmZzZXQ7XHJcbiAgICB0aGlzLl9fc3RyZXRjaFBvc2l0aW9uID0gc3RyZXRjaDtcclxuICAgIHRoaXMucmVzZXRQb3NpdGlvbigpO1xyXG4gIH1cclxuXHJcbiAgc3RhcnQodGltZSwgcG9zaXRpb24sIHNwZWVkKSB7fVxyXG4gIHN0b3AodGltZSwgcG9zaXRpb24pIHt9XHJcblxyXG4gIGdldCBjdXJyZW50VGltZSgpIHtcclxuICAgIHJldHVybiB0aGlzLm1hc3Rlci5jdXJyZW50VGltZTtcclxuICB9XHJcblxyXG4gIGdldCBjdXJyZW50UG9zaXRpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5tYXN0ZXIuY3VycmVudFBvc2l0aW9uIC0gdGhpcy5fX29mZnNldFBvc2l0aW9uO1xyXG4gIH1cclxuXHJcbiAgcmVzZXRQb3NpdGlvbihwb3NpdGlvbikge1xyXG4gICAgaWYgKHBvc2l0aW9uICE9PSB1bmRlZmluZWQpXHJcbiAgICAgIHBvc2l0aW9uICs9IHRoaXMuX19vZmZzZXRQb3NpdGlvbjtcclxuXHJcbiAgICB0aGlzLm1hc3Rlci5yZXNldEVuZ2luZVBvc2l0aW9uKHRoaXMsIHBvc2l0aW9uKTtcclxuICB9XHJcblxyXG4gIHN5bmNQb3NpdGlvbih0aW1lLCBwb3NpdGlvbiwgc3BlZWQpIHtcclxuICAgIGlmIChzcGVlZCA+IDApIHtcclxuICAgICAgaWYgKHBvc2l0aW9uIDwgdGhpcy5fX3N0YXJ0UG9zaXRpb24pIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX19pc1J1bm5pbmcpXHJcbiAgICAgICAgICB0aGlzLnN0b3AodGltZSwgcG9zaXRpb24gLSB0aGlzLl9fb2Zmc2V0UG9zaXRpb24pO1xyXG5cclxuICAgICAgICB0aGlzLl9faXNSdW5uaW5nID0gZmFsc2U7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX19zdGFydFBvc2l0aW9uO1xyXG4gICAgICB9IGVsc2UgaWYgKHBvc2l0aW9uIDwgdGhpcy5fX2VuZFBvc2l0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5zdGFydCh0aW1lLCBwb3NpdGlvbiAtIHRoaXMuX19vZmZzZXRQb3NpdGlvbiwgc3BlZWQpO1xyXG5cclxuICAgICAgICB0aGlzLl9faXNSdW5uaW5nID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gdGhpcy5fX2VuZFBvc2l0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAocG9zaXRpb24gPiB0aGlzLl9fZW5kUG9zaXRpb24pIHtcclxuICAgICAgICBpZiAodGhpcy5fX2lzUnVubmluZykgLy8gaWYgZW5naW5lIGlzIHJ1bm5pbmdcclxuICAgICAgICAgIHRoaXMuc3RvcCh0aW1lLCBwb3NpdGlvbiAtIHRoaXMuX19vZmZzZXRQb3NpdGlvbik7XHJcblxyXG4gICAgICAgIHRoaXMuX19pc1J1bm5pbmcgPSBmYWxzZTtcclxuICAgICAgICByZXR1cm4gdGhpcy5fX2VuZFBvc2l0aW9uO1xyXG4gICAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID4gdGhpcy5fX3N0YXJ0UG9zaXRpb24pIHtcclxuICAgICAgICB0aGlzLnN0YXJ0KHRpbWUsIHBvc2l0aW9uIC0gdGhpcy5fX29mZnNldFBvc2l0aW9uLCBzcGVlZCk7XHJcblxyXG4gICAgICAgIHRoaXMuX19pc1J1bm5pbmcgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9fc3RhcnRQb3NpdGlvbjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLl9faXNSdW5uaW5nKSAvLyBpZiBlbmdpbmUgaXMgcnVubmluZ1xyXG4gICAgICB0aGlzLnN0b3AodGltZSwgcG9zaXRpb24pO1xyXG5cclxuICAgIHRoaXMuX19pc1J1bm5pbmcgPSBmYWxzZTtcclxuICAgIHJldHVybiBJbmZpbml0eSAqIHNwZWVkO1xyXG4gIH1cclxuXHJcbiAgYWR2YW5jZVBvc2l0aW9uKHRpbWUsIHBvc2l0aW9uLCBzcGVlZCkge1xyXG4gICAgaWYgKCF0aGlzLl9faXNSdW5uaW5nKSB7XHJcbiAgICAgIHRoaXMuc3RhcnQodGltZSwgcG9zaXRpb24gLSB0aGlzLl9fb2Zmc2V0UG9zaXRpb24sIHNwZWVkKTtcclxuICAgICAgdGhpcy5fX2lzUnVubmluZyA9IHRydWU7XHJcblxyXG4gICAgICBpZiAoc3BlZWQgPiAwKVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9fZW5kUG9zaXRpb247XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5fX3N0YXJ0UG9zaXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc3RvcCBlbmdpbmVcclxuICAgIHRoaXMuc3RvcCh0aW1lLCBwb3NpdGlvbiAtIHRoaXMuX19vZmZzZXRQb3NpdGlvbik7XHJcblxyXG4gICAgdGhpcy5fX2lzUnVubmluZyA9IGZhbHNlO1xyXG4gICAgcmV0dXJuIEluZmluaXR5ICogc3BlZWQ7XHJcbiAgfVxyXG5cclxuICBzeW5jU3BlZWQodGltZSwgcG9zaXRpb24sIHNwZWVkKSB7XHJcbiAgICBpZiAoc3BlZWQgPT09IDApIC8vIHN0b3BcclxuICAgICAgdGhpcy5zdG9wKHRpbWUsIHBvc2l0aW9uIC0gdGhpcy5fX29mZnNldFBvc2l0aW9uKTtcclxuICB9XHJcblxyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLm1hc3RlciA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5fX2VuZ2luZS5tYXN0ZXIgPSBudWxsO1xyXG4gICAgdGhpcy5fX2VuZ2luZSA9IG51bGw7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBUcmFuc3BvcnRlZFRyYW5zcG9ydGVkXHJcbi8vIGhhcyB0byBzd2l0Y2ggb24gYW5kIG9mZiB0aGUgc2NoZWR1bGVkIGVuZ2luZXMgd2hlbiB0aGUgdHJhbnNwb3J0IGhpdHMgdGhlIGVuZ2luZSdzIHN0YXJ0IGFuZCBlbmQgcG9zaXRpb25cclxuY2xhc3MgVHJhbnNwb3J0ZWRUcmFuc3BvcnRlZCBleHRlbmRzIFRyYW5zcG9ydGVkIHtcclxuICBjb25zdHJ1Y3Rvcih0cmFuc3BvcnQsIGVuZ2luZSwgc3RhcnRQb3NpdGlvbiwgZW5kUG9zaXRpb24sIG9mZnNldFBvc2l0aW9uKSB7XHJcbiAgICBzdXBlcih0cmFuc3BvcnQsIGVuZ2luZSwgc3RhcnRQb3NpdGlvbiwgZW5kUG9zaXRpb24sIG9mZnNldFBvc2l0aW9uKTtcclxuICB9XHJcblxyXG4gIHN5bmNQb3NpdGlvbih0aW1lLCBwb3NpdGlvbiwgc3BlZWQpIHtcclxuICAgIGlmIChzcGVlZCA+IDAgJiYgcG9zaXRpb24gPCB0aGlzLl9fZW5kUG9zaXRpb24pXHJcbiAgICAgIHBvc2l0aW9uID0gTWF0aC5tYXgocG9zaXRpb24sIHRoaXMuX19zdGFydFBvc2l0aW9uKTtcclxuICAgIGVsc2UgaWYgKHNwZWVkIDwgMCAmJiBwb3NpdGlvbiA+PSB0aGlzLl9fc3RhcnRQb3NpdGlvbilcclxuICAgICAgcG9zaXRpb24gPSBNYXRoLm1pbihwb3NpdGlvbiwgdGhpcy5fX2VuZFBvc2l0aW9uKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5fX29mZnNldFBvc2l0aW9uICsgdGhpcy5fX2VuZ2luZS5zeW5jUG9zaXRpb24odGltZSwgcG9zaXRpb24gLSB0aGlzLl9fb2Zmc2V0UG9zaXRpb24sIHNwZWVkKTtcclxuICB9XHJcblxyXG4gIGFkdmFuY2VQb3NpdGlvbih0aW1lLCBwb3NpdGlvbiwgc3BlZWQpIHtcclxuICAgIHBvc2l0aW9uID0gdGhpcy5fX29mZnNldFBvc2l0aW9uICsgdGhpcy5fX2VuZ2luZS5hZHZhbmNlUG9zaXRpb24odGltZSwgcG9zaXRpb24gLSB0aGlzLl9fb2Zmc2V0UG9zaXRpb24sIHNwZWVkKTtcclxuXHJcbiAgICBpZiAoc3BlZWQgPiAwICYmIHBvc2l0aW9uIDwgdGhpcy5fX2VuZFBvc2l0aW9uIHx8IHNwZWVkIDwgMCAmJiBwb3NpdGlvbiA+PSB0aGlzLl9fc3RhcnRQb3NpdGlvbilcclxuICAgICAgcmV0dXJuIHBvc2l0aW9uO1xyXG5cclxuICAgIHJldHVybiBJbmZpbml0eSAqIHNwZWVkO1xyXG4gIH1cclxuXHJcbiAgc3luY1NwZWVkKHRpbWUsIHBvc2l0aW9uLCBzcGVlZCkge1xyXG4gICAgaWYgKHRoaXMuX19lbmdpbmUuc3luY1NwZWVkKVxyXG4gICAgICB0aGlzLl9fZW5naW5lLnN5bmNTcGVlZCh0aW1lLCBwb3NpdGlvbiwgc3BlZWQpO1xyXG4gIH1cclxuXHJcbiAgcmVzZXRFbmdpbmVQb3NpdGlvbihlbmdpbmUsIHBvc2l0aW9uID0gdW5kZWZpbmVkKSB7XHJcbiAgICBpZiAocG9zaXRpb24gIT09IHVuZGVmaW5lZClcclxuICAgICAgcG9zaXRpb24gKz0gdGhpcy5fX29mZnNldFBvc2l0aW9uO1xyXG5cclxuICAgIHRoaXMucmVzZXRQb3NpdGlvbihwb3NpdGlvbik7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBUcmFuc3BvcnRlZFNwZWVkQ29udHJvbGxlZFxyXG4vLyBoYXMgdG8gc3RhcnQgYW5kIHN0b3AgdGhlIHNwZWVkLWNvbnRyb2xsZWQgZW5naW5lcyB3aGVuIHRoZSB0cmFuc3BvcnQgaGl0cyB0aGUgZW5naW5lJ3Mgc3RhcnQgYW5kIGVuZCBwb3NpdGlvblxyXG5jbGFzcyBUcmFuc3BvcnRlZFNwZWVkQ29udHJvbGxlZCBleHRlbmRzIFRyYW5zcG9ydGVkIHtcclxuICBjb25zdHJ1Y3Rvcih0cmFuc3BvcnQsIGVuZ2luZSwgc3RhcnRQb3NpdGlvbiwgZW5kUG9zaXRpb24sIG9mZnNldFBvc2l0aW9uKSB7XHJcbiAgICBzdXBlcih0cmFuc3BvcnQsIGVuZ2luZSwgc3RhcnRQb3NpdGlvbiwgZW5kUG9zaXRpb24sIG9mZnNldFBvc2l0aW9uKTtcclxuICB9XHJcblxyXG4gIHN0YXJ0KHRpbWUsIHBvc2l0aW9uLCBzcGVlZCkge1xyXG4gICAgdGhpcy5fX2VuZ2luZS5zeW5jU3BlZWQodGltZSwgcG9zaXRpb24sIHNwZWVkLCB0cnVlKTtcclxuICB9XHJcblxyXG4gIHN0b3AodGltZSwgcG9zaXRpb24pIHtcclxuICAgIHRoaXMuX19lbmdpbmUuc3luY1NwZWVkKHRpbWUsIHBvc2l0aW9uLCAwKTtcclxuICB9XHJcblxyXG4gIHN5bmNTcGVlZCh0aW1lLCBwb3NpdGlvbiwgc3BlZWQpIHtcclxuICAgIGlmICh0aGlzLl9faXNSdW5uaW5nKVxyXG4gICAgICB0aGlzLl9fZW5naW5lLnN5bmNTcGVlZCh0aW1lLCBwb3NpdGlvbiwgc3BlZWQpO1xyXG4gIH1cclxuXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuX19lbmdpbmUuc3luY1NwZWVkKHRoaXMubWFzdGVyLmN1cnJlbnRUaW1lLCB0aGlzLm1hc3Rlci5jdXJyZW50UG9zaXRpb24gLSB0aGlzLl9fb2Zmc2V0UG9zaXRpb24sIDApO1xyXG4gICAgc3VwZXIuZGVzdHJveSgpO1xyXG4gIH1cclxufVxyXG5cclxuLy8gVHJhbnNwb3J0ZWRTY2hlZHVsZWRcclxuLy8gaGFzIHRvIHN3aXRjaCBvbiBhbmQgb2ZmIHRoZSBzY2hlZHVsZWQgZW5naW5lcyB3aGVuIHRoZSB0cmFuc3BvcnQgaGl0cyB0aGUgZW5naW5lJ3Mgc3RhcnQgYW5kIGVuZCBwb3NpdGlvblxyXG5jbGFzcyBUcmFuc3BvcnRlZFNjaGVkdWxlZCBleHRlbmRzIFRyYW5zcG9ydGVkIHtcclxuICBjb25zdHJ1Y3Rvcih0cmFuc3BvcnQsIGVuZ2luZSwgc3RhcnRQb3NpdGlvbiwgZW5kUG9zaXRpb24sIG9mZnNldFBvc2l0aW9uKSB7XHJcbiAgICBzdXBlcih0cmFuc3BvcnQsIGVuZ2luZSwgc3RhcnRQb3NpdGlvbiwgZW5kUG9zaXRpb24sIG9mZnNldFBvc2l0aW9uKTtcclxuXHJcbiAgICAvLyBzY2hlZHVsaW5nIHF1ZXVlIGJlY29tZXMgbWFzdGVyIG9mIGVuZ2luZVxyXG4gICAgZW5naW5lLm1hc3RlciA9IG51bGw7XHJcbiAgICB0cmFuc3BvcnQuX19zY2hlZHVsaW5nUXVldWUuYWRkKGVuZ2luZSwgSW5maW5pdHkpO1xyXG4gIH1cclxuXHJcbiAgc3RhcnQodGltZSwgcG9zaXRpb24sIHNwZWVkKSB7XHJcbiAgICB0aGlzLm1hc3Rlci5fX3NjaGVkdWxpbmdRdWV1ZS5yZXNldEVuZ2luZVRpbWUodGhpcy5fX2VuZ2luZSwgdGltZSk7XHJcbiAgfVxyXG5cclxuICBzdG9wKHRpbWUsIHBvc2l0aW9uKSB7XHJcbiAgICB0aGlzLm1hc3Rlci5fX3NjaGVkdWxpbmdRdWV1ZS5yZXNldEVuZ2luZVRpbWUodGhpcy5fX2VuZ2luZSwgSW5maW5pdHkpO1xyXG4gIH1cclxuXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMubWFzdGVyLl9fc2NoZWR1bGluZ1F1ZXVlLnJlbW92ZSh0aGlzLl9fZW5naW5lKTtcclxuICAgIHN1cGVyLmRlc3Ryb3koKTtcclxuICB9XHJcbn1cclxuXHJcbi8vIHRyYW5zbGF0ZXMgYWR2YW5jZVBvc2l0aW9uIG9mICp0cmFuc3BvcnRlZCogZW5naW5lcyBpbnRvIGdsb2JhbCBzY2hlZHVsZXIgdGltZXNcclxuY2xhc3MgVHJhbnNwb3J0U2NoZWR1bGVySG9vayBleHRlbmRzIFRpbWVFbmdpbmUge1xyXG4gIGNvbnN0cnVjdG9yKHRyYW5zcG9ydCkge1xyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICB0aGlzLl9fdHJhbnNwb3J0ID0gdHJhbnNwb3J0O1xyXG5cclxuICAgIHRoaXMuX19uZXh0UG9zaXRpb24gPSBJbmZpbml0eTtcclxuICAgIHRoaXMuX19uZXh0VGltZSA9IEluZmluaXR5O1xyXG4gICAgdHJhbnNwb3J0Ll9fc2NoZWR1bGVyLmFkZCh0aGlzLCBJbmZpbml0eSk7XHJcbiAgfVxyXG5cclxuICAvLyBUaW1lRW5naW5lIG1ldGhvZCAoc2NoZWR1bGVkIGludGVyZmFjZSlcclxuICBhZHZhbmNlVGltZSh0aW1lKSB7XHJcbiAgICBjb25zdCB0cmFuc3BvcnQgPSB0aGlzLl9fdHJhbnNwb3J0O1xyXG4gICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLl9fbmV4dFBvc2l0aW9uO1xyXG4gICAgY29uc3Qgc3BlZWQgPSB0cmFuc3BvcnQuX19zcGVlZDtcclxuICAgIGNvbnN0IG5leHRQb3NpdGlvbiA9IHRyYW5zcG9ydC5hZHZhbmNlUG9zaXRpb24odGltZSwgcG9zaXRpb24sIHNwZWVkKTtcclxuICAgIGNvbnN0IG5leHRUaW1lID0gdHJhbnNwb3J0Ll9fZ2V0VGltZUF0UG9zaXRpb24obmV4dFBvc2l0aW9uKTtcclxuXHJcbiAgICB0aGlzLl9fbmV4dFBvc2l0aW9uID0gbmV4dFBvc2l0aW9uO1xyXG4gICAgdGhpcy5fX25leHRUaW1lID0gbmV4dFRpbWU7XHJcblxyXG4gICAgcmV0dXJuIG5leHRUaW1lO1xyXG4gIH1cclxuXHJcbiAgcmVzZXRQb3NpdGlvbihwb3NpdGlvbiA9IHRoaXMuX19uZXh0UG9zaXRpb24pIHtcclxuICAgIGNvbnN0IHRyYW5zcG9ydCA9IHRoaXMuX190cmFuc3BvcnQ7XHJcbiAgICBjb25zdCB0aW1lID0gdHJhbnNwb3J0Ll9fZ2V0VGltZUF0UG9zaXRpb24ocG9zaXRpb24pO1xyXG5cclxuICAgIHRoaXMuX19uZXh0UG9zaXRpb24gPSBwb3NpdGlvbjtcclxuICAgIHRoaXMuX19uZXh0VGltZSA9IHRpbWU7XHJcblxyXG4gICAgdGhpcy5yZXNldFRpbWUodGltZSk7XHJcbiAgfVxyXG5cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy5fX3RyYW5zcG9ydC5fX3NjaGVkdWxlci5yZW1vdmUodGhpcyk7XHJcbiAgICB0aGlzLl9fdHJhbnNwb3J0ID0gbnVsbDtcclxuICB9XHJcbn1cclxuXHJcbi8vIGludGVybmFsIHNjaGVkdWxpbmcgcXVldWUgdGhhdCByZXR1cm5zIHRoZSBjdXJyZW50IHBvc2l0aW9uIChhbmQgdGltZSkgb2YgdGhlIHBsYXkgY29udHJvbFxyXG5jbGFzcyBUcmFuc3BvcnRTY2hlZHVsaW5nUXVldWUgZXh0ZW5kcyBTY2hlZHVsaW5nUXVldWUge1xyXG4gIGNvbnN0cnVjdG9yKHRyYW5zcG9ydCkge1xyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICB0aGlzLl9fdHJhbnNwb3J0ID0gdHJhbnNwb3J0O1xyXG4gICAgdHJhbnNwb3J0Ll9fc2NoZWR1bGVyLmFkZCh0aGlzLCBJbmZpbml0eSk7XHJcbiAgfVxyXG5cclxuICBnZXQgY3VycmVudFRpbWUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fX3RyYW5zcG9ydC5jdXJyZW50VGltZTtcclxuICB9XHJcblxyXG4gIGdldCBjdXJyZW50UG9zaXRpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fX3RyYW5zcG9ydC5jdXJyZW50UG9zaXRpb247XHJcbiAgfVxyXG5cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy5fX3RyYW5zcG9ydC5fX3NjaGVkdWxlci5yZW1vdmUodGhpcyk7XHJcbiAgICB0aGlzLl9fdHJhbnNwb3J0ID0gbnVsbDtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlcyBzeW5jaHJvbml6ZWQgc2NoZWR1bGluZyBvZiBUaW1lIEVuZ2luZSBpbnN0YW5jZXMuXHJcbiAqXHJcbiAqIFtleGFtcGxlXXtAbGluayBodHRwczovL3Jhd2dpdC5jb20vd2F2ZXNqcy93YXZlcy1hdWRpby9tYXN0ZXIvZXhhbXBsZXMvdHJhbnNwb3J0Lmh0bWx9XHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGltcG9ydCAqIGFzIGF1ZGlvIGZyb20gJ3dhdmVzLWF1ZGlvJztcclxuICogY29uc3QgdHJhbnNwb3J0ID0gYXVkaW8uVHJhbnNwb3J0KCk7XHJcbiAqIGNvbnN0IHBsYXlDb250cm9sID0gbmV3IGF1ZGlvLlBsYXlDb250cm9sKHRyYW5zcG9ydCk7XHJcbiAqIGNvbnN0IG15RW5naW5lID0gbmV3IE15RW5naW5lKCk7XHJcbiAqIGNvbnN0IHlvdXJFbmdpbmUgPSBuZXcgeW91ckVuZ2luZSgpO1xyXG4gKlxyXG4gKiB0cmFuc3BvcnQuYWRkKG15RW5naW5lKTtcclxuICogdHJhbnNwb3J0LmFkZCh5b3VyRW5naW5lKTtcclxuICpcclxuICogcGxheUNvbnRyb2wuc3RhcnQoKTtcclxuICovXHJcbmNsYXNzIFRyYW5zcG9ydCBleHRlbmRzIFRpbWVFbmdpbmUge1xyXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICB0aGlzLmF1ZGlvQ29udGV4dCA9IG9wdGlvbnMuYXVkaW9Db250ZXh0IHx8IGRlZmF1bHRBdWRpb0NvbnRleHQ7XHJcblxyXG4gICAgdGhpcy5fX2VuZ2luZXMgPSBbXTtcclxuICAgIHRoaXMuX190cmFuc3BvcnRlZCA9IFtdO1xyXG5cclxuICAgIHRoaXMuX19zY2hlZHVsZXIgPSBnZXRTY2hlZHVsZXIodGhpcy5hdWRpb0NvbnRleHQpO1xyXG4gICAgdGhpcy5fX3NjaGVkdWxlckhvb2sgPSBuZXcgVHJhbnNwb3J0U2NoZWR1bGVySG9vayh0aGlzKTtcclxuICAgIHRoaXMuX190cmFuc3BvcnRlZFF1ZXVlID0gbmV3IFByaW9yaXR5UXVldWUoKTtcclxuICAgIHRoaXMuX19zY2hlZHVsaW5nUXVldWUgPSBuZXcgVHJhbnNwb3J0U2NoZWR1bGluZ1F1ZXVlKHRoaXMpO1xyXG5cclxuICAgIC8vIHN5bmNyb25pemVkIHRpbWUsIHBvc2l0aW9uLCBhbmQgc3BlZWRcclxuICAgIHRoaXMuX190aW1lID0gMDtcclxuICAgIHRoaXMuX19wb3NpdGlvbiA9IDA7XHJcbiAgICB0aGlzLl9fc3BlZWQgPSAwO1xyXG4gIH1cclxuXHJcbiAgX19nZXRUaW1lQXRQb3NpdGlvbihwb3NpdGlvbikge1xyXG4gICAgcmV0dXJuIHRoaXMuX190aW1lICsgKHBvc2l0aW9uIC0gdGhpcy5fX3Bvc2l0aW9uKSAvIHRoaXMuX19zcGVlZDtcclxuICB9XHJcblxyXG4gIF9fZ2V0UG9zaXRpb25BdFRpbWUodGltZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuX19wb3NpdGlvbiArICh0aW1lIC0gdGhpcy5fX3RpbWUpICogdGhpcy5fX3NwZWVkO1xyXG4gIH1cclxuXHJcbiAgX19zeW5jVHJhbnNwb3J0ZWRQb3NpdGlvbih0aW1lLCBwb3NpdGlvbiwgc3BlZWQpIHtcclxuICAgIGNvbnN0IG51bVRyYW5zcG9ydGVkRW5naW5lcyA9IHRoaXMuX190cmFuc3BvcnRlZC5sZW5ndGg7XHJcbiAgICBsZXQgbmV4dFBvc2l0aW9uID0gSW5maW5pdHkgKiBzcGVlZDtcclxuXHJcbiAgICBpZiAobnVtVHJhbnNwb3J0ZWRFbmdpbmVzID4gMCkge1xyXG4gICAgICB0aGlzLl9fdHJhbnNwb3J0ZWRRdWV1ZS5jbGVhcigpO1xyXG4gICAgICB0aGlzLl9fdHJhbnNwb3J0ZWRRdWV1ZS5yZXZlcnNlID0gKHNwZWVkIDwgMCk7XHJcblxyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRyYW5zcG9ydGVkRW5naW5lczsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgZW5naW5lID0gdGhpcy5fX3RyYW5zcG9ydGVkW2ldO1xyXG4gICAgICAgIGNvbnN0IG5leHRFbmdpbmVQb3NpdGlvbiA9IGVuZ2luZS5zeW5jUG9zaXRpb24odGltZSwgcG9zaXRpb24sIHNwZWVkKTtcclxuICAgICAgICB0aGlzLl9fdHJhbnNwb3J0ZWRRdWV1ZS5pbnNlcnQoZW5naW5lLCBuZXh0RW5naW5lUG9zaXRpb24pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBuZXh0UG9zaXRpb24gPSB0aGlzLl9fdHJhbnNwb3J0ZWRRdWV1ZS50aW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXh0UG9zaXRpb247XHJcbiAgfVxyXG5cclxuICBfX3N5bmNUcmFuc3BvcnRlZFNwZWVkKHRpbWUsIHBvc2l0aW9uLCBzcGVlZCkge1xyXG4gICAgZm9yIChsZXQgdHJhbnNwb3J0ZWQgb2YgdGhpcy5fX3RyYW5zcG9ydGVkKVxyXG4gICAgICB0cmFuc3BvcnRlZC5zeW5jU3BlZWQodGltZSwgcG9zaXRpb24sIHNwZWVkKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBjdXJyZW50IG1hc3RlciB0aW1lLiBUaGlzIGdldHRlciB3aWxsIGJlIHJlcGxhY2VkIHdoZW4gdGhlIHRyYW5zcG9ydFxyXG4gICAqIGlzIGFkZGVkIHRvIGEgbWFzdGVyIChpLmUuIHRyYW5zcG9ydCBvciBwbGF5LWNvbnRyb2wpLlxyXG4gICAqXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKiBAbmFtZSBjdXJyZW50VGltZVxyXG4gICAqIEBtZW1iZXJvZiBUcmFuc3BvcnRcclxuICAgKiBAaW5zdGFuY2VcclxuICAgKiBAcmVhZG9ubHlcclxuICAgKi9cclxuICBnZXQgY3VycmVudFRpbWUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fX3NjaGVkdWxlci5jdXJyZW50VGltZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBjdXJyZW50IG1hc3RlciBwb3NpdGlvbi4gVGhpcyBnZXR0ZXIgd2lsbCBiZSByZXBsYWNlZCB3aGVuIHRoZSB0cmFuc3BvcnRcclxuICAgKiBpcyBhZGRlZCB0byBhIG1hc3RlciAoaS5lLiB0cmFuc3BvcnQgb3IgcGxheS1jb250cm9sKS5cclxuICAgKlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICogQG5hbWUgY3VycmVudFBvc2l0aW9uXHJcbiAgICogQG1lbWJlcm9mIFRyYW5zcG9ydFxyXG4gICAqIEBpbnN0YW5jZVxyXG4gICAqIEByZWFkb25seVxyXG4gICAqL1xyXG4gIGdldCBjdXJyZW50UG9zaXRpb24oKSB7XHJcbiAgICBjb25zdCBtYXN0ZXIgPSB0aGlzLm1hc3RlcjtcclxuXHJcbiAgICBpZiAobWFzdGVyICYmIG1hc3Rlci5jdXJyZW50UG9zaXRpb24gIT09IHVuZGVmaW5lZClcclxuICAgICAgcmV0dXJuIG1hc3Rlci5jdXJyZW50UG9zaXRpb247XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuX19wb3NpdGlvbiArICh0aGlzLl9fc2NoZWR1bGVyLmN1cnJlbnRUaW1lIC0gdGhpcy5fX3RpbWUpICogdGhpcy5fX3NwZWVkO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzZXQgbmV4dCB0cmFuc3BvcnQgcG9zaXRpb25cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBuZXh0IC0gdHJhbnNwb3J0IHBvc2l0aW9uXHJcbiAgICovXHJcbiAgcmVzZXRQb3NpdGlvbihwb3NpdGlvbikge1xyXG4gICAgY29uc3QgbWFzdGVyID0gdGhpcy5tYXN0ZXI7XHJcblxyXG4gICAgaWYgKG1hc3RlciAmJiBtYXN0ZXIucmVzZXRFbmdpbmVQb3NpdGlvbiAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICBtYXN0ZXIucmVzZXRFbmdpbmVQb3NpdGlvbih0aGlzLCBwb3NpdGlvbik7XHJcbiAgICBlbHNlXHJcbiAgICAgIHRoaXMuX19zY2hlZHVsZXJIb29rLnJlc2V0UG9zaXRpb24ocG9zaXRpb24pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW1wbGVtZW50YXRpb24gb2YgdGhlIHRyYW5zcG9ydGVkIHRpbWUgZW5naW5lIGludGVyZmFjZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHBvc2l0aW9uXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHNwZWVkXHJcbiAgICovXHJcbiAgc3luY1Bvc2l0aW9uKHRpbWUsIHBvc2l0aW9uLCBzcGVlZCkge1xyXG4gICAgdGhpcy5fX3RpbWUgPSB0aW1lO1xyXG4gICAgdGhpcy5fX3Bvc2l0aW9uID0gcG9zaXRpb247XHJcbiAgICB0aGlzLl9fc3BlZWQgPSBzcGVlZDtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5fX3N5bmNUcmFuc3BvcnRlZFBvc2l0aW9uKHRpbWUsIHBvc2l0aW9uLCBzcGVlZCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbXBsZW1lbnRhdGlvbiBvZiB0aGUgdHJhbnNwb3J0ZWQgdGltZSBlbmdpbmUgaW50ZXJmYWNlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHRpbWVcclxuICAgKiBAcGFyYW0ge051bWJlcn0gcG9zaXRpb25cclxuICAgKiBAcGFyYW0ge051bWJlcn0gc3BlZWRcclxuICAgKi9cclxuICBhZHZhbmNlUG9zaXRpb24odGltZSwgcG9zaXRpb24sIHNwZWVkKSB7XHJcbiAgICBjb25zdCBlbmdpbmUgPSB0aGlzLl9fdHJhbnNwb3J0ZWRRdWV1ZS5oZWFkO1xyXG4gICAgY29uc3QgbmV4dEVuZ2luZVBvc2l0aW9uID0gZW5naW5lLmFkdmFuY2VQb3NpdGlvbih0aW1lLCBwb3NpdGlvbiwgc3BlZWQpO1xyXG4gICAgcmV0dXJuIHRoaXMuX190cmFuc3BvcnRlZFF1ZXVlLm1vdmUoZW5naW5lLCBuZXh0RW5naW5lUG9zaXRpb24pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW1wbGVtZW50YXRpb24gb2YgdGhlIHRyYW5zcG9ydGVkIHRpbWUgZW5naW5lIGludGVyZmFjZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHBvc2l0aW9uXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHNwZWVkXHJcbiAgICogQHBhcmFtIHtCb29sZWFufSBbc2Vlaz1mYWxzZV1cclxuICAgKi9cclxuICBzeW5jU3BlZWQodGltZSwgcG9zaXRpb24sIHNwZWVkLCBzZWVrID0gZmFsc2UpIHtcclxuICAgIGNvbnN0IGxhc3RTcGVlZCA9IHRoaXMuX19zcGVlZDtcclxuXHJcbiAgICB0aGlzLl9fdGltZSA9IHRpbWU7XHJcbiAgICB0aGlzLl9fcG9zaXRpb24gPSBwb3NpdGlvbjtcclxuICAgIHRoaXMuX19zcGVlZCA9IHNwZWVkO1xyXG5cclxuICAgIGlmIChzcGVlZCAhPT0gbGFzdFNwZWVkIHx8IChzZWVrICYmIHNwZWVkICE9PSAwKSkge1xyXG4gICAgICBsZXQgbmV4dFBvc2l0aW9uO1xyXG5cclxuICAgICAgLy8gcmVzeW5jIHRyYW5zcG9ydGVkIGVuZ2luZXNcclxuICAgICAgaWYgKHNlZWsgfHwgc3BlZWQgKiBsYXN0U3BlZWQgPCAwKSB7XHJcbiAgICAgICAgLy8gc2VlayBvciByZXZlcnNlIGRpcmVjdGlvblxyXG4gICAgICAgIG5leHRQb3NpdGlvbiA9IHRoaXMuX19zeW5jVHJhbnNwb3J0ZWRQb3NpdGlvbih0aW1lLCBwb3NpdGlvbiwgc3BlZWQpO1xyXG4gICAgICB9IGVsc2UgaWYgKGxhc3RTcGVlZCA9PT0gMCkge1xyXG4gICAgICAgIC8vIHN0YXJ0XHJcbiAgICAgICAgbmV4dFBvc2l0aW9uID0gdGhpcy5fX3N5bmNUcmFuc3BvcnRlZFBvc2l0aW9uKHRpbWUsIHBvc2l0aW9uLCBzcGVlZCk7XHJcbiAgICAgIH0gZWxzZSBpZiAoc3BlZWQgPT09IDApIHtcclxuICAgICAgICAvLyBzdG9wXHJcbiAgICAgICAgbmV4dFBvc2l0aW9uID0gSW5maW5pdHk7XHJcbiAgICAgICAgdGhpcy5fX3N5bmNUcmFuc3BvcnRlZFNwZWVkKHRpbWUsIHBvc2l0aW9uLCAwKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBjaGFuZ2Ugc3BlZWQgd2l0aG91dCByZXZlcnNpbmcgZGlyZWN0aW9uXHJcbiAgICAgICAgdGhpcy5fX3N5bmNUcmFuc3BvcnRlZFNwZWVkKHRpbWUsIHBvc2l0aW9uLCBzcGVlZCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMucmVzZXRQb3NpdGlvbihuZXh0UG9zaXRpb24pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkIGEgdGltZSBlbmdpbmUgdG8gdGhlIHRyYW5zcG9ydC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbmdpbmUgLSBlbmdpbmUgdG8gYmUgYWRkZWQgdG8gdGhlIHRyYW5zcG9ydFxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBwb3NpdGlvbiAtIHN0YXJ0IHBvc2l0aW9uXHJcbiAgICovXHJcbiAgYWRkKGVuZ2luZSwgc3RhcnRQb3NpdGlvbiA9IDAsIGVuZFBvc2l0aW9uID0gSW5maW5pdHksIG9mZnNldFBvc2l0aW9uID0gMCkge1xyXG4gICAgbGV0IHRyYW5zcG9ydGVkID0gbnVsbDtcclxuXHJcbiAgICBpZiAob2Zmc2V0UG9zaXRpb24gPT09IC1JbmZpbml0eSlcclxuICAgICAgb2Zmc2V0UG9zaXRpb24gPSAwO1xyXG5cclxuICAgIGlmIChlbmdpbmUubWFzdGVyKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvYmplY3QgaGFzIGFscmVhZHkgYmVlbiBhZGRlZCB0byBhIG1hc3RlclwiKTtcclxuXHJcbiAgICBpZiAoVGltZUVuZ2luZS5pbXBsZW1lbnRzVHJhbnNwb3J0ZWQoZW5naW5lKSlcclxuICAgICAgdHJhbnNwb3J0ZWQgPSBuZXcgVHJhbnNwb3J0ZWRUcmFuc3BvcnRlZCh0aGlzLCBlbmdpbmUsIHN0YXJ0UG9zaXRpb24sIGVuZFBvc2l0aW9uLCBvZmZzZXRQb3NpdGlvbik7XHJcbiAgICBlbHNlIGlmIChUaW1lRW5naW5lLmltcGxlbWVudHNTcGVlZENvbnRyb2xsZWQoZW5naW5lKSlcclxuICAgICAgdHJhbnNwb3J0ZWQgPSBuZXcgVHJhbnNwb3J0ZWRTcGVlZENvbnRyb2xsZWQodGhpcywgZW5naW5lLCBzdGFydFBvc2l0aW9uLCBlbmRQb3NpdGlvbiwgb2Zmc2V0UG9zaXRpb24pO1xyXG4gICAgZWxzZSBpZiAoVGltZUVuZ2luZS5pbXBsZW1lbnRzU2NoZWR1bGVkKGVuZ2luZSkpXHJcbiAgICAgIHRyYW5zcG9ydGVkID0gbmV3IFRyYW5zcG9ydGVkU2NoZWR1bGVkKHRoaXMsIGVuZ2luZSwgc3RhcnRQb3NpdGlvbiwgZW5kUG9zaXRpb24sIG9mZnNldFBvc2l0aW9uKTtcclxuICAgIGVsc2VcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwib2JqZWN0IGNhbm5vdCBiZSBhZGRlZCB0byBhIHRyYW5zcG9ydFwiKTtcclxuXHJcbiAgICBpZiAodHJhbnNwb3J0ZWQpIHtcclxuICAgICAgY29uc3Qgc3BlZWQgPSB0aGlzLl9fc3BlZWQ7XHJcblxyXG4gICAgICBhZGREdXBsZXQodGhpcy5fX2VuZ2luZXMsIHRoaXMuX190cmFuc3BvcnRlZCwgZW5naW5lLCB0cmFuc3BvcnRlZCk7XHJcblxyXG4gICAgICBpZiAoc3BlZWQgIT09IDApIHtcclxuICAgICAgICAvLyBzeW5jIGFuZCBzdGFydFxyXG4gICAgICAgIGNvbnN0IG5leHRFbmdpbmVQb3NpdGlvbiA9IHRyYW5zcG9ydGVkLnN5bmNQb3NpdGlvbih0aGlzLmN1cnJlbnRUaW1lLCB0aGlzLmN1cnJlbnRQb3NpdGlvbiwgc3BlZWQpO1xyXG4gICAgICAgIGNvbnN0IG5leHRQb3NpdGlvbiA9IHRoaXMuX190cmFuc3BvcnRlZFF1ZXVlLmluc2VydCh0cmFuc3BvcnRlZCwgbmV4dEVuZ2luZVBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgdGhpcy5yZXNldFBvc2l0aW9uKG5leHRQb3NpdGlvbik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHJhbnNwb3J0ZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmUgYSB0aW1lIGVuZ2luZSBmcm9tIHRoZSB0cmFuc3BvcnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gZW5naW5lT3JUcmFuc3BvcnRlZCAtIGVuZ2luZSBvciB0cmFuc3BvcnRlZCB0byBiZSByZW1vdmVkIGZyb20gdGhlIHRyYW5zcG9ydFxyXG4gICAqL1xyXG4gIHJlbW92ZShlbmdpbmVPclRyYW5zcG9ydGVkKSB7XHJcbiAgICBsZXQgZW5naW5lID0gZW5naW5lT3JUcmFuc3BvcnRlZDtcclxuICAgIGxldCB0cmFuc3BvcnRlZCA9IHJlbW92ZUR1cGxldCh0aGlzLl9fZW5naW5lcywgdGhpcy5fX3RyYW5zcG9ydGVkLCBlbmdpbmVPclRyYW5zcG9ydGVkKTtcclxuXHJcbiAgICBpZiAoIXRyYW5zcG9ydGVkKSB7XHJcbiAgICAgIGVuZ2luZSA9IHJlbW92ZUR1cGxldCh0aGlzLl9fdHJhbnNwb3J0ZWQsIHRoaXMuX19lbmdpbmVzLCBlbmdpbmVPclRyYW5zcG9ydGVkKTtcclxuICAgICAgdHJhbnNwb3J0ZWQgPSBlbmdpbmVPclRyYW5zcG9ydGVkO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChlbmdpbmUgJiYgdHJhbnNwb3J0ZWQpIHtcclxuICAgICAgY29uc3QgbmV4dFBvc2l0aW9uID0gdGhpcy5fX3RyYW5zcG9ydGVkUXVldWUucmVtb3ZlKHRyYW5zcG9ydGVkKTtcclxuXHJcbiAgICAgIHRyYW5zcG9ydGVkLmRlc3Ryb3koKTtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9fc3BlZWQgIT09IDApXHJcbiAgICAgICAgdGhpcy5yZXNldFBvc2l0aW9uKG5leHRQb3NpdGlvbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvYmplY3QgaGFzIG5vdCBiZWVuIGFkZGVkIHRvIHRoaXMgdHJhbnNwb3J0XCIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzZXQgcG9zaXRpb24gb2YgdGhlIGdpdmVuIGVuZ2luZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VGltZUVuZ2luZX0gdHJhbnNwb3J0ZWQgLSBFbmdpbmUgdG8gcmVzZXRcclxuICAgKiBAcGFyYW0ge051bWJlcn0gcG9zaXRpb24gLSBOZXcgcG9zaXRpb25cclxuICAgKi9cclxuICByZXNldEVuZ2luZVBvc2l0aW9uKHRyYW5zcG9ydGVkLCBwb3NpdGlvbiA9IHVuZGVmaW5lZCkge1xyXG4gICAgY29uc3Qgc3BlZWQgPSB0aGlzLl9fc3BlZWQ7XHJcblxyXG4gICAgaWYgKHNwZWVkICE9PSAwKSB7XHJcbiAgICAgIGlmIChwb3NpdGlvbiA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHBvc2l0aW9uID0gdHJhbnNwb3J0ZWQuc3luY1Bvc2l0aW9uKHRoaXMuY3VycmVudFRpbWUsIHRoaXMuY3VycmVudFBvc2l0aW9uLCBzcGVlZCk7XHJcblxyXG4gICAgICBjb25zdCBuZXh0UG9zaXRpb24gPSB0aGlzLl9fdHJhbnNwb3J0ZWRRdWV1ZS5tb3ZlKHRyYW5zcG9ydGVkLCBwb3NpdGlvbik7XHJcbiAgICAgIHRoaXMucmVzZXRQb3NpdGlvbihuZXh0UG9zaXRpb24pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIGFsbCB0aW1lIGVuZ2luZXMgZnJvbSB0aGUgdHJhbnNwb3J0LlxyXG4gICAqL1xyXG4gIGNsZWFyKCkge1xyXG4gICAgdGhpcy5zeW5jU3BlZWQodGhpcy5jdXJyZW50VGltZSwgdGhpcy5jdXJyZW50UG9zaXRpb24sIDApO1xyXG5cclxuICAgIGZvciAobGV0IHRyYW5zcG9ydGVkIG9mIHRoaXMuX190cmFuc3BvcnRlZClcclxuICAgICAgdHJhbnNwb3J0ZWQuZGVzdHJveSgpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgVHJhbnNwb3J0O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vZ2V0LWl0ZXJhdG9yXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9jcmVhdGVcIiksIF9fZXNNb2R1bGU6IHRydWUgfTsiLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2RlZmluZS1wcm9wZXJ0eVwiKSwgX19lc01vZHVsZTogdHJ1ZSB9OyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9vYmplY3QvZ2V0LW93bi1wcm9wZXJ0eS1kZXNjcmlwdG9yXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9nZXQtcHJvdG90eXBlLW9mXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9zZXQtcHJvdG90eXBlLW9mXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL3NldFwiKSwgX19lc01vZHVsZTogdHJ1ZSB9OyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9zeW1ib2xcIiksIF9fZXNNb2R1bGU6IHRydWUgfTsiLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vc3ltYm9sL2l0ZXJhdG9yXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL3dlYWstbWFwXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmV4cG9ydHMuZGVmYXVsdCA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHtcbiAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpO1xuICB9XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2RlZmluZVByb3BlcnR5ID0gcmVxdWlyZShcIi4uL2NvcmUtanMvb2JqZWN0L2RlZmluZS1wcm9wZXJ0eVwiKTtcblxudmFyIF9kZWZpbmVQcm9wZXJ0eTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9kZWZpbmVQcm9wZXJ0eSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmV4cG9ydHMuZGVmYXVsdCA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTtcbiAgICAgIGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTtcbiAgICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICAgIGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7XG4gICAgICAoMCwgX2RlZmluZVByb3BlcnR5Mi5kZWZhdWx0KSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykge1xuICAgIGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7XG4gICAgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7XG4gICAgcmV0dXJuIENvbnN0cnVjdG9yO1xuICB9O1xufSgpOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2dldFByb3RvdHlwZU9mID0gcmVxdWlyZShcIi4uL2NvcmUtanMvb2JqZWN0L2dldC1wcm90b3R5cGUtb2ZcIik7XG5cbnZhciBfZ2V0UHJvdG90eXBlT2YyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZ2V0UHJvdG90eXBlT2YpO1xuXG52YXIgX2dldE93blByb3BlcnR5RGVzY3JpcHRvciA9IHJlcXVpcmUoXCIuLi9jb3JlLWpzL29iamVjdC9nZXQtb3duLXByb3BlcnR5LWRlc2NyaXB0b3JcIik7XG5cbnZhciBfZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2dldE93blByb3BlcnR5RGVzY3JpcHRvcik7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmV4cG9ydHMuZGVmYXVsdCA9IGZ1bmN0aW9uIGdldChvYmplY3QsIHByb3BlcnR5LCByZWNlaXZlcikge1xuICBpZiAob2JqZWN0ID09PSBudWxsKSBvYmplY3QgPSBGdW5jdGlvbi5wcm90b3R5cGU7XG4gIHZhciBkZXNjID0gKDAsIF9nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IyLmRlZmF1bHQpKG9iamVjdCwgcHJvcGVydHkpO1xuXG4gIGlmIChkZXNjID09PSB1bmRlZmluZWQpIHtcbiAgICB2YXIgcGFyZW50ID0gKDAsIF9nZXRQcm90b3R5cGVPZjIuZGVmYXVsdCkob2JqZWN0KTtcblxuICAgIGlmIChwYXJlbnQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBnZXQocGFyZW50LCBwcm9wZXJ0eSwgcmVjZWl2ZXIpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChcInZhbHVlXCIgaW4gZGVzYykge1xuICAgIHJldHVybiBkZXNjLnZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHZhciBnZXR0ZXIgPSBkZXNjLmdldDtcblxuICAgIGlmIChnZXR0ZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0dGVyLmNhbGwocmVjZWl2ZXIpO1xuICB9XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3NldFByb3RvdHlwZU9mID0gcmVxdWlyZShcIi4uL2NvcmUtanMvb2JqZWN0L3NldC1wcm90b3R5cGUtb2ZcIik7XG5cbnZhciBfc2V0UHJvdG90eXBlT2YyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfc2V0UHJvdG90eXBlT2YpO1xuXG52YXIgX2NyZWF0ZSA9IHJlcXVpcmUoXCIuLi9jb3JlLWpzL29iamVjdC9jcmVhdGVcIik7XG5cbnZhciBfY3JlYXRlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NyZWF0ZSk7XG5cbnZhciBfdHlwZW9mMiA9IHJlcXVpcmUoXCIuLi9oZWxwZXJzL3R5cGVvZlwiKTtcblxudmFyIF90eXBlb2YzID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdHlwZW9mMik7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmV4cG9ydHMuZGVmYXVsdCA9IGZ1bmN0aW9uIChzdWJDbGFzcywgc3VwZXJDbGFzcykge1xuICBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgXCIgKyAodHlwZW9mIHN1cGVyQ2xhc3MgPT09IFwidW5kZWZpbmVkXCIgPyBcInVuZGVmaW5lZFwiIDogKDAsIF90eXBlb2YzLmRlZmF1bHQpKHN1cGVyQ2xhc3MpKSk7XG4gIH1cblxuICBzdWJDbGFzcy5wcm90b3R5cGUgPSAoMCwgX2NyZWF0ZTIuZGVmYXVsdCkoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwge1xuICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICB2YWx1ZTogc3ViQ2xhc3MsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfVxuICB9KTtcbiAgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZjIuZGVmYXVsdCA/ICgwLCBfc2V0UHJvdG90eXBlT2YyLmRlZmF1bHQpKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3R5cGVvZjIgPSByZXF1aXJlKFwiLi4vaGVscGVycy90eXBlb2ZcIik7XG5cbnZhciBfdHlwZW9mMyA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3R5cGVvZjIpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5leHBvcnRzLmRlZmF1bHQgPSBmdW5jdGlvbiAoc2VsZiwgY2FsbCkge1xuICBpZiAoIXNlbGYpIHtcbiAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7XG4gIH1cblxuICByZXR1cm4gY2FsbCAmJiAoKHR5cGVvZiBjYWxsID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6ICgwLCBfdHlwZW9mMy5kZWZhdWx0KShjYWxsKSkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikgPyBjYWxsIDogc2VsZjtcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfaXRlcmF0b3IgPSByZXF1aXJlKFwiLi4vY29yZS1qcy9zeW1ib2wvaXRlcmF0b3JcIik7XG5cbnZhciBfaXRlcmF0b3IyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaXRlcmF0b3IpO1xuXG52YXIgX3N5bWJvbCA9IHJlcXVpcmUoXCIuLi9jb3JlLWpzL3N5bWJvbFwiKTtcblxudmFyIF9zeW1ib2wyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfc3ltYm9sKTtcblxudmFyIF90eXBlb2YgPSB0eXBlb2YgX3N5bWJvbDIuZGVmYXVsdCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBfaXRlcmF0b3IyLmRlZmF1bHQgPT09IFwic3ltYm9sXCIgPyBmdW5jdGlvbiAob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9IDogZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBfc3ltYm9sMi5kZWZhdWx0ID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBfc3ltYm9sMi5kZWZhdWx0ICYmIG9iaiAhPT0gX3N5bWJvbDIuZGVmYXVsdC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZXhwb3J0cy5kZWZhdWx0ID0gdHlwZW9mIF9zeW1ib2wyLmRlZmF1bHQgPT09IFwiZnVuY3Rpb25cIiAmJiBfdHlwZW9mKF9pdGVyYXRvcjIuZGVmYXVsdCkgPT09IFwic3ltYm9sXCIgPyBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiB0eXBlb2Ygb2JqID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2Yob2JqKTtcbn0gOiBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBvYmogJiYgdHlwZW9mIF9zeW1ib2wyLmRlZmF1bHQgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IF9zeW1ib2wyLmRlZmF1bHQgJiYgb2JqICE9PSBfc3ltYm9sMi5kZWZhdWx0LnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2Yob2JqKTtcbn07IiwicmVxdWlyZSgnLi4vbW9kdWxlcy93ZWIuZG9tLml0ZXJhYmxlJyk7XG5yZXF1aXJlKCcuLi9tb2R1bGVzL2VzNi5zdHJpbmcuaXRlcmF0b3InKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9jb3JlLmdldC1pdGVyYXRvcicpO1xuIiwicmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczYub2JqZWN0LmNyZWF0ZScpO1xudmFyICRPYmplY3QgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL19jb3JlJykuT2JqZWN0O1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGUoUCwgRCkge1xuICByZXR1cm4gJE9iamVjdC5jcmVhdGUoUCwgRCk7XG59O1xuIiwicmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczYub2JqZWN0LmRlZmluZS1wcm9wZXJ0eScpO1xudmFyICRPYmplY3QgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL19jb3JlJykuT2JqZWN0O1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0eShpdCwga2V5LCBkZXNjKSB7XG4gIHJldHVybiAkT2JqZWN0LmRlZmluZVByb3BlcnR5KGl0LCBrZXksIGRlc2MpO1xufTtcbiIsInJlcXVpcmUoJy4uLy4uL21vZHVsZXMvZXM2Lm9iamVjdC5nZXQtb3duLXByb3BlcnR5LWRlc2NyaXB0b3InKTtcbnZhciAkT2JqZWN0ID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9fY29yZScpLk9iamVjdDtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGl0LCBrZXkpIHtcbiAgcmV0dXJuICRPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGl0LCBrZXkpO1xufTtcbiIsInJlcXVpcmUoJy4uLy4uL21vZHVsZXMvZXM2Lm9iamVjdC5nZXQtcHJvdG90eXBlLW9mJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvX2NvcmUnKS5PYmplY3QuZ2V0UHJvdG90eXBlT2Y7XG4iLCJyZXF1aXJlKCcuLi8uLi9tb2R1bGVzL2VzNi5vYmplY3Quc2V0LXByb3RvdHlwZS1vZicpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL19jb3JlJykuT2JqZWN0LnNldFByb3RvdHlwZU9mO1xuIiwicmVxdWlyZSgnLi4vbW9kdWxlcy9lczYub2JqZWN0LnRvLXN0cmluZycpO1xucmVxdWlyZSgnLi4vbW9kdWxlcy9lczYuc3RyaW5nLml0ZXJhdG9yJyk7XG5yZXF1aXJlKCcuLi9tb2R1bGVzL3dlYi5kb20uaXRlcmFibGUnKTtcbnJlcXVpcmUoJy4uL21vZHVsZXMvZXM2LnNldCcpO1xucmVxdWlyZSgnLi4vbW9kdWxlcy9lczcuc2V0LnRvLWpzb24nKTtcbnJlcXVpcmUoJy4uL21vZHVsZXMvZXM3LnNldC5vZicpO1xucmVxdWlyZSgnLi4vbW9kdWxlcy9lczcuc2V0LmZyb20nKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9fY29yZScpLlNldDtcbiIsInJlcXVpcmUoJy4uLy4uL21vZHVsZXMvZXM2LnN5bWJvbCcpO1xucmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczYub2JqZWN0LnRvLXN0cmluZycpO1xucmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczcuc3ltYm9sLmFzeW5jLWl0ZXJhdG9yJyk7XG5yZXF1aXJlKCcuLi8uLi9tb2R1bGVzL2VzNy5zeW1ib2wub2JzZXJ2YWJsZScpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL19jb3JlJykuU3ltYm9sO1xuIiwicmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczYuc3RyaW5nLml0ZXJhdG9yJyk7XG5yZXF1aXJlKCcuLi8uLi9tb2R1bGVzL3dlYi5kb20uaXRlcmFibGUnKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9fd2tzLWV4dCcpLmYoJ2l0ZXJhdG9yJyk7XG4iLCJyZXF1aXJlKCcuLi9tb2R1bGVzL2VzNi5vYmplY3QudG8tc3RyaW5nJyk7XG5yZXF1aXJlKCcuLi9tb2R1bGVzL3dlYi5kb20uaXRlcmFibGUnKTtcbnJlcXVpcmUoJy4uL21vZHVsZXMvZXM2LndlYWstbWFwJyk7XG5yZXF1aXJlKCcuLi9tb2R1bGVzL2VzNy53ZWFrLW1hcC5vZicpO1xucmVxdWlyZSgnLi4vbW9kdWxlcy9lczcud2Vhay1tYXAuZnJvbScpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi9tb2R1bGVzL19jb3JlJykuV2Vha01hcDtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGl0KSB7XG4gIGlmICh0eXBlb2YgaXQgIT0gJ2Z1bmN0aW9uJykgdGhyb3cgVHlwZUVycm9yKGl0ICsgJyBpcyBub3QgYSBmdW5jdGlvbiEnKTtcbiAgcmV0dXJuIGl0O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkgeyAvKiBlbXB0eSAqLyB9O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaXQsIENvbnN0cnVjdG9yLCBuYW1lLCBmb3JiaWRkZW5GaWVsZCkge1xuICBpZiAoIShpdCBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSB8fCAoZm9yYmlkZGVuRmllbGQgIT09IHVuZGVmaW5lZCAmJiBmb3JiaWRkZW5GaWVsZCBpbiBpdCkpIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IobmFtZSArICc6IGluY29ycmVjdCBpbnZvY2F0aW9uIScpO1xuICB9IHJldHVybiBpdDtcbn07XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL19pcy1vYmplY3QnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGl0KSB7XG4gIGlmICghaXNPYmplY3QoaXQpKSB0aHJvdyBUeXBlRXJyb3IoaXQgKyAnIGlzIG5vdCBhbiBvYmplY3QhJyk7XG4gIHJldHVybiBpdDtcbn07XG4iLCJ2YXIgZm9yT2YgPSByZXF1aXJlKCcuL19mb3Itb2YnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaXRlciwgSVRFUkFUT1IpIHtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICBmb3JPZihpdGVyLCBmYWxzZSwgcmVzdWx0LnB1c2gsIHJlc3VsdCwgSVRFUkFUT1IpO1xuICByZXR1cm4gcmVzdWx0O1xufTtcbiIsIi8vIGZhbHNlIC0+IEFycmF5I2luZGV4T2Zcbi8vIHRydWUgIC0+IEFycmF5I2luY2x1ZGVzXG52YXIgdG9JT2JqZWN0ID0gcmVxdWlyZSgnLi9fdG8taW9iamVjdCcpO1xudmFyIHRvTGVuZ3RoID0gcmVxdWlyZSgnLi9fdG8tbGVuZ3RoJyk7XG52YXIgdG9BYnNvbHV0ZUluZGV4ID0gcmVxdWlyZSgnLi9fdG8tYWJzb2x1dGUtaW5kZXgnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKElTX0lOQ0xVREVTKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoJHRoaXMsIGVsLCBmcm9tSW5kZXgpIHtcbiAgICB2YXIgTyA9IHRvSU9iamVjdCgkdGhpcyk7XG4gICAgdmFyIGxlbmd0aCA9IHRvTGVuZ3RoKE8ubGVuZ3RoKTtcbiAgICB2YXIgaW5kZXggPSB0b0Fic29sdXRlSW5kZXgoZnJvbUluZGV4LCBsZW5ndGgpO1xuICAgIHZhciB2YWx1ZTtcbiAgICAvLyBBcnJheSNpbmNsdWRlcyB1c2VzIFNhbWVWYWx1ZVplcm8gZXF1YWxpdHkgYWxnb3JpdGhtXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNlbGYtY29tcGFyZVxuICAgIGlmIChJU19JTkNMVURFUyAmJiBlbCAhPSBlbCkgd2hpbGUgKGxlbmd0aCA+IGluZGV4KSB7XG4gICAgICB2YWx1ZSA9IE9baW5kZXgrK107XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tc2VsZi1jb21wYXJlXG4gICAgICBpZiAodmFsdWUgIT0gdmFsdWUpIHJldHVybiB0cnVlO1xuICAgIC8vIEFycmF5I2luZGV4T2YgaWdub3JlcyBob2xlcywgQXJyYXkjaW5jbHVkZXMgLSBub3RcbiAgICB9IGVsc2UgZm9yICg7bGVuZ3RoID4gaW5kZXg7IGluZGV4KyspIGlmIChJU19JTkNMVURFUyB8fCBpbmRleCBpbiBPKSB7XG4gICAgICBpZiAoT1tpbmRleF0gPT09IGVsKSByZXR1cm4gSVNfSU5DTFVERVMgfHwgaW5kZXggfHwgMDtcbiAgICB9IHJldHVybiAhSVNfSU5DTFVERVMgJiYgLTE7XG4gIH07XG59O1xuIiwiLy8gMCAtPiBBcnJheSNmb3JFYWNoXG4vLyAxIC0+IEFycmF5I21hcFxuLy8gMiAtPiBBcnJheSNmaWx0ZXJcbi8vIDMgLT4gQXJyYXkjc29tZVxuLy8gNCAtPiBBcnJheSNldmVyeVxuLy8gNSAtPiBBcnJheSNmaW5kXG4vLyA2IC0+IEFycmF5I2ZpbmRJbmRleFxudmFyIGN0eCA9IHJlcXVpcmUoJy4vX2N0eCcpO1xudmFyIElPYmplY3QgPSByZXF1aXJlKCcuL19pb2JqZWN0Jyk7XG52YXIgdG9PYmplY3QgPSByZXF1aXJlKCcuL190by1vYmplY3QnKTtcbnZhciB0b0xlbmd0aCA9IHJlcXVpcmUoJy4vX3RvLWxlbmd0aCcpO1xudmFyIGFzYyA9IHJlcXVpcmUoJy4vX2FycmF5LXNwZWNpZXMtY3JlYXRlJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChUWVBFLCAkY3JlYXRlKSB7XG4gIHZhciBJU19NQVAgPSBUWVBFID09IDE7XG4gIHZhciBJU19GSUxURVIgPSBUWVBFID09IDI7XG4gIHZhciBJU19TT01FID0gVFlQRSA9PSAzO1xuICB2YXIgSVNfRVZFUlkgPSBUWVBFID09IDQ7XG4gIHZhciBJU19GSU5EX0lOREVYID0gVFlQRSA9PSA2O1xuICB2YXIgTk9fSE9MRVMgPSBUWVBFID09IDUgfHwgSVNfRklORF9JTkRFWDtcbiAgdmFyIGNyZWF0ZSA9ICRjcmVhdGUgfHwgYXNjO1xuICByZXR1cm4gZnVuY3Rpb24gKCR0aGlzLCBjYWxsYmFja2ZuLCB0aGF0KSB7XG4gICAgdmFyIE8gPSB0b09iamVjdCgkdGhpcyk7XG4gICAgdmFyIHNlbGYgPSBJT2JqZWN0KE8pO1xuICAgIHZhciBmID0gY3R4KGNhbGxiYWNrZm4sIHRoYXQsIDMpO1xuICAgIHZhciBsZW5ndGggPSB0b0xlbmd0aChzZWxmLmxlbmd0aCk7XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgcmVzdWx0ID0gSVNfTUFQID8gY3JlYXRlKCR0aGlzLCBsZW5ndGgpIDogSVNfRklMVEVSID8gY3JlYXRlKCR0aGlzLCAwKSA6IHVuZGVmaW5lZDtcbiAgICB2YXIgdmFsLCByZXM7XG4gICAgZm9yICg7bGVuZ3RoID4gaW5kZXg7IGluZGV4KyspIGlmIChOT19IT0xFUyB8fCBpbmRleCBpbiBzZWxmKSB7XG4gICAgICB2YWwgPSBzZWxmW2luZGV4XTtcbiAgICAgIHJlcyA9IGYodmFsLCBpbmRleCwgTyk7XG4gICAgICBpZiAoVFlQRSkge1xuICAgICAgICBpZiAoSVNfTUFQKSByZXN1bHRbaW5kZXhdID0gcmVzOyAgIC8vIG1hcFxuICAgICAgICBlbHNlIGlmIChyZXMpIHN3aXRjaCAoVFlQRSkge1xuICAgICAgICAgIGNhc2UgMzogcmV0dXJuIHRydWU7ICAgICAgICAgICAgIC8vIHNvbWVcbiAgICAgICAgICBjYXNlIDU6IHJldHVybiB2YWw7ICAgICAgICAgICAgICAvLyBmaW5kXG4gICAgICAgICAgY2FzZSA2OiByZXR1cm4gaW5kZXg7ICAgICAgICAgICAgLy8gZmluZEluZGV4XG4gICAgICAgICAgY2FzZSAyOiByZXN1bHQucHVzaCh2YWwpOyAgICAgICAgLy8gZmlsdGVyXG4gICAgICAgIH0gZWxzZSBpZiAoSVNfRVZFUlkpIHJldHVybiBmYWxzZTsgLy8gZXZlcnlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIElTX0ZJTkRfSU5ERVggPyAtMSA6IElTX1NPTUUgfHwgSVNfRVZFUlkgPyBJU19FVkVSWSA6IHJlc3VsdDtcbiAgfTtcbn07XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL19pcy1vYmplY3QnKTtcbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnLi9faXMtYXJyYXknKTtcbnZhciBTUEVDSUVTID0gcmVxdWlyZSgnLi9fd2tzJykoJ3NwZWNpZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3JpZ2luYWwpIHtcbiAgdmFyIEM7XG4gIGlmIChpc0FycmF5KG9yaWdpbmFsKSkge1xuICAgIEMgPSBvcmlnaW5hbC5jb25zdHJ1Y3RvcjtcbiAgICAvLyBjcm9zcy1yZWFsbSBmYWxsYmFja1xuICAgIGlmICh0eXBlb2YgQyA9PSAnZnVuY3Rpb24nICYmIChDID09PSBBcnJheSB8fCBpc0FycmF5KEMucHJvdG90eXBlKSkpIEMgPSB1bmRlZmluZWQ7XG4gICAgaWYgKGlzT2JqZWN0KEMpKSB7XG4gICAgICBDID0gQ1tTUEVDSUVTXTtcbiAgICAgIGlmIChDID09PSBudWxsKSBDID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfSByZXR1cm4gQyA9PT0gdW5kZWZpbmVkID8gQXJyYXkgOiBDO1xufTtcbiIsIi8vIDkuNC4yLjMgQXJyYXlTcGVjaWVzQ3JlYXRlKG9yaWdpbmFsQXJyYXksIGxlbmd0aClcbnZhciBzcGVjaWVzQ29uc3RydWN0b3IgPSByZXF1aXJlKCcuL19hcnJheS1zcGVjaWVzLWNvbnN0cnVjdG9yJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9yaWdpbmFsLCBsZW5ndGgpIHtcbiAgcmV0dXJuIG5ldyAoc3BlY2llc0NvbnN0cnVjdG9yKG9yaWdpbmFsKSkobGVuZ3RoKTtcbn07XG4iLCIvLyBnZXR0aW5nIHRhZyBmcm9tIDE5LjEuMy42IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcoKVxudmFyIGNvZiA9IHJlcXVpcmUoJy4vX2NvZicpO1xudmFyIFRBRyA9IHJlcXVpcmUoJy4vX3drcycpKCd0b1N0cmluZ1RhZycpO1xuLy8gRVMzIHdyb25nIGhlcmVcbnZhciBBUkcgPSBjb2YoZnVuY3Rpb24gKCkgeyByZXR1cm4gYXJndW1lbnRzOyB9KCkpID09ICdBcmd1bWVudHMnO1xuXG4vLyBmYWxsYmFjayBmb3IgSUUxMSBTY3JpcHQgQWNjZXNzIERlbmllZCBlcnJvclxudmFyIHRyeUdldCA9IGZ1bmN0aW9uIChpdCwga2V5KSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGl0W2tleV07XG4gIH0gY2F0Y2ggKGUpIHsgLyogZW1wdHkgKi8gfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaXQpIHtcbiAgdmFyIE8sIFQsIEI7XG4gIHJldHVybiBpdCA9PT0gdW5kZWZpbmVkID8gJ1VuZGVmaW5lZCcgOiBpdCA9PT0gbnVsbCA/ICdOdWxsJ1xuICAgIC8vIEBAdG9TdHJpbmdUYWcgY2FzZVxuICAgIDogdHlwZW9mIChUID0gdHJ5R2V0KE8gPSBPYmplY3QoaXQpLCBUQUcpKSA9PSAnc3RyaW5nJyA/IFRcbiAgICAvLyBidWlsdGluVGFnIGNhc2VcbiAgICA6IEFSRyA/IGNvZihPKVxuICAgIC8vIEVTMyBhcmd1bWVudHMgZmFsbGJhY2tcbiAgICA6IChCID0gY29mKE8pKSA9PSAnT2JqZWN0JyAmJiB0eXBlb2YgTy5jYWxsZWUgPT0gJ2Z1bmN0aW9uJyA/ICdBcmd1bWVudHMnIDogQjtcbn07XG4iLCJ2YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaXQpIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwoaXQpLnNsaWNlKDgsIC0xKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZFAgPSByZXF1aXJlKCcuL19vYmplY3QtZHAnKS5mO1xudmFyIGNyZWF0ZSA9IHJlcXVpcmUoJy4vX29iamVjdC1jcmVhdGUnKTtcbnZhciByZWRlZmluZUFsbCA9IHJlcXVpcmUoJy4vX3JlZGVmaW5lLWFsbCcpO1xudmFyIGN0eCA9IHJlcXVpcmUoJy4vX2N0eCcpO1xudmFyIGFuSW5zdGFuY2UgPSByZXF1aXJlKCcuL19hbi1pbnN0YW5jZScpO1xudmFyIGZvck9mID0gcmVxdWlyZSgnLi9fZm9yLW9mJyk7XG52YXIgJGl0ZXJEZWZpbmUgPSByZXF1aXJlKCcuL19pdGVyLWRlZmluZScpO1xudmFyIHN0ZXAgPSByZXF1aXJlKCcuL19pdGVyLXN0ZXAnKTtcbnZhciBzZXRTcGVjaWVzID0gcmVxdWlyZSgnLi9fc2V0LXNwZWNpZXMnKTtcbnZhciBERVNDUklQVE9SUyA9IHJlcXVpcmUoJy4vX2Rlc2NyaXB0b3JzJyk7XG52YXIgZmFzdEtleSA9IHJlcXVpcmUoJy4vX21ldGEnKS5mYXN0S2V5O1xudmFyIHZhbGlkYXRlID0gcmVxdWlyZSgnLi9fdmFsaWRhdGUtY29sbGVjdGlvbicpO1xudmFyIFNJWkUgPSBERVNDUklQVE9SUyA/ICdfcycgOiAnc2l6ZSc7XG5cbnZhciBnZXRFbnRyeSA9IGZ1bmN0aW9uICh0aGF0LCBrZXkpIHtcbiAgLy8gZmFzdCBjYXNlXG4gIHZhciBpbmRleCA9IGZhc3RLZXkoa2V5KTtcbiAgdmFyIGVudHJ5O1xuICBpZiAoaW5kZXggIT09ICdGJykgcmV0dXJuIHRoYXQuX2lbaW5kZXhdO1xuICAvLyBmcm96ZW4gb2JqZWN0IGNhc2VcbiAgZm9yIChlbnRyeSA9IHRoYXQuX2Y7IGVudHJ5OyBlbnRyeSA9IGVudHJ5Lm4pIHtcbiAgICBpZiAoZW50cnkuayA9PSBrZXkpIHJldHVybiBlbnRyeTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldENvbnN0cnVjdG9yOiBmdW5jdGlvbiAod3JhcHBlciwgTkFNRSwgSVNfTUFQLCBBRERFUikge1xuICAgIHZhciBDID0gd3JhcHBlcihmdW5jdGlvbiAodGhhdCwgaXRlcmFibGUpIHtcbiAgICAgIGFuSW5zdGFuY2UodGhhdCwgQywgTkFNRSwgJ19pJyk7XG4gICAgICB0aGF0Ll90ID0gTkFNRTsgICAgICAgICAvLyBjb2xsZWN0aW9uIHR5cGVcbiAgICAgIHRoYXQuX2kgPSBjcmVhdGUobnVsbCk7IC8vIGluZGV4XG4gICAgICB0aGF0Ll9mID0gdW5kZWZpbmVkOyAgICAvLyBmaXJzdCBlbnRyeVxuICAgICAgdGhhdC5fbCA9IHVuZGVmaW5lZDsgICAgLy8gbGFzdCBlbnRyeVxuICAgICAgdGhhdFtTSVpFXSA9IDA7ICAgICAgICAgLy8gc2l6ZVxuICAgICAgaWYgKGl0ZXJhYmxlICE9IHVuZGVmaW5lZCkgZm9yT2YoaXRlcmFibGUsIElTX01BUCwgdGhhdFtBRERFUl0sIHRoYXQpO1xuICAgIH0pO1xuICAgIHJlZGVmaW5lQWxsKEMucHJvdG90eXBlLCB7XG4gICAgICAvLyAyMy4xLjMuMSBNYXAucHJvdG90eXBlLmNsZWFyKClcbiAgICAgIC8vIDIzLjIuMy4yIFNldC5wcm90b3R5cGUuY2xlYXIoKVxuICAgICAgY2xlYXI6IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgICAgICBmb3IgKHZhciB0aGF0ID0gdmFsaWRhdGUodGhpcywgTkFNRSksIGRhdGEgPSB0aGF0Ll9pLCBlbnRyeSA9IHRoYXQuX2Y7IGVudHJ5OyBlbnRyeSA9IGVudHJ5Lm4pIHtcbiAgICAgICAgICBlbnRyeS5yID0gdHJ1ZTtcbiAgICAgICAgICBpZiAoZW50cnkucCkgZW50cnkucCA9IGVudHJ5LnAubiA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBkZWxldGUgZGF0YVtlbnRyeS5pXTtcbiAgICAgICAgfVxuICAgICAgICB0aGF0Ll9mID0gdGhhdC5fbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhhdFtTSVpFXSA9IDA7XG4gICAgICB9LFxuICAgICAgLy8gMjMuMS4zLjMgTWFwLnByb3RvdHlwZS5kZWxldGUoa2V5KVxuICAgICAgLy8gMjMuMi4zLjQgU2V0LnByb3RvdHlwZS5kZWxldGUodmFsdWUpXG4gICAgICAnZGVsZXRlJzogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICB2YXIgdGhhdCA9IHZhbGlkYXRlKHRoaXMsIE5BTUUpO1xuICAgICAgICB2YXIgZW50cnkgPSBnZXRFbnRyeSh0aGF0LCBrZXkpO1xuICAgICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgICB2YXIgbmV4dCA9IGVudHJ5Lm47XG4gICAgICAgICAgdmFyIHByZXYgPSBlbnRyeS5wO1xuICAgICAgICAgIGRlbGV0ZSB0aGF0Ll9pW2VudHJ5LmldO1xuICAgICAgICAgIGVudHJ5LnIgPSB0cnVlO1xuICAgICAgICAgIGlmIChwcmV2KSBwcmV2Lm4gPSBuZXh0O1xuICAgICAgICAgIGlmIChuZXh0KSBuZXh0LnAgPSBwcmV2O1xuICAgICAgICAgIGlmICh0aGF0Ll9mID09IGVudHJ5KSB0aGF0Ll9mID0gbmV4dDtcbiAgICAgICAgICBpZiAodGhhdC5fbCA9PSBlbnRyeSkgdGhhdC5fbCA9IHByZXY7XG4gICAgICAgICAgdGhhdFtTSVpFXS0tO1xuICAgICAgICB9IHJldHVybiAhIWVudHJ5O1xuICAgICAgfSxcbiAgICAgIC8vIDIzLjIuMy42IFNldC5wcm90b3R5cGUuZm9yRWFjaChjYWxsYmFja2ZuLCB0aGlzQXJnID0gdW5kZWZpbmVkKVxuICAgICAgLy8gMjMuMS4zLjUgTWFwLnByb3RvdHlwZS5mb3JFYWNoKGNhbGxiYWNrZm4sIHRoaXNBcmcgPSB1bmRlZmluZWQpXG4gICAgICBmb3JFYWNoOiBmdW5jdGlvbiBmb3JFYWNoKGNhbGxiYWNrZm4gLyogLCB0aGF0ID0gdW5kZWZpbmVkICovKSB7XG4gICAgICAgIHZhbGlkYXRlKHRoaXMsIE5BTUUpO1xuICAgICAgICB2YXIgZiA9IGN0eChjYWxsYmFja2ZuLCBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IHVuZGVmaW5lZCwgMyk7XG4gICAgICAgIHZhciBlbnRyeTtcbiAgICAgICAgd2hpbGUgKGVudHJ5ID0gZW50cnkgPyBlbnRyeS5uIDogdGhpcy5fZikge1xuICAgICAgICAgIGYoZW50cnkudiwgZW50cnkuaywgdGhpcyk7XG4gICAgICAgICAgLy8gcmV2ZXJ0IHRvIHRoZSBsYXN0IGV4aXN0aW5nIGVudHJ5XG4gICAgICAgICAgd2hpbGUgKGVudHJ5ICYmIGVudHJ5LnIpIGVudHJ5ID0gZW50cnkucDtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIC8vIDIzLjEuMy43IE1hcC5wcm90b3R5cGUuaGFzKGtleSlcbiAgICAgIC8vIDIzLjIuMy43IFNldC5wcm90b3R5cGUuaGFzKHZhbHVlKVxuICAgICAgaGFzOiBmdW5jdGlvbiBoYXMoa2V5KSB7XG4gICAgICAgIHJldHVybiAhIWdldEVudHJ5KHZhbGlkYXRlKHRoaXMsIE5BTUUpLCBrZXkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChERVNDUklQVE9SUykgZFAoQy5wcm90b3R5cGUsICdzaXplJywge1xuICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZSh0aGlzLCBOQU1FKVtTSVpFXTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gQztcbiAgfSxcbiAgZGVmOiBmdW5jdGlvbiAodGhhdCwga2V5LCB2YWx1ZSkge1xuICAgIHZhciBlbnRyeSA9IGdldEVudHJ5KHRoYXQsIGtleSk7XG4gICAgdmFyIHByZXYsIGluZGV4O1xuICAgIC8vIGNoYW5nZSBleGlzdGluZyBlbnRyeVxuICAgIGlmIChlbnRyeSkge1xuICAgICAgZW50cnkudiA9IHZhbHVlO1xuICAgIC8vIGNyZWF0ZSBuZXcgZW50cnlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhhdC5fbCA9IGVudHJ5ID0ge1xuICAgICAgICBpOiBpbmRleCA9IGZhc3RLZXkoa2V5LCB0cnVlKSwgLy8gPC0gaW5kZXhcbiAgICAgICAgazoga2V5LCAgICAgICAgICAgICAgICAgICAgICAgIC8vIDwtIGtleVxuICAgICAgICB2OiB2YWx1ZSwgICAgICAgICAgICAgICAgICAgICAgLy8gPC0gdmFsdWVcbiAgICAgICAgcDogcHJldiA9IHRoYXQuX2wsICAgICAgICAgICAgIC8vIDwtIHByZXZpb3VzIGVudHJ5XG4gICAgICAgIG46IHVuZGVmaW5lZCwgICAgICAgICAgICAgICAgICAvLyA8LSBuZXh0IGVudHJ5XG4gICAgICAgIHI6IGZhbHNlICAgICAgICAgICAgICAgICAgICAgICAvLyA8LSByZW1vdmVkXG4gICAgICB9O1xuICAgICAgaWYgKCF0aGF0Ll9mKSB0aGF0Ll9mID0gZW50cnk7XG4gICAgICBpZiAocHJldikgcHJldi5uID0gZW50cnk7XG4gICAgICB0aGF0W1NJWkVdKys7XG4gICAgICAvLyBhZGQgdG8gaW5kZXhcbiAgICAgIGlmIChpbmRleCAhPT0gJ0YnKSB0aGF0Ll9pW2luZGV4XSA9IGVudHJ5O1xuICAgIH0gcmV0dXJuIHRoYXQ7XG4gIH0sXG4gIGdldEVudHJ5OiBnZXRFbnRyeSxcbiAgc2V0U3Ryb25nOiBmdW5jdGlvbiAoQywgTkFNRSwgSVNfTUFQKSB7XG4gICAgLy8gYWRkIC5rZXlzLCAudmFsdWVzLCAuZW50cmllcywgW0BAaXRlcmF0b3JdXG4gICAgLy8gMjMuMS4zLjQsIDIzLjEuMy44LCAyMy4xLjMuMTEsIDIzLjEuMy4xMiwgMjMuMi4zLjUsIDIzLjIuMy44LCAyMy4yLjMuMTAsIDIzLjIuMy4xMVxuICAgICRpdGVyRGVmaW5lKEMsIE5BTUUsIGZ1bmN0aW9uIChpdGVyYXRlZCwga2luZCkge1xuICAgICAgdGhpcy5fdCA9IHZhbGlkYXRlKGl0ZXJhdGVkLCBOQU1FKTsgLy8gdGFyZ2V0XG4gICAgICB0aGlzLl9rID0ga2luZDsgICAgICAgICAgICAgICAgICAgICAvLyBraW5kXG4gICAgICB0aGlzLl9sID0gdW5kZWZpbmVkOyAgICAgICAgICAgICAgICAvLyBwcmV2aW91c1xuICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgIHZhciBraW5kID0gdGhhdC5faztcbiAgICAgIHZhciBlbnRyeSA9IHRoYXQuX2w7XG4gICAgICAvLyByZXZlcnQgdG8gdGhlIGxhc3QgZXhpc3RpbmcgZW50cnlcbiAgICAgIHdoaWxlIChlbnRyeSAmJiBlbnRyeS5yKSBlbnRyeSA9IGVudHJ5LnA7XG4gICAgICAvLyBnZXQgbmV4dCBlbnRyeVxuICAgICAgaWYgKCF0aGF0Ll90IHx8ICEodGhhdC5fbCA9IGVudHJ5ID0gZW50cnkgPyBlbnRyeS5uIDogdGhhdC5fdC5fZikpIHtcbiAgICAgICAgLy8gb3IgZmluaXNoIHRoZSBpdGVyYXRpb25cbiAgICAgICAgdGhhdC5fdCA9IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIHN0ZXAoMSk7XG4gICAgICB9XG4gICAgICAvLyByZXR1cm4gc3RlcCBieSBraW5kXG4gICAgICBpZiAoa2luZCA9PSAna2V5cycpIHJldHVybiBzdGVwKDAsIGVudHJ5LmspO1xuICAgICAgaWYgKGtpbmQgPT0gJ3ZhbHVlcycpIHJldHVybiBzdGVwKDAsIGVudHJ5LnYpO1xuICAgICAgcmV0dXJuIHN0ZXAoMCwgW2VudHJ5LmssIGVudHJ5LnZdKTtcbiAgICB9LCBJU19NQVAgPyAnZW50cmllcycgOiAndmFsdWVzJywgIUlTX01BUCwgdHJ1ZSk7XG5cbiAgICAvLyBhZGQgW0BAc3BlY2llc10sIDIzLjEuMi4yLCAyMy4yLjIuMlxuICAgIHNldFNwZWNpZXMoTkFNRSk7XG4gIH1cbn07XG4iLCIvLyBodHRwczovL2dpdGh1Yi5jb20vRGF2aWRCcnVhbnQvTWFwLVNldC5wcm90b3R5cGUudG9KU09OXG52YXIgY2xhc3NvZiA9IHJlcXVpcmUoJy4vX2NsYXNzb2YnKTtcbnZhciBmcm9tID0gcmVxdWlyZSgnLi9fYXJyYXktZnJvbS1pdGVyYWJsZScpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoTkFNRSkge1xuICByZXR1cm4gZnVuY3Rpb24gdG9KU09OKCkge1xuICAgIGlmIChjbGFzc29mKHRoaXMpICE9IE5BTUUpIHRocm93IFR5cGVFcnJvcihOQU1FICsgXCIjdG9KU09OIGlzbid0IGdlbmVyaWNcIik7XG4gICAgcmV0dXJuIGZyb20odGhpcyk7XG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHJlZGVmaW5lQWxsID0gcmVxdWlyZSgnLi9fcmVkZWZpbmUtYWxsJyk7XG52YXIgZ2V0V2VhayA9IHJlcXVpcmUoJy4vX21ldGEnKS5nZXRXZWFrO1xudmFyIGFuT2JqZWN0ID0gcmVxdWlyZSgnLi9fYW4tb2JqZWN0Jyk7XG52YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL19pcy1vYmplY3QnKTtcbnZhciBhbkluc3RhbmNlID0gcmVxdWlyZSgnLi9fYW4taW5zdGFuY2UnKTtcbnZhciBmb3JPZiA9IHJlcXVpcmUoJy4vX2Zvci1vZicpO1xudmFyIGNyZWF0ZUFycmF5TWV0aG9kID0gcmVxdWlyZSgnLi9fYXJyYXktbWV0aG9kcycpO1xudmFyICRoYXMgPSByZXF1aXJlKCcuL19oYXMnKTtcbnZhciB2YWxpZGF0ZSA9IHJlcXVpcmUoJy4vX3ZhbGlkYXRlLWNvbGxlY3Rpb24nKTtcbnZhciBhcnJheUZpbmQgPSBjcmVhdGVBcnJheU1ldGhvZCg1KTtcbnZhciBhcnJheUZpbmRJbmRleCA9IGNyZWF0ZUFycmF5TWV0aG9kKDYpO1xudmFyIGlkID0gMDtcblxuLy8gZmFsbGJhY2sgZm9yIHVuY2F1Z2h0IGZyb3plbiBrZXlzXG52YXIgdW5jYXVnaHRGcm96ZW5TdG9yZSA9IGZ1bmN0aW9uICh0aGF0KSB7XG4gIHJldHVybiB0aGF0Ll9sIHx8ICh0aGF0Ll9sID0gbmV3IFVuY2F1Z2h0RnJvemVuU3RvcmUoKSk7XG59O1xudmFyIFVuY2F1Z2h0RnJvemVuU3RvcmUgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuYSA9IFtdO1xufTtcbnZhciBmaW5kVW5jYXVnaHRGcm96ZW4gPSBmdW5jdGlvbiAoc3RvcmUsIGtleSkge1xuICByZXR1cm4gYXJyYXlGaW5kKHN0b3JlLmEsIGZ1bmN0aW9uIChpdCkge1xuICAgIHJldHVybiBpdFswXSA9PT0ga2V5O1xuICB9KTtcbn07XG5VbmNhdWdodEZyb3plblN0b3JlLnByb3RvdHlwZSA9IHtcbiAgZ2V0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgdmFyIGVudHJ5ID0gZmluZFVuY2F1Z2h0RnJvemVuKHRoaXMsIGtleSk7XG4gICAgaWYgKGVudHJ5KSByZXR1cm4gZW50cnlbMV07XG4gIH0sXG4gIGhhczogZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiAhIWZpbmRVbmNhdWdodEZyb3plbih0aGlzLCBrZXkpO1xuICB9LFxuICBzZXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgdmFyIGVudHJ5ID0gZmluZFVuY2F1Z2h0RnJvemVuKHRoaXMsIGtleSk7XG4gICAgaWYgKGVudHJ5KSBlbnRyeVsxXSA9IHZhbHVlO1xuICAgIGVsc2UgdGhpcy5hLnB1c2goW2tleSwgdmFsdWVdKTtcbiAgfSxcbiAgJ2RlbGV0ZSc6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICB2YXIgaW5kZXggPSBhcnJheUZpbmRJbmRleCh0aGlzLmEsIGZ1bmN0aW9uIChpdCkge1xuICAgICAgcmV0dXJuIGl0WzBdID09PSBrZXk7XG4gICAgfSk7XG4gICAgaWYgKH5pbmRleCkgdGhpcy5hLnNwbGljZShpbmRleCwgMSk7XG4gICAgcmV0dXJuICEhfmluZGV4O1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0Q29uc3RydWN0b3I6IGZ1bmN0aW9uICh3cmFwcGVyLCBOQU1FLCBJU19NQVAsIEFEREVSKSB7XG4gICAgdmFyIEMgPSB3cmFwcGVyKGZ1bmN0aW9uICh0aGF0LCBpdGVyYWJsZSkge1xuICAgICAgYW5JbnN0YW5jZSh0aGF0LCBDLCBOQU1FLCAnX2knKTtcbiAgICAgIHRoYXQuX3QgPSBOQU1FOyAgICAgIC8vIGNvbGxlY3Rpb24gdHlwZVxuICAgICAgdGhhdC5faSA9IGlkKys7ICAgICAgLy8gY29sbGVjdGlvbiBpZFxuICAgICAgdGhhdC5fbCA9IHVuZGVmaW5lZDsgLy8gbGVhayBzdG9yZSBmb3IgdW5jYXVnaHQgZnJvemVuIG9iamVjdHNcbiAgICAgIGlmIChpdGVyYWJsZSAhPSB1bmRlZmluZWQpIGZvck9mKGl0ZXJhYmxlLCBJU19NQVAsIHRoYXRbQURERVJdLCB0aGF0KTtcbiAgICB9KTtcbiAgICByZWRlZmluZUFsbChDLnByb3RvdHlwZSwge1xuICAgICAgLy8gMjMuMy4zLjIgV2Vha01hcC5wcm90b3R5cGUuZGVsZXRlKGtleSlcbiAgICAgIC8vIDIzLjQuMy4zIFdlYWtTZXQucHJvdG90eXBlLmRlbGV0ZSh2YWx1ZSlcbiAgICAgICdkZWxldGUnOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmICghaXNPYmplY3Qoa2V5KSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB2YXIgZGF0YSA9IGdldFdlYWsoa2V5KTtcbiAgICAgICAgaWYgKGRhdGEgPT09IHRydWUpIHJldHVybiB1bmNhdWdodEZyb3plblN0b3JlKHZhbGlkYXRlKHRoaXMsIE5BTUUpKVsnZGVsZXRlJ10oa2V5KTtcbiAgICAgICAgcmV0dXJuIGRhdGEgJiYgJGhhcyhkYXRhLCB0aGlzLl9pKSAmJiBkZWxldGUgZGF0YVt0aGlzLl9pXTtcbiAgICAgIH0sXG4gICAgICAvLyAyMy4zLjMuNCBXZWFrTWFwLnByb3RvdHlwZS5oYXMoa2V5KVxuICAgICAgLy8gMjMuNC4zLjQgV2Vha1NldC5wcm90b3R5cGUuaGFzKHZhbHVlKVxuICAgICAgaGFzOiBmdW5jdGlvbiBoYXMoa2V5KSB7XG4gICAgICAgIGlmICghaXNPYmplY3Qoa2V5KSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB2YXIgZGF0YSA9IGdldFdlYWsoa2V5KTtcbiAgICAgICAgaWYgKGRhdGEgPT09IHRydWUpIHJldHVybiB1bmNhdWdodEZyb3plblN0b3JlKHZhbGlkYXRlKHRoaXMsIE5BTUUpKS5oYXMoa2V5KTtcbiAgICAgICAgcmV0dXJuIGRhdGEgJiYgJGhhcyhkYXRhLCB0aGlzLl9pKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gQztcbiAgfSxcbiAgZGVmOiBmdW5jdGlvbiAodGhhdCwga2V5LCB2YWx1ZSkge1xuICAgIHZhciBkYXRhID0gZ2V0V2Vhayhhbk9iamVjdChrZXkpLCB0cnVlKTtcbiAgICBpZiAoZGF0YSA9PT0gdHJ1ZSkgdW5jYXVnaHRGcm96ZW5TdG9yZSh0aGF0KS5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgZWxzZSBkYXRhW3RoYXQuX2ldID0gdmFsdWU7XG4gICAgcmV0dXJuIHRoYXQ7XG4gIH0sXG4gIHVmc3RvcmU6IHVuY2F1Z2h0RnJvemVuU3RvcmVcbn07XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZ2xvYmFsID0gcmVxdWlyZSgnLi9fZ2xvYmFsJyk7XG52YXIgJGV4cG9ydCA9IHJlcXVpcmUoJy4vX2V4cG9ydCcpO1xudmFyIG1ldGEgPSByZXF1aXJlKCcuL19tZXRhJyk7XG52YXIgZmFpbHMgPSByZXF1aXJlKCcuL19mYWlscycpO1xudmFyIGhpZGUgPSByZXF1aXJlKCcuL19oaWRlJyk7XG52YXIgcmVkZWZpbmVBbGwgPSByZXF1aXJlKCcuL19yZWRlZmluZS1hbGwnKTtcbnZhciBmb3JPZiA9IHJlcXVpcmUoJy4vX2Zvci1vZicpO1xudmFyIGFuSW5zdGFuY2UgPSByZXF1aXJlKCcuL19hbi1pbnN0YW5jZScpO1xudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9faXMtb2JqZWN0Jyk7XG52YXIgc2V0VG9TdHJpbmdUYWcgPSByZXF1aXJlKCcuL19zZXQtdG8tc3RyaW5nLXRhZycpO1xudmFyIGRQID0gcmVxdWlyZSgnLi9fb2JqZWN0LWRwJykuZjtcbnZhciBlYWNoID0gcmVxdWlyZSgnLi9fYXJyYXktbWV0aG9kcycpKDApO1xudmFyIERFU0NSSVBUT1JTID0gcmVxdWlyZSgnLi9fZGVzY3JpcHRvcnMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoTkFNRSwgd3JhcHBlciwgbWV0aG9kcywgY29tbW9uLCBJU19NQVAsIElTX1dFQUspIHtcbiAgdmFyIEJhc2UgPSBnbG9iYWxbTkFNRV07XG4gIHZhciBDID0gQmFzZTtcbiAgdmFyIEFEREVSID0gSVNfTUFQID8gJ3NldCcgOiAnYWRkJztcbiAgdmFyIHByb3RvID0gQyAmJiBDLnByb3RvdHlwZTtcbiAgdmFyIE8gPSB7fTtcbiAgaWYgKCFERVNDUklQVE9SUyB8fCB0eXBlb2YgQyAhPSAnZnVuY3Rpb24nIHx8ICEoSVNfV0VBSyB8fCBwcm90by5mb3JFYWNoICYmICFmYWlscyhmdW5jdGlvbiAoKSB7XG4gICAgbmV3IEMoKS5lbnRyaWVzKCkubmV4dCgpO1xuICB9KSkpIHtcbiAgICAvLyBjcmVhdGUgY29sbGVjdGlvbiBjb25zdHJ1Y3RvclxuICAgIEMgPSBjb21tb24uZ2V0Q29uc3RydWN0b3Iod3JhcHBlciwgTkFNRSwgSVNfTUFQLCBBRERFUik7XG4gICAgcmVkZWZpbmVBbGwoQy5wcm90b3R5cGUsIG1ldGhvZHMpO1xuICAgIG1ldGEuTkVFRCA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgQyA9IHdyYXBwZXIoZnVuY3Rpb24gKHRhcmdldCwgaXRlcmFibGUpIHtcbiAgICAgIGFuSW5zdGFuY2UodGFyZ2V0LCBDLCBOQU1FLCAnX2MnKTtcbiAgICAgIHRhcmdldC5fYyA9IG5ldyBCYXNlKCk7XG4gICAgICBpZiAoaXRlcmFibGUgIT0gdW5kZWZpbmVkKSBmb3JPZihpdGVyYWJsZSwgSVNfTUFQLCB0YXJnZXRbQURERVJdLCB0YXJnZXQpO1xuICAgIH0pO1xuICAgIGVhY2goJ2FkZCxjbGVhcixkZWxldGUsZm9yRWFjaCxnZXQsaGFzLHNldCxrZXlzLHZhbHVlcyxlbnRyaWVzLHRvSlNPTicuc3BsaXQoJywnKSwgZnVuY3Rpb24gKEtFWSkge1xuICAgICAgdmFyIElTX0FEREVSID0gS0VZID09ICdhZGQnIHx8IEtFWSA9PSAnc2V0JztcbiAgICAgIGlmIChLRVkgaW4gcHJvdG8gJiYgIShJU19XRUFLICYmIEtFWSA9PSAnY2xlYXInKSkgaGlkZShDLnByb3RvdHlwZSwgS0VZLCBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICBhbkluc3RhbmNlKHRoaXMsIEMsIEtFWSk7XG4gICAgICAgIGlmICghSVNfQURERVIgJiYgSVNfV0VBSyAmJiAhaXNPYmplY3QoYSkpIHJldHVybiBLRVkgPT0gJ2dldCcgPyB1bmRlZmluZWQgOiBmYWxzZTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuX2NbS0VZXShhID09PSAwID8gMCA6IGEsIGIpO1xuICAgICAgICByZXR1cm4gSVNfQURERVIgPyB0aGlzIDogcmVzdWx0O1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgSVNfV0VBSyB8fCBkUChDLnByb3RvdHlwZSwgJ3NpemUnLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Muc2l6ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHNldFRvU3RyaW5nVGFnKEMsIE5BTUUpO1xuXG4gIE9bTkFNRV0gPSBDO1xuICAkZXhwb3J0KCRleHBvcnQuRyArICRleHBvcnQuVyArICRleHBvcnQuRiwgTyk7XG5cbiAgaWYgKCFJU19XRUFLKSBjb21tb24uc2V0U3Ryb25nKEMsIE5BTUUsIElTX01BUCk7XG5cbiAgcmV0dXJuIEM7XG59O1xuIiwidmFyIGNvcmUgPSBtb2R1bGUuZXhwb3J0cyA9IHsgdmVyc2lvbjogJzIuNS40JyB9O1xuaWYgKHR5cGVvZiBfX2UgPT0gJ251bWJlcicpIF9fZSA9IGNvcmU7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbiIsIi8vIG9wdGlvbmFsIC8gc2ltcGxlIGNvbnRleHQgYmluZGluZ1xudmFyIGFGdW5jdGlvbiA9IHJlcXVpcmUoJy4vX2EtZnVuY3Rpb24nKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGZuLCB0aGF0LCBsZW5ndGgpIHtcbiAgYUZ1bmN0aW9uKGZuKTtcbiAgaWYgKHRoYXQgPT09IHVuZGVmaW5lZCkgcmV0dXJuIGZuO1xuICBzd2l0Y2ggKGxlbmd0aCkge1xuICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uIChhKSB7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGF0LCBhKTtcbiAgICB9O1xuICAgIGNhc2UgMjogcmV0dXJuIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGF0LCBhLCBiKTtcbiAgICB9O1xuICAgIGNhc2UgMzogcmV0dXJuIGZ1bmN0aW9uIChhLCBiLCBjKSB7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGF0LCBhLCBiLCBjKTtcbiAgICB9O1xuICB9XG4gIHJldHVybiBmdW5jdGlvbiAoLyogLi4uYXJncyAqLykge1xuICAgIHJldHVybiBmbi5hcHBseSh0aGF0LCBhcmd1bWVudHMpO1xuICB9O1xufTtcbiIsIi8vIDcuMi4xIFJlcXVpcmVPYmplY3RDb2VyY2libGUoYXJndW1lbnQpXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChpdCkge1xuICBpZiAoaXQgPT0gdW5kZWZpbmVkKSB0aHJvdyBUeXBlRXJyb3IoXCJDYW4ndCBjYWxsIG1ldGhvZCBvbiAgXCIgKyBpdCk7XG4gIHJldHVybiBpdDtcbn07XG4iLCIvLyBUaGFuaydzIElFOCBmb3IgaGlzIGZ1bm55IGRlZmluZVByb3BlcnR5XG5tb2R1bGUuZXhwb3J0cyA9ICFyZXF1aXJlKCcuL19mYWlscycpKGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh7fSwgJ2EnLCB7IGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gNzsgfSB9KS5hICE9IDc7XG59KTtcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vX2lzLW9iamVjdCcpO1xudmFyIGRvY3VtZW50ID0gcmVxdWlyZSgnLi9fZ2xvYmFsJykuZG9jdW1lbnQ7XG4vLyB0eXBlb2YgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCBpcyAnb2JqZWN0JyBpbiBvbGQgSUVcbnZhciBpcyA9IGlzT2JqZWN0KGRvY3VtZW50KSAmJiBpc09iamVjdChkb2N1bWVudC5jcmVhdGVFbGVtZW50KTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGl0KSB7XG4gIHJldHVybiBpcyA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoaXQpIDoge307XG59O1xuIiwiLy8gSUUgOC0gZG9uJ3QgZW51bSBidWcga2V5c1xubW9kdWxlLmV4cG9ydHMgPSAoXG4gICdjb25zdHJ1Y3RvcixoYXNPd25Qcm9wZXJ0eSxpc1Byb3RvdHlwZU9mLHByb3BlcnR5SXNFbnVtZXJhYmxlLHRvTG9jYWxlU3RyaW5nLHRvU3RyaW5nLHZhbHVlT2YnXG4pLnNwbGl0KCcsJyk7XG4iLCIvLyBhbGwgZW51bWVyYWJsZSBvYmplY3Qga2V5cywgaW5jbHVkZXMgc3ltYm9sc1xudmFyIGdldEtleXMgPSByZXF1aXJlKCcuL19vYmplY3Qta2V5cycpO1xudmFyIGdPUFMgPSByZXF1aXJlKCcuL19vYmplY3QtZ29wcycpO1xudmFyIHBJRSA9IHJlcXVpcmUoJy4vX29iamVjdC1waWUnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGl0KSB7XG4gIHZhciByZXN1bHQgPSBnZXRLZXlzKGl0KTtcbiAgdmFyIGdldFN5bWJvbHMgPSBnT1BTLmY7XG4gIGlmIChnZXRTeW1ib2xzKSB7XG4gICAgdmFyIHN5bWJvbHMgPSBnZXRTeW1ib2xzKGl0KTtcbiAgICB2YXIgaXNFbnVtID0gcElFLmY7XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBrZXk7XG4gICAgd2hpbGUgKHN5bWJvbHMubGVuZ3RoID4gaSkgaWYgKGlzRW51bS5jYWxsKGl0LCBrZXkgPSBzeW1ib2xzW2krK10pKSByZXN1bHQucHVzaChrZXkpO1xuICB9IHJldHVybiByZXN1bHQ7XG59O1xuIiwidmFyIGdsb2JhbCA9IHJlcXVpcmUoJy4vX2dsb2JhbCcpO1xudmFyIGNvcmUgPSByZXF1aXJlKCcuL19jb3JlJyk7XG52YXIgY3R4ID0gcmVxdWlyZSgnLi9fY3R4Jyk7XG52YXIgaGlkZSA9IHJlcXVpcmUoJy4vX2hpZGUnKTtcbnZhciBoYXMgPSByZXF1aXJlKCcuL19oYXMnKTtcbnZhciBQUk9UT1RZUEUgPSAncHJvdG90eXBlJztcblxudmFyICRleHBvcnQgPSBmdW5jdGlvbiAodHlwZSwgbmFtZSwgc291cmNlKSB7XG4gIHZhciBJU19GT1JDRUQgPSB0eXBlICYgJGV4cG9ydC5GO1xuICB2YXIgSVNfR0xPQkFMID0gdHlwZSAmICRleHBvcnQuRztcbiAgdmFyIElTX1NUQVRJQyA9IHR5cGUgJiAkZXhwb3J0LlM7XG4gIHZhciBJU19QUk9UTyA9IHR5cGUgJiAkZXhwb3J0LlA7XG4gIHZhciBJU19CSU5EID0gdHlwZSAmICRleHBvcnQuQjtcbiAgdmFyIElTX1dSQVAgPSB0eXBlICYgJGV4cG9ydC5XO1xuICB2YXIgZXhwb3J0cyA9IElTX0dMT0JBTCA/IGNvcmUgOiBjb3JlW25hbWVdIHx8IChjb3JlW25hbWVdID0ge30pO1xuICB2YXIgZXhwUHJvdG8gPSBleHBvcnRzW1BST1RPVFlQRV07XG4gIHZhciB0YXJnZXQgPSBJU19HTE9CQUwgPyBnbG9iYWwgOiBJU19TVEFUSUMgPyBnbG9iYWxbbmFtZV0gOiAoZ2xvYmFsW25hbWVdIHx8IHt9KVtQUk9UT1RZUEVdO1xuICB2YXIga2V5LCBvd24sIG91dDtcbiAgaWYgKElTX0dMT0JBTCkgc291cmNlID0gbmFtZTtcbiAgZm9yIChrZXkgaW4gc291cmNlKSB7XG4gICAgLy8gY29udGFpbnMgaW4gbmF0aXZlXG4gICAgb3duID0gIUlTX0ZPUkNFRCAmJiB0YXJnZXQgJiYgdGFyZ2V0W2tleV0gIT09IHVuZGVmaW5lZDtcbiAgICBpZiAob3duICYmIGhhcyhleHBvcnRzLCBrZXkpKSBjb250aW51ZTtcbiAgICAvLyBleHBvcnQgbmF0aXZlIG9yIHBhc3NlZFxuICAgIG91dCA9IG93biA/IHRhcmdldFtrZXldIDogc291cmNlW2tleV07XG4gICAgLy8gcHJldmVudCBnbG9iYWwgcG9sbHV0aW9uIGZvciBuYW1lc3BhY2VzXG4gICAgZXhwb3J0c1trZXldID0gSVNfR0xPQkFMICYmIHR5cGVvZiB0YXJnZXRba2V5XSAhPSAnZnVuY3Rpb24nID8gc291cmNlW2tleV1cbiAgICAvLyBiaW5kIHRpbWVycyB0byBnbG9iYWwgZm9yIGNhbGwgZnJvbSBleHBvcnQgY29udGV4dFxuICAgIDogSVNfQklORCAmJiBvd24gPyBjdHgob3V0LCBnbG9iYWwpXG4gICAgLy8gd3JhcCBnbG9iYWwgY29uc3RydWN0b3JzIGZvciBwcmV2ZW50IGNoYW5nZSB0aGVtIGluIGxpYnJhcnlcbiAgICA6IElTX1dSQVAgJiYgdGFyZ2V0W2tleV0gPT0gb3V0ID8gKGZ1bmN0aW9uIChDKSB7XG4gICAgICB2YXIgRiA9IGZ1bmN0aW9uIChhLCBiLCBjKSB7XG4gICAgICAgIGlmICh0aGlzIGluc3RhbmNlb2YgQykge1xuICAgICAgICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FzZSAwOiByZXR1cm4gbmV3IEMoKTtcbiAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIG5ldyBDKGEpO1xuICAgICAgICAgICAgY2FzZSAyOiByZXR1cm4gbmV3IEMoYSwgYik7XG4gICAgICAgICAgfSByZXR1cm4gbmV3IEMoYSwgYiwgYyk7XG4gICAgICAgIH0gcmV0dXJuIEMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgICBGW1BST1RPVFlQRV0gPSBDW1BST1RPVFlQRV07XG4gICAgICByZXR1cm4gRjtcbiAgICAvLyBtYWtlIHN0YXRpYyB2ZXJzaW9ucyBmb3IgcHJvdG90eXBlIG1ldGhvZHNcbiAgICB9KShvdXQpIDogSVNfUFJPVE8gJiYgdHlwZW9mIG91dCA9PSAnZnVuY3Rpb24nID8gY3R4KEZ1bmN0aW9uLmNhbGwsIG91dCkgOiBvdXQ7XG4gICAgLy8gZXhwb3J0IHByb3RvIG1ldGhvZHMgdG8gY29yZS4lQ09OU1RSVUNUT1IlLm1ldGhvZHMuJU5BTUUlXG4gICAgaWYgKElTX1BST1RPKSB7XG4gICAgICAoZXhwb3J0cy52aXJ0dWFsIHx8IChleHBvcnRzLnZpcnR1YWwgPSB7fSkpW2tleV0gPSBvdXQ7XG4gICAgICAvLyBleHBvcnQgcHJvdG8gbWV0aG9kcyB0byBjb3JlLiVDT05TVFJVQ1RPUiUucHJvdG90eXBlLiVOQU1FJVxuICAgICAgaWYgKHR5cGUgJiAkZXhwb3J0LlIgJiYgZXhwUHJvdG8gJiYgIWV4cFByb3RvW2tleV0pIGhpZGUoZXhwUHJvdG8sIGtleSwgb3V0KTtcbiAgICB9XG4gIH1cbn07XG4vLyB0eXBlIGJpdG1hcFxuJGV4cG9ydC5GID0gMTsgICAvLyBmb3JjZWRcbiRleHBvcnQuRyA9IDI7ICAgLy8gZ2xvYmFsXG4kZXhwb3J0LlMgPSA0OyAgIC8vIHN0YXRpY1xuJGV4cG9ydC5QID0gODsgICAvLyBwcm90b1xuJGV4cG9ydC5CID0gMTY7ICAvLyBiaW5kXG4kZXhwb3J0LlcgPSAzMjsgIC8vIHdyYXBcbiRleHBvcnQuVSA9IDY0OyAgLy8gc2FmZVxuJGV4cG9ydC5SID0gMTI4OyAvLyByZWFsIHByb3RvIG1ldGhvZCBmb3IgYGxpYnJhcnlgXG5tb2R1bGUuZXhwb3J0cyA9ICRleHBvcnQ7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChleGVjKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuICEhZXhlYygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn07XG4iLCJ2YXIgY3R4ID0gcmVxdWlyZSgnLi9fY3R4Jyk7XG52YXIgY2FsbCA9IHJlcXVpcmUoJy4vX2l0ZXItY2FsbCcpO1xudmFyIGlzQXJyYXlJdGVyID0gcmVxdWlyZSgnLi9faXMtYXJyYXktaXRlcicpO1xudmFyIGFuT2JqZWN0ID0gcmVxdWlyZSgnLi9fYW4tb2JqZWN0Jyk7XG52YXIgdG9MZW5ndGggPSByZXF1aXJlKCcuL190by1sZW5ndGgnKTtcbnZhciBnZXRJdGVyRm4gPSByZXF1aXJlKCcuL2NvcmUuZ2V0LWl0ZXJhdG9yLW1ldGhvZCcpO1xudmFyIEJSRUFLID0ge307XG52YXIgUkVUVVJOID0ge307XG52YXIgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGl0ZXJhYmxlLCBlbnRyaWVzLCBmbiwgdGhhdCwgSVRFUkFUT1IpIHtcbiAgdmFyIGl0ZXJGbiA9IElURVJBVE9SID8gZnVuY3Rpb24gKCkgeyByZXR1cm4gaXRlcmFibGU7IH0gOiBnZXRJdGVyRm4oaXRlcmFibGUpO1xuICB2YXIgZiA9IGN0eChmbiwgdGhhdCwgZW50cmllcyA/IDIgOiAxKTtcbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIGxlbmd0aCwgc3RlcCwgaXRlcmF0b3IsIHJlc3VsdDtcbiAgaWYgKHR5cGVvZiBpdGVyRm4gIT0gJ2Z1bmN0aW9uJykgdGhyb3cgVHlwZUVycm9yKGl0ZXJhYmxlICsgJyBpcyBub3QgaXRlcmFibGUhJyk7XG4gIC8vIGZhc3QgY2FzZSBmb3IgYXJyYXlzIHdpdGggZGVmYXVsdCBpdGVyYXRvclxuICBpZiAoaXNBcnJheUl0ZXIoaXRlckZuKSkgZm9yIChsZW5ndGggPSB0b0xlbmd0aChpdGVyYWJsZS5sZW5ndGgpOyBsZW5ndGggPiBpbmRleDsgaW5kZXgrKykge1xuICAgIHJlc3VsdCA9IGVudHJpZXMgPyBmKGFuT2JqZWN0KHN0ZXAgPSBpdGVyYWJsZVtpbmRleF0pWzBdLCBzdGVwWzFdKSA6IGYoaXRlcmFibGVbaW5kZXhdKTtcbiAgICBpZiAocmVzdWx0ID09PSBCUkVBSyB8fCByZXN1bHQgPT09IFJFVFVSTikgcmV0dXJuIHJlc3VsdDtcbiAgfSBlbHNlIGZvciAoaXRlcmF0b3IgPSBpdGVyRm4uY2FsbChpdGVyYWJsZSk7ICEoc3RlcCA9IGl0ZXJhdG9yLm5leHQoKSkuZG9uZTspIHtcbiAgICByZXN1bHQgPSBjYWxsKGl0ZXJhdG9yLCBmLCBzdGVwLnZhbHVlLCBlbnRyaWVzKTtcbiAgICBpZiAocmVzdWx0ID09PSBCUkVBSyB8fCByZXN1bHQgPT09IFJFVFVSTikgcmV0dXJuIHJlc3VsdDtcbiAgfVxufTtcbmV4cG9ydHMuQlJFQUsgPSBCUkVBSztcbmV4cG9ydHMuUkVUVVJOID0gUkVUVVJOO1xuIiwiLy8gaHR0cHM6Ly9naXRodWIuY29tL3psb2lyb2NrL2NvcmUtanMvaXNzdWVzLzg2I2lzc3VlY29tbWVudC0xMTU3NTkwMjhcbnZhciBnbG9iYWwgPSBtb2R1bGUuZXhwb3J0cyA9IHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lk1hdGggPT0gTWF0aFxuICA/IHdpbmRvdyA6IHR5cGVvZiBzZWxmICE9ICd1bmRlZmluZWQnICYmIHNlbGYuTWF0aCA9PSBNYXRoID8gc2VsZlxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmV3LWZ1bmNcbiAgOiBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuaWYgKHR5cGVvZiBfX2cgPT0gJ251bWJlcicpIF9fZyA9IGdsb2JhbDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuIiwidmFyIGhhc093blByb3BlcnR5ID0ge30uaGFzT3duUHJvcGVydHk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChpdCwga2V5KSB7XG4gIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKGl0LCBrZXkpO1xufTtcbiIsInZhciBkUCA9IHJlcXVpcmUoJy4vX29iamVjdC1kcCcpO1xudmFyIGNyZWF0ZURlc2MgPSByZXF1aXJlKCcuL19wcm9wZXJ0eS1kZXNjJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vX2Rlc2NyaXB0b3JzJykgPyBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gIHJldHVybiBkUC5mKG9iamVjdCwga2V5LCBjcmVhdGVEZXNjKDEsIHZhbHVlKSk7XG59IDogZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICBvYmplY3Rba2V5XSA9IHZhbHVlO1xuICByZXR1cm4gb2JqZWN0O1xufTtcbiIsInZhciBkb2N1bWVudCA9IHJlcXVpcmUoJy4vX2dsb2JhbCcpLmRvY3VtZW50O1xubW9kdWxlLmV4cG9ydHMgPSBkb2N1bWVudCAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4iLCJtb2R1bGUuZXhwb3J0cyA9ICFyZXF1aXJlKCcuL19kZXNjcmlwdG9ycycpICYmICFyZXF1aXJlKCcuL19mYWlscycpKGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyZXF1aXJlKCcuL19kb20tY3JlYXRlJykoJ2RpdicpLCAnYScsIHsgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiA3OyB9IH0pLmEgIT0gNztcbn0pO1xuIiwiLy8gZmFsbGJhY2sgZm9yIG5vbi1hcnJheS1saWtlIEVTMyBhbmQgbm9uLWVudW1lcmFibGUgb2xkIFY4IHN0cmluZ3NcbnZhciBjb2YgPSByZXF1aXJlKCcuL19jb2YnKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wcm90b3R5cGUtYnVpbHRpbnNcbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0KCd6JykucHJvcGVydHlJc0VudW1lcmFibGUoMCkgPyBPYmplY3QgOiBmdW5jdGlvbiAoaXQpIHtcbiAgcmV0dXJuIGNvZihpdCkgPT0gJ1N0cmluZycgPyBpdC5zcGxpdCgnJykgOiBPYmplY3QoaXQpO1xufTtcbiIsIi8vIGNoZWNrIG9uIGRlZmF1bHQgQXJyYXkgaXRlcmF0b3JcbnZhciBJdGVyYXRvcnMgPSByZXF1aXJlKCcuL19pdGVyYXRvcnMnKTtcbnZhciBJVEVSQVRPUiA9IHJlcXVpcmUoJy4vX3drcycpKCdpdGVyYXRvcicpO1xudmFyIEFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGU7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGl0KSB7XG4gIHJldHVybiBpdCAhPT0gdW5kZWZpbmVkICYmIChJdGVyYXRvcnMuQXJyYXkgPT09IGl0IHx8IEFycmF5UHJvdG9bSVRFUkFUT1JdID09PSBpdCk7XG59O1xuIiwiLy8gNy4yLjIgSXNBcnJheShhcmd1bWVudClcbnZhciBjb2YgPSByZXF1aXJlKCcuL19jb2YnKTtcbm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiBpc0FycmF5KGFyZykge1xuICByZXR1cm4gY29mKGFyZykgPT0gJ0FycmF5Jztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChpdCkge1xuICByZXR1cm4gdHlwZW9mIGl0ID09PSAnb2JqZWN0JyA/IGl0ICE9PSBudWxsIDogdHlwZW9mIGl0ID09PSAnZnVuY3Rpb24nO1xufTtcbiIsIi8vIGNhbGwgc29tZXRoaW5nIG9uIGl0ZXJhdG9yIHN0ZXAgd2l0aCBzYWZlIGNsb3Npbmcgb24gZXJyb3JcbnZhciBhbk9iamVjdCA9IHJlcXVpcmUoJy4vX2FuLW9iamVjdCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaXRlcmF0b3IsIGZuLCB2YWx1ZSwgZW50cmllcykge1xuICB0cnkge1xuICAgIHJldHVybiBlbnRyaWVzID8gZm4oYW5PYmplY3QodmFsdWUpWzBdLCB2YWx1ZVsxXSkgOiBmbih2YWx1ZSk7XG4gIC8vIDcuNC42IEl0ZXJhdG9yQ2xvc2UoaXRlcmF0b3IsIGNvbXBsZXRpb24pXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB2YXIgcmV0ID0gaXRlcmF0b3JbJ3JldHVybiddO1xuICAgIGlmIChyZXQgIT09IHVuZGVmaW5lZCkgYW5PYmplY3QocmV0LmNhbGwoaXRlcmF0b3IpKTtcbiAgICB0aHJvdyBlO1xuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGNyZWF0ZSA9IHJlcXVpcmUoJy4vX29iamVjdC1jcmVhdGUnKTtcbnZhciBkZXNjcmlwdG9yID0gcmVxdWlyZSgnLi9fcHJvcGVydHktZGVzYycpO1xudmFyIHNldFRvU3RyaW5nVGFnID0gcmVxdWlyZSgnLi9fc2V0LXRvLXN0cmluZy10YWcnKTtcbnZhciBJdGVyYXRvclByb3RvdHlwZSA9IHt9O1xuXG4vLyAyNS4xLjIuMS4xICVJdGVyYXRvclByb3RvdHlwZSVbQEBpdGVyYXRvcl0oKVxucmVxdWlyZSgnLi9faGlkZScpKEl0ZXJhdG9yUHJvdG90eXBlLCByZXF1aXJlKCcuL193a3MnKSgnaXRlcmF0b3InKSwgZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBOQU1FLCBuZXh0KSB7XG4gIENvbnN0cnVjdG9yLnByb3RvdHlwZSA9IGNyZWF0ZShJdGVyYXRvclByb3RvdHlwZSwgeyBuZXh0OiBkZXNjcmlwdG9yKDEsIG5leHQpIH0pO1xuICBzZXRUb1N0cmluZ1RhZyhDb25zdHJ1Y3RvciwgTkFNRSArICcgSXRlcmF0b3InKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG52YXIgTElCUkFSWSA9IHJlcXVpcmUoJy4vX2xpYnJhcnknKTtcbnZhciAkZXhwb3J0ID0gcmVxdWlyZSgnLi9fZXhwb3J0Jyk7XG52YXIgcmVkZWZpbmUgPSByZXF1aXJlKCcuL19yZWRlZmluZScpO1xudmFyIGhpZGUgPSByZXF1aXJlKCcuL19oaWRlJyk7XG52YXIgSXRlcmF0b3JzID0gcmVxdWlyZSgnLi9faXRlcmF0b3JzJyk7XG52YXIgJGl0ZXJDcmVhdGUgPSByZXF1aXJlKCcuL19pdGVyLWNyZWF0ZScpO1xudmFyIHNldFRvU3RyaW5nVGFnID0gcmVxdWlyZSgnLi9fc2V0LXRvLXN0cmluZy10YWcnKTtcbnZhciBnZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoJy4vX29iamVjdC1ncG8nKTtcbnZhciBJVEVSQVRPUiA9IHJlcXVpcmUoJy4vX3drcycpKCdpdGVyYXRvcicpO1xudmFyIEJVR0dZID0gIShbXS5rZXlzICYmICduZXh0JyBpbiBbXS5rZXlzKCkpOyAvLyBTYWZhcmkgaGFzIGJ1Z2d5IGl0ZXJhdG9ycyB3L28gYG5leHRgXG52YXIgRkZfSVRFUkFUT1IgPSAnQEBpdGVyYXRvcic7XG52YXIgS0VZUyA9ICdrZXlzJztcbnZhciBWQUxVRVMgPSAndmFsdWVzJztcblxudmFyIHJldHVyblRoaXMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChCYXNlLCBOQU1FLCBDb25zdHJ1Y3RvciwgbmV4dCwgREVGQVVMVCwgSVNfU0VULCBGT1JDRUQpIHtcbiAgJGl0ZXJDcmVhdGUoQ29uc3RydWN0b3IsIE5BTUUsIG5leHQpO1xuICB2YXIgZ2V0TWV0aG9kID0gZnVuY3Rpb24gKGtpbmQpIHtcbiAgICBpZiAoIUJVR0dZICYmIGtpbmQgaW4gcHJvdG8pIHJldHVybiBwcm90b1traW5kXTtcbiAgICBzd2l0Y2ggKGtpbmQpIHtcbiAgICAgIGNhc2UgS0VZUzogcmV0dXJuIGZ1bmN0aW9uIGtleXMoKSB7IHJldHVybiBuZXcgQ29uc3RydWN0b3IodGhpcywga2luZCk7IH07XG4gICAgICBjYXNlIFZBTFVFUzogcmV0dXJuIGZ1bmN0aW9uIHZhbHVlcygpIHsgcmV0dXJuIG5ldyBDb25zdHJ1Y3Rvcih0aGlzLCBraW5kKTsgfTtcbiAgICB9IHJldHVybiBmdW5jdGlvbiBlbnRyaWVzKCkgeyByZXR1cm4gbmV3IENvbnN0cnVjdG9yKHRoaXMsIGtpbmQpOyB9O1xuICB9O1xuICB2YXIgVEFHID0gTkFNRSArICcgSXRlcmF0b3InO1xuICB2YXIgREVGX1ZBTFVFUyA9IERFRkFVTFQgPT0gVkFMVUVTO1xuICB2YXIgVkFMVUVTX0JVRyA9IGZhbHNlO1xuICB2YXIgcHJvdG8gPSBCYXNlLnByb3RvdHlwZTtcbiAgdmFyICRuYXRpdmUgPSBwcm90b1tJVEVSQVRPUl0gfHwgcHJvdG9bRkZfSVRFUkFUT1JdIHx8IERFRkFVTFQgJiYgcHJvdG9bREVGQVVMVF07XG4gIHZhciAkZGVmYXVsdCA9ICRuYXRpdmUgfHwgZ2V0TWV0aG9kKERFRkFVTFQpO1xuICB2YXIgJGVudHJpZXMgPSBERUZBVUxUID8gIURFRl9WQUxVRVMgPyAkZGVmYXVsdCA6IGdldE1ldGhvZCgnZW50cmllcycpIDogdW5kZWZpbmVkO1xuICB2YXIgJGFueU5hdGl2ZSA9IE5BTUUgPT0gJ0FycmF5JyA/IHByb3RvLmVudHJpZXMgfHwgJG5hdGl2ZSA6ICRuYXRpdmU7XG4gIHZhciBtZXRob2RzLCBrZXksIEl0ZXJhdG9yUHJvdG90eXBlO1xuICAvLyBGaXggbmF0aXZlXG4gIGlmICgkYW55TmF0aXZlKSB7XG4gICAgSXRlcmF0b3JQcm90b3R5cGUgPSBnZXRQcm90b3R5cGVPZigkYW55TmF0aXZlLmNhbGwobmV3IEJhc2UoKSkpO1xuICAgIGlmIChJdGVyYXRvclByb3RvdHlwZSAhPT0gT2JqZWN0LnByb3RvdHlwZSAmJiBJdGVyYXRvclByb3RvdHlwZS5uZXh0KSB7XG4gICAgICAvLyBTZXQgQEB0b1N0cmluZ1RhZyB0byBuYXRpdmUgaXRlcmF0b3JzXG4gICAgICBzZXRUb1N0cmluZ1RhZyhJdGVyYXRvclByb3RvdHlwZSwgVEFHLCB0cnVlKTtcbiAgICAgIC8vIGZpeCBmb3Igc29tZSBvbGQgZW5naW5lc1xuICAgICAgaWYgKCFMSUJSQVJZICYmIHR5cGVvZiBJdGVyYXRvclByb3RvdHlwZVtJVEVSQVRPUl0gIT0gJ2Z1bmN0aW9uJykgaGlkZShJdGVyYXRvclByb3RvdHlwZSwgSVRFUkFUT1IsIHJldHVyblRoaXMpO1xuICAgIH1cbiAgfVxuICAvLyBmaXggQXJyYXkje3ZhbHVlcywgQEBpdGVyYXRvcn0ubmFtZSBpbiBWOCAvIEZGXG4gIGlmIChERUZfVkFMVUVTICYmICRuYXRpdmUgJiYgJG5hdGl2ZS5uYW1lICE9PSBWQUxVRVMpIHtcbiAgICBWQUxVRVNfQlVHID0gdHJ1ZTtcbiAgICAkZGVmYXVsdCA9IGZ1bmN0aW9uIHZhbHVlcygpIHsgcmV0dXJuICRuYXRpdmUuY2FsbCh0aGlzKTsgfTtcbiAgfVxuICAvLyBEZWZpbmUgaXRlcmF0b3JcbiAgaWYgKCghTElCUkFSWSB8fCBGT1JDRUQpICYmIChCVUdHWSB8fCBWQUxVRVNfQlVHIHx8ICFwcm90b1tJVEVSQVRPUl0pKSB7XG4gICAgaGlkZShwcm90bywgSVRFUkFUT1IsICRkZWZhdWx0KTtcbiAgfVxuICAvLyBQbHVnIGZvciBsaWJyYXJ5XG4gIEl0ZXJhdG9yc1tOQU1FXSA9ICRkZWZhdWx0O1xuICBJdGVyYXRvcnNbVEFHXSA9IHJldHVyblRoaXM7XG4gIGlmIChERUZBVUxUKSB7XG4gICAgbWV0aG9kcyA9IHtcbiAgICAgIHZhbHVlczogREVGX1ZBTFVFUyA/ICRkZWZhdWx0IDogZ2V0TWV0aG9kKFZBTFVFUyksXG4gICAgICBrZXlzOiBJU19TRVQgPyAkZGVmYXVsdCA6IGdldE1ldGhvZChLRVlTKSxcbiAgICAgIGVudHJpZXM6ICRlbnRyaWVzXG4gICAgfTtcbiAgICBpZiAoRk9SQ0VEKSBmb3IgKGtleSBpbiBtZXRob2RzKSB7XG4gICAgICBpZiAoIShrZXkgaW4gcHJvdG8pKSByZWRlZmluZShwcm90bywga2V5LCBtZXRob2RzW2tleV0pO1xuICAgIH0gZWxzZSAkZXhwb3J0KCRleHBvcnQuUCArICRleHBvcnQuRiAqIChCVUdHWSB8fCBWQUxVRVNfQlVHKSwgTkFNRSwgbWV0aG9kcyk7XG4gIH1cbiAgcmV0dXJuIG1ldGhvZHM7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZG9uZSwgdmFsdWUpIHtcbiAgcmV0dXJuIHsgdmFsdWU6IHZhbHVlLCBkb25lOiAhIWRvbmUgfTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHt9O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB0cnVlO1xuIiwidmFyIE1FVEEgPSByZXF1aXJlKCcuL191aWQnKSgnbWV0YScpO1xudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9faXMtb2JqZWN0Jyk7XG52YXIgaGFzID0gcmVxdWlyZSgnLi9faGFzJyk7XG52YXIgc2V0RGVzYyA9IHJlcXVpcmUoJy4vX29iamVjdC1kcCcpLmY7XG52YXIgaWQgPSAwO1xudmFyIGlzRXh0ZW5zaWJsZSA9IE9iamVjdC5pc0V4dGVuc2libGUgfHwgZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdHJ1ZTtcbn07XG52YXIgRlJFRVpFID0gIXJlcXVpcmUoJy4vX2ZhaWxzJykoZnVuY3Rpb24gKCkge1xuICByZXR1cm4gaXNFeHRlbnNpYmxlKE9iamVjdC5wcmV2ZW50RXh0ZW5zaW9ucyh7fSkpO1xufSk7XG52YXIgc2V0TWV0YSA9IGZ1bmN0aW9uIChpdCkge1xuICBzZXREZXNjKGl0LCBNRVRBLCB7IHZhbHVlOiB7XG4gICAgaTogJ08nICsgKytpZCwgLy8gb2JqZWN0IElEXG4gICAgdzoge30gICAgICAgICAgLy8gd2VhayBjb2xsZWN0aW9ucyBJRHNcbiAgfSB9KTtcbn07XG52YXIgZmFzdEtleSA9IGZ1bmN0aW9uIChpdCwgY3JlYXRlKSB7XG4gIC8vIHJldHVybiBwcmltaXRpdmUgd2l0aCBwcmVmaXhcbiAgaWYgKCFpc09iamVjdChpdCkpIHJldHVybiB0eXBlb2YgaXQgPT0gJ3N5bWJvbCcgPyBpdCA6ICh0eXBlb2YgaXQgPT0gJ3N0cmluZycgPyAnUycgOiAnUCcpICsgaXQ7XG4gIGlmICghaGFzKGl0LCBNRVRBKSkge1xuICAgIC8vIGNhbid0IHNldCBtZXRhZGF0YSB0byB1bmNhdWdodCBmcm96ZW4gb2JqZWN0XG4gICAgaWYgKCFpc0V4dGVuc2libGUoaXQpKSByZXR1cm4gJ0YnO1xuICAgIC8vIG5vdCBuZWNlc3NhcnkgdG8gYWRkIG1ldGFkYXRhXG4gICAgaWYgKCFjcmVhdGUpIHJldHVybiAnRSc7XG4gICAgLy8gYWRkIG1pc3NpbmcgbWV0YWRhdGFcbiAgICBzZXRNZXRhKGl0KTtcbiAgLy8gcmV0dXJuIG9iamVjdCBJRFxuICB9IHJldHVybiBpdFtNRVRBXS5pO1xufTtcbnZhciBnZXRXZWFrID0gZnVuY3Rpb24gKGl0LCBjcmVhdGUpIHtcbiAgaWYgKCFoYXMoaXQsIE1FVEEpKSB7XG4gICAgLy8gY2FuJ3Qgc2V0IG1ldGFkYXRhIHRvIHVuY2F1Z2h0IGZyb3plbiBvYmplY3RcbiAgICBpZiAoIWlzRXh0ZW5zaWJsZShpdCkpIHJldHVybiB0cnVlO1xuICAgIC8vIG5vdCBuZWNlc3NhcnkgdG8gYWRkIG1ldGFkYXRhXG4gICAgaWYgKCFjcmVhdGUpIHJldHVybiBmYWxzZTtcbiAgICAvLyBhZGQgbWlzc2luZyBtZXRhZGF0YVxuICAgIHNldE1ldGEoaXQpO1xuICAvLyByZXR1cm4gaGFzaCB3ZWFrIGNvbGxlY3Rpb25zIElEc1xuICB9IHJldHVybiBpdFtNRVRBXS53O1xufTtcbi8vIGFkZCBtZXRhZGF0YSBvbiBmcmVlemUtZmFtaWx5IG1ldGhvZHMgY2FsbGluZ1xudmFyIG9uRnJlZXplID0gZnVuY3Rpb24gKGl0KSB7XG4gIGlmIChGUkVFWkUgJiYgbWV0YS5ORUVEICYmIGlzRXh0ZW5zaWJsZShpdCkgJiYgIWhhcyhpdCwgTUVUQSkpIHNldE1ldGEoaXQpO1xuICByZXR1cm4gaXQ7XG59O1xudmFyIG1ldGEgPSBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgS0VZOiBNRVRBLFxuICBORUVEOiBmYWxzZSxcbiAgZmFzdEtleTogZmFzdEtleSxcbiAgZ2V0V2VhazogZ2V0V2VhayxcbiAgb25GcmVlemU6IG9uRnJlZXplXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuLy8gMTkuMS4yLjEgT2JqZWN0LmFzc2lnbih0YXJnZXQsIHNvdXJjZSwgLi4uKVxudmFyIGdldEtleXMgPSByZXF1aXJlKCcuL19vYmplY3Qta2V5cycpO1xudmFyIGdPUFMgPSByZXF1aXJlKCcuL19vYmplY3QtZ29wcycpO1xudmFyIHBJRSA9IHJlcXVpcmUoJy4vX29iamVjdC1waWUnKTtcbnZhciB0b09iamVjdCA9IHJlcXVpcmUoJy4vX3RvLW9iamVjdCcpO1xudmFyIElPYmplY3QgPSByZXF1aXJlKCcuL19pb2JqZWN0Jyk7XG52YXIgJGFzc2lnbiA9IE9iamVjdC5hc3NpZ247XG5cbi8vIHNob3VsZCB3b3JrIHdpdGggc3ltYm9scyBhbmQgc2hvdWxkIGhhdmUgZGV0ZXJtaW5pc3RpYyBwcm9wZXJ0eSBvcmRlciAoVjggYnVnKVxubW9kdWxlLmV4cG9ydHMgPSAhJGFzc2lnbiB8fCByZXF1aXJlKCcuL19mYWlscycpKGZ1bmN0aW9uICgpIHtcbiAgdmFyIEEgPSB7fTtcbiAgdmFyIEIgPSB7fTtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG4gIHZhciBTID0gU3ltYm9sKCk7XG4gIHZhciBLID0gJ2FiY2RlZmdoaWprbG1ub3BxcnN0JztcbiAgQVtTXSA9IDc7XG4gIEsuc3BsaXQoJycpLmZvckVhY2goZnVuY3Rpb24gKGspIHsgQltrXSA9IGs7IH0pO1xuICByZXR1cm4gJGFzc2lnbih7fSwgQSlbU10gIT0gNyB8fCBPYmplY3Qua2V5cygkYXNzaWduKHt9LCBCKSkuam9pbignJykgIT0gSztcbn0pID8gZnVuY3Rpb24gYXNzaWduKHRhcmdldCwgc291cmNlKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgdmFyIFQgPSB0b09iamVjdCh0YXJnZXQpO1xuICB2YXIgYUxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gIHZhciBpbmRleCA9IDE7XG4gIHZhciBnZXRTeW1ib2xzID0gZ09QUy5mO1xuICB2YXIgaXNFbnVtID0gcElFLmY7XG4gIHdoaWxlIChhTGVuID4gaW5kZXgpIHtcbiAgICB2YXIgUyA9IElPYmplY3QoYXJndW1lbnRzW2luZGV4KytdKTtcbiAgICB2YXIga2V5cyA9IGdldFN5bWJvbHMgPyBnZXRLZXlzKFMpLmNvbmNhdChnZXRTeW1ib2xzKFMpKSA6IGdldEtleXMoUyk7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciBqID0gMDtcbiAgICB2YXIga2V5O1xuICAgIHdoaWxlIChsZW5ndGggPiBqKSBpZiAoaXNFbnVtLmNhbGwoUywga2V5ID0ga2V5c1tqKytdKSkgVFtrZXldID0gU1trZXldO1xuICB9IHJldHVybiBUO1xufSA6ICRhc3NpZ247XG4iLCIvLyAxOS4xLjIuMiAvIDE1LjIuMy41IE9iamVjdC5jcmVhdGUoTyBbLCBQcm9wZXJ0aWVzXSlcbnZhciBhbk9iamVjdCA9IHJlcXVpcmUoJy4vX2FuLW9iamVjdCcpO1xudmFyIGRQcyA9IHJlcXVpcmUoJy4vX29iamVjdC1kcHMnKTtcbnZhciBlbnVtQnVnS2V5cyA9IHJlcXVpcmUoJy4vX2VudW0tYnVnLWtleXMnKTtcbnZhciBJRV9QUk9UTyA9IHJlcXVpcmUoJy4vX3NoYXJlZC1rZXknKSgnSUVfUFJPVE8nKTtcbnZhciBFbXB0eSA9IGZ1bmN0aW9uICgpIHsgLyogZW1wdHkgKi8gfTtcbnZhciBQUk9UT1RZUEUgPSAncHJvdG90eXBlJztcblxuLy8gQ3JlYXRlIG9iamVjdCB3aXRoIGZha2UgYG51bGxgIHByb3RvdHlwZTogdXNlIGlmcmFtZSBPYmplY3Qgd2l0aCBjbGVhcmVkIHByb3RvdHlwZVxudmFyIGNyZWF0ZURpY3QgPSBmdW5jdGlvbiAoKSB7XG4gIC8vIFRocmFzaCwgd2FzdGUgYW5kIHNvZG9teTogSUUgR0MgYnVnXG4gIHZhciBpZnJhbWUgPSByZXF1aXJlKCcuL19kb20tY3JlYXRlJykoJ2lmcmFtZScpO1xuICB2YXIgaSA9IGVudW1CdWdLZXlzLmxlbmd0aDtcbiAgdmFyIGx0ID0gJzwnO1xuICB2YXIgZ3QgPSAnPic7XG4gIHZhciBpZnJhbWVEb2N1bWVudDtcbiAgaWZyYW1lLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIHJlcXVpcmUoJy4vX2h0bWwnKS5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICBpZnJhbWUuc3JjID0gJ2phdmFzY3JpcHQ6JzsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zY3JpcHQtdXJsXG4gIC8vIGNyZWF0ZURpY3QgPSBpZnJhbWUuY29udGVudFdpbmRvdy5PYmplY3Q7XG4gIC8vIGh0bWwucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcbiAgaWZyYW1lRG9jdW1lbnQgPSBpZnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudDtcbiAgaWZyYW1lRG9jdW1lbnQub3BlbigpO1xuICBpZnJhbWVEb2N1bWVudC53cml0ZShsdCArICdzY3JpcHQnICsgZ3QgKyAnZG9jdW1lbnQuRj1PYmplY3QnICsgbHQgKyAnL3NjcmlwdCcgKyBndCk7XG4gIGlmcmFtZURvY3VtZW50LmNsb3NlKCk7XG4gIGNyZWF0ZURpY3QgPSBpZnJhbWVEb2N1bWVudC5GO1xuICB3aGlsZSAoaS0tKSBkZWxldGUgY3JlYXRlRGljdFtQUk9UT1RZUEVdW2VudW1CdWdLZXlzW2ldXTtcbiAgcmV0dXJuIGNyZWF0ZURpY3QoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiBjcmVhdGUoTywgUHJvcGVydGllcykge1xuICB2YXIgcmVzdWx0O1xuICBpZiAoTyAhPT0gbnVsbCkge1xuICAgIEVtcHR5W1BST1RPVFlQRV0gPSBhbk9iamVjdChPKTtcbiAgICByZXN1bHQgPSBuZXcgRW1wdHkoKTtcbiAgICBFbXB0eVtQUk9UT1RZUEVdID0gbnVsbDtcbiAgICAvLyBhZGQgXCJfX3Byb3RvX19cIiBmb3IgT2JqZWN0LmdldFByb3RvdHlwZU9mIHBvbHlmaWxsXG4gICAgcmVzdWx0W0lFX1BST1RPXSA9IE87XG4gIH0gZWxzZSByZXN1bHQgPSBjcmVhdGVEaWN0KCk7XG4gIHJldHVybiBQcm9wZXJ0aWVzID09PSB1bmRlZmluZWQgPyByZXN1bHQgOiBkUHMocmVzdWx0LCBQcm9wZXJ0aWVzKTtcbn07XG4iLCJ2YXIgYW5PYmplY3QgPSByZXF1aXJlKCcuL19hbi1vYmplY3QnKTtcbnZhciBJRThfRE9NX0RFRklORSA9IHJlcXVpcmUoJy4vX2llOC1kb20tZGVmaW5lJyk7XG52YXIgdG9QcmltaXRpdmUgPSByZXF1aXJlKCcuL190by1wcmltaXRpdmUnKTtcbnZhciBkUCA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eTtcblxuZXhwb3J0cy5mID0gcmVxdWlyZSgnLi9fZGVzY3JpcHRvcnMnKSA/IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSA6IGZ1bmN0aW9uIGRlZmluZVByb3BlcnR5KE8sIFAsIEF0dHJpYnV0ZXMpIHtcbiAgYW5PYmplY3QoTyk7XG4gIFAgPSB0b1ByaW1pdGl2ZShQLCB0cnVlKTtcbiAgYW5PYmplY3QoQXR0cmlidXRlcyk7XG4gIGlmIChJRThfRE9NX0RFRklORSkgdHJ5IHtcbiAgICByZXR1cm4gZFAoTywgUCwgQXR0cmlidXRlcyk7XG4gIH0gY2F0Y2ggKGUpIHsgLyogZW1wdHkgKi8gfVxuICBpZiAoJ2dldCcgaW4gQXR0cmlidXRlcyB8fCAnc2V0JyBpbiBBdHRyaWJ1dGVzKSB0aHJvdyBUeXBlRXJyb3IoJ0FjY2Vzc29ycyBub3Qgc3VwcG9ydGVkIScpO1xuICBpZiAoJ3ZhbHVlJyBpbiBBdHRyaWJ1dGVzKSBPW1BdID0gQXR0cmlidXRlcy52YWx1ZTtcbiAgcmV0dXJuIE87XG59O1xuIiwidmFyIGRQID0gcmVxdWlyZSgnLi9fb2JqZWN0LWRwJyk7XG52YXIgYW5PYmplY3QgPSByZXF1aXJlKCcuL19hbi1vYmplY3QnKTtcbnZhciBnZXRLZXlzID0gcmVxdWlyZSgnLi9fb2JqZWN0LWtleXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL19kZXNjcmlwdG9ycycpID8gT2JqZWN0LmRlZmluZVByb3BlcnRpZXMgOiBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKE8sIFByb3BlcnRpZXMpIHtcbiAgYW5PYmplY3QoTyk7XG4gIHZhciBrZXlzID0gZ2V0S2V5cyhQcm9wZXJ0aWVzKTtcbiAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICB2YXIgaSA9IDA7XG4gIHZhciBQO1xuICB3aGlsZSAobGVuZ3RoID4gaSkgZFAuZihPLCBQID0ga2V5c1tpKytdLCBQcm9wZXJ0aWVzW1BdKTtcbiAgcmV0dXJuIE87XG59O1xuIiwidmFyIHBJRSA9IHJlcXVpcmUoJy4vX29iamVjdC1waWUnKTtcbnZhciBjcmVhdGVEZXNjID0gcmVxdWlyZSgnLi9fcHJvcGVydHktZGVzYycpO1xudmFyIHRvSU9iamVjdCA9IHJlcXVpcmUoJy4vX3RvLWlvYmplY3QnKTtcbnZhciB0b1ByaW1pdGl2ZSA9IHJlcXVpcmUoJy4vX3RvLXByaW1pdGl2ZScpO1xudmFyIGhhcyA9IHJlcXVpcmUoJy4vX2hhcycpO1xudmFyIElFOF9ET01fREVGSU5FID0gcmVxdWlyZSgnLi9faWU4LWRvbS1kZWZpbmUnKTtcbnZhciBnT1BEID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcjtcblxuZXhwb3J0cy5mID0gcmVxdWlyZSgnLi9fZGVzY3JpcHRvcnMnKSA/IGdPUEQgOiBmdW5jdGlvbiBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoTywgUCkge1xuICBPID0gdG9JT2JqZWN0KE8pO1xuICBQID0gdG9QcmltaXRpdmUoUCwgdHJ1ZSk7XG4gIGlmIChJRThfRE9NX0RFRklORSkgdHJ5IHtcbiAgICByZXR1cm4gZ09QRChPLCBQKTtcbiAgfSBjYXRjaCAoZSkgeyAvKiBlbXB0eSAqLyB9XG4gIGlmIChoYXMoTywgUCkpIHJldHVybiBjcmVhdGVEZXNjKCFwSUUuZi5jYWxsKE8sIFApLCBPW1BdKTtcbn07XG4iLCIvLyBmYWxsYmFjayBmb3IgSUUxMSBidWdneSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyB3aXRoIGlmcmFtZSBhbmQgd2luZG93XG52YXIgdG9JT2JqZWN0ID0gcmVxdWlyZSgnLi9fdG8taW9iamVjdCcpO1xudmFyIGdPUE4gPSByZXF1aXJlKCcuL19vYmplY3QtZ29wbicpLmY7XG52YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZztcblxudmFyIHdpbmRvd05hbWVzID0gdHlwZW9mIHdpbmRvdyA9PSAnb2JqZWN0JyAmJiB3aW5kb3cgJiYgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXNcbiAgPyBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh3aW5kb3cpIDogW107XG5cbnZhciBnZXRXaW5kb3dOYW1lcyA9IGZ1bmN0aW9uIChpdCkge1xuICB0cnkge1xuICAgIHJldHVybiBnT1BOKGl0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiB3aW5kb3dOYW1lcy5zbGljZSgpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5mID0gZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlOYW1lcyhpdCkge1xuICByZXR1cm4gd2luZG93TmFtZXMgJiYgdG9TdHJpbmcuY2FsbChpdCkgPT0gJ1tvYmplY3QgV2luZG93XScgPyBnZXRXaW5kb3dOYW1lcyhpdCkgOiBnT1BOKHRvSU9iamVjdChpdCkpO1xufTtcbiIsIi8vIDE5LjEuMi43IC8gMTUuMi4zLjQgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoTylcbnZhciAka2V5cyA9IHJlcXVpcmUoJy4vX29iamVjdC1rZXlzLWludGVybmFsJyk7XG52YXIgaGlkZGVuS2V5cyA9IHJlcXVpcmUoJy4vX2VudW0tYnVnLWtleXMnKS5jb25jYXQoJ2xlbmd0aCcsICdwcm90b3R5cGUnKTtcblxuZXhwb3J0cy5mID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgfHwgZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlOYW1lcyhPKSB7XG4gIHJldHVybiAka2V5cyhPLCBoaWRkZW5LZXlzKTtcbn07XG4iLCJleHBvcnRzLmYgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzO1xuIiwiLy8gMTkuMS4yLjkgLyAxNS4yLjMuMiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoTylcbnZhciBoYXMgPSByZXF1aXJlKCcuL19oYXMnKTtcbnZhciB0b09iamVjdCA9IHJlcXVpcmUoJy4vX3RvLW9iamVjdCcpO1xudmFyIElFX1BST1RPID0gcmVxdWlyZSgnLi9fc2hhcmVkLWtleScpKCdJRV9QUk9UTycpO1xudmFyIE9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxubW9kdWxlLmV4cG9ydHMgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gKE8pIHtcbiAgTyA9IHRvT2JqZWN0KE8pO1xuICBpZiAoaGFzKE8sIElFX1BST1RPKSkgcmV0dXJuIE9bSUVfUFJPVE9dO1xuICBpZiAodHlwZW9mIE8uY29uc3RydWN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBPIGluc3RhbmNlb2YgTy5jb25zdHJ1Y3Rvcikge1xuICAgIHJldHVybiBPLmNvbnN0cnVjdG9yLnByb3RvdHlwZTtcbiAgfSByZXR1cm4gTyBpbnN0YW5jZW9mIE9iamVjdCA/IE9iamVjdFByb3RvIDogbnVsbDtcbn07XG4iLCJ2YXIgaGFzID0gcmVxdWlyZSgnLi9faGFzJyk7XG52YXIgdG9JT2JqZWN0ID0gcmVxdWlyZSgnLi9fdG8taW9iamVjdCcpO1xudmFyIGFycmF5SW5kZXhPZiA9IHJlcXVpcmUoJy4vX2FycmF5LWluY2x1ZGVzJykoZmFsc2UpO1xudmFyIElFX1BST1RPID0gcmVxdWlyZSgnLi9fc2hhcmVkLWtleScpKCdJRV9QUk9UTycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWVzKSB7XG4gIHZhciBPID0gdG9JT2JqZWN0KG9iamVjdCk7XG4gIHZhciBpID0gMDtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICB2YXIga2V5O1xuICBmb3IgKGtleSBpbiBPKSBpZiAoa2V5ICE9IElFX1BST1RPKSBoYXMoTywga2V5KSAmJiByZXN1bHQucHVzaChrZXkpO1xuICAvLyBEb24ndCBlbnVtIGJ1ZyAmIGhpZGRlbiBrZXlzXG4gIHdoaWxlIChuYW1lcy5sZW5ndGggPiBpKSBpZiAoaGFzKE8sIGtleSA9IG5hbWVzW2krK10pKSB7XG4gICAgfmFycmF5SW5kZXhPZihyZXN1bHQsIGtleSkgfHwgcmVzdWx0LnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufTtcbiIsIi8vIDE5LjEuMi4xNCAvIDE1LjIuMy4xNCBPYmplY3Qua2V5cyhPKVxudmFyICRrZXlzID0gcmVxdWlyZSgnLi9fb2JqZWN0LWtleXMtaW50ZXJuYWwnKTtcbnZhciBlbnVtQnVnS2V5cyA9IHJlcXVpcmUoJy4vX2VudW0tYnVnLWtleXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiBrZXlzKE8pIHtcbiAgcmV0dXJuICRrZXlzKE8sIGVudW1CdWdLZXlzKTtcbn07XG4iLCJleHBvcnRzLmYgPSB7fS5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcbiIsIi8vIG1vc3QgT2JqZWN0IG1ldGhvZHMgYnkgRVM2IHNob3VsZCBhY2NlcHQgcHJpbWl0aXZlc1xudmFyICRleHBvcnQgPSByZXF1aXJlKCcuL19leHBvcnQnKTtcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9fY29yZScpO1xudmFyIGZhaWxzID0gcmVxdWlyZSgnLi9fZmFpbHMnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKEtFWSwgZXhlYykge1xuICB2YXIgZm4gPSAoY29yZS5PYmplY3QgfHwge30pW0tFWV0gfHwgT2JqZWN0W0tFWV07XG4gIHZhciBleHAgPSB7fTtcbiAgZXhwW0tFWV0gPSBleGVjKGZuKTtcbiAgJGV4cG9ydCgkZXhwb3J0LlMgKyAkZXhwb3J0LkYgKiBmYWlscyhmdW5jdGlvbiAoKSB7IGZuKDEpOyB9KSwgJ09iamVjdCcsIGV4cCk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYml0bWFwLCB2YWx1ZSkge1xuICByZXR1cm4ge1xuICAgIGVudW1lcmFibGU6ICEoYml0bWFwICYgMSksXG4gICAgY29uZmlndXJhYmxlOiAhKGJpdG1hcCAmIDIpLFxuICAgIHdyaXRhYmxlOiAhKGJpdG1hcCAmIDQpLFxuICAgIHZhbHVlOiB2YWx1ZVxuICB9O1xufTtcbiIsInZhciBoaWRlID0gcmVxdWlyZSgnLi9faGlkZScpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodGFyZ2V0LCBzcmMsIHNhZmUpIHtcbiAgZm9yICh2YXIga2V5IGluIHNyYykge1xuICAgIGlmIChzYWZlICYmIHRhcmdldFtrZXldKSB0YXJnZXRba2V5XSA9IHNyY1trZXldO1xuICAgIGVsc2UgaGlkZSh0YXJnZXQsIGtleSwgc3JjW2tleV0pO1xuICB9IHJldHVybiB0YXJnZXQ7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL19oaWRlJyk7XG4iLCIndXNlIHN0cmljdCc7XG4vLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL3Byb3Bvc2FsLXNldG1hcC1vZmZyb20vXG52YXIgJGV4cG9ydCA9IHJlcXVpcmUoJy4vX2V4cG9ydCcpO1xudmFyIGFGdW5jdGlvbiA9IHJlcXVpcmUoJy4vX2EtZnVuY3Rpb24nKTtcbnZhciBjdHggPSByZXF1aXJlKCcuL19jdHgnKTtcbnZhciBmb3JPZiA9IHJlcXVpcmUoJy4vX2Zvci1vZicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChDT0xMRUNUSU9OKSB7XG4gICRleHBvcnQoJGV4cG9ydC5TLCBDT0xMRUNUSU9OLCB7IGZyb206IGZ1bmN0aW9uIGZyb20oc291cmNlIC8qICwgbWFwRm4sIHRoaXNBcmcgKi8pIHtcbiAgICB2YXIgbWFwRm4gPSBhcmd1bWVudHNbMV07XG4gICAgdmFyIG1hcHBpbmcsIEEsIG4sIGNiO1xuICAgIGFGdW5jdGlvbih0aGlzKTtcbiAgICBtYXBwaW5nID0gbWFwRm4gIT09IHVuZGVmaW5lZDtcbiAgICBpZiAobWFwcGluZykgYUZ1bmN0aW9uKG1hcEZuKTtcbiAgICBpZiAoc291cmNlID09IHVuZGVmaW5lZCkgcmV0dXJuIG5ldyB0aGlzKCk7XG4gICAgQSA9IFtdO1xuICAgIGlmIChtYXBwaW5nKSB7XG4gICAgICBuID0gMDtcbiAgICAgIGNiID0gY3R4KG1hcEZuLCBhcmd1bWVudHNbMl0sIDIpO1xuICAgICAgZm9yT2Yoc291cmNlLCBmYWxzZSwgZnVuY3Rpb24gKG5leHRJdGVtKSB7XG4gICAgICAgIEEucHVzaChjYihuZXh0SXRlbSwgbisrKSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yT2Yoc291cmNlLCBmYWxzZSwgQS5wdXNoLCBBKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyB0aGlzKEEpO1xuICB9IH0pO1xufTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vcHJvcG9zYWwtc2V0bWFwLW9mZnJvbS9cbnZhciAkZXhwb3J0ID0gcmVxdWlyZSgnLi9fZXhwb3J0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKENPTExFQ1RJT04pIHtcbiAgJGV4cG9ydCgkZXhwb3J0LlMsIENPTExFQ1RJT04sIHsgb2Y6IGZ1bmN0aW9uIG9mKCkge1xuICAgIHZhciBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIHZhciBBID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgd2hpbGUgKGxlbmd0aC0tKSBBW2xlbmd0aF0gPSBhcmd1bWVudHNbbGVuZ3RoXTtcbiAgICByZXR1cm4gbmV3IHRoaXMoQSk7XG4gIH0gfSk7XG59O1xuIiwiLy8gV29ya3Mgd2l0aCBfX3Byb3RvX18gb25seS4gT2xkIHY4IGNhbid0IHdvcmsgd2l0aCBudWxsIHByb3RvIG9iamVjdHMuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9faXMtb2JqZWN0Jyk7XG52YXIgYW5PYmplY3QgPSByZXF1aXJlKCcuL19hbi1vYmplY3QnKTtcbnZhciBjaGVjayA9IGZ1bmN0aW9uIChPLCBwcm90bykge1xuICBhbk9iamVjdChPKTtcbiAgaWYgKCFpc09iamVjdChwcm90bykgJiYgcHJvdG8gIT09IG51bGwpIHRocm93IFR5cGVFcnJvcihwcm90byArIFwiOiBjYW4ndCBzZXQgYXMgcHJvdG90eXBlIVwiKTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgc2V0OiBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHwgKCdfX3Byb3RvX18nIGluIHt9ID8gLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgIGZ1bmN0aW9uICh0ZXN0LCBidWdneSwgc2V0KSB7XG4gICAgICB0cnkge1xuICAgICAgICBzZXQgPSByZXF1aXJlKCcuL19jdHgnKShGdW5jdGlvbi5jYWxsLCByZXF1aXJlKCcuL19vYmplY3QtZ29wZCcpLmYoT2JqZWN0LnByb3RvdHlwZSwgJ19fcHJvdG9fXycpLnNldCwgMik7XG4gICAgICAgIHNldCh0ZXN0LCBbXSk7XG4gICAgICAgIGJ1Z2d5ID0gISh0ZXN0IGluc3RhbmNlb2YgQXJyYXkpO1xuICAgICAgfSBjYXRjaCAoZSkgeyBidWdneSA9IHRydWU7IH1cbiAgICAgIHJldHVybiBmdW5jdGlvbiBzZXRQcm90b3R5cGVPZihPLCBwcm90bykge1xuICAgICAgICBjaGVjayhPLCBwcm90byk7XG4gICAgICAgIGlmIChidWdneSkgTy5fX3Byb3RvX18gPSBwcm90bztcbiAgICAgICAgZWxzZSBzZXQoTywgcHJvdG8pO1xuICAgICAgICByZXR1cm4gTztcbiAgICAgIH07XG4gICAgfSh7fSwgZmFsc2UpIDogdW5kZWZpbmVkKSxcbiAgY2hlY2s6IGNoZWNrXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGdsb2JhbCA9IHJlcXVpcmUoJy4vX2dsb2JhbCcpO1xudmFyIGNvcmUgPSByZXF1aXJlKCcuL19jb3JlJyk7XG52YXIgZFAgPSByZXF1aXJlKCcuL19vYmplY3QtZHAnKTtcbnZhciBERVNDUklQVE9SUyA9IHJlcXVpcmUoJy4vX2Rlc2NyaXB0b3JzJyk7XG52YXIgU1BFQ0lFUyA9IHJlcXVpcmUoJy4vX3drcycpKCdzcGVjaWVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKEtFWSkge1xuICB2YXIgQyA9IHR5cGVvZiBjb3JlW0tFWV0gPT0gJ2Z1bmN0aW9uJyA/IGNvcmVbS0VZXSA6IGdsb2JhbFtLRVldO1xuICBpZiAoREVTQ1JJUFRPUlMgJiYgQyAmJiAhQ1tTUEVDSUVTXSkgZFAuZihDLCBTUEVDSUVTLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfVxuICB9KTtcbn07XG4iLCJ2YXIgZGVmID0gcmVxdWlyZSgnLi9fb2JqZWN0LWRwJykuZjtcbnZhciBoYXMgPSByZXF1aXJlKCcuL19oYXMnKTtcbnZhciBUQUcgPSByZXF1aXJlKCcuL193a3MnKSgndG9TdHJpbmdUYWcnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaXQsIHRhZywgc3RhdCkge1xuICBpZiAoaXQgJiYgIWhhcyhpdCA9IHN0YXQgPyBpdCA6IGl0LnByb3RvdHlwZSwgVEFHKSkgZGVmKGl0LCBUQUcsIHsgY29uZmlndXJhYmxlOiB0cnVlLCB2YWx1ZTogdGFnIH0pO1xufTtcbiIsInZhciBzaGFyZWQgPSByZXF1aXJlKCcuL19zaGFyZWQnKSgna2V5cycpO1xudmFyIHVpZCA9IHJlcXVpcmUoJy4vX3VpZCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHJldHVybiBzaGFyZWRba2V5XSB8fCAoc2hhcmVkW2tleV0gPSB1aWQoa2V5KSk7XG59O1xuIiwidmFyIGdsb2JhbCA9IHJlcXVpcmUoJy4vX2dsb2JhbCcpO1xudmFyIFNIQVJFRCA9ICdfX2NvcmUtanNfc2hhcmVkX18nO1xudmFyIHN0b3JlID0gZ2xvYmFsW1NIQVJFRF0gfHwgKGdsb2JhbFtTSEFSRURdID0ge30pO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHJldHVybiBzdG9yZVtrZXldIHx8IChzdG9yZVtrZXldID0ge30pO1xufTtcbiIsInZhciB0b0ludGVnZXIgPSByZXF1aXJlKCcuL190by1pbnRlZ2VyJyk7XG52YXIgZGVmaW5lZCA9IHJlcXVpcmUoJy4vX2RlZmluZWQnKTtcbi8vIHRydWUgIC0+IFN0cmluZyNhdFxuLy8gZmFsc2UgLT4gU3RyaW5nI2NvZGVQb2ludEF0XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChUT19TVFJJTkcpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh0aGF0LCBwb3MpIHtcbiAgICB2YXIgcyA9IFN0cmluZyhkZWZpbmVkKHRoYXQpKTtcbiAgICB2YXIgaSA9IHRvSW50ZWdlcihwb3MpO1xuICAgIHZhciBsID0gcy5sZW5ndGg7XG4gICAgdmFyIGEsIGI7XG4gICAgaWYgKGkgPCAwIHx8IGkgPj0gbCkgcmV0dXJuIFRPX1NUUklORyA/ICcnIDogdW5kZWZpbmVkO1xuICAgIGEgPSBzLmNoYXJDb2RlQXQoaSk7XG4gICAgcmV0dXJuIGEgPCAweGQ4MDAgfHwgYSA+IDB4ZGJmZiB8fCBpICsgMSA9PT0gbCB8fCAoYiA9IHMuY2hhckNvZGVBdChpICsgMSkpIDwgMHhkYzAwIHx8IGIgPiAweGRmZmZcbiAgICAgID8gVE9fU1RSSU5HID8gcy5jaGFyQXQoaSkgOiBhXG4gICAgICA6IFRPX1NUUklORyA/IHMuc2xpY2UoaSwgaSArIDIpIDogKGEgLSAweGQ4MDAgPDwgMTApICsgKGIgLSAweGRjMDApICsgMHgxMDAwMDtcbiAgfTtcbn07XG4iLCJ2YXIgdG9JbnRlZ2VyID0gcmVxdWlyZSgnLi9fdG8taW50ZWdlcicpO1xudmFyIG1heCA9IE1hdGgubWF4O1xudmFyIG1pbiA9IE1hdGgubWluO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaW5kZXgsIGxlbmd0aCkge1xuICBpbmRleCA9IHRvSW50ZWdlcihpbmRleCk7XG4gIHJldHVybiBpbmRleCA8IDAgPyBtYXgoaW5kZXggKyBsZW5ndGgsIDApIDogbWluKGluZGV4LCBsZW5ndGgpO1xufTtcbiIsIi8vIDcuMS40IFRvSW50ZWdlclxudmFyIGNlaWwgPSBNYXRoLmNlaWw7XG52YXIgZmxvb3IgPSBNYXRoLmZsb29yO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaXQpIHtcbiAgcmV0dXJuIGlzTmFOKGl0ID0gK2l0KSA/IDAgOiAoaXQgPiAwID8gZmxvb3IgOiBjZWlsKShpdCk7XG59O1xuIiwiLy8gdG8gaW5kZXhlZCBvYmplY3QsIHRvT2JqZWN0IHdpdGggZmFsbGJhY2sgZm9yIG5vbi1hcnJheS1saWtlIEVTMyBzdHJpbmdzXG52YXIgSU9iamVjdCA9IHJlcXVpcmUoJy4vX2lvYmplY3QnKTtcbnZhciBkZWZpbmVkID0gcmVxdWlyZSgnLi9fZGVmaW5lZCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaXQpIHtcbiAgcmV0dXJuIElPYmplY3QoZGVmaW5lZChpdCkpO1xufTtcbiIsIi8vIDcuMS4xNSBUb0xlbmd0aFxudmFyIHRvSW50ZWdlciA9IHJlcXVpcmUoJy4vX3RvLWludGVnZXInKTtcbnZhciBtaW4gPSBNYXRoLm1pbjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGl0KSB7XG4gIHJldHVybiBpdCA+IDAgPyBtaW4odG9JbnRlZ2VyKGl0KSwgMHgxZmZmZmZmZmZmZmZmZikgOiAwOyAvLyBwb3coMiwgNTMpIC0gMSA9PSA5MDA3MTk5MjU0NzQwOTkxXG59O1xuIiwiLy8gNy4xLjEzIFRvT2JqZWN0KGFyZ3VtZW50KVxudmFyIGRlZmluZWQgPSByZXF1aXJlKCcuL19kZWZpbmVkJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChpdCkge1xuICByZXR1cm4gT2JqZWN0KGRlZmluZWQoaXQpKTtcbn07XG4iLCIvLyA3LjEuMSBUb1ByaW1pdGl2ZShpbnB1dCBbLCBQcmVmZXJyZWRUeXBlXSlcbnZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vX2lzLW9iamVjdCcpO1xuLy8gaW5zdGVhZCBvZiB0aGUgRVM2IHNwZWMgdmVyc2lvbiwgd2UgZGlkbid0IGltcGxlbWVudCBAQHRvUHJpbWl0aXZlIGNhc2Vcbi8vIGFuZCB0aGUgc2Vjb25kIGFyZ3VtZW50IC0gZmxhZyAtIHByZWZlcnJlZCB0eXBlIGlzIGEgc3RyaW5nXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChpdCwgUykge1xuICBpZiAoIWlzT2JqZWN0KGl0KSkgcmV0dXJuIGl0O1xuICB2YXIgZm4sIHZhbDtcbiAgaWYgKFMgJiYgdHlwZW9mIChmbiA9IGl0LnRvU3RyaW5nKSA9PSAnZnVuY3Rpb24nICYmICFpc09iamVjdCh2YWwgPSBmbi5jYWxsKGl0KSkpIHJldHVybiB2YWw7XG4gIGlmICh0eXBlb2YgKGZuID0gaXQudmFsdWVPZikgPT0gJ2Z1bmN0aW9uJyAmJiAhaXNPYmplY3QodmFsID0gZm4uY2FsbChpdCkpKSByZXR1cm4gdmFsO1xuICBpZiAoIVMgJiYgdHlwZW9mIChmbiA9IGl0LnRvU3RyaW5nKSA9PSAnZnVuY3Rpb24nICYmICFpc09iamVjdCh2YWwgPSBmbi5jYWxsKGl0KSkpIHJldHVybiB2YWw7XG4gIHRocm93IFR5cGVFcnJvcihcIkNhbid0IGNvbnZlcnQgb2JqZWN0IHRvIHByaW1pdGl2ZSB2YWx1ZVwiKTtcbn07XG4iLCJ2YXIgaWQgPSAwO1xudmFyIHB4ID0gTWF0aC5yYW5kb20oKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGtleSkge1xuICByZXR1cm4gJ1N5bWJvbCgnLmNvbmNhdChrZXkgPT09IHVuZGVmaW5lZCA/ICcnIDoga2V5LCAnKV8nLCAoKytpZCArIHB4KS50b1N0cmluZygzNikpO1xufTtcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vX2lzLW9iamVjdCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaXQsIFRZUEUpIHtcbiAgaWYgKCFpc09iamVjdChpdCkgfHwgaXQuX3QgIT09IFRZUEUpIHRocm93IFR5cGVFcnJvcignSW5jb21wYXRpYmxlIHJlY2VpdmVyLCAnICsgVFlQRSArICcgcmVxdWlyZWQhJyk7XG4gIHJldHVybiBpdDtcbn07XG4iLCJ2YXIgZ2xvYmFsID0gcmVxdWlyZSgnLi9fZ2xvYmFsJyk7XG52YXIgY29yZSA9IHJlcXVpcmUoJy4vX2NvcmUnKTtcbnZhciBMSUJSQVJZID0gcmVxdWlyZSgnLi9fbGlicmFyeScpO1xudmFyIHdrc0V4dCA9IHJlcXVpcmUoJy4vX3drcy1leHQnKTtcbnZhciBkZWZpbmVQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vX29iamVjdC1kcCcpLmY7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIHZhciAkU3ltYm9sID0gY29yZS5TeW1ib2wgfHwgKGNvcmUuU3ltYm9sID0gTElCUkFSWSA/IHt9IDogZ2xvYmFsLlN5bWJvbCB8fCB7fSk7XG4gIGlmIChuYW1lLmNoYXJBdCgwKSAhPSAnXycgJiYgIShuYW1lIGluICRTeW1ib2wpKSBkZWZpbmVQcm9wZXJ0eSgkU3ltYm9sLCBuYW1lLCB7IHZhbHVlOiB3a3NFeHQuZihuYW1lKSB9KTtcbn07XG4iLCJleHBvcnRzLmYgPSByZXF1aXJlKCcuL193a3MnKTtcbiIsInZhciBzdG9yZSA9IHJlcXVpcmUoJy4vX3NoYXJlZCcpKCd3a3MnKTtcbnZhciB1aWQgPSByZXF1aXJlKCcuL191aWQnKTtcbnZhciBTeW1ib2wgPSByZXF1aXJlKCcuL19nbG9iYWwnKS5TeW1ib2w7XG52YXIgVVNFX1NZTUJPTCA9IHR5cGVvZiBTeW1ib2wgPT0gJ2Z1bmN0aW9uJztcblxudmFyICRleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobmFtZSkge1xuICByZXR1cm4gc3RvcmVbbmFtZV0gfHwgKHN0b3JlW25hbWVdID1cbiAgICBVU0VfU1lNQk9MICYmIFN5bWJvbFtuYW1lXSB8fCAoVVNFX1NZTUJPTCA/IFN5bWJvbCA6IHVpZCkoJ1N5bWJvbC4nICsgbmFtZSkpO1xufTtcblxuJGV4cG9ydHMuc3RvcmUgPSBzdG9yZTtcbiIsInZhciBjbGFzc29mID0gcmVxdWlyZSgnLi9fY2xhc3NvZicpO1xudmFyIElURVJBVE9SID0gcmVxdWlyZSgnLi9fd2tzJykoJ2l0ZXJhdG9yJyk7XG52YXIgSXRlcmF0b3JzID0gcmVxdWlyZSgnLi9faXRlcmF0b3JzJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vX2NvcmUnKS5nZXRJdGVyYXRvck1ldGhvZCA9IGZ1bmN0aW9uIChpdCkge1xuICBpZiAoaXQgIT0gdW5kZWZpbmVkKSByZXR1cm4gaXRbSVRFUkFUT1JdXG4gICAgfHwgaXRbJ0BAaXRlcmF0b3InXVxuICAgIHx8IEl0ZXJhdG9yc1tjbGFzc29mKGl0KV07XG59O1xuIiwidmFyIGFuT2JqZWN0ID0gcmVxdWlyZSgnLi9fYW4tb2JqZWN0Jyk7XG52YXIgZ2V0ID0gcmVxdWlyZSgnLi9jb3JlLmdldC1pdGVyYXRvci1tZXRob2QnKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9fY29yZScpLmdldEl0ZXJhdG9yID0gZnVuY3Rpb24gKGl0KSB7XG4gIHZhciBpdGVyRm4gPSBnZXQoaXQpO1xuICBpZiAodHlwZW9mIGl0ZXJGbiAhPSAnZnVuY3Rpb24nKSB0aHJvdyBUeXBlRXJyb3IoaXQgKyAnIGlzIG5vdCBpdGVyYWJsZSEnKTtcbiAgcmV0dXJuIGFuT2JqZWN0KGl0ZXJGbi5jYWxsKGl0KSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGFkZFRvVW5zY29wYWJsZXMgPSByZXF1aXJlKCcuL19hZGQtdG8tdW5zY29wYWJsZXMnKTtcbnZhciBzdGVwID0gcmVxdWlyZSgnLi9faXRlci1zdGVwJyk7XG52YXIgSXRlcmF0b3JzID0gcmVxdWlyZSgnLi9faXRlcmF0b3JzJyk7XG52YXIgdG9JT2JqZWN0ID0gcmVxdWlyZSgnLi9fdG8taW9iamVjdCcpO1xuXG4vLyAyMi4xLjMuNCBBcnJheS5wcm90b3R5cGUuZW50cmllcygpXG4vLyAyMi4xLjMuMTMgQXJyYXkucHJvdG90eXBlLmtleXMoKVxuLy8gMjIuMS4zLjI5IEFycmF5LnByb3RvdHlwZS52YWx1ZXMoKVxuLy8gMjIuMS4zLjMwIEFycmF5LnByb3RvdHlwZVtAQGl0ZXJhdG9yXSgpXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vX2l0ZXItZGVmaW5lJykoQXJyYXksICdBcnJheScsIGZ1bmN0aW9uIChpdGVyYXRlZCwga2luZCkge1xuICB0aGlzLl90ID0gdG9JT2JqZWN0KGl0ZXJhdGVkKTsgLy8gdGFyZ2V0XG4gIHRoaXMuX2kgPSAwOyAgICAgICAgICAgICAgICAgICAvLyBuZXh0IGluZGV4XG4gIHRoaXMuX2sgPSBraW5kOyAgICAgICAgICAgICAgICAvLyBraW5kXG4vLyAyMi4xLjUuMi4xICVBcnJheUl0ZXJhdG9yUHJvdG90eXBlJS5uZXh0KClcbn0sIGZ1bmN0aW9uICgpIHtcbiAgdmFyIE8gPSB0aGlzLl90O1xuICB2YXIga2luZCA9IHRoaXMuX2s7XG4gIHZhciBpbmRleCA9IHRoaXMuX2krKztcbiAgaWYgKCFPIHx8IGluZGV4ID49IE8ubGVuZ3RoKSB7XG4gICAgdGhpcy5fdCA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gc3RlcCgxKTtcbiAgfVxuICBpZiAoa2luZCA9PSAna2V5cycpIHJldHVybiBzdGVwKDAsIGluZGV4KTtcbiAgaWYgKGtpbmQgPT0gJ3ZhbHVlcycpIHJldHVybiBzdGVwKDAsIE9baW5kZXhdKTtcbiAgcmV0dXJuIHN0ZXAoMCwgW2luZGV4LCBPW2luZGV4XV0pO1xufSwgJ3ZhbHVlcycpO1xuXG4vLyBhcmd1bWVudHNMaXN0W0BAaXRlcmF0b3JdIGlzICVBcnJheVByb3RvX3ZhbHVlcyUgKDkuNC40LjYsIDkuNC40LjcpXG5JdGVyYXRvcnMuQXJndW1lbnRzID0gSXRlcmF0b3JzLkFycmF5O1xuXG5hZGRUb1Vuc2NvcGFibGVzKCdrZXlzJyk7XG5hZGRUb1Vuc2NvcGFibGVzKCd2YWx1ZXMnKTtcbmFkZFRvVW5zY29wYWJsZXMoJ2VudHJpZXMnKTtcbiIsInZhciAkZXhwb3J0ID0gcmVxdWlyZSgnLi9fZXhwb3J0Jyk7XG4vLyAxOS4xLjIuMiAvIDE1LjIuMy41IE9iamVjdC5jcmVhdGUoTyBbLCBQcm9wZXJ0aWVzXSlcbiRleHBvcnQoJGV4cG9ydC5TLCAnT2JqZWN0JywgeyBjcmVhdGU6IHJlcXVpcmUoJy4vX29iamVjdC1jcmVhdGUnKSB9KTtcbiIsInZhciAkZXhwb3J0ID0gcmVxdWlyZSgnLi9fZXhwb3J0Jyk7XG4vLyAxOS4xLjIuNCAvIDE1LjIuMy42IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPLCBQLCBBdHRyaWJ1dGVzKVxuJGV4cG9ydCgkZXhwb3J0LlMgKyAkZXhwb3J0LkYgKiAhcmVxdWlyZSgnLi9fZGVzY3JpcHRvcnMnKSwgJ09iamVjdCcsIHsgZGVmaW5lUHJvcGVydHk6IHJlcXVpcmUoJy4vX29iamVjdC1kcCcpLmYgfSk7XG4iLCIvLyAxOS4xLjIuNiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKE8sIFApXG52YXIgdG9JT2JqZWN0ID0gcmVxdWlyZSgnLi9fdG8taW9iamVjdCcpO1xudmFyICRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSByZXF1aXJlKCcuL19vYmplY3QtZ29wZCcpLmY7XG5cbnJlcXVpcmUoJy4vX29iamVjdC1zYXAnKSgnZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yJywgZnVuY3Rpb24gKCkge1xuICByZXR1cm4gZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGl0LCBrZXkpIHtcbiAgICByZXR1cm4gJGdldE93blByb3BlcnR5RGVzY3JpcHRvcih0b0lPYmplY3QoaXQpLCBrZXkpO1xuICB9O1xufSk7XG4iLCIvLyAxOS4xLjIuOSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoTylcbnZhciB0b09iamVjdCA9IHJlcXVpcmUoJy4vX3RvLW9iamVjdCcpO1xudmFyICRnZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoJy4vX29iamVjdC1ncG8nKTtcblxucmVxdWlyZSgnLi9fb2JqZWN0LXNhcCcpKCdnZXRQcm90b3R5cGVPZicsIGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGdldFByb3RvdHlwZU9mKGl0KSB7XG4gICAgcmV0dXJuICRnZXRQcm90b3R5cGVPZih0b09iamVjdChpdCkpO1xuICB9O1xufSk7XG4iLCIvLyAxOS4xLjMuMTkgT2JqZWN0LnNldFByb3RvdHlwZU9mKE8sIHByb3RvKVxudmFyICRleHBvcnQgPSByZXF1aXJlKCcuL19leHBvcnQnKTtcbiRleHBvcnQoJGV4cG9ydC5TLCAnT2JqZWN0JywgeyBzZXRQcm90b3R5cGVPZjogcmVxdWlyZSgnLi9fc2V0LXByb3RvJykuc2V0IH0pO1xuIiwiIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHN0cm9uZyA9IHJlcXVpcmUoJy4vX2NvbGxlY3Rpb24tc3Ryb25nJyk7XG52YXIgdmFsaWRhdGUgPSByZXF1aXJlKCcuL192YWxpZGF0ZS1jb2xsZWN0aW9uJyk7XG52YXIgU0VUID0gJ1NldCc7XG5cbi8vIDIzLjIgU2V0IE9iamVjdHNcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9fY29sbGVjdGlvbicpKFNFVCwgZnVuY3Rpb24gKGdldCkge1xuICByZXR1cm4gZnVuY3Rpb24gU2V0KCkgeyByZXR1cm4gZ2V0KHRoaXMsIGFyZ3VtZW50cy5sZW5ndGggPiAwID8gYXJndW1lbnRzWzBdIDogdW5kZWZpbmVkKTsgfTtcbn0sIHtcbiAgLy8gMjMuMi4zLjEgU2V0LnByb3RvdHlwZS5hZGQodmFsdWUpXG4gIGFkZDogZnVuY3Rpb24gYWRkKHZhbHVlKSB7XG4gICAgcmV0dXJuIHN0cm9uZy5kZWYodmFsaWRhdGUodGhpcywgU0VUKSwgdmFsdWUgPSB2YWx1ZSA9PT0gMCA/IDAgOiB2YWx1ZSwgdmFsdWUpO1xuICB9XG59LCBzdHJvbmcpO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyICRhdCA9IHJlcXVpcmUoJy4vX3N0cmluZy1hdCcpKHRydWUpO1xuXG4vLyAyMS4xLjMuMjcgU3RyaW5nLnByb3RvdHlwZVtAQGl0ZXJhdG9yXSgpXG5yZXF1aXJlKCcuL19pdGVyLWRlZmluZScpKFN0cmluZywgJ1N0cmluZycsIGZ1bmN0aW9uIChpdGVyYXRlZCkge1xuICB0aGlzLl90ID0gU3RyaW5nKGl0ZXJhdGVkKTsgLy8gdGFyZ2V0XG4gIHRoaXMuX2kgPSAwOyAgICAgICAgICAgICAgICAvLyBuZXh0IGluZGV4XG4vLyAyMS4xLjUuMi4xICVTdHJpbmdJdGVyYXRvclByb3RvdHlwZSUubmV4dCgpXG59LCBmdW5jdGlvbiAoKSB7XG4gIHZhciBPID0gdGhpcy5fdDtcbiAgdmFyIGluZGV4ID0gdGhpcy5faTtcbiAgdmFyIHBvaW50O1xuICBpZiAoaW5kZXggPj0gTy5sZW5ndGgpIHJldHVybiB7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfTtcbiAgcG9pbnQgPSAkYXQoTywgaW5kZXgpO1xuICB0aGlzLl9pICs9IHBvaW50Lmxlbmd0aDtcbiAgcmV0dXJuIHsgdmFsdWU6IHBvaW50LCBkb25lOiBmYWxzZSB9O1xufSk7XG4iLCIndXNlIHN0cmljdCc7XG4vLyBFQ01BU2NyaXB0IDYgc3ltYm9scyBzaGltXG52YXIgZ2xvYmFsID0gcmVxdWlyZSgnLi9fZ2xvYmFsJyk7XG52YXIgaGFzID0gcmVxdWlyZSgnLi9faGFzJyk7XG52YXIgREVTQ1JJUFRPUlMgPSByZXF1aXJlKCcuL19kZXNjcmlwdG9ycycpO1xudmFyICRleHBvcnQgPSByZXF1aXJlKCcuL19leHBvcnQnKTtcbnZhciByZWRlZmluZSA9IHJlcXVpcmUoJy4vX3JlZGVmaW5lJyk7XG52YXIgTUVUQSA9IHJlcXVpcmUoJy4vX21ldGEnKS5LRVk7XG52YXIgJGZhaWxzID0gcmVxdWlyZSgnLi9fZmFpbHMnKTtcbnZhciBzaGFyZWQgPSByZXF1aXJlKCcuL19zaGFyZWQnKTtcbnZhciBzZXRUb1N0cmluZ1RhZyA9IHJlcXVpcmUoJy4vX3NldC10by1zdHJpbmctdGFnJyk7XG52YXIgdWlkID0gcmVxdWlyZSgnLi9fdWlkJyk7XG52YXIgd2tzID0gcmVxdWlyZSgnLi9fd2tzJyk7XG52YXIgd2tzRXh0ID0gcmVxdWlyZSgnLi9fd2tzLWV4dCcpO1xudmFyIHdrc0RlZmluZSA9IHJlcXVpcmUoJy4vX3drcy1kZWZpbmUnKTtcbnZhciBlbnVtS2V5cyA9IHJlcXVpcmUoJy4vX2VudW0ta2V5cycpO1xudmFyIGlzQXJyYXkgPSByZXF1aXJlKCcuL19pcy1hcnJheScpO1xudmFyIGFuT2JqZWN0ID0gcmVxdWlyZSgnLi9fYW4tb2JqZWN0Jyk7XG52YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL19pcy1vYmplY3QnKTtcbnZhciB0b0lPYmplY3QgPSByZXF1aXJlKCcuL190by1pb2JqZWN0Jyk7XG52YXIgdG9QcmltaXRpdmUgPSByZXF1aXJlKCcuL190by1wcmltaXRpdmUnKTtcbnZhciBjcmVhdGVEZXNjID0gcmVxdWlyZSgnLi9fcHJvcGVydHktZGVzYycpO1xudmFyIF9jcmVhdGUgPSByZXF1aXJlKCcuL19vYmplY3QtY3JlYXRlJyk7XG52YXIgZ09QTkV4dCA9IHJlcXVpcmUoJy4vX29iamVjdC1nb3BuLWV4dCcpO1xudmFyICRHT1BEID0gcmVxdWlyZSgnLi9fb2JqZWN0LWdvcGQnKTtcbnZhciAkRFAgPSByZXF1aXJlKCcuL19vYmplY3QtZHAnKTtcbnZhciAka2V5cyA9IHJlcXVpcmUoJy4vX29iamVjdC1rZXlzJyk7XG52YXIgZ09QRCA9ICRHT1BELmY7XG52YXIgZFAgPSAkRFAuZjtcbnZhciBnT1BOID0gZ09QTkV4dC5mO1xudmFyICRTeW1ib2wgPSBnbG9iYWwuU3ltYm9sO1xudmFyICRKU09OID0gZ2xvYmFsLkpTT047XG52YXIgX3N0cmluZ2lmeSA9ICRKU09OICYmICRKU09OLnN0cmluZ2lmeTtcbnZhciBQUk9UT1RZUEUgPSAncHJvdG90eXBlJztcbnZhciBISURERU4gPSB3a3MoJ19oaWRkZW4nKTtcbnZhciBUT19QUklNSVRJVkUgPSB3a3MoJ3RvUHJpbWl0aXZlJyk7XG52YXIgaXNFbnVtID0ge30ucHJvcGVydHlJc0VudW1lcmFibGU7XG52YXIgU3ltYm9sUmVnaXN0cnkgPSBzaGFyZWQoJ3N5bWJvbC1yZWdpc3RyeScpO1xudmFyIEFsbFN5bWJvbHMgPSBzaGFyZWQoJ3N5bWJvbHMnKTtcbnZhciBPUFN5bWJvbHMgPSBzaGFyZWQoJ29wLXN5bWJvbHMnKTtcbnZhciBPYmplY3RQcm90byA9IE9iamVjdFtQUk9UT1RZUEVdO1xudmFyIFVTRV9OQVRJVkUgPSB0eXBlb2YgJFN5bWJvbCA9PSAnZnVuY3Rpb24nO1xudmFyIFFPYmplY3QgPSBnbG9iYWwuUU9iamVjdDtcbi8vIERvbid0IHVzZSBzZXR0ZXJzIGluIFF0IFNjcmlwdCwgaHR0cHM6Ly9naXRodWIuY29tL3psb2lyb2NrL2NvcmUtanMvaXNzdWVzLzE3M1xudmFyIHNldHRlciA9ICFRT2JqZWN0IHx8ICFRT2JqZWN0W1BST1RPVFlQRV0gfHwgIVFPYmplY3RbUFJPVE9UWVBFXS5maW5kQ2hpbGQ7XG5cbi8vIGZhbGxiYWNrIGZvciBvbGQgQW5kcm9pZCwgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTY4N1xudmFyIHNldFN5bWJvbERlc2MgPSBERVNDUklQVE9SUyAmJiAkZmFpbHMoZnVuY3Rpb24gKCkge1xuICByZXR1cm4gX2NyZWF0ZShkUCh7fSwgJ2EnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBkUCh0aGlzLCAnYScsIHsgdmFsdWU6IDcgfSkuYTsgfVxuICB9KSkuYSAhPSA3O1xufSkgPyBmdW5jdGlvbiAoaXQsIGtleSwgRCkge1xuICB2YXIgcHJvdG9EZXNjID0gZ09QRChPYmplY3RQcm90bywga2V5KTtcbiAgaWYgKHByb3RvRGVzYykgZGVsZXRlIE9iamVjdFByb3RvW2tleV07XG4gIGRQKGl0LCBrZXksIEQpO1xuICBpZiAocHJvdG9EZXNjICYmIGl0ICE9PSBPYmplY3RQcm90bykgZFAoT2JqZWN0UHJvdG8sIGtleSwgcHJvdG9EZXNjKTtcbn0gOiBkUDtcblxudmFyIHdyYXAgPSBmdW5jdGlvbiAodGFnKSB7XG4gIHZhciBzeW0gPSBBbGxTeW1ib2xzW3RhZ10gPSBfY3JlYXRlKCRTeW1ib2xbUFJPVE9UWVBFXSk7XG4gIHN5bS5fayA9IHRhZztcbiAgcmV0dXJuIHN5bTtcbn07XG5cbnZhciBpc1N5bWJvbCA9IFVTRV9OQVRJVkUgJiYgdHlwZW9mICRTeW1ib2wuaXRlcmF0b3IgPT0gJ3N5bWJvbCcgPyBmdW5jdGlvbiAoaXQpIHtcbiAgcmV0dXJuIHR5cGVvZiBpdCA9PSAnc3ltYm9sJztcbn0gOiBmdW5jdGlvbiAoaXQpIHtcbiAgcmV0dXJuIGl0IGluc3RhbmNlb2YgJFN5bWJvbDtcbn07XG5cbnZhciAkZGVmaW5lUHJvcGVydHkgPSBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0eShpdCwga2V5LCBEKSB7XG4gIGlmIChpdCA9PT0gT2JqZWN0UHJvdG8pICRkZWZpbmVQcm9wZXJ0eShPUFN5bWJvbHMsIGtleSwgRCk7XG4gIGFuT2JqZWN0KGl0KTtcbiAga2V5ID0gdG9QcmltaXRpdmUoa2V5LCB0cnVlKTtcbiAgYW5PYmplY3QoRCk7XG4gIGlmIChoYXMoQWxsU3ltYm9scywga2V5KSkge1xuICAgIGlmICghRC5lbnVtZXJhYmxlKSB7XG4gICAgICBpZiAoIWhhcyhpdCwgSElEREVOKSkgZFAoaXQsIEhJRERFTiwgY3JlYXRlRGVzYygxLCB7fSkpO1xuICAgICAgaXRbSElEREVOXVtrZXldID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGhhcyhpdCwgSElEREVOKSAmJiBpdFtISURERU5dW2tleV0pIGl0W0hJRERFTl1ba2V5XSA9IGZhbHNlO1xuICAgICAgRCA9IF9jcmVhdGUoRCwgeyBlbnVtZXJhYmxlOiBjcmVhdGVEZXNjKDAsIGZhbHNlKSB9KTtcbiAgICB9IHJldHVybiBzZXRTeW1ib2xEZXNjKGl0LCBrZXksIEQpO1xuICB9IHJldHVybiBkUChpdCwga2V5LCBEKTtcbn07XG52YXIgJGRlZmluZVByb3BlcnRpZXMgPSBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKGl0LCBQKSB7XG4gIGFuT2JqZWN0KGl0KTtcbiAgdmFyIGtleXMgPSBlbnVtS2V5cyhQID0gdG9JT2JqZWN0KFApKTtcbiAgdmFyIGkgPSAwO1xuICB2YXIgbCA9IGtleXMubGVuZ3RoO1xuICB2YXIga2V5O1xuICB3aGlsZSAobCA+IGkpICRkZWZpbmVQcm9wZXJ0eShpdCwga2V5ID0ga2V5c1tpKytdLCBQW2tleV0pO1xuICByZXR1cm4gaXQ7XG59O1xudmFyICRjcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoaXQsIFApIHtcbiAgcmV0dXJuIFAgPT09IHVuZGVmaW5lZCA/IF9jcmVhdGUoaXQpIDogJGRlZmluZVByb3BlcnRpZXMoX2NyZWF0ZShpdCksIFApO1xufTtcbnZhciAkcHJvcGVydHlJc0VudW1lcmFibGUgPSBmdW5jdGlvbiBwcm9wZXJ0eUlzRW51bWVyYWJsZShrZXkpIHtcbiAgdmFyIEUgPSBpc0VudW0uY2FsbCh0aGlzLCBrZXkgPSB0b1ByaW1pdGl2ZShrZXksIHRydWUpKTtcbiAgaWYgKHRoaXMgPT09IE9iamVjdFByb3RvICYmIGhhcyhBbGxTeW1ib2xzLCBrZXkpICYmICFoYXMoT1BTeW1ib2xzLCBrZXkpKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBFIHx8ICFoYXModGhpcywga2V5KSB8fCAhaGFzKEFsbFN5bWJvbHMsIGtleSkgfHwgaGFzKHRoaXMsIEhJRERFTikgJiYgdGhpc1tISURERU5dW2tleV0gPyBFIDogdHJ1ZTtcbn07XG52YXIgJGdldE93blByb3BlcnR5RGVzY3JpcHRvciA9IGZ1bmN0aW9uIGdldE93blByb3BlcnR5RGVzY3JpcHRvcihpdCwga2V5KSB7XG4gIGl0ID0gdG9JT2JqZWN0KGl0KTtcbiAga2V5ID0gdG9QcmltaXRpdmUoa2V5LCB0cnVlKTtcbiAgaWYgKGl0ID09PSBPYmplY3RQcm90byAmJiBoYXMoQWxsU3ltYm9scywga2V5KSAmJiAhaGFzKE9QU3ltYm9scywga2V5KSkgcmV0dXJuO1xuICB2YXIgRCA9IGdPUEQoaXQsIGtleSk7XG4gIGlmIChEICYmIGhhcyhBbGxTeW1ib2xzLCBrZXkpICYmICEoaGFzKGl0LCBISURERU4pICYmIGl0W0hJRERFTl1ba2V5XSkpIEQuZW51bWVyYWJsZSA9IHRydWU7XG4gIHJldHVybiBEO1xufTtcbnZhciAkZ2V0T3duUHJvcGVydHlOYW1lcyA9IGZ1bmN0aW9uIGdldE93blByb3BlcnR5TmFtZXMoaXQpIHtcbiAgdmFyIG5hbWVzID0gZ09QTih0b0lPYmplY3QoaXQpKTtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICB2YXIgaSA9IDA7XG4gIHZhciBrZXk7XG4gIHdoaWxlIChuYW1lcy5sZW5ndGggPiBpKSB7XG4gICAgaWYgKCFoYXMoQWxsU3ltYm9scywga2V5ID0gbmFtZXNbaSsrXSkgJiYga2V5ICE9IEhJRERFTiAmJiBrZXkgIT0gTUVUQSkgcmVzdWx0LnB1c2goa2V5KTtcbiAgfSByZXR1cm4gcmVzdWx0O1xufTtcbnZhciAkZ2V0T3duUHJvcGVydHlTeW1ib2xzID0gZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlTeW1ib2xzKGl0KSB7XG4gIHZhciBJU19PUCA9IGl0ID09PSBPYmplY3RQcm90bztcbiAgdmFyIG5hbWVzID0gZ09QTihJU19PUCA/IE9QU3ltYm9scyA6IHRvSU9iamVjdChpdCkpO1xuICB2YXIgcmVzdWx0ID0gW107XG4gIHZhciBpID0gMDtcbiAgdmFyIGtleTtcbiAgd2hpbGUgKG5hbWVzLmxlbmd0aCA+IGkpIHtcbiAgICBpZiAoaGFzKEFsbFN5bWJvbHMsIGtleSA9IG5hbWVzW2krK10pICYmIChJU19PUCA/IGhhcyhPYmplY3RQcm90bywga2V5KSA6IHRydWUpKSByZXN1bHQucHVzaChBbGxTeW1ib2xzW2tleV0pO1xuICB9IHJldHVybiByZXN1bHQ7XG59O1xuXG4vLyAxOS40LjEuMSBTeW1ib2woW2Rlc2NyaXB0aW9uXSlcbmlmICghVVNFX05BVElWRSkge1xuICAkU3ltYm9sID0gZnVuY3Rpb24gU3ltYm9sKCkge1xuICAgIGlmICh0aGlzIGluc3RhbmNlb2YgJFN5bWJvbCkgdGhyb3cgVHlwZUVycm9yKCdTeW1ib2wgaXMgbm90IGEgY29uc3RydWN0b3IhJyk7XG4gICAgdmFyIHRhZyA9IHVpZChhcmd1bWVudHMubGVuZ3RoID4gMCA/IGFyZ3VtZW50c1swXSA6IHVuZGVmaW5lZCk7XG4gICAgdmFyICRzZXQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICh0aGlzID09PSBPYmplY3RQcm90bykgJHNldC5jYWxsKE9QU3ltYm9scywgdmFsdWUpO1xuICAgICAgaWYgKGhhcyh0aGlzLCBISURERU4pICYmIGhhcyh0aGlzW0hJRERFTl0sIHRhZykpIHRoaXNbSElEREVOXVt0YWddID0gZmFsc2U7XG4gICAgICBzZXRTeW1ib2xEZXNjKHRoaXMsIHRhZywgY3JlYXRlRGVzYygxLCB2YWx1ZSkpO1xuICAgIH07XG4gICAgaWYgKERFU0NSSVBUT1JTICYmIHNldHRlcikgc2V0U3ltYm9sRGVzYyhPYmplY3RQcm90bywgdGFnLCB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSwgc2V0OiAkc2V0IH0pO1xuICAgIHJldHVybiB3cmFwKHRhZyk7XG4gIH07XG4gIHJlZGVmaW5lKCRTeW1ib2xbUFJPVE9UWVBFXSwgJ3RvU3RyaW5nJywgZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2s7XG4gIH0pO1xuXG4gICRHT1BELmYgPSAkZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yO1xuICAkRFAuZiA9ICRkZWZpbmVQcm9wZXJ0eTtcbiAgcmVxdWlyZSgnLi9fb2JqZWN0LWdvcG4nKS5mID0gZ09QTkV4dC5mID0gJGdldE93blByb3BlcnR5TmFtZXM7XG4gIHJlcXVpcmUoJy4vX29iamVjdC1waWUnKS5mID0gJHByb3BlcnR5SXNFbnVtZXJhYmxlO1xuICByZXF1aXJlKCcuL19vYmplY3QtZ29wcycpLmYgPSAkZ2V0T3duUHJvcGVydHlTeW1ib2xzO1xuXG4gIGlmIChERVNDUklQVE9SUyAmJiAhcmVxdWlyZSgnLi9fbGlicmFyeScpKSB7XG4gICAgcmVkZWZpbmUoT2JqZWN0UHJvdG8sICdwcm9wZXJ0eUlzRW51bWVyYWJsZScsICRwcm9wZXJ0eUlzRW51bWVyYWJsZSwgdHJ1ZSk7XG4gIH1cblxuICB3a3NFeHQuZiA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcmV0dXJuIHdyYXAod2tzKG5hbWUpKTtcbiAgfTtcbn1cblxuJGV4cG9ydCgkZXhwb3J0LkcgKyAkZXhwb3J0LlcgKyAkZXhwb3J0LkYgKiAhVVNFX05BVElWRSwgeyBTeW1ib2w6ICRTeW1ib2wgfSk7XG5cbmZvciAodmFyIGVzNlN5bWJvbHMgPSAoXG4gIC8vIDE5LjQuMi4yLCAxOS40LjIuMywgMTkuNC4yLjQsIDE5LjQuMi42LCAxOS40LjIuOCwgMTkuNC4yLjksIDE5LjQuMi4xMCwgMTkuNC4yLjExLCAxOS40LjIuMTIsIDE5LjQuMi4xMywgMTkuNC4yLjE0XG4gICdoYXNJbnN0YW5jZSxpc0NvbmNhdFNwcmVhZGFibGUsaXRlcmF0b3IsbWF0Y2gscmVwbGFjZSxzZWFyY2gsc3BlY2llcyxzcGxpdCx0b1ByaW1pdGl2ZSx0b1N0cmluZ1RhZyx1bnNjb3BhYmxlcydcbikuc3BsaXQoJywnKSwgaiA9IDA7IGVzNlN5bWJvbHMubGVuZ3RoID4gajspd2tzKGVzNlN5bWJvbHNbaisrXSk7XG5cbmZvciAodmFyIHdlbGxLbm93blN5bWJvbHMgPSAka2V5cyh3a3Muc3RvcmUpLCBrID0gMDsgd2VsbEtub3duU3ltYm9scy5sZW5ndGggPiBrOykgd2tzRGVmaW5lKHdlbGxLbm93blN5bWJvbHNbaysrXSk7XG5cbiRleHBvcnQoJGV4cG9ydC5TICsgJGV4cG9ydC5GICogIVVTRV9OQVRJVkUsICdTeW1ib2wnLCB7XG4gIC8vIDE5LjQuMi4xIFN5bWJvbC5mb3Ioa2V5KVxuICAnZm9yJzogZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiBoYXMoU3ltYm9sUmVnaXN0cnksIGtleSArPSAnJylcbiAgICAgID8gU3ltYm9sUmVnaXN0cnlba2V5XVxuICAgICAgOiBTeW1ib2xSZWdpc3RyeVtrZXldID0gJFN5bWJvbChrZXkpO1xuICB9LFxuICAvLyAxOS40LjIuNSBTeW1ib2wua2V5Rm9yKHN5bSlcbiAga2V5Rm9yOiBmdW5jdGlvbiBrZXlGb3Ioc3ltKSB7XG4gICAgaWYgKCFpc1N5bWJvbChzeW0pKSB0aHJvdyBUeXBlRXJyb3Ioc3ltICsgJyBpcyBub3QgYSBzeW1ib2whJyk7XG4gICAgZm9yICh2YXIga2V5IGluIFN5bWJvbFJlZ2lzdHJ5KSBpZiAoU3ltYm9sUmVnaXN0cnlba2V5XSA9PT0gc3ltKSByZXR1cm4ga2V5O1xuICB9LFxuICB1c2VTZXR0ZXI6IGZ1bmN0aW9uICgpIHsgc2V0dGVyID0gdHJ1ZTsgfSxcbiAgdXNlU2ltcGxlOiBmdW5jdGlvbiAoKSB7IHNldHRlciA9IGZhbHNlOyB9XG59KTtcblxuJGV4cG9ydCgkZXhwb3J0LlMgKyAkZXhwb3J0LkYgKiAhVVNFX05BVElWRSwgJ09iamVjdCcsIHtcbiAgLy8gMTkuMS4yLjIgT2JqZWN0LmNyZWF0ZShPIFssIFByb3BlcnRpZXNdKVxuICBjcmVhdGU6ICRjcmVhdGUsXG4gIC8vIDE5LjEuMi40IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPLCBQLCBBdHRyaWJ1dGVzKVxuICBkZWZpbmVQcm9wZXJ0eTogJGRlZmluZVByb3BlcnR5LFxuICAvLyAxOS4xLjIuMyBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhPLCBQcm9wZXJ0aWVzKVxuICBkZWZpbmVQcm9wZXJ0aWVzOiAkZGVmaW5lUHJvcGVydGllcyxcbiAgLy8gMTkuMS4yLjYgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihPLCBQKVxuICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I6ICRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IsXG4gIC8vIDE5LjEuMi43IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKE8pXG4gIGdldE93blByb3BlcnR5TmFtZXM6ICRnZXRPd25Qcm9wZXJ0eU5hbWVzLFxuICAvLyAxOS4xLjIuOCBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKE8pXG4gIGdldE93blByb3BlcnR5U3ltYm9sczogJGdldE93blByb3BlcnR5U3ltYm9sc1xufSk7XG5cbi8vIDI0LjMuMiBKU09OLnN0cmluZ2lmeSh2YWx1ZSBbLCByZXBsYWNlciBbLCBzcGFjZV1dKVxuJEpTT04gJiYgJGV4cG9ydCgkZXhwb3J0LlMgKyAkZXhwb3J0LkYgKiAoIVVTRV9OQVRJVkUgfHwgJGZhaWxzKGZ1bmN0aW9uICgpIHtcbiAgdmFyIFMgPSAkU3ltYm9sKCk7XG4gIC8vIE1TIEVkZ2UgY29udmVydHMgc3ltYm9sIHZhbHVlcyB0byBKU09OIGFzIHt9XG4gIC8vIFdlYktpdCBjb252ZXJ0cyBzeW1ib2wgdmFsdWVzIHRvIEpTT04gYXMgbnVsbFxuICAvLyBWOCB0aHJvd3Mgb24gYm94ZWQgc3ltYm9sc1xuICByZXR1cm4gX3N0cmluZ2lmeShbU10pICE9ICdbbnVsbF0nIHx8IF9zdHJpbmdpZnkoeyBhOiBTIH0pICE9ICd7fScgfHwgX3N0cmluZ2lmeShPYmplY3QoUykpICE9ICd7fSc7XG59KSksICdKU09OJywge1xuICBzdHJpbmdpZnk6IGZ1bmN0aW9uIHN0cmluZ2lmeShpdCkge1xuICAgIHZhciBhcmdzID0gW2l0XTtcbiAgICB2YXIgaSA9IDE7XG4gICAgdmFyIHJlcGxhY2VyLCAkcmVwbGFjZXI7XG4gICAgd2hpbGUgKGFyZ3VtZW50cy5sZW5ndGggPiBpKSBhcmdzLnB1c2goYXJndW1lbnRzW2krK10pO1xuICAgICRyZXBsYWNlciA9IHJlcGxhY2VyID0gYXJnc1sxXTtcbiAgICBpZiAoIWlzT2JqZWN0KHJlcGxhY2VyKSAmJiBpdCA9PT0gdW5kZWZpbmVkIHx8IGlzU3ltYm9sKGl0KSkgcmV0dXJuOyAvLyBJRTggcmV0dXJucyBzdHJpbmcgb24gdW5kZWZpbmVkXG4gICAgaWYgKCFpc0FycmF5KHJlcGxhY2VyKSkgcmVwbGFjZXIgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgaWYgKHR5cGVvZiAkcmVwbGFjZXIgPT0gJ2Z1bmN0aW9uJykgdmFsdWUgPSAkcmVwbGFjZXIuY2FsbCh0aGlzLCBrZXksIHZhbHVlKTtcbiAgICAgIGlmICghaXNTeW1ib2wodmFsdWUpKSByZXR1cm4gdmFsdWU7XG4gICAgfTtcbiAgICBhcmdzWzFdID0gcmVwbGFjZXI7XG4gICAgcmV0dXJuIF9zdHJpbmdpZnkuYXBwbHkoJEpTT04sIGFyZ3MpO1xuICB9XG59KTtcblxuLy8gMTkuNC4zLjQgU3ltYm9sLnByb3RvdHlwZVtAQHRvUHJpbWl0aXZlXShoaW50KVxuJFN5bWJvbFtQUk9UT1RZUEVdW1RPX1BSSU1JVElWRV0gfHwgcmVxdWlyZSgnLi9faGlkZScpKCRTeW1ib2xbUFJPVE9UWVBFXSwgVE9fUFJJTUlUSVZFLCAkU3ltYm9sW1BST1RPVFlQRV0udmFsdWVPZik7XG4vLyAxOS40LjMuNSBTeW1ib2wucHJvdG90eXBlW0BAdG9TdHJpbmdUYWddXG5zZXRUb1N0cmluZ1RhZygkU3ltYm9sLCAnU3ltYm9sJyk7XG4vLyAyMC4yLjEuOSBNYXRoW0BAdG9TdHJpbmdUYWddXG5zZXRUb1N0cmluZ1RhZyhNYXRoLCAnTWF0aCcsIHRydWUpO1xuLy8gMjQuMy4zIEpTT05bQEB0b1N0cmluZ1RhZ11cbnNldFRvU3RyaW5nVGFnKGdsb2JhbC5KU09OLCAnSlNPTicsIHRydWUpO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGVhY2ggPSByZXF1aXJlKCcuL19hcnJheS1tZXRob2RzJykoMCk7XG52YXIgcmVkZWZpbmUgPSByZXF1aXJlKCcuL19yZWRlZmluZScpO1xudmFyIG1ldGEgPSByZXF1aXJlKCcuL19tZXRhJyk7XG52YXIgYXNzaWduID0gcmVxdWlyZSgnLi9fb2JqZWN0LWFzc2lnbicpO1xudmFyIHdlYWsgPSByZXF1aXJlKCcuL19jb2xsZWN0aW9uLXdlYWsnKTtcbnZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vX2lzLW9iamVjdCcpO1xudmFyIGZhaWxzID0gcmVxdWlyZSgnLi9fZmFpbHMnKTtcbnZhciB2YWxpZGF0ZSA9IHJlcXVpcmUoJy4vX3ZhbGlkYXRlLWNvbGxlY3Rpb24nKTtcbnZhciBXRUFLX01BUCA9ICdXZWFrTWFwJztcbnZhciBnZXRXZWFrID0gbWV0YS5nZXRXZWFrO1xudmFyIGlzRXh0ZW5zaWJsZSA9IE9iamVjdC5pc0V4dGVuc2libGU7XG52YXIgdW5jYXVnaHRGcm96ZW5TdG9yZSA9IHdlYWsudWZzdG9yZTtcbnZhciB0bXAgPSB7fTtcbnZhciBJbnRlcm5hbE1hcDtcblxudmFyIHdyYXBwZXIgPSBmdW5jdGlvbiAoZ2V0KSB7XG4gIHJldHVybiBmdW5jdGlvbiBXZWFrTWFwKCkge1xuICAgIHJldHVybiBnZXQodGhpcywgYXJndW1lbnRzLmxlbmd0aCA+IDAgPyBhcmd1bWVudHNbMF0gOiB1bmRlZmluZWQpO1xuICB9O1xufTtcblxudmFyIG1ldGhvZHMgPSB7XG4gIC8vIDIzLjMuMy4zIFdlYWtNYXAucHJvdG90eXBlLmdldChrZXkpXG4gIGdldDogZnVuY3Rpb24gZ2V0KGtleSkge1xuICAgIGlmIChpc09iamVjdChrZXkpKSB7XG4gICAgICB2YXIgZGF0YSA9IGdldFdlYWsoa2V5KTtcbiAgICAgIGlmIChkYXRhID09PSB0cnVlKSByZXR1cm4gdW5jYXVnaHRGcm96ZW5TdG9yZSh2YWxpZGF0ZSh0aGlzLCBXRUFLX01BUCkpLmdldChrZXkpO1xuICAgICAgcmV0dXJuIGRhdGEgPyBkYXRhW3RoaXMuX2ldIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgfSxcbiAgLy8gMjMuMy4zLjUgV2Vha01hcC5wcm90b3R5cGUuc2V0KGtleSwgdmFsdWUpXG4gIHNldDogZnVuY3Rpb24gc2V0KGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gd2Vhay5kZWYodmFsaWRhdGUodGhpcywgV0VBS19NQVApLCBrZXksIHZhbHVlKTtcbiAgfVxufTtcblxuLy8gMjMuMyBXZWFrTWFwIE9iamVjdHNcbnZhciAkV2Vha01hcCA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9fY29sbGVjdGlvbicpKFdFQUtfTUFQLCB3cmFwcGVyLCBtZXRob2RzLCB3ZWFrLCB0cnVlLCB0cnVlKTtcblxuLy8gSUUxMSBXZWFrTWFwIGZyb3plbiBrZXlzIGZpeFxuaWYgKGZhaWxzKGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyAkV2Vha01hcCgpLnNldCgoT2JqZWN0LmZyZWV6ZSB8fCBPYmplY3QpKHRtcCksIDcpLmdldCh0bXApICE9IDc7IH0pKSB7XG4gIEludGVybmFsTWFwID0gd2Vhay5nZXRDb25zdHJ1Y3Rvcih3cmFwcGVyLCBXRUFLX01BUCk7XG4gIGFzc2lnbihJbnRlcm5hbE1hcC5wcm90b3R5cGUsIG1ldGhvZHMpO1xuICBtZXRhLk5FRUQgPSB0cnVlO1xuICBlYWNoKFsnZGVsZXRlJywgJ2hhcycsICdnZXQnLCAnc2V0J10sIGZ1bmN0aW9uIChrZXkpIHtcbiAgICB2YXIgcHJvdG8gPSAkV2Vha01hcC5wcm90b3R5cGU7XG4gICAgdmFyIG1ldGhvZCA9IHByb3RvW2tleV07XG4gICAgcmVkZWZpbmUocHJvdG8sIGtleSwgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgIC8vIHN0b3JlIGZyb3plbiBvYmplY3RzIG9uIGludGVybmFsIHdlYWttYXAgc2hpbVxuICAgICAgaWYgKGlzT2JqZWN0KGEpICYmICFpc0V4dGVuc2libGUoYSkpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9mKSB0aGlzLl9mID0gbmV3IEludGVybmFsTWFwKCk7XG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLl9mW2tleV0oYSwgYik7XG4gICAgICAgIHJldHVybiBrZXkgPT0gJ3NldCcgPyB0aGlzIDogcmVzdWx0O1xuICAgICAgLy8gc3RvcmUgYWxsIHRoZSByZXN0IG9uIG5hdGl2ZSB3ZWFrbWFwXG4gICAgICB9IHJldHVybiBtZXRob2QuY2FsbCh0aGlzLCBhLCBiKTtcbiAgICB9KTtcbiAgfSk7XG59XG4iLCIvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL3Byb3Bvc2FsLXNldG1hcC1vZmZyb20vI3NlYy1zZXQuZnJvbVxucmVxdWlyZSgnLi9fc2V0LWNvbGxlY3Rpb24tZnJvbScpKCdTZXQnKTtcbiIsIi8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vcHJvcG9zYWwtc2V0bWFwLW9mZnJvbS8jc2VjLXNldC5vZlxucmVxdWlyZSgnLi9fc2V0LWNvbGxlY3Rpb24tb2YnKSgnU2V0Jyk7XG4iLCIvLyBodHRwczovL2dpdGh1Yi5jb20vRGF2aWRCcnVhbnQvTWFwLVNldC5wcm90b3R5cGUudG9KU09OXG52YXIgJGV4cG9ydCA9IHJlcXVpcmUoJy4vX2V4cG9ydCcpO1xuXG4kZXhwb3J0KCRleHBvcnQuUCArICRleHBvcnQuUiwgJ1NldCcsIHsgdG9KU09OOiByZXF1aXJlKCcuL19jb2xsZWN0aW9uLXRvLWpzb24nKSgnU2V0JykgfSk7XG4iLCJyZXF1aXJlKCcuL193a3MtZGVmaW5lJykoJ2FzeW5jSXRlcmF0b3InKTtcbiIsInJlcXVpcmUoJy4vX3drcy1kZWZpbmUnKSgnb2JzZXJ2YWJsZScpO1xuIiwiLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9wcm9wb3NhbC1zZXRtYXAtb2Zmcm9tLyNzZWMtd2Vha21hcC5mcm9tXG5yZXF1aXJlKCcuL19zZXQtY29sbGVjdGlvbi1mcm9tJykoJ1dlYWtNYXAnKTtcbiIsIi8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vcHJvcG9zYWwtc2V0bWFwLW9mZnJvbS8jc2VjLXdlYWttYXAub2ZcbnJlcXVpcmUoJy4vX3NldC1jb2xsZWN0aW9uLW9mJykoJ1dlYWtNYXAnKTtcbiIsInJlcXVpcmUoJy4vZXM2LmFycmF5Lml0ZXJhdG9yJyk7XG52YXIgZ2xvYmFsID0gcmVxdWlyZSgnLi9fZ2xvYmFsJyk7XG52YXIgaGlkZSA9IHJlcXVpcmUoJy4vX2hpZGUnKTtcbnZhciBJdGVyYXRvcnMgPSByZXF1aXJlKCcuL19pdGVyYXRvcnMnKTtcbnZhciBUT19TVFJJTkdfVEFHID0gcmVxdWlyZSgnLi9fd2tzJykoJ3RvU3RyaW5nVGFnJyk7XG5cbnZhciBET01JdGVyYWJsZXMgPSAoJ0NTU1J1bGVMaXN0LENTU1N0eWxlRGVjbGFyYXRpb24sQ1NTVmFsdWVMaXN0LENsaWVudFJlY3RMaXN0LERPTVJlY3RMaXN0LERPTVN0cmluZ0xpc3QsJyArXG4gICdET01Ub2tlbkxpc3QsRGF0YVRyYW5zZmVySXRlbUxpc3QsRmlsZUxpc3QsSFRNTEFsbENvbGxlY3Rpb24sSFRNTENvbGxlY3Rpb24sSFRNTEZvcm1FbGVtZW50LEhUTUxTZWxlY3RFbGVtZW50LCcgK1xuICAnTWVkaWFMaXN0LE1pbWVUeXBlQXJyYXksTmFtZWROb2RlTWFwLE5vZGVMaXN0LFBhaW50UmVxdWVzdExpc3QsUGx1Z2luLFBsdWdpbkFycmF5LFNWR0xlbmd0aExpc3QsU1ZHTnVtYmVyTGlzdCwnICtcbiAgJ1NWR1BhdGhTZWdMaXN0LFNWR1BvaW50TGlzdCxTVkdTdHJpbmdMaXN0LFNWR1RyYW5zZm9ybUxpc3QsU291cmNlQnVmZmVyTGlzdCxTdHlsZVNoZWV0TGlzdCxUZXh0VHJhY2tDdWVMaXN0LCcgK1xuICAnVGV4dFRyYWNrTGlzdCxUb3VjaExpc3QnKS5zcGxpdCgnLCcpO1xuXG5mb3IgKHZhciBpID0gMDsgaSA8IERPTUl0ZXJhYmxlcy5sZW5ndGg7IGkrKykge1xuICB2YXIgTkFNRSA9IERPTUl0ZXJhYmxlc1tpXTtcbiAgdmFyIENvbGxlY3Rpb24gPSBnbG9iYWxbTkFNRV07XG4gIHZhciBwcm90byA9IENvbGxlY3Rpb24gJiYgQ29sbGVjdGlvbi5wcm90b3R5cGU7XG4gIGlmIChwcm90byAmJiAhcHJvdG9bVE9fU1RSSU5HX1RBR10pIGhpZGUocHJvdG8sIFRPX1NUUklOR19UQUcsIE5BTUUpO1xuICBJdGVyYXRvcnNbTkFNRV0gPSBJdGVyYXRvcnMuQXJyYXk7XG59XG4iLCIvKipcbiAqIFRoaXMgaXMgdGhlIHdlYiBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xuZXhwb3J0cy5sb2cgPSBsb2c7XG5leHBvcnRzLmZvcm1hdEFyZ3MgPSBmb3JtYXRBcmdzO1xuZXhwb3J0cy5zYXZlID0gc2F2ZTtcbmV4cG9ydHMubG9hZCA9IGxvYWQ7XG5leHBvcnRzLnVzZUNvbG9ycyA9IHVzZUNvbG9ycztcbmV4cG9ydHMuc3RvcmFnZSA9ICd1bmRlZmluZWQnICE9IHR5cGVvZiBjaHJvbWVcbiAgICAgICAgICAgICAgICYmICd1bmRlZmluZWQnICE9IHR5cGVvZiBjaHJvbWUuc3RvcmFnZVxuICAgICAgICAgICAgICAgICAgPyBjaHJvbWUuc3RvcmFnZS5sb2NhbFxuICAgICAgICAgICAgICAgICAgOiBsb2NhbHN0b3JhZ2UoKTtcblxuLyoqXG4gKiBDb2xvcnMuXG4gKi9cblxuZXhwb3J0cy5jb2xvcnMgPSBbXG4gICdsaWdodHNlYWdyZWVuJyxcbiAgJ2ZvcmVzdGdyZWVuJyxcbiAgJ2dvbGRlbnJvZCcsXG4gICdkb2RnZXJibHVlJyxcbiAgJ2RhcmtvcmNoaWQnLFxuICAnY3JpbXNvbidcbl07XG5cbi8qKlxuICogQ3VycmVudGx5IG9ubHkgV2ViS2l0LWJhc2VkIFdlYiBJbnNwZWN0b3JzLCBGaXJlZm94ID49IHYzMSxcbiAqIGFuZCB0aGUgRmlyZWJ1ZyBleHRlbnNpb24gKGFueSBGaXJlZm94IHZlcnNpb24pIGFyZSBrbm93blxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxuICpcbiAqIFRPRE86IGFkZCBhIGBsb2NhbFN0b3JhZ2VgIHZhcmlhYmxlIHRvIGV4cGxpY2l0bHkgZW5hYmxlL2Rpc2FibGUgY29sb3JzXG4gKi9cblxuZnVuY3Rpb24gdXNlQ29sb3JzKCkge1xuICAvLyBOQjogSW4gYW4gRWxlY3Ryb24gcHJlbG9hZCBzY3JpcHQsIGRvY3VtZW50IHdpbGwgYmUgZGVmaW5lZCBidXQgbm90IGZ1bGx5XG4gIC8vIGluaXRpYWxpemVkLiBTaW5jZSB3ZSBrbm93IHdlJ3JlIGluIENocm9tZSwgd2UnbGwganVzdCBkZXRlY3QgdGhpcyBjYXNlXG4gIC8vIGV4cGxpY2l0bHlcbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5wcm9jZXNzICYmIHdpbmRvdy5wcm9jZXNzLnR5cGUgPT09ICdyZW5kZXJlcicpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIGlzIHdlYmtpdD8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTY0NTk2MDYvMzc2NzczXG4gIC8vIGRvY3VtZW50IGlzIHVuZGVmaW5lZCBpbiByZWFjdC1uYXRpdmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC1uYXRpdmUvcHVsbC8xNjMyXG4gIHJldHVybiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5XZWJraXRBcHBlYXJhbmNlKSB8fFxuICAgIC8vIGlzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcbiAgICAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmNvbnNvbGUgJiYgKHdpbmRvdy5jb25zb2xlLmZpcmVidWcgfHwgKHdpbmRvdy5jb25zb2xlLmV4Y2VwdGlvbiAmJiB3aW5kb3cuY29uc29sZS50YWJsZSkpKSB8fFxuICAgIC8vIGlzIGZpcmVmb3ggPj0gdjMxP1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuICAgICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKSB8fFxuICAgIC8vIGRvdWJsZSBjaGVjayB3ZWJraXQgaW4gdXNlckFnZW50IGp1c3QgaW4gY2FzZSB3ZSBhcmUgaW4gYSB3b3JrZXJcbiAgICAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2FwcGxld2Via2l0XFwvKFxcZCspLykpO1xufVxuXG4vKipcbiAqIE1hcCAlaiB0byBgSlNPTi5zdHJpbmdpZnkoKWAsIHNpbmNlIG5vIFdlYiBJbnNwZWN0b3JzIGRvIHRoYXQgYnkgZGVmYXVsdC5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdHRlcnMuaiA9IGZ1bmN0aW9uKHYpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiAnW1VuZXhwZWN0ZWRKU09OUGFyc2VFcnJvcl06ICcgKyBlcnIubWVzc2FnZTtcbiAgfVxufTtcblxuXG4vKipcbiAqIENvbG9yaXplIGxvZyBhcmd1bWVudHMgaWYgZW5hYmxlZC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGZvcm1hdEFyZ3MoYXJncykge1xuICB2YXIgdXNlQ29sb3JzID0gdGhpcy51c2VDb2xvcnM7XG5cbiAgYXJnc1swXSA9ICh1c2VDb2xvcnMgPyAnJWMnIDogJycpXG4gICAgKyB0aGlzLm5hbWVzcGFjZVxuICAgICsgKHVzZUNvbG9ycyA/ICcgJWMnIDogJyAnKVxuICAgICsgYXJnc1swXVxuICAgICsgKHVzZUNvbG9ycyA/ICclYyAnIDogJyAnKVxuICAgICsgJysnICsgZXhwb3J0cy5odW1hbml6ZSh0aGlzLmRpZmYpO1xuXG4gIGlmICghdXNlQ29sb3JzKSByZXR1cm47XG5cbiAgdmFyIGMgPSAnY29sb3I6ICcgKyB0aGlzLmNvbG9yO1xuICBhcmdzLnNwbGljZSgxLCAwLCBjLCAnY29sb3I6IGluaGVyaXQnKVxuXG4gIC8vIHRoZSBmaW5hbCBcIiVjXCIgaXMgc29tZXdoYXQgdHJpY2t5LCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG90aGVyXG4gIC8vIGFyZ3VtZW50cyBwYXNzZWQgZWl0aGVyIGJlZm9yZSBvciBhZnRlciB0aGUgJWMsIHNvIHdlIG5lZWQgdG9cbiAgLy8gZmlndXJlIG91dCB0aGUgY29ycmVjdCBpbmRleCB0byBpbnNlcnQgdGhlIENTUyBpbnRvXG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBsYXN0QyA9IDA7XG4gIGFyZ3NbMF0ucmVwbGFjZSgvJVthLXpBLVolXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIGlmICgnJSUnID09PSBtYXRjaCkgcmV0dXJuO1xuICAgIGluZGV4Kys7XG4gICAgaWYgKCclYycgPT09IG1hdGNoKSB7XG4gICAgICAvLyB3ZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIHRoZSAqbGFzdCogJWNcbiAgICAgIC8vICh0aGUgdXNlciBtYXkgaGF2ZSBwcm92aWRlZCB0aGVpciBvd24pXG4gICAgICBsYXN0QyA9IGluZGV4O1xuICAgIH1cbiAgfSk7XG5cbiAgYXJncy5zcGxpY2UobGFzdEMsIDAsIGMpO1xufVxuXG4vKipcbiAqIEludm9rZXMgYGNvbnNvbGUubG9nKClgIHdoZW4gYXZhaWxhYmxlLlxuICogTm8tb3Agd2hlbiBgY29uc29sZS5sb2dgIGlzIG5vdCBhIFwiZnVuY3Rpb25cIi5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGxvZygpIHtcbiAgLy8gdGhpcyBoYWNrZXJ5IGlzIHJlcXVpcmVkIGZvciBJRTgvOSwgd2hlcmVcbiAgLy8gdGhlIGBjb25zb2xlLmxvZ2AgZnVuY3Rpb24gZG9lc24ndCBoYXZlICdhcHBseSdcbiAgcmV0dXJuICdvYmplY3QnID09PSB0eXBlb2YgY29uc29sZVxuICAgICYmIGNvbnNvbGUubG9nXG4gICAgJiYgRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5LmNhbGwoY29uc29sZS5sb2csIGNvbnNvbGUsIGFyZ3VtZW50cyk7XG59XG5cbi8qKlxuICogU2F2ZSBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNhdmUobmFtZXNwYWNlcykge1xuICB0cnkge1xuICAgIGlmIChudWxsID09IG5hbWVzcGFjZXMpIHtcbiAgICAgIGV4cG9ydHMuc3RvcmFnZS5yZW1vdmVJdGVtKCdkZWJ1ZycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHBvcnRzLnN0b3JhZ2UuZGVidWcgPSBuYW1lc3BhY2VzO1xuICAgIH1cbiAgfSBjYXRjaChlKSB7fVxufVxuXG4vKipcbiAqIExvYWQgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gcmV0dXJucyB0aGUgcHJldmlvdXNseSBwZXJzaXN0ZWQgZGVidWcgbW9kZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvYWQoKSB7XG4gIHZhciByO1xuICB0cnkge1xuICAgIHIgPSBleHBvcnRzLnN0b3JhZ2UuZGVidWc7XG4gIH0gY2F0Y2goZSkge31cblxuICAvLyBJZiBkZWJ1ZyBpc24ndCBzZXQgaW4gTFMsIGFuZCB3ZSdyZSBpbiBFbGVjdHJvbiwgdHJ5IHRvIGxvYWQgJERFQlVHXG4gIGlmICghciAmJiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgJ2VudicgaW4gcHJvY2Vzcykge1xuICAgIHIgPSBwcm9jZXNzLmVudi5ERUJVRztcbiAgfVxuXG4gIHJldHVybiByO1xufVxuXG4vKipcbiAqIEVuYWJsZSBuYW1lc3BhY2VzIGxpc3RlZCBpbiBgbG9jYWxTdG9yYWdlLmRlYnVnYCBpbml0aWFsbHkuXG4gKi9cblxuZXhwb3J0cy5lbmFibGUobG9hZCgpKTtcblxuLyoqXG4gKiBMb2NhbHN0b3JhZ2UgYXR0ZW1wdHMgdG8gcmV0dXJuIHRoZSBsb2NhbHN0b3JhZ2UuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBzYWZhcmkgdGhyb3dzXG4gKiB3aGVuIGEgdXNlciBkaXNhYmxlcyBjb29raWVzL2xvY2Fsc3RvcmFnZVxuICogYW5kIHlvdSBhdHRlbXB0IHRvIGFjY2VzcyBpdC5cbiAqXG4gKiBAcmV0dXJuIHtMb2NhbFN0b3JhZ2V9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2NhbHN0b3JhZ2UoKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2U7XG4gIH0gY2F0Y2ggKGUpIHt9XG59XG4iLCJcbi8qKlxuICogVGhpcyBpcyB0aGUgY29tbW9uIGxvZ2ljIGZvciBib3RoIHRoZSBOb2RlLmpzIGFuZCB3ZWIgYnJvd3NlclxuICogaW1wbGVtZW50YXRpb25zIG9mIGBkZWJ1ZygpYC5cbiAqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gY3JlYXRlRGVidWcuZGVidWcgPSBjcmVhdGVEZWJ1Z1snZGVmYXVsdCddID0gY3JlYXRlRGVidWc7XG5leHBvcnRzLmNvZXJjZSA9IGNvZXJjZTtcbmV4cG9ydHMuZGlzYWJsZSA9IGRpc2FibGU7XG5leHBvcnRzLmVuYWJsZSA9IGVuYWJsZTtcbmV4cG9ydHMuZW5hYmxlZCA9IGVuYWJsZWQ7XG5leHBvcnRzLmh1bWFuaXplID0gcmVxdWlyZSgnbXMnKTtcblxuLyoqXG4gKiBUaGUgY3VycmVudGx5IGFjdGl2ZSBkZWJ1ZyBtb2RlIG5hbWVzLCBhbmQgbmFtZXMgdG8gc2tpcC5cbiAqL1xuXG5leHBvcnRzLm5hbWVzID0gW107XG5leHBvcnRzLnNraXBzID0gW107XG5cbi8qKlxuICogTWFwIG9mIHNwZWNpYWwgXCIlblwiIGhhbmRsaW5nIGZ1bmN0aW9ucywgZm9yIHRoZSBkZWJ1ZyBcImZvcm1hdFwiIGFyZ3VtZW50LlxuICpcbiAqIFZhbGlkIGtleSBuYW1lcyBhcmUgYSBzaW5nbGUsIGxvd2VyIG9yIHVwcGVyLWNhc2UgbGV0dGVyLCBpLmUuIFwiblwiIGFuZCBcIk5cIi5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdHRlcnMgPSB7fTtcblxuLyoqXG4gKiBQcmV2aW91cyBsb2cgdGltZXN0YW1wLlxuICovXG5cbnZhciBwcmV2VGltZTtcblxuLyoqXG4gKiBTZWxlY3QgYSBjb2xvci5cbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNlbGVjdENvbG9yKG5hbWVzcGFjZSkge1xuICB2YXIgaGFzaCA9IDAsIGk7XG5cbiAgZm9yIChpIGluIG5hbWVzcGFjZSkge1xuICAgIGhhc2ggID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBuYW1lc3BhY2UuY2hhckNvZGVBdChpKTtcbiAgICBoYXNoIHw9IDA7IC8vIENvbnZlcnQgdG8gMzJiaXQgaW50ZWdlclxuICB9XG5cbiAgcmV0dXJuIGV4cG9ydHMuY29sb3JzW01hdGguYWJzKGhhc2gpICUgZXhwb3J0cy5jb2xvcnMubGVuZ3RoXTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gY3JlYXRlRGVidWcobmFtZXNwYWNlKSB7XG5cbiAgZnVuY3Rpb24gZGVidWcoKSB7XG4gICAgLy8gZGlzYWJsZWQ/XG4gICAgaWYgKCFkZWJ1Zy5lbmFibGVkKSByZXR1cm47XG5cbiAgICB2YXIgc2VsZiA9IGRlYnVnO1xuXG4gICAgLy8gc2V0IGBkaWZmYCB0aW1lc3RhbXBcbiAgICB2YXIgY3VyciA9ICtuZXcgRGF0ZSgpO1xuICAgIHZhciBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG4gICAgc2VsZi5kaWZmID0gbXM7XG4gICAgc2VsZi5wcmV2ID0gcHJldlRpbWU7XG4gICAgc2VsZi5jdXJyID0gY3VycjtcbiAgICBwcmV2VGltZSA9IGN1cnI7XG5cbiAgICAvLyB0dXJuIHRoZSBgYXJndW1lbnRzYCBpbnRvIGEgcHJvcGVyIEFycmF5XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhcmdzW2ldID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGFyZ3NbMF0gPSBleHBvcnRzLmNvZXJjZShhcmdzWzBdKTtcblxuICAgIGlmICgnc3RyaW5nJyAhPT0gdHlwZW9mIGFyZ3NbMF0pIHtcbiAgICAgIC8vIGFueXRoaW5nIGVsc2UgbGV0J3MgaW5zcGVjdCB3aXRoICVPXG4gICAgICBhcmdzLnVuc2hpZnQoJyVPJyk7XG4gICAgfVxuXG4gICAgLy8gYXBwbHkgYW55IGBmb3JtYXR0ZXJzYCB0cmFuc2Zvcm1hdGlvbnNcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIGFyZ3NbMF0gPSBhcmdzWzBdLnJlcGxhY2UoLyUoW2EtekEtWiVdKS9nLCBmdW5jdGlvbihtYXRjaCwgZm9ybWF0KSB7XG4gICAgICAvLyBpZiB3ZSBlbmNvdW50ZXIgYW4gZXNjYXBlZCAlIHRoZW4gZG9uJ3QgaW5jcmVhc2UgdGhlIGFycmF5IGluZGV4XG4gICAgICBpZiAobWF0Y2ggPT09ICclJScpIHJldHVybiBtYXRjaDtcbiAgICAgIGluZGV4Kys7XG4gICAgICB2YXIgZm9ybWF0dGVyID0gZXhwb3J0cy5mb3JtYXR0ZXJzW2Zvcm1hdF07XG4gICAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGZvcm1hdHRlcikge1xuICAgICAgICB2YXIgdmFsID0gYXJnc1tpbmRleF07XG4gICAgICAgIG1hdGNoID0gZm9ybWF0dGVyLmNhbGwoc2VsZiwgdmFsKTtcblxuICAgICAgICAvLyBub3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXG4gICAgICAgIGFyZ3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaW5kZXgtLTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcblxuICAgIC8vIGFwcGx5IGVudi1zcGVjaWZpYyBmb3JtYXR0aW5nIChjb2xvcnMsIGV0Yy4pXG4gICAgZXhwb3J0cy5mb3JtYXRBcmdzLmNhbGwoc2VsZiwgYXJncyk7XG5cbiAgICB2YXIgbG9nRm4gPSBkZWJ1Zy5sb2cgfHwgZXhwb3J0cy5sb2cgfHwgY29uc29sZS5sb2cuYmluZChjb25zb2xlKTtcbiAgICBsb2dGbi5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxuXG4gIGRlYnVnLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcbiAgZGVidWcuZW5hYmxlZCA9IGV4cG9ydHMuZW5hYmxlZChuYW1lc3BhY2UpO1xuICBkZWJ1Zy51c2VDb2xvcnMgPSBleHBvcnRzLnVzZUNvbG9ycygpO1xuICBkZWJ1Zy5jb2xvciA9IHNlbGVjdENvbG9yKG5hbWVzcGFjZSk7XG5cbiAgLy8gZW52LXNwZWNpZmljIGluaXRpYWxpemF0aW9uIGxvZ2ljIGZvciBkZWJ1ZyBpbnN0YW5jZXNcbiAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBleHBvcnRzLmluaXQpIHtcbiAgICBleHBvcnRzLmluaXQoZGVidWcpO1xuICB9XG5cbiAgcmV0dXJuIGRlYnVnO1xufVxuXG4vKipcbiAqIEVuYWJsZXMgYSBkZWJ1ZyBtb2RlIGJ5IG5hbWVzcGFjZXMuIFRoaXMgY2FuIGluY2x1ZGUgbW9kZXNcbiAqIHNlcGFyYXRlZCBieSBhIGNvbG9uIGFuZCB3aWxkY2FyZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlKG5hbWVzcGFjZXMpIHtcbiAgZXhwb3J0cy5zYXZlKG5hbWVzcGFjZXMpO1xuXG4gIGV4cG9ydHMubmFtZXMgPSBbXTtcbiAgZXhwb3J0cy5za2lwcyA9IFtdO1xuXG4gIHZhciBzcGxpdCA9ICh0eXBlb2YgbmFtZXNwYWNlcyA9PT0gJ3N0cmluZycgPyBuYW1lc3BhY2VzIDogJycpLnNwbGl0KC9bXFxzLF0rLyk7XG4gIHZhciBsZW4gPSBzcGxpdC5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICghc3BsaXRbaV0pIGNvbnRpbnVlOyAvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuICAgIG5hbWVzcGFjZXMgPSBzcGxpdFtpXS5yZXBsYWNlKC9cXCovZywgJy4qPycpO1xuICAgIGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcbiAgICAgIGV4cG9ydHMuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMgKyAnJCcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRpc2FibGUoKSB7XG4gIGV4cG9ydHMuZW5hYmxlKCcnKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZWQobmFtZSkge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLnNraXBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMuc2tpcHNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMubmFtZXNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDb2VyY2UgYHZhbGAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuICByZXR1cm4gdmFsO1xufVxuIiwiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB5ID0gZCAqIDM2NS4yNTtcblxuLyoqXG4gKiBQYXJzZSBvciBmb3JtYXQgdGhlIGdpdmVuIGB2YWxgLlxuICpcbiAqIE9wdGlvbnM6XG4gKlxuICogIC0gYGxvbmdgIHZlcmJvc2UgZm9ybWF0dGluZyBbZmFsc2VdXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSB2YWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEB0aHJvd3Mge0Vycm9yfSB0aHJvdyBhbiBlcnJvciBpZiB2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIG51bWJlclxuICogQHJldHVybiB7U3RyaW5nfE51bWJlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWwsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbDtcbiAgaWYgKHR5cGUgPT09ICdzdHJpbmcnICYmIHZhbC5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIHBhcnNlKHZhbCk7XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ251bWJlcicgJiYgaXNOYU4odmFsKSA9PT0gZmFsc2UpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5sb25nID8gZm10TG9uZyh2YWwpIDogZm10U2hvcnQodmFsKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgJ3ZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgdmFsaWQgbnVtYmVyLiB2YWw9JyArXG4gICAgICBKU09OLnN0cmluZ2lmeSh2YWwpXG4gICk7XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgc3RyID0gU3RyaW5nKHN0cik7XG4gIGlmIChzdHIubGVuZ3RoID4gMTAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBtYXRjaCA9IC9eKCg/OlxcZCspP1xcLj9cXGQrKSAqKG1pbGxpc2Vjb25kcz98bXNlY3M/fG1zfHNlY29uZHM/fHNlY3M/fHN8bWludXRlcz98bWlucz98bXxob3Vycz98aHJzP3xofGRheXM/fGR8eWVhcnM/fHlycz98eSk/JC9pLmV4ZWMoXG4gICAgc3RyXG4gICk7XG4gIGlmICghbWF0Y2gpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIG4gPSBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgdmFyIHR5cGUgPSAobWF0Y2hbMl0gfHwgJ21zJykudG9Mb3dlckNhc2UoKTtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAneWVhcnMnOlxuICAgIGNhc2UgJ3llYXInOlxuICAgIGNhc2UgJ3lycyc6XG4gICAgY2FzZSAneXInOlxuICAgIGNhc2UgJ3knOlxuICAgICAgcmV0dXJuIG4gKiB5O1xuICAgIGNhc2UgJ2RheXMnOlxuICAgIGNhc2UgJ2RheSc6XG4gICAgY2FzZSAnZCc6XG4gICAgICByZXR1cm4gbiAqIGQ7XG4gICAgY2FzZSAnaG91cnMnOlxuICAgIGNhc2UgJ2hvdXInOlxuICAgIGNhc2UgJ2hycyc6XG4gICAgY2FzZSAnaHInOlxuICAgIGNhc2UgJ2gnOlxuICAgICAgcmV0dXJuIG4gKiBoO1xuICAgIGNhc2UgJ21pbnV0ZXMnOlxuICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgY2FzZSAnbWlucyc6XG4gICAgY2FzZSAnbWluJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3NlY3MnOlxuICAgIGNhc2UgJ3NlYyc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICBjYXNlICdtaWxsaXNlY29uZCc6XG4gICAgY2FzZSAnbXNlY3MnOlxuICAgIGNhc2UgJ21zZWMnOlxuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10U2hvcnQobXMpIHtcbiAgaWYgKG1zID49IGQpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGQpICsgJ2QnO1xuICB9XG4gIGlmIChtcyA+PSBoKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBoKSArICdoJztcbiAgfVxuICBpZiAobXMgPj0gbSkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gbSkgKyAnbSc7XG4gIH1cbiAgaWYgKG1zID49IHMpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIHMpICsgJ3MnO1xuICB9XG4gIHJldHVybiBtcyArICdtcyc7XG59XG5cbi8qKlxuICogTG9uZyBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBmbXRMb25nKG1zKSB7XG4gIHJldHVybiBwbHVyYWwobXMsIGQsICdkYXknKSB8fFxuICAgIHBsdXJhbChtcywgaCwgJ2hvdXInKSB8fFxuICAgIHBsdXJhbChtcywgbSwgJ21pbnV0ZScpIHx8XG4gICAgcGx1cmFsKG1zLCBzLCAnc2Vjb25kJykgfHxcbiAgICBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbiwgbmFtZSkge1xuICBpZiAobXMgPCBuKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChtcyA8IG4gKiAxLjUpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihtcyAvIG4pICsgJyAnICsgbmFtZTtcbiAgfVxuICByZXR1cm4gTWF0aC5jZWlsKG1zIC8gbikgKyAnICcgKyBuYW1lICsgJ3MnO1xufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiJdfQ==
