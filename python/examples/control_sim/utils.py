import numpy as np

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
