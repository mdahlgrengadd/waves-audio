/*  From PhaseVocoder.js (c) 2015 by Echo66
    https://github.com/echo66/PhaseVocoderJS

	This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import CBuffer from './cbuffer';
//import PhaseVocoder from './PV_fast_5';
import PhaseVocoder from '../utils/PV_fast_pulsefft';
import audioContext from '../core/audio-context';

function PV(frameSize) {

	var _frameSize = frameSize || 4096;
	
	let _pvL =  new PhaseVocoder(_frameSize, audioContext.sampleRate); _pvL.init();
	let _pvR =  new PhaseVocoder(_frameSize, audioContext.sampleRate); _pvR.init();
    this.outBufferL = [];
    this.outBufferR = [];
	var _buffer;
	var _position = 0;
	var _newAlpha = 1;

	this.processStereo = function (outputAudioBuffer) {

		if (!_buffer || _buffer.numberOfChannels != 2) {
			console.error("No input buffer or wrong number of channels")
			return;
		}

		var sampleCounter = 0;

		var il = _buffer.getChannelData(0);
		var ir = _buffer.getChannelData(1);
		var ol = outputAudioBuffer.getChannelData(0);
		var or = outputAudioBuffer.getChannelData(1);

        // Fill output buffers (left & right) until the system has 
        // enough processed samples to reproduce.
        do {

            // var bufL = new Float64Array(BUFFER_SIZE/div);
            // var bufR = new Float64Array(BUFFER_SIZE/div);

            if (_newAlpha != undefined && _newAlpha != _pvL.get_alpha()) {
                _pvL.set_alpha(_newAlpha);
                _pvR.set_alpha(_newAlpha);
                _newAlpha = undefined;
            }


            var bufL = il.subarray(this.position, this.position + frameSize );
            var bufR = ir.subarray(this.position, this.position + frameSize );

            this.position += _pvL.get_analysis_hop();

            // Process left input channel
            this.outBufferL = this.outBufferL.concat(_pvL.process(bufL));

            // Process right input channel
            this.outBufferR = this.outBufferR.concat(_pvR.process(bufR));

        } while (this.outBufferL.length < frameSize);

        ol.set(this.outBufferL.splice(0, frameSize));
        or.set(this.outBufferR.splice(0, frameSize));
	}

	this.process = this.processMono;

	this.set_audio_buffer = function(newBuffer) {
		_buffer = newBuffer;
		if (_buffer.numberOfChannels == 2)
			this.process = this.processStereo;
		else
			this.process = this.processMono;		
		_position = 0;
        _newAlpha = 1;

	}

	this.resetPhase = function() {
		_pvL.reset_phases();
		_pvR.reset_phases();
	}
	
	Object.defineProperties(this, {
		'position' : {
			get : function() {
				return _position;
			}, 
			set : function(newPosition) {
				_position = newPosition;
			}
		}, 
        'alpha': {
            get: function () {
                return _pvL.get_alpha();
            },
            set: function (newAlpha) {
                _newAlpha = newAlpha;
            }
        },
		'STFT': {
			get: function () {
				return _pvL.STFT;
			},
			set: function (newSTFT) {
				_pvL.STFT = newSTFT;
				_pvR.STFT = newSTFT;
			}
		},
		'ISTFT': {
			get: function () {
				return _pvL.ISTFT;
			},
			set: function (newISTFT) {
				_pvL.ISTFT = newISTFT;
				_pvR.ISTFT = newISTFT;
			}
		}
	});
}

export default PV;