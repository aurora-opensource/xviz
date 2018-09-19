/* eslint-disable */
import test from 'tape-catch';
import { XvizUIBuilder } from '@xviz/builder';

console.log(XvizUIBuilder);

test('XvizBaseUIBuilder', t => {
  const builder = new XvizUIBuilder({});

  builder
    .panel()
    .name('Metrics')
    .children()

    .container()
    .children()

    .metric()
    .title('Velocity')
    .done()

    .metric()
    .title('Acceleration')
    .done()

    .done();


  const expected = [
    {
      type: 'panel',
      children: [
        {
          type: 'container',
          children: [
            {
              type: 'metric',
              title: 'Velocity'
            },
            {
              type: 'metric',
              title: 'Acceleration'
            }
          ]
        }
      ],
      name: 'Metrics'
    }
  ];

  const actual = builder.getUI();
  t.deepEqual(actual, expected, 'XvizUIBuilder should match expectation');

  t.end();
});
