// Chapter 7: where and when to look, and what storms do. The oval is drawn in magnetic coordinates and Earth turns under it.
// City positions are real; each city's geomagnetic latitude is computed from the geomagnetic pole (about 80.7 N, 72.7 W,
// a rounded recent value; the pole drifts). The oval's size is an illustrative function of Kp (see ovalEq / ovalPole in space.js).
// The G-scale effects text is a short summary of NOAA SWPC's space weather scales (spaceweather.gov/noaa-scales-explanation).
import { THREE, M, V, COL, D2R, halo, spaceScene, earth, ovalMesh, clamp, approach, ovalEq, ovalPole } from '../space.js';

const POLE = [80.7, -72.7];
const CITIES = [
  ['Tromsø', 69.65, 18.96], ['Fairbanks', 64.84, -147.72], ['Reykjavik', 64.15, -21.94], ['Churchill', 58.77, -94.17], ['Edinburgh', 55.95, -3.19],
  ['Seattle', 47.61, -122.33], ['Boston', 42.36, -71.06], ['Sapporo', 43.06, 141.35], ['Hobart', -42.88, 147.33], ['Dunedin', -45.87, 170.5],
];
const geo = (lat, lon) => V(Math.cos(lat * D2R) * Math.cos(lon * D2R), Math.sin(lat * D2R), -Math.cos(lat * D2R) * Math.sin(lon * D2R));
const magLat = (lat, lon) => Math.asin(Math.sin(lat * D2R) * Math.sin(POLE[0] * D2R) + Math.cos(lat * D2R) * Math.cos(POLE[0] * D2R) * Math.cos((lon - POLE[1]) * D2R)) / D2R;
const G = (kp) => (kp >= 8.7 ? ['G5', 'Extreme', 'Some grid systems may collapse or black out. Satellites can suffer extensive surface charging and tracking trouble. NOAA notes aurora seen as low as Florida and southern Texas.'] : kp >= 7.7 ? ['G4', 'Severe', 'Widespread voltage-control problems are possible, and protective systems may trip assets off the grid. Satellites may charge and be hard to track.'] : kp >= 6.7 ? ['G3', 'Strong', 'Voltage corrections may be needed and some grid protection devices may false-alarm. Satellites can build up surface charge and drag rises in low orbit.'] : kp >= 5.7 ? ['G2', 'Moderate', 'High-latitude power systems may see voltage alarms. Ground control may need to correct satellite orientation.'] : kp >= 4.7 ? ['G1', 'Minor', 'Weak power-grid fluctuations and a minor impact on satellites are possible. Aurora is common at high latitudes.'] : ['', 'Below storm level', 'No storm effects expected. Aurora stays near the poles.']);

