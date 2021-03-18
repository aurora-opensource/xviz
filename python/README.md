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

# xviz_avs

Python implementation of XVIZ protocol libraries.

# Requirements

Python3, `websockets`, `protobuf`, `numpy`

# Get started

You can try running the scenario server by `python examples/serve_scenarios.py`. Then you can run `cd examples/get-started && yarn start-live` under your `streetscape.gl` repository to see the example scenarios.

# Acknowledgements

 * **[Yuanxin Zhong](https://github.com/cmpute)** created [xviz.py](https://github.com/cmpute/xviz.py) and allowed us to use it as the base for the official python XVIZ library.
