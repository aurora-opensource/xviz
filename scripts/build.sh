#!/bin/bash
#
# Copyright (c) 2019 Uber Technologies, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
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
