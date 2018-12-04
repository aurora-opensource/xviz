_Uber Confidential Information_

# xviz

XVIZ protocol and utility libraries.

## Development

### Dependencies

To build this repository you need:

- Node.js, tested with 8.11.3, compatible with 8.x
- Yarn, tested with 1.10.0, compatible with 1.x

To install dependencies, run:

```bash
$ git clone https://github.com/uber/xviz.git
$ cd xviz
$ yarn bootstrap
```

### Test

Run tests under Node.js:

```bash
$ yarn test
```

Run tests in a browser:

```bash
$ yarn test-browser
```

## Docs

The website version of the documentation can be viewed via the streetscape.gl project:

```
$ cd ../streetscape.gl/website # the streetscape.gl repo must be cloned into the same parent directory as xviz
$ yarn  # install dependencies
$ yarn start-local
```

## Coding Standard

xviz uses a pinned version of the
[uber-es2015](https://www.npmjs.com/package/eslint-config-uber-es2015) linter rules.
