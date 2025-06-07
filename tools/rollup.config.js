import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { readFileSync } from 'fs';

// Read package.json for version info
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

export default {
  input: 'src/module/beyond-foundry.ts',
  output: {
    dir: 'build',
    format: 'es',
    entryFileNames: 'beyond-foundry.js',
    sourcemap: true,
    sourcemapExcludeSources: false,
    banner: `/*
 * Beyond Foundry v${pkg.version}
 * ${pkg.description}
 * 
 * Author: ${pkg.author}
 * License: ${pkg.license}
 * Repository: ${pkg.repository.url}
 */`
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
      exportConditions: ['import', 'module', 'browser', 'default']
    }),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      inlineSources: true,
      declaration: false, // We handle declarations separately
      declarationMap: false
    })
  ],
  external: [],
  onwarn(warning, warn) {
    // Suppress certain warnings
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    warn(warning);
  }
};
