import * as vscode from 'vscode';
import path from 'path';
import axios from 'axios';
import { sanitizeAutocomplete } from './sanitize';


/**
 * User-facing strings: the base prompt, notifications and error messages.
 */
const texts = {
    basePrompt: 'You are an experienced developer. Write only the code that should be inserted in place of <autocomplte_text_goes_here>.'
                + ' Do not include any reasoning — your answer must contain only the text that will replace <autocomplte_text_goes_here>.'
                + ' Do not wrap the answer in a markdown code block (``` or similar) — return only plain code.',

    requestNotification: 'Request autocompete',
    otherFilesHeader: 'Other open files:',
    errors: {
        noEditor: 'No active editor. Please open a file.',
    },
};

/**
 * Maximum number of characters of another tab's content included in the prompt.
 */
const MAX_OTHER_TAB_CHARS = 4000;

/**
 * Reads the extension settings from the workspace configuration.
 */
const getConfig = () => {
    const config = vscode.workspace.getConfiguration('simple-vscode-ai-tool-autocomplete');

    return {
        baseUrl: config.get<string>('baseUrl'),
        model: config.get<string>('model'),
        apiKey: config.get<string>('apiKey'),
        temperature: config.get<number>('temperature'),
        timeout: config.get<number>('timeout'),
        debounceMs: config.get<number>('debounceMs'),
        includeOtherTabs: config.get<boolean>('includeOtherTabs'),
    };
};

/**
 * Sends a chat completion request to the LLM API and returns the raw response.
 */
const fetchAutocompeteText = async (text: string) => {
    const {
        baseUrl, model, apiKey, temperature, timeout,
    } = getConfig();

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const postUrl = `${baseUrl}/chat/completions/`;

    const data= {
        model,
        temperature,
        messages: [
            {
                role: 'system',
                content: texts.basePrompt,
            },
            {
                role: 'user',
                content: text,
            },
        ],
    };
    vscode.window.showInformationMessage(texts.requestNotification);

    const response = await axios.post(
        `${postUrl}`,
        data,
        {
            headers,
            timeout,
        },
    );

    const result = response.data.choices[0].message.content;

    return result;
};

/**
 * Pending debounce timer handle for the autocomplete command.
 */
let timer: ReturnType<typeof setTimeout> | undefined;

/**
 * Builds a prompt from the document around the caret, requests a completion
 * and inserts the result at the caret position.
 */
const runAutocomplete = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage(texts.errors.noEditor);

        return;
    }
    try {
        const { includeOtherTabs } = getConfig();
        const doc = editor.document;
        const fileName = doc.isUntitled ? undefined : path.basename(doc.uri.path);

        /*
         * Caret position
         */
        const cursor = editor.selection.active;
        const lastLine = doc.lineCount - 1;
        const lastLineEnd = doc.lineAt(lastLine).text.length;


        /*
         * Everything above the caret (start of the file up to the cursor)
         */
        const textAboveLines = doc.getText(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(cursor.line, cursor.character)));

        /*
         * Everything from the caret to the end of the file
         */
        const textBelowLines = doc.getText(new vscode.Range(new vscode.Position(cursor.line, cursor.character), new vscode.Position(lastLine, lastLineEnd)));

        const fileLine = fileName ? `File: ${fileName}\n` : '';

        /*
         * Contents of the other visible tabs, as optional context.
         * Each file is truncated to MAX_OTHER_TAB_CHARS.
         */
        const otherTabsSection = includeOtherTabs
            ? vscode.window.visibleTextEditors
                .filter((tab) => tab !== editor)
                .map((tab) => {
                    const tabName = path.basename(tab.document.uri.path);
                    const tabContent = tab.document.getText().slice(0, MAX_OTHER_TAB_CHARS);

                    return `=== ${tabName} ===\n${tabContent}`;
                })
                .join('\n\n')
            : '';

        const otherTabsBlock = otherTabsSection
            ? `\n\n${texts.otherFilesHeader}\n${otherTabsSection}`
            : '';
        const prompt = `${fileLine}**${textAboveLines}<autocomplte_text_goes_here>${textBelowLines}**${otherTabsBlock}`;

        const rawContent = await fetchAutocompeteText(prompt);

        const autocompleteText = sanitizeAutocomplete(rawContent);

        await editor.edit((edit) => {
            edit.replace(editor.selection, autocompleteText);
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(message);
    }
};

/**
 * Registers the autocomplete command with debouncing.
 */
export const activate = (context: vscode.ExtensionContext) => {
    const disposable = vscode.commands.registerCommand('simple-vscode-ai-tool-autocomplete.autocomplete', () => {
        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(() => {
            timer = undefined;
            void runAutocomplete();
        }, getConfig().debounceMs ?? 0);
    });

    context.subscriptions.push(disposable);
};

/**
 * Cancels the pending debounce timer on deactivation.
 */
export const deactivate = () => {
    if (timer) {
        clearTimeout(timer);
        timer = undefined;
    }
};
