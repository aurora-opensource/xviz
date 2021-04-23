import numpy as np

from scenarios.utils.gis import lonlat_to_utm
from scenarios.utils.read_protobufs import deserialize_collector_output, \
    extract_collector_output_slim


def get_planned_path(collector_instances):
    for collector_instance in collector_instances:

        collector_output, is_slim_output = deserialize_collector_output(
            collector_instance)

        if is_slim_output:
            _, _, _, _, _, planned_path, _, _, _ \
                = extract_collector_output_slim(collector_output,
                                                get_camera_data=False)
        else:
            print('collector file is not campatible for running guidance sim')

        if planned_path is not None:
            if planned_path.size > 0:
                return planned_path.reshape(-1, 2)

    print('planned path never found in collector file')
    return None


def get_value_list(dict_list, k):
    """
    return list of values for given key from a list of dicts
    """
    return list(map(lambda x: x[k], dict_list))


def get_next_waypoint_index(current_pos, waypoints):
    current_pos = np.array(current_pos)
    waypoints = np.array(waypoints)
    distances = np.linalg.norm(waypoints - current_pos, ord=2, axis=1)
    closest_wp_idx = max(distances.argmin(), 1)
    return closest_wp_idx \
        if closest_wp_idx == len(distances) - 1 \
        or distances[closest_wp_idx-1] < distances[closest_wp_idx+1] \
        else closest_wp_idx + 1


def set_next_waypoint(current_pos, waypoints, guidance):
    next_wp_idx = get_next_waypoint_index(current_pos, waypoints)
    print('starting waypoint index:', next_wp_idx)
    guidance.task.next_wp = guidance.task._waypoints[0]
    guidance.task._wpctr = next(guidance.task._wpctr_iter)
    for _ in range(next_wp_idx):
        guidance.task.update_waypoint()
    guidance.task.initialized = True


def get_data_instances(collector_instances):
    guidance_states = []
    guidance_states_with_duplicates = []
    control_signals = []
    control_signals_with_duplicates = []

    for collector_instance in collector_instances:

        collector_output, is_slim_output = deserialize_collector_output(
            collector_instance)

        if is_slim_output:
            _, _, _, machine_state, _, _, _, control_signal, _ \
                = extract_collector_output_slim(collector_output,
                                                get_camera_data=False)
        else:
            print('collector file is not campatible for running guidance sim')
            return

        if machine_state is not None:
            utm_zone = machine_state['opState']['refUtmZone']
            vehicle_states = machine_state['vehicleStates']
            tractor_state = None
            combine_states = {}
            guidance_state = {}

            for vehicle, state in vehicle_states.items():
                if vehicle == 'tractor':
                    tractor_state = state
                else:
                    combine_states[vehicle] = state

            if tractor_state is not None:
                tractor_easting, tractor_northing = lonlat_to_utm(
                    tractor_state['longitude'],
                    tractor_state['latitude'],
                    utm_zone,
                )
                guidance_state.update({
                    'utm_pos': (tractor_easting, tractor_northing),
                    'heading': tractor_state['heading'],
                    'veh_speed': tractor_state['speed'],
                })

            if combine_states:
                guidance_state.update(combine_states)

            guidance_states.append(guidance_state)

        if control_signal is not None:
            control_signals.append(control_signal)

        if bool(guidance_state) ^ bool(control_signal):
            if guidance_state:  # no control signal in this instance
                if control_signals:
                    control_signals_with_duplicates.append(control_signals[-1])
                    guidance_states_with_duplicates.append(guidance_state)
            else:  # no guidance state in this instance
                if guidance_states:
                    guidance_states_with_duplicates.append(guidance_states[-1])
                    control_signals_with_duplicates.append(control_signal)

        elif machine_state and control_signal:
            control_signals_with_duplicates.append(control_signal)
            guidance_states_with_duplicates.append(guidance_state)

    return guidance_states, guidance_states_with_duplicates, \
        control_signals, control_signals_with_duplicates
