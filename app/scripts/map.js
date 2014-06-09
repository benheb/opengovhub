var width = $(window).width(),
    height = $(window).height();

$('#map').css('height', height+'px');

var projection = d3.geo.mercator()
    .scale(200)
    .translate([width / 2, height / 2])
    .center([0, 33])
    .precision(.1);

/*
var projection = d3.geo.orthographic()
    .scale(500)
    .translate([width / 2, height / 2])
    .center([0, 10])
    .rotate([20, 0])
    .clipAngle(90)
    .precision(.1);
*/
var path = d3.geo.path()
    .projection(projection);

var graticule = d3.geo.graticule();

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("defs").append("path")
    .datum({type: "Sphere"})
    .attr("id", "sphere")
    .attr("d", path);

svg.append("use")
    .attr("class", "stroke")
    .attr("xlink:href", "#sphere");

svg.append("use")
    .attr("class", "fill")
    .attr("xlink:href", "#sphere");

svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);

d3.json("data/world-110.json", function(error, world) {
  svg.insert("path", ".graticule")
      .datum(topojson.feature(world, world.objects.land))
      .attr("class", "land")
      .attr("d", path);

  svg.insert("path", ".graticule")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);

  drawLines();
});

function drawLines() {
  
  d3.json("http://koop.dc.esri.com/github/benheb/geodata/govhub", function(error, data) {
    if (error) return console.error(error);
    
    var i = 0;
    iterate();
    function iterate() {
      var renderInterval = setInterval(function() {
        var generator = null;
        var start = { x: data[0].features[0].geometry.coordinates[0], y: data[0].features[0].geometry.coordinates[1] };
        var end = { x: data[0].features[i].geometry.coordinates[0], y: data[0].features[i].geometry.coordinates[1] };
        generator = new arc.GreatCircle(start, end);
        var line = generator.Arc(100,{offset:10});
        
        //console.log('line', start, end);

        if ( i !== 0 ) {
          console.log('cnt')
          line.geometries[0].coords.forEach(function(cord, f) {

            var pts = projection([cord[0], cord[1]]);
            var s = projection([ 
              line.geometries[0].coords[f - 1] ? line.geometries[0].coords[f - 1][0] : data[0].features[0].geometry.coordinates[0], 
              line.geometries[0].coords[f - 1] ? line.geometries[0].coords[f - 1][1] : data[0].features[0].geometry.coordinates[1]
            ]);

            var l = svg.append("line")
            .attr("stroke", '#ff7fff')
            .attr('stroke-width', 0.9)
            .attr('class', 'intro-lines')
            .attr("x1", s[0])
            .attr("y1", s[1])
            .attr("x2", s[0])
            .attr("y2", s[1])
            .transition()
            .duration(2000)
              .attr("x2", pts[0])
              .attr("y2", pts[1]);

          });
        }

        drawPoint(data[0].features[i])
        //transitionGlobe(data[0].features[i]);

        var len = data[0].features.length - 1;
        i++;
        if ( i === len ) {
          clearInterval(renderInterval);
          $('.intro-lines').remove();
          $('.location').remove();
          i = 0;
          iterate();
        }

      }, 5000);
    }
    

  });
}

function drawPoint(point) {
  
  $('#country').html(point.properties.country);
  $('#info').html("Type: " + point.properties.type);

  svg.selectAll("circles.points")
    .data([ point ])
  .enter().append("circle")
    .attr("r",6)
    .attr('class', 'location')
    .attr('opacity', 0)
    .attr("transform", function(d) {return "translate(" + projection([d.geometry.coordinates[0],d.geometry.coordinates[1]]) + ")";})
    .transition()
    .duration(500)
      .attr('opacity', 1);

}

function transitionGlobe(point) {
  var ll = projection([point.geometry.coordinates[0],point.geometry.coordinates[1]]);
  console.log('ll', ll);
  d3.transition()
    .duration(1250)
    .tween("rotate", function() {
      //var p = d3.geo.centroid(countries[i]),
      var r = d3.interpolate(projection.rotate(), ll);
      return function(t) {
        projection.rotate(r(t));
        svg.selectAll('path').attr('d', path)
      };
    })
}