// Chapter 3: spiralling and bouncing. A charged particle in a magnetic field circles the field line (gyration), slides along it,
// and is turned back where the field gets stronger (a magnetic mirror), because its magnetic moment stays constant.
// We follow the guiding centre exactly in a dipole: sin^2(alpha) / B is constant, so the mirror latitude solves
// B(mirror)/B(equator) = 1 / sin^2(alpha_equator), with B/Beq = sqrt(1 + 3 sin^2 lat) / cos^6 lat. Gyro radius scales as
// 1 / sqrt(B/Beq) and is drawn much larger than real so you can see it. Particles whose mirror point would lie below about
// 100 km are in the "loss cone": they hit the air instead of bouncing, and that is how electrons reach the aurora.
import { THREE, M, V, COL, D2R, halo, spaceScene, earth, Lines, clamp, lerp, dipoleLine, bRatio, mirrorLat, surfaceLat, lossCone } from '../space.js';

const G = (L, lat) => V(L * Math.cos(lat) ** 3, L * Math.cos(lat) ** 2 * Math.sin(lat), 0);

export default {
  id: 'trap',
  short: 'Spiral and bounce',
  title: 'Spiral, bounce, drift',
  subtitle: 'A charged particle circles a field line, bounces between the poles, and slowly drifts around Earth.',
  view: { pos: [4.2, 3.0, 11.5], target: [3.4, 1.2, 0] },
  learn: `<p>A charged particle in a magnetic field feels a sideways push. It cannot speed up along the field, but it is forced to curve, so it <b>spirals around a field line</b>. This is <b>gyration</b>. Electrons spiral in much tighter circles than protons with the same energy.</p>
    <p>Meanwhile it slides along the line toward a pole. There the field grows stronger and the spiral tightens. The forward motion turns into sideways motion until the particle stops and <b>reverses</b>: a <b>magnetic mirror</b>. It then bounces to the other hemisphere, and back, many times a second. Trapped like this, particles form the Van Allen radiation belts.</p>
    <p>How deep it goes depends on its <b>pitch angle</b>, the angle between its velocity and the field. A particle moving almost along the line has a mirror point so deep that it reaches the air and collides. Those pitch angles form the <b>loss cone</b>. Particles pushed into it are lost to the atmosphere, and that is what lights the aurora.</p>
    <p class="tip"><b>Try it:</b> set a pitch angle of 40° and watch it bounce. Then press <b>Aim into the loss cone</b>, or lower the pitch angle to a few degrees.</p>
    <p class="note">The spiral is drawn much bigger than real. Electrons and protons also drift in opposite directions around Earth, slowly: electrons east, protons west.</p>`,
  terms: [
    { t: 'Gyration', d: 'The circling of a charged particle around a magnetic field line.' },
    { t: 'Pitch angle', d: 'The angle between a particle’s velocity and the magnetic field. Small means it travels nearly along the field line.' },
    { t: 'Magnetic mirror', d: 'Where a stronger field turns a spiralling particle back the way it came.' },
    { t: 'Loss cone', d: 'The range of small pitch angles whose mirror points would be inside the atmosphere, so the particle is lost there.' },
  ],
  defaults: { L: 4, alpha: 40, kind: 'e', hits: 0 },
  controls: [
    { key: 'kind', type: 'seg', label: 'Particle', options: [{ v: 'e', label: 'Electron' }, { v: 'p', label: 'Proton' }] },
    { key: 'L', type: 'range', label: 'Field line, how far out', min: 2, max: 7, step: 0.1, fmt: (v) => `${v.toFixed(1)} Earth radii` },
    { key: 'alpha', type: 'range', label: 'Pitch angle at the equator', min: 1, max: 89, step: 1, fmt: (v) => `${Math.round(v)}°` },
    { key: 'go', type: 'buttons', label: 'Shortcuts', items: [{ label: 'Trap it (40°)', act: (s) => { s.alpha = 40; } }, { label: 'Aim into the loss cone', act: (s) => { s.alpha = Math.max(1, Math.floor(lossCone(s.L) / D2R / 2)); } }] },
  ],
  quiz: [
    { q: 'What does a magnetic field do to a moving charged particle?', options: ['Speeds it up along the field', 'Curves its path so it spirals around the field line', 'Stops it', 'Nothing'], answer: 1, why: 'The force is sideways to the motion, so the particle circles the line while sliding along it.' },
    { q: 'Why does a trapped particle bounce between the poles?', options: ['The field is stronger near the poles and turns it back', 'It hits the atmosphere', 'The Sun pushes it', 'It runs out of energy'], answer: 0, why: 'The stronger field squeezes the spiral until the forward motion reverses: a magnetic mirror.' },
    { q: 'Which particles end up in the atmosphere and make aurora?', options: ['Those with a pitch angle in the loss cone', 'Only the slowest ones', 'Only protons', 'All trapped particles'], answer: 0, why: 'If the mirror point would be below about 100 km, the particle collides with air before it can turn.' },
  ],
  reel: [
    { ms: 5400, caption: 'Charged particles spiral along field lines and bounce between the poles, like a bead on a wire.', set: { L: 4, alpha: 40, kind: 'e' }, view: { pos: [4.2, 3.0, 11] , target: [3.4, 1.2, 0] }, spin: 0 },
  ],
  build({ stage, s, label }) {
    spaceScene(stage, { sun: [-1, 0.2, 0.4] });
    const root = stage.root; root.add(earth(1));
    const drift = new THREE.Group(); root.add(drift);
    const faint = new Lines(stage, 6 * 60, { color: COL.field, width: 1, opacity: 0.3 }); root.add(faint.obj);
    const line = new Lines(stage, 4 * 90, { color: 0x9fb8ff, width: 1.6, opacity: 0.8 }); root.add(line.obj);
    const trail = new Lines(stage, 160, { color: 0xffffff, width: 2.4, opacity: 0.95 }); drift.add(trail.obj);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), M.glow(0xffffff)); drift.add(body);
    const bh = halo(0x8ef0ff, 0.5, 0.9); body.add(bh);
    const mirrors = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 6, 28), M.glow(0xffb547)); drift.add(m); return m; });
    const ml = label('Mirror point', [0, 0, 0], drift, 'hot');
    const hit = halo(0x6dffa0, 1.2, 0); drift.add(hit);
    const trailPts = []; let lat = 0, dir = 1, th = 0, phi = 0, wait = 0, flash = 0, lastL = -1, lastBase = '';
    const NTRAIL = 120;
    const setLines = (L) => {
      faint.set([2.5, 3.5, 5, 6.5].filter((x) => Math.abs(x - L) > 0.4).map((x) => dipoleLine(x, 0, 48)));
      line.set([0, 1, 2, 3].map((k) => dipoleLine(L, (k / 4) * 6.2832, 48)));
      lastL = L;
    };
    return {
      update(dt, st) {
        if (st.L !== lastL) { setLines(st.L); trailPts.length = 0; lat = 0; }
        const L = st.L, a = st.alpha * D2R, sa2 = Math.sin(a) ** 2, lm = mirrorLat(a), la = surfaceLat(L, 1.0157), lost = lm > la;
        const sgn = st.kind === 'e' ? 1 : -1;
        if (wait > 0) { wait -= dt; body.visible = false; if (wait <= 0) { lat = 0; trailPts.length = 0; } }
        else {
          body.visible = true;
          const n = 2, h = dt / n;
          for (let i = 0; i < n; i++) {
            const b = bRatio(lat), vpar = Math.max(0.12, Math.sqrt(Math.max(0, 1 - sa2 * b))) * 5.5, ds = L * Math.cos(lat) * Math.sqrt(1 + 3 * Math.sin(lat) ** 2);
            lat += dir * (vpar / ds) * h; th += sgn * 11 * Math.sqrt(b) * h;
            const lim = lost ? la : lm;
            if (Math.abs(lat) >= lim) {
              if (lost) { flash = 1; st.hits++; wait = 0.9; lat = Math.sign(lat) * la; hit.position.copy(G(L, lat)); dir = Math.random() < 0.5 ? 1 : -1; }
              else { lat = Math.sign(lat) * lim; dir = -dir; }
            }
          }
          phi += sgn * 0.22 * dt;
          const t = V(-3 * Math.cos(lat) ** 2 * Math.sin(lat), -2 * Math.cos(lat) * Math.sin(lat) ** 2 + Math.cos(lat) ** 3, 0).normalize();
          const n2 = V(t.y, -t.x, 0), b = bRatio(lat), rg = 0.12 * L * Math.sin(a) / Math.sqrt(b);
          const c = G(L, lat).addScaledVector(V(0, 0, 1), rg * Math.cos(th)).addScaledVector(n2, rg * Math.sin(th));
          body.position.copy(c); trailPts.push(c.clone()); if (trailPts.length > NTRAIL) trailPts.shift();
          trail.set([trailPts]);
        }
        drift.rotation.y = phi;
        const col = st.kind === 'e' ? 0x8ef0ff : 0xffb27a; body.material.color.setHex(col); bh.material.color.setHex(col); trail.mat.color.setHex(col);
        mirrors.forEach((m, i) => { m.visible = !lost; const g = G(L, (i ? -1 : 1) * lm); m.position.copy(g); m.lookAt(0, 0, 0); });
        ml.visible = !lost; ml.position.copy(G(L, lm)).add(V(0.45, 0.25, 0));
        flash = Math.max(0, flash - dt * 1.2); hit.material.opacity = flash; hit.scale.setScalar(0.4 + (1 - flash) * 1.6);
      },
      readout(st) {
        const a = st.alpha * D2R, lm = mirrorLat(a), L = st.L, lc = lossCone(L) / D2R, lost = lm > surfaceLat(L, 1.0157);
        const mirAlt = (L * Math.cos(lm) ** 2 - 1) * 6371;
        return `<div class="big">${lost ? 'Lost to the air' : 'Trapped'}</div><p class="r-say">${lost ? 'Its mirror point would be underground, so it hits the atmosphere. Many of these make aurora.' : 'It mirrors above the atmosphere and keeps bouncing.'}</p>
          <div class="row"><span>Loss cone edge on this line</span><b>${lc.toFixed(1)}°</b></div>
          <div class="row"><span>Mirror latitude</span><b>${lost ? '—' : (lm / D2R).toFixed(0) + '°'}</b></div>
          <div class="row"><span>Mirror height above ground</span><b>${lost ? 'below 100 km' : Math.round(mirAlt).toLocaleString() + ' km'}</b></div>
          <div class="row"><span>Drift around Earth</span><b>${st.kind === 'e' ? 'Eastward' : 'Westward'}</b></div>
          <div class="row"><span>Dumped into the air</span><b>${st.hits || 0}×</b></div>`;
      },
    };
  },
};
