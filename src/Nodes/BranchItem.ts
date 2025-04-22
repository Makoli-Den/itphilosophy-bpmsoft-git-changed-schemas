import * as vscode from 'vscode';
import { exec } from 'child_process';
import { EmptyTreeItem } from './EmptyTreeItem';
import { CommitItem } from './CommitItem';

export class BranchItem extends vscode.TreeItem {
	constructor(public readonly repoPath: string, public readonly branchName: string, public readonly isCurrent: boolean = false) {
		super(branchName, vscode.TreeItemCollapsibleState.Collapsed);
		this.contextValue = 'branch';
		this.iconPath = new vscode.ThemeIcon('git-branch');
		if (isCurrent) {
			this.label = `📍 Current: ${branchName}`;
			this.description = 'Current branch';
		}
	}

	async getChildren(): Promise<vscode.TreeItem[]> {
		try {
			const log = await this.runGit(this.repoPath, `git log ${this.branchName} --pretty=format:%H:::%s -n 20`);
			if (!log.trim()) return [new EmptyTreeItem('No commits found')];

			return log.trim().split('\n').map(line => {
				const [hash, message] = line.split(':::');
				return new CommitItem(hash, message, this.repoPath);
			});
		} catch {
			return [new EmptyTreeItem('Failed to load commits')];
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