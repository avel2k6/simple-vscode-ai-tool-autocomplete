import * as vscode from 'vscode';
import axios from 'axios';
import { sanitizeAutocomplete } from './sanitize';


const fecthData = async (text: string) => {
    const config = vscode.workspace.getConfiguration('simple-vscode-ai-tool-autocomplete');
    const baseUrl = config.get<string>('baseUrl');
    const model = config.get<string>('model');
    const apiKey = config.get<string>('apiKey');
    const temperature = config.get<number>('temperature');

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
                content: 'Ты опытный разработкик. Ты должен написать код, который надо вставить в <autocomplte_text_goes_here>.'
			+' Не приводи никаких рассуждений. В твоем ответе должень быть только текст, который вставится вместо <autocomplte_text_goes_here>.'
			+' Не оборачивай ответ в markdown-блок (``` и т.д.) — возвращай только чистый код.',
            },
            {
                role: 'user',
                content: text,
            },
        ],
    };
    vscode.window.showInformationMessage(postUrl);
    vscode.window.showInformationMessage(`model: ${model}`);
    vscode.window.showInformationMessage(`temperature: ${temperature}`);
    vscode.window.showInformationMessage(JSON.stringify(data));

    const response = await axios.post(
        `${postUrl}`,
        data,
        {
            headers: { 'Content-Type': 'application/json' },
        },
    );

    return response.data;
};

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('simple-vscode-ai-tool-autocomplete.helloWorld', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Нет активного редактора — откройте файл.');

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
    });


    context.subscriptions.push(disposable);
}

export function deactivate() {}
