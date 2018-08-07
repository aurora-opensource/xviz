#!/bin/bash
# Script to build the module for publish

set -e

export PATH=$PATH:node_modules/.bin

rm -rf dist
mkdir dist

# install dependencies
yarn

# transpile modules
BABEL_ENV=es5 babel src --out-dir dist/es5 --source-maps
BABEL_ENV=es6 babel src --out-dir dist/es6 --source-maps
BABEL_ENV=esm babel src --out-dir dist/esm --source-maps

# copy package.json, remove unnecessary fields
cat package.json | jq 'del(.devDependencies) | del(.scripts) | del(.private)' > dist/package.json
