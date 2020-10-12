/* eslint-env node */
import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
// import copy from 'rollup-plugin-copy-assets';
// import { string } from 'rollup-plugin-string';
// import preprocess from 'svelte-preprocess';
import postcss from 'rollup-plugin-postcss';
import postcssFlexbugsFixes from 'postcss-flexbugs-fixes';
import postcssPresetEnv from 'postcss-preset-env';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/index.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/bundle.js',
  },
  plugins: [
    svelte({
      // enable run-time checks when not in production
      dev: !production,
      emitCss: true,
      // we'll extract any component CSS out into
      // a separate file — better for performance
      css: (css) => {
        css.write('public/bundle.css');
      },
    }),

    // We need to dedupe svelte core packages to get svelte-simple-modal working
    resolve({
      dedupe: ['svelte', 'svelte/transition', 'svelte/internal'],
    }),
    commonjs(),

    // For Svelte Material UI
    postcss({
      extract: true,
      minimize: true,
      use: [
        [
          'sass',
          {
            includePaths: ['./src/theme', './node_modules'],
          },
        ],
      ],
      plugins: [
        postcssFlexbugsFixes(),
        postcssPresetEnv({
          autoprefixer: { grid: true },
          browsers: 'last 2 version, >0.25%',
          stage: 3,
        }),
      ],
    }),

    // Copy all assets
    // copy({ assets: ['src/assets'] }),

    // Reload the browser when the build changes
    !production && livereload(),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
};
