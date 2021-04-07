import matplotlib.pyplot as plt
import numpy as np


def plot_line_point_combo(ax, x, y, color_idx, point_idx):
    ax.plot(x, y, c='C'+str(color_idx))
    ax.plot(x, y, '.', markevery=point_idx, c='C'+str(color_idx))


def prepare_metadata_plot():
    fig, ax = plt.subplots(nrows=3, ncols=2, figsize=(16, 10), sharex=True)
    fig.set_tight_layout(True)
    ax[0, 0].set_title('phi')
    ax[0, 1].set_title('dr')
    ax[1, 0].set_title('phiSdv')
    ax[1, 1].set_title('step')
    ax[2, 0].set_title('pexist')
    ax[2, 1].set_title('dBpower')
    ax[1, 1].set_ylim(0, 4)

    return ax


def prepare_tracking_plot(signal_type):
    fig, ax = plt.subplots(figsize=(14, 10))
    fig.set_tight_layout(True)
    ax.set_title(f'tracking from target ids: {signal_type}')
    # ax.set_xlim(-20, 20)
    # ax.set_ylim(0, 35)

    return ax


def plot_metadata(targets, detected_target_ids, signal_type, radar_filter,
                  selected_timespan, tgt_id_tspans):
    ax = prepare_metadata_plot()

    cc_idx = 0
    for tgt_id, target in targets.items():
        if tgt_id not in detected_target_ids:
            continue

        t = np.array(target['timestamp']) - target['timestamp'][0]

        tspan = tgt_id_tspans[tgt_id] if tgt_id_tspans \
            else [selected_timespan] if selected_timespan is not None \
            else [(0, t[-1])]

        timespan_idx = []
        for ts in tspan:
            over_start_time = t > ts[0]
            before_end_time = t < ts[1]
            timespan_idx.extend(np.nonzero(over_start_time & before_end_time)[0])

        t = t[timespan_idx]

        target[signal_type]['phi'] = np.array(target[signal_type]['phi'])[timespan_idx]
        target[signal_type]['dr'] = np.array(target[signal_type]['dr'])[timespan_idx]
        target[signal_type]['phiSdv'] = np.array(target[signal_type]['phiSdv'])[timespan_idx]
        target[signal_type]['step'] = np.array(target[signal_type]['step'])[timespan_idx]
        target[signal_type]['pexist'] = np.array(target[signal_type]['pexist'])[timespan_idx]
        target[signal_type]['dBpower'] = np.array(target[signal_type]['dBpower'])[timespan_idx]

        point_idx = get_lone_elements_indices(target[signal_type]['phi'])
        step_point_idx = get_lone_elements_indices(target[signal_type]['step'])

        plot_line_point_combo(ax[0, 0], t, target[signal_type]['phi'], cc_idx, point_idx)
        plot_line_point_combo(ax[0, 1], t, target[signal_type]['dr'], cc_idx, point_idx)
        plot_line_point_combo(ax[1, 0], t, target[signal_type]['phiSdv'], cc_idx, point_idx)
        plot_line_point_combo(ax[1, 1], t, target[signal_type]['step'], cc_idx, step_point_idx)
        plot_line_point_combo(ax[2, 0], t, target[signal_type]['pexist'], cc_idx, point_idx)
        plot_line_point_combo(ax[2, 1], t, target[signal_type]['dBpower'], cc_idx, point_idx)

        cc_idx += 1

        ax[1, 0].axhline(radar_filter.config['phi_sdv_threshold'], color='r', linestyle='--', label='phi sdv max')
        ax[1, 1].axhline(radar_filter.config['step_max'], color='r', linestyle='--', label='step max')
        ax[2, 0].axhline(radar_filter.config['confidence_threshold'], color='r', linestyle='--', label='pexist min')
        ax[2, 1].axhline(radar_filter.config['d_bpower_threshold'], color='r', linestyle='--', label='dBpower min')

    plt.show()
    plt.close()


