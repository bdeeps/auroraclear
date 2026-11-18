// Chapter 4: opening the door. The Sun's magnetic field is carried along by the wind (the interplanetary magnetic field, IMF).
// When its north-south part Bz points south, it is opposite to Earth's field at the nose, and the two can break and rejoin
// ("reconnect", Dungey 1961). Reconnected lines connect Earth's poles to the wind; the wind drags them over the poles into the
// tail, where they reconnect again and spring back, sending particles Earthward along the lines into the auroral ovals.
// This is a cartoon of that cycle in the noon-midnight plane, not to scale (Earth is drawn about 1.6x the size that fits the
// picture). The Kp number is an illustrative function of wind speed and Bz (a Newell-style coupling), not a forecast; the oval
// edge uses an illustrative 2 degrees of latitude per Kp step.
import { THREE, M, V, COL, D2R, rng, cloud, halo, spaceScene, earth, Lines, ovalMesh, clamp, lerp, smooth, approach, dipoleLine, shue, kpFrom, ovalEq } from '../space.js';

const ER = 1.6, R0 = 10.5, NL = 7, NP = 40;
const RM = (th) => shue(R0, th, 2);
const mpX = []; for (let k = 0; k <= 60; k++) { const th = (k / 60) * 2.7, R = RM(th); mpX.push([R * Math.sin(th), -R * Math.cos(th)]); }
const xm = (rho) => { for (let i = 1; i < mpX.length; i++) if (mpX[i][0] >= rho) { const a = mpX[i - 1], b = mpX[i]; return lerp(a[1], b[1], (rho - a[0]) / Math.max(1e-6, b[0] - a[0])); } return mpX[mpX.length - 1][1]; };
const foot = (omega) => V(ER * Math.sin(omega), ER * Math.cos(omega), 0);
const CF = 24 * D2R;
const catmull = (pts) => new THREE.CatmullRomCurve3(pts, false, 'centripetal').getPoints(NP - 1);
const mix = (A, B, w) => A.map((p, i) => p.clone().lerp(B[i], w));
function dayClosed() {
  const L = R0 * 0.92 / ER, P = dipoleLine(L, Math.PI, NP * 2 - 1).map((p) => p.multiplyScalar(ER));
  return P.filter((p) => p.y >= 0).sort((a, b) => b.y - a.y || 0).reverse().slice(0, NP).length ? sampleHalf(P) : P;
}
function sampleHalf(P) { const up = P.filter((p) => p.y >= -1e-6).reverse(); const out = []; for (let i = 0; i < NP; i++) out.push(up[Math.round((i / (NP - 1)) * (up.length - 1))].clone()); return out.reverse(); }
const DAY = dayClosed(); // foot ... apex (foot first)
const openA = (sa) => {
  const th = 0.15 + sa * 2.1, R = RM(th) * 0.88, K = V(-R * Math.cos(th), R * Math.sin(th), 0);
  const F = foot(-CF + 2 * CF * smooth(sa)), Fo = F.clone().multiplyScalar(1.7);
  const mid = Fo.clone().lerp(K, 0.55); mid.y += 1.2;
  return catmull([F, Fo, mid, K, K.clone().add(V(6, 0.6 + sa, 0)), K.clone().add(V(16, 1.6 + 2 * sa, 0))]);
};
const tailB = (xt) => { const F = foot(CF), Fo = F.clone().multiplyScalar(1.7), h = Math.min(4.6, 0.32 * xt); return catmull([F, Fo, V(0.3 * xt, h, 0), V(0.72 * xt, h * 0.9, 0), V(0.95 * xt, h * 0.3, 0), V(xt, 0, 0)]); };
function shape(u) {
  if (u < 0.05) return [DAY, 0];
  if (u < 0.12) return [mix(DAY, openA(0), smooth((u - 0.05) / 0.07)), 0];
  if (u < 0.55) return [openA((u - 0.12) / 0.43), 0];
  if (u < 0.67) { const w = smooth((u - 0.55) / 0.12); return [mix(openA(1), tailB(30), w), w < 0.5 ? 0 : 1]; }
  if (u < 0.82) return [tailB(lerp(30, 14, (u - 0.67) / 0.15)), 1];
  return [tailB(lerp(14, 6, (u - 0.82) / 0.18)), 1];
}
const flipS = (P) => P.map((p) => V(p.x, -p.y, p.z));

