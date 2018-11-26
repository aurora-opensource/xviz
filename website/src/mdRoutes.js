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

export default [
  {
    name: 'Documentation',
    path: '/documentation',
    data: [
      {
        name: 'Overview',
        children: [
          {
            name: 'Introduction',
            markdown: require('../../docs/README.md')
          },
          {
            name: "What's New",
            markdown: require('../../CHANGELOG.md')
          },
          {
            name: 'Versioning',
            markdown: require('../../docs/overview/versioning.md')
          },
          {
            name: 'Concepts',
            markdown: require('../../docs/overview/concepts.md')
          },
          {
            name: 'Conventions',
            markdown: require('../../docs/overview/conventions.md')
          },
          {
            name: 'Roadmap',
            markdown: require('../../docs/overview/roadmap.md')
          },
          {
            name: 'Related Projects',
            markdown: require('../../docs/overview/related.md')
          }
        ]
      },

      {
        name: "Developer's Guide",
        children: [
          {
            name: 'Overview',
            markdown: require('../../docs/developers-guide/README.md')
          },
          {
            name: 'Installing',
            markdown: require('../../docs/developers-guide/installing-xviz.md')
          },
          {
            name: 'Structure of XVIZ Data',
            markdown: require('../../docs/developers-guide/structure-of-xviz.md')
          },
          {
            name: 'Generating XVIZ',
            markdown: require('../../docs/developers-guide/generating-xviz.md')
          },
          {
            name: 'Validating XVIZ',
            markdown: require('../../docs/developers-guide/validating-xviz.md')
          },
          {
            name: 'Serving XVIZ',
            markdown: require('../../docs/developers-guide/serving-xviz.md')
          },
          {
            name: 'Parsing XVIZ',
            markdown: require('../../docs/developers-guide/parsing-xviz.md')
          },
          {
            name: 'Styling XVIZ',
            markdown: require('../../docs/developers-guide/styling-xviz.md')
          },
          {
            name: 'Using the Declarative UI',
            markdown: require('../../docs/developers-guide/using-declarative-ui.md')
          },
          {
            name: 'Using XVIZ without JavaScript',
            markdown: require('../../docs/developers-guide/using-xviz-in-other-languages.md')
          }
        ]
      },

      {
        name: 'Declarative UI',
        children: [
          {
            name: 'Overview',
            markdown: require('../../docs/declarative-ui/overview.md')
          },
          {
            name: 'Layout Types',
            markdown: require('../../docs/declarative-ui/layout-types.md')
          },
          {
            name: 'Interactions',
            markdown: require('../../docs/declarative-ui/interactions.md')
          },
          {
            name: 'Layout Elements',
            markdown: require('../../docs/declarative-ui/layout-elements.md')
          },
          {
            name: 'Components',
            markdown: require('../../docs/declarative-ui/components.md')
          }
        ]
      },

      {
        name: 'Protocol Schema',
        children: [
          {
            name: 'Introduction',
            markdown: require('../../docs/protocol-schema/introduction.md')
          },
          {
            name: 'Core Types',
            markdown: require('../../docs/protocol-schema/core-types.md')
          },
          {
            name: 'Session Protocol',
            markdown: require('../../docs/protocol-schema/session-protocol.md')
          },
          {
            name: 'Geometry Primitives',
            markdown: require('../../docs/protocol-schema/geometry-primitives.md')
          },
          {
            name: 'Styling Specification',
            markdown: require('../../docs/protocol-schema/style-specification.md')
          },
          {
            name: 'UI Primitives',
            markdown: require('../../docs/protocol-schema/ui-primitives.md')
          }
        ]
      },

      {
        name: 'Protocol Implementations',
        children: [
          {
            name: 'JSON Protocol',
            markdown: require('../../docs/protocol-formats/json-protocol.md')
          },
          {
            name: 'Binary Protocol',
            markdown: require('../../docs/protocol-formats/binary-protocol.md')
          }
        ]
      },

      {
        name: 'API Reference',
        children: [
          {
            name: 'XVIZ Configuration',
            markdown: require('../../docs/api-reference/xviz-configuration.md')
          },
          {
            name: 'XVIZ Parsing',
            markdown: require('../../docs/api-reference/parse-xviz.md')
          },
          {
            name: 'XVIZSynchronizer',
            markdown: require('../../docs/api-reference/xviz-synchronizer.md')
          },
          {
            name: 'XVIZLogSlice',
            markdown: require('../../docs/api-reference/xviz-log-slice.md')
          },
          {
            name: 'XVIZObject',
            markdown: require('../../docs/api-reference/xviz-object.md')
          },
          {
            name: 'XVIZObjectCollection',
            markdown: require('../../docs/api-reference/xviz-object-collection.md')
          },
          {
            name: 'XVIZ Loader',
            markdown: require('../../docs/api-reference/xviz-loader.md')
          },
          {
            name: 'XVIZValidator',
            markdown: require('../../docs/api-reference/xviz-validator.md')
          }
        ]
      }
    ]
  }
];
