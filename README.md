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
  [![File Size](http://img.badgesize.io/https://unpkg.com/piling.js/dist/piling.min.js?compression=gzip&style=flat-square&color=e17fff)](https://unpkg.com/piling.min.js)
  [![Code Style Prettier](https://img.shields.io/badge/code%20style-prettier-ff7fe1.svg?style=flat-square)](https://github.com/prettier/prettier#readme)
  [![Demo](https://img.shields.io/badge/demo-👍-ff7fa5.svg?style=flat-square)](https://flekschas.github.io/piling.js/)
  
</div>

<div id="teaser-matrices" align="center">
  
  ![Preview](https://user-images.githubusercontent.com/932103/65613151-8107e980-df83-11e9-86bf-72be591fe284.gif)
  
</div>

piling.js currently supports visual piling of [images](#quick-start) and [matrix visualizations](#teaser-matrices) but can be easily customized with your own render.

## Get Started

#### Install

```bash
npm install piling.js
```

#### Quick Start

Let's pile some natural images

```javascript
// import the piling.js library
import createPilingJs from 'piling.js';
// import the predefined image renderer
import { createImageRenderer } from 'piling.js';

// define your dataset
const data = [{ src: 'http://example.com/my-fancy-photo.png' }, ...];

// instantiate the piling.js library
// 'demo' is the dom element which piling.js will be rendered in
const piling = createPilingJs(document.getElementById('demo'));

// set the main renderer to the an instance of the image renderer
piling.set('renderer', createImageRenderer());
// add the dataset
piling.set('items', data);
// and finally set the number of columns to 10
piling.set('grid', [10]);
```

Et voilà 🎉

![teaser-natural-images](https://user-images.githubusercontent.com/932103/65775958-24d1d080-e10f-11e9-8d12-5aaf6f760228.gif)

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
