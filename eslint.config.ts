import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
	{ ignores: ['dist', 'coverage', 'node_modules', '.next', '.turbo', 'build'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		plugins: {
			react,
			'react-hooks': reactHooks,
		},
		languageOptions: {
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		rules: {
			'no-console': 'off',
			'no-unused-vars': 'warn',
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-var-requires': 'error',
			'prefer-const': 'error',
			'no-var': 'error',
			'object-shorthand': 'error',
			'prefer-template': 'error',
			'template-curly-spacing': 'error',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-empty-interface': 'warn',
			'@typescript-eslint/no-inferrable-types': 'off',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/consistent-type-imports': 'warn',
			'react/jsx-uses-react': 'off',
			'react/jsx-uses-vars': 'error',
			'react/no-direct-mutation-state': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			'react-hooks/rules-of-hooks': 'error',
		},
	},
	{
		files: ['**/*.js', '**/*.jsx'],
		rules: {
			'@typescript-eslint/no-var-requires': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
		},
	},
];
