import sys
import time
from pathlib import Path

from control_sim.utils import set_next_waypoint

sys.path.append(str(Path(__file__).resolve().parents[3] / 'SmartHP-v2'))
from smarthp.gnc.guidance import Guidance, CTEGuidanceTask, SyncPIDTask


def simulate_cte_guidance_task(guidance_states, waypoints, global_config):
    guidance = Guidance()
    route_task = CTEGuidanceTask(
        waypoints,
        config=global_config,
        stop_on_target=True)
    guidance.add_task(route_task)
    guidance.start_pending()
    guidance.set_config(global_config)
    set_next_waypoint(guidance_states[0]['utm_pos'], waypoints, guidance)

    control_commands = []

    delay = 1. / global_config['guidance_loop_rate']
    for gs in guidance_states:
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

    return control_commands


def simulate_sync_pid_task(guidance_states, waypoints,
                           global_config, field_definitions,
                           sync_parameters, sync_statuses, utm_zone):
    guidance = Guidance()
    guidance.update_sync_runtime_config(sync_dy=0, sync_dx=0)

    sync_task = guidance.SyncPIDTask(
        'combine', sync_parameters[0]['sync_point'],
        waypoints, utm_zone, None, global_config)
    guidance.add_task(sync_task)

    # if self.sync_params['breadcrumbs']:
    #     breadcrumbs_xy = lonlat_array_to_local(
    #         self.tractor_state,
    #         self.utm_zone,
    #         np.array(self.sync_params['breadcrumbs'])
    #     )
