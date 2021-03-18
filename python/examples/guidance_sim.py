import sys
import math
from pathlib import Path
from scenarios.utils.filesystem import get_collector_instances, load_config
from scenarios.utils.read_protobufs import deserialize_collector_output, \
    extract_collector_output, extract_collector_output_slim
from scenarios.utils.gis import lonlat_to_utm, get_wheel_angle

sys.path.append('../../SmartHP-v2')
from smarthp.gnc.guidance import Guidance, CTEGuidanceTask



def main():
    configfile = Path(__file__).parent \
        / 'scenarios' / 'collector-scenario-config.yaml'
    collector_config = load_config(str(configfile))

    collector_output_file = collector_config['collector_output_file']
    extract_directory = collector_config['extract_directory']
    collector_instances = get_collector_instances(collector_output_file,
                                                  extract_directory)

    utm_zone = None
    tractor_state = None
    combine_states = dict()
    planned_path = None

    for collector_instance in collector_instances:

        collector_output, is_slim_output = deserialize_collector_output(
            collector_instance)

        if is_slim_output:
            img, camera_output, radar_output, tracking_output, \
                machine_state, field_definition, planned_path, \
                sync_status, control_signal, sync_params \
                = extract_collector_output_slim(collector_output)
        else:
            img, camera_output, radar_output, tracking_output, \
                machine_state = extract_collector_output(collector_output)
            field_definition = None
            planned_path = None
            sync_status = None
            control_signal = None
            sync_params = None

        if machine_state is not None:
            utm_zone = machine_state['opState']['refUtmZone']
            vehicle_states = machine_state['vehicleStates']
            for vehicle, state in vehicle_states.items():
                if vehicle == 'tractor':
                    tractor_state = state
                else:
                    combine_states[vehicle] = state
        
        if tractor_state:
            tractor_theta = (90 - tractor_state['heading']) * math.pi / 180
            tractor_easting, tractor_northing = lonlat_to_utm(
                tractor_state['longitude'],
                tractor_state['latitude'],
                utm_zone,
            )
            guidance_state = dict(
                utm_pos=(tractor_easting, tractor_northing),
                heading=tractor_state['heading'],
                veh_speed=tractor_state['speed'],
            )

        if planned_path is not None:
            if planned_path.size > 0:
                planned_path = planned_path.reshape(-1, 2)
            else:
                planned_path = None

        if field_definition is not None:
            field_definition = field_definition

        if control_signal is not None:
            control_signal = control_signal

        if sync_status is not None:
            sync_status = sync_status
        
        if sync_params is not None:
            if sync_params:
                sync_params = sync_params
            else:
                sync_params = None

    # path = _____
    # config = _____
    # guidance = Guidance()
    # route_task = guidance.CTEGuidanceTask(
    #     path,
    #     config=config,
    #     stop_on_target=True)
    # guidance.add_task(route_task)


if __name__ == '__main__':
    main()
