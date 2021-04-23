import math
from pathlib import Path

from control_sim.plotting import plot_path_tracking, plot_control
from control_sim.simulation import simulate_cte_guidance_task, \
    simulate_sync_pid_task
from control_sim.utils import get_planned_path, get_data_instances, \
    detect_sync_task
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
    global_config['guidance']['turning_radius'] \
        = global_config['guidance']['turning_radius_min']
    add_control_limits_to_guidance_config(global_config)

    planned_path = get_planned_path(collector_instances)
    is_sync_task = detect_sync_task(collector_instances)
    waypoints = list(map(tuple, planned_path))

    guidance_states, guidance_states_with_duplicates, control_signals, \
        control_signals_with_duplicates, field_definitions, sync_statuses, \
        sync_parameters, utm_zone = get_data_instances(collector_instances)

    if is_sync_task:
        simulate_sync_pid_task(guidance_states_with_duplicates, waypoints,
                               global_config, field_definitions,
                               sync_parameters, sync_statuses, utm_zone)
    else:
        simulated_control_signals = simulate_cte_guidance_task(
            guidance_states_with_duplicates, waypoints, global_config)

    plot_path_tracking(guidance_states, waypoints)
    plot_control(control_signals_with_duplicates,
                 simulated_control_signals, global_config)


if __name__ == '__main__':
    main()
