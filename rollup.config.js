import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: 'src/beyond-foundry.ts',
  output: {
    file: 'dist/beyond-foundry.js',
    format: 'es',
    sourcemap: !isProduction
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    typescript({
      sourceMap: !isProduction,
      inlineSources: !isProduction
    }),
    copy({
      targets: [
        { src: 'module.json', dest: 'dist' },
        { src: 'lang/**/*', dest: 'dist/lang' },
        { src: 'templates/**/*', dest: 'dist/templates' },
        { src: 'assets/**/*', dest: 'dist/assets' }
      ]
    })
  ],
  external: [],
  watch: {
    include: 'src/**'
  }
};
