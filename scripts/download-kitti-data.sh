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
