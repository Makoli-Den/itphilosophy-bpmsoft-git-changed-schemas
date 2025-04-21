import * as vscode from 'vscode';
import * as git from '../typings/git';
import { RepositoryItem } from '../Nodes/RepositoryItem';
import { EmptyTreeItem } from '../Nodes/EmptyTreeItem';

export class BpmsoftGitChangedSchemasProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private gitExtension = vscode.extensions.getExtension<git.GitExtension>('vscode.git');
	private repositories: git.Repository[] = [];
	private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();

	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	constructor() {
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

	private updateRepositories(repositories: git.Repository[]) {
		this.repositories = repositories;
		for (const repo of repositories) {
			repo.state.onDidChange(() => this._onDidChangeTreeData.fire(undefined));
		}
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
		if (!element) {
			if (this.repositories.length === 0) {
				return [new EmptyTreeItem('No repositories found')];
			}
			return this.repositories.map(repo => new RepositoryItem(repo));
		}

		if (element instanceof RepositoryItem) {
			return element.getChildren();
		}

		return [];
	}
}