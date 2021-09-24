declare module "@xviz/types" {
namespace xviz {
namespace v2 {
/**
 * XVIZ Visual Annotation
 */
export type AnnotationVisual = (
  | {
      [k: string]: unknown;
    }
  | {
      [k: string]: unknown;
    }
) & {
  base?: AnnotationBase;
  style_classes?: string[];
  inline_style?: ObjectValue;
};
/**
 * Internal XVIZ annotation list
 */
export type _AnnotationList = AnnotationVisual[];

export interface AnnotationBase {
  object_id: string;
  [k: string]: unknown;
}

/**
 * XVIZ Annotation State
 */
export interface AnnotationState {
  visuals?: AnnotationVisual[];
}

/**
 * XVIZ Visual Annotation
 */
export type AnnotationVisual = {
  [k: string]: unknown;
} & {
  base?: AnnotationBase;
  style_classes?: string[];
  inline_style?: ObjectValue;
};

/**
 * XVIZ Future Instances
 */
export interface FutureInstances {
  timestamps: number[];
  primitives: PrimitiveState[];
}

/**
 * XVIZ Link State
 */
export interface LinkState {
  target_pose: string;
  [k: string]: unknown;
}

export interface Pose {
  timestamp?: number;
  map_origin?: {
    longitude: number;
    latitude: number;
    altitude: number;
  };
  position: number[];
  orientation: number[];
  [k: string]: unknown;
}

export interface PrimitiveBase {
  type?: string;
  object_id?: string;
  style?: ObjectValue;
  classes?: string[];
  [k: string]: unknown;
}

/**
 * XVIZ Primitive State
 */
export interface PrimitiveState {
  circles?: PrimitivesCircle[];
  images?: PrimitivesImage[];
  points?: PrimitivesPoint[];
  polygons?: PrimitivesPolygon[];
  polylines?: PrimitivesPolyline[];
  stadiums?: PrimitivesStadium[];
  texts?: PrimitivesText[];
}

/**
 * XVIZ Stream set
 */
export type StreamSet = {
  [k: string]: unknown;
} & {
  timestamp: number;
  poses?: {
    "/vehicle_pose": Pose;
    [k: string]: Pose;
  };
  primitives?: {
    [k: string]: PrimitiveState;
  };
  ui_primitives?: {
    [k: string]: UiPrimitiveState;
  };
  time_series?: TimeseriesState[];
  future_instances?: {
    [k: string]: FutureInstances;
  };
  variables?: {
    [k: string]: VariableState;
  };
  annotations?: {
    [k: string]: AnnotationState;
  };
  no_data_streams?: string[];
  links?: {
    [k: string]: LinkState;
  };
};

/**
 * XVIZ Timeseries State
 */
export interface TimeseriesState {
  timestamp: number;
  streams: string[];
  values: Values;
  object_id?: string;
}

/**
 * XVIZ UI Primitive State
 */
export interface UiPrimitiveState {
  treetable?: UiPrimitivesTreetable;
}

/**
 * XVIZ Value
 */
export type Value = number | string | boolean;

/**
 * XVIZ Values
 */
export type Values = {
  [k: string]: unknown;
} & {
  doubles?: number[];
  int32s?: number[];
  bools?: boolean[];
  strings?: string[];
};

/**
 * XVIZ Variable State
 */
export interface Variable {
  base?: {
    object_id?: string;
  };
  values: Values;
}

/**
 * XVIZ Variable State
 */
export interface VariableState {
  variables: Variable[];
}

export interface DeclarativeUiComponentBase {
  type?: string;
  title?: string;
  description?: string;
  [k: string]: unknown;
}

export interface DeclarativeUiComponentsOnchange {
  target: string;
}

export type DeclarativeUiComponentsTabular = DeclarativeUiComponentBase & {
  stream: string;
  displayObjectId?: boolean;
  [k: string]: unknown;
};

export type DeclarativeUiComponentsMetric = DeclarativeUiComponentBase & {
  type: "METRIC";
  title: unknown;
  description?: unknown;
  streams: string[];
};

export type DeclarativeUiComponentsPlot = DeclarativeUiComponentBase & {
  [k: string]: unknown;
} & {
  type?: "PLOT";
  title?: unknown;
  description?: unknown;
  independentVariable?: string;
  dependentVariables?: string[];
  regions?: {
    x: string;
    yMin: string;
    yMax: string;
  }[];
};

export type DeclarativeUiComponentsSelect = DeclarativeUiComponentBase & {
  type: "SELECT";
  title: unknown;
  description?: unknown;
  stream: string;
  onchange: DeclarativeUiComponentsOnchange;
};

export type DeclarativeUiComponentsTable = DeclarativeUiComponentsTabular & {
  type?: "TABLE";
  title?: unknown;
  description?: unknown;
  stream?: unknown;
  displayObjectId?: unknown;
};
export type DeclarativeUiComponentsTabular = DeclarativeUiComponentBase & {
  stream: string;
  displayObjectId?: boolean;
  [k: string]: unknown;
};

export type DeclarativeUiComponentsTreetable = DeclarativeUiComponentsTabular & {
  type?: "TREETABLE";
  title?: unknown;
  description?: unknown;
  stream?: unknown;
  displayObjectId?: unknown;
};
export type DeclarativeUiComponentsTabular = DeclarativeUiComponentBase & {
  stream: string;
  displayObjectId?: boolean;
  [k: string]: unknown;
};

export type DeclarativeUiComponentsVideo = DeclarativeUiComponentBase & {
  type: "VIDEO";
  title?: unknown;
  description?: unknown;
  cameras: string[];
};

/**
 * Declarative UI Panel Info
 */
export type DeclarativeUiPanel = WithChildren & {
  type?: "PANEL";
  name?: unknown;
  layout?: unknown;
  interactions?: unknown;
  children?: unknown;
};

/**
 * XVIZ data envelope
 */
export type Envelope = (
  | {
      type?: string;
      data?: {
        [k: string]: unknown;
      };
      [k: string]: unknown;
    }
  | {
      type?: "xviz/start";
      data?: Start;
      [k: string]: unknown;
    }
  | {
      type?: "xviz/metadata";
      data?: Metadata;
      [k: string]: unknown;
    }
  | {
      type?: "xviz/transform_log";
      data?: TransformLog;
      [k: string]: unknown;
    }
  | {
      type?: "xviz/state_update";
      data?: StateUpdate;
      [k: string]: unknown;
    }
  | {
      type?: "xviz/transform_log_done";
      data?: TransformLogDone;
      [k: string]: unknown;
    }
  | {
      type?: "xviz/reconfigure";
      data?: Reconfigure;
      [k: string]: unknown;
    }
  | {
      type?: "xviz/error";
      data?: Error;
      [k: string]: unknown;
    }
  | {
      type?: "xviz/transform_point_in_time";
      data?: TransformPointInTime;
      [k: string]: unknown;
    }
) & {
  type: unknown;
  data: unknown;
};

/**
 * XVIZ Point primitive
 */
export type Matrix3X3 = Vector3X1[] | number[];
/**
 * XVIZ Point primitive
 */
export type Vector3X1 = number[];

/**
 * XVIZ Point primitive
 */
export type Matrix4X4 = number[][] | number[];

/**
 * XVIZ Point 3D list
 */
export type Point3DList = Vector3X1[] | number[];
/**
 * XVIZ Point primitive
 */
export type Vector3X1 = number[];

/**
 * XVIZ Point primitive
 */
export type Vector3X1 = number[];

/**
 * XVIZ Point primitive
 */
export interface PrimitivesCircle {
  base?: PrimitiveBase;
  type?: "CIRCLE";
  center: Vector3X1;
  radius: number;
}

/**
 * XVIZ Image primitive
 */
export interface PrimitivesImage {
  base?: PrimitiveBase;
  type?: "IMAGE";
  position?: Vector3X1;
  data: string;
  width_px: number;
  height_px: number;
}

/**
 * XVIZ Point primitive
 */
export interface PrimitivesPoint {
  base?: PrimitiveBase;
  type?: "POINT";
  points: Point3DList;
  colors?: (_Color[] | number[]) & unknown[];
}

/**
 * XVIZ Polygon primitive
 */
export interface PrimitivesPolygon {
  base?: PrimitiveBase;
  vertices: Point3DList;
}

/**
 * XVIZ Polyline primitive
 */
export interface PrimitivesPolyline {
  base?: PrimitiveBase;
  vertices: Point3DList;
}

/**
 * XVIZ Point primitive
 */
export interface PrimitivesStadium {
  base?: PrimitiveBase;
  start: Vector3X1;
  end: Vector3X1;
  radius: number;
}

/**
 * XVIZ Text primitive
 */
export interface PrimitivesText {
  base?: PrimitiveBase;
  type?: "TEXT";
  position: Vector3X1;
  text: string;
}

/**
 * XVIZ Camera Information
 */
export interface CameraInfo {
  human_name: string;
  source: string;
  vehicle_position?: Vector3X1;
  vehicle_orientation?: Matrix3X3;
  pixel_width?: number;
  pixel_height?: number;
  rectification_projection?: Matrix3X3;
  gl_projection?: Matrix4X4;
}

/**
 * XVIZ Session Error
 */
export interface Error {
  message: string;
}

/**
 * XVIZ Metadata Log timing information
 */
export interface LogInfo {
  start_time?: number;
  end_time?: number;
  [k: string]: unknown;
}

/**
 * XVIZ Session Metadata
 */
export interface Metadata {
  version: string;
  streams?: {
    [k: string]: StreamMetadata;
  };
  cameras?: {
    [k: string]: CameraInfo;
  };
  stream_aliases?: {
    [k: string]: string;
  };
  ui_config?: {
    [k: string]: UiPanelInfo;
  };
  log_info?: LogInfo;
  map_info?: {
    [k: string]: unknown;
  };
  vehicle_info?: {
    [k: string]: unknown;
  };
}

/**
 * XVIZ Reconfigure message
 */
export interface Reconfigure {
  update_type: "DELTA" | "FULL";
  config_update: {
    [k: string]: unknown;
  };
}

/**
 * XVIZ Session Start
 */
export type Start = {
  version: string;
  profile?: string;
  session_type?: unknown;
  message_format?: "JSON" | "BINARY";
  log?: unknown;
} & (
  | {
      session_type?: "LOG";
      log: {
        [k: string]: unknown;
      };
      [k: string]: unknown;
    }
  | {
      session_type?: "LIVE";
      [k: string]: unknown;
    }
);

/**
 * XVIZ Stream Update
 */
export interface StateUpdate {
  update_type: "COMPLETE_STATE" | "INCREMENTAL" | "SNAPSHOT" | "PERSISTENT";
  updates: StreamSet[];
}

/**
 * XVIZ Stream Metadata
 */
export type StreamMetadata = ((
  | {
      coordinate?: "GEOGRAPHIC" | "IDENTITY";
      [k: string]: unknown;
    }
  | {
      coordinate?: "VEHICLE_RELATIVE";
      [k: string]: unknown;
    }
  | {
      coordinate?: "DYNAMIC";
      [k: string]: unknown;
    }
) &
  (
    | {
        category?: "TIME_SERIES" | "VARIABLE";
        [k: string]: unknown;
      }
    | {
        category?: "FUTURE_INSTANCE" | "PRIMITIVE";
        [k: string]: unknown;
      }
    | {
        category?: "UI_PRIMITIVE";
        [k: string]: unknown;
      }
    | {
        category?: "ANNOTATION";
        [k: string]: unknown;
      }
    | {
        category?: "POSE";
        [k: string]: unknown;
      }
  )) & {
  source?: string;
  units?: string;
  coordinate?: unknown;
  transform?: Matrix4X4;
  transform_callback?: string;
  category?: "ANNOTATION" | "FUTURE_INSTANCE" | "POSE" | "PRIMITIVE" | "UI_PRIMITIVE" | "TIME_SERIES" | "VARIABLE";
  scalar_type?: "FLOAT" | "INT32" | "BOOL" | "STRING";
  primitive_type?: "CIRCLE" | "IMAGE" | "POINT" | "POLYGON" | "POLYLINE" | "STADIUM" | "TEXT";
  ui_primitive_type?: "TREETABLE";
  annotation_type?: "VISUAL";
  stream_style?: StreamValue;
  style_classes?: Class[];
};

/**
 * XVIZ Session Transform Log
 */
export interface TransformLog {
  id: string;
  start_timestamp?: number;
  end_timestamp?: number;
  desired_streams?: string[];
}

/**
 * XVIZ Session Transform Log Done
 */
export interface TransformLogDone {
  id: string;
}

/**
 * XVIZ Session Transform Point In Time
 */
export interface TransformPointInTime {
  id: string;
  query_timestamp: number;
  desired_streams?: string[];
}

/**
 * XVIZ Session UI Panel Info
 */
export interface UiPanelInfo {
  name: string;
  needed_streams?: string[];
  config:
    | {
        [k: string]: unknown;
      }
    | string;
}

/**
 * Internal XVIZ RGBA color type
 */
export type _Color = number[] | string;

/**
 * XVIZ Style Class
 */
export interface Class {
  name: string;
  style: ObjectValue;
}

/**
 * XVIZ Object Style Value
 */
export type ObjectValue = {
  [k: string]: unknown;
} & {
  fill_color?: _Color;
  stroke_color?: _Color;
  stroke_width?: number;
  radius?: number;
  text_size?: number;
  text_rotation?: number;
  text_anchor?: "START" | "MIDDLE" | "END";
  text_baseline?: "TOP" | "CENTER" | "BOTTOM";
  height?: number;
};

/**
 * XVIZ Stream Style Value
 */
export type StreamValue = {
  [k: string]: unknown;
} & {
  fill_color?: _Color;
  stroke_color?: _Color;
  stroke_width?: number;
  radius?: number;
  text_size?: number;
  text_rotation?: number;
  text_anchor?: "START" | "MIDDLE" | "END";
  text_baseline?: "TOP" | "CENTER" | "BOTTOM";
  height?: number;
  radius_pixels?: number;
  radius_min_pixels?: number;
  radius_max_pixels?: number;
  stroke_width_min_pixels?: number;
  stroke_width_max_pixels?: number;
  opacity?: number;
  stroked?: boolean;
  filled?: boolean;
  extruded?: boolean;
  font_family?: string;
  font_weight?: number;
  point_color_mode?: "ELEVATION" | "DISTANCE_TO_VEHICLE";
  point_color_domain?: number[];
};

/**
 * XVIZ Treetable
 */
export interface UiPrimitivesTreetable {
  columns?: {
    display_text: string;
    type: "INT32" | "DOUBLE" | "STRING" | "BOOLEAN";
    unit?: string;
  }[];
  nodes?: {
    id: number;
    parent?: number;
    column_values?: string[];
  }[];
}

} // namespace v2
} // namespace xviz
}
