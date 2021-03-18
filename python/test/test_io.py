import json
import xviz_avs as xa
import xviz_avs.io as xi
import xviz_avs.builder as xb

class TestIO:
    def _get_metadata_builder(self):
        builder = xa.XVIZMetadataBuilder()
        builder.stream('/vehicle_pose').category(xa.CATEGORY.POSE)
        builder.stream('/point/lidar')\
            .coordinate(xa.COORDINATE_TYPES.VEHICLE_RELATIVE)\
            .category(xa.CATEGORY.PRIMITIVE)\
            .type(xa.PRIMITIVE_TYPES.POINT)\
            .stream_style({
                'radius_pixels': 1
            })
        builder.stream('/image/camera')\
            .category(xa.CATEGORY.PRIMITIVE)\
            .type(xa.PRIMITIVE_TYPES.IMAGE)
        return builder

    def _get_builder(self, circle=False, points=False, polyline=False, polygon=False):
        builder = xb.XVIZBuilder()
        builder.pose()\
            .timestamp(2.000000000001)\
            .map_origin(4.4, 5.5, 6.6)\
            .position(44., 55., 66.)\
            .orientation(0.44, 0.55, 0.66)
        if circle:
            builder.primitive('/test_primitive').circle([0, 0, 0], 2)
        if points:
            builder.primitive('/test_primitive')\
                .points([0, 0, 0, 1, 1, 1, 2, 2, 2])\
                .colors([255, 0, 0, 128, 0, 255, 0, 128, 0, 0, 255, 128])
        if polyline:
            builder.primitive('/test_primitive')\
                .polyline([1, 1, 1, 2, 2, 2])
        if polygon:
            builder.primitive('/test_primitive')\
                .polygon([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 1, 1, 1])\
                .style({'height': 2.0})
        return builder

    def test_message_index(self):
        metadata_builder = self._get_metadata_builder()
        builder = self._get_builder(circle=True)

        expected = {
            'timing': [[2.000000000001, 2.000000000001, 0, '2-frame']],
        }

        source = xi.MemorySource()
        data = source._data  # save a reference to dict since it gets deleted after close
        writer = xi.XVIZJsonWriter(source)
        writer.write_message(metadata_builder.get_message())
        writer.write_message(builder.get_message())
        writer.close()
        data = json.loads(data['0-frame.json'].decode('ascii'))

        assert data == expected

    def test_json_metadata_writer(self):
        builder = self._get_metadata_builder()

        expected = {
            "type": "xviz/metadata",
            "data": {
                "version": "2.0.0",
                "streams": {
                    "/image/camera": {
                        "category": "PRIMITIVE",
                        "primitive_type": "IMAGE",
                    },
                    "/vehicle_pose": {
                        "category": "POSE",
                    },
                    "/point/lidar": {
                        "category": "PRIMITIVE",
                        "primitive_type": "POINT",
                        "stream_style": {
                            "radius_pixels": 1.0,
                        },
                        "coordinate": "VEHICLE_RELATIVE",
                    },
                },
            },
        }

        source = xi.MemorySource(latest_only=True)
        writer = xi.XVIZJsonWriter(source)
        writer.write_message(builder.get_message())
        data = source.read()
        data = json.loads(data.decode('ascii'))

        assert data == expected
        writer.close()

    def test_json_normal_writer(self):
        builder = self._get_builder(circle=True)

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

    def test_glb_metadata_writer(self):
        builder = self._get_metadata_builder()

        source = xi.MemorySource(latest_only=True)
        writer = xi.XVIZGLBWriter(source)
        writer.write_message(builder.get_message())
        data = source.read()

        # because json encoding of dict is not necessarily deterministic (different
        # order of iteration of keys), we decode the json and check for dict equality
        expected_prefix = b'glTF\x02\x00\x00\x00\xec\x01\x00\x00\xd0\x01\x00\x00JSON'
        expected_json = {
            "asset": {
                "version": "2",
            },
            "buffers": [{
                "byteLength": 0,
            }],
            "bufferViews": [],
            "accessors": [],
            "images": [],
            "meshes": [],
            "extensions": {
                "AVS_xviz": {
                    "type": "xviz/metadata",
                    "data": {
                        "version": "2.0.0",
                        "streams": {
                            "/vehicle_pose": {
                                "category": "POSE",
                            },
                            "/image/camera": {
                                "category": "PRIMITIVE",
                                "primitive_type": "IMAGE",
                            },
                            "/point/lidar": {
                                "category": "PRIMITIVE",
                                "primitive_type": "POINT",
                                "stream_style": {
                                    "radius_pixels": 1,
                                },
                                "coordinate": "VEHICLE_RELATIVE",
                            },
                        },
                    },
                },
            },
            "extensionsUsed": [
                "AVS_xviz",
            ],
        }
        expected_suffix = b'\x00\x00\x00\x00BIN\x00'

        assert data.startswith(expected_prefix)
        assert data.endswith(expected_suffix)
        data_json = json.loads(data[len(expected_prefix): -len(expected_suffix)].decode('ascii'))
        assert data_json == expected_json

    def test_glb_normal_writer(self):
        builder = self._get_builder(circle=True)

        source = xi.MemorySource(latest_only=True)
        writer = xi.XVIZGLBWriter(source)
        writer.write_message(builder.get_message())
        data = source.read()

        expected = b'glTF\x02\x00\x00\x004\x02\x00\x00\x18\x02\x00\x00JSON{"asset":{"version":"2"'\
            b'},"buffers":[{"byteLength":0}],"bufferViews":[],"accessors":[],"images":[],"meshes"'\
            b':[],"extensions":{"AVS_xviz":{"type":"xviz/state_update","data":{"update_type":"INC'\
            b'REMENTAL","updates":[{"timestamp":2.000000000001,"poses":{"/vehicle_pose":{"timesta'\
            b'mp":2.000000000001,"map_origin":{"longitude":4.4,"latitude":5.5,"altitude":6.6},"po'\
            b'sition":[44.0,55.0,66.0],"orientation":[0.44,0.55,0.66]}},"primitives":{"/test_prim'\
            b'itive":{"circles":[{"center":[0.0,0.0,0.0],"radius":2.0}]}}}]}}},"extensionsUsed":['\
            b'"AVS_xviz"]}   \x00\x00\x00\x00BIN\x00'

        assert data == expected

    def test_glb_point_cloud_writer(self):
        builder = self._get_builder(points=True)

        source = xi.MemorySource(latest_only=True)
        writer = xi.XVIZGLBWriter(source)
        writer.write_message(builder.get_message())
        data = source.read()

        expected = b'glTF\x02\x00\x00\x00D\x03\x00\x00\xf8\x02\x00\x00JSON{"asset":{"version":"2"'\
            b'},"buffers":[{"byteLength":48}],"bufferViews":[{"buffer":0,"byteOffset":0,"byteLeng'\
            b'th":36},{"buffer":0,"byteOffset":36,"byteLength":12}],"accessors":[{"bufferView":0,'\
            b'"type":"VEC3","componentType":5126,"count":3},{"bufferView":1,"type":"VEC4","compon'\
            b'entType":5121,"count":3}],"images":[],"meshes":[],"extensions":{"AVS_xviz":{"type":'\
            b'"xviz/state_update","data":{"update_type":"INCREMENTAL","updates":[{"timestamp":2.0'\
            b'00000000001,"poses":{"/vehicle_pose":{"timestamp":2.000000000001,"map_origin":{"lon'\
            b'gitude":4.4,"latitude":5.5,"altitude":6.6},"position":[44.0,55.0,66.0],"orientation'\
            b'":[0.44,0.55,0.66]}},"primitives":{"/test_primitive":{"points":[{"points":"#/access'\
            b'ors/0","colors":"#/accessors/1"}]}}}]}}},"extensionsUsed":["AVS_xviz"]}  0\x00\x00'\
            b'\x00BIN\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x80?\x00\x00'\
            b'\x80?\x00\x00\x80?\x00\x00\x00@\x00\x00\x00@\x00\x00\x00@\xff\x00\x00\x80\x00\xff'\
            b'\x00\x80\x00\x00\xff\x80'

        assert data == expected

    def test_glb_polyline_writer(self):
        builder = self._get_builder(polyline=True)

        source = xi.MemorySource(latest_only=True)
        writer = xi.XVIZGLBWriter(source)
        writer.write_message(builder.get_message())
        data = source.read()

        expected = b'glTF\x02\x00\x00\x00\xac\x02\x00\x00x\x02\x00\x00JSON{"asset":{"version":"2"'\
            b'},"buffers":[{"byteLength":24}],"bufferViews":[{"buffer":0,"byteOffset":0,"byteLeng'\
            b'th":24}],"accessors":[{"bufferView":0,"type":"VEC3","componentType":5126,"count":2}'\
            b'],"images":[],"meshes":[],"extensions":{"AVS_xviz":{"type":"xviz/state_update","dat'\
            b'a":{"update_type":"INCREMENTAL","updates":[{"timestamp":2.000000000001,"poses":{"/v'\
            b'ehicle_pose":{"timestamp":2.000000000001,"map_origin":{"longitude":4.4,"latitude":5'\
            b'.5,"altitude":6.6},"position":[44.0,55.0,66.0],"orientation":[0.44,0.55,0.66]}},"pr'\
            b'imitives":{"/test_primitive":{"polylines":[{"vertices":"#/accessors/0"}]}}}]}}},"ex'\
            b'tensionsUsed":["AVS_xviz"]} \x18\x00\x00\x00BIN\x00\x00\x00\x80?\x00\x00\x80?\x00'\
            b'\x00\x80?\x00\x00\x00@\x00\x00\x00@\x00\x00\x00@'

        assert data == expected

    def test_glb_polygon_writer(self):
        builder = self._get_builder(polygon=True)

        source = xi.MemorySource(latest_only=True)
        writer = xi.XVIZGLBWriter(source)
        writer.write_message(builder.get_message())
        data = source.read()

        expected = b'glTF\x02\x00\x00\x00\xf0\x02\x00\x00\x98\x02\x00\x00JSON{"asset":{"version":'\
            b'"2"},"buffers":[{"byteLength":60}],"bufferViews":[{"buffer":0,"byteOffset":0,"byteL'\
            b'ength":60}],"accessors":[{"bufferView":0,"type":"VEC3","componentType":5126,"count"'\
            b':5}],"images":[],"meshes":[],"extensions":{"AVS_xviz":{"type":"xviz/state_update","'\
            b'data":{"update_type":"INCREMENTAL","updates":[{"timestamp":2.000000000001,"poses":{'\
            b'"/vehicle_pose":{"timestamp":2.000000000001,"map_origin":{"longitude":4.4,"latitude'\
            b'":5.5,"altitude":6.6},"position":[44.0,55.0,66.0],"orientation":[0.44,0.55,0.66]}},'\
            b'"primitives":{"/test_primitive":{"polygons":[{"base":{"style":{"height":2.0}},"vert'\
            b'ices":"#/accessors/0"}]}}}]}}},"extensionsUsed":["AVS_xviz"]}  <\x00\x00\x00BIN\x00'\
            b'\x00\x00\x80?\x00\x00\x80?\x00\x00\x80?\x00\x00\x00@\x00\x00\x00@\x00\x00\x00@\x00'\
            b'\x00@@\x00\x00@@\x00\x00@@\x00\x00\x80@\x00\x00\x80@\x00\x00\x80@\x00\x00\x80?\x00'\
            b'\x00\x80?\x00\x00\x80?'

        assert data == expected

    def test_protobuf_normal_writer(self):
        builder = self._get_builder(circle=True)

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
