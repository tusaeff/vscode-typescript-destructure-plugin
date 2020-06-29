const fs = require('fs');
const path = require('path');
const util = require('util');
const ncp = require('ncp').ncp;

const promisifiedCopy = util.promisify(ncp);

const files = [
  'README.md',
  'CHANGELOG.md',
  'assets',
];

const copyFiles = async () => {
  await Promise.all(files.map((filePath) => {
    const sourcePath = path.join('../', filePath);
    const destinationPath = path.join('./', filePath);

    return promisifiedCopy(
      sourcePath,
      destinationPath,
    );
  }));
};

module.exports = copyFiles;

