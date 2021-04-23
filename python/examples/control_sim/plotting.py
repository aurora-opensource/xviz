import math
import matplotlib.pyplot as plt

from control_sim.utils import get_value_list
from scenarios.utils.gis import get_wheel_angle


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


def plot_path_tracking(guidance_states, waypoints):
    fig, ax = plt.subplots()

    tractor_pos = get_value_list(guidance_states, 'utm_pos')

    ax.plot(*zip(*waypoints), label='planned path')
    ax.plot(*zip(*tractor_pos), label='tractor position')

    ax.set_aspect('equal')
    ax.set_title('Path Tracking')
    ax.set_xlabel('utm easting')
    ax.set_ylabel('utm northing')
    ax.legend()

    plt.show()
    plt.close()


def plot_control(control_signals, simulated_control_signals, global_config):
    fig, ax = plt.subplots(nrows=1, ncols=2)

    wheel_base = global_config['guidance']['wheel_base']

    actual_commanded_speeds = get_value_list(control_signals, 'setSpeed')
    actual_commanded_curvatures = get_value_list(control_signals,
                                                 'commandCurvature')
    actual_commanded_wheel_angles = list(map(
        lambda x: get_wheel_angle(x, wheel_base) * 180 / math.pi,
        actual_commanded_curvatures))

    simulated_commanded_speeds = get_value_list(simulated_control_signals,
                                                'set_speed')
    simulated_commanded_curvatures = get_value_list(simulated_control_signals,
                                                'curvature')
    simulated_commanded_wheel_angles = list(map(
        lambda x: get_wheel_angle(x, wheel_base) * 180 / math.pi,
        simulated_commanded_curvatures))

    ax[0].plot(actual_commanded_speeds, label='actual command')
    ax[0].plot(simulated_commanded_speeds, label='simulated command')
    ax[1].plot(actual_commanded_wheel_angles, label='actual command')
    ax[1].plot(simulated_commanded_wheel_angles, label='simulated command')

    ax[0].set_title('Speed Control')
    ax[0].set_xlabel('discrete timesteps ~0.1s')
    ax[0].set_ylabel('commanded speed (m/s)')
    ax[0].legend()

    ax[1].set_title('Steering Control')
    ax[1].set_xlabel('discrete timesteps ~0.1s')
    ax[1].set_ylabel('commanded wheel angles (degrees)')
    ax[1].legend()

    plt.show()
    plt.close()
