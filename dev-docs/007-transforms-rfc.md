- Start Date: 2019-09-05
- RFC PR: https://github.com/uber/xviz/pull/524

# Support for a Client Defined Scene Graph

It is desirable to enable arbitrary transform support common in robotic systems. Currently XVIZ
models a few reference frames explicitly with our coordinate types IDENTITY, GEOGRAPHIC, and
VEHICLE_RELATIVE. The need for client controlled frames of reference will make it easier to interop
with other systems as well as match a data modeling approach common with autonomous platforms.

# Motivation

Data can be static, but the reference frame for the data may change. To avoid forcing such data to
be resent we can provide the ability to only update the transform for that data.

Examples of such data could be _maps_ and _point clouds_ that is structured as being vehicle
relative. In such an example only the transform would need to be updated as the vehicle moves.

Extending this to a general robotic systems convention, the need to describe transforms between
reference frames used by various data streams is a common model for robotic systems. Another feature
of robotic systems is the dynamic nature of relationships and transforms. The ability to define a
mix of static and constant spatial relationships is required.

# Proposal

## Adding a "links" field to the state_update message

Introducing a _links_ entry to the state_update message will allow us to model arbitrary transforms
and the connection between primitives and the transform network.

The _links_ structure would be a map where the keys are the primitive stream or pose stream. And it
would contain the name of the _target pose_ stream that contains the parent reference frame such
that the data encoded would be relative to the _target pose_ stream position and orientation.

In JSON it would look like this:

```
  "poses": {
    "/vehicle_pose": {
      "position: [225.32, 154.43, 13.32],
      "orientation: [23.24, 15.3, 1.3]
    },
    "/vehicle_pose_2": {
      "position: [201.32, 121.3, 12.92],
      "orientation: [23.24, 15.3, 1.3]
    },
    "/map_base": {
      "position: [0, 0, 0],
      "orientation: [0, 0, 0]
    }
  },
  "links": {
    "/objects": {
      target_pose: "/vehicle_pose"
    },
    "/lidar_1": {
      target_pose: "/vehicle_pose"
    },
    "/lidar_2": {
      target_pose: "/vehicle_pose_2"
    },
    "/map_lanes": {
      target_pose: "/map_base"
    },
    "/vehicle_pose": {
      target_pose: "/map_base"
    },
    "/vehicle_pose_2": {
      target_pose: "/map_base"
    }
  }
```

Today we have a special coordinate _VEHICLE_RELATIVE_, which will cause data to be interpreted as
relative to the _/vehicle_pose_ Pose. With the more general solution provided by the _links_ field
we can model any number of vehicles by creating a link to a defined Pose.

# Detailed Design

1. Streams already have a _coordinate_ definition for stream metadata with the default value of
   _IDENTITY_. This definition interprets the data as meter offsets. A change to this definition
   would be to define it's behavior as having no _pre-defined_ transform applied to the data. This
   would allow the use of the newly defined _links_ structure with any stream by default without any
   backwards compatibility issue.

Below is the full list of behavior for the new _links_ data with regard to the stream coordinate.

Streams with a coordinate:

| COORDINATE SYSTEM  | Behavior                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| _IDENTITY_         | _links_ chain is resolved and the resulting transform is applied to the stream                                                                |
| _VEHICLE_RELATIVE_ | If present, the _links_ chain is resolved and the resulting transform is applied to the stream else the default _/vehicle_pose_ would be used |
| _GEOGRAPHIC_       | _links_ are _UNSUPPORTED_ and would be ignored                                                                                                |
| _DYNAMIC_          | The callback function would have access to the _links_ state and may use that data as necessary                                               |

Of particular note is that the _VEHICLE_RELATIVE_ behavior makes it possible to support multiple
vehicles.

2. Adding the _links_ field to the state_update message.

A new object would be added to the streamset specification.

- The field name would be _links_
- The keys of the _links_ object would represent the child stream the link affects
  - The key could be a _primitive_ stream or a _pose_ stream
- The value of a key would be an object that contains an entry _target_pose_ which is a string that
  names a _pose_ stream

3. Deprecate the timestamp on the Pose

This is an artifact of an earlier version of XVIZ. Today the streamset defines the timestamp, with
the pose timestamp being a fallback. This fallback should be trigger a deprecation warning.

4. Mixing of links between message types

Links and poses create connections between streams that is expected to span the various state_update
message types.

A common distinction is made between static and dynamic frames. An example would be a static
reference frame defined as `/world_base` which defines the origin. We could then have a dynamic
reference frame `/vehicle_pose` that is a moving platform relative to `/world_base`. Next we can
define a static reference frame for a lidar sensor relative to `/vehicle_pose`.

This creates a chain that is static frame -> dynamic frame -> static frame.

In this chain, only the dynamic frame will be updated but that update would cascade to any data that
references the final static frame.

In XVIZ a static entry would be sent in a _PERSISTENT_ _state_update_ message. Dynamic links and
poses would come from a _COMPLETE_ or _INCREMENTAL_ message.

5. Missing or invalid transform chains

