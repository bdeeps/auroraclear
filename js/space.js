// Shared parts for AuroraClear: a space scene (stars, sun light, Earth), glowing point clouds, fat line sets,
// dipole-field maths, and the auroral oval. One unit = one Earth radius (Re) inside the magnetosphere chapters.
import { THREE, M, clamp, lerp, smooth, approach } from './kit.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';

export { THREE, M, clamp, lerp, smooth, approach };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const D2R = Math.PI / 180;
export const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const COL = { green: 0x6dffa0, red: 0xff4d57, blue: 0x6a8cff, violet: 0xb07cff, pink: 0xff7ab8, sun: 0xffc45a, wind: 0xffd98a, elec: 0x8ef0ff, field: 0x8ab4ff, shock: 0xffb547, pause: 0x9fe8ff, earth: 0x1b4f8f, amber: 0xffb547 };

let dot = null;
export function dotTex() {
  if (dot) return dot;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  dot = new THREE.CanvasTexture(c); dot.colorSpace = THREE.SRGBColorSpace;
  return dot;
}

// A cloud of glowing dots with per-dot colour. Write p.pos / p.col, then call p.upd().
export function cloud(n, { size = 0.3, opacity = 1, atten = true } = {}) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), col = new Float32Array(n * 3).fill(1);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size, map: dotTex(), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true, sizeAttenuation: atten });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false; p.pos = pos; p.col = col; p.n = n;
  p.upd = () => { g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; };
  p.setCol = (i, hex, k = 1) => { const c = new THREE.Color(hex); p.col[i * 3] = c.r * k; p.col[i * 3 + 1] = c.g * k; p.col[i * 3 + 2] = c.b * k; };
  return p;
}

// A glowing sprite (halo).
export function halo(color, size, opacity = 0.8) {
  const m = new THREE.SpriteMaterial({ map: dotTex(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
  const s = new THREE.Sprite(m); s.scale.setScalar(size); return s;
}

// Fat lines from polylines (arrays of Vector3), updated in place without leaking GPU buffers.
export class Lines {
  constructor(stage, cap, { color = 0x8ab4ff, width = 1.5, opacity = 0.9 } = {}) {
    this.cap = cap; this.arr = new Float32Array(cap * 6);
    this.geo = new LineSegmentsGeometry();
    this.geo.setPositions(new Float32Array(cap * 6).fill(0.0001));
    this.mat = stage.lineMaterial({ color, linewidth: width, transparent: true, opacity, worldUnits: false, depthWrite: false });
    this.obj = new LineSegments2(this.geo, this.mat);
    this.obj.frustumCulled = false;
  }
  set(polys) {
    const a = this.arr; let n = 0;
    for (const P of polys) {
      for (let i = 0; i < P.length - 1 && n < this.cap; i++, n++) {
        const p = P[i], q = P[i + 1], o = n * 6;
        a[o] = p.x; a[o + 1] = p.y; a[o + 2] = p.z; a[o + 3] = q.x; a[o + 4] = q.y; a[o + 5] = q.z;
      }
    }
    const buf = this.geo.attributes.instanceStart.data;
    buf.array.set(a); buf.needsUpdate = true;
    this.geo.instanceCount = n;
  }
}

// Stars, a sun-side light, and a dim fill. Hides the floor grid.
export function spaceScene(stage, { sun = [-1, 0.12, 0.25], stars = true } = {}) {
  stage.setWorldMode(true);
  stage.scene.environmentIntensity = 0.22;
  const amb = new THREE.AmbientLight(0x7d8cc0, 0.55), L = new THREE.DirectionalLight(0xfff1d8, 3.2);
  L.position.set(...sun).multiplyScalar(80);
  stage.root.add(amb, L);
  if (stars) {
    const r = rng(11), p = new THREE.BufferGeometry(), pos = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) { const u = r() * 2 - 1, a = r() * 6.283, s = Math.sqrt(1 - u * u), R = 600; pos[i * 3] = s * Math.cos(a) * R; pos[i * 3 + 1] = u * R; pos[i * 3 + 2] = s * Math.sin(a) * R; }
    p.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const st = new THREE.Points(p, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, color: 0xcfd8ff, transparent: true, opacity: 0.7, depthWrite: false }));
    st.frustumCulled = false; stage.root.add(st);
  }
  return L;
}

// A plain Earth: ocean-blue ball, a faint 30° graticule and a thin blue haze. No continents (they would be invented).
export function earth(R = 1, { grid = true, tilt = 0 } = {}) {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40), new THREE.MeshStandardMaterial({ color: COL.earth, roughness: 0.75, metalness: 0 }));
  g.add(ball);
  if (grid) {
    const pts = [];
    for (let lat = -60; lat <= 60; lat += 30) for (let i = 0; i < 96; i++) for (const j of [i, i + 1]) { const a = (j / 96) * 6.2832; pts.push(R * 1.002 * Math.cos(lat * D2R) * Math.cos(a), R * 1.002 * Math.sin(lat * D2R), R * 1.002 * Math.cos(lat * D2R) * Math.sin(a)); }
    for (let lon = 0; lon < 180; lon += 30) for (let i = 0; i < 96; i++) for (const j of [i, i + 1]) { const a = (j / 96) * 6.2832, c = Math.cos(a) * R * 1.002, y = Math.sin(a) * R * 1.002; pts.push(c * Math.cos(lon * D2R), y, c * Math.sin(lon * D2R)); }
    const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.add(new THREE.LineSegments(ge, new THREE.LineBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0.22 })));
  }
  const haze = new THREE.Mesh(new THREE.SphereGeometry(R * 1.035, 48, 32), new THREE.MeshBasicMaterial({ color: 0x7fb2ff, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending }));
  g.add(haze); g.ball = ball; g.rotation.z = tilt;
  return g;
}

