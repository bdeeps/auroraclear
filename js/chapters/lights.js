// Chapter 6: why the lights dance. A view from the ground looking north. Electrons arrive along magnetic field lines in thin
// sheets, so the glow forms thin curtains whose bright rays run along the field (almost straight up at high latitude). Quiet
// aurora is a smooth arc; when the magnetosphere is disturbed the sheet folds, ripples and brightens. The looks here are
// painted procedurally for teaching: fold shapes and speeds are not a physical simulation. 1 unit = 5 km; the curtain
// hangs about 600 km away, its lower edge near 100 km and its top near 300 km.
import { THREE, M, V, COL, rng, spaceScene, clamp, lerp, smooth, approach } from '../space.js';

const VERT = `
uniform float uT, uFold, uSpeed, uArc;
varying vec2 vUv; varying float vFold;
void main() {
  vUv = uv; vec3 p = position;
  float x = p.x;
  float f = sin(x * 0.045 + uT * 0.6 * uSpeed) * 1.0 + 0.55 * sin(x * 0.11 - uT * 0.9 * uSpeed + 1.7) + 0.3 * sin(x * 0.27 + uT * 1.5 * uSpeed);
  p.z += f * uFold * 14.0 * (0.3 + 0.7 * uv.y);
  p.y += uArc * (1.0 - x * x / 22000.0) * 10.0 + sin(x * 0.09 + uT * 0.5 * uSpeed) * uFold * 2.0;
  vFold = f;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const FRAG = `
