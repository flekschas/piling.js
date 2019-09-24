import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import visualizer from 'rollup-plugin-visualizer';

const VERSION = require('./version.js');

const bundleConfigurator = (file, plugins = []) => ({
  input: 'src/index.js',
  output: {
    name: 'createPileJs',
    format: 'umd',
    file,
    globals: {
      'pixi.js': 'PIXI',
      regl: 'createREGL'
    },
    intro: `var VERSION = ${VERSION};`
  },
  plugins: [
    resolve(),
    commonjs({ sourceMap: false }),
    babel({ runtimeHelpers: true }),
    ...plugins
  ],
  external: ['pixi.js', 'regl']
});

const bundleDev = bundleConfigurator('dist/pile.js', [filesize()]);
const bundleProd = bundleConfigurator('dist/pile.js', [terser()]);

const libConfigurator = (file, plugins = []) => ({
  input: 'src/library.js',
  output: {
    name: 'createPileJs',
    format: 'umd',
    file,
    globals: {
      'pixi.js': 'PIXI'
    },
    intro: `var VERSION = ${VERSION};`
  },
  plugins: [
    resolve(),
    commonjs({ sourceMap: false }),
    babel({ runtimeHelpers: true }),
    ...plugins
  ],
  external: ['pixi.js']
});

const libDev = libConfigurator('dist/pile-library.js', [
  filesize(),
  visualizer()
]);
const libProd = libConfigurator('dist/pile-library.js', [terser()]);

const rndConfigurator = (file, plugins = []) => ({
  input: 'src/renderer.js',
  output: {
    name: 'pileJsRenderer',
    format: 'umd',
    file,
    globals: {
      'pixi.js': 'PIXI',
      regl: 'createREGL'
    },
    intro: `var VERSION = ${VERSION};`
  },
  plugins: [
    resolve(),
    commonjs({ sourceMap: false }),
    babel({ runtimeHelpers: true }),
    ...plugins
  ],
  external: ['pixi.js', 'regl']
});

const rndDev = rndConfigurator('dist/pile-renderer.js', [filesize()]);
const rndProd = rndConfigurator('dist/pile-renderer.js', [terser()]);

const agrConfigurator = (file, plugins = []) => ({
  input: 'src/aggregator.js',
  output: {
    name: 'pileJsAggregator',
    format: 'umd',
    file,
    globals: {},
    intro: `var VERSION = ${VERSION};`
  },
  plugins: [
    resolve(),
    commonjs({ sourceMap: false }),
    babel({ runtimeHelpers: true }),
    ...plugins
  ],
  external: []
});

const agrDev = agrConfigurator('dist/pile-aggregator.js', [filesize()]);
const agrProd = agrConfigurator('dist/pile-aggregator.js', [terser()]);

export default [
  bundleDev,
  bundleProd,
  libDev,
  libProd,
  rndDev,
  rndProd,
  agrDev,
  agrProd
];
