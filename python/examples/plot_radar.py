from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
from scenarios.safety_subsystems.radar_filter import get_radar_filter
from scenarios.utils.filesystem import get_collector_instances, load_config
from scenarios.utils.gis import polar_to_cartesian, euclidean_distance
from scenarios.utils.read_protobufs import deserialize_collector_output,\
                                            extract_collector_output, extract_collector_output_slim


def get_detected_target_ids(targets):
    detected_ids = []
    for tgt_id, target in targets.items():
        if np.any(~np.isnan(target['phi'])):
            detected_ids.append(tgt_id)
    return detected_ids


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

            tgt_id = target['targetId']

            if tgt_id not in targets:
                targets[tgt_id] = {}
                targets[tgt_id]['dr'] = []
                targets[tgt_id]['phi'] = []
                targets[tgt_id]['pexist'] = []
                targets[tgt_id]['dBpower'] = []
                targets[tgt_id]['phiSdv'] = []
                targets[tgt_id]['timestamp'] = []
                targets[tgt_id]['x'] = []
                targets[tgt_id]['y'] = []
                targets[tgt_id]['step'] = []
            
            targets[tgt_id]['timestamp'].append(float(radar_output['timestamp']))

            if target['consecutive'] < 1:
                targets[tgt_id]['dr'].append(np.nan)
                targets[tgt_id]['phi'].append(np.nan)
                targets[tgt_id]['pexist'].append(np.nan)
                targets[tgt_id]['dBpower'].append(np.nan)
                targets[tgt_id]['phiSdv'].append(np.nan)
                targets[tgt_id]['x'].append(np.nan)
                targets[tgt_id]['y'].append(np.nan)
                targets[tgt_id]['step'].append(np.nan)
            else:
                targets[tgt_id]['dr'].append(target['dr'])
                targets[tgt_id]['phi'].append(target['phi'])
                targets[tgt_id]['pexist'].append(target['pexist'])
                targets[tgt_id]['dBpower'].append(target['dBpower'])
                targets[tgt_id]['phiSdv'].append(target['phiSdv'])

                if np.isnan(targets[tgt_id]['phi'][-2]):
                    targets[tgt_id]['step'].append(np.nan)
                else:
                    prev_x, prev_y = polar_to_cartesian(
                        targets[tgt_id]['phi'][-2],
                        targets[tgt_id]['dr'][-2]
                    )
                    curr_x, curr_y = polar_to_cartesian(
                        targets[tgt_id]['phi'][-1],
                        targets[tgt_id]['dr'][-1]
                    )
                    step = euclidean_distance(prev_x, prev_y, curr_x, curr_y)

                    targets[tgt_id]['x'].append(curr_x)
                    targets[tgt_id]['y'].append(curr_y)
                    targets[tgt_id]['step'].append(step)

            if radar_filter.is_valid_target(target):
                    pass
                else:
                    pass

    return targets


def plot_raw_metadata(targets, detected_target_ids):
    fig, ax = plt.subplots(figsize=(16,10), nrows=3, ncols=2)
    fig.set_tight_layout(True)
    ax[0, 0].set_title('phi')
    ax[0, 1].set_title('dr')
    ax[1, 0].set_title('step')
    ax[1, 1].set_title('pexist')
    ax[2, 0].set_title('dBpower')
    ax[2, 1].set_title('phiSdv')

    for tgt_id, target in targets.items():
        if tgt_id not in detected_target_ids:
            continue
        t = np.array(target['timestamp']) - target['timestamp'][0]
        ax[0, 0].plot(t, target['phi'])
        ax[0, 1].plot(t, target['dr'])
        ax[1, 0].plot(t, target['step'])
        ax[1, 1].plot(t, target['pexist'])
        ax[2, 0].plot(t, target['dBpower'])
        ax[2, 1].plot(t, target['phiSdv'])

    plt.show()
    plt.close()


def plot_raw_tracking(targets, detected_target_ids):
    fig, ax = plt.subplots(figsize=(14, 10))
    fig.set_tight_layout(True)
    ax.set_title('tracking from target ids')
    ax.set_xlim(-20, 20)
    ax.set_ylim(0, 30)

    for tgt_id, target in targets.items():
        if tgt_id not in detected_target_ids:
            continue
        ax.plot(np.negative(target['y']), target['x'])

    plt.gca().set_aspect('equal', adjustable='box')
    plt.show()
    plt.close()


def plot_filtered_metadata(targets, detected_target_ids):
    pass


def plot_filtered_tracking(targets, detected_target_ids):
    pass


def main():
    configfile = Path(__file__).parent / 'scenarios' / 'collector-scenario-config.yaml'
    collector_config = load_config(str(configfile))

    collector_output_file = collector_config['collector_output_file']
    extract_directory = collector_config['extract_directory']
    collector_instances = get_collector_instances(collector_output_file, extract_directory)

    configfile = Path(__file__).parents[2] / 'Global-Configs' / 'Tractors' / 'John-Deere' / '8RIVT_WHEEL.yaml'
    global_config = load_config(str(configfile))
    radar_safety_config = global_config['safety']['radar']
    
    radar_filter = get_radar_filter(radar_safety_config)

    targets = get_targets(collector_instances, radar_filter)

    detected_target_ids = get_detected_target_ids(targets)

    plot_raw_metadata(targets, detected_target_ids)
    plot_filtered_metadata(targets, detected_target_ids)
    plot_raw_tracking(targets, detected_target_ids)
    plot_filtered_tracking(targets, detected_target_ids)


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
