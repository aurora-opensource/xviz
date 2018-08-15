#!/usr/bin/env bash

set -ex

publishModule () {
  MODULE_PATH=$1
  PUBLISH_DIRECTORY=$2
  (
    cd $MODULE_PATH
    PACKAGE_NAME="$(node -pe "require('./package.json').name")"
    PACKAGE_VERSION="$(node -pe "require('./package.json').version")"

    set +e # don't exit script if this fails
    LAST_PUBLISHED_VERSION="$(npm show ${PACKAGE_NAME}@${PACKAGE_VERSION} version)"
    set -e

    if [ "$PACKAGE_VERSION" != "$LAST_PUBLISHED_VERSION" ]; then
      npm run build
      if [[ "$PACKAGE_VERSION" =~ 'alpha' || "$PACKAGE_VERSION" =~ 'beta' ]]; then
        cd $PUBLISH_DIRECTORY && npm publish --tag beta #beta
      else
        cd $PUBLISH_DIRECTORY && npm publish #prod
      fi
    else
      echo -e "$PACKAGE_NAME not updated"
    fi
  )
}

install_with_workaround_for_unpm_publish_script () {
  # unpm-publish-script strips private field from package.json
  # https://code.uberinternal.com/diffusion/WEUNPMPU/browse/master/unpm-publish.sh
  # add back "private" attribute (required by yarn workspace)
  jq '. + {"private": true}' package.json > package.json.new && mv package.json.new package.json
  # yarn freaks out with custom registry
  REGISTRY=$npm_config_registry
  export npm_config_registry=https://unpm.uberinternal.com
  # unpm-publish-script sets `prefix` to /usr/lib/node0.10 which
  # gets propagated into process.env.PATH and results in using the wrong node
  yarn config set prefix `which node | sed -e 's/\/bin\/node//'`

  # Use .npmrc from /usr/lib/node0.10/etc
  cp /usr/lib/node0.10/etc/npmrc ./.npmrc

  # For debugging
  yarn config list
  yarn run env

  # Install deps
  npm run bootstrap

  # strip "private" attribute
  jq -M 'del(.private)' package.json > package.json.new && mv package.json.new package.json
  # restore custom registry
  export npm_config_registry=$REGISTRY
}

# install dependencies
install_with_workaround_for_unpm_publish_script

# Tests
npm run test

# publish
publishModule "modules/parser" "."
