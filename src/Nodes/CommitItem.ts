import * as vscode from 'vscode';
import { EmptyTreeItem } from './EmptyTreeItem';
import { exec } from 'child_process';
import { FileItem } from './FileItem';

export class CommitItem extends vscode.TreeItem {
	constructor(public readonly hash: string, public readonly message: string, public readonly repoPath: string) {
		super(`${message} (${hash.slice(0, 7)})`, vscode.TreeItemCollapsibleState.Collapsed);
		this.contextValue = 'commit';
		this.iconPath = new vscode.ThemeIcon('git-commit');
	}

	async getChildren(): Promise<vscode.TreeItem[]> {
		try {
			const output = await this.runGit(this.repoPath, `git show --pretty="" --name-only ${this.hash}`);
			const files = output.trim().split('\n').filter(Boolean);
			return files.length ? files.map(f => new FileItem(f, this.hash, this.repoPath)) : [new EmptyTreeItem('No files changed')];
		} catch {
			return [new EmptyTreeItem('Failed to load files')];
		}
	}

	private runGit(cwd: string, command: string): Promise<string> {
		return new Promise((resolve, reject) => {
			exec(command, { cwd }, (err, stdout) => {
				if (err) reject(err);
				else resolve(stdout);
			});
		});
	}
}