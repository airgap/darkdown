export const isFunctionDefinition = (line: string) =>
	/^### ?(?<stat>Static )?(?<name>[a-zA-Z0-9]+)(?: accepts (?<accepts> (?:int|string|array|boolean) ([a-zA-Z0-9]+)(?:, ((?:int|string|array|boolean) [a-zA-Z0-9]+))*))?(?: returns (?<returns>void|((int|string|array|boolean) [a-zA-Z0-9]+)(, ((int|string|array|boolean) [a-zA-Z0-9]+))*))?$/i.test(
		line
	);
