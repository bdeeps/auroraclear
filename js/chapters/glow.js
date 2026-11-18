// Chapter 5: the glow. Fast electrons knock into oxygen atoms and nitrogen molecules, which absorb energy (excitation) and then
// give it back as light (emission). Green is atomic oxygen at 557.7 nm (excited state lifetime about 0.7 s), red is atomic oxygen
// at 630.0 nm (lifetime about 110 s), blue and violet come from ionised molecular nitrogen (N2+, 427.8 and 391.4 nm).
// This is a teaching model with rounded numbers, not a spectrum calculation:
//  - where electrons stop: peak height ~ 150 - 45 log10(E / keV) km (roughly 1 keV near 150 km, 10 keV near 105 km);
//  - air: rounded, MSIS-like number densities of N2, O2 and O at 100-400 km (they change a lot with the Sun and season);
//  - quenching: an excited atom loses its energy to heat if it hits N2 or O2 before it can emit. Rate coefficients are rounded
//    (O(1D)+N2 about 2.3e-11 cm^3/s, O(1S)+O2 about 2.4e-12 cm^3/s), so the long-lived red state only survives high up.
import { THREE, M, V, COL, rng, cloud, spaceScene, clamp, lerp, smooth } from '../space.js';
import { canvasTexture as ctex } from '../kit.js';

const TAB = [[80, 1e14, 4e13, 3e11], [100, 9e12, 2.4e12, 5e11], [120, 3e11, 5e10, 1e11], [150, 2e10, 2e9, 1.5e10], [200, 1.5e9, 7e7, 4e9], [250, 3e8, 8e6, 1.5e9], [300, 6e7, 1e6, 6e8], [400, 5e6, 5e4, 6e7]];
const dens = (h, col) => { h = clamp(h, 80, 400); let i = 1; while (i < TAB.length - 1 && TAB[i][0] < h) i++; const a = TAB[i - 1], b = TAB[i], k = (h - a[0]) / (b[0] - a[0]); return Math.exp(lerp(Math.log(a[col]), Math.log(b[col]), k)); };
const N2 = (h) => dens(h, 1), O2 = (h) => dens(h, 2), O = (h) => dens(h, 3);
const tauRed = (h) => 1 / (2.3e-11 * N2(h)), tauGreen = (h) => 1 / (2.4e-12 * O2(h));
const effRed = (h) => 1 / (1 + 110 / tauRed(h)), effGreen = (h) => 1 / (1 + 0.7 / tauGreen(h));
const peak = (E) => clamp(150 - 45 * Math.log10(E), 70, 220);
const dep = (h, E) => Math.exp(-0.5 * ((h - peak(E)) / (13 + 0.05 * Math.max(0, peak(E) - 100))) ** 2);
function emit(h, E) {
  const D = dep(h, E), fO = O(h) / (O(h) + N2(h)), g = smooth((Math.log10(E) + 1.7) / 1.2), hi = 1 - 0.8 * smooth((h - 200) / 120);
  return { g: D * (0.5 + 0.5 * fO) * 0.55 * g * hi * effGreen(h), r: D * fO * effRed(h), b: D * (1 - fO) * 0.12 };
}
const local = (h) => { const fO = O(h) / (O(h) + N2(h)), hi = 1 - 0.8 * smooth((h - 200) / 120); return { g: (0.5 + 0.5 * fO) * 0.55 * hi * effGreen(h), r: fO * effRed(h), b: (1 - fO) * 0.12 }; };
const fmtS = (t) => (t < 0.01 ? `${(t * 1000).toFixed(1)} ms` : t < 1 ? `${(t * 1000).toFixed(0)} ms` : t < 100 ? `${t.toFixed(1)} s` : `${(t / 60).toFixed(1)} min`);
const Y = (h) => h / 40;
const name = (c) => (c.r > 1.4 * c.g && c.r > 2 * c.b ? ['Red', COL.red] : c.g > 1.4 * c.r && c.g > 1.5 * c.b ? ['Green', COL.green] : c.b > c.g && c.b > c.r ? ['Blue and violet', COL.violet] : c.g > c.r ? ['Green with a blue fringe', COL.green] : ['Yellow-orange mix', 0xffb547]);

