# CLI Command

It is useful to be able to build custom command line tools configured for your data. Below we
describe functions than can help with this for the XVIZ server.

Specifically it is useful to register a custom Provider with the
[XVIZProviderFactory](/docs/api-reference/io/xviz-provider-factory.md) to setup any customizations
before the command is executed.

##### serverArgs(inArgs, options)

Registers the `server` command and supported options.

Parameters:

- `inArgs` (yargs) - The yargs instance that the options and command will be register
- `options.defaultCommand` (Boolean) - Option to make this command the default command (default:
  false)

##### serverCmd(args)

Executes the server based on supplied arguments.

Parameters:

- `args` (Object) - The object containing the parsed arguments
