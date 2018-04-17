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
import audioContext from '../core/audio-context';

function BufferedPV(frameSize) {

	var _frameSize = frameSize || 4096;
	var _pvL = new PhaseVocoder(_frameSize, 44100); _pvL.init();
	var _pvR = new PhaseVocoder(_frameSize, 44100); _pvR.init();
	var _buffer;
	var _position = 0;
	var _newAlpha = 1;

	var _midBufL = new CBuffer(Math.round(_frameSize * 2));
	var _midBufR = new CBuffer(Math.round(_frameSize * 2));

	

	this.process = function(outputAudioBuffer) {

		if (!_buffer) 
			return;

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

	this.set_audio_buffer = function(newBuffer) {
		_buffer = newBuffer;
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
		}
	});
}

export default BufferedPV;