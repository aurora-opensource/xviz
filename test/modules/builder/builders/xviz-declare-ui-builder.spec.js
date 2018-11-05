import test from 'tape-catch';
import {XVIZUIBuilder} from '@xviz/builder';

test('XvizBaseUIBuilder', t => {
  const builder = new XVIZUIBuilder({});

  const panel = builder.panel({name: 'Metrics Panel'});
  const container = builder.container({name: 'Metrics Container 1'});
  const metrics1 = builder.metric({
    streams: ['/vehicle/velocity'],
    title: 'Velocity'
  });
  const metrics2 = builder.metric({
    streams: ['/vehicle/acceleration'],
    title: 'Acceleration'
  });

  container.child(metrics1).child(metrics2);
  panel.child(container);
  builder.child(panel);

  const expected = {
    'Metrics Panel': {
      type: 'panel',
      children: [
        {
          type: 'container',
          children: [
            {
              type: 'metric',
              streams: ['/vehicle/velocity'],
              title: 'Velocity'
            },
            {
              type: 'metric',
              streams: ['/vehicle/acceleration'],
              title: 'Acceleration'
            }
          ],
          name: 'Metrics Container 1'
        }
      ],
      name: 'Metrics Panel'
    }
  };

  const actual = builder.getUI();
  t.deepEqual(actual, expected, 'XVIZUIBuilder should match expectation');

  t.end();
});
