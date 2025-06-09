import typescript from '@rollup/plugin-typescript';
import path from 'path';

export default {
  input: 'src/parsers/character/CharacterParser.ts',
  output: {
    file: 'build/character-parser-node.js',
    format: 'esm',
    exports: 'named',
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      sourceMap: false,
    }),
    {
      name: 'logger-stub',
      resolveId(source) {
        if (source === '../../module/utils/logger.js') {
          return path.resolve('build/logger.js');
        }
        return null;
      },
    },
  ],
};
