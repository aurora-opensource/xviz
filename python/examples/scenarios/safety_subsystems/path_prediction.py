import numpy as np
from math import pi, atan2, tan, sin, cos
import collections as cl
import functools as ft
from scenarios.utils.gis import get_wheel_angle


N_STEPS = 10


def get_path_distances(speed, safety_config):
    sync_stop_threshold = get_threshold(
        speed,
        safety_config['shared_speed_thresholds']['sync_stop_threshold'],
    )
    waypoint_stop_threshold = get_threshold(
        speed,
        safety_config['shared_speed_thresholds']['waypoint_stop_threshold'],
    )
    sync_slowdown_threshold = get_threshold(
        speed,
        safety_config['shared_speed_thresholds']['sync_slowdown_threshold'],
    )
    waypoint_slowdown_threshold = get_threshold(
        speed,
        safety_config['shared_speed_thresholds']['waypoint_slowdown_threshold'],
    )

    sync_stop_threshold += safety_config['object_tracking']['cabin_to_nose_distance']
    waypoint_stop_threshold += safety_config['object_tracking']['cabin_to_nose_distance']
    sync_slowdown_threshold += safety_config['object_tracking']['cabin_to_nose_distance']
    waypoint_slowdown_threshold += safety_config['object_tracking']['cabin_to_nose_distance']

    return (sync_stop_threshold, waypoint_stop_threshold,
            sync_slowdown_threshold, waypoint_slowdown_threshold)


def linear_interpolation(x, x0, y0, x1, y1):
    if x0 == x1:
        print('linear interpolation called with invalid arguments')
        return y1
    m = (y1 - y0) / (x1 - x0)
    return y0 + m * (x - x0)


def get_threshold(speed_ms, threshold_list):
    speed_mph = speed_ms / 0.447
    for i in range(len(threshold_list)-1):
        if threshold_list[i]['speed'] <= speed_mph < threshold_list[i+1]['speed']:
            lower_speed = threshold_list[i]['speed']
            lower_threshold = threshold_list[i]['threshold']
            upper_speed = threshold_list[i+1]['speed']
            upper_threshold = threshold_list[i+1]['threshold']
            return linear_interpolation(
                speed_mph,
                lower_speed,
                lower_threshold,
                upper_speed,
                upper_threshold,
            )
    print('get_threshold failed to find interpolated value, returning 100')
    return 100.


def get_path_poly(speed, wheel_base, wheel_angle,
                    path_width, path_distance, x0, y0, theta0):
    time_horizon = path_distance / speed
    U = (speed, wheel_angle)
    X0 = (x0, y0, theta0)
    C = dict(wheel_base=wheel_base, machine_width=path_width)

    _path, left, right = predict_path(X0, U, C, time_horizon)

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


def predict_path(X0, U0, C, horizon):
    """Predicts path until given horizon
    U0 - Control vector to use (v, steering_angle)
    tspan - sequence
        Time steps at which to predict state - [0.0, 0.1, 0.2 ... ]
    """
    tspan = np.linspace(0, horizon, N_STEPS+1, endpoint=True)

    path = np.array(list(
        map(ft.partial(predict_position, X0, U0, C), tspan)
    ))

    W_half = C['machine_width'] / 2.
    left = np.column_stack([path[:, 0] + W_half * np.cos(path[:, 2] + pi / 2),
                            path[:, 1] + W_half * np.sin(path[:, 2] + pi / 2)])
    right = np.column_stack([path[:, 0] + W_half * np.cos(path[:, 2] - pi / 2),
                            path[:, 1] + W_half * np.sin(path[:, 2] - pi / 2)])

    return path, left, right
