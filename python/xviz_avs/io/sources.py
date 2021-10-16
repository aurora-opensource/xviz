'''
This module contains `sources` that can read and write data from certain source by key-value strategy.
Here the source is the combine definition of `source` and `sink` as from xviz JS library.
'''
import io
import os
from collections import defaultdict
from pathlib import Path


class BaseSource:
    def __init__(self):
        pass

    def open(self, name, mode='r'):
        raise NotImplementedError("Derived class should implement this method")

    def read(self, name):
        raise NotImplementedError("Derived class should implement this method")

    def write(self, data, name):
        raise NotImplementedError("Derived class should implement this method")

class DirectorySource:
    def __init__(self, directory):
        self._dir = Path(directory)
        if self._dir.exists():
            assert self._dir.is_dir()
        else:
            self._dir.mkdir(parents=True)

    def open(self, name, mode='r'):
        fpath = self._dir / name
        if mode == 'r':
            return fpath.open('rb')
        elif mode == 'w':
            return fpath.open('wb')

    def read(self, name):
        return (self._dir / name).read_bytes()

    def write(self, data, name):
        (self._dir / name).write_bytes(data)

    def close(self):
        pass

class ZipSource:
    pass

class _BytesIOWrapper(io.BytesIO):
    '''
    This class is for wrap BytesIO in MemorySource
    '''
    def __init__(self, source, key=None):
        if key and key in source._data:
            super().__init__(source._data[key])
        elif source._data:
            super().__init__(source._data)
        else:
            super().__init__()

        self._source = source
        self._key = key

    def close(self):
        if self._key:
            self._source._data[self._key] = bytes(self.getbuffer())
        else:
            self._source._data = bytes(self.getbuffer())
        super().close()

class MemorySource:

    def __init__(self, latest_only=False):
        self._latest_only = latest_only
        if latest_only:
            self._data = b''
        else:
            self._data = dict()

    def open(self, name, mode=None):
        if self._latest_only:
            return _BytesIOWrapper(self)
        else:
            return _BytesIOWrapper(self, name)

    def read(self, name=None):
        if self._latest_only:
            return self._data
        else:
            return self._data[name]

    def write(self, data, name=None):
        if self._latest_only:
            self._data = data
        else:
            self._data[name] = data

    def close(self):
        del self._data

class SQLiteSource:
    pass
