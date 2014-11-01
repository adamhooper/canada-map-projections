var ZoomFactor = 0.9; // scale out a bit, to give prominence to graticules
var GraticuleWidth = 5; // latitude/longitude divisions

/**
 * Returns a Projection: a function that takes (lat,lng) and returns (x,y).
 *
 * @param key String Name of the projection, e.g., 'equirectangular'
 * @param bbox Array Extent of the data, as [ minLng, minLat, maxLng, maxLat ]
 * @param viewport Array Size of the chart, as [ width, height ]
 */
function createProjection(key, bbox, viewport) {
    var dataCenter = [ (bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2 ];
    var dataWidth = bbox[2] - bbox[0];
    var dataHeight = bbox[3] - bbox[1];

    var baseScale = Math.min(viewport[0] / dataWidth, viewport[1] / dataHeight);

    var projection;
    var ignoreCenterLongitude = false;
    var ignoreCenterLatitude = false;

    // Construction (unique to each projection)
    switch (key) {
        case 'equirectangular':
            projection = d3.geo.equirectangular();
            break;
        case 'mercator':
            projection = d3.geo.mercator();
            break;
        case 'lambert-conformal-conic':
            projection = d3.geo.conicConformal()
                .parallels([ 49, 77 ])
                .rotate([ -dataCenter[0], 0 ]);
            ignoreCenterLongitude = true;
            break;
        case 'albers':
            projection = d3.geo.albers()
                .parallels([ 49, 77 ])
                .rotate([ -dataCenter[0], 0 ]);
            ignoreCenterLongitude = true;
            break;
        case 'orthographic':
            projection = d3.geo.orthographic()
                .clipAngle(90)
                .rotate([ -dataCenter[0], -dataCenter[1] ]);
            ignoreCenterLongitude = true;
            ignoreCenterLatitude = true;
            break;
    }

    // Center and scale such that the viewport contains the bounding box
    var DummyScale = 150;
    projection = projection.scale(DummyScale);
    var xy1 = projection([ bbox[0], bbox[3] ]); // northwest, (0,0) in graphic
    var xy2 = projection([ bbox[2], bbox[1] ]); // southeast, (1,1)
    var xyCenter = [ (xy1[0] + xy2[0]) / 2, (xy1[1] + xy2[1]) / 2 ];
    // Lambert and Orthographic don't turn this into a rectangle. We need to
    // include all points in the bounding box just to maintain symmetry. Then
    // we need the mid-south point, too.
    var xy3 = projection([ bbox[0], bbox[1] ]); // southwest, (0,1)
    var xy4 = projection([ bbox[2], bbox[3] ]); // northeast, (1,0)
    var xy5 = projection([ (bbox[0] + bbox[2]) / 2, bbox[1] ]); // (0.5,1)

    var xMin = Math.min(xy1[0], xy2[0], xy3[0], xy4[0], xy5[0]);
    var xMax = Math.max(xy1[0], xy2[0], xy3[0], xy4[0], xy5[0]);
    var yMin = Math.min(xy1[1], xy2[1], xy3[1], xy4[1], xy5[1]);
    var yMax = Math.max(xy1[1], xy2[1], xy3[1], xy4[1], xy5[1]);

    var xySize = [ xMax - xMin, yMax - yMin ];
    var center = projection.invert(xyCenter);
    var scale = Math.min(viewport[0] / xySize[0], viewport[1] / xySize[1]) * DummyScale;

    scale *= ZoomFactor;

    return projection
        .center([ ignoreCenterLongitude ? 0 : center[0], ignoreCenterLatitude ? 0 : center[1] ])
        .scale(scale)
        .translate([ viewport[0] / 2, viewport[1] / 2])
        .precision(0.2);
}

/**
 * Returns "(40°W, 20°N)" given [-40,20].
 */
function lngLatToText(lngLat) {
  var we = lngLat[0] < 0 ? 'W' : 'E';
  var ns = lngLat[1] < 0 ? 'S' : 'N';
  var lng = Math.abs(lngLat[0]);
  var lat = Math.abs(lngLat[1]);

  return "(" + lng + "°" + we + ", " + lat + "°" + ns + ")";
}

/**
 * Returns the bounding box of the given topojson objects as
 * `[ sw.lng, sw.lat, ne.lng, ne.lat ]`.
 */
function findBoundingBox(json) {
    var bbox = [ null, null, null, null ];

    for (var key in json.objects) {
        var curBbox = json.objects[key].bbox;
        if (bbox[0] === null || curBbox[0] < bbox[0]) bbox[0] = curBbox[0];
        if (bbox[1] === null || curBbox[1] < bbox[1]) bbox[1] = curBbox[1];
        if (bbox[2] === null || curBbox[2] > bbox[2]) bbox[2] = curBbox[2];
        if (bbox[3] === null || curBbox[3] > bbox[3]) bbox[3] = curBbox[3];
    }

    return bbox;
}

/**
 * Adds a point and label to the SVG.
 *
 * @param svg SVGElement SVG we're working on
 * @param lngLat Array [lng, lat] coordinates of the point
 * @param projection Function Projection to arrive at screen coordinates
 * @param text Function Function that takes ([lng, lat]) and returns a text label
 * @param textXOffset Number X offset of the text (e.g., "-6" moves it left six pixels)
 * @param className String class name of the text
 */
function addPointAndTextToSvg(svg, lngLat, projection, text, textXOffset, className) {
  svg.append('circle', '.graticule')
    .attr('class', 'point')
    .datum(lngLat)
    .attr('cx', function(d) { return projection(d)[0]; })
    .attr('cy', function(d) { return projection(d)[1]; })
    .attr('r', 4);

  svg.append('text', '.graticule')
    .attr('class', className + ' shadow') // Helps make the text pop
    .datum(lngLat)
    .attr('x', function(d) { return projection(d)[0] + textXOffset; })
    .attr('y', function(d) { return projection(d)[1]; })
    .text(text);

  svg.append('text', '.graticule')
    .attr('class', className)
    .datum(lngLat)
    .attr('x', function(d) { return projection(d)[0] + textXOffset; })
    .attr('y', function(d) { return projection(d)[1]; })
    .text(text);
}

/**
 * Appends an `<svg>` element to `parentEl`.
 *
 * @param parentEl HTMLElement Element to which the SVG should be appended
 * @param projectionKey String Name of the projection, e.g., 'equirectangular'
 * @param json Object Topojson object (every geometry within it will be added to the SVG)
 */
function jsonToSvg(parentEl, projectionKey, json) {
    var width = 500;
    var height = 400;

    var bbox = findBoundingBox(json);
    var projection = createProjection(projectionKey, bbox, [ width, height ]);

    var path = d3.geo.path().projection(projection);
    var graticule = d3.geo.graticule()
      .extent([[ -180, 0 ], [ 180, 90 ]]) // otherwise Conic SVG breaks rsvg
      .step([ 5, 5 ]);

    var svg = d3.select(parentEl).append('svg')
        .attr('viewBox', '0 0 ' + width + ' ' + height);

    svg.append('path')
        .datum(graticule)
        .attr('class', 'graticule')
        .attr('d', path);

    for (var key in json.objects) {
        svg.append('path', '.graticule')
            .datum(topojson.feature(json, json.objects[key]))
            .attr('class', 'province')
            .attr('d', path);
    }

    var sw = projection.invert([ 40, height  - 40]);
    sw = [
      Math.ceil(sw[0] / GraticuleWidth) * GraticuleWidth,
      Math.ceil(sw[1] / GraticuleWidth) * GraticuleWidth
    ];
    addPointAndTextToSvg(svg, sw, projection, lngLatToText, 6, 'point sw');

    var ne = projection.invert([ width - 40, 40 ]);
    ne = [
      Math.floor(ne[0] / GraticuleWidth) * GraticuleWidth,
      Math.floor(ne[1] / GraticuleWidth) * GraticuleWidth
    ];
    if (ne[0] != sw[0] || ne[1] != sw[1]) {
      addPointAndTextToSvg(svg, ne, projection, lngLatToText, -6, 'point ne');
    }

    return svg;
}

/**
 * Reads form values and fills in the map with them.
 */
function refreshMapFromForm() {
  var regionFile = $('#select-region-file').val();

  var $projectionOption = $('#select-projection option:selected');
  var projection = $projectionOption.attr('value');
  var description = $projectionOption.attr('data-description');
  var wikipediaHref = $projectionOption.attr('data-wikipedia-href');

  var $result = $('#result');
  $result.find('.description').text(description);
  $result.find('.wikipedia-info').attr('href', wikipediaHref);

  setCurrentMap(regionFile, projection);
}

var state = {
  fileToXhr: {},
  fileToJson: {},
  wantedRegionFile: '', // Region/projection that the user selected
  wantedProjection: '',
  regionFile: '', // Region/projection we are currently displaying
  projection: ''  // (requests are asynchronous, so it could be different)
};

/**
 * Sets the current map (in #result .map).
 *
 * If the map file has not been loaded, loads it.
 */
function setCurrentMap(regionFile, projection) {
  state.wantedRegionFile = regionFile;
  state.wantedProjection = projection;

  if (regionFile == state.regionFile && projection == state.currentProjection) return;

  if (state.fileToJson.hasOwnProperty(regionFile)) {
    // We've already loaded the JSON. Show the map.
    state.regionFile = regionFile;
    state.currentProjection = projection;

    var $map = $('#result .map');
    $map.empty();
    jsonToSvg($map[0], projection, state.fileToJson[regionFile]);
  } else if (state.fileToXhr.hasOwnProperty(regionFile)) {
    // We are currently loading the JSON. Do nothing.
  } else {
    state.fileToXhr[regionFile] = d3.json(regionFile, function(err, json) {
      // This part gets called sometime in the future. We don't care about
      // projection any more, and we're not sure regionFile is still the
      // selected one.
      if (err) {
        console.log(err);
        $('#result .map').html('<div class="error">Error loading map</div>');
        delete state.fileToXhr[regionFile]; // so we can try again
      } else {
        state.fileToJson[regionFile] = json;
        // We got the JSON; show it if it's still the selected region, in the
        if (regionFile == state.wantedRegionFile) {
          state.regionFile = state.wantedRegionFile;
          state.projection = state.wantedProjection;

          var $map = $('#result .map');
          $map.empty();
          jsonToSvg($map[0], state.projection, json);
        }
      }
    });
  }
}

$(function() {
  // Call refreshMapFromForm() whenever anything happens in the form

  var $form = $('form#parameters');
  $form.find('select').on('click change keyup', function() {
    $form.submit();
  });

  $form.on('submit', function(e) {
    e.preventDefault();
    refreshMapFromForm();
  });

  refreshMapFromForm();

  $('select[name=projection]').focus(); // So the "up" and "down" arrows work
});
