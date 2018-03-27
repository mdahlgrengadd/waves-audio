import AudioTimeEngine from '../core/audio-time-engine';
import SegmentEngine from './segment-engine';

function optOrDef(opt, def) {
    if (opt !== undefined)
        return opt;

    return def;
}

function getCurrentOrPreviousIndex(sortedArray, value, index = -1) {
    var size = sortedArray.length;

    if (size > 0) {
        var firstVal = sortedArray[0];
        var lastVal = sortedArray[size - 1];

        if (value < firstVal)
            index = -1;
        else if (value >= lastVal)
            index = size - 1;
        else {
            if (index < 0 || index >= size)
                index = Math.floor((size - 1) * (value - firstVal) / (lastVal - firstVal));

            while (sortedArray[index] > value)
                index--;

            while (sortedArray[index + 1] <= value)
                index++;
        }
    }

    return index;
}

function getCurrentOrNextIndex(sortedArray, value, index = -1) {
    var size = sortedArray.length;

    if (size > 0) {
        var firstVal = sortedArray[0];
        var lastVal = sortedArray[size - 1];

        if (value <= firstVal)
            index = 0;
        else if (value >= lastVal)
            index = size;
        else {
            if (index < 0 || index >= size)
                index = Math.floor((size - 1) * (value - firstVal) / (lastVal - firstVal));

            while (sortedArray[index] < value)
                index++;

            while (sortedArray[index - 1] >= value)
                index--;
        }
    }

    return index;
}

/**
 * @class SequencerEngine
 */
export default class SequencerEngine extends SegmentEngine {
    /**
     * @constructor
     * @param {AudioBuffer} buffer initial audio buffer for granular synthesis
     *
     * The engine implements the "scheduled" and "transported" interfaces.
     * When "scheduled", the engine  generates segments more or less periodically
     * (controlled by the periodAbs, periodRel, and perioVar attributes).
     * When "transported", the engine generates segments at the position of their onset time.
     */
    constructor(options = {}) {
        super(options);
        /**
         * A function callback that gets called from trigger().
         * This lets you set up events to be triggered by the sequencer.
         * @type {Function}
         */
        this.callback = optOrDef(options.callback, null);

    }

    /**
     * Trigger a segment
     * @param {Number} time segment synthesis audio time
     * @return {Number} period to next segment
     *
     * This function can be called at any time (whether the engine is scheduled/transported or not)
     * to generate a single segment according to the current segment parameters.
     */
    trigger(time) {
        var audioContext = this.audioContext;
        var segmentTime = (time || audioContext.currentTime) + this.delay;
        var segmentPeriod = this.periodAbs;
        var segmentIndex = this.segmentIndex;

        // Ignore buffer for now, this is a sequncer... no audio produced.
        if ( /*this.buffer*/ true) {
            var segmentPosition = 0.0;
            var segmentDuration = 0.0;
            var segmentOffset = 0.0;
            var resamplingRate = 1.0;
            var bufferDuration = this.bufferDuration;

            if (this.cyclic)
                segmentIndex = segmentIndex % this.positionArray.length;
            else
                segmentIndex = Math.max(0, Math.min(segmentIndex, this.positionArray.length - 1));

            if (this.positionArray)
                segmentPosition = this.positionArray[segmentIndex] || 0;

            if (this.durationArray)
                segmentDuration = this.durationArray[segmentIndex] || 0;

            if (this.offsetArray)
                segmentOffset = this.offsetArray[segmentIndex] || 0;

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
                if (segmentOffset > 0)
                    interSegmentDistance -= segmentOffset;

                if (nextOffset > 0)
                    interSegmentDistance += nextOffset;

                if (interSegmentDistance < 0)
                    interSegmentDistance = 0;

                // use inter-segment distance instead of segment duration
                if (segmentDuration === 0)
                    segmentDuration = interSegmentDistance;

                // calculate period relative to inter marker distance
                segmentPeriod += this.periodRel * interSegmentDistance;
            }
            /*
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
                segmentTime += (segmentOffset / resamplingRate);
            } else {
                segmentTime -= (segmentOffset / resamplingRate);
            }

            // randomize segment position
            if (this.positionVar > 0)
                segmentPosition += 2.0 * (Math.random() - 0.5) * this.positionVar;

            // shorten duration of segments over the edges of the buffer
            if (segmentPosition < 0) {
                //segmentTime -= grainPosition; hm, not sure if we want to do this
                segmentDuration += segmentPosition;
                segmentPosition = 0;
            }

            if (segmentPosition + segmentDuration > this.buffer.duration)
                segmentDuration = this.buffer.duration - segmentPosition;

            segmentDuration /= resamplingRate;

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

              if (releaseStartTime > attackEndTime)
                envelope.gain.setValueAtTime(this.gain, releaseStartTime);

              envelope.gain.linearRampToValueAtTime(0.0, segmentEndTime);
              envelope.connect(this.outputNode);

              // make source
              var source = audioContext.createBufferSource();

              source.buffer = this.buffer;
              source.playbackRate.value = resamplingRate;
              source.connect(envelope);

              source.start(segmentTime, segmentPosition);
              source.stop(segmentTime + segmentDuration);
            }*/
        }


        if (this.callback && Object.prototype.toString.call(this.callback) == '[object Function]') {
            var result = this.callback(segmentIndex);
            //if (result)
            //    console.log(result);
        }

        //console.log("Sequencer.Trigger: " + segmentIndex + " Position: " + segmentPosition);

        // grain period randon variation
        if (this.periodVar > 0.0)
            segmentPeriod += 2.0 * (Math.random() - 0.5) * this.periodVar * grainPeriod;

        return Math.max(this.periodMin, segmentPeriod);
    }
}