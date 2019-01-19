#!/bin/bash
#
# Runs KITTI converter if generated output is not found
# Runs server & client in background
# Terminates background process if signal is triggered

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

show_help() {
  echo " -h display help information"
  echo " -f force KITTI xviz conversion"
}

# Handle options
force_xviz_conversion=false

while getopts "hf" opt; do
    case "$opt" in
    h|\?)
        show_help
        exit 0
        ;;
    f)  force_xviz_conversion=true
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
    (cd "${SCRIPT_DIR}/../examples/converters/kitti" && yarn start -d ${INPUT_DIR} -o "${OUTPUT_DIR}")
fi

# Start server & web app
cd "${SCRIPT_DIR}/../examples/server" && node ./index.js  -d "${OUTPUT_DIR}" &
pids[1]=$!

echo "##"
echo "## XVIZ Server started."
echo "## Ctrl-c to terminate."
echo "##"

for pid in ${pids[*]}; do
    wait $pid
done
