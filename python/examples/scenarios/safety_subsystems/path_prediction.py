import numpy as np
from math import pi, atan2, tan, sin, cos
import collections as cl
import functools as ft
from scenarios.utils.gis import get_wheel_angle


def get_all_path_polys(veh_state, config, x0, y0, theta0):
    veh_speed = max(veh_state['speed'], 0.447 * 1.0)
    sync_stop_threshold, waypoint_stop_threshold, waypoint_slowdown_threshold \
        = get_sync_waypoint_thresholds(veh_speed, config['safety'])

    wheel_angle = get_wheel_angle(
        veh_state['curvature'],
        config['guidance']['wheel_base']
    )

    sync_stop_poly = get_path_poly(
        veh_speed,
        config['guidance']['wheel_base'],
        wheel_angle,
        config['safety']['path_widths']['narrow'],
        sync_stop_threshold,
        x0,
        y0,
        theta0,
    )
    waypoint_stop_poly = get_path_poly(
        veh_speed,
        config['guidance']['wheel_base'],
        wheel_angle,
        config['safety']['path_widths']['default'],
        waypoint_stop_threshold,
        x0,
        y0,
        theta0,
    )
    waypoint_slow_poly = get_path_poly(
        veh_speed,
        config['guidance']['wheel_base'],
        wheel_angle,
        config['safety']['path_widths']['narrow'],
        waypoint_slowdown_threshold,
        x0,
        y0,
        theta0,
    )

    return (sync_stop_poly, waypoint_stop_poly, waypoint_slow_poly)


def get_path_poly(speed, wheel_base, wheel_angle,
                    path_width, path_distance, x0, y0, theta0):
    time_horizon = path_distance / speed
    n_steps = 10
    U = (speed, wheel_angle)
    X0 = (x0, y0, theta0)
    C = dict(wheel_base=wheel_base, machine_width=path_width)

    _path, left, right = predict_path(
        X0, U, C, horizon=time_horizon, n_steps=int(n_steps))

    z = 1.1
    left = np.column_stack((
        left,
        np.full(left.shape[0], z)
    ))
    right = np.column_stack((
        np.flipud(right),
        np.full(right.shape[0], z)
    ))

    return list(np.concatenate((
        left.flatten(),
        right.flatten(),
    )))


def get_sync_waypoint_thresholds(speed, safety_config):
    sync_stop_threshold = get_threshold(
        speed,
        safety_config['shared_speed_thresholds']['sync_stop_threshold'],
        safety_config['shared_speed_thresholds']['stop_threshold_default'],
    )
    waypoint_stop_threshold = get_threshold(
        speed,
        safety_config['shared_speed_thresholds']['waypoint_stop_threshold'],
        safety_config['shared_speed_thresholds']['stop_threshold_default'],
    )
    waypoint_slowdown_threshold = get_threshold(
        speed,
        safety_config['shared_speed_thresholds']['waypoint_slowdown_threshold'],
        safety_config['shared_speed_thresholds']['slowdown_threshold_default'],
    )

    sync_stop_threshold += safety_config['object_tracking']['cabin_to_nose_distance']
    waypoint_stop_threshold += safety_config['object_tracking']['cabin_to_nose_distance']
    waypoint_slowdown_threshold += safety_config['object_tracking']['cabin_to_nose_distance']

    return (sync_stop_threshold, waypoint_stop_threshold, waypoint_slowdown_threshold)


def get_threshold(speed, threshold_list, threshold):
        speed /= 0.447
        for val in threshold_list:
            if val['min_speed'] <= speed <= val['max_speed']:
                threshold = val['threshold']
                break
        return threshold


def predict_position(X, U, C, dt):
    """Predicts position of vehicle based on CTRV model
    X - state (x, y, yaw)
    U - controls (v, delta)
    C - constants dict
        - wheel_base
        - machine_width # Not used here
    dt - time to predict into future
    """
    L = C['wheel_base']
    v, delta = U
    yawd = -v / L * tan(delta)

    px, py, yaw = X
    if (abs(yawd) > 0.01):
        px_t = px + v / yawd * (sin(yaw + yawd * dt) - sin(yaw))
        py_t = py + v / yawd * (cos(yaw) - cos(yaw + yawd * dt))
    else:
        px_t = px + v * dt * cos(yaw)
        py_t = py + v * dt * sin(yaw)

    yaw_t = yaw + yawd * dt
    yaw_t = atan2(sin(yaw_t), cos(yaw_t))
    return px_t, py_t, yaw_t


def predict_path(X0, U0, C, horizon, n_steps):
    """Predicts path until given horizon
    U0 - Control vector to use (v, steering_angle)
    tspan - sequence
        Time steps at which to predict state - [0.0, 0.1, 0.2 ... ]
    """
    tspan = np.linspace(0, horizon, n_steps+1, endpoint=True)

    path = np.array(list(
        map(ft.partial(predict_position, X0, U0, C), tspan)
    ))

    W_half = C['machine_width'] / 2.
    left = np.column_stack([path[:, 0] + W_half * np.cos(path[:, 2] + pi / 2),
                            path[:, 1] + W_half * np.sin(path[:, 2] + pi / 2)])
    right = np.column_stack([path[:, 0] + W_half * np.cos(path[:, 2] - pi / 2),
                            path[:, 1] + W_half * np.sin(path[:, 2] - pi / 2)])

    return path, left, right
