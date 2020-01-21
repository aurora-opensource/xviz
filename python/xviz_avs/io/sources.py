'''
This module contains `sources` that can read and write data from certain source by key-value strategy.
Here the source is the combine definition of `source` and `sink` as from xviz JS library.
'''
import os
import io
from collections import defaultdict

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
        self._dir = directory
        assert os.path.isdir(self._dir)

    def open(self, name, mode='r'):
        fpath = os.path.join(self._dir, name)
        if mode == 'r':
            return open(fpath, 'rb')
        elif mode == 'w':
            return open(fpath, 'wb')

    def read(self, name):
        with open(os.path.join(self._dir, name), 'rb') as fin:
            return fin.read()

    def write(self, data, name):
        with open(os.path.join(self._dir, name), 'wb') as fout:
            fout.write(fout, data)

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
