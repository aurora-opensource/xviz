from pathlib import Path
import matplotlib.pyplot as plt
from scenarios.utils.filesystem import load_config


def get_speed_and_distance_arrays(threshold_config):
    speed = []
    threshold = []
    for pair in threshold_config:
        speed.append(pair['speed'])
        threshold.append(pair['threshold'])

    return speed, threshold


def get_distance_with_accel(start_speed, end_speed, accel):
    """
    Vf^2 = Vi^2 + 2*a*d
    """
    return (end_speed**2 - start_speed**2) / (2 * accel)


def main():
    configfile = Path(__file__).resolve().parents[2] / \
            'Global-Configs' / 'Tractors' / 'John-Deere' / '8RIVT_WHEEL.yaml'
    global_config = load_config(str(configfile))

    fig, ax = plt.subplots(figsize=(15, 10))
    fig.set_tight_layout(True)
    ax.set_title('threshold config')
    ax.set_xlabel('speed (mph)')
    ax.set_ylabel('distance (m)')
    ax.set_xlim([0, 20])
    ax.set_ylim([0, 60])

    shared_speed_thresholds = global_config['safety']['shared_speed_thresholds']

    for key, value in shared_speed_thresholds.items():
        speed, distance = get_speed_and_distance_arrays(value)
        ax.plot(speed, distance, label=key)

    # stop_df = get_distance_with_accel(4 * .447, 20 * .447, 1) + 10
    # print(stop_df)
    # ax.plot((4, 20), (10, stop_df))
    # slowdown_df = get_distance_with_accel(4 * .447, 20 * .447, 1) + 15
    # print(slowdown_df)
    # ax.plot((4, 20), (15, slowdown_df))

    ax.legend()
    plt.show()


if __name__ == '__main__':
    plt.rcParams['figure.facecolor'] = 'black'
    plt.rcParams['figure.edgecolor'] = 'white'
    plt.rcParams['axes.facecolor'] = 'black'
    plt.rcParams['axes.edgecolor'] = 'white'
    plt.rcParams['axes.labelcolor'] = 'white'
    plt.rcParams['axes.titlecolor'] = 'white'
    plt.rcParams['xtick.color'] = 'white'
    plt.rcParams['ytick.color'] = 'white'
    plt.rcParams['legend.facecolor'] = 'white'
    
    main()

