import logging

class XVIZBaseSession:
    def __init__(self, socket, request, logger=None):
        self._socket = socket
        self._request = request
        self._logger = logger or logging.getLogger('xviz-server')

    def on_connect(self):
        '''
        This method is called when server is connected and session is generated.
        '''
        raise NotImplementedError("Derived class should implement this method")

    def on_disconnect(self):
        '''
        This method is called when server is disconnected
        '''
        raise NotImplementedError("Derived class should implement this method")

    async def main(self):
        '''
        This method is called as main loop for this session. Do not block this function!
        '''
        raise NotImplementedError("Derived class should implement this method")

class XVIZLogPlaySession(XVIZBaseSession):
    '''
    This class holds a session playing autonomy data from files
    '''
    def __init__(self, socket, request, reader, logger=None):
        super().__init__(socket, request, logger)
        self._reader = reader

    def on_connect(self):
        print("LogPlayer connected!")

    def on_disconnect(self):
        print("LogPlayer disconnected!")

    async def main(self):
        raise NotImplementedError() # TODO: read data and send to client
        