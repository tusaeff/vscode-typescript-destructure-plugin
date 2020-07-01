#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const util = require('util');
const merge = require('lodash/merge');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const readPackageJSON = async (dirPath) => {
  const json = await readFile(
    path.join(process.cwd(), dirPath, 'package.json'),
    { encoding: 'utf-8' }
  );

  return JSON.parse(json);
};

const writePackageJSON = async (dirPath, content) => {
  return writeFile(
    path.join(process.cwd(), dirPath, 'package.json'),
    JSON.stringify(content, null, '\t'),
    { encoding: 'utf-8' }
  );
};

const updatePackageJSON = async (dirPath, update) => {
  const oldPackageJSON = await readPackageJSON(dirPath);

  return writePackageJSON(dirPath, merge(oldPackageJSON, update));
};

const addPluginToExtensionDependencies = async () => {
  const plugin = await readPackageJSON('../typescript-plugin');

  return updatePackageJSON('./', {
    dependencies: { [plugin.name]: plugin.version },
  });
};

addPluginToExtensionDependencies();
