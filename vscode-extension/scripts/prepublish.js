const copyFilesFromParentDir = require('./copy-files-from-parent-dir');
const addPluginDependency = require('./add-plugin-dependency');

async function main() {
  await Promise.all([copyFilesFromParentDir(), addPluginDependency()]);
}

main();
