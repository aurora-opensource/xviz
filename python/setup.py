from setuptools import setup, find_packages

with open("README.md", "r") as fh:
    DESCR = fh.read()

PKGS = find_packages()
PKGS.remove('test')

setup(
    name='xviz',
    version='0.1.1',
    description='Python implementation of XVIZ protocol',
    author='Yuanxin Zhong',
    author_email='cmpute@gmail.com',
    url="https://github.com/cmpute/xviz.py",
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
