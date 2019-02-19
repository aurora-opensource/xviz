# @xviz/schema

This module contains the XVIZ protocol JSON schema files and examples along with utilities for
validating them.

## Install

Using npm:

```sh
npm install --save-dev @xviz/schema
```

or using yarn:

```sh
yarn add @xviz/schema
```

## Directory Structure

The root of this modules contains the schema divided up into:

- `core` - central types
- `primitives` - base visualization types
- `session` - typical client/server messages
- `math` - basic math types used in several schemas

The non schema directories:

- `src` - code to validate the examples against the schema
- `examples` - JSON files that match correspondingly named schema files
- `invalid` - Like `examples` but all of these should fail invalidation

For more in depth documentation see http://xviz.org/docs
