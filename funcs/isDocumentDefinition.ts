export const isDocumentDefinition = (line: string) => !!line.match(/^# ?[a-z0-9 ]+$/i);
