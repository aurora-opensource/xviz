from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
from scenarios.safety_subsystems.radar_filter import get_radar_filter
from scenarios.utils.filesystem import get_collector_instances, load_config
from scenarios.utils.gis import polar_to_cartesian, euclidean_distance
from scenarios.utils.read_protobufs import deserialize_collector_output,\
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


def get_targets(collector_instances, radar_filter):
    targets = {}

    for collector_output in collector_instances:

        collector_output, is_slim_output = deserialize_collector_output(collector_output)
        if is_slim_output:
            _, _, radar_output, _, _, _, _, _, _ = extract_collector_output_slim(collector_output)
        else:
            _, _, radar_output, _, _ = extract_collector_output(collector_output)

        if radar_output is None:
            continue

        for target in radar_output['targets'].values():
            # gross for loop

            tgt_id = target['targetId']

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

            if radar_filter.is_valid_target(target):
                append_values(targets[tgt_id], 'filtered', target)
                targets[tgt_id]['filtered']['x'].append(curr_x)
                targets[tgt_id]['filtered']['y'].append(curr_y)
                targets[tgt_id]['filtered']['step'].append(step)
            else:
                append_nan(targets[tgt_id], 'filtered')
                targets[tgt_id]['filtered']['x'].append(np.nan)
                targets[tgt_id]['filtered']['y'].append(np.nan)
                targets[tgt_id]['filtered']['step'].append(np.nan)

    return targets


def prepare_metadata_plot():
    fig, ax = plt.subplots(nrows=3, ncols=2, figsize=(16, 10), sharex=True)
    fig.set_tight_layout(True)
    ax[0, 0].set_title('phi')
    ax[0, 1].set_title('dr')
    ax[1, 0].set_title('step')
    ax[1, 1].set_title('pexist')
    ax[2, 0].set_title('dBpower')
    ax[2, 1].set_title('phiSdv')

    return ax


def prepare_tracking_plot(signal_type):
    fig, ax = plt.subplots(figsize=(14, 10))
    fig.set_tight_layout(True)
    ax.set_title(f'tracking from target ids: {signal_type}')
    ax.set_xlim(-20, 20)
    ax.set_ylim(0, 30)

    return ax


def plot_metadata(targets, detected_target_ids, signal_type):
    ax = prepare_metadata_plot()

    for tgt_id, target in targets.items():
        if tgt_id not in detected_target_ids:
            continue
        t = np.array(target['timestamp']) - target['timestamp'][0]
        ax[0, 0].plot(t, target[signal_type]['phi'])
        ax[0, 1].plot(t, target[signal_type]['dr'])
        ax[1, 0].plot(t, target[signal_type]['step'])
        ax[1, 1].plot(t, target[signal_type]['pexist'])
        ax[2, 0].plot(t, target[signal_type]['dBpower'])
        ax[2, 1].plot(t, target[signal_type]['phiSdv'])

    plt.show()
    plt.close()


def plot_tracking(targets, detected_target_ids, signal_type):
    ax = prepare_tracking_plot(signal_type)

    for tgt_id, target in targets.items():
        if tgt_id not in detected_target_ids:
            continue
        ax.plot(np.negative(target[signal_type]['y']), target[signal_type]['x'])

    plt.gca().set_aspect('equal', adjustable='box')
    plt.show()
    plt.close()


def main():
    configfile = Path(__file__).parent / 'scenarios' / 'collector-scenario-config.yaml'
    collector_config = load_config(str(configfile))

    collector_output_file = collector_config['collector_output_file']
    extract_directory = collector_config['extract_directory']
    collector_instances = get_collector_instances(collector_output_file, extract_directory)

    configfile = Path(__file__).resolve().parents[2] / 'Global-Configs' / 'Tractors' / 'John-Deere' / '8RIVT_WHEEL.yaml'
    global_config = load_config(str(configfile))
    radar_safety_config = global_config['safety']['radar']
    
    radar_filter = get_radar_filter(radar_safety_config)

    targets = get_targets(collector_instances, radar_filter)

    detected_target_ids = get_detected_target_ids(targets, 'raw')

    plot_metadata(targets, detected_target_ids, 'raw')
    plot_metadata(targets, detected_target_ids, 'filtered')
    plot_tracking(targets, detected_target_ids, 'raw')
    plot_tracking(targets, detected_target_ids, 'filtered')


if __name__ == '__main__':
    plt.rcParams['figure.facecolor'] = 'black'
    plt.rcParams['figure.edgecolor'] = 'white'
    plt.rcParams['axes.facecolor'] = 'black'
    plt.rcParams['axes.edgecolor'] = 'white'
    plt.rcParams['axes.labelcolor'] = 'white'
    plt.rcParams['axes.titlecolor'] = 'white'
    plt.rcParams['xtick.color'] = 'white'
    plt.rcParams['ytick.color'] = 'white'

    main()
