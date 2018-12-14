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

    JS_PATTERN="{modules,test,website,examples}/**/*.js"
    DOCS_PATTERN="docs/**/*.md"
    README_PATTERN="*.md"
    SCHEMA_README="./modules/schema/README.md"

    npx prettier-check "$JS_PATTERN" "$DOCS_PATTERN" "$README_PATTERN" "$SCHEMA_README" \
        || echo "Running prettier." && npx prettier --loglevel warn --write \
                                           "$JS_PATTERN" \
                                           "$DOCS_PATTERN" \
                                           "$README_PATTERN" \
                                           "$SCHEMA_README"


    echo "Running eslint..."
    npx eslint modules test
    ;;
  esac

# check if yarn.lock contains private registery information
!(grep -q unpm.u yarn.lock) && echo 'Lockfile valid.' || (echo 'Please rebuild yarn file using public npmrc' && false)
