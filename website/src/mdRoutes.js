export default [{
  name: 'Documentation',
  path: '/documentation',
  data: [{
    name: 'Overview',
    children: [{
      name: 'Introduction',
      markdown: require('../../docs/README.md')
    }, {
      name: 'What\'s New',
      markdown: require('../../CHANGELOG.md')
    }, {
      name: 'Versioning',
      markdown: require('../../docs/overview/versioning.md')
    }, {
      name: 'Concepts',
      markdown: require('../../docs/overview/concepts.md')
    }, {
      name: 'Conventions',
      markdown: require('../../docs/overview/conventions.md')
    }, {
      name: 'Roadmap',
      markdown: require('../../docs/overview/roadmap.md')
    }]
  }, {
    name: 'Protocol Schema',
    children: [{
      name: 'Core Protocol',
      markdown: require('../../docs/protocol-schema/core-protocol.md')
    }, {
      name: 'Session Protocol',
      markdown: require('../../docs/protocol-schema/session-protocol.md')
    }, {
      name: 'Geometry Primitives',
      markdown: require('../../docs/protocol-schema/geometry-primitives.md')
    }, {
      name: 'Panel Specification',
      markdown: require('../../docs/protocol-schema/panel-specification.md')
    }, {
      name: 'Styling Specification',
      markdown: require('../../docs/protocol-schema/style-specification.md')
    }]
  }, {
    name: 'Protocol Implementations',
    children: [{
      name: 'JSON Protocol',
      markdown: require('../../docs/protocol-formats/json-protocol.md')
    }, {
      name: 'Binary Protocol',
      markdown: require('../../docs/protocol-formats/binary-protocol.md')
    }]
  }, {
    name: 'API Reference',
    children: [{
      name: 'Xviz Configuration',
      markdown: require('../../docs/api-reference/xviz-configuration.md')
    }, {
      name: 'Xviz Parsing',
      markdown: require('../../docs/api-reference/parse-xviz.md')
    }, {
      name: 'XvizSynchronizer',
      markdown: require('../../docs/api-reference/xviz-synchronizer.md')
    }, {
      name: 'XvizLogSlice',
      markdown: require('../../docs/api-reference/xviz-log-slice.md')
    }, {
      name: 'XvizStylesheet',
      markdown: require('../../docs/api-reference/xviz-stylesheet.md')
    }, {
      name: 'XvizObject',
      markdown: require('../../docs/api-reference/xviz-object.md')
    }, {
      name: 'XvizObjectCollection',
      markdown: require('../../docs/api-reference/xviz-object-collection.md')
    }, {
      name: 'XVIZ Loader',
      markdown: require('../../docs/api-reference/xviz-loader.md')
    }]
  }, {
    name: 'Developer\'s Guide',
    children: [{
      name: 'Overview',
      markdown: require('../../docs/developers-guide/README.md')
    }, {
      name: 'Installing',
      markdown: require('../../docs/developers-guide/installing-xviz.md')
    }, {
      name: 'Structure of XVIZ Data',
      markdown: require('../../docs/developers-guide/structure-of-xviz.md')
    }, {
      name: 'Generating XVIZ',
      markdown: require('../../docs/developers-guide/generating-xviz.md')
    }, {
      name: 'Serving XVIZ',
      markdown: require('../../docs/developers-guide/serving-xviz.md')
    }, {
      name: 'Parsing XVIZ',
      markdown: require('../../docs/developers-guide/parsing-xviz.md')
    }, {
      name: 'Styling XVIZ',
      markdown: require('../../docs/developers-guide/styling-xviz.md')
    }, {
      name: 'Using the Declarative UI',
      markdown: require('../../docs/developers-guide/using-declarative-ui.md')
    }, {
      name: 'Using XVIZ without JavaScript',
      markdown: require('../../docs/developers-guide/using-xviz-in-other-languages.md')
    }]
  }]
}];
