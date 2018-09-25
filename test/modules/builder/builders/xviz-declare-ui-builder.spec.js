/* eslint-disable */
import test from 'tape-catch';
import {XvizUIBuilder} from '@xviz/builder';

console.log(XvizUIBuilder);

test('XvizBaseUIBuilder', t => {
  const builder = new XvizUIBuilder({});

  builder
    .panelLeft({
      name: 'Metrics Panel'
    })
    .children()

    .containerLeft({
      name: 'Metrics Container 1'
    })
    .children()

    .metricLeft({
      streams: ['/vehicle/velocity']
    })
    .title('Velocity')
    .metricRight()

    .metricLeft({
      streams: ['/vehicle/acceleration']
    })
    .title('Acceleration')
    .metricRight()

    .containerRight()
    .panelRight();

  const expected = [
    {
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
  ];

  const actual = builder.getUI();
  t.deepEqual(actual, expected, 'XvizUIBuilder should match expectation');

  t.end();
});
