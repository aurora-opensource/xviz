import numpy as np
from math import pi, atan2, tan, sin, cos
import collections as cl
import functools as ft


def get_path_prediction(config):
    prediction_args = {
        'wheel_base': config['guidance']['wheel_base'],
        'path_width_vision': config['safety']['radar']['path_width'],
        'path_width_predictive': config['navigation']['machine_width']
    }
    min_speed = {}
    min_speed['predictive'] = 0.5  # mph
    min_speed['vision'] = config['guidance']['safety']['predictive_slowdown_speed_mph']
    cabin_to_nose = config['safety']['object_tracking']['cabin_to_nose_distance']
    min_distance = config['safety']['radar']['stop_threshold_default']

    return PathPrediction(prediction_args, min_speed, min_distance, cabin_to_nose)


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


def predict_path(X0, U0, C, horizon=10.0, n_steps=10):
    """Predicts path until given horizon
    U0 - Control vector to use (v, steering_angle)
    tspan - sequence
        Time steps at which to predict state - [0.0, 0.1, 0.2 ... ]
    """
    tspan = np.linspace(0, horizon, n_steps+1, endpoint=True)
    W_half = 0.5 * C['machine_width']

    path = np.array(list(
        map(ft.partial(predict_position, X0, U0, C), tspan)
    ))

    left = np.column_stack([path[:, 0] + W_half * np.cos(path[:, 2] + pi / 2),
                            path[:, 1] + W_half * np.sin(path[:, 2] + pi / 2)])
    right = np.column_stack([path[:, 0] + W_half * np.cos(path[:, 2] - pi / 2),
                             path[:, 1] + W_half * np.sin(path[:, 2] - pi / 2)])

    return path, left, right


class PathPrediction(object):
    def __init__(self, C, min_speed, min_distance_default, cabin_to_nose):
        """
        C - constants dict
            - wheel_base
            - machine_width
        """
        self.X0 = (0, 0, 0)
        self.C = C
        self.steering_history = cl.deque(maxlen=10)
        self.min_speed = min_speed
        self.min_distance_default = min_distance_default # default value, gets updated from threshold_list
        self.min_distance = None
        self.cabin_to_nose = cabin_to_nose

    def get_threshold(self, speed, threshold_list):
        speed /= 0.447
        threshold = self.min_distance_default
        for val in threshold_list:
            if val['min_speed'] <= speed <= val['max_speed']:
                threshold = val['threshold']
                break
        return threshold

    def set_min_distance(self, veh_speed, threshold_list):
        self.min_distance = self.get_threshold(veh_speed, threshold_list) + self.cabin_to_nose

    def predict(self, steering_angle, speed, heading, subsystem):
        """Predict path for given speed and steering angle."""

        if subsystem == "vision":
            self.C['machine_width'] = self.C['path_width_vision']
            speed = max(speed, 0.447 * self.min_speed['vision'])
            horizon = max(self.min_distance / speed, 10.0)
        elif subsystem == "predictive":
            self.C['machine_width'] = self.C['path_width_predictive']
            speed = max(speed, 0.447 * self.min_speed['predictive'])
            accel = -0.5
            stopping_distance = - speed * speed / (2.0 * accel)
            horizon = stopping_distance / speed * 1.1
        elif subsystem == "control":
            if speed != 0:
                speed = max(speed, 0.447 * self.min_speed['vision'])
                horizon = max(self.min_distance / speed, 10.0)
            else:
                horizon = 0

        else:
            print('path prediction recieved unrecognized subsystem argument')
        
        n_steps = 10

        U = (speed, steering_angle)
        self.U = U
        self.X0 = 0, 0, heading * pi / 180

        self.path, self.left, self.right = predict_path(
            self.X0, U, self.C, horizon=horizon, n_steps=int(n_steps))
