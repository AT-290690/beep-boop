import * as fs from 'fs';
const { mkdir, writeFile, readdir, access } = fs.promises;
import { quiverObject } from './class.js';
import { compile } from './compiler.js';

export const quiver = async ({ dir, root, indentBy }) => {
  let monolithic = true;
  const allFiles = await readdir(dir);
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
  const libDir = `./${dir}/dist/qvr/`;
  await access(`${libDir}qvr.js`).catch(async () => {
    await mkdir(libDir, { recursive: true });
    await writeFile(`${libDir}qvr.js`, quiverObject);
  });
};
