# `validate` - check XVIZ data

## Overview

This checks that the data matches the schema, and session protocol is followed.

```
xviz validate DATAARGS

Validate the resulting XVIZ data, making sure:
 - All data conforms to the XVIZ schema
 - The message flow matches protocol specification
 - Additional non-schema specification invariants are met

-c, --condensed   Show a short summary errors
```

## Condensed

This view shows how many messages you got of each type and how many unique errors you got. You can
exit at any time with `Ctrl-C` and get results of messages processed up to that point.

```
$ xviz validate --condensed ws://localhost:8081 630e522f-d2b1-403c-a9a3-468b398cbf60
┌────────────────────┬───────┬─────────┬───────┬───────────────┐
│ Type               │ Count │ Invalid │ Inv % │ Unique Errors │
├────────────────────┼───────┼─────────┼───────┼───────────────┤
│ START              │ 1     │ 0       │ 0.0   │ 0             │
├────────────────────┼───────┼─────────┼───────┼───────────────┤
│ METADATA           │ 1     │ 1       │ 100.0 │ 1             │
├────────────────────┼───────┼─────────┼───────┼───────────────┤
│ TRANSFORM_LOG      │ 1     │ 0       │ 0.0   │ 0             │
├────────────────────┼───────┼─────────┼───────┼───────────────┤
│ STATE_UPDATE       │ 154   │ 13      │ 8.4   │ 2             │
├────────────────────┼───────┼─────────┼───────┼───────────────┤
│ TRANSFORM_LOG_DONE │ 1     │ 0       │ 0.0   │ 0             │
└────────────────────┴───────┴─────────┴───────┴───────────────┘
```

## Detailed

The detailed view shows you each unique error as it comes it in with the message that caused it.
This lets you narrow down the problem. In this example the `stream_style` object has a non standard
`wireframe` style that must be removed.

```
$ xviz validate ws://localhost:8081 630e522f-d2b1-403c-a9a3-468b398cbf60
VALIDATION ERROR:
  TYPE: METADATA
  DETAILS:
    Error: Validation errors: [
      {
        "keyword": "additionalProperties",
        "dataPath": ".streams['/tracklets/objects'].stream_style",
        "schemaPath": "#/additionalProperties",
        "params": {
          "additionalProperty": "wireframe"
        },
        "message": "should NOT have additional properties"
      }
    ]
  MSG:
    {
        "version": "2.0.0",
        "streams": {
            "/tracklets/objects": {
                "category": "primitive",
                "coordinate": "VEHICLE_RELATIVE",
                "stream_style": {
                    "extruded": true,
                    "wireframe": true,
                    "fill_color": "#00000080"
                },
   ...
```