export default {
  id: 'where',
  short: 'Where and when to look',
  title: 'Where, when and what it costs',
  subtitle: 'The oval grows with storms, and the same storms can disturb satellites and power grids.',
  view: { pos: [-0.9, 2.7, 2.6], target: [0, 0.6, 0] },
  learn: `<p>The aurora hangs in a ring around each <b>magnetic</b> pole, not the geographic one. The magnetic pole in the north is currently in the Canadian Arctic, so North America sits closer to the ring than Europe at the same latitude. A quiet night puts the <b>oval</b> over northern Canada, Alaska, Iceland and northern Scandinavia. Both poles glow at once: the southern lights are the same thing.</p>
    <p>You need a <b>dark sky</b>, a clear view toward the pole, and a good <b>storm</b>. Aurora is most likely around local midnight, in the long dark months around the equinoxes and winter, and a couple of years after each peak of the Sun’s 11-year cycle. In a big storm the oval spreads toward the equator, and ordinary cities see it.</p>
    <p>Storms are also <b>space weather</b>. Changing magnetic fields drive currents through the ground and long power lines. In March 1989 a storm helped black out Québec’s grid for hours. The great storm of 1859, the Carrington event, set telegraph systems sparking, and a big storm in May 2024 lit the sky far south of the usual range. NOAA rates storms from G1 to G5.</p>
    <p class="tip"><b>Try it:</b> raise <b>Kp</b> or press a storm preset, then see which cities fall inside the ring.</p>
    <p class="note">The oval’s size is an illustrative model, not a forecast. City latitudes are real.</p>`,
  terms: [
    { t: 'Geomagnetic latitude', d: 'Latitude measured from the magnetic pole instead of the geographic pole. It decides how close you are to the oval.' },
    { t: 'Space weather', d: 'Changing conditions in the Sun, solar wind and Earth’s magnetic environment that can affect technology.' },
    { t: 'Geomagnetically induced current', d: 'Electric current driven through the ground and power lines by a changing magnetic field, which can overload transformers.' },
    { t: 'G scale', d: 'NOAA’s 1 to 5 rating of geomagnetic storms, tied to the Kp index.' },
  ],
  defaults: { kp: 3 },
  controls: [
    { key: 'kp', type: 'range', label: 'Activity, Kp', min: 0, max: 9, step: 0.1, fmt: (v) => `Kp ${v.toFixed(1)}`, ends: ['Quiet', 'Extreme'] },
    { key: 'go', type: 'buttons', label: 'Presets', items: [{ label: 'Quiet', act: (s) => { s.kp = 1; } }, { label: 'Moderate', act: (s) => { s.kp = 5; } }, { label: 'Severe', act: (s) => { s.kp = 8; } }, { label: 'Extreme', act: (s) => { s.kp = 9; } }] },
    { key: 'cam', type: 'buttons', label: 'Camera', items: [{ label: 'North', act: (s, inst) => inst.cam(0) }, { label: 'South', act: (s, inst) => inst.cam(1) }, { label: 'Side', act: (s, inst) => inst.cam(2) }] },
  ],
  quiz: [
    { q: 'What decides whether you are near the auroral oval?', options: ['Geomagnetic latitude', 'Distance from the Equator only', 'Time zone', 'Altitude'], answer: 0, why: 'The oval is centred on the magnetic pole, so latitude measured from it matters.' },
    { q: 'What happens to the oval in a strong storm?', options: ['It spreads toward the equator', 'It shrinks to the pole', 'It vanishes', 'It leaves Earth'], answer: 0, why: 'More energy enters, and the oval widens and moves to lower latitudes.' },
    { q: 'Which technology can strong storms disturb?', options: ['Power grids and satellites', 'Only radios', 'Nothing', 'Only compasses'], answer: 0, why: 'Induced currents stress power systems and charged particles affect satellites.' },
  ],
  reel: [],
  build({ stage, s, label }) {
    spaceScene(stage, { sun: [-1, 0.1, 0.25] });
    const root = stage.root;
    const spin = new THREE.Group(), E = earth(1), qm = new THREE.Quaternion().setFromUnitVectors(geo(...POLE), V(0, 1, 0));
    spin.add(E); root.add(spin);
    const oval = ovalMesh(1.012); root.add(oval);
    const mk = CITIES.map(([n, la, lo]) => {
      const p = geo(la, lo).multiplyScalar(1.015), dot = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), M.glow(0xffffff)); dot.position.copy(p); spin.add(dot);
      const l = label(n, [0, 0.07, 0], dot); return { n, la, lo, ml: magLat(la, lo), dot, l };
    });
    let tt = 0, kpS = s.kp, psi = 0, status = [];
    const w = V(0, 0, 0);
    return {
      cam(k) { stage.setView(...(k === 0 ? [[-0.9, 2.7, 2.6], [0, 0.6, 0]] : k === 1 ? [[-1.2, -3.6, 3.6], [0, -0.7, 0]] : [[0.5, 0.4, 5], [0, 0, 0]]), 1); },
      update(dt, st) {
        tt += dt; psi += dt * 0.12; kpS = approach(kpS, st.kp, 3, dt);
        spin.quaternion.setFromAxisAngle(V(0, 1, 0), psi).multiply(qm);
        oval.set(kpS, tt, 0.6 + kpS / 9);
        const eq = ovalEq(kpS), po = ovalPole(kpS); status = [];
        for (const c of mk) {
          c.dot.getWorldPosition(w);
          const a = Math.abs(c.ml), night = w.x > -0.1, inOval = a >= eq - 0.5 && a <= po + 3, low = !inOval && a < eq - 0.5 && a >= eq - 6, state = inOval ? 'overhead' : low ? 'low on the horizon' : 'unlikely';
          c.dot.material.color.setHex(inOval ? COL.green : low ? 0xffd25a : 0x8a93aa); c.dot.scale.setScalar(inOval ? 1.5 : 1);
          status.push({ n: c.n, ml: c.ml, state, night });
        }
      },
      readout(st) {
        const [g, nm, fx] = G(st.kp), eq = ovalEq(st.kp);
        const list = status.filter((c) => c.state !== 'unlikely').map((c) => `${c.n} (${c.state}${c.night ? '' : ', but it is day there now'})`).join(', ') || 'none of these cities';
        return `<div class="big">${g ? g + ' ' : ''}${nm}</div><p class="r-say">${fx}</p>
          <div class="row"><span>Oval’s low edge (model)</span><b>about ${eq.toFixed(0)}° geomagnetic</b></div>
          <p class="r-say">Aurora chances now: ${list}.</p>`;
      },
    };
  },
};
