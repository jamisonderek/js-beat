$(function() {
    'use strict';

    var blinkInterval;
    var blinkElement;
    var blinkClass;
    var timer;

    $.fn.blink = function(interval, className) {
        blinkInterval = interval;
        blinkElement = $(this);
        blinkClass = className;
        blinkOn();
    };

    function blinkOn() {
        blinkElement.removeClass(blinkClass);
        blinkElement.addClass(blinkClass);
        window.clearTimeout(timer);
        timer = setTimeout(blinkOn, blinkInterval);
        window.setTimeout(blinkOff, 20);
    }

    function blinkOff() {
        blinkElement.removeClass(blinkClass);
    }
});


var AudioProcessor = (function() {
    'use strict';

    var callbackAudioProcess;
    // Read docs - https://developer.mozilla.org/en-US/docs/Web_Audio_API

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


var BeatDetection = (function () {
    'use strict';

    var callbackBeat;

    function setCallback(callback) {
        callbackBeat = callback;
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
    }

    return {
        setCallback: setCallback,
        processAudioSample: processAudioSample
    };
});



$(function() {
    'use strict';

    function updateBeat(bpm) {
        $('#beat').text(bpm);
        $('#bpm').blink(60 * 1000 / bpm, 'blinkOn');
    }

    var beatDection = new BeatDetection();
    beatDection.setCallback(updateBeat);
    var processor = new AudioProcessor();
    processor.captureAudio(beatDection.processAudioSample);
});