def plot_tracking(targets, detected_target_ids, signal_type,
                  selected_timespan, tgt_id_tspans):
    ax = prepare_tracking_plot(signal_type)

    cc_idx = 0
    for tgt_id, target in targets.items():
        if tgt_id not in detected_target_ids:
            continue

        t = np.array(target['timestamp']) - target['timestamp'][0]

        tspan = tgt_id_tspans[tgt_id] if tgt_id_tspans \
            else [selected_timespan] if selected_timespan is not None \
            else [(0, t[-1])]

        timespan_idx = []
        for ts in tspan:
            over_start_time = t > ts[0]
            before_end_time = t < ts[1]
            timespan_idx.extend(np.nonzero(over_start_time & before_end_time)[0])

        t = t[timespan_idx]

        target[signal_type]['y'] = np.array(target[signal_type]['y'])[timespan_idx]
        target[signal_type]['x'] = np.array(target[signal_type]['x'])[timespan_idx]

        point_idx = get_lone_elements_indices(target[signal_type]['y'])
        plot_line_point_combo(ax, np.negative(target[signal_type]['y']), target[signal_type]['x'], cc_idx, point_idx)

        cc_idx += 1

    plt.gca().set_aspect('equal', adjustable='box')
    plt.show()
    plt.close()


def plot_3d(targets, detected_target_ids, signal_type):
    fig = plt.figure()
    ax = fig.add_subplot(projection='3d')

    for tgt_id, target in targets.items():
        if tgt_id not in detected_target_ids:
            continue

        target[signal_type]['phi'] = np.array(target[signal_type]['phi'])
        target[signal_type]['dr'] = np.array(target[signal_type]['dr'])
        target[signal_type]['dBpower'] = np.array(target[signal_type]['dBpower'])

        x = target[signal_type]['dr'] * np.cos(target[signal_type]['phi'])
        y = target[signal_type]['dr'] * np.sin(target[signal_type]['phi'])

        ax.scatter(x, y, target[signal_type]['dBpower'])

    ax.view_init(30, 45)
    ax.set_xlabel('x (m)')
    ax.set_ylabel('y (m)')
    ax.set_zlabel('dBpower')

    plt.show()
    plt.close()


def get_filtered_indices(signal, bounds):
    if bounds is None:
        return list(range(len(signal)))
    return list(map(lambda x: x[0],
                    filter(lambda x: bounds[0] < x[1] < bounds[1],
                           enumerate(signal))))


def plot_3d_smartmicro(targets, x_key, y_key, z_key, c_key=None, x_bounds=None,
                       y_bounds=None, z_bounds=None, c_bounds=None):

    fig = plt.figure()
    ax = fig.add_subplot(projection='3d')

    x_idx = set(get_filtered_indices(targets[x_key], x_bounds))
    y_idx = set(get_filtered_indices(targets[y_key], y_bounds))
    z_idx = set(get_filtered_indices(targets[z_key], z_bounds))

    if c_key is None:
        idx = list(x_idx & y_idx & z_idx)
        c = None
    else:
        c_idx = set(get_filtered_indices(targets[c_key], c_bounds))
        idx = list(x_idx & y_idx & z_idx & c_idx)
        c = list(map(targets[c_key].__getitem__, idx))

    x = list(map(targets[x_key].__getitem__, idx))
    y = list(map(targets[y_key].__getitem__, idx))
    z = list(map(targets[z_key].__getitem__, idx))

    if c is None:
        c = z

    cm = plt.cm.get_cmap('RdYlBu')
    im = ax.scatter(x, y, z, c=c, cmap=cm)

    fig.colorbar(im, ax=ax)

    ax.view_init(45, 45)
    ax.set_xlabel(x_key)
    ax.set_ylabel(y_key)
    ax.set_zlabel(z_key)

    plt.show()
    plt.close()


def get_lone_elements_indices(sig):
    idx = []
    for i, el in enumerate(sig):
        if i == 0:
            if not np.isnan(el) and np.isnan(sig[i+1]):
                idx.append(i)
        elif i == len(sig)-1:
            if not np.isnan(el) and np.isnan(sig[i-1]):
                idx.append(i)
        else:
            if not np.isnan(el) and np.isnan(sig[i-1]) and np.isnan(sig[i+1]):
                idx.append(i)
    return idx
