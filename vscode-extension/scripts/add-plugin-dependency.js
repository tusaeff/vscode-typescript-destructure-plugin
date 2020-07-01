#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const util = require('util');
const merge = require('lodash/merge');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const symlink = util.promisify(fs.symlink);

const readJSON = async (filepath) => {
  const json = await readFile(path.join(process.cwd(), filepath), {
    encoding: 'utf-8',
  });

  return JSON.parse(json);
};

const writeJSON = async (filepath, content) => {
  return writeFile(
    path.join(process.cwd(), filepath),
    JSON.stringify(content, null, '  '),
    { encoding: 'utf-8' }
  );
};

const updateJSON = async (path, update) => {
  const oldJSON = await readJSON(path);

  const newContent =
    typeof update === 'function' ? update(oldJSON) : merge(oldJSON, update);

  return writeJSON(path, newContent);
};

const makeNPMPackageUrl = (name, version) =>
  `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`;

const addPluginDependency = async () => {
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

  await linkPlugin(plugin.name);
};

const linkPlugin = async (pluginName) => {
  try {
    await symlink(
      path.resolve('../typescript-plugin'),
      path.resolve('./node_modules', pluginName)
    );
  } catch (error) {}
};

module.exports = addPluginDependency;
