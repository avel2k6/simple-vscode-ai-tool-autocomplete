import * as assert from 'assert';
import { sanitizeAutocomplete } from '../sanitize';

suite('sanitizeAutocomplete', () => {
    test('strips fence with language tag', () => {
        assert.strictEqual(sanitizeAutocomplete('```javascript\nconst x = 1;\n```'), 'const x = 1;');
    });

    test('strips fence without language tag', () => {
        assert.strictEqual(sanitizeAutocomplete('```\nconst x = 1;\n```'), 'const x = 1;');
    });

    test('takes the first code block, discarding surrounding text', () => {
        assert.strictEqual(
            sanitizeAutocomplete('Here is the code:\n```typescript\nconst x = 1;\n```\nHope this helps.'),
            'const x = 1;',
        );
    });

    test('handles a fence started in the middle of a line', () => {
        assert.strictEqual(
            sanitizeAutocomplete('Here is the code:```js\nconst x = 1;\n```'),
            'const x = 1;',
        );
    });

    test('unclosed block — strips only the opening fence', () => {
        assert.strictEqual(sanitizeAutocomplete('```typescript\nconst x = 1;'), 'const x = 1;');
    });

    test('plain code without fences passes through as is', () => {
        assert.strictEqual(sanitizeAutocomplete('const x = 1;\nconst y = 2;'), 'const x = 1;\nconst y = 2;');
    });

    test('trims blank lines at the edges', () => {
        assert.strictEqual(sanitizeAutocomplete('\n\nconst x = 1;\n\n'), 'const x = 1;');
    });

    test('preserves multi-line block content', () => {
        assert.strictEqual(
            sanitizeAutocomplete('```js\nconst a = 1;\nconst b = 2;\n```'),
            'const a = 1;\nconst b = 2;',
        );
    });

    test('preserves indentation inside the block', () => {
        assert.strictEqual(
            sanitizeAutocomplete('```js\nif (a) {\n    b();\n}\n```'),
            'if (a) {\n    b();\n}',
        );
    });

    test('handles CRLF correctly', () => {
        assert.strictEqual(sanitizeAutocomplete('```js\r\nconst x = 1;\r\n```'), 'const x = 1;');
    });

    test('returns an empty string for an empty answer', () => {
        assert.strictEqual(sanitizeAutocomplete(''), '');
    });
});
