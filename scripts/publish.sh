#!/bin/bash
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
