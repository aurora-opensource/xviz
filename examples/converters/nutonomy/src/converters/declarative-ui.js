import {XVIZUIBuilder} from '@xviz/builder';

export function getDeclarativeUI() {
  const builder = new XVIZUIBuilder({});

  builder.child(getPlotPanel(builder));
  builder.child(getVideoPanel(builder));
  builder.child(getTablePanel(builder));

  return builder;
}

function getPlotPanel(builder) {
  const panel = builder.panel({
    name: 'Planning'
  });

  const plot = builder.plot({
    title: 'Cost',
    description: 'Costs considered in planning the vehicle trajectory',
    independentVariable: '/motion_planning/time',
    dependentVariables: [
      '/motion_planning/trajectory/cost/cost1',
      '/motion_planning/trajectory/cost/cost2',
      '/motion_planning/trajectory/cost/cost3'
    ]
  });

  panel.child(plot);

  return panel;
}

function getVideoPanel(builder) {
  const panel = builder.panel({
    name: 'Camera'
  });

  const video = builder.video({
    cameras: [
      '/camera/cam_front',
      '/camera/cam_front_left',
      '/camera/cam_front_right',
      '/camera/cam_back',
      '/camera/cam_back_left',
      '/camera/cam_back_right'
    ]
  });

  panel.child(video);

  return panel;
}

function getTablePanel(builder) {
  const panel = builder.panel({
    name: 'Perception'
  });

  const table = builder.treetable({
    title: 'Perception',
    description: 'Objects identified by perception',
    stream: '/perception/objects/table',
    displayObjectId: true
  });

  panel.child(table);

  return panel;
}
