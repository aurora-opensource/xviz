from easydict import EasyDict as edict
import asyncio
import logging
import websockets
from websockets.exceptions import ConnectionClosed

class XVIZServer:
    def __init__(self, handlers, port=3000, per_message_deflate=True):
        '''
        :param handlers: single or list of handlers that acts as function and return a session object, or None if not supported
        '''
        if not handlers:
            raise ValueError("No handler is registered!")
        elif not isinstance(handlers, (list, tuple)):
            self._handlers = [handlers]
        else:
            self._handlers = handlers

        self._logger = logging.getLogger("xviz-server")
        self._connections = []

        compression = "deflate" if per_message_deflate else None
        self._serve_options = dict(ws_handler=self.handle_session,
            host="localhost", port=port, compression=compression)

    async def handle_session(self, socket, request):
        '''
        This function handles all generated connection
        '''
        self._logger.info("[> Connection] created.")
        if "?" in request:
            path, params = request.split("?")
        else:
            path, params = request, ""
        params = [item.split("=") for item in params.split("&") if "=" in item]
        params = edict({k:v for k, v in params})
        params.path = path

        # find proper handler
        for handler in self._handlers:
            session = handler(socket, params)
            if session:
                session.on_connect()
                try:
                    await session.main()
                except ConnectionClosed:
                    self._logger.info("[> Disconnected]")
                    session.on_disconnect()
                finally:
                    return

        await socket.close()
        self._logger.info("[> Connection] closed due to no handler found")

    def serve(self):
        return websockets.serve(**self._serve_options)
