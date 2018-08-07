import {Bench} from 'probe.gl/bench';
import {setXvizConfig} from 'xviz';
import xvizBench from './xviz.bench';

setXvizConfig({});
const suite = new Bench();

xvizBench(suite);

suite.run();
