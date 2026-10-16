import typescriptEslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
    eslint.configs.recommended,
    ...typescriptEslint.configs.recommended,
    {
        plugins: {
            js: eslint,
            '@typescript-eslint': typescriptEslint.plugin,
            '@stylistic': stylistic,
        },
        languageOptions: {
            parser: typescriptEslint.parser,
            ecmaVersion: 2022,
            sourceType: 'module',
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['*.mjs', '*.js'],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@stylistic/semi': 'error',
            '@stylistic/indent': ['error', 4],
            '@stylistic/quotes': ['error', 'single'],
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/no-multi-spaces': 'error',
            '@stylistic/no-multiple-empty-lines': [
                'error',
                {
                    max: 2,
                    maxBOF: 0,
                    maxEOF: 0,
                },
            ],
            '@stylistic/member-delimiter-style': ['error'],
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/curly-newline': [
                'error',
                {
                    minElements: 1,
                    consistent: false,
                },
            ],
            '@stylistic/object-curly-newline': [
                'error',
                {
                    ObjectExpression: {
                        multiline: true,
                        minProperties: 3,
                        consistent: true,
                    },
                    ObjectPattern: {
                        multiline: true,
                        minProperties: 3,
                        consistent: true,
                    },
                },
            ],
            '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: false }],
            '@stylistic/array-bracket-newline': [
                'error',
                {
                    multiline: true,
                    minItems: 3,
                },
            ],
            '@stylistic/array-element-newline': [
                'error',
                {
                    multiline: true,
                    minItems: 3,
                },
            ],
            '@stylistic/comma-dangle': [
                'error',
                {
                    arrays: 'always-multiline',
                    objects: 'always-multiline',
                    imports: 'always-multiline',
                    exports: 'always-multiline',
                    functions: 'always-multiline',
                    enums: 'always-multiline',
                    generics: 'always-multiline',
                    tuples: 'always-multiline',
                },
            ],
            '@stylistic/arrow-parens': ['error', 'always'],
            '@stylistic/padding-line-between-statements': [
                'error',
                {
                    blankLine: 'always',
                    prev: '*',
                    next: 'return',
                },
            ],
        },
    },
    {
        files: ['webpack.config.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: {
                require: 'readonly',
                module: 'writable',
                __dirname: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    globalIgnores([
        'dist/',
        'out/',
        '.vscode-test/',
    ]),
]);