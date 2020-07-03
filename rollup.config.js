// import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import { string } from 'rollup-plugin-string';
// import visualizer from 'rollup-plugin-visualizer';
import nodePolyfills from 'rollup-plugin-node-polyfills';

const bundleConfig = (file, plugins = [], format = 'umd') => ({
  input: 'src/index.js',
  output: {
    name: 'createPilingJs',
    format,
    file,
    intro: 'var process = { env: { NODE_ENV: "production" } };',
    globals: {
      'pixi.js': 'PIXI',
      regl: 'createREGL',
      'umap-js': 'UMAP'
    }
  },
  plugins: [
    json(),
    babel({ runtimeHelpers: true }),
    resolve({
      browser: true,
      dedupe: ['gl-matrix'],
      mainFields: ['module', 'main'],
      referBuiltins: false
    }),
    commonjs({ sourceMap: false }),
    string({
      include: '**/skmeans.min'
    }),
    nodePolyfills(),
    ...plugins
  ],
  external: ['pixi.js', 'regl', 'umap-js']
});

// const bundleDev = bundleConfig('dist/piling.js', [filesize()]);
// const bundleProd = bundleConfig('dist/piling.min.js', [terser()]);
const bundleEsm = bundleConfig('dist/piling.esm.js', [filesize()], 'es');

// const libConfig = (file, plugins = [], format = 'umd') => ({
//   input: 'src/library.js',
//   output: {
//     name: 'createPilingJs',
//     format,
//     file,
//     intro: 'var process = { env: { NODE_ENV: "production" } };',
//     globals: {
//       'pixi.js': 'PIXI'
//     }
//   },
//   plugins: [
//     json(),
//     resolve({
//       browser: true,
//       dedupe: ['gl-matrix'],
//       mainFields: ['module', 'main'],
//       preferBuiltins: false
//     }),
//     commonjs({ sourceMap: false }),
//     babel({ runtimeHelpers: true }),
//     ...plugins
//   ],
//   external: ['pixi.js']
// });

// const libDev = libConfig('dist/piling-library.js', [filesize(), visualizer()]);
// const libProd = libConfig('dist/piling-library.min.js', [terser()]);
// const libEsm = libConfig('dist/piling-library.esm.js', [filesize()], 'es');

// const rndConfig = (file, plugins = [], format = 'umd') => ({
//   input: 'src/renderer.js',
//   output: {
//     name: 'pilingJsRenderer',
//     format,
//     file,
//     intro: 'var process = { env: { NODE_ENV: "production" } };',
//     globals: {
//       'pixi.js': 'PIXI',
//       regl: 'createREGL'
//     }
//   },
//   plugins: [
//     json(),
//     resolve({
//       browser: true,
//       dedupe: ['gl-matrix'],
//       mainFields: ['module', 'main'],
//       preferBuiltins: false
//     }),
//     commonjs({ sourceMap: false }),
//     babel({ runtimeHelpers: true }),
//     ...plugins
//   ],
//   external: ['pixi.js', 'regl']
// });

// const rndDev = rndConfig('dist/piling-renderer.js', [filesize()]);
// const rndProd = rndConfig('dist/piling-renderer.min.js', [terser()]);
// const rndEsm = rndConfig('dist/piling-renderer.esm.js', [filesize()], 'es');

// const agrConfig = (file, plugins = [], format = 'umd') => ({
//   input: 'src/aggregator.js',
//   output: {
//     name: 'pilingJsAggregator',
//     format,
//     file,
//     intro: 'var process = { env: { NODE_ENV: "production" } };',
//     globals: {}
//   },
//   plugins: [
//     json(),
//     resolve({
//       browser: true,
//       dedupe: ['gl-matrix'],
//       mainFields: ['module', 'main'],
//       preferBuiltins: false
//     }),
//     commonjs({ sourceMap: false }),
//     babel({ runtimeHelpers: true }),
//     ...plugins
//   ],
//   external: []
// });

// const agrDev = agrConfig('dist/piling-aggregator.js', [filesize()]);
// const agrProd = agrConfig('dist/piling-aggregator.min.js', [terser()]);
// const agrEsm = agrConfig('dist/piling-aggregator.esm.js', [filesize()], 'es');

// const clstConfig = (file, plugins = [], format = 'umd') => ({
//   input: 'src/clusterer.js',
//   output: {
//     name: 'pilingJsClusterer',
//     format,
//     file,
//     intro: 'var process = { env: { NODE_ENV: "production" } };',
//     globals: {}
//   },
//   plugins: [
//     json(),
//     resolve({
//       browser: true,
//       dedupe: ['gl-matrix'],
//       mainFields: ['module', 'main'],
//       preferBuiltins: false
//     }),
//     commonjs({ sourceMap: false }),
//     babel({ runtimeHelpers: true }),
//     string({
//       include: '**/skmeans.min'
//     }),
//     ...plugins
//   ],
//   external: []
// });

// const clstDev = clstConfig('dist/piling-clusterer.js', [filesize()]);
// const clstProd = clstConfig('dist/piling-clusterer.min.js', [terser()]);
// const clstEsm = clstConfig('dist/piling-clusterer.esm.js', [filesize()], 'es');

// const dimRedConfig = (file, plugins = [], format = 'umd') => ({
//   input: 'src/dimensionality-reducer.js',
//   output: {
//     name: 'pilingJsDimensionalityReducer',
//     format,
//     file,
//     intro: 'var process = { env: { NODE_ENV: "production" } };',
//     globals: {}
//   },
//   plugins: [
//     json(),
//     resolve({
//       browser: true,
//       dedupe: ['gl-matrix'],
//       mainFields: ['module', 'main'],
//       preferBuiltins: false
//     }),
//     commonjs({ sourceMap: false }),
//     babel({ runtimeHelpers: true }),
//     string({
//       include: '**umap-js.min'
//     }),
//     ...plugins
//   ],
//   external: []
// });

// const dimRedDev = dimRedConfig('dist/piling-dimensionality-reducer.js', [
//   filesize()
// ]);
// const dimRedProd = dimRedConfig('dist/piling-dimensionality-reducer.min.js', [
//   terser()
// ]);
// const dimRedEsm = dimRedConfig(
//   'dist/piling-dimensionality-reducer.esm.js',
//   [filesize()],
//   'es'
// );

export default [
  // bundleDev,
  // bundleProd,
  bundleEsm
  // libDev,
  // libProd,
  // libEsm,
  // rndDev,
  // rndProd,
  // rndEsm,
  // agrDev,
  // agrProd,
  // agrEsm,
  // clstDev,
  // clstProd,
  // clstEsm,
  // dimRedDev,
  // dimRedProd,
  // dimRedEsm
];
