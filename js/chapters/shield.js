// Chapter 2: Earth's magnetic shield. Earth's field is close to a dipole (a bar magnet) near the planet. The solar wind
// squeezes the sunward side and stretches the far side into a long magnetotail. A bow shock stands upstream, like the wave
// ahead of a boat. Boundary shapes use the Shue et al. (1997) magnetopause form: r = r0 (2 / (1 + cos th))^a with
// r0 about 10 Earth radii for a typical 2 nPa wind and falling as the wind's pressure rises. The bow shock is drawn about
// 1.3 times farther out (approximate). The wind flow is a cartoon: slowed and turned around the shock, not a plasma simulation.
// The Sun is on the left (-x); the magnetic axis is vertical (+y).
import { THREE, M, V, COL, D2R, rng, cloud, spaceScene, earth, Lines, clamp, lerp, smooth, dipoleLine, rMagnetopause, shue, bRatio } from '../space.js';
import { latheX } from '../kit.js';

const LS = [2.2, 3.2, 4.6, 6.5, 9], NPH = 6, RE_KM = 6371;
const stretch = (L) => 1 + 0.17 * Math.max(0, L - 3.5);

export default {
  id: 'shield',
  short: 'Earth’s magnetic shield',
  title: 'A shield around the planet',
  subtitle: 'Earth’s magnetic field holds the solar wind off and traps a bubble of space around us.',
  view: { pos: [4, 17, 28], target: [3, 0, 0] },
  learn: `<p>Earth is a giant magnet. Its field comes from slowly churning molten iron deep inside, and near the planet it looks like the field of a <b>bar magnet</b>: lines looping out of the south and back into the north. Charged particles cannot easily cross magnetic field lines. They get steered around them instead.</p>
    <p>So the solar wind does not hit Earth. It piles up against the field and flows around it. Upstream the wind slows abruptly at a <b>bow shock</b>, like the wave in front of a boat. Behind it, the <b>magnetopause</b> marks the edge of Earth’s own field. In normal conditions it sits roughly <b>10 Earth radii</b> out toward the Sun, and the nightside field is stretched into a <b>magnetotail</b> more than a hundred Earth radii long.</p>
    <p>The bubble inside is the <b>magnetosphere</b>. Its size is a tug of war: when the wind pushes harder, it shrinks. In a very strong storm the front edge can be pressed inside the orbit of geostationary satellites.</p>
    <p class="tip"><b>Try it:</b> push the wind pressure up with the slider, or press <b>Storm blast</b>. Watch the front of the field squash and the bow shock move in. Drag to orbit, and look at the tail from the side.</p>
    <p class="note">Boundary shapes are an empirical model. Flow lines are a cartoon of the wind going around.</p>`,
  terms: [
    { t: 'Magnetosphere', d: 'The region of space dominated by Earth’s magnetic field instead of the Sun’s.' },
    { t: 'Magnetopause', d: 'The boundary where the solar wind’s push balances Earth’s magnetic field.' },
    { t: 'Bow shock', d: 'A sudden slowing of the supersonic solar wind in front of the magnetosphere.' },
    { t: 'Magnetotail', d: 'The long tail of stretched field lines streaming away from the Sun on Earth’s night side.' },
  ],
  defaults: { dp: 2, flow: true, field: true, surf: true },
  controls: [
    { key: 'dp', type: 'log', label: 'Solar wind pressure', min: 0.5, max: 40, fmt: (v) => `${v.toFixed(1)} nPa`, hint: 'About 2 nPa is typical. Storms can push it far higher.' },
    { key: 'b', type: 'buttons', label: 'Presets', items: [{ label: 'Calm wind', act: (s) => { s.dp = 1; } }, { label: 'Typical', act: (s) => { s.dp = 2; } }, { label: 'Storm blast', act: (s) => { s.dp = 30; } }] },
    { key: 'flow', type: 'toggle', label: 'Show the solar wind' },
    { key: 'field', type: 'toggle', label: 'Show field lines' },
    { key: 'surf', type: 'toggle', label: 'Show the boundaries' },
  ],
  quiz: [
    { q: 'What stops most of the solar wind from reaching Earth’s surface?', options: ['The atmosphere alone', 'Earth’s magnetic field steers it around', 'The Moon', 'Distance'], answer: 1, why: 'Charged particles are steered along field lines, so the magnetic field guides the wind around the planet.' },
    { q: 'What happens to the front of the magnetosphere when the wind pushes harder?', options: ['It moves out', 'It is squeezed closer to Earth', 'It disappears', 'Nothing'], answer: 1, why: 'A higher pressure pushes the magnetopause in. Its distance goes down slowly with pressure.' },
    { q: 'Which side of Earth has the long magnetotail?', options: ['The side facing the Sun', 'The night side', 'Only the poles', 'It has no tail'], answer: 1, why: 'The wind drags the field away from the Sun, stretching the night side into a long tail.' },
  ],
  reel: [
    { ms: 5600, caption: 'Earth is a giant magnet. Its field holds the solar wind off and flows it around the planet.', set: { dp: 2 }, anim: { dp: [2, 14, true] }, view: { pos: [8, 20, 36], target: [8, 0, 0] }, spin: 0.35 },
  ],
  build({ stage, s, label }) {
    spaceScene(stage, { sun: [-1, 0.1, 0.25] });
    const root = stage.root, r = rng(9);
    const E = earth(1); root.add(E);
    const geo = new THREE.Mesh(new THREE.TorusGeometry(6.6, 0.02, 6, 120), M.ghost(0xffffff, 0.35)); geo.rotation.x = Math.PI / 2; root.add(geo);
    const lG = label('Geostationary orbit, 6.6 Re', [0, 0.1, 6.6], root);
    const closed = new Lines(stage, LS.length * NPH * 56, { color: COL.field, width: 1.1, opacity: 0.6 });
    const lobes = new Lines(stage, 24 * 50, { color: 0xc49bff, width: 1.2, opacity: 0.55 });
    root.add(closed.obj, lobes.obj);
    const fill = (c) => M.ghost(c, 0.04);
    const pauseL = new Lines(stage, 700, { color: COL.pause, width: 1.4, opacity: 0.8 }), shockL = new Lines(stage, 700, { color: COL.shock, width: 1.2, opacity: 0.6 });
    root.add(pauseL.obj, shockL.obj);
    const fills = [fill(COL.pause), fill(COL.shock)];
    let pause = null, shock = null, last = -1, r0 = 10, tt = 0;
    const lbl = [label('Bow shock', [0, 0, 0], root, 'hot'), label('Magnetopause', [0, 0, 0], root), label('Magnetotail', [34, 0, 0], root)];
    const prof = (R0, dp) => { const o = []; for (let k = 0; k <= 36; k++) { const th = (k / 36) * 2.7, R = shue(R0, th, dp), x = -R * Math.cos(th); if (x > 48) break; o.push([x, R * Math.sin(th), th]); } return o; };
    const surf = (R0, dp, mat) => { const m = latheX(prof(R0, dp).map((q) => [q[0], q[1]]), mat, { seg: 40 }); m.castShadow = false; m.receiveShadow = false; return m; };
    const skeleton = (R0, dp) => {
      const P = prof(R0, dp), out = [];
      for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.2832; out.push(P.map(([x, rho]) => V(x, rho * Math.cos(a), rho * Math.sin(a)))); }
      for (let j = 4; j < P.length; j += 6) { const [x, rho] = P[j], ring = []; for (let k = 0; k <= 48; k++) { const a = (k / 48) * 6.2832; ring.push(V(x, rho * Math.cos(a), rho * Math.sin(a))); } out.push(ring); }
      return out;
    };
    const deform = (p, L) => {
      if (p.x > 0) p.x *= 1 + (stretch(L) - 1) * smooth(p.x / (0.5 * L));
      const rr = p.length(); if (rr < 1e-6) return p;
      const th = Math.acos(clamp(-p.x / rr, -1, 1)), Rm = shue(r0, Math.min(th, 2.6), s.dp), m = 0.93 * Rm, a = 0.55 * m;
      if (rr > a) p.multiplyScalar((a + (m - a) * Math.tanh((rr - a) / (m - a))) / rr);
      return p;
    };
    const rebuild = () => {
      r0 = rMagnetopause(s.dp);
      [pause, shock].forEach((m) => { if (m) { root.remove(m); m.geometry.dispose(); } });
      pause = surf(r0, s.dp, fills[0]); shock = surf(r0 * 1.3, s.dp, fills[1]); root.add(pause, shock);
      pauseL.set(skeleton(r0, s.dp)); shockL.set(skeleton(r0 * 1.3, s.dp));
      const polys = [];
      for (const L of LS) for (let k = 0; k < NPH; k++) polys.push(dipoleLine(L, (k / NPH) * 6.2832 + 0.2, 56).map((p) => deform(p, L)));
      closed.set(polys);
      const open = [], sc = r0 / 10.3;
      for (let k = 0; k < 24; k++) {
        const hemi = k < 12 ? 1 : -1, psi = ((k % 12) / 12) * 6.2832, col = 14 * D2R;
        const F = V(Math.sin(col) * Math.cos(psi), hemi * Math.cos(col), Math.sin(col) * Math.sin(psi));
        const Eend = V(46, hemi * (8 + 3 * Math.cos(psi)) * sc, 11 * Math.sin(psi) * sc);
        const curve = new THREE.CatmullRomCurve3([F, F.clone().multiplyScalar(1.8), V(2 + 3 * Math.cos(psi), hemi * 6.5 * sc, 4.5 * Math.sin(psi) * sc), V(16, hemi * 8 * sc, 8 * Math.sin(psi) * sc), Eend]);
        open.push(curve.getPoints(48));
      }
      lobes.set(open);
      lbl[0].position.set(-r0 * 1.3, 2.4, 0); lbl[1].position.set(-r0, -2.4, 0);
      last = s.dp;
    };
    rebuild();
    // the solar wind going around
    const NF = 1100, W = cloud(NF, { size: 0.8, opacity: 0.9 }), U = 15;
    const spawn = (i, anywhere) => { const a = r() * 6.283, d = 25 * Math.sqrt(r()); W.pos[i * 3] = anywhere ? -36 + r() * 84 : -36; W.pos[i * 3 + 1] = d * Math.cos(a); W.pos[i * 3 + 2] = d * Math.sin(a); };
    for (let i = 0; i < NF; i++) spawn(i, true);
    root.add(W);
    const p = V(0, 0, 0);
    return {
      update(dt, st) {
        tt += dt;
        if (st.dp !== last) rebuild();
        closed.obj.visible = lobes.obj.visible = st.field; pause.visible = shock.visible = pauseL.obj.visible = shockL.obj.visible = st.surf; lbl[0].visible = lbl[1].visible = st.surf; lbl[2].visible = st.surf;
        W.visible = st.flow;
        if (st.flow) {
          for (let i = 0; i < NF; i++) {
            const o = i * 3; p.set(W.pos[o], W.pos[o + 1], W.pos[o + 2]);
            const rr = p.length(), th = Math.acos(clamp(-p.x / rr, -1, 1)), t2 = Math.min(th, 2.7);
            const Rb = shue(r0 * 1.3, t2, st.dp), Rm = shue(r0, t2, st.dp);
            let vx = U, vy = 0, vz = 0, hot = 0;
            if (rr < Rb && p.x < 44) {
              hot = 1;
              const nx = p.x / rr, ny = p.y / rr, nz = p.z / rr, dpx = nx;       // r-hat; X . r-hat = nx
              const tx = 1 - dpx * nx, ty = -dpx * ny, tz = -dpx * nz, tl = Math.hypot(tx, ty, tz) || 1;
              const k = smooth((Rb - rr) / (0.12 * Rb));
              vx = lerp(U, 0.5 * U * tx / tl, k); vy = lerp(0, 0.5 * U * ty / tl, k); vz = lerp(0, 0.5 * U * tz / tl, k);
              const push = clamp(1 - (rr - Rm) / (Rb - Rm), 0, 1) * 0.5 * U; vx += nx * push; vy += ny * push; vz += nz * push;
            }
            p.x += vx * dt; p.y += vy * dt; p.z += vz * dt;
            const r2 = p.length(); if (r2 < Rm * 1.03) p.multiplyScalar((Rm * 1.03) / r2);
            if (p.x > 48 || Math.hypot(p.y, p.z) > 40) { spawn(i, false); }
            else { W.pos[o] = p.x; W.pos[o + 1] = p.y; W.pos[o + 2] = p.z; }
            const c = hot ? [1, 0.62, 0.22] : [0.95, 0.85, 0.55];
            W.col[o] = c[0]; W.col[o + 1] = c[1]; W.col[o + 2] = c[2];
          }
          W.upd();
        }
      },
      readout(st) {
        const R0 = rMagnetopause(st.dp), inside = R0 < 6.6;
        return `<div class="big">${R0.toFixed(1)} Earth radii</div><p class="r-say">Distance to the front of Earth’s field on the Sun side. ${inside ? '<span class="no">It is pressed inside the orbit of geostationary satellites.</span>' : 'Typical is about 10.'}</p>
          <div class="row"><span>Magnetopause</span><b>${Math.round(R0 * RE_KM).toLocaleString()} km</b></div>
          <div class="row"><span>Bow shock (about)</span><b>${(R0 * 1.3).toFixed(1)} Re</b></div>
          <div class="row"><span>Wind pressure</span><b>${st.dp.toFixed(1)} nPa</b></div>`;
      },
    };
  },
};
