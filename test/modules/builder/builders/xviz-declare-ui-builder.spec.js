/* eslint-disable */
import test from 'tape-catch';
import {XvizDeclareUIBuilder} from '@xviz/builder';

console.log(XvizDeclareUIBuilder);

test('XvizDeclareUIBuilder', t => {
  const builder = new XvizDeclareUIBuilder({});

  builder
    .panel('Metrics')
    .container('child-1')

    .metric('child-1-1')
    .title('Acceleration')
    .end()

    .metric('child-1-2')
    .title('Velocity')
    .end()

    .end();

  const expected = [
    {
      type: 'panel',
      children: [
        {
          type: 'container',
          children: [
            {
              type: 'metric',
              title: 'Acceleration'
            },
            {
              type: 'metric',
              title: 'Velocity'
            }
          ]
        }
      ],
      name: 'Metrics'
    }
  ];
  t.deepEqual(builder.getDeclareUI(), expected, 'XvizDeclareUIBuilder should match expectation');

  t.end();
});
