import {
  logErrorMessage,
  logSuccessMessage,
  logWarningMessage,
  logErrorAlreadyExists
} from './logg.js';
import * as fs from 'fs';
import { settings } from './compiler.js';
const { mkdir, writeFile } = fs.promises;

const monolithArr = [];
const monolithNodes = [];
export const errors = { count: 0 };
export const build = async (main, graph) => {
  monolithNodes.push(graph);
  monolithArr.push(main);
  if (settings.files.length === monolithNodes.length) {
    const root = Object.values(monolithNodes[0]).find(
      node => node.type === 'root'
    ).key;
    logWarningMessage(`\n< [${root}] ${settings.files.join(' -> ')} >\n`);
    const buildCode = `const qvr = new Quiver();
qvr.setNodes(${JSON.stringify(
      monolithNodes.reduce((acc, item) => ({ ...acc, ...item }), {})
    )});
${monolithArr.join('\n')}
export default async (logging = false) => {
qvr.logOn = logging;
qvr.setRoot(qvr.nodes["${root}"].key);
qvr.reset();
await qvr.goTo(qvr.root);
return qvr.out();
}`;
    const dubs = new Set();
    monolithNodes.forEach(collection => {
      const array = Object.values(collection);
      array.forEach((current, index) => {
        if (dubs.has(current.key)) {
          logErrorAlreadyExists(current, settings.file, index);
          errors.count++;
        } else {
          dubs.add(current.key);
        }
      });
    });
    const path = settings.file.split('/');
    path.pop().split('.go')[0];
    const dir = path.join('/');
    await mkdir(`./${dir}/dist`, { recursive: true });
    await writeFile(
      `./${dir}/dist/${settings.files[0].split('.go')[0]}.js`,
      `import { Quiver } from '${path
        .map(() => '../')
        .join('')}quiver/quiver.js';\n` + buildCode
    );
    logSuccessMessage(`${settings.files[0].split('.go')[0]}.js is generated!`);
    errors.count
      ? logErrorMessage(
          errors.count === 1
            ? `Found ${errors.count} error!`
            : `Found ${errors.count} errors!`
        )
      : logSuccessMessage(`No errors found!`);
    errors.count = 0;
    monolithArr.length = 0;
    monolithNodes.length = 0;
  }
};
