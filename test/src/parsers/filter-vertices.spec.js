import tape from 'tape-catch';
import {filterVertices} from 'xviz/parsers/filter-vertices';
import {setXvizSettings} from 'xviz';
import PROBLEMATIC_PATH from 'test-data/meter-trajectory-duplicates';

tape('filterVertices', t => {
  setXvizSettings({pathDistanceThreshold: 0.01});
  const path = filterVertices(PROBLEMATIC_PATH);
  setXvizSettings({pathDistanceThreshold: 0.1});

  // Check that path has been reduced, close vertices dropped
  t.equal(path.length, 22, 'filtered length correct');

  // Check that first and last vertex are preserved
  t.deepEqual(path[0], PROBLEMATIC_PATH[0], 'filtered length correct');
  t.deepEqual(
    path[path.length - 1],
    PROBLEMATIC_PATH[PROBLEMATIC_PATH.length - 1],
    'filtered length correct'
  );

  t.end();
});
