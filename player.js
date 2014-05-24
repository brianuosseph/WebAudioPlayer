var playing = false;

/* Approach:
 *	- Load all tracks through <audio>
 *	- Create an array of audio tracks
 *	- Give user controls to play/pause, skip track, volume and filter
 *	- 
 */

/* Styling Ideas:
 *	- Quantized spectrogram in background of player
 *	- Album art?
 *	- Square
 */

var audioContext;
if (typeof AudioContext !== "undefined") {
  audioContext = new AudioContext();
} else if (typeof webkitAudioContext !== "undefined") {
  audioContext = new webkitAudioContext();  
} else {
  alert("Web Audio API is not supported in this browser");  // Letting the user know
  throw new Error("Web Audio API is not supported in this browser. :(");
}

var mediaElement = document.getElementById('track1');	// Grab <audio>, which has already loaded the song for us!
var source = audioContext.createMediaElementSource(mediaElement);	// Create an audio source from <audio>


// Gain
var volumeLevel = 1;
var volumeInput = document.getElementById("volume");
var volume = audioContext.createGainNode();
volumeInput.addEventListener("input", function() {
	volumeLevel = volumeInput.value;
	volume.gain.value = volumeLevel;
}, false);


// Filter
var filterCutoff = 20000;
var filterCutoffInput = document.getElementById("filter-cutoff");
var filterType = 0;
var filterTypeSelect = document.getElementById("filter-type");
var filter = audioContext.createBiquadFilter();
filter.type = filterType; // 0 = lowpass, 1 = highpass, 2 = bandpass, 3 = lowshelf, 4 = highshelf, 5 = peaking, 6 = notch, 7 = allpass
filter.frequency.value = filterCutoff;


filterTypeSelect.addEventListener("change", function() {
	filterType = parseInt(filterTypeSelect.options[filterTypeSelect.selectedIndex].value);
	filter.type = filterType;
}, false);

filterCutoffInput.addEventListener("input", function() {
	// Map 0-1 to 0-20000
	// ((e^(ln(81)x)) – 1) * 250 = x'
	filterCutoff = parseInt(((Math.exp(Math.log(81)*parseFloat(filterCutoffInput.value))) - 1) * 250);
	console.log(filterCutoff);
	filter.frequency.value = filterCutoff;
}, false);
// To allow nudging with arrow keys
filterCutoffInput.addEventListener("change", function() {
	filterCutoff = parseInt(((Math.exp(Math.log(81)*parseFloat(filterCutoffInput.value))) - 1) * 250);
	console.log(filterCutoff);
	filter.frequency.value = filterCutoff;
}, false);


// Analyzer (FFT)
var analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
// Use .getByteFrequencyData() for frequency spectrum
// Use .getByteTimeDomainData() for waveforms



// Connect all nodes
source.connect(volume);
volume.connect(filter);
filter.connect(analyser);
analyser.connect(audioContext.destination);



var canvas = document.getElementById("canvas");
var canvasContext;
if (canvas.getContext) {
	canvasContext = canvas.getContext('2d');
	draw();
}


function draw() {
	window.webkitRequestAnimationFrame(draw);

	// FFT
	var sum;
	var average;
	var bar_width;
	var scaled_average;
	var num_bars = 60;
	var data = new Uint8Array(2048);
	analyser.getByteFrequencyData(data)

	canvasContext.clearRect(0, 0, canvas.width, canvas.height);
	var bin_size = Math.floor(data.length / num_bars);
	for (var i = 0; i < num_bars; i++) {
		sum = 0;
		for (var j = 0; j < bin_size; j++) {
			sum += data[(i * bin_size) + j];
		}
		average = sum / bin_size;
		bar_width = canvas.width / num_bars;
		scaled_average = (average/ 256) * canvas.height;
		canvasContext.fillRect(i * bar_width, canvas.height, bar_width - 2, - scaled_average);
	}
}


function play() {
	if (!playing) {
		mediaElement.play();
		playing = true;
	}
	else {
		pause();
	}
}

function pause() {
	if (!mediaElement.muted) {
		mediaElement.muted = true;
	}
	else {
		mediaElement.muted = false;
	}
}

