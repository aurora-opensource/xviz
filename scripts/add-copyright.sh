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
# Usage:
# ./add-copyright <prefix> <filepath>
#
# Ex: ./add-copyright "//" path/to/main.js
#
# Checks for an existing Uber copyright string and if it is not detected, then
# it adds the contents of the file "copyright-header.txt" in the same directory
# as this script to the 'filepath' specified.
#
# The copyright message is prefixed with the first argument which the caller
# must determine.
#
# Exit codes:
# 1 - missing argument
# 2 - file is not found

# Get directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

function checkForCopyright() {
  pattern="$1"
  filepath="$2"

  # returns 0 if a match found
  head "${filepath}" | grep -iq -E "${pattern}"
}

# https://stackoverflow.com/questions/10929453/read-a-file-line-by-line-assigning-the-value-to-a-variable
# Explanation
# - IFS='' (or IFS=) prevents leading/trailing whitespace from being trimmed.
# - -r prevents backslash escapes from being interpreted.
# - || [[ -n $line ]] prevents the last line from being ignored if it doesn't end with a \n (since  read returns a non-zero exit code when it encounters EOF).
function outputCopyright() {
  prefix="$1"

  while IFS='' read -r line || [[ -n "$line" ]]; do
        echo "${prefix}${line}"
      done < "${DIR}/copyright-header.txt"
}

# Determine the extension and output
function addCopyrightHeader() {
  prefix="$1"
  filepath="$2"

  tmpfile=$(mktemp)
  # Handle shell script headers
  if $(head -n 1 "$filepath" | grep -q -E '^#!') ; then
    ( head -n 1 "$filepath" ; outputCopyright "$prefix"; tail -n +2 "$filepath" ) > "$tmpfile"
  else
    ( outputCopyright "$prefix"; cat "$filepath" ) > "$tmpfile"
  fi
  mv "$tmpfile" "$filepath"
}

# Check arguments
if [[ $# -ne 2 ]] ; then
  echo "Must provide the a prefix and target filename"
  exit 1
fi

if [[ ! -f "$2" ]]; then
  echo "File \"${2}\" was not found."
  exit 2
fi

checkForCopyright 'copyright.*uber' "$2"
ecode=$?
if [[ $ecode -eq '1' ]]; then
  addCopyrightHeader "$1" "$2"
fi
