<h1 align="center">
  Piling.js
</h1>

<div align="center">
  
  **A general framework and library for visual piling/stacking.**
  
</div>

<br/>

<div align="center">
  
  [![Docs](https://img.shields.io/badge/docs-📖-7fcaff.svg?style=flat-square&color=7fd4ff)](https://github.com/flekschas/piling.js/blob/master/DOCS.md)
  [![NPM Version](https://img.shields.io/npm/v/piling.js.svg?style=flat-square&color=7f99ff)](https://npmjs.org/package/piling.js)
  [![Build Status](https://img.shields.io/travis/flekschas/piling.js?color=a17fff&style=flat-square)](https://travis-ci.org/flekschas/piling.js/)
  [![File Size](https://img.shields.io/bundlephobia/minzip/piling.js?style=flat-square&color=e17fff&label=gzipped%20size)](https://unpkg.com/piling.js)
  [![Code Style Prettier](https://img.shields.io/badge/code%20style-prettier-ff7fe1.svg?style=flat-square)](https://github.com/prettier/prettier#readme)
  [![Demo](https://img.shields.io/badge/demo-👍-ff7fa5.svg?style=flat-square)](https://flekschas.github.io/piling.js/)
  
</div>

<div align="center">
  
  ![Preview](https://user-images.githubusercontent.com/932103/65613151-8107e980-df83-11e9-86bf-72be591fe284.gif)
  
</div>

piling.js currently supports visual piling of images and matrix visualizations but can be easily customized with your own render.

## Get Started

**Quick Start**

```javascript
// import the main library
import createPilingJs from 'piling.js';
// import the predefined image renderer
import { createImageRenderer } from 'piling.js';

// define your data
const data = [{ src: 'http://example.com/my-fancy-photo.png' }];

// create piling.js
// 'demo' is the dom element which piling.js will be rendered on
const piling = createPilingJs(document.getElementById('demo'));

// set the renderer
piling.set('renderer', createImageRenderer());
// set the items
piling.set('items', data);
// set the number of columns to 10
piling.set('grid', [10]);
// ...and you are done!
```

## Development

**Install**

```bash
git clone https://github.com/flekschas/piling.js
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
