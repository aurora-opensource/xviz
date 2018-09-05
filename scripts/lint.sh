#!/bin/sh
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
          npx prettier --write $f --loglevel warn
          eslint $f
      done
    fi

    # add changes to commit
    git add .
    break;;

  *)
    echo "Checking prettier code styles..."
    npx prettier-check "{modules,test}/**/*.js" || echo "Running prettier." && prettier --write "{modules,test}/**/*.js" --loglevel warn

    echo "Running eslint..."
    npx eslint modules test
    ;;
  esac

# check if yarn.lock contains private registery information
!(grep -q unpm.u yarn.lock) && echo 'Lockfile valid.' || (echo 'Please rebuild yarn file using public npmrc' && false)
