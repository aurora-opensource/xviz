from setuptools import setup, find_packages
import os

with open("README.md", "r") as fh:
    DESCR = fh.read()

PKGS = find_packages()
if 'test' in PKGS:
    PKGS.remove('test')

# Get version
here = os.path.dirname(os.path.abspath(__file__))

version_ns = {}
with open(os.path.join(here, 'xviz_avs', '_version.py')) as f:
    exec(f.read(), {}, version_ns)

setup(
    name='xviz_avs',
    version=version_ns['__version__'],
    description='Python implementation of XVIZ protocol',
    author='Timothy Wojtaszek',
    author_email='twojtasz@uber.com',
    url="https://github.com/uber/xviz",
    long_description=DESCR,
    long_description_content_type='text/markdown',
    packages=PKGS,
    install_requires=['numpy', 'easydict', 'protobuf', 'websockets'],
    classifiers=[
        'Programming Language :: Python :: 3',
        'Operating System :: OS Independent',
        'Development Status :: 2 - Pre-Alpha',
        "Topic :: Scientific/Engineering :: Visualization",
        "Topic :: Database :: Front-Ends",
        "Environment :: Web Environment",
    ],
)
