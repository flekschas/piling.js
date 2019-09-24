<h1 align="center">
  Pile.js
</h1>

<div align="center">
  
  **A general framework and library for visual piling.**
  
</div>

<br/>

<div align="center">
  
  [![Docs](https://img.shields.io/badge/docs-📖-7fcaff.svg?style=flat-square&color=7fd4ff)](https://github.com/flekschas/pile.js/blob/master/DOCS.md)
  [![NPM Version](https://img.shields.io/npm/v/pile.js.svg?style=flat-square&color=7f99ff)](https://npmjs.org/package/pile.js)
  [![Build Status](https://img.shields.io/travis/flekschas/pixi.js-b37fff.svg?style=flat-square&color=a17fff)](https://travis-ci.org/flekschas/pile.js/)
  [![File Size](https://img.shields.io/bundlephobia/minzip/pile.js?style=flat-square&color=e17fff&label=gzipped%20size)](https://unpkg.com/pile.js)
  [![Code Style Prettier](https://img.shields.io/badge/code%20style-prettier-ff7fe1.svg?style=flat-square)](https://github.com/prettier/prettier#readme)
  [![Demo](https://img.shields.io/badge/demo-👍-ff7fa5.svg?style=flat-square)](https://flekschas.github.io/pile.js/)
  
</div>

<div align="center"><img src="./examples/demo.gif"></div>

Pile.js currently supports visual piling of images and matrix visualizations but can be easily customized with your own render.

## Get Started


**Import**

```javascript
import createPileJs from 'pile.js';
```

**Quick Start**

```javascript
// import the main library
import createPileJs from '../src/index';
// import the predefined image renderer
import { createImageRenderer } from '../src/renderer';
// import your data
import data from './data/photo.json';

// create a pileJs instance
// 'demo' is the div object which the canvas will be added on
const pileJs = createPileMe(document.getElementById('demo'));

// set the renderer
pileJs.set('renderer', imageRenderer);
// set the items
pileJs.set('items', data);
// ...and you are done!
```

## Development

**Install**

```bash
git clone https://github.com/flekschas/pile.js
cd pile-me
npm ci
```

**Start the Development Server**

```
npm start
```

**Update Demo**

```
npm run deploy
```
