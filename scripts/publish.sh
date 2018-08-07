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
# Script to publish the module

set -e

# beta or prod
PUBLISH_DIRECTORY=dist
MODE=$1
PACKAGE_VERSION="$(node -pe "require('./package.json').version")"

# transpile module
npm run build

NODE_ENV=test node test/start dist

if [[ "$PACKAGE_VERSION" =~ 'alpha' || "$PACKAGE_VERSION" =~ 'beta' ]]; then
  cd $PUBLISH_DIRECTORY && npm publish --tag beta #beta
else
  cd $PUBLISH_DIRECTORY && npm publish #prod
fi
