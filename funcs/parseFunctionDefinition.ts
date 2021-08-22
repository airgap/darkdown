import { Variable, VariableType } from '../Variable';

export const parseFunctionDefinition = (
	line: string
): {
	static: boolean;
	name: string;
	accepts: Variable[];
	returns: Variable[];
} => {
	const { stat, name, accepts, returns } = line.match(
		/^### ?(?<stat>Static )?(?<name>[a-zA-Z0-9]+)(?: accepts (?<accepts> (?:int|string|array|boolean) ([a-zA-Z0-9]+)(?:, ((?:int|string|array|boolean) [a-zA-Z0-9]+))*))?(?: returns (?<returns>void|((int|string|array|boolean) [a-zA-Z0-9]+)(, ((int|string|array|boolean) [a-zA-Z0-9]+))*))?$/i
	).groups;
	return {
		static: !!stat,
		name,
		accepts:
			accepts
				?.split(', ')
				.map(acc => acc.split(' '))
				.map(([type, name]) => new Variable(name, <VariableType>type)) ?? [],
		returns:
			returns
				?.split(', ')
				.map(ret => ret.split(' '))
				.map(([type, name]) => new Variable(name, <VariableType>type)) ?? []
	};
};
