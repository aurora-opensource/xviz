from xviz_avs.builder.base_builder import XVIZBaseBuilder, CATEGORY
from xviz_avs.v2.core_pb2 import Pose, MapOrigin

class XVIZPoseBuilder(XVIZBaseBuilder):
    """
    # Reference
    [@xviz/builder/xviz-pose-builder]/(https://github.com/uber/xviz/blob/master/modules/builder/src/builders/xviz-pose-builder.js)
    """
    def __init__(self, metadata, logger=None):
        super().__init__(CATEGORY.POSE, metadata, logger)

        self._poses = None
        self.reset()

    def reset(self):
        super().reset()

        self._category = CATEGORY.POSE
        self._temp_pose = Pose()

    def map_origin(self, longitude, latitude, altitude):
        self._temp_pose.map_origin.longitude = longitude
        self._temp_pose.map_origin.latitude = latitude
        self._temp_pose.map_origin.altitude = altitude
        return self

    def position(self, x, y, z):
        self._temp_pose.position.extend([x, y, z])
        return self

    def orientation(self, roll, pitch, yaw):
        self._temp_pose.orientation.extend([roll, pitch, yaw])
        return self

    def timestamp(self, timestamp):
        self._temp_pose.timestamp = timestamp
        return self

    def _flush(self):
        if not self._poses:
            self._poses = {}

        self._poses[self._stream_id] = self._temp_pose
        self._temp_pose = Pose()

    def get_data(self):
        if self._stream_id:
            self._flush()

        return self._poses
