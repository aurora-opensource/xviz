- Start Date: 2019-09-05
- RFC PR: https://github.com/uber/xviz/pull/524

# Support for a Client Defined Scene Graph

It is desirable to enable arbitrary transform support common in robotic systems. Currently XVIZ
models a few reference frames explicitly with our coordinate types IDENTITY, GEOGRAPHIC, and
VEHICLE_RELATIVE. The need for client controlled frames of reference will make it easier to interop
with other systems as well as match a data modeling approach common with automous platforms.

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

The _links_ structure would be a map where the keys are the target primitive stream or pose stream.
And it would contain the name of the source pose stream.

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
      source_pose: "/vehicle_pose"
    },
    "/lidar_1": {
      source_pose: "/vehicle_pose"
    },
    "/lidar_2": {
      source_pose: "/vehicle_pose_2"
    },
    "/map_lanes": {
      source_pose: "/map_base"
    },
    "/vehicle_pose": {
      source_pose: "/map_base"
    },
    "/vehicle_pose_2": {
      source_pose: "/map_base"
    }
  }
```

Today we have a special coordinate VEHICLE_RELATIVE, which will cause data to be interpreted as
relative to the /vehicle_pose Pose. With the more general solution provided by the _links_ field we
can model any number of vehicles by creating a link to a defined Pose.

# Detailed Design

1. Streams already have a _coordinate_ definition for stream metadata with the default value of
   _IDENTITY_. This definition interprets the data as meter offsets. A change to this definition
   would be to define it's behavior as having no _pre-defined_ transform applied to the data. This
   would allow the use of the newly defined _links_ structure with any stream by default without any
   backwards compatibility issue.

Below is the full list of behavior for the new _links_ data with regard to the stream coordinate.

Streams with a coordinate:

- _IDENTITY_ would have any _links_ entries applied to the stream
- _VEHICLE_RELATIVE_ would apply _links_ if an entry is found. If an entry is not found, then the
  default pose _/vehicle_pose_ would be used
- _GEOGRAPHIC_ would not apply _links_ as it already defines a coordinate frame
- _DYNAMIC_ calls a function which has access to the internal stream state. This would include any
  _links_ defined so it may use that data as desired.

Of particular note is that the _VEHICLE_RELATIVE_ behavior makes it now possible to support multiple
vehicles.

2. Adding the _links_ field to the state_update message.

A new object would be added to the streamset specification.

- The field name would be _links_
- The keys of the _links_ object would represent the target stream the link affects
  - The target could be a _primitive_ stream or a _pose_ stream
- The value of a key would be an object that contains an entry _source_pose_ which is a string that
  names a _pose_ stream

3. Remove the timestamp on the Pose

This is an artifact of an earlier verion of XVIZ. Today the streamset defines the timestamp, with
the pose timestamp being a fallback. This fallback should be removed and the field from pose
removed.

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

In XVIZ a static entry would be sent in a _PERSISTENT_ state_update message. Dyanmic links and poses
would come from a _COMPLETE_ or _INCREMENTAL_ message.

5. Missing or invalid transform chains

If there are holes in the transform chain then the stream should be marked with an error such that
the viewing client can communicate the nature of the error to the users.

## Message combinations

State update messages have COMPLETE, INCREMENTAL and PERSISTENT types.

### COMPLETE and INCREMENTAL

These modes fundamentally deal with creating and adding data that is subject to the TIME_WINDOW
configuration. The intention is that dynamic poses and links that are updated frequently, defined as
being within the TIME_WINOW, would be sent in either of these messages.

The semantics of _INCREMENTAL_ are at the stream set level, so it is worth noting that transforms
are not combined but an _INCREMENTAL_ message would simply replace the active pose at that
timestamp.

Links should be avoided in these messages as a situation where the link would be only shortly lived
is unclear in the current use-cases. They can be defined but will only be present for the duration
of TIME_WINDOW.

Keep in mind that these messages may also be purged as the assumption in an XVIZ client is that a
minimal amount of state is necessary.

### PERSISTENT

PERSISTENT messages is where most links should be defined as they setup a structure that changes
very little if at all. Static poses for a link, like those from a platform to a sensor, should also
be defined in this message type.

PERSISTENT messages define state that is not subject to the TIME_WINDOW and also less likely to be
purged. The messages are still subject to a timestamp and therefore care must be taken to ensure
this data does not grow unbounded in the application state.

## Streetscape.gl implementation details

The streetscape.gl implementation currently manages the transform resolution through a single
function, resolveCoordinateTransform(), which is given access to the the internal data frame and the
the stream metadata. With that information it can process the _links_ transform chain to compute the
affective matrix for rendering.

We may want to build a transform cache if necessary, but that is a performance implmentation detail.

# Follow-up proposals

The following are proposals that are related to this but are not required for this proposal to be
accepted. They are mentioned only to fully understand the scope, influence, and considerations that
have helped contextualize and shape this proposal.

- Making timestamps optional on the streamset
- Support for linear interpolation on poses

# Other considerations

### Metadata only approach

An attempt was made to fit this into stream metadata, and make metadata additions more dynamic.
However the criteria that the links could also be time relative turns this into _data_ rather than
metadata.

Further complications with this approach would be an addition that allows incremental metadata
definitions. In _on-line_ data cases the streams being sent may not be known until they are first
encountered. This makes requiring all stream metadata, easy in an off-line situation, pratically
impossible.

### Rendering consideration

In deck.gl, used by streetscape.gl, the layers are separated by geometry type and we render all data
in one call. If each instance in a stream had a different transform we would have 2 options

1 Do a pass over each instance and group by transform, then render each group as a layer 2 Alter the
layer shader code to accept a transform uniform

Option 2 would require augmenting the shaders for all primitive types plus the uniform addition. If
every element was unique, then maybe it would be worth it, but most objects in our use case have a
natural grouping.

### Generic transform as a Variable type

support variable as a valid transform stream with 16 element array representing a 4x4 matrix

- I don't know where to put the "parent_transform"
- seems the valid variable would be very specific

### Special case for vehicle_relative "static" data

The case was raised that if we really want to model data that is "PERSISTENT" but described relative
to the vehicle pose, that we wanted to update just the transform rather than the data (map data and
point clouds) then we could have a _known_ pose in the _PERSISTENT_ message, and since the data is
vehicle relative, we can deduce the transform from the "known" pose to the current pose
automatically.

This avoids need to expose a transform mechanism. However, further discussion highlighted the need
to encode arbitrary parent/child relationships.
