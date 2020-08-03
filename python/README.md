# Raven Setup

## To install
```bash
# python3 is the expected runtime environment
# pwd - xviz/python
python setup.py .
```
## To run
```bash
# We use steetscape.gl for the front end
# the frontend should be served from the streetscape.gl repo
# pwd - streetscape.gl/examples/get-started
# npm run start-live

# For the backend, we use the python xviz tooling
# pwd - xviz/python
python examples/serve_scenarios.py
```

# xviz.py

Python implementation of XVIZ protocol. Note that this repository only comply with the protocol standard, the some of the implemented structure and modules definition are not the same. 

# Requirements

Python3, `websockets`, `protobuf`, `numpy`

# Get started

You can try running the scenario server by `python examples/serve_scenarios.py`. Then you can run `cd examples/get-started && yarn start-live` under your `streetscape.gl` repository to see the example scenarios.

Refer to documentation (to be created), examples and tests to learn how to use the library.
