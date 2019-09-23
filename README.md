# Pile.js

A general framework and library for visual piling. The library currently supports piling of images and matrix visualizations but can be easily customized with your own render.

### Interactions:
- **Create a pile or merge piles:**
  - Drag one item/pile and drop it on another with your mouse.
  - Click on the background and drag your mouse to draw a lasso. All items/piles within the lasso will be merged into one pile.
- **Browse a pile:**
  - Click on a pile to focus on this pile, then hover your mouse on one item's preview to see the item.
- **Temporarily de-pile:**
  - Double click on a pile to temporarily de-pile the pile. Then double click on the pile again or on the background to close temporarily de-pile.
  - Right click on a pile to open the context menu. Click on <kbd>temp depile</kbd> button to temporarily de-pile the pile. Then right click on the pile again and click on <kbd>close temp depile</kbd> button to close temporarily de-pile.
- **De-pile:**
  - While pressing <kbd>SHIFT</kbd>, click on a pile to de-pile it.
  - Right click on a pile to open the context menu. Click on <kbd>depile</kbd> button to de-pile.
- **Scale a pile:**
  - While pressing <kbd>ALT</kbd>, click on a pile to automatically scale it up. 
  - While pressing <kbd>ALT</kbd>, click on a scaled-up pile to automatically scale it down. 
  - While pressing <kbd>ALT</kbd>, hover on a pile and scroll to manually scale it. Then click on the background to automatically scale it down.
  - Right click on a pile to open the context menu. Click on <kbd>scale up</kbd> button to automatically scale the pile up.
  - Right click on a scaled-up pile to open the context menu. Click on <kbd>scale donw</kbd> button to automatically scale the pile down.
- **Show grid:**
  - Right click on the background to open the context menu. Click on <kbd>show grid</kbd> button to show the grid.
  - If the grid is shown, right click on the background and click on <kbd>hide grid</kbd> button to hide the grid.
- **Context menu:**
  - Right click will open the custormized context menu.
  - While pressing <kbd>ALT</kbd>, right click will show the default context menu in the browser.

## Get Started


**Import**

```javascript
import createPileJs from 'pile.js';
```

**Quick Start**

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
