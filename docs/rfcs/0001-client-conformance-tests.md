- Start Date: 2019-03-01
- RFC PR: [#385](https://github.com/uber/xviz/pull/385)
- XVIZ Issue: []

# Summary

We'll build a set of test inputs and expected outputs that exercise all expected client features.
The expected output for the tests will be created with a reference client based on the XVIZ
JavaScript code base and a new browser based 2D canvas rendering system. Each client that wants to
validate itself will build it's own test runner and compare it's output the expected set.

# Motivation

We want an easy automatic way to validate an XVIZ client works as the spec says, and the user
expects. This will support an ecosystem of XVIZ clients, and allow for each client to innvoate while
having good interopability and preventing regressions.

# Drawbacks

- We have to maintain separate reference implementations in addition to the ones in streetscape.
- Golden image based testing can be slow and fragile to small changes in the underlying libraries.
- Clients will need to build support parsing XVIZ data and the test format data

# Detailed design

## Conformance Areas

From a client perspective we divide functionality into several areas. Validation can take the proper
approach for each. We go in the basic order you would when building a client, from understanding the
data, to exchanging data, to display, to high level features.

- Format support - can a client understand the data format
- Session support - can a client interact with a conforming server
- 3D data - can a client render geometric primitives and style them
- 2D data - can a client display numeric data and tabular data
- Declarative UI - (is the same as above)?

## Test Structure

Each test will be a folder on disk. With this set of files for the basic test:

- **parameters.json** - the conditions of the test
- **output.png** - the visual result at the end of the test
- **1-frame.json** - the input metadata, or .glb
- **2-frame.json** - the state_update data describing the world, or .glb

For more advanced tests there can be additional frame files and intermediate output. Where the
output file captures the state of the view **after** the frame has been processed by the client. The
form is `N-frame-output.png` where N is the frame number preceding the image. Here is an example:

- **3-frame.json** - frame to feed in after `2-frame.json`
- **4-frame.json** - frame to feed in after `3-frame.json`
- **4-frame-output.png** - expected view after processing `4-frame.json`
- **5-frame.json** - fame to feed in after `4-frame.json`

After all frames are consumed and the view should match **output.png**.

In addition any expected message from the client will be listed as `N-frame-client.json`, where N is
the frame that the client consumed **before** sending the message.

### parameters.json

This file holds the parameters for the test that are outside the XVIZ specification.

```
{
  "background_color": "#ccc",
  "pixels_per_meter": 0.5,
  "viewport": {
    "width": 800,
    "height: 600
  },
  "camera": {
    "track_vehicle": false,
    "position": [0, 0]
  }
}
```

## Reference Client

To generate the default data a reference client based on the XVIZ JavaScript code base and a browser
canvas based render will be built and maintained. It's designed for simplicity and ease of
development not speed.

## Format Support

First we have to make sure a client can just parse the data XVIZ provides. This will be implicit in
that all conformance tests are defined in terms of XVIZ messages. The cannonical exmaples will cover
the full range of the XVIZ specification. To be precise we'll have:

- All inputs in JSON form
- GLB input testing point cloud data
- GLB input testing image data

### Tests

These are the non-session specific conformation tests:

- `metadata/none` - just 1 raw frame
- `metadata/just-version` - just version
- `metadata/complete` - all streams described
- `pose/none` - normal metadata but no pose
- `pose/not-every-frame` - send pose only every other frame
- `frames/identity` - no special pose
- `frames/vehicle` - draw relative to vehicle position
- `<primitive>/style` - repeated for each primitive, tests all style features

## Session Support

Understanding the session protocol means a client can exchange messages with a server to actualy get
some XVIZ data to show on screen. We want to make sure clients support both live system and log
viewing, with various levels of metadata support.

### Log support

**TODO** Finish this section

Clients should be able to:

- View a subpart of a log of known length: JSON log on disk
- View a log with essentially no metadata at all: JSON log on disk
- Handle a log that will overflow memory (no matter the length)

* Log based:

  - with and without steam metadata
  - with and without duration

* Live based

# Alternatives

Unsure.

# Unresolved questions

None.
