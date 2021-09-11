/* eslint-env node */
import babel from 'rollup-plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import postcssFlexbugsFixes from 'postcss-flexbugs-fixes';
import postcssPresetEnv from 'postcss-preset-env';
import { string } from 'rollup-plugin-string';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import livereload from 'rollup-plugin-livereload';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'examples/index-public.js',
  output: {
    sourcemap: false,
    format: 'iife',
    name: 'app',
    file: 'webpage-build/demos/index.js',
  },
  plugins: [
    json(),
    babel({ runtimeHelpers: true }),
    nodeResolve({
      browser: true,
      dedupe: ['gl-matrix'],
      mainFields: ['module', 'main'],
      preferBuiltins: false,
    }),
    commonjs({
      sourceMap: false,
      exclude: /(umap-js|skmeans)/,
    }),
    string({
      include: /(umap-js|skmeans)/,
    }),
    nodePolyfills(),
    replace({
      'browser.env.NODE_ENV': '"production"',
    }),

    postcss({
      extract: true,
      minimize: true,
      extensions: ['.scss', '.sass', '.css'],
      plugins: [
        postcssFlexbugsFixes(),
        postcssPresetEnv({
          autoprefixer: { grid: true },
          browsers: 'last 2 version, >0.25%',
          stage: 3,
        }),
      ],
    }),

    !production && livereload(),

    production && terser(),
  ],
};
