import math
from pathlib import Path

from control_sim.simulation import simulate_guidance
from control_sim.plotting import plot_path_tracking, plot_control
from control_sim.utils import get_planned_path, get_data_instances
from scenarios.utils.filesystem import get_collector_instances, load_config, \
    load_global_config

from smarthp_utilities.config_utils import add_control_limits_to_guidance_config


def main():
    configfile = Path(__file__).parent \
        / 'scenarios' / 'collector-scenario-config.yaml'
    collector_config = load_config(str(configfile))

    collector_output_file = collector_config['collector_output_file']
    extract_directory = collector_config['extract_directory']
    collector_instances = get_collector_instances(collector_output_file,
                                                  extract_directory)

    global_config = load_global_config(collector_config['MACHINE_TYPE'])
    global_config['guidance']['turning_radius'] = global_config['guidance']['turning_radius_min']
    add_control_limits_to_guidance_config(global_config)

    planned_path = get_planned_path(collector_instances)
    waypoints = list(map(tuple, planned_path))

    guidance_states, guidance_states_with_duplicates, control_signals, \
        control_signals_with_duplicates = get_data_instances(collector_instances)

    simulated_control_signals = simulate_guidance(
        guidance_states_with_duplicates, waypoints, global_config)

    plot_path_tracking(guidance_states, waypoints)
    plot_control(control_signals_with_duplicates,
                 simulated_control_signals, global_config)


if __name__ == '__main__':
    main()
