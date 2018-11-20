import test from 'tape-catch';
import {XVIZUIBuilder} from '@xviz/builder';
import {XVIZValidator} from '@xviz/schema';

const schemaValidator = new XVIZValidator();

function validateUIBuilderOutput(results) {
  for (const name in results) {
    if (results.hasOwnProperty(name)) {
      schemaValidator.validate('declarative-ui/panel', results[name]);
    }
  }
}

test('XVIZBaseUIBuilder', t => {
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

  container.child(metrics1);
  container.child(metrics2);
  builder.child(panel).child(container);

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

  validateUIBuilderOutput(actual);

  t.end();
});

test('XVIZUIBuilder#plot basic', t => {
  const builder = new XVIZUIBuilder({});
  const panel = builder.panel({name: 'Plots'});
  const select1 = builder.plot({
    title: 'Basic Plot',
    independentVariable: '/plan/distance',
    dependentVariables: ['/plan/cost']
  });
  builder.child(panel).child(select1);

  const expected = {
    Plots: {
      name: 'Plots',
      type: 'panel',
      children: [
        {
          type: 'plot',
          title: 'Basic Plot',
          independentVariable: '/plan/distance',
          dependentVariables: ['/plan/cost']
        }
      ]
    }
  };

  const actual = builder.getUI();
  t.deepEqual(actual, expected, 'XVIZUIBuilder should match expectation');

  validateUIBuilderOutput(actual);

  t.end();
});
