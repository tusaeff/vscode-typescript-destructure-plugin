const copyFilesFromParentDir = require('./copy-files-from-parent-dir');
const syncPluginVersion = require('./sync-plugin-version');

async function main() {
  await Promise.all([
    copyFilesFromParentDir(),
    syncPluginVersion(),
  ]);
}

main();