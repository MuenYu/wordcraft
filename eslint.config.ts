import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

// TODO: more lint rules can be applied
// doc: https://nextjs.org/docs/app/api-reference/config/eslint
const eslintConfig = defineConfig([
	nextVitals,
	eslint.configs.recommended,
	tseslint.configs.stylistic,
	{
		// Override default ignores of eslint-config-next.
		ignores: [
			// Default ignores of eslint-config-next:
			'.next/**',
			'out/**',
			'build/**',
			'next-env.d.ts',
		],
	},
]);

export default eslintConfig;
