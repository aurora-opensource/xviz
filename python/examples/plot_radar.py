import argparse
from pathlib import Path
from collections import deque
import matplotlib.pyplot as plt
import numpy as np
from google.protobuf.json_format import MessageToDict
from protobuf_APIs import radar_pb2
from scenarios.safety_subsystems.radar_filter import RadarFilter
from scenarios.utils.filesystem import get_collector_instances, load_config, \
    load_global_config
from scenarios.utils.gis import polar_to_cartesian, euclidean_distance
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


def establish_target_key(tgt_id, targets):
    if tgt_id not in targets:
        targets[tgt_id] = {}
        targets[tgt_id]['timestamp'] = []
        make_keys(targets[tgt_id], signal_type='raw')
        make_keys(targets[tgt_id], signal_type='filtered')


def get_targets(collector_instances, radar_filter,
                selected_tgt_ids, sync_status):
    targets = {}

    for collector_output in collector_instances:

        collector_output, is_slim_output = deserialize_collector_output(collector_output)
        if is_slim_output:
            _, radar_output, _, _, _, _, _, _, _ = extract_collector_output_slim(
                collector_output, get_camera_data=False)
        else:
            _, radar_output, _, _ = extract_collector_output(collector_output)

        if radar_output is None:
            continue

        # gross for loop
        for target in radar_output['targets'].values():
            if radar_filter.prev_target_set is not None:
                if radar_filter.prev_target_set == radar_output['targets']:
                    continue

            tgt_id = target['targetId']

            if selected_target_ids is not None:
                if tgt_id not in selected_target_ids:
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

                curr_x, curr_y = polar_to_cartesian(
                    target['phi'],
                    target['dr']
                )
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
                        targets[tgt_id]['raw']['dr'][-2]
                    )
                
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


def get_lone_elements_indices(sig):
    idx = []
    for i, el in enumerate(sig):
        if i == 0:
            if not np.isnan(el) and np.isnan(sig[i+1]):
                idx.append(i)
        elif i == len(sig)-1:
            if not np.isnan(el) and np.isnan(sig[i-1]):
                idx.append(i)
        else:
            if not np.isnan(el) and np.isnan(sig[i-1]) and np.isnan(sig[i+1]):
                idx.append(i)
    return idx


def plot_line_point_combo(ax, x, y, color_idx, point_idx):
    ax.plot(x, y, c='C'+str(color_idx))
    ax.plot(x, y, '.', markevery=point_idx, c='C'+str(color_idx))


def prepare_metadata_plot():
    fig, ax = plt.subplots(nrows=3, ncols=2, figsize=(16, 10), sharex=True)
    fig.set_tight_layout(True)
    ax[0, 0].set_title('phi')
    ax[0, 1].set_title('dr')
    ax[1, 0].set_title('phiSdv')
    ax[1, 1].set_title('step')
    ax[2, 0].set_title('pexist')
    ax[2, 1].set_title('dBpower')
    # ax[1, 1].set_ylim(0, 5)

    return ax


def prepare_tracking_plot(signal_type):
    fig, ax = plt.subplots(figsize=(14, 10))
    fig.set_tight_layout(True)
    ax.set_title(f'tracking from target ids: {signal_type}')
    # ax.set_xlim(-20, 20)
    # ax.set_ylim(0, 35)

    return ax


def smooth(signal, N=12):
    smooth_signal = []
    prev_values = deque(maxlen=N)
    for v in signal:
        prev_values.append(v)
        if np.isnan(v):
            smooth_signal.append(np.nan)
            prev_values.clear()
        else:
            smooth_signal.append(np.mean(prev_values))
    
    return smooth_signal


