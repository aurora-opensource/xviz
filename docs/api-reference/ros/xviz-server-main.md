# XVIZServerMain

Utility class that implements a Websocket server.

Register any Providers with the
[XVIZProviderFactory](/docs/api-reference/io/xviz-provider-factory.md) before calling the
`execute()` method.

See the [xvizserver](/docs/api-reference/server/tools/xvizserver-tool.md) tool for all the supported
options.

## Methods

##### setupArguments()

Returns the `yargs` instance used to parse arguments.

Users can override this class and call the base class implementation in order to add additional
arguments as necessary.

##### setupProviders()

Method to configure Providers that the server can use. This can be overwritten to register custom
providers.

##### execute()

Parse arguments and run the server.
