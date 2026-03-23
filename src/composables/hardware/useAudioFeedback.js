"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAudioFeedback = useAudioFeedback;
function useAudioFeedback() {
    var playBeep = function (type) {
        if (type === void 0) { type = 'success'; }
        var frequencies = {
            success: [800, 1000],
            error: [400, 300],
            scan: [1200],
        };
        try {
            var ctx_1 = new AudioContext();
            var freqs = frequencies[type];
            freqs.forEach(function (freq, i) {
                var osc = ctx_1.createOscillator();
                var gain = ctx_1.createGain();
                osc.connect(gain);
                gain.connect(ctx_1.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.value = 0.1;
                var startTime = ctx_1.currentTime + (i * 0.1);
                osc.start(startTime);
                osc.stop(startTime + 0.1);
            });
        }
        catch (_a) {
            // Audio not available
        }
    };
    return { playBeep: playBeep };
}
