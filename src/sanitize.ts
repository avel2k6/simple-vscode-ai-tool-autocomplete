/**
 * Убирает markdown-ограду (```...```) из ответа модели перед вставкой в редактор.
 *
 * - Если в ответе есть код-блок — возвращает содержимое первого блока
 *   (текст до и после блока отбрасывается).
 * - Если код-блок не замкнут — возвращает всё, что идёт после открывающей ограды.
 * - Если оград нет — возвращает ответ с обрезанными пробельными строками по краям.
 */
export function sanitizeAutocomplete(raw: string): string {
    const open = raw.indexOf('```');
    if (open === -1) {
        return raw.trim();
    }

    // Текст после первой ограды: возможно, на той же строке идёт имя языка (```javascript).
    const afterOpen = raw.slice(open + 3);
    const infoEnd = afterOpen.indexOf('\n');
    const content = infoEnd === -1 ? afterOpen : afterOpen.slice(infoEnd + 1);

    // Закрывающая ограда: если есть — берём содержимое до неё, если нет — до конца ответа.
    const close = content.indexOf('```');
    const inner = close === -1 ? content : content.slice(0, close);

    // Обрезаем пустые строки сверху и снизу (включая CRLF).
    return inner.replace(/^[\r\n]+/, '').replace(/[\r\n]+$/, '');
}
