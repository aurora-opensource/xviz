import os
from .sessions import XVIZLogPlaySession

class XVIZLogPlayHandler:
    def __init__(self, root=None):
        '''
        :param root: root path of the files
        '''
        self._root = root

    def __call__(self, socket, request):
        directory = os.path.join(self._root, request.path) if self._root else request.path
        reader = None # XXXReader(directory)
        session = XVIZLogPlaySession(socket, request, reader)
        return session
