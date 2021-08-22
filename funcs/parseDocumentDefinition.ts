export const parseDocumentDefinition = (line: string) => line.match(/^# ?([a-z0-9 ]+)$/i)[1];