export default {
  id: 'glow',
  short: 'Where the glow comes from',
  title: 'The glow, layer by layer',
  subtitle: 'Electrons hit oxygen and nitrogen high in the air. The height decides the colour.',
  view: { pos: [2.5, 5.5, 21], target: [1.2, 5.2, 0] },
  learn: `<p>The glow starts when a fast electron hits an air molecule. The atom <b>absorbs</b> some of its energy (<b>excitation</b>) and, a moment later, gives it back as a particle of light (<b>emission</b>). Each kind of atom gives back one particular colour.</p>
    <p><b>Green</b> (557.7 nm) is atomic oxygen, and it shines mostly at about <b>100 to 150 km</b>. <b>Red</b> (630.0 nm) is also oxygen, but above about <b>200 km</b>. <b>Blue and violet</b> come from ionised nitrogen, usually low down at the fringe of the curtain. Pink and purple edges are mixtures.</p>
    <p>Why does the red line only glow high up? Excited oxygen that will give red light waits a long time, on average about <b>110 seconds</b>. The green one waits under a second. Low down the air is thick, so the red atom is hit by another molecule long before then and loses its energy as heat. Only where collisions are rare can it live long enough to glow.</p>
    <p>Height also depends on the electron’s <b>energy</b>. Faster electrons dive deeper before they stop.</p>
    <p class="tip"><b>Try it:</b> slide the electron energy and watch where the beam stops and which colour appears. Then move the height probe and watch the two grids of excited atoms: which ones get to glow?</p>
    <p class="note">A teaching model with rounded numbers. The real air changes with the Sun and the seasons, and real aurora mix many more processes.</p>`,
  terms: [
    { t: 'Excitation', d: 'An atom or molecule taking up energy, usually by a collision, so that an electron jumps to a higher energy level.' },
    { t: 'Emission', d: 'The excited atom releasing that energy as light of one particular wavelength.' },
    { t: 'Quenching', d: 'An excited atom losing its energy to a collision, as heat, before it can emit light.' },
    { t: 'Metastable state', d: 'An excited state that lasts unusually long. Oxygen’s red-line state lasts about 110 s.' },
    { t: 'Nanometre (nm)', d: 'A billionth of a metre, used to measure the wavelength of light: green is about 558 nm, red about 630 nm.' },
  ],
  defaults: { E: 1, h: 120 },
  controls: [
    { key: 'E', type: 'log', label: 'Electron energy', min: 0.03, max: 30, fmt: (v) => (v < 1 ? `${Math.round(v * 1000)} eV` : `${v.toFixed(1)} keV`), ends: ['Soft', 'Hard'] },
    { key: 'h', type: 'range', label: 'Height probe', min: 80, max: 350, step: 1, fmt: (v) => `${Math.round(v)} km` },
    { key: 'go', type: 'buttons', label: 'Presets', items: [{ label: 'Soft: red', act: (s) => { s.E = 0.05; s.h = 260; } }, { label: 'Typical: green', act: (s) => { s.E = 1; s.h = 130; } }, { label: 'Hard: blue edge', act: (s) => { s.E = 15; s.h = 100; } }] },
  ],
  quiz: [
    { q: 'Which gas makes the common green aurora?', options: ['Atomic oxygen', 'Hydrogen', 'Carbon dioxide', 'Neon'], answer: 0, why: 'Excited atomic oxygen emits green light at 557.7 nm, mostly at 100 to 150 km.' },
    { q: 'Why does the red oxygen glow only appear high up?', options: ['Red light cannot get through low air', 'Its excited state lasts about 110 s, so in thick air a collision kills it first', 'Only the Sun can make it', 'Electrons are red up there'], answer: 1, why: 'Collisions quench the long-lived state. High up, collisions are rare enough for it to emit.' },
    { q: 'What happens as electron energy goes up?', options: ['They stop higher up', 'They stop lower down', 'They stop at the same height', 'They turn into protons'], answer: 1, why: 'Faster electrons penetrate deeper into the air before they lose their energy.' },
  ],
  reel: [
    { ms: 5200, caption: 'In the upper air, fast electrons hit oxygen and nitrogen. The atoms take the energy, then give it back as light.', set: { E: 1, h: 130 }, view: { pos: [1.5, 5.2, 18], target: [0.8, 5.0, 0] }, spin: 0 },
    { ms: 5600, caption: 'Green at about 100 to 150 km. Red far higher, where the air is thin enough for oxygen to wait.', set: { E: 1, h: 130 }, anim: { E: [8, 0.05], h: [110, 270] }, view: { pos: [2.5, 5.5, 21], target: [1.2, 5.2, 0] }, spin: 0 },
  ],
  build({ stage, s, label }) {
    spaceScene(stage, { sun: [-1, 0.2, 0.5], stars: true });
    const root = stage.root, r = rng(23);
    const ground = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 6), M.matte(0x0d1220)); ground.position.set(0.5, -0.2, 0); root.add(ground);
    // axis + labels
    [100, 200, 300, 400].forEach((h) => { const l = new THREE.Mesh(new THREE.BoxGeometry(18, 0.012, 0.012), M.ghost(0xffffff, 0.2)); l.position.set(0.5, Y(h), 0); root.add(l); label(`${h} km`, [-8.9, Y(h), 0], root); });
    label('Ground', [-8.9, 0.1, 0], root);
    // thin air: dots whose density falls with height
    const A = cloud(1600, { size: 0.14, opacity: 0.5 });
    for (let i = 0; i < 1600; i++) { const u = r(), h = clamp(-62 * Math.log(1 - u * 0.985) , 0, 400); A.pos.set([-7.6 + r() * 16.2, Y(h), (r() - 0.5) * 3], i * 3); A.setCol(i, 0x9fb4d8, 0.8); }
    root.add(A); A.upd();
    // the curtain, painted from the model
    const W = 256, H = 256;
    const ct = ctex(W, H, () => {});
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(8, Y(400)), new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    curtain.position.set(-2.4, Y(400) / 2, 0); root.add(curtain);
    let lastE = -1;
    const paint = (E, t) => {
      const g = ct.canvas.getContext('2d'), img = g.createImageData(W, H);
      const rows = []; for (let y = 0; y < H; y++) { rows.push(emit(Math.max(80, 400 - (y / (H - 1)) * 320), E)); }
      for (let y = 0; y < H; y++) { const e = rows[y], k = 2.6; for (let x = 0; x < W; x++) { const ray = 0.7 + 0.3 * Math.sin(x * 0.35 + Math.sin(x * 0.11 + t) * 2) * Math.sin(x * 0.07 + 1), o = (y * W + x) * 4, edge = Math.min(1, x / 24, (W - 1 - x) / 24); const c = [e.g * 0.43 + e.r * 1 + e.b * 0.42, e.g * 1 + e.r * 0.3 + e.b * 0.55, e.g * 0.63 + e.r * 0.34 + e.b * 1]; img.data[o] = clamp(c[0] * k * ray * edge, 0, 1) * 255; img.data[o + 1] = clamp(c[1] * k * ray * edge, 0, 1) * 255; img.data[o + 2] = clamp(c[2] * k * ray * edge, 0, 1) * 255; img.data[o + 3] = Math.max(img.data[o], img.data[o + 1], img.data[o + 2]); } }
      g.putImageData(img, 0, 0); ct.tex.needsUpdate = true;
    };
    // the plane covers heights 80-400 km: shift it so rows map to the right height
    curtain.geometry.dispose(); curtain.geometry = new THREE.PlaneGeometry(8, Y(320)); curtain.position.y = (Y(80) + Y(400)) / 2;
    // beam of electrons
    const NE = 160, B = cloud(NE, { size: 0.2, opacity: 1 }), ph = new Float32Array(NE), xo = new Float32Array(NE);
    for (let i = 0; i < NE; i++) { ph[i] = r(); xo[i] = (r() - 0.5) * 7.4; B.setCol(i, COL.elec, 1); }
    B.position.x = -2.4; root.add(B);
    const flare = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.06), M.glow(0xffffff, { transparent: true, opacity: 0.4 })); flare.position.set(-2.4, 0, 0.02); root.add(flare);
    // probe
    const probe = new THREE.Mesh(new THREE.BoxGeometry(18, 0.04, 0.04), M.glow(0xffb547)); probe.position.set(0.5, 0, 0); root.add(probe);
    const pl = label('', [7.2, 0, 0], root, 'hot'); const pk = label('', [-6.6, 0, 0], root);
    // excited-atom grids
    const GN = 36, GR = cloud(GN * 2, { size: 0.34, opacity: 1 }); root.add(GR);
    const gx = (k, j) => (j ? 8.0 : 6.0) + (k % 6) * 0.38 - 0.9, gy = (k) => Math.floor(k / 6) * 0.38 - 1.0;
    const gl1 = label('Green state', [6.1, 0, 0], root), gl2 = label('Red state (110 s)', [8.1, 0, 0], root);
    const T = 7, KAP = 22; let tt = 0, cyc = -1, ev = [];
    const roll = (h) => { const rr = rng(100 + cyc); ev = []; for (let j = 0; j < 2; j++) for (let k = 0; k < GN; k++) { const tr = j ? 110 : 0.7, tq = j ? tauRed(h) : tauGreen(h), a = -tr * Math.log(1 - rr() * 0.999) / KAP, b = -tq * Math.log(1 - rr() * 0.999) / KAP; ev.push(a < b ? { t: a, ok: true } : { t: b, ok: false }); } };
    return {
      update(dt, st) {
        tt += dt;
        if (st.E !== lastE) { paint(st.E, tt); lastE = st.E; }
        const hp = peak(st.E), top = 400;
        for (let i = 0; i < NE; i++) { ph[i] = (ph[i] + dt * (0.5 + 0.8 * Math.log10(st.E + 1))) % 1; const h = lerp(top, hp, ph[i]); B.pos[i * 3] = xo[i]; B.pos[i * 3 + 1] = Y(h); B.pos[i * 3 + 2] = 0.05; const f = ph[i] < 0.08 ? ph[i] / 0.08 : 1; B.setCol(i, COL.elec, f * (1 - 0.7 * smooth((ph[i] - 0.9) / 0.1))); }
        B.upd(); flare.position.y = Y(hp);
        probe.position.y = Y(st.h); pl.position.y = Y(st.h) + 0.35; pl.element.textContent = `Probe: ${Math.round(st.h)} km`; pk.position.y = Y(peak(st.E)) ; pk.element.textContent = `Beam stops near ${Math.round(peak(st.E))} km`;
        gl1.position.y = gl2.position.y = Y(st.h) + 1.6;
        const c = Math.floor(tt / T); if (c !== cyc) { cyc = c; roll(st.h); }
        const a = tt - c * T - 0.4;
        for (let j = 0; j < 2; j++) for (let k = 0; k < GN; k++) {
          const i = j * GN + k, e = ev[i], o = i * 3; GR.pos[o] = gx(k, j); GR.pos[o + 1] = Y(st.h) + gy(k) + 0.5; GR.pos[o + 2] = 0.1;
          const base = j ? [1, 0.3, 0.33] : [0.43, 1, 0.63];
          let br = 0.1, col = [0.5, 0.55, 0.7];
          if (a < 0) { br = 0.1; } else if (a < e.t) { br = 0.55; col = [1, 1, 0.9]; } else if (e.ok) { const f = clamp(1 - (a - e.t) / 0.7, 0, 1); br = 0.1 + 1.3 * f; col = base; } else { const f = clamp(1 - (a - e.t) / 0.5, 0, 1); br = 0.08 + 0.4 * f; col = [0.55, 0.45, 0.4]; }
          GR.col[o] = col[0] * br; GR.col[o + 1] = col[1] * br; GR.col[o + 2] = col[2] * br;
        }
        GR.upd();
      },
      readout(st) {
        const tot = { g: 0, r: 0, b: 0 }; for (let h = 80; h <= 400; h += 4) { const e = emit(h, st.E); tot.g += e.g; tot.r += e.r; tot.b += e.b; }
        const [nm] = name(tot), lc = local(st.h), [nl] = name(lc), tq = tauRed(st.h), eg = effGreen(st.h), er = effRed(st.h);
        return `<div class="big">${nm}</div><p class="r-say">Electrons of this energy stop near ${Math.round(peak(st.E))} km, and the glow they cause is mainly this colour.</p>
          <div class="row"><span>At ${Math.round(st.h)} km, excited oxygen glows</span><b>${nl}</b></div>
          <div class="row"><span>Red state waits for (110 s), hit after</span><b>${fmtS(tq)}</b></div>
          <div class="row"><span>Share of red atoms that glow</span><b>${(er * 100).toFixed(0)}%</b></div>
          <div class="row"><span>Share of green atoms that glow</span><b>${(eg * 100).toFixed(0)}%</b></div>`;
      },
    };
  },
};
