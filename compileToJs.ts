import { readFile, writeFile } from 'fs/promises';
import { isDocumentDefinition } from './funcs/isDocumentDefinition';
import { isClassDefinition } from './funcs/isClassDefinition';
import { parseClassDefinition } from './funcs/parseClassDefinition';
import { isFunctionDefinition } from './funcs/isFunctionDefinition';
import { parseFunctionDefinition } from './funcs/parseFunctionDefinition';
import { Variable } from './Variable';
import { parseDocumentDefinition } from './funcs/parseDocumentDefinition';

export class Line {
	constructor(public text: string, public depth: number) {}
}

(async () => {
	const input = await readFile('test.md', 'utf8');
	const lines = input.split(/\r?\n/g);
	const output: Line[] = [];
	let scopeDepth = 0;
	let currentScope: 'Document' | 'Class' | 'Function';
	let currentFunctionReturns: Variable[];
	let currentScopeVariables: Variable[];
	let documentName;
	const appendReturnIfTerminatingFunction = () => {
		if (currentScope === 'Function') {
			console.log('returns', currentFunctionReturns);
			if (currentFunctionReturns?.length)
				output.push(
					new Line(`return [${currentFunctionReturns.map(({ name }) => name).join(', ')}]`, scopeDepth)
				);
			scopeDepth--;
			output.push(new Line(`}`, scopeDepth));
			currentScope = 'Class';
		}
	};
	for (const l in lines) {
		const line = lines[l];
		if (line.trim() === '') continue;
		if (isDocumentDefinition(line)) {
			currentScope = 'Document';
			documentName = parseDocumentDefinition(line);
			scopeDepth++;
			// output.push(new Line(`class ${parseClassDefinition(line)} {`, scopeDepth));
		} else if (isClassDefinition(line)) {
			appendReturnIfTerminatingFunction();
			if (currentScope === 'Class') {
				scopeDepth--;
				output.push(new Line(`}`, scopeDepth));
			}
			currentScope = 'Class';
			const { name, extend } = parseClassDefinition(line);
			output.push(new Line(`class ${name}${extend ? `extends ${extend}` : ''} {`, scopeDepth));
			scopeDepth++;
		} else if (isFunctionDefinition(line)) {
			appendReturnIfTerminatingFunction();
			currentScopeVariables = [];
			const { static: stat, name, accepts, returns } = parseFunctionDefinition(line);
			currentFunctionReturns = returns;
			//console.log(name, accepts, returns);
			currentScopeVariables.push(...accepts);
			output.push(
				new Line(
					`${currentScope === 'Class' ? (stat ? 'static ' : '') : 'const '}${name} = (${accepts
						.map(({ name }) => name)
						.join(',')}) => {`,
					scopeDepth
				)
			);
			currentScope = 'Function';
			scopeDepth++;
			const returnsNotProvided = returns?.filter(ret => !accepts.includes(ret)) ?? [];
			if (returnsNotProvided.length) {
				output.push(new Line(`let ${returnsNotProvided.map(({ name }) => name).join(', ')};`, scopeDepth));
				currentScopeVariables.push(...returnsNotProvided);
			}
		} else if (/^[0-9]+. /.exec(line)) {
			// It's a line
			const { lineContent } = /^[0-9]+. (?<lineContent>.+)$/.exec(line).groups;
			if (/^Run /.test(lineContent)) {
				// Run function
				console.log('lineCont', lineContent);
				const { funcName, params, into } =
					/^Run (?<funcName>[a-zA-Z0-9]+(?:'s [a-zA-Z0-9]+)*)(?: with (?<params>[a-zA-Z0-9'"]+(?:, [a-zA-Z0-9'"]+)*))?(?: into (?<into>(?:Int|String|Boolean) [a-zA-Z0-9]+(?:, (?:Int|String|Boolean) [a-zA-Z0-9]+))*)?$/.exec(
						lineContent
					).groups;
				const funcPath = funcName.replace(/'s /g, '.');
				console.log('aaaa', funcPath, params, into);
				if (into) {
					const destVars = into.split(', ').map(v => v.split(' ')[1]);
					if (!destVars.some(v => currentScopeVariables.some(scopeVar => scopeVar.name === v))) {
						output.push(new Line(`let [${destVars}] = ${funcPath}(${params ?? ''});`, scopeDepth));
						currentScopeVariables.push(...destVars.map(v => new Variable(v, 'Unknown')));
					} else {
						destVars
							.filter(v => !currentScopeVariables.some(scopeVar => scopeVar.name === v))
							.forEach(v => {
								output.push(new Line(`let ${v}`, scopeDepth));
								currentScopeVariables.push(new Variable(v, 'Unknown'));
							});
						output.push(new Line(`([${destVars}] = ${funcPath}(${params ?? ''}));`, scopeDepth));
					}
				} else {
					output.push(new Line(`${funcPath}(${params ?? ''});`, scopeDepth));
				}
			} else if (/^Ask/.test(lineContent)) {
				const { phrase, into, cast } =
					/^Ask "(?<phrase>[^"]+)" into (?<into>[a-zA-Z0-9]+)(?: as (?<cast>Int|Float))?$/.exec(
						lineContent
					).groups;
				let got = `prompt("${phrase}")`;
				if (cast) got = `parse${cast}(${got})`;
				output.push(
					new Line(
						`${currentScopeVariables.some(v => v.name === into) ? into : `let ${into}`} = ${got};`,
						scopeDepth
					)
				);
			} else {
				output.push(
					new Line(
						lineContent.replace(/'s /g, '.').replace(/ with ([a-zA-Z0-9]+(?:, [a-zA-Z0-9])*)/g, '($1)'),
						scopeDepth
					)
				);
			}
		} else if (/^\s*>/.test(line)) output.push(new Line(`// ${/^\s*>(.*)$/.exec(line)?.[1] ?? ''}`, scopeDepth));
		// else if(isClassDefinition(line))
		//     handleClassDefinition(line);
	}
	appendReturnIfTerminatingFunction();
	if (currentScope === 'Class') {
		scopeDepth--;
		output.push(new Line('}', scopeDepth));
		currentScope = 'Document';
	}
	output.push(new Line(`Main.Main()`, scopeDepth));
	const outText = output.map(({ depth, text }) => `${'\t'.repeat(depth - 1)}${text}`).join('\n');
	await writeFile(documentName + '.js', outText);
})();
