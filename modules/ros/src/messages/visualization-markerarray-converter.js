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
/* eslint-disable camelcase, no-invalid-this */
import Converter from './converter';
import _ from 'lodash';
import {Vector3} from 'math.gl';

const ACTION_ADD = 0;
const ACTION_DELETE = 2;
const ACTION_DELETE_ALL = 3;

const NAMESPACE_SEPARATOR = '/';

/**
 * Handles converting MarkerArray messages
 */
export class VisualizationMarkerArray extends Converter {
  constructor(config) {
    // acceptMarker /* Function to filter the markers to use (if not defined, uses all markers) */
    super(config);
    this.acceptMarker = this.config.acceptMarker || (() => true);

    this.markersMap = {};

    this.ARROW_STREAM = [this.xvizStream, 'arrow'].join(NAMESPACE_SEPARATOR);
    this.SPHERE_STREAM = [this.xvizStream, 'sphere'].join(NAMESPACE_SEPARATOR);
    this.LINESTRIP_STREAM = [this.xvizStream, 'linestrip'].join(NAMESPACE_SEPARATOR);
    this.LINELIST_STREAM = [this.xvizStream, 'linelist'].join(NAMESPACE_SEPARATOR);
    this.TEXT_STREAM = [this.xvizStream, 'text'].join(NAMESPACE_SEPARATOR);
  }

  static get name() {
    return 'VisualizationMarkerArray';
  }

  static get messageType() {
    return 'visualization_msgs/MarkerArray';
  }

  convertMessage(frame, xvizBuilder) {
    const messages = frame[this.topic];
    if (messages) {
      for (const {message} of messages) {
        message.markers.forEach(marker => this._processMarker(marker));
      }
    }

    this.writeMarkers(xvizBuilder);
  }

  getMetadata(xvizMetaBuilder) {
    xvizMetaBuilder
      .stream(this.ARROW_STREAM)
      .coordinate('IDENTITY')
      .category('primitive')
      .type('polyline')

      .stream(this.LINESTRIP_STREAM)
      .coordinate('IDENTITY')
      .category('primitive')
      .type('polyline')
      .streamStyle({
        stroke_width: 0.2,
        stroke_width_min_pixels: 1
      })

      .stream(this.LINELIST_STREAM)
      .coordinate('IDENTITY')
      .category('primitive')
      .type('polyline')
      .streamStyle({
        stroke_width: 0.2,
        stroke_width_min_pixels: 1
      })

      .stream(this.SPHERE_STREAM)
      .coordinate('IDENTITY')
      .category('primitive')
      .type('circle')
      .streamStyle({
        stroke_width: 0.2
      })

      .stream(this.TEXT_STREAM)
      .category('primitive')
      .type('text')
      .streamStyle({
        size: 18,
        fill_color: '#0000FF'
      });
  }

  writeMarkers(xvizBuilder) {
    /* Unimplemented markers
    uint8 CUBE=1
    uint8 CYLINDER=3
    uint8 CUBE_LIST=6
    uint8 SPHERE_LIST=7
    uint8 POINTS=8
    uint8 MESH_RESOURCE=10
    uint8 TRIANGLE_LIST=11
    */

    const WRITERS = {
      '0': this._writeArrow.bind(this),
      '2': this._writeSphere.bind(this),
      '4': this._writeLineStrip.bind(this),
      '5': this._writeLineList.bind(this),
      '9': this._writeText.bind(this)
    };

    /*
    const writerName = {
      '0': 'Arrow',
      '2': 'Sphere',
      '4': 'LineStrip',
      '5': 'LineList',
      '9': 'Text'
    };
    */

    _.forOwn(this.markersMap, marker => {
      const writer = WRITERS[marker.type];
      if (writer) {
        writer(marker, xvizBuilder);
      }
    });
  }

  _writeArrow(marker, xvizBuilder) {
    const points = this._makeArrow(marker.points, marker.pose);
    xvizBuilder
      .primitive(this.ARROW_STREAM)
      .polyline(points)
      .style({stroke_color: this._toColor(marker)})
      .id(this._getMarkerId(marker));
  }

