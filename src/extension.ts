import * as vscode from 'vscode';
import { BpmsoftGitChangedSchemasProvider } from "./Providers/BpmsoftGitChangedSchemasProvider";

export function activate(context: vscode.ExtensionContext) {
	const treeDataProvider = new BpmsoftGitChangedSchemasProvider();
	vscode.window.registerTreeDataProvider('bpmsoftGitChangedSchemas', treeDataProvider);	
}