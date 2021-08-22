export const parseClassDefinition = (line: string) =>
	line.match(/^## ?(?<name>[a-z0-9]+)(?: extends (?<extend>[a-zA-Z0-9]+))?$/i)?.groups;
