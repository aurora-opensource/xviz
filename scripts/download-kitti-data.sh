#!/bin/bash
# Script for fetching kitti datasets

set -e

echo 'Fetching kitti dataset'

KITTI_DATA_SET="${1:-2011_09_26_drive_0005}"
echo "Fetching kitti dataset: ${KITTI_DATA_SET}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KITTI_PATH="${SCRIPT_DIR}"/../data/kitti
GENERATED_KITTI_PATH="${SCRIPT_DIR}"/../data/generated/kitti

if [ -d "${KITTI_PATH}" ]; then
  echo "Target directory ${KITTI_PATH} already exists. Remove in order to run this setup script."
  exit 0
fi

# Make kitti directories
mkdir -p "${KITTI_PATH}" "${GENERATED_KITTI_PATH}"

# Download files
unpack_kitti_file() {
  wget https://s3.eu-central-1.amazonaws.com/avg-kitti/raw_data/"$1"/"$2" && unzip "$2"  -d "$3" && rm "$2"
}

files=( _tracklets.zip _sync.zip )
for i in "${files[@]}"
do
	unpack_kitti_file "${KITTI_DATA_SET}" "${KITTI_DATA_SET}${i}" "${KITTI_PATH}" &
done
