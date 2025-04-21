import * as vscode from 'vscode';
import * as git from '../typings/git';
import { FileItem } from './FileItem';
import { EmptyTreeItem } from './EmptyTreeItem';

export class BranchItem extends vscode.TreeItem {
	constructor(public readonly repo: git.Repository) {
		super(`Branch: ${repo.state.HEAD?.name ?? 'unknown'}`, vscode.TreeItemCollapsibleState.Expanded);
		this.contextValue = 'branch';
		this.iconPath = new vscode.ThemeIcon('git-branch');
	}

	getChildren(): vscode.ProviderResult<vscode.TreeItem[]> {
		const changes = [...this.repo.state.indexChanges, ...this.repo.state.workingTreeChanges];
		if (changes.length === 0) {
			return [new EmptyTreeItem('No changed files')];
		}
		return changes.map(change => new FileItem(change));
	}
}