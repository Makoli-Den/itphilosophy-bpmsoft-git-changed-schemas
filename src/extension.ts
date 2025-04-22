import * as vscode from 'vscode';
import * as path from 'path';
import { BpmsoftGitChangedSchemasProvider } from "./Providers/BpmsoftGitChangedSchemasProvider";
import { FileItem } from './Nodes/FileItem';

export function activate(context: vscode.ExtensionContext) {
	const treeDataProvider = new BpmsoftGitChangedSchemasProvider();
	vscode.window.registerTreeDataProvider('bpmsoftGitChangedSchemas', treeDataProvider);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.openFileDiff', async (item: FileItem) => {
			const relativePath = path.relative(item.repoRoot, item.resourceUri?.fsPath || '').replace(/\\/g, '/');
			let absPath = '/' + relativePath;

			const metadata = {
				ref: item.commitHash,
				repoPath: item.repoRoot.replace(/\\/g, '/'),
				uncPath: undefined
			};

			const revisionUri = vscode.Uri.from({
				scheme: 'gitlens',
				authority: Buffer.from(JSON.stringify(metadata), 'utf8').toString('hex'),
				path: absPath,
				query: JSON.stringify({ ref: item.commitHash.replaceAll('/', ' ∕ ') })
			});

			// Открываем временно невидимый документ, чтобы gitlens.openFileRevision зарегалась
			const doc = await vscode.workspace.openTextDocument(item.resourceUri?.fsPath || '');
			await vscode.window.showTextDocument(doc, { preview: true, preserveFocus: true });

			// Затем вызываем команду GitLens
			await vscode.commands.executeCommand('gitlens.openFileRevision', { revisionUri });

			// Закрываем временно открытый документ
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		})
	);
}
