import * as vscode from 'vscode';

export class EmptyTreeItem extends vscode.TreeItem {
	constructor(label: string) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.iconPath = new vscode.ThemeIcon('info');
		this.contextValue = 'empty';
	}
}