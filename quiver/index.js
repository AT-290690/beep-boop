import * as fs from 'fs';
const { readdir } = fs.promises;
import { compile } from './compiler.js';

export const quiver = async ({ dir, root, indentBy }) => {
  let monolithic = true;
  if (dir) {
    dir = '/' + dir + '/';
  } else {
    dir = '/';
  }

  const allFiles = await readdir('.' + dir);
  if (!root) {
    monolithic = false;
    root = allFiles.find(file => file?.split('.').pop() === 'go');
  }
  const files = allFiles.filter(
    file => file !== root && file?.split('.').pop() === 'go'
  );
  files.unshift(root);
  const merge = monolithic ? files : [];

  for (const file of files) {
    await compile(dir + file, merge, indentBy);
  }
};