def plot_metadata(targets, detected_target_ids, signal_type, radar_filter, selected_timespan):
    ax = prepare_metadata_plot()

    cc_idx = 0
    for tgt_id, target in targets.items():
        if tgt_id not in detected_target_ids:
            continue

        t = np.array(target['timestamp']) - target['timestamp'][0]

        if selected_timespan is not None:
            over_start_time = t > selected_timespan[0]
            before_end_time = t < selected_timespan[1]
            timespan_idx = np.nonzero(over_start_time & before_end_time)[0]
            t = t[timespan_idx]
            target[signal_type]['phi'] = np.array(target[signal_type]['phi'])[timespan_idx]
            target[signal_type]['dr'] = np.array(target[signal_type]['dr'])[timespan_idx]
            target[signal_type]['phiSdv'] = np.array(target[signal_type]['phiSdv'])[timespan_idx]
            target[signal_type]['step'] = np.array(target[signal_type]['step'])[timespan_idx]
            target[signal_type]['pexist'] = np.array(target[signal_type]['pexist'])[timespan_idx]
            target[signal_type]['dBpower'] = np.array(target[signal_type]['dBpower'])[timespan_idx]

        point_idx = get_lone_elements_indices(target[signal_type]['phi'])
        step_point_idx = get_lone_elements_indices(target[signal_type]['step'])

        plot_line_point_combo(ax[0, 0], t, target[signal_type]['phi'], cc_idx, point_idx)
        plot_line_point_combo(ax[0, 1], t, target[signal_type]['dr'], cc_idx, point_idx)
        plot_line_point_combo(ax[1, 0], t, target[signal_type]['phiSdv'], cc_idx, point_idx)
        plot_line_point_combo(ax[1, 1], t, target[signal_type]['step'], cc_idx, step_point_idx)
        plot_line_point_combo(ax[2, 0], t, target[signal_type]['pexist'], cc_idx, point_idx)
        plot_line_point_combo(ax[2, 1], t, target[signal_type]['dBpower'], cc_idx, point_idx)

        cc_idx += 1

        ax[1, 0].axhline(radar_filter.config['phi_sdv_threshold'], color='r', linestyle='--', label='phi sdv max')
        ax[1, 1].axhline(radar_filter.config['step_max'], color='r', linestyle='--', label='step max')
        ax[2, 0].axhline(radar_filter.config['confidence_threshold'], color='r', linestyle='--', label='pexist min')
        ax[2, 1].axhline(radar_filter.config['d_bpower_threshold'], color='r', linestyle='--', label='dBpower min')

    plt.show()
    plt.close()


def plot_tracking(targets, detected_target_ids, signal_type, selected_timespan):
    ax = prepare_tracking_plot(signal_type)

    cc_idx = 0
    for tgt_id, target in targets.items():
        if tgt_id not in detected_target_ids:
            continue

        if selected_timespan is not None:
            t = np.array(target['timestamp']) - target['timestamp'][0]
            over_start_time = t > selected_timespan[0]
            before_end_time = t < selected_timespan[1]
            timespan_idx = np.nonzero(over_start_time & before_end_time)[0]
            target[signal_type]['y'] = np.array(target[signal_type]['y'])[timespan_idx]
            target[signal_type]['x'] = np.array(target[signal_type]['x'])[timespan_idx]

        point_idx = get_lone_elements_indices(target[signal_type]['y'])
        plot_line_point_combo(ax, np.negative(target[signal_type]['y']), target[signal_type]['x'], cc_idx, point_idx)

        cc_idx += 1

    plt.gca().set_aspect('equal', adjustable='box')
    plt.show()
    plt.close()


def main(selected_tgt_ids, selected_timespan):
    configfile = Path(__file__).parent / 'scenarios' / 'collector-scenario-config.yaml'
    collector_config = load_config(str(configfile))

    collector_output_file = collector_config['collector_output_file']
    extract_directory = collector_config['extract_directory']
    collector_instances = get_collector_instances(collector_output_file, extract_directory)

    global_config = load_global_config(collector_config['MACHINE_TYPE'])
    radar_safety_config = global_config['safety']['radar']
    # radar_safety_config['d_bpower_threshold'] = -8.0
    # radar_safety_config['phi_sdv_threshold'] = 0.01
    # radar_safety_config['confidence_threshold'] = 0.9
    
    radar_filter = RadarFilter(radar_safety_config)
    sync_status = dict(inSync=False)
    targets = get_targets(collector_instances, radar_filter,
                          selected_tgt_ids, sync_status)

    detected_target_ids = get_detected_target_ids(targets, 'raw')

    plot_metadata(targets, detected_target_ids, 'raw', radar_filter, selected_timespan)
    plot_metadata(targets, detected_target_ids, 'filtered', radar_filter, selected_timespan)
    plot_tracking(targets, detected_target_ids, 'raw', selected_timespan)
    plot_tracking(targets, detected_target_ids, 'filtered', selected_timespan)


if __name__ == '__main__':
    plt.rcParams['figure.facecolor'] = 'black'
    plt.rcParams['figure.edgecolor'] = 'white'
    plt.rcParams['axes.facecolor'] = 'black'
    plt.rcParams['axes.edgecolor'] = 'white'
    plt.rcParams['axes.labelcolor'] = 'white'
    plt.rcParams['axes.titlecolor'] = 'white'
    plt.rcParams['xtick.color'] = 'white'
    plt.rcParams['ytick.color'] = 'white'

    parser = argparse.ArgumentParser(description='Select which target id(s) to plot')
    parser.add_argument('-i', metavar='target id', nargs='*', type=int, help='target id [0:47]')
    parser.add_argument('-t', metavar='time span', nargs='*', type=int, help='timespan [0:T]')
    selected_target_ids = parser.parse_args().i
    selected_timespan = parser.parse_args().t

    if selected_timespan is not None:
        if len(selected_timespan) != 2:
            print('selected invalid timespand: must give start and end times')

    main(selected_target_ids, selected_timespan)