uniform float uT, uInt, uRay, uSpeed;
varying vec2 vUv; varying float vFold;
void main() {
  float x = vUv.x * 400.0 + vFold * 3.0;
  float rays = 0.5 + 0.5 * sin(x * 0.9 + sin(x * 0.23 + uT * 0.7 * uSpeed) * 2.0);
  rays = mix(1.0, 0.25 + 0.95 * rays * (0.6 + 0.4 * sin(x * 0.31 - uT * 1.3 * uSpeed)), uRay);
  float v = vUv.y;
  vec3 green = vec3(0.30, 1.0, 0.55), red = vec3(1.0, 0.18, 0.28), fringe = vec3(0.75, 0.35, 1.0);
  vec3 c = mix(green, red, smoothstep(0.62, 1.0, v));
  c = mix(fringe, c, smoothstep(0.0, 0.14, v));
  float a = pow(1.0 - v, 1.5) * 0.9 + smoothstep(0.0, 0.05, v) * 0.1;
  a *= smoothstep(0.0, 0.04, v) * smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
  gl_FragColor = vec4(c * a * rays * uInt, 1.0);
}`;
const unis = () => ({ uT: { value: 0 }, uFold: { value: 0.4 }, uSpeed: { value: 1 }, uArc: { value: 0 }, uInt: { value: 1 }, uRay: { value: 1 } });
const mat = (u) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });

const FORMS = {
  arc: { n: 'A quiet arc', say: 'A smooth sheet seen from below. Little is happening up there.', view: { pos: [0, 2, 22], target: [0, 24, -110] } },
  curtain: { n: 'A curtain with rays', say: 'The sheet folds, and the bright rays all run along the same field lines, so they look parallel.', view: { pos: [0, 2, 22], target: [0, 26, -110] } },
  corona: { n: 'A corona', say: 'Looking up along the field, parallel rays seem to fan out from one point overhead, just like railway tracks in perspective.', view: { pos: [0, 2.2, 6], target: [0, 44, -6] } },
};

export default {
  id: 'lights',
  short: 'Why the lights dance',
  title: 'Arcs, curtains and coronas',
  subtitle: 'The shapes come from thin sheets of falling electrons that bend, fold and flicker.',
  view: FORMS.curtain.view,
  learn: `<p>From the ground the glow is not a cloud. It is a <b>thin sheet</b>, seen from below. Electrons follow the magnetic field, so each bright <b>ray</b> runs along a field line, almost straight up at high latitudes. A calm <b>arc</b> is a smooth sheet. When Earth’s magnetic field is disturbed, the sheet folds into a <b>curtain</b>, rays flicker along it, and parts brighten and fade in seconds.</p>
    <p>Directly under the sheet you look up along the field, and the parallel rays seem to spread out from a single point overhead: a <b>corona</b>. The brightest, fastest changes often come with a <b>substorm</b>, when the stretched magnetic tail snaps back and a burst of particles rushes in. The finer details of how the folds form are still being studied.</p>
    <p>Aurora is not only an Earth thing. Planets with strong magnetic fields, such as Jupiter and Saturn, have their own, seen from space in ultraviolet. Mars and Venus have no global field like Earth’s, but can still glow when particles hit their upper air.</p>
    <p class="tip"><b>Try it:</b> switch between arc, curtain and corona, then raise the <b>activity</b> or press <b>Substorm</b> and watch the folds begin to move.</p>
    <p class="note">The shapes are painted for teaching, not simulated.</p>`,
  terms: [
    { t: 'Arc', d: 'A smooth, steady sheet of aurora stretching across the sky.' },
    { t: 'Rays', d: 'Narrow bright streaks inside a curtain. Each runs along a magnetic field line.' },
    { t: 'Corona', d: 'The starburst you see when the rays are overhead and seem to meet at a point.' },
    { t: 'Substorm', d: 'A sudden release of energy stored in Earth’s magnetic tail, which brightens and sets the aurora moving.' },
  ],
  defaults: { form: 'curtain', act: 0.35 },
  controls: [
    { key: 'form', type: 'seg', label: 'What you are looking at', options: [{ v: 'arc', label: 'Arc' }, { v: 'curtain', label: 'Curtain' }, { v: 'corona', label: 'Corona' }] },
    { key: 'act', type: 'range', label: 'Activity', min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.2 ? 'Quiet' : v < 0.6 ? 'Active' : 'Stormy'), ends: ['Quiet', 'Stormy'] },
    { key: 'go', type: 'buttons', label: 'Event', items: [{ label: 'Substorm!', act: (s, inst) => inst.burst() }] },
  ],
  quiz: [
    { q: 'Why do the rays of an aurora look parallel?', options: ['They follow magnetic field lines', 'They are lasers', 'They come from one star', 'They are reflections'], answer: 0, why: 'The electrons spiral along field lines, and the field lines are nearly parallel over a small patch of sky.' },
    { q: 'What do you see when you look up along the field lines?', options: ['An arc', 'A corona', 'Nothing', 'A rainbow'], answer: 1, why: 'The parallel rays seem to converge at one point overhead, like a starburst.' },
    { q: 'What brightens and sets the curtains moving?', options: ['A disturbance in Earth’s magnetic field, like a substorm', 'The Moon', 'Clouds', 'Wind in the air'], answer: 0, why: 'Bursts of particles and changes in the magnetic field make the sheet brighten and fold.' },
  ],
  reel: [
    { ms: 5400, caption: 'The glow is a thin sheet. It folds, flickers and dances as the magnetic field around Earth changes.', set: { form: 'curtain', act: 0.3 }, anim: { act: [0.2, 0.95] }, view: FORMS.curtain.view, spin: 0 },
  ],
  build({ stage, s, label }) {
    spaceScene(stage, { sun: [-1, 0.1, 0.2] });
    stage.scene.environmentIntensity = 0.05;
    const root = stage.root, r = rng(31);
    const snow = new THREE.Mesh(new THREE.CircleGeometry(300, 48), M.matte(0x1a2438)); snow.rotation.x = -Math.PI / 2; root.add(snow);
    const hills = new THREE.Group();
    for (let i = 0; i < 60; i++) { const a = r() * Math.PI * 2, d = 60 + r() * 80, h = 2 + r() * 6, c = new THREE.Mesh(new THREE.ConeGeometry(2 + h * 0.35, h, 7), M.matte(0x0a0f1a)); c.position.set(Math.sin(a) * d, h / 2, -Math.cos(a) * d * 0.9 - 10); hills.add(c); }
    root.add(hills);
    const uC = unis(), cur = new THREE.Mesh(new THREE.PlaneGeometry(340, 42, 260, 24), mat(uC)); cur.position.set(0, 20, -120); root.add(cur);
    const uR = unis(), rays = new THREE.Group();
    for (let i = 0; i < 34; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6 + r() * 2, 46, 1, 12), mat(uR)); m.position.set((r() - 0.5) * 56, 18, -6 + (r() - 0.5) * 44); m.rotation.y = r() * Math.PI; rays.add(m); }
    root.add(rays);
    const lbl = [label('100 km', [-60, 20, -118], root), label('Red, high up', [-60, 55, -118], root), label('You', [0, 1, 4], root, 'hot')];
    let tt = 0, boost = 0, act = s.act, form = null;
    return {
      burst() { boost = 1; },
      update(dt, st) {
        tt += dt; boost = Math.max(0, boost - dt * 0.12); act = approach(act, clamp(st.act + boost * 0.6, 0, 1), 3, dt);
        if (st.form !== form) { form = st.form; stage.setView(FORMS[form].view.pos, FORMS[form].view.target, 1.1); }
        const cor = form === 'corona';
        cur.visible = !cor; rays.visible = cor; lbl[0].visible = lbl[1].visible = !cor;
        for (const u of [uC, uR]) {
          u.uT.value = tt; u.uFold.value = (form === 'arc' ? 0.04 : 0.15) + act * 0.85; u.uSpeed.value = 0.5 + act * 2.2; u.uArc.value = form === 'arc' ? 1 : 0.3; u.uRay.value = form === 'arc' ? 0.15 : 0.45 + 0.55 * act; u.uInt.value = (form === 'arc' ? 0.7 : 0.8) + act * 1.3;
        }
        rays.children.forEach((m, i) => { m.position.y = 18 - act * 4; m.scale.y = 1 + 0.25 * Math.sin(tt * (0.8 + act * 3) + i); });
      },
      readout(st) {
        const f = FORMS[st.form];
        return `<div class="big">${f.n}</div><p class="r-say">${f.say}</p>
          <div class="row"><span>Activity</span><b>${act < 0.2 ? 'Quiet' : act < 0.6 ? 'Active' : 'Stormy'}</b></div>`;
      },
    };
  },
};
