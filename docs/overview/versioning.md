# Versioning and Support

The XVIZ protocol is versioned as closely as possible in accordance with
[Semantic Versioning](http://www.semver.org):

- Major versions will be released whenever there is a breaking API change.
- Minor versions will be released whenever a change includes additions to the API, such as
  additional primitives, or additional fields for existing primitives.
- Patch versions will be released whenever a change is released that in no way changes the API.

### Version Support Guarantees

During H1 2018, major versions will be released no more often than every two months. From H2 2018
onward, major versions will be released no more often than every 6 months. Minor and patch updates
may be released at any time.

Support will be focused on on the most recent revisions in the current and previous major revisions.
That is to say, given the revisions:

```
v2.0.0
v2.1.0
v2.2.0
v2.2.1
v3.0.0
V3.0.1
```

Support will focus on `v3.0.1` and when required `v2.2.1`.

### Backwards Propagation of Updates

Protocol improvements made in later versions of XVIZ will be back propagated to the previous
supported version. For example, if a performance enhancement is made to a draw method in XVIZ v3, it
will be similarly made in the lastest XVIZ v2.
