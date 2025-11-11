import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
// TODO: import eslint from '@eslint/js';

const eslintConfig = defineConfig([
	...nextVitals,
	// TODO: eslint.configs.recommended,
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		'.next/**',
		'out/**',
		'build/**',
		'next-env.d.ts',
	]),
]);

export default eslintConfig;
