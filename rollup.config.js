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
    name: 'createPilingJs',
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

const bundleDev = bundleConfigurator('dist/piling.js', [filesize()]);
const bundleProd = bundleConfigurator('dist/piling.min.js', [terser()]);

const libConfigurator = (file, plugins = []) => ({
  input: 'src/library.js',
  output: {
    name: 'createPilingJs',
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

const libDev = libConfigurator('dist/piling-library.js', [
  filesize(),
  visualizer()
]);
const libProd = libConfigurator('dist/piling-library.min.js', [terser()]);

const rndConfigurator = (file, plugins = []) => ({
  input: 'src/renderer.js',
  output: {
    name: 'pilingJsRenderer',
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

const rndDev = rndConfigurator('dist/piling-renderer.js', [filesize()]);
const rndProd = rndConfigurator('dist/piling-renderer.min.js', [terser()]);

const agrConfigurator = (file, plugins = []) => ({
  input: 'src/aggregator.js',
  output: {
    name: 'pilingJsAggregator',
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

const agrDev = agrConfigurator('dist/piling-aggregator.js', [filesize()]);
const agrProd = agrConfigurator('dist/piling-aggregator.min.js', [terser()]);

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
