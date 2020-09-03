import utm
import math


def transform_combine_to_local(combine_state, tractor_state, utm_zone):
    combine_x, combine_y = latlon_to_utm(combine_state['latitude'], combine_state['longitude'], utm_zone)
    tractor_x, tractor_y = latlon_to_utm(tractor_state['latitude'], tractor_state['longitude'], utm_zone)
    dx, dy = utm_to_local(combine_x, combine_y, tractor_x, tractor_y, tractor_state['heading'])

    return dx, dy


def latlon_to_utm(lat, lon, zone):
    zone_number, zone_letter = parse_utm_zone(zone)
    converted = utm.from_latlon(
        lat, lon,
        force_zone_number=zone_number,
        force_zone_letter=zone_letter
    )

    return converted[0], converted[1]  # only return easting, northing


def parse_utm_zone(zone):
    if not zone:
        return None, None
    index = 0
    zone_num = ''
    while zone[index].isdigit():
        zone_num += zone[index]
        index += 1

    return int(zone_num), zone[index]


def utm_to_local(translate_x, translate_y, reference_x, reference_y, heading):
    theta = (math.pi / 2) - (heading * math.pi / 180)
    dx_a = translate_x - reference_x
    dy_a = translate_y - reference_y
    dx = (math.cos(theta) * dx_a) + (math.sin(theta) * dy_a)
    dy = -(math.sin(theta) * dx_a) + (math.cos(theta) * dy_a)

    return dx, dy
