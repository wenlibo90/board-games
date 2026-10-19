// 落子音效：WebAudio 合成「木质棋子落在木盘上」的真实碰撞声
// 组成：双段撞击瞬态 + 高频接触点 + 多模态木质共鸣 + 轻量房间混响 + 动态压缩
// 每次播放做轻微随机化，并支持按落点做立体声定位。

let ctx = null;
let master = null;
let wet = null;
let pannerSupported = false;
let convolverSupported = false;

function makeImpulse(c, seconds, decay) {
  const len = Math.max(1, Math.floor(c.sampleRate * seconds));
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function ensure() {
  if (ctx) return ctx;
  const C = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!C) return null;
  try {
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = 0.42;

    // 动态压缩：更有“实体感”，同时避免削波
    if (ctx.createDynamicsCompressor) {
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 24;
      comp.ratio.value = 3.2;
      comp.attack.value = 0.002;
      comp.release.value = 0.09;
      master.connect(comp);
      comp.connect(ctx.destination);
    } else {
      master.connect(ctx.destination);
    }

    // 轻量房间混响（送出式）
    if (ctx.createConvolver) {
      const conv = ctx.createConvolver();
      conv.buffer = makeImpulse(ctx, 0.26, 3.2);
      wet = ctx.createGain();
      wet.gain.value = 0.12;
      master.connect(conv);
      conv.connect(wet);
      wet.connect(ctx.destination);
      convolverSupported = true;
    }
    pannerSupported = !!ctx.createStereoPanner;
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

function ready() {
  const c = ensure();
  if (!c) return null;
  if (c.state === 'suspended') {
    try { c.resume(); } catch (e) { /* ignore */ }
  }
  return c;
}

function noiseBuffer(c, dur) {
  const n = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function transient(c, dest, at, freq, peak, dur) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, dur);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.0015);
  g.gain.exponentialRampToValueAtTime(0.0006, at + dur);
  src.connect(bp).connect(g).connect(dest);
  src.start(at);
  src.stop(at + dur + 0.005);
}

// 落子声。opts: { pan?, bright?, pitch? }
export function place(opts = {}) {
  const c = ready();
  if (!c) return;
  try {
    const t = c.currentTime;
    const pitch = (opts.pitch || 1) * (1 + (Math.random() - 0.5) * 0.07);
    const bright = opts.bright == null ? 1 : opts.bright;

    let dest = master;
    if (pannerSupported) {
      const pan = c.createStereoPanner();
      pan.pan.value = Math.max(-1, Math.min(1, opts.pan || 0));
      pan.connect(master);
      dest = pan;
    }

    // 1) 主撞击：极短高频噪声
    transient(c, dest, t, 3400 * pitch, 0.55 * bright, 0.026);
    // 2) 回弹：稍低、稍弱、延迟数毫秒（棋子的二次触盘）
    transient(c, dest, t + 0.006, 2500 * pitch, 0.26 * bright, 0.02);
    // 3) 高频接触点：让“嗒”更清脆
    {
      const o = c.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(6200 * pitch, t);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.1 * bright, t + 0.001);
      g.gain.exponentialRampToValueAtTime(0.0004, t + 0.014);
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 3000;
      o.connect(hp).connect(g).connect(dest);
      o.start(t);
      o.stop(t + 0.02);
    }
    // 4) 清脆分音（棋子材质的高频振动）
    const partials = [
      [2450, 0.24, 0.05],
      [3750, 0.13, 0.038],
      [1500, 0.1, 0.065],
    ];
    for (const [f, g, dur] of partials) {
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f * pitch, t);
      o.frequency.exponentialRampToValueAtTime(f * pitch * 0.84, t + dur);
      const og = c.createGain();
      og.gain.setValueAtTime(0.0001, t);
      og.gain.exponentialRampToValueAtTime(g * bright, t + 0.004);
      og.gain.exponentialRampToValueAtTime(0.0005, t + dur);
      o.connect(og).connect(dest);
      o.start(t);
      o.stop(t + dur + 0.02);
    }
    // 5) 木质共鸣：多个低频模态
    const modes = [
      [205, 0.26, 0.17],
      [320, 0.14, 0.12],
      [480, 0.08, 0.08],
    ];
    for (const [f, g, dur] of modes) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f * pitch, t);
      o.frequency.exponentialRampToValueAtTime(f * pitch * 0.9, t + dur);
      const og = c.createGain();
      og.gain.setValueAtTime(0.0001, t);
      og.gain.exponentialRampToValueAtTime(g, t + 0.006);
      og.gain.exponentialRampToValueAtTime(0.0005, t + dur);
      o.connect(og).connect(dest);
      o.start(t);
      o.stop(t + dur + 0.02);
    }
  } catch (e) {
    /* 无声环境忽略 */
  }
}

// 终局提示音：柔和的木质铃声
export function chime() {
  const c = ready();
  if (!c) return;
  try {
    const t = c.currentTime;
    const notes = [
      [660, 0.0, 0.16],
      [990, 0.1, 0.14],
      [1320, 0.2, 0.1],
    ];
    for (const [f, delay, g] of notes) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t + delay);
      const og = c.createGain();
      og.gain.setValueAtTime(0.0001, t + delay);
      og.gain.exponentialRampToValueAtTime(g, t + delay + 0.02);
      og.gain.exponentialRampToValueAtTime(0.0004, t + delay + 0.6);
      o.connect(og).connect(master);
      o.start(t + delay);
      o.stop(t + delay + 0.65);
    }
  } catch (e) {
    /* ignore */
  }
}

// 供非模块脚本（如整页自定义页面）复用
if (typeof window !== 'undefined') {
  window.__sfx = { place: place, chime: chime };
}
