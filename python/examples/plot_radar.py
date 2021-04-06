import argparse
from pathlib import Path
from collections import deque, defaultdict
import matplotlib.pyplot as plt
import numpy as np
from google.protobuf.json_format import MessageToDict
from protobuf_APIs import radar_pb2
from scenarios.safety_subsystems.radar_filter import RadarFilter
from scenarios.utils.filesystem import get_collector_instances, load_config, \
    load_global_config
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
    targets['dBpower'].append(measurement['dBpower'])
    targets['rcs'].append(measurement['rcs'])
    targets['noise'].append(measurement['noise'])


def establish_target_key(tgt_id, targets):
    if tgt_id not in targets:
        targets[tgt_id] = {}
        targets[tgt_id]['timestamp'] = []
        make_keys(targets[tgt_id], signal_type='raw')
        make_keys(targets[tgt_id], signal_type='filtered')


def get_targets_smartmicro(collector_instances):
    targets = defaultdict(list)

    for collector_output in collector_instances:

        collector_output, _ = deserialize_collector_output(collector_output)
        _, radar_output, _, _, _, _, _, _, _ = extract_collector_output_slim(
            collector_output, get_camera_data=False)

        if radar_output is None:
            continue

        for target in radar_output['targets'].values():
            append_values_smartmicro(targets, target)

    return targets


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
    ax[1, 1].set_ylim(0, 4)

    return ax


def prepare_tracking_plot(signal_type):
    fig, ax = plt.subplots(figsize=(14, 10))
    fig.set_tight_layout(True)
    ax.set_title(f'tracking from target ids: {signal_type}')
    # ax.set_xlim(-20, 20)
    # ax.set_ylim(0, 35)

    return ax


def _smooth(signal, N=12):
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


def plot_metadata(targets, detected_target_ids, signal_type, radar_filter,
                  selected_timespan, tgt_id_tspans):
    ax = prepare_metadata_plot()

    cc_idx = 0
    for tgt_id, target in targets.items():
        if tgt_id not in detected_target_ids:
            continue

        t = np.array(target['timestamp']) - target['timestamp'][0]

        tspan = tgt_id_tspans[tgt_id] if tgt_id_tspans \
            else [selected_timespan] if selected_timespan is not None \
            else [(0, t[-1])]

        timespan_idx = []
        for ts in tspan:
            over_start_time = t > ts[0]
            before_end_time = t < ts[1]
            timespan_idx.extend(np.nonzero(over_start_time & before_end_time)[0])

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


def plot_tracking(targets, detected_target_ids, signal_type,
                  selected_timespan, tgt_id_tspans):
    ax = prepare_tracking_plot(signal_type)

    cc_idx = 0
    for tgt_id, target in targets.items():
        if tgt_id not in detected_target_ids:
            continue

        t = np.array(target['timestamp']) - target['timestamp'][0]

        tspan = tgt_id_tspans[tgt_id] if tgt_id_tspans \
            else [selected_timespan] if selected_timespan is not None \
            else [(0, t[-1])]

        timespan_idx = []
        for ts in tspan:
            over_start_time = t > ts[0]
            before_end_time = t < ts[1]
            timespan_idx.extend(np.nonzero(over_start_time & before_end_time)[0])

        t = t[timespan_idx]

        target[signal_type]['y'] = np.array(target[signal_type]['y'])[timespan_idx]
        target[signal_type]['x'] = np.array(target[signal_type]['x'])[timespan_idx]

        point_idx = get_lone_elements_indices(target[signal_type]['y'])
        plot_line_point_combo(ax, np.negative(target[signal_type]['y']), target[signal_type]['x'], cc_idx, point_idx)

        cc_idx += 1

    plt.gca().set_aspect('equal', adjustable='box')
    plt.show()
    plt.close()


def plot_3d(targets, detected_target_ids, signal_type):
    fig = plt.figure()
    ax = fig.add_subplot(projection='3d')

    for tgt_id, target in targets.items():
        if tgt_id not in detected_target_ids:
            continue

        target[signal_type]['phi'] = np.array(target[signal_type]['phi'])
        target[signal_type]['dr'] = np.array(target[signal_type]['dr'])
        target[signal_type]['dBpower'] = np.array(target[signal_type]['dBpower'])

        x = target[signal_type]['dr'] * np.cos(target[signal_type]['phi'])
        y = target[signal_type]['dr'] * np.sin(target[signal_type]['phi'])

        ax.scatter(x, y, target[signal_type]['dBpower'])

    ax.view_init(30, 45)
    ax.set_xlabel('x (m)')
    ax.set_ylabel('y (m)')
    ax.set_zlabel('dBpower')

    plt.show()
    plt.close()


