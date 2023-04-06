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
#
# Runs KITTI converter if generated output is not found
# Runs server & client in background
# Terminates background process if signal is triggered

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

show_help() {
  echo " -h display help information"
  echo " -f force KITTI xviz conversion"
  echo " -j generate frames in JSON format"
  echo " -p pretty json output (require -j option)"
  echo " -m messages limit for debugging purpose"
  echo " -g generate only, no server start"
  echo " -d run in debug mode (start-debug)"
}

# Handle options
force_xviz_conversion=false
jsonarg=""
jsonprettyarg=""
messagelimitarg=""
startparam="start"
generate_only=false

while getopts "hfjpm:dg" opt; do
    case "$opt" in
    h|\?)
        show_help
        exit 0
        ;;
    f)  force_xviz_conversion=true
        ;;
    j)  jsonarg=" --json "
        ;;
    p)  jsonprettyarg=" --pretty-json "
        ;;
    m)  messagelimitarg=" --message-limit="${OPTARG}
        ;;
    d)  startparam="start-debug"
        ;;
    g)  generate_only=true
        ;;
    esac
done

# Terminate background pids
exit_script() {
  echo "Terminating XVIZ server & client!"
  trap - SIGINT SIGTERM
  for pid in ${pids[*]}; do
    echo "Terminating ${pid}"
    kill ${pid}
  done
}
trap exit_script SIGINT SIGTERM

# Run KITTI XVIZ conversion
# check for both json & glb files
INPUT_DIR="${SCRIPT_DIR}/../data/kitti/2011_09_26/2011_09_26_drive_0005_sync"
OUTPUT_DIR="${SCRIPT_DIR}/../data/generated/kitti/2011_09_26/2011_09_26_drive_0005_sync/"


if [ "$force_xviz_conversion" = "true" ] || ([ ! -f "${OUTPUT_DIR}/1-frame.json" ] && [ ! -f "${OUTPUT_DIR}/1-frame.glb" ]) ; then
    echo "Generating default KITTI XVIZ data"
    mkdir -p "${OUTPUT_DIR}"
    (cd "${SCRIPT_DIR}/../examples/converters/kitti" && yarn && yarn ${startparam} -d ${INPUT_DIR} -o "${OUTPUT_DIR}" ${jsonarg} ${jsonprettyarg} ${messagelimitarg})
fi

if [ "$generate_only" = "true" ] ; then
    exit 0;
fi

# Start server & web app
cd "${SCRIPT_DIR}/../modules/server" && ./bin/xvizserver -d "${OUTPUT_DIR}" --port 8081 &
pids[1]=$!

echo "##"
echo "## XVIZ Server started."
echo "## Ctrl-c to terminate."
echo "##"

for pid in ${pids[*]}; do
    wait $pid
done
