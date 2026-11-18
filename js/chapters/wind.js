// Chapter 1: the solar wind. The Sun's hot outer atmosphere (the corona) is so hot that it cannot hold on to its
// outermost charged particles, so a thin stream of them flows outward all the time. Near Earth it moves at roughly
// 250-800 km/s (about 400 km/s is typical) and takes a few days to arrive; the gap is about 150 million km (1 AU).
// Coronal mass ejections (CMEs) are bursts of magnetised plasma that can be much faster than the wind.
// The picture is a cartoon of scale: the Sun and Earth are drawn far too large to fit them on one screen,
// and one second here is half a day of travel. The particle positions follow the speed you set.
import { THREE, M, V, COL, rng, cloud, halo, spaceScene, earth, clamp, smooth } from '../space.js';

const AU = 1.496e8, DIST = 40, TS = 0.5;          // km, scene units from Sun to Earth, days per second
const SUN = V(-DIST, 0, 0), N = 1500, NC = 650;
const wu = (v) => (v * 86400 * TS / AU) * DIST;     // km/s -> scene units per second
const days = (v) => AU / v / 86400;
const fmtT = (d) => (d >= 2 ? `${d.toFixed(1)} days` : `${(d * 24).toFixed(0)} hours`);

export default {
  id: 'wind',
  short: 'The solar wind',
  title: 'A wind from the Sun',
  subtitle: 'A stream of charged particles flows out of the Sun and reaches Earth in a few days.',
  view: { pos: [-16, 22, 44], target: [-17, 0, 0] },
  learn: `<p>The Sun is not just light. Its outer atmosphere, the <b>corona</b>, is a million degrees hot, so hot that its particles can escape the Sun’s gravity. They stream outward in every direction, all the time. This is the <b>solar wind</b>: a thin, hot gas of electrically charged particles, mostly protons and electrons.</p>
    <p>Near Earth the wind blows at roughly <b>250 to 800 km/s</b>, with about 400 km/s typical. Even at that speed the 150 million km trip takes <b>about two to four days</b> for the usual range, and up to a week if the wind is very slow. A wind that is twice as fast gets here in half the time.</p>
    <p>Sometimes the Sun throws out something much bigger. A <b>coronal mass ejection</b> (CME) is a huge cloud of plasma and magnetic field. The fastest ones cross the gap in a day or less. When one hits Earth, the aurora gets far stronger and spreads far from the poles.</p>
    <p class="tip"><b>Try it:</b> slide the wind speed and watch the day markers move. Then launch a CME and see how much sooner it arrives.</p>
    <p class="note">Not to scale: the Sun and Earth are drawn much too large, and one second here is half a day of travel.</p>`,
  terms: [
    { t: 'Solar wind', d: 'A constant stream of charged particles, mostly protons and electrons, flowing outward from the Sun.' },
    { t: 'Corona', d: 'The Sun’s thin, very hot outer atmosphere, where the solar wind starts.' },
    { t: 'Coronal mass ejection', d: 'A burst of plasma and magnetic field thrown out of the Sun, often faster than the ordinary wind.' },
    { t: 'Plasma', d: 'A gas so hot that its atoms are split into charged particles, which respond to magnetic fields.' },
  ],
  defaults: { wind: 400, cme: 1200 },
  controls: [
    { key: 'wind', type: 'range', label: 'Solar wind speed', min: 250, max: 800, step: 10, fmt: (v) => `${Math.round(v)} km/s`, ends: ['Slow wind', 'Fast wind'], hint: 'About 400 km/s is typical near Earth.' },
    { key: 'cme', type: 'range', label: 'CME speed', min: 400, max: 2500, step: 50, fmt: (v) => `${Math.round(v)} km/s`, hint: 'Fast CMEs are well over 1,000 km/s.' },
    { key: 'go', type: 'buttons', label: 'Solar storm', items: [{ label: 'Launch a CME', act: (s, inst) => inst.launch() }] },
  ],
  quiz: [
    { q: 'How long does ordinary solar wind take to reach Earth?', options: ['About 8 minutes', 'A few days', 'Several months', 'It never reaches Earth'], answer: 1, why: 'At around 400 km/s it covers the 150 million km in a bit over four days. Light, by contrast, takes about 8 minutes.' },
    { q: 'What is the solar wind made of?', options: ['Mostly charged particles', 'Air from the Sun’s surface', 'Visible light', 'Dust'], answer: 0, why: 'It is plasma: mostly protons and electrons, which is why magnetic fields can steer it.' },
    { q: 'What is a coronal mass ejection?', options: ['A sunspot', 'A burst of plasma thrown out of the Sun', 'A kind of aurora', 'A slow patch of wind'], answer: 1, why: 'A CME is a big cloud of plasma and magnetic field, and it can be much faster than the usual wind.' },
  ],
  reel: [
    { ms: 5200, caption: 'The Sun never stops blowing. A thin wind of charged particles streams out in every direction.', set: { wind: 420 }, view: { pos: [-16, 20, 42], target: [-17, 0, 0] }, spin: 0 },
    { ms: 5200, caption: 'A solar storm is a faster burst. It can cross the gap to Earth in a day or two.', set: { wind: 400, cme: 1300 }, act: (s, inst) => inst.launch(), view: { pos: [-10, 12, 36], target: [-14, 0, 0] }, spin: 0 },
  ],
  build({ stage, s, label }) {
    spaceScene(stage, { sun: [-1, 0.1, 0.3] });
    const r = rng(5), root = stage.root;
    const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(3, 48, 32), M.glow(COL.sun)), sh = halo(0xffa940, 17, 0.9); sunMesh.position.copy(SUN); sh.position.copy(SUN);
    const earthG = earth(1.1, { grid: false }); const eh = halo(0x7fb2ff, 6, 0);
    root.add(sunMesh, sh, earthG, eh);
    label('Sun', [-40, 5.5, 0], root); label('Earth (not to scale)', [0, 2.8, 0], root);
    // the wind
    const P = cloud(N, { size: 0.5, opacity: 0.95 }), lane = [], spd = new Float32Array(N), sOf = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      let a, b; do { a = r() * 2 - 1; b = r() * 2 - 1; } while (a * a + b * b > 1);
      lane.push(V(1, a * 0.32, b * 0.32).normalize()); spd[i] = 0.78 + r() * 0.44; sOf[i] = 3 + r() * 53;
      P.setCol(i, r() < 0.82 ? COL.wind : COL.elec, 1);
    }
    const c0 = Float32Array.from(P.col); root.add(P);
    // a coronal mass ejection: a curved shell of denser plasma
    const C = cloud(NC, { size: 0.65, opacity: 1 }), cdir = [], cth = new Float32Array(NC);
    for (let i = 0; i < NC; i++) {
      const u = 1 - r() * (1 - Math.cos(0.62)), a = r() * 6.283, q = Math.sqrt(1 - u * u);
      cdir.push(V(u, q * Math.cos(a), q * Math.sin(a))); cth[i] = r() * 2.6; C.setCol(i, r() < 0.5 ? 0xff8a4a : 0xffc070, 1);
    }
    C.visible = false; root.add(C);
    // the tracer and the day markers
    const tracer = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), M.glow(0xffffff)); root.add(tracer);
    const dayLbl = [...Array(8)].map((_, i) => { const l = label(`Day ${i + 1}`, [0, -1.6, 0], root, 'hot'); return l; });
    const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, DIST, 6), M.ghost(0xffffff, 0.15)); axis.rotation.z = Math.PI / 2; axis.position.x = -DIST / 2; root.add(axis);
    let sTr = 3, cR = -1, cAt = false, flash = 0, tt = 0;
    const fr = (k) => smooth(k / 6) * (1 - smooth((k - 49) / 7));

    return {
      launch() { cR = 3; cAt = false; C.visible = true; },
      update(dt, st) {
        tt += dt; const base = wu(st.wind);
        for (let i = 0; i < N; i++) {
          sOf[i] += base * spd[i] * dt; if (sOf[i] > 56) sOf[i] = 3 + (sOf[i] - 56) % 6;
          const k = sOf[i], d = lane[i], o = i * 3;
          P.pos[o] = SUN.x + d.x * k; P.pos[o + 1] = d.y * k; P.pos[o + 2] = d.z * k;
          const f = fr(k); P.col[o] = c0[o] * f; P.col[o + 1] = c0[o + 1] * f; P.col[o + 2] = c0[o + 2] * f;
        }
        P.upd();
        sTr += base * dt; if (sTr > DIST) sTr = 3; tracer.position.set(SUN.x + sTr, 0, 0);
        if (cR >= 0) {
          cR += wu(st.cme) * dt;
          for (let i = 0; i < NC; i++) { const d = cdir[i], k = cR + cth[i] * (1 + cR / 40), o = i * 3; C.pos[o] = SUN.x + d.x * k; C.pos[o + 1] = d.y * k; C.pos[o + 2] = d.z * k; }
          C.upd();
          if (!cAt && cR >= DIST - 1) { cAt = true; flash = 1; }
          if (cR > DIST + 12) { cR = -1; C.visible = false; }
        }
        flash = Math.max(0, flash - dt * 0.6); eh.material.opacity = flash * 0.9;
        const dl = st.wind * 86400 / AU * DIST;
        dayLbl.forEach((l, i) => { const x = -DIST + dl * (i + 1); l.visible = x < 1; l.position.set(x, -1.6, 0); });
      },
      readout(st) {
        const d = days(st.wind), dc = days(st.cme);
        const cme = cR >= 0 ? (cAt ? '<span class="ok">Hit Earth</span>' : `in flight (${Math.round(clamp((cR - 3) / (DIST - 3), 0, 1) * 100)}% of the way)`) : 'not launched';
        return `<div class="big">${Math.round(st.wind)} km/s</div><p class="r-say">At this speed a particle takes about ${fmtT(d)} to reach Earth.</p>
          <div class="row"><span>Wind travel time</span><b>${fmtT(d)}</b></div>
          <div class="row"><span>CME at ${Math.round(st.cme)} km/s would take</span><b>${fmtT(dc)}</b></div>
          <div class="row"><span>CME</span><b>${cme}</b></div>`;
      },
    };
  },
};
