import {Bench} from 'probe.gl/bench';
import {setXVIZConfig} from 'xviz';
import xvizBench from './xviz.bench';

setXVIZConfig({});
const suite = new Bench();

xvizBench(suite);

suite.run();
