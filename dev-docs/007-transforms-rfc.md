- Start Date: 2019-09-05
- RFC PR: 

# Summary

It is desirable to enable arbitrary transform support common in robotic systems. While XVIZ models some explicitly
with our coordinate types IDENTITY, GEOGRAPHIC, and VEHICLE_RELATIVE, the need for client controlled frames of reference
will make it easier to interop with other systems as well as match a familiar modeling automous system data.

# Motivation

Some PERSISTENT data, such as *maps* and *point clouds*, could be encoded in various ways such as vehicle relative.
If they are semantically fixed, but the reference point changes, there is no way to efficiently update them without
sending all the points again.

Ideally, the only data that is required is the transform to adjust how the points are transformed.

Extending this to a general robotic systems convention, the need to describe parent/child relationships
is a common model for robotic systems.

XVIZ is not focused on articulated robotic platforms but support for the convention common when modeling autonomous data
would be benefitial for XVIZ and it's users.

# Proposal

### POSE schema
 - Add a *parent* field to the pose that is a string that my reference another pose stream
   If present within the data, it would be used to construct the final transform matrix for the data
 - Poses may reference any other pose as a *parent* across all state_update message types. Meaning a PERSISTENT
   pose could be a parent of a *COMPLETE* or *INCREMENTAL* pose.
 - The pose stream names must be unique.
 - Remove timestamp as required field on the pose schema. The state_update defines the timestamp for the message already
   and the pose entry was just a carry over from xviz v1

### PRIMITIVE schema
 - add a *pose* field to the primitive_base schema, making the attribute accessible to all primitives

### STREAM METADATA schema
 - Add a *pose* field, as a string referencing a POSE stream

# Detailed Design

The *pose* stream for a primitive may be in the metadata or on the individual elements within the pose
It may be assumed that all elements within a stream share the same *pose*, and only first entry must be
checked.

The reasons for this are described below, but briefly it is to avoid having to scan and batch the elements
when rendering.  If elements have a different transform they should be placed in a different layer.

## Streetscape.gl implementation details

TODO - quick check with xiaoji that this should not be a problem. The stream synchronizer has all the data
at the time of render so we can query the first element or metadata and fetch out the proper transform.

We may want to build a transform cache if necessary, but that is a performance implmentation detail.

## Other considerations

### rendering consideration

  in deck.gl, used by streetscape.gl, the layers are separated by geometry type and we render all data
  in one call.  If each instance in a stream had a different transform we would have 2 options
  1 do a pass over each instance and group by transform, then render each group as a layer
  2 alter the layer shader code to accept a transform uniform

  Option 2 would require augmenting the shaders for all primitive types plus the uniform addition.
  If every element was unique, then maybe it would be worth it, but most objects in our use case have a
  natural grouping.

### special case for vehicle_relative "static" data

  The case was raised that if we really want to model data that is "PERSISTENT" but described relative to the
  vehicle pose, that we wanted to update just the transform rather than the data (map data and point clouds)
  then we could have a *known* pose in the *PERSISTENT* message, and since the data is vehicle relative, we can
  deduce the transform from the "known" pose to the current pose automatically.

  This avoids need to expose a transform mechanism. However, further discussion highlighted the need
  to encode arbitrary parent/child relationships.

### metadata
  for rendering efficiency sake having all the elements on a stream have the same transform is desired.
  However, are moving away from metadata as a requisite as we want to support cases where metadata
  is not known upfront.

  Alternatives to this is our support for dynamic metadata, but this still requires some state management
  on the backend.

  The trade off is you have to send the "transform_stream" with every element in the layer, which is redundant

### per-instance transform
 - support variable as a valid transform stream with 16 element array representing a 4x4 matrix
   - I don't know where to put the "parent_transform"
   - seems the valid variable would be very specific

### stream based property

 - there is another idea to enable a related concept (data coming from another stream entry)
   however, do to the way we render and parse to assemble data this has not be specified yet.
 - therefore, this approach is preferred over something more general but not necessary right now
