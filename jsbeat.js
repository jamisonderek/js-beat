var AudioProcessor = (function() {
    'use strict';

    var callbackAudioProcess;

    function attachStream(audioStream) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        var context = new window.AudioContext();

        context.createJavaScriptNode = context.createJavaScriptNode || context.createScriptProcessor;
        var scriptProcess = context.createJavaScriptNode(1024, 2, 2);
        scriptProcess.onaudioprocess = callbackAudioProcess;

        var rawAudio = context.createMediaStreamSource(audioStream);
        rawAudio.connect(scriptProcess);
        scriptProcess.connect(context.destination);
    }

    function error(e) {
        console.log('error trying to capture audio: '+e);
    }

    function captureAudio(callback) {
        callbackAudioProcess = callback;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        if (!!navigator.getUserMedia) {
            navigator.getUserMedia({ audio: true }, attachStream, error);
        }
    }

    return {
        captureAudio: captureAudio
    };
});


var AudioGenerator = (function() {
    'use strict';

    var lastPlaySoundTime = 0;
    var queuedSound = false;
    var minSoundDuration = 100;

    function audioSilent(e) {
        for (var i = 0; i < 50; i++) {
            e.outputBuffer.getChannelData(0)[i] = 0;
        }
    }

    function audioClick(e) {
        for (var i = 0; i < 50; i++) {
            e.outputBuffer.getChannelData(0)[i] = ((i & 16) - 8) / 15;
        }
    }

    function shouldPlaySound() {
        if (queuedSound) {
            queuedSound = false;
            var now = new Date().getTime();
            if (now - lastPlaySoundTime > minSoundDuration) {
                lastPlaySoundTime = now;
                return true;
            }
        }

        return false;
    }

    function populateOutputBuffer(e) {
        if (shouldPlaySound()) {
            audioClick(e);
        }
        else {
            audioSilent(e);
        }
    }

    function playSound() {
        queuedSound = true;
    }

    return {
        populateOutputBuffer: populateOutputBuffer,
        playSound: playSound
    };
});


var BeatDetection = (function () {
    'use strict';

    var callbackBeat;
    var audioGenerator;

    function setCallback(callback) {
        callbackBeat = callback;
    }

    function setAudioGenerator(generator) {
        audioGenerator = generator;
    }

    var loudClap = 0.7;
    var minSampleMilliseconds = 100;

    var lastIndex = 0;
    var lastSample = 0;
    var sampleCount = 0;

    
    function getMaxPoint(data) {
        var index = 0;
        var max = 0;
        for (var i = 0; i < data.length; ++i) {
            if (data[i] > max) {
                max = data[i];
                index = i;
            }
        }

        return {
            index: index,
            value: max
        };
    }

    function processAudioSample(e) {
        ++sampleCount;

        var data = e.inputBuffer.getChannelData(0);
        var sampleRate = e.inputBuffer.sampleRate;

        var max = getMaxPoint(data);

        if (max.value > loudClap) {
            var lastClap = data.length * (sampleCount - lastSample) + (max.index - lastIndex);
            if (lastClap > minSampleMilliseconds * sampleRate / 1000) {
                lastSample = sampleCount;
                lastIndex = max.index;
                var bpm = sampleRate * 60 / lastClap;
                callbackBeat(bpm);
            }
        }

        if (!!audioGenerator) {
            audioGenerator.populateOutputBuffer(e);
        }
    }

    return {
        setCallback: setCallback,
        setAudioGenerator: setAudioGenerator,
        processAudioSample: processAudioSample,
    };
});

