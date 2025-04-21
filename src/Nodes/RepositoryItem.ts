import * as vscode from 'vscode';
import * as path from 'path';
import * as git from '../typings/git';
import { BranchItem } from './BranchItem';

export class RepositoryItem extends vscode.TreeItem {
	constructor(public readonly repo: git.Repository) {
		super('Current Branch Schemas — ' + path.basename(repo.rootUri.fsPath), vscode.TreeItemCollapsibleState.Collapsed);
		this.contextValue = 'repo';
		this.description = repo.rootUri.fsPath;
		this.iconPath = new vscode.ThemeIcon('repo');
	}

	getChildren(): vscode.ProviderResult<vscode.TreeItem[]> {
		return [new BranchItem(this.repo)];
	}
}