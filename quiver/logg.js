export const logBoldMessage = msg => console.log('\x1b[1m', msg);
export const logErrorMessage = msg =>
  console.log('\x1b[31m', '\x1b[1m', msg, '\x1b[0m');
export const logSuccessMessage = msg =>
  console.log('\x1b[32m', '\x1b[1m', msg, '\x1b[0m');
export const logWarningMessage = msg =>
  console.log('\x1b[33m', '\x1b[1m', msg, '\x1b[0m');
export const logErrorIndentationLevel = (node, file, line) =>
  console.log(
    '\x1b[31m',
    '\x1b[1m',
    `"${node.key}" should be indented exactly once from its parent!`
  ) ||
  console.log('\x1b[31m', `   Near "${node.prev}"`) ||
  console.log(
    '\x1b[31m',
    '\x1b[1m',
    `  At file: "${file}" line: [${line + 1}] indentation: [${node.level}]`,
    '\x1b[0m'
  );

export const logErrorAlreadyExists = (node, file, line) =>
  console.log('\x1b[31m', '\x1b[1m', `"${node.key}" already exist!`) ||
  console.log('\x1b[31m', `   Near "${node.prev}"`) ||
  console.log(
    '\x1b[31m',
    '\x1b[1m',
    `  file: "${file}" line: [${line + 1}] indentation: [${node.level}]`,
    '\x1b[0m'
  );
