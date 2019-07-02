# ConvertMain

Utility class that implements the conversion flow for XVIZ.

Register any Providers with the
[XVIZProviderFactory](/docs/api-reference/io/xviz-provider-factory.md) before calling the
`execute()` method.

## Methods

##### async execute(args)

Execute the conversion

Parameters:

- `args`
  - `bag` (String) - Source path for the data
  - `dir` (String) - Directory where the files will be output
  - `start` (String) - starting time
  - `end` (String) - ending time
  - `rosConfig` (string) - file path to [ROSConfig](/docs/api-reference/ros/ros-config.md)
  - `format` (string) - [XVIZFormat](/docs/api-reference/io/xviz-format.md)
