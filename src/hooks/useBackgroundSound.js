import { useEffect, useRef } from 'react';

/** Crossfade the ends of a buffer for seamless looping (no click at loop point). */
function crossfadeBuffer(data, sampleRate, fadeMs = 80) {
  const fadeSamples = Math.min(Math.floor((fadeMs / 1000) * sampleRate), Math.floor(data.length / 4));
  const n = data.length;
  for (let i = 0; i < fadeSamples; i++) {
    const t = i / fadeSamples;
    const ramp = t * t * (3 - 2 * t);
    data[i] *= ramp;
    data[n - 1 - i] *= ramp;
  }
}

function useBackgroundSound(selectedSound, isTimerRunning, volume = 1) {
  const ctxRef = useRef(null);
  const nodesRef = useRef({});

  // Clamp volume to 0..1 and scale so max matches previous default (0.22)
  const volumeGain = Math.max(0, Math.min(1, typeof volume === 'number' ? volume : 1)) * 0.22;

  useEffect(() => {
    const shouldPlay = selectedSound !== 'off' && isTimerRunning;

    if (!shouldPlay) {
      if (nodesRef.current.gain) {
        nodesRef.current.gain.gain.setTargetAtTime(0, (ctxRef.current?.currentTime ?? 0), 0.08);
      }
      return;
    }

    const ctx = ctxRef.current || new (window.AudioContext || window.webkitAudioContext)();
    if (!ctxRef.current) ctxRef.current = ctx;
    if (ctx.state === 'suspended') ctx.resume();

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);

    const masterGain = ctx.createGain();
    masterGain.gain.value = volumeGain;
    masterGain.connect(gain);

    /** Capture only the nodes created in THIS effect run so cleanup doesn't stop a later run's sources. */
    const created = { gain, masterGain };

    if (selectedSound === 'noise') {
      const durationSec = 4;
      const bufferSize = ctx.sampleRate * durationSec;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.28;
      }
      crossfadeBuffer(data, ctx.sampleRate, 120);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.5;
      source.connect(filter);
      filter.connect(masterGain);
      source.start(0);
      created.noiseSource = source;
    } else if (selectedSound === 'rain') {
      const durationSec = 5;
      const bufferSize = ctx.sampleRate * durationSec;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate;
        const slow = Math.sin(t * 0.8) * 0.5 + 0.5;
        const drop = (Math.random() * 2 - 1) * slow * 0.12;
        const soft = (Math.random() * 2 - 1) * 0.06;
        data[i] = drop + soft;
      }
      crossfadeBuffer(data, ctx.sampleRate, 150);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2500;
      filter.Q.value = 0.3;
      source.connect(filter);
      filter.connect(masterGain);
      source.start(0);
      created.rainSource = source;
    } else if (selectedSound === 'ambient') {
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = 110;
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 164;
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.12;
      osc1.connect(oscGain);
      osc2.connect(oscGain);
      oscGain.connect(masterGain);
      osc1.start(0);
      osc2.start(0);
      created.ambientOscs = [osc1, osc2];
    } else if (selectedSound === 'lo-fi') {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = 220;
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.08;
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(0);
      created.lofiOsc = osc;
    }

    nodesRef.current = { gain, masterGain, ...created };

    gain.gain.setTargetAtTime(1, ctx.currentTime, 0.12);

    return () => {
      const t = ctx.currentTime;
      gain.gain.setTargetAtTime(0, t, 0.05);
      setTimeout(() => {
        if (created.noiseSource) {
          try { created.noiseSource.stop(); } catch (_) {}
        }
        if (created.rainSource) {
          try { created.rainSource.stop(); } catch (_) {}
        }
        if (created.ambientOscs) {
          created.ambientOscs.forEach(o => {
            try { o.stop(); } catch (_) {}
          });
        }
        if (created.lofiOsc) {
          try { created.lofiOsc.stop(); } catch (_) {}
        }
      }, 150);
    };
  }, [selectedSound, isTimerRunning, volumeGain]);

  // When volume changes, update existing masterGain without recreating the graph
  useEffect(() => {
    const masterGain = nodesRef.current.masterGain;
    const ctx = ctxRef.current;
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(volumeGain, ctx.currentTime, 0.05);
    }
  }, [volumeGain]);
}

export default useBackgroundSound;
