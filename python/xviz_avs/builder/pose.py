from typing import Dict

from xviz_avs.builder.base_builder import XVIZBaseBuilder, CATEGORY
from xviz_avs.v2.core_pb2 import Pose, MapOrigin

class XVIZPoseBuilder(XVIZBaseBuilder):
    """
    # Reference
    [@xviz/builder/xviz-pose-builder]/(https://github.com/uber/xviz/blob/master/modules/builder/src/builders/xviz-pose-builder.js)
    """
    def __init__(self, metadata):
        super().__init__(CATEGORY.POSE, metadata)

        self._poses = {}
        self.reset()

    def reset(self):
        super().reset()

        self._category = CATEGORY.POSE
        self._temp_pose = Pose()

    def map_origin(self, longitude: float, latitude: float, altitude: float) -> 'XVIZPoseBuilder':
        self._temp_pose.map_origin.longitude = longitude
        self._temp_pose.map_origin.latitude = latitude
        self._temp_pose.map_origin.altitude = altitude
        return self

    def position(self, x: float, y: float, z: float) -> 'XVIZPoseBuilder':
        self._temp_pose.position.extend([x, y, z])
        return self

    def orientation(self, roll: float, pitch: float, yaw: float) -> 'XVIZPoseBuilder':
        self._temp_pose.orientation.extend([roll, pitch, yaw])
        return self

    def timestamp(self, timestamp: float) -> 'XVIZPoseBuilder':
        self._temp_pose.timestamp = timestamp
        return self

    def _flush(self):
        self._poses[self._stream_id] = self._temp_pose
        self._temp_pose = Pose()

    def get_data(self) -> Dict[str, Pose]:
        if self._stream_id:
            self._flush()

        return self._poses