export default {
  id: 'funnel',
  short: 'Opening the door',
  title: 'Reconnection and the funnel',
  subtitle: 'When the Sun’s field points south, Earth’s field opens, and particles pour down it to the poles.',
  view: { pos: [6, 14, 36], target: [6, 0, 0] },
  learn: `<p>The wind carries a magnetic field with it, the <b>interplanetary magnetic field</b>. Its north-south part is called <b>Bz</b>. At the nose of Earth’s field the lines point north. If the wind’s lines point <b>south</b>, they are opposite, and where opposite lines meet they can break and rejoin. This is <b>magnetic reconnection</b>.</p>
    <p>Rejoined lines link Earth’s poles directly to the wind. The wind drags them over the poles and into the tail. There they stretch like rubber bands, reconnect again, and snap back toward Earth, flinging particles down the lines. The particles follow the field to the poles and hit the air inside a ring called the <b>auroral oval</b>.</p>
    <p>So a <b>southward Bz</b> opens the door and a <b>northward Bz</b> mostly keeps it shut. Faster wind and a stronger southward field push more energy in, the activity number <b>Kp</b> rises, and the oval widens toward the equator.</p>
    <p class="tip"><b>Try it:</b> drag <b>Bz</b> from north to south and watch the orange lines connect and the oval grow. Press <b>Over the pole</b> to see the oval itself.</p>
    <p class="note">A cartoon of one cycle, not to scale. Kp here is an illustrative estimate from wind speed and Bz, not a forecast.</p>`,
  terms: [
    { t: 'Interplanetary magnetic field', d: 'The Sun’s magnetic field, carried out into space by the solar wind.' },
    { t: 'Bz', d: 'The north-south part of that field. Southward (negative) Bz is the one that connects with Earth’s field.' },
    { t: 'Magnetic reconnection', d: 'Oppositely directed field lines break and rejoin, converting stored magnetic energy into motion and heat.' },
    { t: 'Auroral oval', d: 'The ring around each magnetic pole where the aurora is most often seen.' },
    { t: 'Kp index', d: 'A 0 to 9 scale of how disturbed Earth’s magnetic field is. Higher means a stronger storm and an oval reaching lower latitudes.' },
  ],
  defaults: { bz: -8, v: 400 },
  controls: [
    { key: 'bz', type: 'range', label: 'Wind’s field, Bz', min: -15, max: 10, step: 0.5, fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} nT ${v < -0.5 ? 'south' : v > 0.5 ? 'north' : ''}`, ends: ['Southward', 'Northward'] },
    { key: 'v', type: 'range', label: 'Solar wind speed', min: 250, max: 800, step: 10, fmt: (v) => `${Math.round(v)} km/s` },
    { key: 'go', type: 'buttons', label: 'Camera', items: [{ label: 'Whole picture', act: (s, inst) => inst.cam(0) }, { label: 'Over the pole', act: (s, inst) => inst.cam(1) }] },
  ],
  quiz: [
    { q: 'Which direction of the wind’s magnetic field lets energy into Earth’s field?', options: ['Southward', 'Northward', 'Neither matters', 'Only sideways'], answer: 0, why: 'Southward field is opposite to Earth’s field at the nose, so the two can reconnect.' },
    { q: 'What happens to particles on reconnected field lines?', options: ['They stop', 'They are guided along the lines down to the poles', 'They go back to the Sun', 'They turn into light in space'], answer: 1, why: 'Charged particles follow field lines, so lines that run to the poles carry them there.' },
    { q: 'What happens to the oval as Kp rises?', options: ['It shrinks', 'It moves toward the equator and widens', 'It disappears', 'It stays the same'], answer: 1, why: 'A stronger storm opens more field and pushes the oval to lower latitudes.' },
  ],
  reel: [
    { ms: 5600, caption: 'When the wind’s magnetic field points south, it links up with Earth’s. The door opens.', set: { bz: 6, v: 420 }, anim: { bz: [6, -12] }, view: { pos: [6, 14, 36], target: [6, 0, 0] }, spin: 0 },
    { ms: 5200, caption: 'Particles are funnelled along the field to the poles, and the oval of light grows.', set: { bz: -10, v: 550 }, anim: { bz: [-3, -14] }, view: { pos: [-1.2, 6, 2.6], target: [0, 0.9, 0] }, spin: 0 },
  ],
  build({ stage, s, label }) {
    spaceScene(stage, { sun: [-1, 0.1, 0.3] });
    const root = stage.root, r = rng(17);
    const E = earth(ER); root.add(E);
    const oval = ovalMesh(1.012 * ER); oval.scale.setScalar(ER / ER); const ovg = new THREE.Group(); ovg.scale.setScalar(1); ovg.add(oval); root.add(ovg);
    const mp = []; for (let k = -30; k <= 30; k++) { const th = (k / 30) * 2.7, R = RM(Math.abs(th)); mp.push(V(-R * Math.cos(th), Math.sign(th) * R * Math.sin(Math.abs(th)), 0)); }
    const pause = new Lines(stage, 70, { color: COL.pause, width: 1.6, opacity: 0.85 }); pause.set([mp]); root.add(pause.obj);
    const inner = [];
    for (const L of [1.8, 2.4, 3.2]) { const A = dipoleLine(L, Math.PI, 40).map((p) => p.multiplyScalar(ER)); const B = dipoleLine(L, 0, 40).map((p) => { p.x *= 1 + 0.45 * (L - 1.5); return p.multiplyScalar(ER); }); inner.push(A, B); }
    const closed0 = new Lines(stage, 6 * 41, { color: COL.field, width: 1.2, opacity: 0.55 }); closed0.set(inner); root.add(closed0.obj);
    const openL = new Lines(stage, NL * 2 * NP, { color: 0xffa24a, width: 2, opacity: 0.95 }), closL = new Lines(stage, NL * 2 * NP, { color: 0x6dffc8, width: 2, opacity: 0.95 });
    const imfL = new Lines(stage, 9 * 40, { color: 0xffd98a, width: 1.2, opacity: 0.6 }); root.add(imfL.obj, openL.obj, closL.obj);
    const cones = [...Array(9)].map(() => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.9, 12), M.glow(0xffd98a)); root.add(c); return c; });
    const X1 = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 8, 30), M.glow(0xffffff)); X1.position.set(-R0, 0, 0); X1.rotation.y = Math.PI / 2; root.add(X1);
    const X2 = X1.clone(); root.add(X2);
    const l1 = label('Reconnection at the nose', [-R0 - 1, 2.6, 0], root, 'hot'), l2 = label('Reconnection in the tail', [16, 3, 0], root, 'hot');
    label('Magnetopause', [-R0 * 0.6, 8.8, 0], root); label('Sun', [-26, 7, 0], root); label('Solar wind field', [-20, -13.5, 0], root);
    const sunH = halo(0xffa940, 14, 0.8); sunH.position.set(-34, 0, 0); root.add(sunH);
    // particles that ride the lines
    const NPT = 420, W = cloud(NPT, { size: 0.55, opacity: 1 }), tpos = new Float32Array(NPT);
    for (let i = 0; i < NPT; i++) tpos[i] = r();
    root.add(W);
    let ph = 0.3, kpS = 2.5, tt = 0, polysN = [], ring = 0;
    const NIMF = 9, imfPhase = [...Array(NIMF)].map((_, i) => i / NIMF);
    return {
      cam(k) { stage.setView(...(k ? [[-1.4, 6.5, 2.8], [0, 0.9, 0]] : [[6, 14, 36], [6, 0, 0]]), 1); },
      update(dt, st) {
        tt += dt;
        const open = clamp(-st.bz / 9, 0, 1), kpT = kpFrom(st.v, st.bz); kpS = approach(kpS, kpT, 1.4, dt);
        oval.set(kpS, tt, 0.5 + 0.7 * open); ovg.visible = true;
        ph = (ph + dt * (0.02 + 0.1 * open * (st.v / 400))) % 1;
        // wind field lines (drape over the nose)
        const nv = Math.round(NIMF), imf = [];
        for (let i = 0; i < nv; i++) {
          imfPhase[i] = (imfPhase[i] + dt * 0.07 * (st.v / 400)) % 1;
          const xc = -32 + imfPhase[i] * 58, pts = [];
          for (let k = 0; k < 40; k++) { const y = -13 + (26 * k) / 39, xmv = xm(Math.abs(y)) - 1.1; pts.push(V(Math.min(xc, xmv), y, 0)); }
          imf.push(pts);
          const c = cones[i], yy = st.bz < 0 ? 4 : -4, xmv = xm(Math.abs(yy)) - 1.1;
          c.position.set(Math.min(xc, xmv), yy, 0); c.rotation.z = st.bz < 0 ? Math.PI : 0; c.visible = Math.abs(st.bz) > 0.4;
        }
        imfL.set(imf);
        // the cycling lines
        const nVis = open > 0.04 ? Math.max(1, Math.round(NL * Math.pow(open, 0.7))) : 0, oPolys = [], cPolys = [], all = [];
        let nose = 0, tail = 0, tailX = 20;
        for (let i = 0; i < nVis; i++) {
          const u = (ph + i / nVis) % 1, [N, closed] = shape(u), w = smooth(u / 0.08) * smooth((1 - u) / 0.07);
          const A = N.map((p) => p.clone().multiplyScalar(w)), B = flipS(A);
          (closed ? cPolys : oPolys).push(A, B); all.push({ A, B, closed });
          if (u < 0.3) nose = Math.max(nose, 1); if (u > 0.62 && u < 0.85) { tail = 1; tailX = lerp(30, 14, clamp((u - 0.67) / 0.15, 0, 1)); }
        }
        openL.set(oPolys); closL.set(cPolys);
        X1.visible = nose > 0; X2.visible = tail > 0; X2.position.set(tailX, 0, 0); ring += dt * 4; X1.scale.setScalar(1 + 0.2 * Math.sin(ring)); X2.scale.setScalar(1 + 0.2 * Math.sin(ring + 1));
        l1.visible = nose > 0; l2.visible = tail > 0;
        // particles
        const polys = []; all.forEach((o) => { polys.push([o.A, o.closed], [o.B, o.closed]); });
        W.visible = polys.length > 0;
        if (polys.length) {
          for (let i = 0; i < NPT; i++) {
            tpos[i] -= dt * 0.45; if (tpos[i] < 0) tpos[i] += 1;
            const [P, closed] = polys[i % polys.length], f = tpos[i] * (NP - 1), a = Math.floor(f), b = Math.min(NP - 1, a + 1), k = f - a, o = i * 3;
            const pa = P[a], pb = P[b];
            W.pos[o] = lerp(pa.x, pb.x, k) + 0.12 * Math.sin(i * 7 + tt * 6); W.pos[o + 1] = lerp(pa.y, pb.y, k); W.pos[o + 2] = 0.12 * Math.cos(i * 5 + tt * 5);
            const near = 1 - tpos[i], br = 0.35 + 0.65 * near;
            if (closed) { W.col[o] = 0.3 * br; W.col[o + 1] = 1 * br; W.col[o + 2] = 0.6 * br; } else { W.col[o] = 1 * br; W.col[o + 1] = 0.6 * br; W.col[o + 2] = 0.2 * br; }
          }
          W.upd();
        }
      },
      readout(st) {
        const kp = kpFrom(st.v, st.bz), eq = ovalEq(kp), say = st.bz < -0.5 ? 'Southward: the lines connect, and particles are funnelled to the poles.' : st.bz > 0.5 ? 'Northward: the field stays mostly shut. Little energy gets in.' : 'Almost no north-south field. The door is barely ajar.';
        return `<div class="big">Kp ≈ ${kp.toFixed(1)}</div><p class="r-say">${say}</p>
          <div class="row"><span>Oval’s low edge</span><b>about ${eq.toFixed(0)}° magnetic latitude</b></div>
          <div class="row"><span>Bz · wind speed</span><b>${st.bz.toFixed(1)} nT · ${Math.round(st.v)} km/s</b></div>`;
      },
    };
  },
};
