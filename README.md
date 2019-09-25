# Pile.js

A general framework and library for visual piling. The library currently supports piling of images and matrix visualizations but can be easily customized with your own render.

<img src = './examples/demo.gif' >

## Get Started

**Import**

```javascript
import createPileJs from 'pile.js';
```

**Quick Start**

```javascript
// import the main library
import createPileJs from 'pile.js';
// import the predefined image renderer
import { createImageRenderer } from 'pile.js';

// define your data
const data = [{ src: 'http://example.com/my-fancy-photo.png' }];

// create pile.js
// 'demo' is the dom element which pile.js will be rendered on
const pileJs = createPileMe(document.getElementById('demo'));

// set the renderer
pileJs.set('renderer', imageRenderer);
// set the items
pileJs.set('items', data);
// set the number of columns to 10
pileJs.set('grid', [10])
// ...and you are done!
```

## Development

**Install**

```bash
git clone https://github.com/flekschas/pile-me
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
