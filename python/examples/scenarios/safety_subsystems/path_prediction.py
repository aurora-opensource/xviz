import numpy as np
from math import pi, atan2, tan, sin, cos
import collections as cl
import functools as ft


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

    # Don't care for path beyond phi= +/- pi/2
    path = np.array(list(filter(lambda row: -pi / 2 < atan2(row[1], row[0]) < pi / 2,
                                map(ft.partial(predict_position, X0, U0, C), tspan))))

    left = np.column_stack([path[:, 0] + W_half * np.cos(path[:, 2] + pi / 2),
                            path[:, 1] + W_half * np.sin(path[:, 2] + pi / 2)])
    right = np.column_stack([path[:, 0] + W_half * np.cos(path[:, 2] - pi / 2),
                             path[:, 1] + W_half * np.sin(path[:, 2] - pi / 2)])

    return path, left, right


class PathPrediction(object):
    def __init__(self, C, min_speed):
        """
        C - constants dict
            - wheel_base
            - machine_width
        """
        self.X0 = (0, 0, 0)
        self.C = C
        self.steering_history = cl.deque(maxlen=10)
        self.min_speed = min_speed

    def to_polar(self, path):
        r = np.sqrt(path[:, 0]**2 + path[:, 1]**2)
        theta = np.arctan2(path[:, 1], path[:, 0])
        return r, theta

    def get_closest_phi(self, path, r):
        # Find row of vector with 'r' value closest to target
        closest_row = np.argmin(np.abs(path[:, 0] - r))
        closest_phi = path[closest_row, 1]
        return closest_phi

    def get_phi_bounds(self, r):
        left_phi = self.get_closest_phi(self.left_p, r)
        right_phi = self.get_closest_phi(self.right_p, r)
        return left_phi, right_phi

    def predict(self, steering_angle, speed):
        """Predict path for given speed and steering angle."""
        speed = max(speed, 0.447 * self.min_speed)
        horizon = 10
        n_steps = 10

        U = (speed, steering_angle)
        self.U = U

        self.path, self.left, self.right = predict_path(
            self.X0, U, self.C, horizon=horizon, n_steps=int(n_steps))
        self.left_p = np.column_stack(self.to_polar(self.left))
        self.right_p = np.column_stack(self.to_polar(self.right))
        self.path_p = np.column_stack(self.to_polar(self.path))

    def is_unsafe(self, r, phi):
        """Checks if the given target in polar coordinates is inside the predicted path"""
        l_phi, r_phi = self.get_phi_bounds(r)
        if abs(self.U[0]) < 0.01:
            return True
        return l_phi <= atan2(sin(phi), cos(phi)) <= r_phi
