#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const util = require('util');
const merge = require('lodash/merge');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const readJSON = async (filepath) => {
  const json = await readFile(path.join(process.cwd(), filepath), {
    encoding: 'utf-8',
  });

  return JSON.parse(json);
};

const writeJSON = async (filepath, content) => {
  return writeFile(
    path.join(process.cwd(), filepath),
    JSON.stringify(content, null, '\t'),
    { encoding: 'utf-8' }
  );
};

const updateJSON = async (path, update) => {
  const oldJSON = await readJSON(path);

  const newContent =
    typeof update === 'function'
      ? update(oldJSON)
      : merge(oldJSON, update);

  return writeJSON(path, newContent);
};

const makeNPMPackageUrl = (name, version) => `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`;

const addPluginToExtensionDependencies = async () => {
  const plugin = await readJSON('../typescript-plugin/package.json');

  await updateJSON('./package.json', {
    dependencies: { [plugin.name]: plugin.version },
  });

  await updateJSON(
    './package-lock.json',
    (oldJSON) => {
      oldJSON.dependencies[plugin.name] = {
        version: plugin.version,
        resolved: makeNPMPackageUrl(plugin.name, plugin.version),
      };

      return oldJSON;
    },
    true
  );
};

module.exports = addPluginToExtensionDependencies;
