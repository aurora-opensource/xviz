# Summary

We make the PNG and GIF of XVIZ. By making a `xviz/bundle` type that combines a `metadata` field
with a list of `state_update` messages. This has all the information to view an XVIZ scene in on
file. It's small enough to need no index, and can be stored in either JSON or GLB format.

# Motivation

Support the following workflows:

- "PNG or GIF" - Archive snippets of a log or scene for display in other tools and sharing
- "Visual printf" - dump internal a program/test as a single file then view in tool for debugging

# Detailed Design

This is a simple message with two fields:

- **metadata** - the `xviz/metadata` message type
- **state_updates** - an array of `xviz/state_update` messages

Example:

```
{
  "metadata": {
     "version": "2.0.0",
     ...
  },
  "state_updates": [
    {
      "update_type": "incremental",
      "updates": [
        {
          "timestamp": 1.20"
        },
        ...
      ]
    },
    {
      "update_type":
    }
  ]
}
```

When a client receives this message they would flush all buffered state and metadata and display
just this data.

# Alternatives

### Add metadata to state_update

- Simpler, clients do not have to store a new type
- This will not all direct copy of several state updates into one file
- Direct updates
