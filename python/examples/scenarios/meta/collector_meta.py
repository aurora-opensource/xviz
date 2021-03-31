import xviz_avs as xviz


def get_builder():
    builder = xviz.XVIZMetadataBuilder()
    builder.stream("/vehicle_pose")\
        .category(xviz.CATEGORY.POSE)

    builder.stream("/radar_filtered_out_targets")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({'fill_color': [255, 255, 0]})\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.CIRCLE)
    builder.stream("/radar_passed_filter_targets")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({'fill_color': [255, 0, 0]})\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.CIRCLE)
    builder.stream("/radar_id")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({'fill_color': [0, 0, 0]})\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.TEXT)
    builder.stream("/smartmicro_radar_targets")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({
            'fill_color': [255, 0, 0],
            'height': 0.6,
            'extruded': True,
        })\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.POLYGON)

    builder.stream("/camera_targets")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({'fill_color': [0, 255, 255]})\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.CIRCLE)

    builder.stream("/tracking_targets")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.CIRCLE)
    builder.stream("/tracking_id")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({'fill_color': [0, 0, 0]})\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.TEXT)

    builder.stream("/combine")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({
            'stroke_width': 0.3,
            'stroke_color': [128, 0, 128],
        })\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.POLYLINE)
    builder.stream("/auger")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({
            'stroke_width': 0.3,
            'stroke_color': [255, 69, 0],
        })\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.POLYLINE)

    builder.stream("/field_definition")\
        .coordinate(xviz.COORDINATE_TYPES.IDENTITY)\
        .stream_style({
            'stroke_color': [40, 150, 40, 128],
            'stroke_width': 0.3,
        })\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.POLYLINE)

    builder.stream("/vision_polygons")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({'stroke_color': [0, 128, 128, 128]})\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.POLYLINE)
    builder.stream("/predictive_polygons")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({'stroke_color': [128, 128, 0, 128]})\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.POLYLINE)

    builder.stream("/planned_path")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({
            'stroke_width': 0.2,
            'stroke_color': [0, 170, 220, 200]
        })\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.POLYLINE)

    builder.stream("/control_signal")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({'stroke_color': [128, 0, 128, 128]})\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.POLYLINE)
    
    builder.stream("/sync_status")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({'fill_color': [0, 0, 0]})\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.TEXT)
    builder.stream("/tractor_speed")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({'fill_color': [0, 0, 0]})\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.TEXT)

    builder.stream("/combine_speed")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({'fill_color': [0, 0, 0]})\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.TEXT)
    builder.stream("/set_speed")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({'fill_color': [0, 0, 0]})\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.TEXT)
    builder.stream("/sync_point")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({'fill_color': [0, 128, 30]})\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.CIRCLE)
    builder.stream("/breadcrumbs")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({
            'stroke_width': 0.2,
            'stroke_color': [255, 50, 20, 200]
        })\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.POLYLINE)

    builder.stream("/radar_fov")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({'stroke_color': [255, 0, 0, 100]})\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.POLYLINE)
    builder.stream("/camera_fov")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({'stroke_color': [0, 150, 200, 100]})\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.POLYLINE)

    builder.stream("/measuring_circles")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({
            'stroked': True,
            'filled': False,
            'stroke_width': 0.2,
            'stroke_color': [0, 0, 0, 20],
        })\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.CIRCLE)

    builder.stream("/measuring_circles_lbl")\
        .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
        .stream_style({
            'fill_color': [0, 0, 0]
        })\
        .category(xviz.CATEGORY.PRIMITIVE)\
        .type(xviz.PRIMITIVE_TYPES.TEXT)

    return builder
