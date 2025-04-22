import * as vscode from 'vscode';
import * as git from '../typings/git';
import { RepositoryItem } from '../Nodes/RepositoryItem';
import { EmptyTreeItem } from '../Nodes/EmptyTreeItem';

export class BpmsoftGitChangedSchemasProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private gitExtension: vscode.Extension<git.GitExtension> | undefined;
	private repositories: git.Repository[] = [];
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

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
		repo.state.onDidChange(() => this._onDidChangeTreeData.fire(undefined));
	}

	private updateRepositories(repositories: git.Repository[]) {
		this.repositories = repositories;
		for (const repo of repositories) {
			this.addRepository(repo);
		}
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
		if (!this.gitExtension) return [];
		const gitApi = this.gitExtension.exports.getAPI(1);
		if (!gitApi) return [];

		if (!element) {
			return this.repositories.length
				? this.repositories.map(repo => new RepositoryItem(repo))
				: [new EmptyTreeItem('No Git repositories found')];
		}

		if (element instanceof RepositoryItem || 'getChildren' in element) {
			return (element as any).getChildren();
		}

		return [];
	}
}
