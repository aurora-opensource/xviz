import sys
import time
from pathlib import Path

import shapely.geometry as shgeo

from control_sim.utils import set_next_waypoint, get_current_data

sys.path.append(str(Path(__file__).resolve().parents[3] / 'SmartHP-v2'))
from smarthp.gnc.guidance import Guidance, CTEGuidanceTask, SyncPIDTask
from smarthp.gnc.navigation import Field


def simulate_cte_guidance_task(guidance_states, waypoints, global_config):
    guidance = Guidance()
    route_task = CTEGuidanceTask(
        waypoints,
        config=global_config,
        stop_on_target=True)
    guidance.add_task(route_task)
    guidance.start_pending()
    guidance.set_config(global_config)
    set_next_waypoint(guidance_states[0][1]['utm_pos'], waypoints, guidance.task)

    control_commands = []

    delay = 1. / global_config['guidance_loop_rate']
    for i, (idx, gs) in enumerate(guidance_states):
        t = time.time()

        control_command = guidance.run(gs)
        if control_command is None:
            control_command = {
                'set_speed': 0.0,
                'curvature': 0.0,
            }
        control_commands.append(control_command)

        dt = time.time() - t
        if dt >= delay:
            print('guidance simulation loop took too long: ', dt)
        else:
            time.sleep(delay - dt)

        if i % 10 == 0 or i == len(guidance_states) - 1:
            print(f'{i} / {len(guidance_states)}')

    return control_commands


def simulate_sync_pid_task(guidance_states, waypoints,
                           global_config, field_definitions,
                           sync_parameters, sync_statuses, utm_zone):
    guidance = Guidance()

    sync_task = SyncPIDTask(
        'combine', sync_parameters[0][1]['sync_point'],
        waypoints, utm_zone, None, global_config)
    guidance.add_task(sync_task)
    guidance.start_pending()
    guidance.set_config(global_config)
    guidance.update_sync_runtime_config(sync_dy=0, sync_dx=0)
    set_next_waypoint(guidance_states[0][1]['utm_pos'], waypoints,
                      guidance.task.tree.intercept_mode_tree.intercept_task)

    # if self.sync_params['breadcrumbs']:
    #     breadcrumbs_xy = lonlat_array_to_local(
    #         self.tractor_state,
    #         self.utm_zone,
    #         np.array(self.sync_params['breadcrumbs'])
    #     )

    control_commands = []

    delay = 1. / global_config['guidance_loop_rate']
    for i, (gs_instance_idx, gs) in enumerate(guidance_states):
        t = time.time()

        field_def_idx, field_def = get_current_data(field_definitions, gs_instance_idx)

        field_def = shgeo.shape(field_def)
        boundary = field_def.exterior
        obstacles = field_def.interiors
        buffer_size = global_config['navigation']['obstacle_buffer']

        gs['planning_map'] = Field(boundary, obstacles, buffer_size, utm_zone)

        control_command = guidance.run(gs)
        if control_command is None:
            control_command = {
                'set_speed': 0.0,
                'curvature': 0.0,
            }
        control_commands.append(control_command)

        dt = time.time() - t
        if dt >= delay:
            print('guidance simulation loop took too long: ', dt)
        else:
            time.sleep(delay - dt)

        if i % 50 == 0 or i == len(guidance_states) - 1:
            print(f'{i} / {len(guidance_states)} simulated control loops')

    return control_commands

