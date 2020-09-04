/* eslint-env node */
import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import replace from '@rollup/plugin-replace';
import { string } from 'rollup-plugin-string';
// import visualizer from 'rollup-plugin-visualizer';
import nodePolyfills from 'rollup-plugin-node-polyfills';

const bundleConfig = (file, plugins = [], format = 'umd') => ({
  input: 'src/index.js',
  output: {
    name: 'pilingJs',
    format,
    file,
    globals: {
      'pixi.js': 'PIXI',
      'umap-js': 'UMAP',
    },
  },
  plugins: [
    json(),
    babel({ runtimeHelpers: true }),
    resolve({
      browser: true,
      dedupe: ['gl-matrix'],
      mainFields: ['module', 'main'],
      preferBuiltins: false,
    }),
    commonjs({ sourceMap: false }),
    string({
      include: '**/skmeans.min',
    }),
    nodePolyfills(),
    replace({
      'browser.env.NODE_ENV': '"production"',
    }),
    ...plugins,
  ],
  external: ['pixi.js', 'regl', 'umap-js'],
});

const bundleDev = bundleConfig('dist/piling.js', [filesize()]);
const bundleProd = bundleConfig('dist/piling.min.js', [terser()]);
const bundleEsm = bundleConfig('dist/piling.esm.js', [filesize()], 'es');

const libConfig = (file, plugins = [], format = 'umd') => ({
  input: 'src/library.js',
  output: {
    name: 'pilingJsLibrary',
    format,
    file,
    globals: {
      'pixi.js': 'PIXI',
    },
  },
  plugins: [
    json(),
    resolve({
      browser: true,
      dedupe: ['gl-matrix'],
      mainFields: ['module', 'main'],
      preferBuiltins: false,
    }),
    commonjs({ sourceMap: false }),
    babel({ runtimeHelpers: true }),
    nodePolyfills(),
    replace({
      'browser.env.NODE_ENV': '"production"',
    }),
    ...plugins,
  ],
  external: ['pixi.js'],
});

const libEsm = libConfig('dist/piling-library.esm.js', [filesize()], 'es');

const rndConfig = (file, plugins = [], format = 'umd') => ({
  input: 'src/renderer.js',
  output: {
    name: 'pilingJsRenderer',
    format,
    file,
    globals: {
      'pixi.js': 'PIXI',
    },
  },
  plugins: [
    json(),
    resolve({
      browser: true,
      dedupe: ['gl-matrix'],
      mainFields: ['module', 'main'],
      preferBuiltins: false,
    }),
    commonjs({ sourceMap: false }),
    babel({ runtimeHelpers: true }),
    nodePolyfills(),
    replace({
      'browser.env.NODE_ENV': '"production"',
    }),
    ...plugins,
  ],
  external: ['pixi.js', 'regl'],
});

const rndEsm = rndConfig('dist/piling-renderer.esm.js', [filesize()], 'es');

const agrConfig = (file, plugins = [], format = 'umd') => ({
  input: 'src/aggregator.js',
  output: {
    name: 'pilingJsAggregator',
    format,
    file,
    globals: {},
  },
  plugins: [
    json(),
    resolve({
      browser: true,
      dedupe: ['gl-matrix'],
      mainFields: ['module', 'main'],
      preferBuiltins: false,
    }),
    commonjs({ sourceMap: false }),
    babel({ runtimeHelpers: true }),
    nodePolyfills(),
    replace({
      'browser.env.NODE_ENV': '"production"',
    }),
    ...plugins,
  ],
  external: [],
});

const agrEsm = agrConfig('dist/piling-aggregator.esm.js', [filesize()], 'es');

const clstConfig = (file, plugins = [], format = 'umd') => ({
  input: 'src/clusterer.js',
  output: {
    name: 'pilingJsClusterer',
    format,
    file,
    globals: {},
  },
  plugins: [
    json(),
    resolve({
      browser: true,
      dedupe: ['gl-matrix'],
      mainFields: ['module', 'main'],
      preferBuiltins: false,
    }),
    commonjs({ sourceMap: false }),
    babel({ runtimeHelpers: true }),
    string({
      include: '**/skmeans.min',
    }),
    nodePolyfills(),
    replace({
      'browser.env.NODE_ENV': '"production"',
    }),
    ...plugins,
  ],
  external: [],
});

const clstEsm = clstConfig('dist/piling-clusterer.esm.js', [filesize()], 'es');

const dimRedConfig = (file, plugins = [], format = 'umd') => ({
  input: 'src/dimensionality-reducer.js',
  output: {
    name: 'pilingJsDimensionalityReducer',
    format,
    file,
    globals: {},
  },
  plugins: [
    json(),
    resolve({
      browser: true,
      dedupe: ['gl-matrix'],
      mainFields: ['module', 'main'],
      preferBuiltins: false,
    }),
    commonjs({ sourceMap: false }),
    babel({ runtimeHelpers: true }),
    string({
      include: '**umap-js.min',
    }),
    nodePolyfills(),
    replace({
      'browser.env.NODE_ENV': '"production"',
    }),
    ...plugins,
  ],
  external: [],
});

const dimRedEsm = dimRedConfig(
  'dist/piling-dimensionality-reducer.esm.js',
  [filesize()],
  'es'
);

export default [
  bundleDev,
  bundleProd,
  bundleEsm,
  libEsm,
  rndEsm,
  agrEsm,
  clstEsm,
  dimRedEsm,
];
