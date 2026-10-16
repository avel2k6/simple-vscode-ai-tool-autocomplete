/**
 * Removes the markdown fence (```...```) from the model's answer before it is
 * inserted into the editor.
 *
 * - If the answer contains a code block — returns the content of the first
 *   block (text before and after the block is discarded).
 * - If the code block is not closed — returns everything after the opening fence.
 * - If there are no fences — returns the answer with blank lines trimmed at the edges.
 */
export const sanitizeAutocomplete = (raw: string): string => {
    const open = raw.indexOf('```');
    if (open === -1) {
        return raw.trim();
    }

    /*
     * Text after the first fence: a language name (```javascript)
     * may follow on the same line.
     */
    const afterOpen = raw.slice(open + 3);
    const infoEnd = afterOpen.indexOf('\n');
    const content = infoEnd === -1 ? afterOpen : afterOpen.slice(infoEnd + 1);

    /*
     * Closing fence: if present — take the content before it,
     * otherwise — take everything up to the end of the answer.
     */
    const close = content.indexOf('```');
    const inner = close === -1 ? content : content.slice(0, close);

    /*
     * Trim blank lines at the top and bottom (including CRLF).
     */
    return inner.replace(/^[\r\n]+/, '').replace(/[\r\n]+$/, '');
};
