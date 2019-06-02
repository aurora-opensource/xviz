# XVIZ Protobuf Protocol Format

The XVIZ JSON schema is compatible with a set of protobuf files found in the `xviz/v2` folder of the
XVIZ repository. With these files you can produce JSON data that is compatible with the XVIZ JSON
schema and XVIZ clients.

## Current Status

**UNSTABLE** - the Prototuf schema for XVIZ is under active development. Anything can change in an
unversioned way: file structure, type names, or naming style to name just a few.

## Linting & Formatting Protobuf

We are using Uber's [prototool](https://github.com/uber/prototool) (version 1.7) to keep our files
consistent and following common conventions where possible (see `prototool.yaml` in the root for
exceptions):

To lint the files:

    prototool lint ./xviz/v2

To format the files:

    prototool format -w ./xviz/v2

## Using with Bazel

First you would use an external repository rule in your `WORKSPACE` like this but with the **proper
version** (newer than `1.0.0-beta14`) and matching sha256 sum.

```
http_archive(
    name = "com_github_uber_xviz",
    build_file = "//third_party:xviz.BUILD",
    sha256 = "5dee4a6d73b9032e589868fa67748ad2be3cc7face147c192f569c54170ef07c",
    strip_prefix = "xviz-1.0.0-beta.14",
    urls = ["https://github.com/uber/xviz/archive/v1.0.0-beta.14.zip"],
)
```

The above rule references this `xviz.BUILD` file. This one generate C++ but you can modify it to
produce other language specific Protobuf bindings.

```
proto_library(
    name = "proto",
    srcs = glob(["xviz/v2/*.proto"]),
    deps = [
        "@com_google_protobuf//:descriptor_proto",
        "@com_google_protobuf//:struct_proto",
    ],
)

cc_proto_library(
    name = "cc_proto",
    visibility = ["//visibility:public"],
    deps = ["proto"],
)
```

You would reference this rule in your other Bazel by using the following target:
`@com_github_uber_xviz//:cc_proto`
