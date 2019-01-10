# StreamSynchronizer

This class is constructed with a map of logs, and enables the application to set a timestamp and
retrieve one datums from every log that "matches" that timestamp.

Makes it easy to walk a set of non-synchronized logs and get the combined list of all the geometry
primitives from the most relevant datum in each log.
