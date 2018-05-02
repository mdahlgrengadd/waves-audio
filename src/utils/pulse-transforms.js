window.Module = {};
window.script = {};
window.doneEvent = {};

export default class PulseFFTTransforms {

    static instance;
    static pulse;
    
    constructor(winSize) {
        if (this.instance) {
            return this.instance;
        }
    
        this.instance = this;
        this.winSize = winSize;
    }
    init() {
        return new Promise((resolve, reject) => {
            fetch('assets/pulse/src/WASMkissFFT.wasm')
                .then(console.log("made it into loadpulse"))
                .then(response => response.arrayBuffer())
                .then(console.log("step into m"))
                .then((m) => {
                    Module.wasmBinary = m;

                    script = document.createElement('script');
                    script.src = 'assets/pulse/src/wasmkissfft.js';
                    script.type = 'text/javascript';
                    script.onload = () => {
                        console.log("Loaded Emscripten.");
                    };
                    doneEvent = new Event('done');
                    script.addEventListener('done', buildPulse);
                    document.body.appendChild(script);

                    function buildPulse() {
                        const pulse = {};

                        pulse['fftComplex'] = function (size) {
                            this.size = size;
                            this.fcfg = _kiss_fft_alloc(size, false);
                            this.icfg = _kiss_fft_alloc(size, true);

                            this.inptr = _malloc(size * 8 + size * 8);
                            this.outptr = this.inptr + size * 8;

                            this.cin = new Float32Array(HEAPU8.buffer, this.inptr, size * 2);
                            this.cout = new Float32Array(HEAPU8.buffer, this.outptr, size * 2);

                            this.forward = function (cin) {
                                this.cin.set(cin);
                                _kiss_fft(this.fcfg, this.inptr, this.outptr);
                                return new Float32Array(HEAPU8.buffer,
                                    this.outptr, this.size * 2);
                            }
                            this.inverse = function (cin) {
                                this.cin.set(cin);//was cpx?
                                _kiss_fft(this.icfg, this.inptr, this.outptr);
                                return new Float32Array(HEAPU8.buffer,
                                    this.outptr, this.size * 2);
                            }
                            this.dispose = function () {
                                _free(this.inptr);
                                _free(this.fcfg);
                                _free(this.icfg);
                            }
                        };
                        pulse['fftReal'] = function (size) {
                            this.size = size;
                            this.fcfg = _kiss_fftr_alloc(size, false);
                            this.icfg = _kiss_fftr_alloc(size, true);

                            this.rptr = _malloc(size * 4 + (size + 2) * 4);
                            this.cptr = this.rptr + size * 4;

                            this.ri = new Float32Array(HEAPU8.buffer, this.rptr, size);
                            this.ci = new Float32Array(HEAPU8.buffer, this.cptr, size + 2);

                            this.forward = function (real) {
                                this.ri.set(real);
                                _kiss_fftr(this.fcfg, this.rptr, this.cptr);
                                return new Float32Array(HEAPU8.buffer, this.cptr, this.size + 2); //changed here
                            }
                            this.inverse = function (cpx) {
                                this.ci.set(cpx);
                                _kiss_fftri(this.icfg, this.cptr, this.rptr);
                                return new Float32Array(HEAPU8.buffer, this.rptr, this.size);
                            }
                            this.dispose = function () {
                                _free(this.rptr);
                                _free(this.fcfg);
                                _free(this.icfg);
                            }
                        }


                        resolve(pulse);

                    }
                })
        }).then((pulse) => { 
            
            this._fftProcessor = new pulse.fftReal(this.winSize)
            this._ifftProcessor = new pulse.fftComplex(this.winSize);
            
                this.STFT =  (inputFrame, windowFrame, wantedSize, out) => {
                var winSize = windowFrame.length;
                var _inputFrame = new Array(winSize);
                var fftFrame = new Array(2 * winSize);

                for (var i = 0; i < winSize; i++) {
                    _inputFrame[i] = inputFrame[i] * windowFrame[i];
                }

                
                fftFrame = this._fftProcessor.forward(_inputFrame);

                for (var p = 0; p < winSize && p < wantedSize; p++) {
                    var real = out.real; var imag = out.imag;
                    var phase = out.phase; var magnitude = out.magnitude;
                    real[p] = fftFrame[2 * p];
                    imag[p] = fftFrame[2 * p + 1];
                    magnitude[p] = Math.sqrt(imag[p] * imag[p] + real[p] * real[p]);
                    phase[p] = Math.atan2(imag[p], real[p]);
                }

                return;
            }

            this.STFTv2 =  (inputFrame, windowFrame, wantedSize, out) => {
                var winSize = windowFrame.length;
                var _inputFrame = new Array(winSize);
                var fftFrame = new Array(2 * winSize);

                for (var i = 0; i < winSize; i++) {
                    _inputFrame[i] = inputFrame[i] * windowFrame[i];
                }

                fftFrame = this._fftProcessor.forward(_inputFrame);

                for (var p = 0; p < winSize && p < wantedSize; p++) {
                    var real = out.real; var imag = out.imag;
                    real[p] = fftFrame[2 * p];
                    imag[p] = fftFrame[2 * p + 1];
                }

                return;
            }

            this.ISTFT =  (real, imaginary, windowFrame, restoreEnergy, output2) => {
                var input = new Array(2 * real.length);
                var output1 = new Array(2 * real.length);

                for (var i = 0; i < real.length; i++) {
                    input[2 * i] = real[i];
                    input[2 * i + 1] = imaginary[i];
                }

                output1 = this._ifftProcessor.inverse(input);

                if (restoreEnergy) {
                    var energy1 = 0;
                    var energy2 = 0;
                    var eps = 2.2204e-16;
                    for (var i = 0; i < windowFrame.length; i++) {
                        energy1 += Math.abs(output1[2 * i]);
                        output2[i] = output1[2 * i] / windowFrame.length;
                        output2[i] *= windowFrame[i];
                        energy2 += Math.abs(output1[2 * i]);
                        output2[i] *= energy1 / (energy2 + eps);
                    }
                } else if (windowFrame) {
                    for (var i = 0; i < windowFrame.length; i++) {
                        output2[i] = output1[2 * i] / windowFrame.length;
                        output2[i] *= windowFrame[i];
                    }
                } else {
                    for (var i = 0; i < real.length; i++) {
                        output2[i] = output1[2 * i] / real.length;
                    }
                }

                return;
            }


            return this;
        
        });
    }
}
