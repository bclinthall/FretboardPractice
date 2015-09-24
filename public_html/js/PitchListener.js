/*
 * @class
 * @param {function(number)} onListen Called every animation from with a 
 * correlation score as its argument.  A correlation score of 5 means we are 
 * probably hearing the note you are listening for.
 * @param {function(error)} onPermissionDenied
 * @param {integer} smoothing
 * @returns {PitchListener.Anonym$1}
 */

function PitchListener(onListen, onPermissionDenied, smoothing) {
    var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
    var audioContext = new AudioContext();
    var sampleRate = audioContext.sampleRate;
    var fftSize = 1024;
    var wholeWaves;
    var samplesPerWave;
    var samplesPerHalfWave;
    var samplesToGet;
    var lastSampleToCheck;
    var smooth;
    var micNode;
    var analyser;
    var listening = false;
    var audioStream;
    var note;
    var frequency;
    smoothing = smoothing || 10;
    var numeric = new RegExp(/^[\d\.]+$/);
    function isNumeric(a) {
        return numeric.test(a);
    }
    var scaleForMidi = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    function midiToFrequency(midi) {
        var aOffset = midi - 69;
        var a = 440;
        return a * Math.pow(2, aOffset / 12);
    }
    function noteToMidi(note) {
        var n = note.substring(0, note.length - 1);
        var o = parseInt(note.substring(note.length - 1));
        var noteIndex = scaleForMidi.indexOf(n);
        o++;
        return o * 12 + noteIndex;
    }
    function noteToFrequency(note) {
        return midiToFrequency(noteToMidi(note));
    }
    var Smoother = function(size) {
        var ary = [];
        var average = function() {
            var tot = 0;
            var l = ary.length
            for (var i = 0; i < l; i++) {
                tot += ary[i];
            }
            return tot / l;
        };
        var smooth = function(val) {
			if(val==="reset"){
				ary = []
			}else if(val==="current"){
				return average();
			}else{
				ary.push(val);
				if(ary.length>size){
					ary.shift();
				}
				return average();
			}
        };
        return smooth;
    };
    smooth = new Smoother(smoothing);
    var listenFor = function(newNote) {
        if (isNumeric(newNote)) {
            frequency = parseFloat(newNote);
        }else{
            note = newNote;
            frequency = noteToFrequency(note);
        }
        
        samplesPerWave = sampleRate / frequency;
        samplesPerHalfWave = samplesPerWave / 2;
        
        while(fftSize < (samplesPerWave * 4) && fftSize < 32768){
            fftSize *= 2;
        }
        while(fftSize > samplesPerWave * 8 && fftSize > 1024){
            fftSize /=2;
        }
        if(analyser) analyser.fftSize = fftSize;
        wholeWaves = Math.floor(fftSize / samplesPerWave);
        samplesPerWave = Math.floor(samplesPerWave);
        samplesPerHalfWave = Math.floor(samplesPerHalfWave);
        samplesToGet = samplesPerWave * wholeWaves;
        lastSampleToCheck = samplesToGet - samplesPerWave;
        smooth("reset");
        //we want an fft size that lets between eight and sixteen whole waves be represented;
    };
    function getCorrelation(array) {
        var correlation = 0;
        var volume = 0;
        var iVal;
        var correlationOctaveUp = 0;
        /*
         * We are checking for repetition in the wave form data.  If we are 
         * listening for E3 (so "samplesPerWave" is numer of samples per E3 was)
         * then when an E3 is play, we will see repetition every samplesPerWave 
         * samples.  Tricky thing is, is there is repetition every samplesPerHalfWave, 
         * as there is when we hear an E4, then there will, of course, also be 
         * repetition every samplesPerWave.  We don't want to misidentify an E4
         * as an E3.  An E3 won't have repetition every samplesPerHalfWave, so
         * we check both.  We want something that repeats every samplesPerWave,
         * but not every samplesPerHalfWave.
         * 
         */
        for (var i = 0; i < lastSampleToCheck; i++) {
            iVal = array[i];
            correlation +=           Math.abs(iVal - array[i + samplesPerWave]);
            correlationOctaveUp +=   Math.abs(iVal - array[i + samplesPerHalfWave]);
            volume += Math.abs(iVal);
        }
        
        
        correlation = volume/correlation;
        correlationOctaveUp = volume/correlationOctaveUp;
        
       
        //a return value of 5 means that you are probably hearing 
        //the note you are looking for.
        return correlation - correlationOctaveUp;

    }
    var smoothTarget = new Smoother(5);
    var baseTarget = 2.5;
    var target = baseTarget;
    smoothTarget(target);
    var checkTarget = function(lastCor){
		var score = lastCor/target;
		if(lastCor > target){
			if(lastCor>baseTarget){
				target = smoothTarget((lastCor + baseTarget) /2 );
			}else{
				target = smoothTarget(lastCor * 0.67);
			}
		}else{
			if(target>baseTarget * 1.01){
				target = (target*49 + baseTarget)/50;
			}else{
				target *= .999;
			}
		}
		return score;
	}
    var listen = function() {
        if (listening) {
            var array = new Float32Array(samplesToGet);
            analyser.getFloatTimeDomainData(array);
            var cor = getCorrelation(array);
            cor = smooth(cor);
            
            onListen({
				cor: cor, 
				note: note, 
				frequency: frequency,
				score: checkTarget(cor),
				target: target
			 });
            //console.log(cor, frequency);
            requestAnimationFrame(listen);
        }
    };
    var gotMic = function(stream) {
        window.stream = stream;
        audioStream = stream;
        listening = true;
        micNode = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = fftSize;
        micNode.connect(analyser);
        frequency = frequency || 440;
        listenFor(frequency);
        listen();
        
    };
    var startListening = function() {
        navigator.getUserMedia = navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia;
        navigator.getUserMedia({'audio': true}, gotMic, onPermissionDenied);
    };
    var stopListening = function() {
        listening = false;
        if (audioStream)
            var tracks = audioStream.getTracks();
            for(var i=0; i<tracks.length; i++){
                tracks[0].stop();
            }
        if (micNode)
            micNode.disconnect();
        onListen(0);
    };
    var setThreshold = function(newThreshold){
        threshold = newThreshold;
    }
    return {startListening: startListening, stopListening: stopListening, listenFor: listenFor, setThreshold: setThreshold};
}
