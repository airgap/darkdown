// THIS IS WIP

import { readFile } from 'fs/promises';
import { Variable } from './Variable';

export type ScopeType = 'Project' | 'Class' | 'Function';
export class StringVariable {}
export class Scope {
	variables: Variable[];
}
export class DocumentScope extends Scope {
	constructor(public title: string) {
		super();
	}
}
export class ClassScope extends Scope {
	constructor(public name: string) {
		super();
	}
}
const scopeStack: Scope[] = [];
const scopes = [];
const getCurrentScope = () => scopeStack[scopeStack.length - 1];
const isDirectlyInDocument = () => getCurrentScope() instanceof DocumentScope;
const isInClass = () => scopeStack.some(sc => sc instanceof ClassScope);
const isDirectlyInClass = () => getCurrentScope() instanceof ClassScope;
const isDocumentDefinition = (line: string) => !!line.match(/^# ?[a-z0-9 ]+$/i);
const parseDocumentDefinition = (line: string) => line.match(/^# ?([a-z0-9 ]+)$/i);
const isClassDefinition = (line: string) => !!line.match(/^## ?[a-z0-9]+/i);
const parseClassDefinition = (line: string) => line.match(/^## ?([a-z0-9]+)$/i);
const handleDocumentDefinition = (line: string) => {
	const docName = parseDocumentDefinition(line)[1];
	if (scopeStack.length)
		// Document titles can only appear at the top of Documents
		throw new Error(`Document ${docName} defined somewhere other than the top of a Document`);
	const scope = new DocumentScope(docName);
	scopeStack.push(scope);
	scopes.push(scope);
};
const handleClassDefinition = (line: string) => {
	const className = parseClassDefinition(line)[1];
	if (scopeStack.length !== 1)
		// A class cannot be defined anywhere except a document
		throw new Error(`Class ${className} defined somewhere other than directly inside a Document`);
	const scope = new ClassScope(className);
	scopeStack.push(scope);
	scopes.push(scope);
};
(async () => {
	const input = await readFile('test.md', 'utf8');
	const lines = input.split(/\r?\n/g);
	for (const l in lines) {
		const line = lines[l];
		if (line.trim() === '') continue;
		if (isDocumentDefinition(line)) handleDocumentDefinition(line);
		else if (isClassDefinition(line)) handleClassDefinition(line);
	}
	console.log(input);
})();
