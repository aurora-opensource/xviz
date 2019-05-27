// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* eslint-disable camelcase */
const CATEGORY_BUILDER_COMMAND = {
  variable: 'variable',
  ui_primitive: 'uiPrimitive'
};

/**
 * This class generates random data for use in the Declarative UI examples
 */
export default class RandomDataGenerator {
  constructor() {
    this.streams = {
      '/motion_planning/time': {
        category: 'variable',
        type: 'float',
        unit: 's'
      },
      '/motion_planning/trajectory/cost/cost1': {
        category: 'variable',
        type: 'float'
      },
      '/motion_planning/trajectory/cost/cost2': {
        category: 'variable',
        type: 'float'
      },
      '/motion_planning/trajectory/cost/cost3': {
        category: 'variable',
        type: 'float'
      },
      '/perception/objects/table': {
        category: 'ui_primitive',
        type: 'treetable',
        columns: [
          {
            display_text: 'Object ID',
            type: 'string'
          },
          {
            display_text: 'Size',
            type: 'float'
          },
          {
            display_text: 'Velocity',
            type: 'float'
          },
          {
            display_text: 'Acceleration',
            type: 'float'
          }
        ]
      }
    };
  }

  load() {}

  async convertMessage(messageNumber, xvizBuilder) {
    for (const streamName in this.streams) {
      const info = this.streams[streamName];
      const builder = xvizBuilder[CATEGORY_BUILDER_COMMAND[info.category]](streamName);

      if (streamName.indexOf('time') > 0) {
        builder.values(Array.from({length: 10}, (d, i) => i));
      } else if (info.category === 'variable') {
        const mean = Math.random() * 5;
        const deviation = Math.random() * 2;
        builder.values(Array.from({length: 10}, () => mean + Math.random(deviation)));
      } else if (info.type === 'treetable') {
        builder.treetable(info.columns);
        makeRandomTableData(builder, {columns: info.columns, maxNodes: 1000, maxDepth: 3});
      }
    }
  }

  getMetadata(xvizMetaBuilder) {
    // You can see the type of metadata we allow to define.
    // This helps validate data consistency and has automatic
    // behavior tied to the viewer.
    const xb = xvizMetaBuilder;

    for (const streamName in this.streams) {
      const info = this.streams[streamName];
      xb.stream(streamName)
        .category(info.category)
        .type(info.type);

      if (info.unit) {
        xb.unit(info.unit);
      }
    }
  }
}

// creates random table data
// opts.columns {array}
// opts.maxNodes {number}
// opts.maxDepth {number}
function makeRandomTableData(builder, opts, depth = 0, stats = {count: 0}) {
  const {maxDepth = 1, maxNodes = 100} = opts;

  if (depth > maxDepth) {
    return;
  }

  const n = Math.pow(maxNodes, 1 / maxDepth) * Math.random();

  for (let i = 0; i < n; i++) {
    const id = `node-${stats.count}`;

    const command = depth ? 'child' : 'row';
    const row = builder[command](id, makeRandomColumnValues(opts.columns));
    stats.count++;

    makeRandomTableData(row, opts, depth + 1, stats);
  }
}

function makeRandomColumnValues(columns) {
  return columns.map(col => {
    switch (col.type) {
      case 'string':
        return Math.random()
          .toString(16)
          .slice(2);

      case 'float':
        return Math.random() * 100;

      case 'integer':
        return Math.round(Math.random() * 1e5);

      default:
        return null;
    }
  });
}
