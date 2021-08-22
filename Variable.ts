export type VariableType = 'Int' | 'String' | 'Boolean' | 'Array' | 'Void' | 'Unknown';
export class Variable {
	constructor(public name: string, public type: VariableType) {}
}
