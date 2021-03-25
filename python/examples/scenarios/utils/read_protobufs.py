import json
from pathlib import Path
import numpy as np

from google.protobuf.json_format import MessageToDict
from google.protobuf.message import DecodeError
from protobuf_APIs import collector_pb2, gandalf_pb2, falconeye_pb2, \
    radar_pb2, camera_pb2, smarthp_pb2

from .image import extract_image
from .com_manager import MqttConst as mc


def deserialize_collector_output(file_path):
    try:
        collector_output = collector_pb2.CollectorOutputSlim()
        collector_output.ParseFromString(Path(file_path).read_bytes())
        is_slim_output = True

    except DecodeError:
        collector_output = collector_pb2.CollectorOutput()
        collector_output.ParseFromString(Path(file_path).read_bytes())
        is_slim_output = False

    return collector_output, is_slim_output


def extract_collector_output_slim(collector_output):
    try:
        if mc.RADAR_TOPIC in collector_output.data:
            radar_output = radar_pb2.RadarOutput()
            radar_output.ParseFromString(collector_output.data[mc.RADAR_TOPIC])
            radar_output = MessageToDict(radar_output, including_default_value_fields=True)
            del collector_output.data[mc.RADAR_TOPIC]
        else:
            radar_output = None

        if mc.TRACKS_TOPIC in collector_output.data:
            tracking_output = falconeye_pb2.TrackingOutput()
            tracking_output.ParseFromString(collector_output.data[mc.TRACKS_TOPIC])
            tracking_output = MessageToDict(tracking_output, including_default_value_fields=True)
            del collector_output.data[mc.TRACKS_TOPIC]
        else:
            tracking_output = None

        if 'collector/data/machine_state' in collector_output.data:
            machine_state = gandalf_pb2.MachineState()
            machine_state.ParseFromString(collector_output.data['collector/data/machine_state'])
            machine_state = MessageToDict(machine_state, including_default_value_fields=True)
            del collector_output.data['collector/data/machine_state']
        else:
            machine_state = None

        if 'collector/data/field_def' in collector_output.data:
            field_definition = collector_output.data['collector/data/field_def']
            field_definition = json.loads(field_definition.decode('ascii'))
            del collector_output.data['collector/data/field_def']
        else:  # maintain backwards compatibility by checking for old key
            if 'collector/data/field_definition' in collector_output.data:
                field_definition = collector_output.data['collector/data/field_definition']
                field_definition = json.loads(field_definition.decode('ascii'))
                del collector_output.data['collector/data/field_definition']
            else:
                field_definition = None

        if 'collector/data/planned_path' in collector_output.data:
            planned_path = collector_output.data['collector/data/planned_path']
            planned_path = np.frombuffer(planned_path, dtype=np.float_)
            del collector_output.data['collector/data/planned_path']
        else:
            planned_path = None

        if 'collector/data/sync' in collector_output.data:
            sync_status = smarthp_pb2.SyncStatus()
            sync_status.ParseFromString(collector_output.data['collector/data/sync'])
            sync_status = MessageToDict(sync_status, including_default_value_fields=True)
            del collector_output.data['collector/data/sync']
        else: # maintain backwards compatibility by checking for old key
            if 'collector/data/sync_status' in collector_output.data:
                sync_status = smarthp_pb2.SyncStatus()
                sync_status.ParseFromString(collector_output.data['collector/data/sync_status'])
                sync_status = MessageToDict(sync_status, including_default_value_fields=True)
                del collector_output.data['collector/data/sync_status']
            else:
                sync_status = None

        if 'collector/data/control_signal' in collector_output.data:
            control_signal = gandalf_pb2.ControlSignal()
            control_signal.ParseFromString(collector_output.data['collector/data/control_signal'])
            control_signal = MessageToDict(control_signal, including_default_value_fields=True)
            del collector_output.data['collector/data/control_signal']
        else:
            control_signal = None

        if 'collector/data/sync_params' in collector_output.data:
            sync_params = collector_output.data['collector/data/sync_params']
            sync_params = json.loads(sync_params.decode('ascii'))
            del collector_output.data['collector/data/sync_params']
        else:
            sync_params = None

        # {key associated to frame: (frame, CameraOutput as dict)}
        camera_data = dict()
        # Collector appends the camera index to the key for the image
        # Primary camera is assumed to have index 0
        if 'frame_cam_0' in collector_output.data:
            for key in collector_output.data:
                if 'frame_cam_' in key:
                    frame = extract_image(collector_output.data[key])
                    cam_idx = key.split('_')[-1]
                    if int(cam_idx) == 0:  # primary camera
                        if mc.CAMERA_TOPIC in collector_output.data:
                            camera_output = camera_pb2.CameraOutput()
                            camera_output.ParseFromString(
                                collector_output.data[mc.CAMERA_TOPIC])
                            camera_output = MessageToDict(
                                camera_output,
                                including_default_value_fields=True)
                        else:
                            print('missing primary camera output from collector output')
                            camera_output = None
                    else:  # hazard camera
                        haz_cam_output_key = mc.HAZARD_CAMERA_TOPIC + '_' + cam_idx
                        if haz_cam_output_key  in collector_output.data:
                            camera_output = camera_pb2.CameraOutput()
                            camera_output.ParseFromString(
                                collector_output.data[haz_cam_output_key])
                            camera_output = MessageToDict(
                                camera_output,
                                including_default_value_fields=True)
                        else:
                            print('missing primary camera output from collector output')
                            camera_output = None
                    camera_data[key] = (frame, camera_output)
        elif 'frame' in collector_output.data:
            frame = extract_image(collector_output.data['frame'])
            if mc.CAMERA_TOPIC in collector_output.data:
                camera_output = camera_pb2.CameraOutput()
                camera_output.ParseFromString(collector_output.data[mc.CAMERA_TOPIC])
                camera_output = MessageToDict(camera_output, including_default_value_fields=True)
            else:
                print('missing primary camera output from collector output')
                camera_output = None
            camera_data['frame_cam_0'] = (frame, camera_output)
        else:
            print('missing primary camera frame from collector output')
            frame = None

    except Exception as e:
        print('failed to extract collector output:', e)

    return camera_data, radar_output, tracking_output, machine_state, \
            field_definition, planned_path, sync_status, control_signal, sync_params


def extract_collector_output(collector_output):
    if collector_output.frame:
        frame = extract_image(collector_output.frame)
    else:
        print('missing frame from collector output')
        frame = None

    if collector_output.camera_output:
        camera_output = camera_pb2.CameraOutput()
        camera_output.ParseFromString(collector_output.camera_output)
        camera_output = MessageToDict(camera_output, including_default_value_fields=True)
    else:
        print('missing camera output from collector output')
        camera_output = None

    if collector_output.radar_output:
        radar_output = radar_pb2.RadarOutput()
        radar_output.ParseFromString(collector_output.radar_output)
        radar_output = MessageToDict(radar_output, including_default_value_fields=True)
    else:
        radar_output = None

    if collector_output.tracking_output:
        tracking_output = falconeye_pb2.TrackingOutput()
        tracking_output.ParseFromString(collector_output.tracking_output)
        tracking_output = MessageToDict(tracking_output, including_default_value_fields=True)
    else:
        tracking_output = None

    if collector_output.machine_state:
        machine_state = gandalf_pb2.MachineState()
        machine_state.ParseFromString(collector_output.machine_state)
        machine_state = MessageToDict(machine_state, including_default_value_fields=True)
    else:
        machine_state = None

    return frame, camera_output, radar_output, tracking_output, machine_state
