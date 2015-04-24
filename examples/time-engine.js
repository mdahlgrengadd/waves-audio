// This example shows a *scheduled* `TimeEngine` counting up at a given frequency.

var audioContext = wavesAudio.audioContext;
var scheduler = wavesAudio.getScheduler();
var containerId = '#time-engine-container';

// Counter TimeEngine class
// The engine counts up at a given frequency.
// When the frequency changes, the engine is rescheduled accordingly.
function Counter() {
  // call TimeEngine constructor
  wavesAudio.TimeEngine.call(this);

  this.count = 0; // current count
  this.period = 0; // current period
  this.lastTime = 0; // last counter time
}

// extend TimeEngine prototype
Counter.prototype = Object.create(wavesAudio.TimeEngine.prototype, {
  constructor: {
    value: Counter,
  },
});

// TimeEngine scheduled interface method
Counter.prototype.advanceTime = function(time) {
  var count = this.count;

  counterSlider.value = count;

  // increment counter
  count = (count + 1) % 100;
  this.count = count;

  // remeber time to reschedule properly when changing frequency
  this.lastTime = time;

  // advance to next time
  return time + this.period;
};

// set frequency method
Counter.prototype.setFreq = function(freq) {
  var period = 0;

  // set period
  if (freq > 0)
    period = 1 / freq;

  if (period > 0 && this.period === 0)
    this.resetTime(); // start counter now
  else if (period === 0 && this.period > 0)
    this.resetTime(Infinity); // stop counter
  else if (period > 0) {
    // continue playing with new period
    var nextTime = this.lastTime + period;

    // reschedule counter according to new period (when next time > current scheduler time)
    if (nextTime > scheduler.currentTime)
      this.resetTime(nextTime);
  }

  this.period = period;
};

// create counter engine and add it to the scheduler without running it (i.e. at Infinity)
var counter = new Counter();
scheduler.add(counter, Infinity);

// create GUI elements
new wavesBasicControllers.Slider("Frequency", 0, 250, 1, 0, "Hz", '', containerId, function(value) {
  counter.setFreq(value);
});

counterSlider = new wavesBasicControllers.Slider("Counter", 0, 99, 1, 0, "", '', containerId, function(value) {
  counter.count = value;
});