// ---------------------------------------------------------------- dipole field maths
// Field strength relative to the equator on the same line, at magnetic latitude lat (radians).
export const bRatio = (lat) => { const s = Math.sin(lat), c = Math.cos(lat); return Math.sqrt(1 + 3 * s * s) / Math.pow(c, 6); };
// Latitude where a particle with equatorial pitch angle alpha (radians) mirrors.
export function mirrorLat(alpha) {
  const target = 1 / Math.pow(Math.sin(alpha), 2); let lo = 0, hi = Math.PI / 2 - 1e-4;
  for (let i = 0; i < 28; i++) { const m = (lo + hi) / 2; if (bRatio(m) < target) lo = m; else hi = m; }
  return lo;
}
export const surfaceLat = (L, r = 1) => Math.acos(Math.sqrt(Math.min(1, r / L)));
// Edge of the loss cone (radians) for line L, counting the atmosphere as r = 1.0157 Re (about 100 km up).
export const lossCone = (L) => Math.asin(Math.sqrt(1 / bRatio(surfaceLat(L, 1.0157))));
// Points of dipole line L at azimuth phi about the magnetic (y) axis. phi = 0 points away from the Sun.
export function dipoleLine(L, phi = 0, n = 48, latMax) {
  const lm = latMax ?? surfaceLat(L), pts = [];
  for (let i = 0; i <= n; i++) { const lat = lerp(-lm, lm, i / n), r = L * Math.cos(lat) ** 2, rho = r * Math.cos(lat); pts.push(V(rho * Math.cos(phi), r * Math.sin(lat), rho * Math.sin(phi))); }
  return pts;
}
// Magnetopause radius at angle th from the Sun line (Shue et al. 1997 shape, northward-neutral IMF). Dp in nPa.
export const rMagnetopause = (Dp) => 11.4 * Math.pow(Dp, -0.1515);
export const shue = (r0, th, Dp = 2) => r0 * Math.pow(2 / (1 + Math.cos(th)), 0.58 * (1 + 0.024 * Math.log(Dp)));

// ---------------------------------------------------------------- activity and the auroral oval
// Illustrative driver: Newell-style coupling v^(4/3) Bt^(2/3) sin^(8/3)(clock/2), for a purely north-south field.
export function coupling(v, bz) { const south = bz < 0, bt = Math.max(Math.abs(bz), 0.05); return Math.pow(v, 4 / 3) * Math.pow(bt, 2 / 3) * (south ? 1 : 0.05); }
export function kpFrom(v, bz) { return clamp(0.7 + 3 * Math.pow(coupling(v, bz) / 8610, 0.7), 0, 9); }
// Equatorward edge of the oval in geomagnetic latitude (degrees), an illustrative 2° per Kp step (not a forecast).
export const ovalEq = (kp) => 66.5 - 2.04 * kp;
export const ovalPole = (kp) => 70.5 - 0.45 * kp;

// The oval as a glowing ribbon on a sphere of radius R about the +y axis. m.set(kp, t, k) reshapes and brightens it.
export function ovalMesh(R = 1.012) {
  const N = 120, grp = new THREE.Group(), meshes = [];
  const idx = []; for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  for (const sgn of [1, -1]) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((N + 1) * 6), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array((N + 1) * 6), 3));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    m.scale.y = sgn; m.frustumCulled = false; grp.add(m); meshes.push(m);
  }
  const c1 = new THREE.Color(COL.green), c2 = new THREE.Color(0xb07cff);
  grp.set = (kp, t = 0, k = 1) => {
    const eq = ovalEq(kp) * D2R, po = ovalPole(kp) * D2R;
    for (const m of meshes) {
      const P = m.geometry.attributes.position.array, C = m.geometry.attributes.color.array;
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * 6.2832, ripple = 1 + 0.22 * Math.sin(6 * a + 2 * t), day = 0.3 + 0.7 * Math.cos(a / 2) ** 2;
        for (let e = 0; e < 2; e++) {
          const lat = e ? po : eq, col = (Math.PI / 2 - lat), v = V(Math.sin(col) * Math.cos(a) + 0.07, Math.cos(col), Math.sin(col) * Math.sin(a)).normalize().multiplyScalar(R);
          const o = (i * 2 + e) * 3; P[o] = v.x; P[o + 1] = v.y; P[o + 2] = v.z;
          const w = e ? 0.25 : 1, inten = k * day * ripple * (0.35 + 0.15 * kp / 9) * w;
          const cc = c1.clone().lerp(c2, e ? 0.6 : 0);
          C[o] = cc.r * inten; C[o + 1] = cc.g * inten; C[o + 2] = cc.b * inten;
        }
      }
      m.geometry.attributes.position.needsUpdate = true; m.geometry.attributes.color.needsUpdate = true;
    }
  };
  grp.set(2, 0);
  return grp;
}

export const fmt = { n1: (v) => v.toFixed(1), n0: (v) => Math.round(v) };
