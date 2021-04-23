import math
import argparse
from pathlib import Path
from collections import defaultdict
import matplotlib.pyplot as plt
from scenarios.safety_subsystems.radar_filter import RadarFilter, \
    SmartMicroRadarFilter
from scenarios.utils.filesystem import get_collector_instances, load_config, \
    load_global_config
from radar_viz.read import get_targets, get_detected_target_ids, get_targets_smartmicro
from radar_viz.plotting import plot_metadata, plot_tracking, plot_3d, \
    plot_3d_smartmicro, polar_plot


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
        dBpower_threshold = 120
        radar_filter = SmartMicroRadarFilter(dBpower_threshold=dBpower_threshold)
        raw_targets, filtered_targets = get_targets_smartmicro(
            collector_instances, radar_filter)

        # polar_plot(filtered_targets)

        # plot_3d_smartmicro(raw_targets, 'x', 'y', 'z',
        #                    c_key='rcs')
        # plot_3d_smartmicro(raw_targets, 'x', 'y', 'z',
        #                    c_key='noise', c_bounds=(10, math.inf))
        # plot_3d_smartmicro(raw_targets, 'x', 'y', 'z',
        #                    c_key='vr')
        # plot_3d_smartmicro(filtered_targets, 'x', 'y', 'z',
        #                    c_key='vr')
        plot_3d_smartmicro(raw_targets, 'x', 'y', 'z',
                           c_key='dBpower', c_bounds=(10, math.inf))
        plot_3d_smartmicro(filtered_targets, 'x', 'y', 'z',
                           c_key='dBpower', c_bounds=(dBpower_threshold, math.inf))

    else:
        radar_filter = RadarFilter(radar_safety_config)
        sync_status = dict(inSync=False)
        targets = get_targets(collector_instances, radar_filter,
                              sync_status, selected_tgt_ids)

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
