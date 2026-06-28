import confetti from 'canvas-confetti';

export function celebrate() {
  // Confetti burst from the bottom centre
  confetti({
    particleCount: 120,
    spread: 70,
    origin: { x: 0.5, y: 0.9 },
    colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#a855f7'],
  });

  // Success chime using Web Audio API
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
    // Web Audio not available — silently skip
  }
}
