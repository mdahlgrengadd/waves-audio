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
import PhaseVocoder from './PV_fast_5';
//import PhaseVocoder from '../utils/PV_fast_pulsefft';
import audioContext from '../core/audio-context';

function PV(frameSize) {

	var _frameSize = frameSize || 4096;
	
	let _pvL =  new PhaseVocoder(_frameSize, audioContext.sampleRate); _pvL.init();
	let _pvR =  new PhaseVocoder(_frameSize, audioContext.sampleRate); _pvR.init();

	var _buffer;
	var _position = 0;
	var _newAlpha = 1;

	var _midBufL = new CBuffer(Math.round(_frameSize * 2));
	var _midBufR = new CBuffer(Math.round(_frameSize * 2));

	this.processMono = function(outputAudioBuffer) {

		if (!_buffer) {
			console.error("No input buffer");
			return;
		}

		var sampleCounter = 0;

        var il = _buffer.getChannelData(0);
        var ir = _buffer.getChannelData(0);
        var ol = outputAudioBuffer.getChannelData(0);
        var or = outputAudioBuffer.getChannelData(1);


        while (_midBufR.size > 0 && sampleCounter < outputAudioBuffer.length) {
          var i = sampleCounter++;
          ol[i] = _midBufL.shift();
          or[i] = _midBufR.shift();
        }

        if (sampleCounter == outputAudioBuffer.length)
          return;

        do {

          var bufL = il.subarray(_position, _position + _frameSize);
          var bufR = ir.subarray(_position, _position + _frameSize);

          if (_newAlpha != undefined && _newAlpha != _pvL.get_alpha()) {
            _pvL.set_alpha(_newAlpha);
            _pvR.set_alpha(_newAlpha);
            _newAlpha = undefined;
          }


          /* LEFT */
          _pvL.process(bufL, _midBufL);
          _pvR.process(bufR, _midBufR);
          for (var i=sampleCounter; _midBufL.size > 0 && i < outputAudioBuffer.length; i++) {
            ol[i] = _midBufL.shift();
            or[i] = _midBufR.shift();
          }

          sampleCounter += _pvL.get_synthesis_hop();

          _position
           += _pvL.get_analysis_hop();

        } while (sampleCounter < outputAudioBuffer.length);
	}

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


		while (_midBufR.size > 0 && sampleCounter < outputAudioBuffer.length) {
			var i = sampleCounter++;
			ol[i] = _midBufL.shift();
			or[i] = _midBufR.shift();
		}

		if (sampleCounter == outputAudioBuffer.length)
			return;

		do {

			var bufL = il.subarray(_position, _position + _frameSize);
			var bufR = ir.subarray(_position, _position + _frameSize);

			if (_newAlpha != undefined && _newAlpha != _pvL.get_alpha()) {
				_pvL.set_alpha(_newAlpha);
				_pvR.set_alpha(_newAlpha);
				_newAlpha = undefined;
			}


			/* LEFT */
			_pvL.process(bufL, _midBufL);
			_pvR.process(bufR, _midBufR);
			
			for (var i = sampleCounter; _midBufL.size > 0 && i < outputAudioBuffer.length; i++) {
				ol[i] = _midBufL.shift();
				or[i] = _midBufR.shift();
				
			}
			
			sampleCounter += _pvL.get_synthesis_hop();

			_position
				+= _pvL.get_analysis_hop();

		} while (sampleCounter < outputAudioBuffer.length);
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
		'alpha' : {
			get : function() {
				return _pvL.get_alpha();
			}, 
			set : function(newAlpha) {
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