from collections import defaultdict
import numpy as np
from google.protobuf.json_format import MessageToDict
from protobuf_APIs import radar_pb2
from scenarios.utils.gis import polar_to_cartesian, euclidean_distance, \
    spherical_to_cartesian
from scenarios.utils.read_protobufs import deserialize_collector_output, \
    extract_collector_output, extract_collector_output_slim


def get_detected_target_ids(targets, signal_type):
    detected_ids = []
    for tgt_id, target in targets.items():
        if np.any(~np.isnan(target[signal_type]['phi'])):
            detected_ids.append(tgt_id)
    return detected_ids


def make_keys(target, signal_type):
    target[signal_type] = {}
    target[signal_type]['dr'] = []
    target[signal_type]['phi'] = []
    target[signal_type]['pexist'] = []
    target[signal_type]['dBpower'] = []
    target[signal_type]['phiSdv'] = []
    target[signal_type]['x'] = []
    target[signal_type]['y'] = []
    target[signal_type]['step'] = []


def append_nan(target, signal_type):
    target[signal_type]['dr'].append(np.nan)
    target[signal_type]['phi'].append(np.nan)
    target[signal_type]['pexist'].append(np.nan)
    target[signal_type]['dBpower'].append(np.nan)
    target[signal_type]['phiSdv'].append(np.nan)


def append_values(target, signal_type, measurement):
    target[signal_type]['dr'].append(measurement['dr'])
    target[signal_type]['phi'].append(measurement['phi'])
    target[signal_type]['pexist'].append(measurement['pexist'])
    target[signal_type]['dBpower'].append(measurement['dBpower'])
    target[signal_type]['phiSdv'].append(measurement['phiSdv'])


def append_values_smartmicro(targets, measurement):
    x, y, z = spherical_to_cartesian(measurement['dr'], measurement['phi'],
                                     measurement['elevation'])
    targets['x'].append(x)
    targets['y'].append(y)
    targets['z'].append(z)
    targets['vr'].append(measurement['vr'])
    targets['dBpower'].append(measurement['dBpower'])
    targets['rcs'].append(measurement['rcs'])
    targets['noise'].append(measurement['noise'])


def establish_target_key(tgt_id, targets):
    if tgt_id not in targets:
        targets[tgt_id] = {}
        targets[tgt_id]['timestamp'] = []
        make_keys(targets[tgt_id], signal_type='raw')
        make_keys(targets[tgt_id], signal_type='filtered')


def get_targets_smartmicro(collector_instances, radar_filter):
    filtered_targets = defaultdict(list)
    raw_targets = defaultdict(list)

    for collector_output in collector_instances:

        collector_output, _ = deserialize_collector_output(collector_output)
        _, radar_output, _, _, _, _, _, _, _ = extract_collector_output_slim(
            collector_output, get_camera_data=False)

        if radar_output is None:
            continue

        for target in radar_output['targets'].values():
            append_values_smartmicro(raw_targets, target)
            if radar_filter.is_valid_target(target):
                append_values_smartmicro(filtered_targets, target)

    return raw_targets, filtered_targets


def get_targets(collector_instances, radar_filter, sync_status, selected_tgt_ids):
    targets = {}

    for collector_output in collector_instances:

        collector_output, is_slim_output = deserialize_collector_output(collector_output)
        if is_slim_output:
            _, radar_output, _, _, _, _, _, _, _ = extract_collector_output_slim(
                collector_output, get_camera_data=False)
        else:
            _, _, radar_output, _, _ = extract_collector_output(collector_output)

        if radar_output is None:
            continue

        # gross for loop
        for target in radar_output['targets'].values():
            if radar_filter.prev_target_set is not None:
                if radar_filter.prev_target_set == radar_output['targets']:
                    continue

            tgt_id = target['targetId']

            if selected_tgt_ids is not None:
                if tgt_id not in selected_tgt_ids:
                    continue

            establish_target_key(tgt_id, targets)

            targets[tgt_id]['timestamp'].append(float(radar_output['timestamp']))

            if target['consecutive'] < 1:
                append_nan(targets[tgt_id], 'raw')
                targets[tgt_id]['raw']['x'].append(np.nan)
                targets[tgt_id]['raw']['y'].append(np.nan)
                curr_x, curr_y = 0.0, 0.0
            else:
                append_values(targets[tgt_id], 'raw', target)

                curr_x, curr_y = polar_to_cartesian(target['phi'], target['dr'])
                targets[tgt_id]['raw']['x'].append(curr_x)
                targets[tgt_id]['raw']['y'].append(curr_y)

            if len(targets[tgt_id]['raw']['x']) < 2:
                targets[tgt_id]['raw']['step'].append(np.nan)
                step = np.nan
            else:
                if np.isnan(targets[tgt_id]['raw']['x'][-2]):
                    prev_x, prev_y = 0.0, 0.0
                else:
                    prev_x, prev_y = polar_to_cartesian(
                        targets[tgt_id]['raw']['phi'][-2],
                        targets[tgt_id]['raw']['dr'][-2])

                step = euclidean_distance(prev_x, prev_y, curr_x, curr_y)

                if int(prev_x) == 0 and int(curr_x) == 0:
                    targets[tgt_id]['raw']['step'].append(np.nan)
                else:
                    targets[tgt_id]['raw']['step'].append(step)

            duplicate_target = False
            if tgt_id in radar_filter.queues:
                prev_target = radar_filter.queues[tgt_id].prev_target
                if prev_target is not None:
                    if prev_target == target:
                        duplicate_target = True

            if radar_filter.is_valid_target(target, sync_status=sync_status) \
                    and not duplicate_target:
                append_values(targets[tgt_id], 'filtered', target)
                targets[tgt_id]['filtered']['x'].append(curr_x)
                targets[tgt_id]['filtered']['y'].append(curr_y)
                targets[tgt_id]['filtered']['step'].append(step)
            else:
                append_nan(targets[tgt_id], 'filtered')
                targets[tgt_id]['filtered']['x'].append(np.nan)
                targets[tgt_id]['filtered']['y'].append(np.nan)
                targets[tgt_id]['filtered']['step'].append(np.nan)

        for not_received_id in radar_filter.target_id_set:
            default_target = MessageToDict(
                radar_pb2.RadarOutput.Target(), including_default_value_fields=True)
            radar_filter.update_queue(
                not_received_id, default_target, sync_status=sync_status)
        # reset the target id set for next cycle
        radar_filter.target_id_set = set(range(48))

    return targets
