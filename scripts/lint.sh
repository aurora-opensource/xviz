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
# Script to check code styles
set -e

MODE=$1

case $MODE in
  "pre-commit")
    echo "Running prettier & eslint..."

    # only check changed files
    set +e
    FILES=`git diff HEAD --name-only | grep .js$`
    set -e

    if [ ! -z "${FILES}" ]; then
      for f in $FILES
        do
          prettier --write $f --loglevel warn
          eslint $f
      done
    fi

    # add changes to commit
    git add .
    break;;

  *)
    echo "Checking prettier code styles..."
    prettier-check "{modules,test}/**/*.js" || echo "Running prettier." && prettier --write "{modules,test}/**/*.js" --loglevel warn

    echo "Running eslint..."
    eslint src test
    ;;
  esac

# check if yarn.lock contains private registery information
!(grep -q unpm.u yarn.lock) && echo 'Lockfile valid.' || (echo 'Please rebuild yarn file using public npmrc' && false)