If there are holes in the transform chain then the stream should be marked with an error such that
the viewing client can communicate the nature of the error to the users.

## Message combinations

State update messages have PERSISTENT, COMPLETE, and INCREMENTAL types.

### PERSISTENT

PERSISTENT messages is where most _links_ should be defined as they setup a structure that changes
very little if at all. Static poses for a link, like those from a platform to a sensor, should also
be defined in this message type.

PERSISTENT messages define state that is not subject to the XVIZ TIME_WINDOW configuration value and
also less likely to be purged. The messages are still subject to a timestamp and therefore care must
be taken to ensure this data does not grow unbounded in the application state.

Having said that, an implementation can always replace the default state manager to handle data as
necessary for the use-case.

### COMPLETE and INCREMENTAL

These modes fundamentally deal with creating and adding data that is subject to the **TIME_WINDOW**
configuration. The TIME_WINDOW is the duration of time XVIZ state will consider relative to the
current timestamp. The usage model for this setting is that data this is not updated frequently may
be stale and should not be visualized. This can be defined by the application as necessary for the
use-case, but covers all data not individual streams.

The intention is that dynamic poses and links that are updated frequently, defined as being within
the TIME_WINOW, could be sent in either of these messages.

The semantics of _INCREMENTAL_ are at the stream set level and not the objects within a stream. So
it is worth noting that transforms are not combined, but an _INCREMENTAL_ message would simply
replace the active pose at that timestamp.

Links should be avoided in these messages as a situation where the link would be only shortly lived
is unclear in the current use-cases. They can be defined but will only be present for the duration
of TIME_WINDOW.

Keep in mind that these messages may also be purged as the assumption in an XVIZ client is that a
minimal amount of state is necessary.

## Streetscape.gl implementation details

The streetscape.gl implementation currently manages the transform resolution through a single
function, resolveCoordinateTransform(), which is given access to the internal data frame and the the
stream metadata. With that information it can process the _links_ transform chain to compute the
affective matrix for rendering.

We may want to build a transform cache if necessary, but that is a performance implementation
detail.

# Follow-up proposals

The following are proposals that are related to this but are not required for this proposal to be
accepted. They are mentioned only to fully understand the scope, influence, and considerations that
have helped contextualize and shape this proposal.

## Making timestamps optional on the streamset

Supporting data without the need for timestamps can be done with XVIZ.

Currently, timestamps are required by XVIZ as it models and supports time-based navigation. However
there are cases where either data is unchanging, or the element of time is unimportant.

For now this requirement can be worked around using the existing message types. To holistically
remove this requirement on XVIZ would require context that would detract from the focus of this
proposal but can be addressed independently at a later time.

## Support for linear interpolation on poses

A desired features is the ability for the client to interpolate between pose data samples. This
requires a sequence of data with timestamps and an interpolation function. I have decided to avoid
addressing this initial proposal; however, it is worth noting there are no known obstacles to
supporting interpolation.

The current proposal supports time-varying transforms. An approach to alleviate the need for
interpolation would be to increasing the frequency of the definition of the Poses as necessary.

To highlight how this would work today, we can describe the 2 categories of transforms and how they
are represented in XVIZ messages. Details are also covered in the section **Message combinations**.

- **persistent** transforms - These use the most recent transform relative to the timestamp. These
  transforms do not expire. These would be sent in a PERSISTENT XVIZ state_update message.

- **dynamic** transforms - These use the most recent transform relative to the timestamp, but due to
  the expected frequency of this data they may be purged as more data is sent. These would come in a
  COMPLETE or INCREMENTAL message. As these messages represent changing state, interpolation and
  extrapolation would be most useful here.

# Other considerations

### Metadata only approach

An attempt was made to fit this into stream metadata, and make metadata additions more dynamic.
However the criteria that the links could also be time relative turns this into _data_ rather than
metadata.

Further complications with this approach would be an addition that allows incremental metadata
definitions. In _on-line_ data cases the streams being sent may not be known until they are first
encountered. This makes requiring all stream metadata, easy in an off-line situation, practically
impossible.

### Per Object transforms

This proposal is consistent with the prevalent data model used in XVIZ which is streams of related
data. As such the proposed _links_ addition operates at the XVIZ stream level and transforms for
individual objects is not supported. If that was desired a stream per object must be defined.

### Generic transform as a Variable type

Support variable as a valid transform stream with 16 element array representing a 4x4 matrix.

The problems with this are:

- It is largely redundant with the pose type
- Only a specific value-type for variable would be valid, making it an overly special exception

### Special case for vehicle_relative "static" data

The case was raised that if we really want to model data that is "PERSISTENT" but described relative
to the vehicle pose, that we wanted to update just the transform rather than the data (map data and
point clouds) then we could have a _known_ pose in the _PERSISTENT_ message, and since the data is
vehicle relative, we can deduce the transform from the "known" pose to the current pose
automatically.

This avoids need to expose a transform mechanism. However, further discussion highlighted the need
to encode arbitrary parent/child relationships invalidating this approach.
