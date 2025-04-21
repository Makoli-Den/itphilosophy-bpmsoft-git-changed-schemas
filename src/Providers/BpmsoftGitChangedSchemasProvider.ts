import * as vscode from 'vscode';
import * as path from 'path';
import * as git from '../typings/git';

export class BpmsoftGitChangedSchemasProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private gitExtension: vscode.Extension<git.GitExtension> | undefined;
	private repositories: git.Repository[] = [];
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;
	readonly statusMap: Record<git.Status, string> = {
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
	

	constructor() {
		this.gitExtension = vscode.extensions.getExtension<git.GitExtension>('vscode.git');
		this.initialize();
	}

	private initialize() {
		if (!this.gitExtension) return;
		const gitApi = this.gitExtension.exports.getAPI(1);
		if (!gitApi) return;

		gitApi.onDidOpenRepository(() => this.updateRepositories(gitApi.repositories));
		gitApi.onDidCloseRepository(() => this.updateRepositories(gitApi.repositories));

		this.updateRepositories(gitApi.repositories);
	}

	private addRepository(repo: git.Repository) {
		repo.state.onDidChange(() => {
			this._onDidChangeTreeData.fire(undefined);
		});
	}

	private updateRepositories(repositories: git.Repository[]) {
		this.repositories = repositories;

		for (const repo of repositories) {
			this.addRepository(repo);
		}
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
		if (!this.gitExtension) return [];
		const gitApi = this.gitExtension.exports.getAPI(1);
		if (!gitApi) return [];

		if (!element) {
			return this.repositories.map(repo => this.createRepoItem(repo));
		}

		if (element.contextValue === 'repo') {
			const repo = this.getRepositoryByFsPath(element.description?.toString());
			if (!repo) return [];

			const changes = [
				...repo.state.indexChanges,
				...repo.state.workingTreeChanges
			];

			const items = [
				this.createCurrentBranchItem(repo),
				...changes.map(change => this.createFileItem(change, repo))
			];

			return items;
		}

		return [];
	}

	private getRepositoryByFsPath(fsPath: string | undefined) {
		if (!fsPath) return undefined;
		return this.repositories.find(repo => repo.rootUri.fsPath === fsPath);
	}

	private createRepoItem(repo: git.Repository): vscode.TreeItem {
		const folderName = path.basename(repo.rootUri.fsPath);
		const fullPath = repo.rootUri.fsPath;
		const label = 'Repository — ' + folderName;
		const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);

		item.contextValue = 'repo';
		item.description = fullPath;
		item.iconPath = new vscode.ThemeIcon('repo');
	
		return item;
	}

	private createCurrentBranchItem(repo: git.Repository): vscode.TreeItem {
		const branchName = repo.state.HEAD?.name ?? 'unknown';
		const item = new vscode.TreeItem(`Current Branch: ${branchName}`, vscode.TreeItemCollapsibleState.None);

		item.contextValue = 'branch';
		item.iconPath = new vscode.ThemeIcon('git-branch');
		
		return item;
	}

	private createFileItem(change: git.Change, repo: git.Repository): vscode.TreeItem {
		const relativePath = vscode.workspace.asRelativePath(change.uri.fsPath, false);
		const fileName = path.basename(change.uri.fsPath);
		const folderPath = path.dirname(relativePath);

		const item = new vscode.TreeItem(fileName, vscode.TreeItemCollapsibleState.None);
		item.description = folderPath;
		item.resourceUri = change.uri;

		// Тип изменения (M, A, D и т.д.)
		const status = change.status;
		const statusText = this.statusMap[status] ?? '';

		item.label = `${fileName}`;
		item.tooltip = `${statusText} ${relativePath}`;
		item.iconPath = vscode.ThemeIcon.File; // Можно менять на кастомные иконки

		item.command = {
			command: 'vscode.open',
			title: 'Open File',
			arguments: [change.uri]
		};

		return item;
	}
}
