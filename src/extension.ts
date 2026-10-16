import * as vscode from 'vscode';
import axios from 'axios';
import { sanitizeAutocomplete } from './sanitize';


const texts = {
    basePrompt: 'You are an experienced developer. Write only the code that should be inserted in place of <autocomplte_text_goes_here>.'
                    + ' Do not include any reasoning — your answer must contain only the text that will replace <autocomplte_text_goes_here>.'
                    + ' Do not wrap the answer in a markdown code block (``` or similar) — return only plain code.',

    requestNotification: 'Request autocompete',
    errors: {
        noEditor: 'No active editor. Please open a file.',
    },
};

const fecthData = async (text: string) => {
    const config = vscode.workspace.getConfiguration('simple-vscode-ai-tool-autocomplete');
    const baseUrl = config.get<string>('baseUrl');
    const model = config.get<string>('model');
    const apiKey = config.get<string>('apiKey');
    const temperature = config.get<number>('temperature');
    const timeout = config.get<number>('timeout');

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

    return response.data;
};

let timer: ReturnType<typeof setTimeout> | undefined;

const runAutocomplete = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage(texts.errors.noEditor);

        return;
    }
    try {
        const doc = editor.document;
        const cursor = editor.selection.active; // caret position
        const lastLine = doc.lineCount - 1;
        const lastLineEnd = doc.lineAt(lastLine).text.length;


        // Everything above the caret (start of the file up to the cursor)
        const textAboveLines = doc.getText(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(cursor.line, cursor.character)));

        // Everything from the caret to the end of the file
        const textBelowLines = doc.getText(new vscode.Range(new vscode.Position(cursor.line, cursor.character), new vscode.Position(lastLine, lastLineEnd)));

        const prompt = `**${textAboveLines}<autocomplte_text_goes_here>${textBelowLines}**`;
        const resp = await fecthData(prompt);

        const rawContent = resp?.choices[0]?.message.content ?? '';
        const autocompleteText = sanitizeAutocomplete(rawContent);

        await editor.edit((edit) => {
            edit.replace(editor.selection, autocompleteText);
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(message);
    }
};

export const activate = (context: vscode.ExtensionContext) => {
    const disposable = vscode.commands.registerCommand('simple-vscode-ai-tool-autocomplete.autocomplete', () => {
        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(() => {
            timer = undefined;
            void runAutocomplete();
        }, vscode.workspace.getConfiguration('simple-vscode-ai-tool-autocomplete').get<number>('debounceMs') ?? 300);
    });

    context.subscriptions.push(disposable);
};

export const deactivate = () => {
    if (timer) {
        clearTimeout(timer);
        timer = undefined;
    }
};
