import sys, os, logging
import asyncio, json

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import xviz_avs
from xviz_avs.io import XVIZGLBWriter, DirectorySource

from scenarios.circle import CircleScenario


OUTPUT_DIR = './output/'


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    sink = DirectorySource(OUTPUT_DIR)
    writer = XVIZGLBWriter(sink)
    duration = 10
    scenario = CircleScenario(live=False, duration=duration)
    writer.write_message(scenario.get_metadata())
    t = 0
    while t <= duration:
        message = scenario.get_message(t)
        writer.write_message(message)
        t += 0.2
    writer.close()


if __name__ == "__main__":
    main()
