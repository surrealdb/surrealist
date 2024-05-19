import camelCase from 'camelcase';

export const pascalCase = (input: string | readonly string[]) => camelCase(input, { pascalCase: true });