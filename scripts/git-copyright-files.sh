#!/usr/bin/env bash
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
# Usage
# ./git-copyright-files.sh file1.sh file2.js
#
# For each file in git it will determine the prefix necessary to insert
# a copyright header and then update the git index after adding the copyright
# to the files
#
# Only .sh and .js files are supported

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
COPYRIGHT_PREFIXER="${DIR}/add-copyright.sh"

for i in "$@"; do
  PREFIX="#"

  # Determine the extension and output
  filepath="$i"
  filename=$(basename -- "$filepath")
  extension="${filename##*.}"

  case "$extension" in
    sh)
      PREFIX="#"
      ;;
    js)
      PREFIX="//"
      ;;
    *)
      echo "File with extension \"${extension}\" is not supported"
      exit 1
  esac

  # 10* means operate on files
  git ls-files --stage "${i}" | while read MODE OBJECT STAGE FILE_PATH; do
    case ${MODE} in
    10*)
      # Copy file to temporary
      STAGED_FILE=$(mktemp)
      git show ${OBJECT} > "${STAGED_FILE}"

      # Do change copyright year
      FORMATTED_FILE=$(mktemp)
      cp "${STAGED_FILE}" "${FORMATTED_FILE}"

      "${COPYRIGHT_PREFIXER}" "${PREFIX}" "${FORMATTED_FILE}"

      # Write new file blob to object database
      FORMATTED_HASH=`git hash-object -w "${FORMATTED_FILE}"`

      # Register new written file to working tree index
      git update-index --cacheinfo ${MODE} ${FORMATTED_HASH} "${FILE_PATH}"
      # Patch file in workspace, make it seems changed too
      diff "${STAGED_FILE}" "${FORMATTED_FILE}" | patch "${FILE_PATH}"
      rm "${FORMATTED_FILE}"
      rm "${STAGED_FILE}"
      ;;
    esac
  done
done
