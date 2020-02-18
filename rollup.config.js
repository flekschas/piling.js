import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import visualizer from 'rollup-plugin-visualizer';

const bundleConfigurator = (file, plugins = [], format = 'umd') => ({
  input: 'src/index.js',
  output: {
    name: 'createPilingJs',
    format,
    file,
    globals: {
      'pixi.js': 'PIXI',
      regl: 'createREGL',
      'umap-js': 'UMAP'
    }
  },
  plugins: [
    json(),
    resolve({
      dedupe: ['gl-matrix'],
      mainFields: ['module', 'main']
    }),
    commonjs({ sourceMap: false }),
    babel({ runtimeHelpers: true }),
    ...plugins
  ],
  external: ['pixi.js', 'regl']
});

const bundleDev = bundleConfigurator('dist/piling.js', [filesize()]);
const bundleProd = bundleConfigurator('dist/piling.min.js', [terser()]);
const bundleEsm = bundleConfigurator('dist/piling.esm.js', [filesize()], 'es');

const libConfigurator = (file, plugins = [], format = 'umd') => ({
  input: 'src/library.js',
  output: {
    name: 'createPilingJs',
    format,
    file,
    globals: {
      'pixi.js': 'PIXI'
    }
  },
  plugins: [
    json(),
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
const libEsm = libConfigurator(
  'dist/piling-library.esm.js',
  [filesize()],
  'es'
);

const rndConfigurator = (file, plugins = [], format = 'umd') => ({
  input: 'src/renderer.js',
  output: {
    name: 'pilingJsRenderer',
    format,
    file,
    globals: {
      'pixi.js': 'PIXI',
      regl: 'createREGL'
    }
  },
  plugins: [
    json(),
    resolve(),
    commonjs({ sourceMap: false }),
    babel({ runtimeHelpers: true }),
    ...plugins
  ],
  external: ['pixi.js', 'regl']
});

const rndDev = rndConfigurator('dist/piling-renderer.js', [filesize()]);
const rndProd = rndConfigurator('dist/piling-renderer.min.js', [terser()]);
const rndEsm = rndConfigurator(
  'dist/piling-renderer.esm.js',
  [filesize()],
  'es'
);

const agrConfigurator = (file, plugins = [], format = 'umd') => ({
  input: 'src/aggregator.js',
  output: {
    name: 'pilingJsAggregator',
    format,
    file,
    globals: {}
  },
  plugins: [
    json(),
    resolve(),
    commonjs({ sourceMap: false }),
    babel({ runtimeHelpers: true }),
    ...plugins
  ],
  external: []
});

const agrDev = agrConfigurator('dist/piling-aggregator.js', [filesize()]);
const agrProd = agrConfigurator('dist/piling-aggregator.min.js', [terser()]);
const agrEsm = agrConfigurator(
  'dist/piling-aggregator.esm.js',
  [filesize()],
  'es'
);

export default [
  bundleDev,
  bundleProd,
  bundleEsm,
  libDev,
  libProd,
  libEsm,
  rndDev,
  rndProd,
  rndEsm,
  agrDev,
  agrProd,
  agrEsm
];
