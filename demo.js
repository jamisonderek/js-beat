$(function() {
    'use strict';

    function updateBeat(bpm) {
        $('#beat').text(bpm);
        $('#bpm').blink(60 * 1000 / bpm, 'blinkOn', audioGenerator.playSound);
    }

    var audioGenerator = new AudioGenerator();
    var beatDection = new BeatDetection();
    var processor = new AudioProcessor();
    beatDection.setCallback(updateBeat);
    beatDection.setAudioGenerator(audioGenerator);
    processor.captureAudio(beatDection.processAudioSample);
});
