import matplotlib.pyplot as plt
from pathlib import Path
from scenarios.utils.filesystem import load_config


def get_speed_and_distance_arrays(threshold_config):
    speed = []
    threshold = []
    for pair in threshold_config:
        speed.append(pair['speed'])
        threshold.append(pair['threshold'])

    return speed, threshold


def main():
    configfile = Path(__file__).resolve().parents[2] / \
            'Global-Configs' / 'Tractors' / 'John-Deere' / '8RIVT_WHEEL.yaml'
    global_config = load_config(str(configfile))

    fig, ax = plt.subplots(figsize=(15, 10))
    fig.set_tight_layout(True)
    ax.set_title('threshold config')
    ax.set_xlabel('speed (m/s)')
    ax.set_ylabel('distance (m)')

    shared_speed_thresholds = global_config['safety']['shared_speed_thresholds']

    for key, value in shared_speed_thresholds.items():
        speed, distance = get_speed_and_distance_arrays(value)
        ax.plot(speed, distance, label=key)

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