def plot_3d_smartmicro(targets, x_key, y_key, z_key):
    fig = plt.figure()
    ax = fig.add_subplot(projection='3d')

    idx = list(map(lambda x: x[0], filter(lambda x: x[1] > 80.,
                                        enumerate(targets[z_key]))))

    x = list(map(targets[x_key].__getitem__, idx))
    y = list(map(targets[y_key].__getitem__, idx))
    z = list(map(targets[z_key].__getitem__, idx))

    cm = plt.cm.get_cmap('RdYlBu')
    im = ax.scatter(x, y, z, c=z, cmap=cm)

    fig.colorbar(im, ax=ax)

    ax.view_init(0, 45)
    ax.set_xlabel(x_key)
    ax.set_ylabel(y_key)
    ax.set_zlabel(z_key)
    plt.show()
    plt.close()


def main(selected_tgt_ids, selected_timespan, tgt_id_tspans):
    configfile = Path(__file__).parent / 'scenarios' / 'collector-scenario-config.yaml'
    collector_config = load_config(str(configfile))

    collector_output_file = collector_config['collector_output_file']
    extract_directory = collector_config['extract_directory']
    collector_instances = get_collector_instances(collector_output_file, extract_directory)

    global_config = load_global_config(collector_config['MACHINE_TYPE'])
    radar_safety_config = global_config['safety']['radar']
    is_smartmicro = collector_config['smartmicro_radar']

    # override thresholds in Global Configs
    # radar_safety_config['d_bpower_threshold'] = -20.0
    # radar_safety_config['phi_sdv_threshold'] = 0.015
    # radar_safety_config['confidence_threshold'] = 0.65

    if is_smartmicro:
        targets = get_targets_smartmicro(collector_instances)
        # plot_3d_smartmicro(targets, 'x', 'y', 'rcs')
        plot_3d_smartmicro(targets, 'x', 'y', 'dBpower')
        # plot_3d_smartmicro(targets, 'x', 'y', 'noise')

    else:
        radar_filter = RadarFilter(radar_safety_config)
        sync_status = dict(inSync=False)
        targets = get_targets(collector_instances, radar_filter,
                              sync_status, selected_tgt_ids, is_smartmicro)

        detected_target_ids = get_detected_target_ids(targets, 'raw')

        plot_metadata(targets, detected_target_ids, 'raw',
                      radar_filter, selected_timespan, tgt_id_tspans)
        plot_metadata(targets, detected_target_ids, 'filtered',
                      radar_filter, selected_timespan, tgt_id_tspans)

        plot_tracking(targets, detected_target_ids, 'raw',
                      selected_timespan, tgt_id_tspans)
        plot_tracking(targets, detected_target_ids, 'filtered',
                      selected_timespan, tgt_id_tspans)

        # plot_3d(targets, detected_target_ids, 'raw')


if __name__ == '__main__':
    plt.rcParams['figure.figsize'] = [16, 10]
    plt.rcParams['savefig.facecolor'] = 'black'
    plt.rcParams['figure.facecolor'] = 'black'
    plt.rcParams['figure.edgecolor'] = 'white'
    plt.rcParams['axes.facecolor'] = 'black'
    plt.rcParams['axes.edgecolor'] = 'white'
    plt.rcParams['axes.labelcolor'] = 'white'
    plt.rcParams['axes.titlecolor'] = 'white'
    plt.rcParams['xtick.color'] = 'white'
    plt.rcParams['ytick.color'] = 'white'
    plt.rcParams['text.color'] = 'white'
    plt.rcParams["figure.autolayout"] = True
    # plt.rcParams['legend.facecolor'] = 'white'

    parser = argparse.ArgumentParser(description='Select which target id(s) to plot')
    parser.add_argument('-i', metavar='target id', nargs='*', type=int, help='target id [0:47]')
    parser.add_argument('-t', metavar='time span', nargs='*', type=int, help='timespan [0:T]')
    parser.add_argument('-c', metavar='target id and timespan pair', nargs='*',
                        type=int, help='(target_id, t_start, t_end)')

    selected_tgt_ids = parser.parse_args().i
    selected_timespan = parser.parse_args().t
    tgt_id_tspan_pairs = parser.parse_args().c

    # unknown-v2020-25-0-3691020dae1046df88e855e6d9928fca-dot-misc-1616179632582-6693.tar
    # -c 3 0 50 5 40 100 0 90 300 2 250 350 6 350 500

    if selected_timespan is not None:
        if len(selected_timespan) != 2:
            print('invalid -t input: must give start and end times')

    tgt_id_tspans = defaultdict(list)
    if tgt_id_tspan_pairs is not None:
        if len(tgt_id_tspan_pairs) % 3 != 0:
            print('invalid -c input: each target id should be accompanied by start and end times')
        selected_tgt_ids = set(tgt_id_tspan_pairs[::3])
        for i, tgt_id in enumerate(tgt_id_tspan_pairs[::3]):
            tgt_id_tspans[tgt_id].append(tgt_id_tspan_pairs[i*3+1:i*3+3])

    main(selected_tgt_ids, selected_timespan, tgt_id_tspans)
