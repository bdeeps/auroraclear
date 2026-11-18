<!-- glassbox:start -->
<!-- Generated from glassbox.json by the Glassbox hub (npm run readme -- auroraclear). Edit glassbox.json, not this block. -->

<h1 align="center">AuroraClear</h1>

<p align="center"><b>How do the northern lights work?</b><br>Every northern light starts as a wind from the Sun. Follow its charged particles through Earth's magnetic shield, down to the poles, and see why oxygen glows green low down and red high up.</p>

<p align="center"><a href="https://glassbox.how/auroraclear/"><b>▶ Play with it</b></a> &nbsp;·&nbsp; <a href="https://glassbox.how/e/auroraclear/">Read the 60-second explainer</a></p>

<p align="center">
  <a href="https://glassbox.how/e/auroraclear/"><img alt="Glassbox No. 237" src="https://img.shields.io/badge/Glassbox-No.%20237-8ef0ff"></a>
  <a href="https://glassbox.how/e/auroraclear/"><img alt="Space" src="https://img.shields.io/badge/field-Space-c49bff"></a>
  <a href="LICENSE"><img alt="Code: MIT" src="https://img.shields.io/badge/code-MIT-3fb950"></a>
  <a href="LICENSE-CONTENT.md"><img alt="Content: CC BY 4.0" src="https://img.shields.io/badge/content-CC%20BY%204.0-ef9421"></a>
  <a href="#privacy"><img alt="Privacy: explained" src="https://img.shields.io/badge/privacy-explained-555"></a>
</p>

## In 60 seconds

1. **A wind from the Sun.** The Sun constantly blows out a thin stream of charged particles, the solar wind. It moves at roughly 250 to 800 km/s and takes a few days to reach Earth. Bursts called coronal mass ejections can be faster.
2. **A magnetic shield.** Earth's magnetic field holds the wind off. It squeezes the Sun side into a bubble about 10 Earth radii wide and stretches the night side into a long tail.
3. **Spiral and bounce.** Charged particles spiral around field lines and bounce between the poles. Those that travel nearly along a line fall into the atmosphere instead.
4. **Opening the door.** When the wind's magnetic field points south, it reconnects with Earth's. Energy flows in, and particles are guided down the field into rings around the magnetic poles, the auroral ovals.
5. **Excite, then glow.** Electrons hit oxygen and nitrogen 100 to 300 km up. The atoms take the energy and give it back as light: green from oxygen near 100 to 150 km, red from oxygen above about 200 km, blue and violet from nitrogen.
6. **Why red is high.** Oxygen's red-line state waits about 110 seconds before it can glow. Low down, collisions kill it first. Only in thin air can it shine. Big storms push the lights toward the equator and can disturb satellites and power grids.

## Words worth knowing

| Term | Meaning |
|---|---|
| **Solar wind** | A constant stream of charged particles, mostly protons and electrons, flowing out of the Sun. |
| **Coronal mass ejection** | A burst of plasma and magnetic field thrown out of the Sun, often faster than the ordinary wind. |
| **Magnetosphere** | The region of space dominated by Earth's magnetic field, shaped by the solar wind. |
| **Bow shock** | The place where the supersonic solar wind slows abruptly in front of the magnetosphere. |
| **Pitch angle** | The angle between a charged particle's velocity and the magnetic field. Small angles reach the atmosphere. |
| **Magnetic reconnection** | Oppositely directed field lines break and rejoin, letting solar wind energy into Earth's field. |
| **Auroral oval** | The ring around each magnetic pole where aurora is most often seen. |
| **Excitation and emission** | An atom first takes up energy from a collision, then releases it as light of one wavelength. |
| **Quenching** | An excited atom losing its energy to a collision as heat before it can emit light. |
| **Kp index** | A 0 to 9 scale of how disturbed Earth's magnetic field is. |

## A short history

**From a 'five-coloured light' in ancient China and elders' stories in Alaska to spacecraft that fly through the Sun's atmosphere.**

- **1000 BCE** · Elders in Alaska tell what the lights are (Iñupiaq and Athabascan elders and storytellers, Alaska, USA)
- **977 BCE** · A five-coloured light in the Bamboo Annals (Chinese chroniclers; identified by Marinus van der Sluijs and Hisashi Hayakawa (2022), China)
- **1741** · Compass needles twitch when the lights shine (Anders Celsius and Olof Hiorter, Uppsala, Sweden)
- **1859** · The Carrington storm (Richard Carrington, England; effects worldwide)
- **1900** · Birkeland builds a little Earth (Kristian Birkeland, Norway)
- **1925** · The green line is made in a laboratory (John McLennan and Gordon Shrum, Canada)
- **1958** · Explorer 1 finds the radiation belts (James Van Allen's team, University of Iowa, USA)
- **1958** · Parker predicts the solar wind (Eugene Parker, University of Chicago, USA)

The full story, with 31 moments, charts, people and 38 sources: [glassbox.how/e/auroraclear/history](https://glassbox.how/e/auroraclear/history/). The data lives in [`history.json`](history.json).

## Privacy

This box has no accounts and no ads, and it ships its own fonts and libraries. When you run it yourself it sends nothing anywhere. On glassbox.how, the site's `/bar.js` also loads Glassbox's analytics: **Google Analytics** to count visits (it asks first in the EU, UK and Switzerland, and stays off when your browser sends Global Privacy Control or Do Not Track) and **ClickTrust** to detect bots.

It remembers a few things **in your own browser only**, and never sends them anywhere:

| Browser storage key | What it holds |
|---|---|
| `auroraclear.v1` | Which chapters you have opened, your best quiz scores, and sound on or off. |

Exactly what each one sees is at [glassbox.how/privacy](https://glassbox.how/privacy/).

## Licences

- **Code:** [MIT](LICENSE). Use it, change it, ship it.
- **Explanations, text, images and videos** (`glassbox.json`, `glassbox/`): [CC BY 4.0](LICENSE-CONTENT.md). Credit “Glassbox, glassbox.how/e/auroraclear”.
- **Third-party parts** keep their own licences: [three.js](https://threejs.org) (MIT), [Geist, Instrument Serif](https://openfontlicense.org) (SIL OFL 1.1).
- The Glassbox name and logo aren't covered by either licence. See the [terms](https://glassbox.how/terms/).

Found a mistake? [Open an issue](https://github.com/bdeeps/auroraclear/issues). Corrections happen in public.
<!-- glassbox:end -->

## Run it

It's plain HTML, CSS and JavaScript. No build step and no dependencies. Run locally, it contacts no other website.

```bash
python3 -m http.server 8000
```

Three.js and the fonts ship in `vendor/` and `fonts/`, so it also works offline.

Then open http://localhost:8000.

## How it's built

| File | What |
|---|---|
| `index.html`, `css/app.css` | The page and its styles |
| `js/app.js`, `js/stage.js`, `js/ui.js`, `js/kit.js` | The shared Glassbox 3D engine: chapters, 3D stage, controls, quiz, video director |
| `js/chapters/*.js` | One file per chapter: the 3D model, controls, text, key terms, quiz and video scenes |
| `glassbox.json` | Title, question, explainer beats, key terms, browser storage and credits shown on glassbox.how |
| `reel` in each chapter | The storyboard the Glassbox studio records into short videos |
| `glassbox/` | The published video, slides, thumbnail and post copy |
| `fonts/`, `vendor/three/` | Self-hosted Geist and Instrument Serif (SIL OFL 1.1) and three.js (MIT) |
