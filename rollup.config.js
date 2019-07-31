import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import pascalCase from 'pascal-case';

const VERSION = require('./version.js');

const libConfigurator = (file, plugins = []) => ({
  input: 'src/index.js',
  output: {
    name: 'createPileMe',
    format: 'umd',
    file,
    globals: {
      'pub-sub-es': 'createPubSub',
      regl: 'createREGL'
    },
    intro: `var VERSION = ${VERSION};`
  },
  plugins: [resolve(), commonjs({ sourceMap: false }), babel(), ...plugins],
  external: ['pub-sub-es', 'regl']
});

const libDev = libConfigurator('dist/pile-me.js', [filesize()]);
const libProd = libConfigurator('dist/pile-me.js', [terser()]);

const rendererConfigurator = (
  name,
  plugins = [],
  external = [],
  globals = {}
) => ({
  input: `src/${name}.js`,
  output: {
    name: `create${pascalCase(name)}`,
    format: 'umd',
    file: `dist/${name}.js`,
    globals,
    intro: `var VERSION = ${VERSION};`
  },
  plugins: [resolve(), commonjs({ sourceMap: false }), babel(), ...plugins],
  external
});

const imgRndrDev = rendererConfigurator('image-renderer', [filesize()]);
const imgRndrProd = rendererConfigurator('image-renderer', [terser()]);

export default [libDev, libProd, imgRndrDev, imgRndrProd];
