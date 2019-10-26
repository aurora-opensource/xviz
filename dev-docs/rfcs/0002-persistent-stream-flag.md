- Start Date: 2019-03-07
- RFC PR: [#403](https://github.com/uber/xviz/pull/403)
- XVIZ Issue: [#64](https://github.com/uber/xviz/issues/64)

# Summary

Propose the addition of a new state_update type **PERSISTENT** that will treat the data as being
persistent to allow send-once data to be preserved for the duration of a session.

In addition to the new update type we are adding an additional field to the stream_set,
`no_data_streams`, that will be an explicit statement that the listed streams contain no data.

# Motivation

The majority of XVIZ data is time-based but the need to send and display data that is persistent
occurs frequently with map data.

Today we only have one way to control the valid duration of stream data, which is the XVIZ Config
setting `TIME_WINDOW`.

Streetscape.gl, and any XVIZ compliant viewer, can get the XVIZ Config `TIME_WINDOW` which can be
set by the application to set the window of time that the viewer should inspect to find a stream
datum. The first datum found should be the active datum for the current viewing time. This is an
application wide mechanism so does not allow for individual stream control.

The PERSISTENT message is applicable to all streams included in the message.

In addition to adding persistent data, we need a way to invalidate persistent data in order to
remove data that is no longer valid.

# Proposal

In order to mark a stream as containing persistent data that should not be purged for the duration
of a session I propose the following.

### 1. Add a new update_type **PERSISTENT** to the **state_update** message

Any primitive data included in this state update should remain visible outside the TIME_WINDOW
setting.

Only **primitives** are currently supported for the **PERSISTENT** message. Other XVIZ data types
behavior is undefined with regard to this RFC. We will address them at a later date.

Specific features for a state_update message with the update_type **PERSISTENT**:

- For each stream in a persistent message, the most recent stream datum relative to the current
  timestamp will be displayed, regardless of the `TIME_WINDOW` configuration.
- If the stream name is present in the `no_data_streams` field, the stream state will be marked as
  empty

For state_update messages with other update_types the behavior will be as follows:

- If a non-persistent message is seen with the same stream name that data will be ignored with the
  persistent data taking precedence (and a warning should be logged).

### 2. Add a new field **no_data_streams** to the **stream_set**

The stream_set will have an additional field `no_data_streams` which will be an array of strings.
Any stream name listed in this array will mark that stream at the message timestamp as explicitly
having no data.

When the synchronizer looks for the data to display for a given stream, upon hitting this explicit
no data entry it shall return nothing and abort looking any further.

The defined behavior is primarily to allow an XVIZ viewer to know that previous data is explicitly
no longer valid and should not be displayed from this timestamp forward. Due to the way the
`TIME_WINDOW` logic works data which is effectively no longer valid does not have a good way to
signal that to the viewer. With this new field that can be reflected in the XVIZ message accurately.

For an example of when this would be useful lets take a vehicle trajectory path. One could imagine a
vehicle trajectory path is know based on the current state of the vehicle. However, in an emergency
the vehicle state may change invalidating that trajectory. If there is no trajectory what is data do
you sent? We considered sending a primitive with an empty vertices array but due to the various
formats we support empty arrays are not robust enought to define that there is no data. Instead we
have an explicit message to signal when past data is no longer valid.

# Out of scope

Persistence allows the data to break the time dependency, but there are other concerns around that
are not part of this RFC.

Below are a list of issue explicitly not part of this RFC or solution.

### Level of Detail Considerations

Since a primary use-case for this is map related data a related desire with other systems, such as
tiles, it so enable a level of detail (LOD) as a way to manage data when visual details would be
expensive or unnecessary due to the scale of the visualization.

Since there is no camera information LOD cannot be addressed with this persistence proposal.

### Dynamic data management across front end and backend

Another requirement of many mapping solutions is to manage state which often requires viewport
information that allows only the data visible to be fetched and stored. Since the proposed mechanism
does not involve any dynamic viewport information there is no way to manage state based on the
client interactions.

State could be managed by any data available to the XVIZ source, such as vehicle position.

# Alternatives

The persistent message is believed to be the simplest addition to enable session long data. Below
are other options that have been considered and why they where not part of the proposal at this
time.

### Retention, or Time To Live

A model seen in other projects has been to tag objects with a retention time. Persistence could be
modeled by giving a very large retention value. However semantically separating out persistence from
a retention time seems clearer, and has the effect of not complicating the state management for
streams within state update. This is because since the update types are distinct the treatment of
the data happens at the message level rather than at the stream level.

### Stream Metadata Property

We are moving to a more dynamic or incremental metadata model. Due to this direction we prefer not
to add a new dependency on metadata for core functionality. Metadata is increasingly seen as an
optimization, such as by reducing attributes or state that would otherwise be sent repeatedly.
