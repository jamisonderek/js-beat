$(function() {
    'use strict';

    var enabledMilliseconds = 20;
    var blinkInterval;
    var blinkElement;
    var blinkClass;
    var timer;
    var blinkCallback;

    $.fn.blink = function(interval, className, callback) {
        blinkInterval = interval;
        blinkElement = $(this);
        blinkClass = className;
        blinkCallback = callback;
        blinkOn();
    };

    function refreshTimer() {
        window.clearTimeout(timer);
        timer = setTimeout(blinkOn, blinkInterval);
        window.setTimeout(blinkOff, enabledMilliseconds);
    }

    function invokeCallback() {
        if (!!blinkCallback) {
            blinkCallback();
        }
    }

    function blinkOn() {
        blinkElement.removeClass(blinkClass);
        blinkElement.addClass(blinkClass);
        refreshTimer();
        invokeCallback();
    }

    function blinkOff() {
        blinkElement.removeClass(blinkClass);
    }
});
