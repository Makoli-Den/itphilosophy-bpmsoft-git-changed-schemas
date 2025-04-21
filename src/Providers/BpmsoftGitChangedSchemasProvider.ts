import * as vscode from 'vscode';
import * as git from '../typings/git'; // Импортируем типы из кастомного файла

export class BpmsoftGitChangedSchemasProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private gitExtension: vscode.Extension<git.GitExtension> | undefined;
	private repositories: git.Repository[] = [];
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor() {
		this.gitExtension = vscode.extensions.getExtension<git.GitExtension>('vscode.git');
		this.initialize();
	}

	// Инициализация, подписка на изменения репозиториев
	private initialize() {
		if (!this.gitExtension) {
			return;
		}

		const gitApi = this.gitExtension.exports.getAPI(1);
		if (!gitApi) {
			return;
		}

		// Подписываемся на изменения репозиториев
		gitApi.onDidOpenRepository(() => {
			this.updateRepositories(gitApi.repositories);
		});
		gitApi.onDidCloseRepository(() => {
			this.updateRepositories(gitApi.repositories);
		});

		// Инициализируем начальное состояние репозиториев
		this.updateRepositories(gitApi.repositories);
	}

	// Обновление списка репозиториев
	private updateRepositories(repositories: git.Repository[]) {
		this.repositories = repositories;
		this._onDidChangeTreeData.fire(undefined); // Обновляем отображение
	}

	// Получение TreeItem для каждого элемента
	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	// Получение всех файлов для отображения
	getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
		if (!this.gitExtension) {
			return [];
		}

		const gitApi = this.gitExtension.exports.getAPI(1); // Получаем API Git

		if (!gitApi) {
			return [];
		}

		// Если это корневой элемент (репозитории)
		if (!element) {
			return this.repositories.map(repo => this.createRepoItem(repo));
		}

		// Если это конкретный репозиторий, возвращаем изменённые файлы и информацию о ветке
		if (element.contextValue === 'repo') {
			const repo = this.getRepositoryByName(element.label?.toString());
			if (repo) {
				const changes = [
					...repo.state.indexChanges, // staged changes (индексированные)
					...repo.state.workingTreeChanges // изменения в рабочем дереве
				];
				return [
					this.createBranchItem(repo),
					...changes.map(change => this.createFileItem(change))
				];
			}
		}

		return [];
	}

	// Получение репозитория по имени
	private getRepositoryByName(name: string | undefined) {
		if (!name) { return undefined; }

		return this.repositories.find((repo: any) => `Changes — ${repo.rootUri.fsPath}` === name);
	}

	// Создание TreeItem для репозитория
	private createRepoItem(repo: git.Repository): vscode.TreeItem {
		const repoItem = new vscode.TreeItem(`Changes — ${repo.rootUri.fsPath}`, vscode.TreeItemCollapsibleState.Collapsed);
		repoItem.contextValue = 'repo'; // Это позволяет нам обрабатывать репозитории по-другому, если нужно

		// Добавляем команду для обновления (refresh)
		repoItem.command = {
			command: 'git.refresh', // или своя команда для обновления
			title: 'Refresh',
		};

		return repoItem;
	}

	// Создание TreeItem для информации о ветке
	private createBranchItem(repo: git.Repository): vscode.TreeItem {
		const branchItem = new vscode.TreeItem(`Branch: ${repo.state.HEAD?.name}`, vscode.TreeItemCollapsibleState.None);
		branchItem.command = undefined; // делаем невозможным клик по ветке
		return branchItem;
	}

	// Создание TreeItem для изменённого файла
	private createFileItem(change: git.Change): vscode.TreeItem {
		const fileItem = new vscode.TreeItem(change.uri.fsPath, vscode.TreeItemCollapsibleState.None);
		fileItem.command = {
			command: 'git.openFile', // или своя команда для открытия файла
			title: 'Open File',
			arguments: [change.uri],
		};
		return fileItem;
	}
}
