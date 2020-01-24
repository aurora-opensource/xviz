import json
import xviz_avs.io as xi
import xviz_avs.builder as xb

class TestIO:
    def test_json_metadata_writer(self):
        pass

    def test_json_normal_writer(self):
        builder = xb.XVIZBuilder()
        builder.pose()\
            .timestamp(2.000000000001)\
            .map_origin(4.4, 5.5, 6.6)\
            .position(44., 55., 66.)\
            .orientation(0.44, 0.55, 0.66)
        builder.primitive('/test_primitive').circle([0, 0, 0], 2)
        
        expected = {
            "type": "xviz/state_update",
            "data": {
                "update_type": "INCREMENTAL",
                "updates": [{
                    "timestamp": 2.0,
                    "poses": {
                        "/vehicle_pose": {
                            "timestamp": 2.0,
                            "map_origin": {
                                "longitude": 4.4,
                                "latitude": 5.5,
                                "altitude": 6.6
                            },
                            "position": [44.0, 55.0, 66.0],
                            "orientation": [0.44, 0.55, 0.66]
                        }
                    },
                    "primitives": {
                        "/test_primitive": {
                            "circles": [{
                                "center": [0.0, 0.0, 0.0],
                                "radius": 2.0
                            }]
                        }
                    }
                }]
            }
        }
        expected = json.dumps(expected, separators=(',', ':')).encode('ascii')

        source = xi.MemorySource(latest_only=True)
        writer = xi.XVIZJsonWriter(source)
        writer.write_message(builder.get_message())
        data = source.read()

        assert data == expected
        writer.close()

    def test_json_image_writer(self):
        pass

    def test_glb_normal_writer(self):
        builder = xb.XVIZBuilder()
        builder.pose()\
            .timestamp(2.000000000001)\
            .map_origin(4.4, 5.5, 6.6)\
            .position(44., 55., 66.)\
            .orientation(0.44, 0.55, 0.66)
        builder.primitive('/test_primitive').circle([0, 0, 0], 2)

        source = xi.MemorySource(latest_only=True)
        writer = xi.XVIZGLBWriter(source)
        writer.write_message(builder.get_message())
        data = source.read()

        expected = b'glTF\x02\x00\x00\x004\x02\x00\x00\x18\x02\x00\x00JSON{"asset":{"version":"2"'\
            b'},"buffers":[{"byteLength":0}],"bufferViews":[],"accessors":[],"image":[],"meshes":'\
            b'[],"extensions":{"AVS_xviz":{"type":"#xviz/state_update","data":{"update_type":"#IN'\
            b'CREMENTAL","updates":[{"timestamp":2.000000000001,"poses":{"/vehicle_pose":{"timest'\
            b'amp":2.000000000001,"map_origin":{"longitude":4.4,"latitude":5.5,"altitude":6.6},"p'\
            b'osition":[44.0,55.0,66.0],"orientation":[0.44,0.55,0.66]}},"primitives":{"/test_pri'\
            b'mitive":{"circles":[{"center":[0.0,0.0,0.0],"radius":2.0}]}}}]}}},"extensionsUsed":'\
            b'["AVS_xviz"]}\x00\x00\x00\x00\x00\x00BIN\x00'

        assert data == expected

    def test_glb_point_cloud_writer(self):
        pass

    def test_protobuf_normal_writer(self):
        builder = xb.XVIZBuilder()
        builder.pose()\
            .timestamp(2.000000000001)\
            .map_origin(4.4, 5.5, 6.6)\
            .position(44., 55., 66.)\
            .orientation(0.44, 0.55, 0.66)
        builder.primitive('/test_primitive').circle([0, 0, 0], 2)

        source = xi.MemorySource(latest_only=True)
        writer = xi.XVIZProtobufWriter(source)
        writer.write_message(builder.get_message())
        data = source.read()

        expected = b'glTF\x02\x00\x00\x004\x02\x00\x00\x18\x02\x00\x00JSON{"asset":{"version":"2"'\
            b'},"buffers":[{"byteLength":0}],"bufferViews":[],"accessors":[],"image":[],"meshes":'\
            b'[],"extensions":{"AVS_xviz":{"type":"#xviz/state_update","data":{"update_type":"#IN'\
            b'CREMENTAL","updates":[{"timestamp":2.000000000001,"poses":{"/vehicle_pose":{"timest'\
            b'amp":2.000000000001,"map_origin":{"longitude":4.4,"latitude":5.5,"altitude":6.6},"p'\
            b'osition":[44.0,55.0,66.0],"orientation":[0.44,0.55,0.66]}},"primitives":{"/test_pri'\
            b'mitive":{"circles":[{"center":[0.0,0.0,0.0],"radius":2.0}]}}}]}}},"extensionsUsed":'\
            b'["AVS_xviz"]}\x00\x00\x00\x00\x00\x00BIN\x00'

        # XXX: assert data == expected
