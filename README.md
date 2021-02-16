<h1 align="center">
  Piling.js
</h1>

<div align="center">
  
  **A general framework and library for visual piling/stacking.**
  
</div>

<br/>

<div align="center">
  
  [![Docs](https://img.shields.io/badge/docs-📖-7fcaff.svg?style=flat-square&color=7fd4ff)](https://piling.js.org/docs)
  [![NPM Version](https://img.shields.io/npm/v/piling.js.svg?style=flat-square&color=7f99ff)](https://npmjs.org/package/piling.js)
  [![Build Status](https://img.shields.io/github/workflow/status/flekschas/piling.js/build?color=a17fff&style=flat-square)](https://github.com/flekschas/piling.js/actions?query=workflow%3Abuild)
  [![File Size](http://img.badgesize.io/https://unpkg.com/piling.js/dist/piling.min.js?compression=gzip&color=e17fff&style=flat-square)](https://bundlephobia.com/result?p=piling.js)
  [![Code Style Prettier](https://img.shields.io/badge/code%20style-prettier-ff7fe1.svg?style=flat-square)](https://github.com/prettier/prettier#readme)
  [![Demos](https://img.shields.io/badge/demo-👍-ff7fa5.svg?style=flat-square)](https://piling.js.org/demos)
  
</div>

<div id="teaser-matrices" align="center">
  
  ![Preview](https://user-images.githubusercontent.com/932103/65613151-8107e980-df83-11e9-86bf-72be591fe284.gif)
  
</div>

Piling.js currently supports visual piling of [images](#quick-start), [matrices](#teaser-matrices), and [SVG](https://piling.js.org/demos/?example=ridgeplot) out of the box, but can easily be customized with [your own render](https://piling.js.org/docs/?id=define-your-own-renderer).

## Get Started

#### Install

```bash
npm install piling.js pixi.js
```

PixiJS is the underlying Optionally, if you want to lay out piles by more than two attributes you have to install UMAP as follows.

```bash
npm install umap-js
```

#### Quick Start

Let's pile some natural images

```javascript
import createPilingJs, { createImageRenderer } from 'piling.js';

// define your items
const items = [{ src: 'http://example.com/my-fancy-photo.png' }, ...];

// instantiate a matching the data type of your items
const itemRenderer = createImageRenderer();

const piling = createPilingJs(
  document.getElementById('demo'), // dom element in which piling.js will be rendered
  {
    // Mandatory: add the items and corresponding renderer
    items,
    itemRenderer,
    // Optional: configure the view specification
    columns: 4
  }
);
```

Et voilà 🎉

![teaser-natural-images](https://user-images.githubusercontent.com/932103/65775958-24d1d080-e10f-11e9-8d12-5aaf6f760228.gif)

### Using Piling.js With an Application Framework

We've set up the following examples for how to use Piling.js with popular application frameworks:

- [Piling.js with Svelte](https://github.com/flekschas/piling.js-svelte)
- [Piling.js with React](https://github.com/flekschas/piling.js-react)
- [Piling.js with Vue](https://github.com/flekschas/piling.js-vue)

## Development

**Install**

```bash
git clone https://github.com/flekschas/piling.js
cd piling.js
npm install
```

**Start the Development Server**

```
npm start
```
