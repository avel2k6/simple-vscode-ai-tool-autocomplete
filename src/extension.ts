// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';


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
			+' Не приводи никаких рассуждений. В твоем ответе должень быть только текст, который вставится вместо <autocomplte_text_goes_here>.',
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

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "simple-vscode-ai-tool-autocomplete" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('simple-vscode-ai-tool-autocomplete.helloWorld', async () => {
        // Insert 'hello world' at the cursor position in the active editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Нет активного редактора — откройте файл.');

            return;
        }
        try {
            const doc = editor.document;
            const cursor = editor.selection.active; // позиция кусщтырсора
            const lastLine = doc.lineCount - 1;
            const lastLineEnd = doc.lineAt(lastLine).text.length;

            console.log('fetching');

            // Только строки выше строки курсора
            const textAboveLines = doc.getText(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(cursor.line, cursor.character)));

            // Только строки ниже строки курсора
            const textBelowLines = doc.getText(new vscode.Range(new vscode.Position(cursor.line, cursor.character), new vscode.Position(lastLine, lastLineEnd)));

            const prompt = `**${textAboveLines}<autocomplte_text_goes_here>${textBelowLines}**`;
            const resp = await fecthData(prompt);

            console.log(resp);

            await editor.edit((edit) => {
                edit.replace(editor.selection, JSON.stringify(resp?.choices[0]?.message.content));
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(message);
        }
    });


    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
