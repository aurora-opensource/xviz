import numpy as np

from scenarios.utils.gis import lonlat_to_utm
from scenarios.utils.read_protobufs import deserialize_collector_output, \
    extract_collector_output_slim


def detect_sync_task(collector_instances):
    for collector_instance in collector_instances:
        collector_output, is_slim_output = deserialize_collector_output(
            collector_instance)
        if is_slim_output:
            _, _, _, _, _, _, sync_status, _, _ \
                = extract_collector_output_slim(collector_output,
                                                get_camera_data=False)
        else:
            print('collector file is not campatible for running guidance sim')
        if sync_status is not None and sync_status['runningSync']:
            print('running SyncPIDTask simulation')
            return True
    print('running CTEGuidanceTask simulation')
    return False


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


def get_current_data(data_tuples, current_idx):
    data_idx, data_value = data_tuples[0]
    for i in range(len(data_tuples)-1):
        data_idx, data_value = data_tuples[i]
        next_data_idx = data_tuples[i+1][0]
        if next_data_idx > current_idx:
            break
    return data_idx, data_value


def get_next_waypoint_index(current_pos, waypoints):
    current_pos = np.array(current_pos)
    waypoints = np.array(waypoints)
    distances = np.linalg.norm(waypoints - current_pos, ord=2, axis=1)
    closest_wp_idx = max(distances.argmin(), 1)
    return closest_wp_idx \
        if closest_wp_idx == len(distances) - 1 \
        or distances[closest_wp_idx-1] < distances[closest_wp_idx+1] \
        else closest_wp_idx + 1


def set_next_waypoint(current_pos, waypoints, task):
    next_wp_idx = get_next_waypoint_index(current_pos, waypoints)
    print('starting waypoint index:', next_wp_idx)
    task.next_wp = task._waypoints[0]
    task._wpctr = next(task._wpctr_iter)
    for _ in range(next_wp_idx):
        task.update_waypoint()
    task.initialized = True


def get_data_instances(collector_instances):
    guidance_states = []
    control_signals = []
    field_definitions = []
    sync_statuses = []
    sync_parameters = []

    for i, collector_instance in enumerate(collector_instances):

        collector_output, is_slim_output = deserialize_collector_output(
            collector_instance)

        if is_slim_output:
            _, _, _, machine_state, field_definition, _, sync_status, \
                control_signal, sync_params \
                = extract_collector_output_slim(
                    collector_output, get_camera_data=False,
                    preserving_proto_field_name=True)
        else:
            print('collector file is not campatible for running guidance sim')
            return

        if machine_state is not None:
            utm_zone = machine_state['op_state']['ref_utm_zone']
            vehicle_states = machine_state['vehicle_states']
            tractor_state = None
            combine_states = {}
            guidance_state = {'zone': utm_zone}

            for vehicle, state in vehicle_states.items():
                if vehicle == 'tractor':
                    tractor_state = state
                else:
                    state['lat'] = state.pop('latitude')
                    state['lon'] = state.pop('longitude')
                    combine_states[vehicle + '_state'] = state

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

            guidance_states.append((i, guidance_state))

        if control_signal is not None:
            control_signals.append((i, control_signal))

        if field_definition is not None:
            field_definitions.append((i, field_definition))

        if sync_status is not None:
            sync_statuses.append((i, sync_status))

        if sync_params is not None:
            sync_parameters.append((i, sync_params))

    return guidance_states, control_signals, field_definitions, \
        sync_statuses, sync_parameters, utm_zone
