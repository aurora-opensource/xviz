#!/bin/sh
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
# Script to bootstrap repo for development

echo 'Bootstrapping xviz, installing in all directories'

set -e

# install dependencies
yarn

ROOT_NODE_MODULES_DIR=`pwd`/node_modules

cd modules
for D in *; do (
  if [ -d $D ] ; then
    cd $D

    # create symlink to dev dependencies at root
    # this is a bug of yarn: https://github.com/yarnpkg/yarn/issues/4964
    # TODO - remove when fixed
    mkdir -p node_modules
    rm -rf ./node_modules/.bin
    ln -sf $ROOT_NODE_MODULES_DIR/.bin ./node_modules
  fi
); done

# build the submodules
npm run build
