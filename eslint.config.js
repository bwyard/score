import tseslint from 'typescript-eslint'
import tsdoc from 'eslint-plugin-tsdoc'

export default tseslint.config(
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      tsdoc,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'tsdoc/syntax': 'warn',
    },
  },
  {
    // Test files: relax rules that conflict with test utilities (vitest-axe,
    // @testing-library, vi.fn(), expect.extend()) which have imperfect types.
    files: ['**/tests/**/*.ts', '**/tests/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-call':        'off',
      '@typescript-eslint/no-unsafe-assignment':  'off',
      '@typescript-eslint/no-unsafe-argument':    'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return':      'off',
      'tsdoc/syntax':                             'off',
    },
  },
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', '**/*.js', '**/*.mjs'],
  },
)
