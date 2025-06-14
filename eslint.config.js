import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        // FoundryVTT globals
        game: 'readonly',
        ui: 'readonly',
        canvas: 'readonly',
        foundry: 'readonly',
        Hooks: 'readonly',
        Actor: 'readonly',
        Item: 'readonly',
        Scene: 'readonly',
        Application: 'readonly',
        Dialog: 'readonly',
        FormApplication: 'readonly',
        DocumentSheet: 'readonly',
        // Browser globals
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      // Base JavaScript rules
      'no-console': 'off', // Allow console for FoundryVTT
      'no-debugger': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'no-undef': 'off', // TypeScript handles this better
      
      // TypeScript specific rules - using correct rule names
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn'
    }
  },
  {
    files: ['src/types/**/*.d.ts'],
    rules: {
      // Disable unused vars for type declaration files
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    files: ['tools/**/*.js', 'tests/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off'
    }
  },
  {
    files: ['src/module/utils/logger.ts'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  },
  {
    files: ['scripts/**/*.ts', 'scripts/**/*.js', 'tests/**/*.ts', 'tests/**/*.js', 'tests/**/*.mjs', 'beyond-foundry-proxy/**/*.js', 'beyond-foundry-proxy/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        setTimeout: 'readonly',
        fetch: 'readonly',
        performance: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    files: ['*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        setTimeout: 'readonly',
        fetch: 'readonly',
        performance: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    ignores: [
      'build/**/*',
      'dist/**/*', // Exclude all dist/ output from linting
      'beyond-foundry-proxy/dist/**/*', // Explicitly exclude proxy dist
      'reference/**/*',
      'references/**/*', // Exclude all of references/ from linting
      'node_modules/**/*',
      'analysis/**/*',
      'debug/**/*',
      'beyond-foundry-proxy/src/**/*.ts' // Exclude proxy TypeScript sources from linting
    ]
  }
];