  _writeSphere(marker, xvizBuilder) {
    const RADIUS = marker.scale.x / 2;
    const points = this._mapPoints([{x: 0, y: 0, z: 0}], marker.pose);

    xvizBuilder
      .primitive(this.SPHERE_STREAM)
      .circle(points[0], RADIUS)
      .style({fill_color: this._toColor(marker)})
      .id(this._getMarkerId(marker));
  }

  _writeLineStrip(marker, xvizBuilder) {
    xvizBuilder
      .primitive(this.LINESTRIP_STREAM)
      .polyline(this._mapPoints(marker.points, marker.pose))
      .style({stroke_color: this._toColor(marker)})
      .id(this._getMarkerId(marker));
  }

  _writeLineList(marker, xvizBuilder) {
    const lines = _.chunk(marker.points, 2);
    lines.forEach((line, index) => {
      xvizBuilder
        .primitive(this.LINELIST_STREAM)
        .polyline(this._mapPoints(line, marker.pose))
        .style({stroke_color: this._toColor(marker)})
        .id([this._getMarkerId(marker), index].join(NAMESPACE_SEPARATOR));
    });
  }

  _writeText(marker, xvizBuilder) {
    const points = this._mapPoints(
      [
        {x: 0, y: 0, z: 2} // z=2 to float above
      ],
      marker.pose
    );

    xvizBuilder
      .primitive(this.TEXT_STREAM)
      .position(points[0])
      .text(marker.text);
  }

  _toColor(marker) {
    const color = marker.color || (marker.colors || [])[0];
    if (color) {
      return [color.r, color.g, color.b, color.a].map(v => Math.round(v * 255));
    }

    return [128, 128, 128, 255]; // default color
  }

  _mapPoints(points, pose) {
    const origin = new Vector3([pose.position.x, pose.position.y, 0]);

    return points.map(p => {
      p = [p.x, p.y, 0];
      return origin
        .clone()
        .add(p)
        .toArray();
    });
  }

  _makeVector(p) {
    const v = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]];
    return v;
  }

  _makePoint(base, vector) {
    const v = [base[0] + vector[0], base[1] + vector[1], base[2] + vector[2]];
    return v;
  }

  _makeArrow(points, pose) {
    const p = this._mapPoints(points, pose);

    // vector pointing to starting point
    const vecA = new Vector3(this._makeVector([p[1], p[0]]));

    const pCrossVec = vecA.clone().scale(0.3);
    const pCross = this._makePoint(p[1], pCrossVec.toArray());

    vecA.scale(0.5);
    const vecB = vecA.clone();

    const leftPt = this._makePoint(p[1], vecB.rotateZ({radians: -Math.PI / 4}).toArray());
    const rightPt = this._makePoint(p[1], vecA.rotateZ({radians: Math.PI / 4}).toArray());

    p.push(p[1]);

    return [p[0], pCross, leftPt, p[1], rightPt, pCross];
  }

  _processMarker(marker) {
    const markerId = this._getMarkerId(marker);

    if (marker.action === ACTION_ADD) {
      // We only run the acceptMarker filter for ADD because we want to avoid accidentally filtering
      // out DELETE messages. It's safe to process all DELETE messages because worse case they're just a noop
      // if they don't apply
      if (this.acceptMarker(marker)) {
        this.markersMap[markerId] = marker;
      }
    } else if (marker.action === ACTION_DELETE) {
      if (!marker.ns) {
        this.markersMap = {};
      } else {
        this.markersMap = _.pickBy(this.markersMap, (value, key) => {
          // Using `startsWith` to support removing entire namespaces when an id isn't specified
          return !key.startsWith(markerId);
        });
      }
    } else if (marker.action === ACTION_DELETE_ALL) {
      this.markersMap = {};
    }
  }

  _getMarkerId(marker) {
    return [marker.ns, marker.id].join(NAMESPACE_SEPARATOR);
  }
}
