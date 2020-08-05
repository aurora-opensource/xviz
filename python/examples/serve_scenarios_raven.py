import sys, os, logging
import asyncio, json

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import xviz
from xviz.builder import XVIZBuilder, XVIZMetadataBuilder
from xviz.server import XVIZServer, XVIZBaseSession

#from scenarios.collector_output import CollectorScenario
from scenarios.circle import CircleScenario


SCENARIO_DICT = {
    #"CollectorScenario": CollectorScenario,
    "CircleScenario": CircleScenario
}


class ScenarioSession(XVIZBaseSession):
    def __init__(self, socket, request, argv):
        super().__init__(socket, request)

        scenario_key = argv[0]

        if scenario_key not in SCENARIO_DICT:
            raise Exception("Key does not exist in SCENARIO DICT:", scenario_key)
        else:
            print("Starting server with:", scenario_key)
            scenario=SCENARIO_DICT[scenario_key]()

        self._scenario = scenario
        self._socket = socket

    def on_connect(self):
        print("Connected!")

    def on_disconnect(self):
        print("Disconnect!")

    async def main(self):
        metadata = self._scenario.get_metadata()
        await self._socket.send(json.dumps(metadata))

        t = 0
        while True:
            message = self._scenario.get_message(t)
            await self._socket.send(json.dumps(message))

            t += 0.5
            await asyncio.sleep(0.01)

class ScenarioHandler:
    def __init__(self, argv):
        self.argv = argv
        pass

    def __call__(self, socket, request):
        return ScenarioSession(socket, request, self.argv)

if __name__ == "__main__":
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)
    logging.getLogger("xviz-server").addHandler(handler)

    print("GOT ARGS:", sys.argv[1:])
    server = XVIZServer(ScenarioHandler(sys.argv[1:]), port=8081)
    loop = asyncio.get_event_loop()
    loop.run_until_complete(server.serve())
    loop.run_forever()
