import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { BranchItem } from './BranchItem';
import { EmptyTreeItem } from './EmptyTreeItem';
import * as git from '../typings/git';

export class RepositoryItem extends vscode.TreeItem {
	constructor(public readonly repo: git.Repository) {
		super(path.basename(repo.rootUri.fsPath), vscode.TreeItemCollapsibleState.Collapsed);
		this.contextValue = 'repo';
		this.description = repo.rootUri.fsPath;
		this.iconPath = new vscode.ThemeIcon('repo');
	}

	async getChildren(): Promise<vscode.TreeItem[]> {
		const repoPath = this.repo.rootUri.fsPath;
		const currentBranch = this.repo.state.HEAD?.name ?? '';

		if (!this.repo.state.HEAD) {
			return [new EmptyTreeItem('No branch detected')];
		}

		try {
			const allBranchesRaw = await this.runGit(repoPath, 'git branch -a --format="%(refname:short)"');
			const allBranches = allBranchesRaw.trim().split('\n').map(b => b.trim()).filter(Boolean);

			const items: vscode.TreeItem[] = [];
			const branchTree = this.buildBranchTree(repoPath, allBranches, currentBranch);

			// Текущая ветка — первой
			items.push(new BranchItem(repoPath, currentBranch, true));
			items.push(...branchTree);

			return items;
		} catch {
			return [new EmptyTreeItem('Failed to load branches')];
		}
	}

	private buildBranchTree(repoPath: string, branches: string[], current: string): vscode.TreeItem[] {
		type TreeNode = {
			children: Record<string, TreeNode>;
			branch?: string;
			isCurrent?: Boolean;
		};

		const root: TreeNode = { children: {} };

		for (const branch of branches) {
			// Пропускаем дубликат текущей ветки (она уже будет отображена отдельно)
			if (branch === current) continue;

			const parts = branch.split('/');
			let node = root;

			for (const part of parts) {
				if (!node.children[part]) {
					node.children[part] = { children: {} };
				}
				node = node.children[part];
			}

			node.branch = branch;
			node.isCurrent = branch === current;
		}

		function createItems(node: TreeNode): vscode.TreeItem[] {
			return Object.entries(node.children)
				.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
				.map(([label, childNode]) => {
					if (childNode.branch) {
						const item = new BranchItem(repoPath, childNode.branch, false);
						item.description = childNode.branch;
						return item;
					} else {
						const groupItem = new EmptyTreeItem(label);
						groupItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
						groupItem.iconPath = new vscode.ThemeIcon('folder');
						(groupItem as any).getChildren = () => createItems(childNode);
						return groupItem;
					}
				});
		}

		return createItems(root);
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