import * as vscode from 'vscode';
import * as path from 'path';

export class FileItem extends vscode.TreeItem {
	constructor(filePath: string, public commitHash: string, public repoRoot: string) {
		super(path.basename(filePath), vscode.TreeItemCollapsibleState.None);
		const fullPath = path.join(repoRoot, filePath);
		const relativePath = path.relative(repoRoot, fullPath);
		this.description = path.dirname(relativePath);
		this.iconPath = vscode.ThemeIcon.File;
		this.contextValue = 'file-with-diff';

		this.resourceUri = vscode.Uri.file(fullPath);
		this.command = {
			command: 'gitlens.openFileRevision',
			title: 'Open at Revision',
			arguments: [{
				repoPath: this.repoRoot,
				uri: this.resourceUri,
				commit: this.commitHash
			}]
		};		
	}
}