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
# Script for fetching kitti datasets

set -e

KITTI_DATA_SET="${1:-2011_09_26_drive_0005}"
echo "Fetching kitti dataset: ${KITTI_DATA_SET}"

KITTI_DATE="${KITTI_DATA_SET:0:10}" 
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KITTI_PATH="${SCRIPT_DIR}"/../data/kitti
GENERATED_KITTI_PATH="${SCRIPT_DIR}"/../data/generated/kitti


# Make kitti directories
mkdir -p "${KITTI_PATH}" "${GENERATED_KITTI_PATH}"

# Download files
unpack_kitti_file() {
  wget https://s3.eu-central-1.amazonaws.com/avg-kitti/raw_data/"$1"/"$2" && unzip "$2"  -d "$3" && rm "$2"
}

subdircount=$(find ${KITTI_PATH} -maxdepth 1 -type d | wc -l)

# subdircount includes self + data directory => 2
if [ $subdircount -ne 2 ]; then
  files=( _tracklets.zip _sync.zip)
  for i in "${files[@]}"
  do
    unpack_kitti_file "${KITTI_DATA_SET}" "${KITTI_DATA_SET}${i}" "${KITTI_PATH}"
  done
else
  echo "KITTI data for ${KITTI_DATA_SET} found, not downloading."
fi

unpack_kitti_calib_file() {
  local calib_file="${1}_calib.zip"
  wget https://s3.eu-central-1.amazonaws.com/avg-kitti/raw_data/"$calib_file" && unzip "$calib_file"  -d "$2" && rm "$calib_file"
}

if [ ! -f "${KITTI_PATH}/${KITTI_DATE}/calib_imu_to_velo.txt" ]; then
  unpack_kitti_calib_file "${KITTI_DATE}" "${KITTI_PATH}"
else
  echo "KITTI calibration data for ${KITTI_DATE} found, not downloading."
fi
