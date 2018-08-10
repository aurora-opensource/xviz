*Uber Confidential Information*

# xviz

XVIZ protocol and utility libraries.

## Development

### Dependencies

To build this repository you need:

 - Node.js, tested with 8.11.3, compatible with 8.x
 - Yarn, tested with 1.7.0, compatible with 1.x

To install dependencies, run:

```bash
$ git clone https://github.com/uber/xviz.git
$ cd xviz
$ yarn
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

The documentation is built with the Ocular documentation generator. You can easily iterate on the docs by doing, and see changes live in your browser:

```
$ cd website
$ yarn  # install dependencies
$ yarn start
```

If you wish to just do a static build, run:

```
$ cd website
$ yarn build
```

Then open `dist/index.html` to view.
