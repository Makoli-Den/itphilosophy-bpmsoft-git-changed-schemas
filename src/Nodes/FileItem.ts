import * as vscode from 'vscode';
import * as git from '../typings/git';
import * as path from 'path';

const statusMap: Record<git.Status, string> = {
	[git.Status.INDEX_MODIFIED]: 'M',
	[git.Status.INDEX_ADDED]: 'A',
	[git.Status.INDEX_DELETED]: 'D',
	[git.Status.INDEX_RENAMED]: 'R',
	[git.Status.INDEX_COPIED]: 'C',
	[git.Status.MODIFIED]: 'M',
	[git.Status.DELETED]: 'D',
	[git.Status.UNTRACKED]: 'U',
	[git.Status.IGNORED]: 'I',
	[git.Status.INTENT_TO_ADD]: 'A',
	[git.Status.INTENT_TO_RENAME]: 'R',
	[git.Status.TYPE_CHANGED]: 'T',
	[git.Status.ADDED_BY_US]: 'U',
	[git.Status.ADDED_BY_THEM]: 'U',
	[git.Status.DELETED_BY_US]: 'D',
	[git.Status.DELETED_BY_THEM]: 'D',
	[git.Status.BOTH_ADDED]: 'U',
	[git.Status.BOTH_DELETED]: 'D',
	[git.Status.BOTH_MODIFIED]: 'M',
};

export class FileItem extends vscode.TreeItem {
	constructor(change: git.Change) {
		const fileName = path.basename(change.uri.fsPath);
		const relativePath = vscode.workspace.asRelativePath(change.uri.fsPath, false);
		super(fileName, vscode.TreeItemCollapsibleState.None);

		this.description = path.dirname(relativePath);
		this.resourceUri = change.uri;
		this.iconPath = vscode.ThemeIcon.File;
		this.tooltip = `${statusMap[change.status] ?? ''} ${relativePath}`;
		this.command = {
			command: 'vscode.open',
			title: 'Open File',
			arguments: [change.uri],
		};
	}
}
