import * as assert from 'assert';
import { sanitizeAutocomplete } from '../sanitize';

suite('sanitizeAutocomplete', () => {
    test('убирает ограду с языковым тегом', () => {
        assert.strictEqual(sanitizeAutocomplete('```javascript\nconst x = 1;\n```'), 'const x = 1;');
    });

    test('убирает ограду без языкового тега', () => {
        assert.strictEqual(sanitizeAutocomplete('```\nconst x = 1;\n```'), 'const x = 1;');
    });

    test('берёт первый код-блок, отбрасывая текст вокруг', () => {
        assert.strictEqual(
            sanitizeAutocomplete('Вот код:\n```typescript\nconst x = 1;\n```\nНадеюсь, поможет.'),
            'const x = 1;',
        );
    });

    test('обрабатывает ограду, начатую в середине строки', () => {
        assert.strictEqual(
            sanitizeAutocomplete('Вот код:```js\nconst x = 1;\n```'),
            'const x = 1;',
        );
    });

    test('незамкнутый блок — срезает только открывающую ограду', () => {
        assert.strictEqual(sanitizeAutocomplete('```typescript\nconst x = 1;'), 'const x = 1;');
    });

    test('чистый код без оград проходит как есть', () => {
        assert.strictEqual(sanitizeAutocomplete('const x = 1;\nconst y = 2;'), 'const x = 1;\nconst y = 2;');
    });

    test('обрезает пустые строки по краям', () => {
        assert.strictEqual(sanitizeAutocomplete('\n\nconst x = 1;\n\n'), 'const x = 1;');
    });

    test('сохраняет многострочное содержимое блока', () => {
        assert.strictEqual(
            sanitizeAutocomplete('```js\nconst a = 1;\nconst b = 2;\n```'),
            'const a = 1;\nconst b = 2;',
        );
    });

    test('сохраняет отступы внутри блока', () => {
        assert.strictEqual(
            sanitizeAutocomplete('```js\nif (a) {\n    b();\n}\n```'),
            'if (a) {\n    b();\n}',
        );
    });

    test('корректно работает с CRLF', () => {
        assert.strictEqual(sanitizeAutocomplete('```js\r\nconst x = 1;\r\n```'), 'const x = 1;');
    });

    test('возвращает пустую строку для пустого ответа', () => {
        assert.strictEqual(sanitizeAutocomplete(''), '');
    });
});
