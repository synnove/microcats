// create map
var map = L.map('map').setView([-27.4995, 153.0145], 18);

//L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png', {
//    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
//    subdomains: ['a','b','c','d'],
//    mapId: 'xaellia.pblg62p6',
//    token: 'pk.eyJ1IjoieGFlbGxpYSIsImEiOiJjaWxicm8xbGYxamNldWdrbmZuaWE2bXRyIn0.g_PnYml4Xiw7-SFPKHL9bg'
//}).addTo(map);

L.tileLayer('https://api.tiles.mapbox.com/v4/xaellia.pblg62p6/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoieGFlbGxpYSIsImEiOiJjaWxicm8xbGYxamNldWdrbmZuaWE2bXRyIn0.g_PnYml4Xiw7-SFPKHL9bg', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    subdomains: ['a','b','c','d'],
    mapId: 'xaellia.pblg62p6',
    token: 'pk.eyJ1IjoieGFlbGxpYSIsImEiOiJjaWxicm8xbGYxamNldWdrbmZuaWE2bXRyIn0.g_PnYml4Xiw7-SFPKHL9bg'
}).addTo(map);

// create sensor icons
d3.json("https://microcats.uqcloud.net/stations", function (data) {
  var active = L.icon({
      iconUrl: 'https://microcats.uqcloud.net/img/active.gif',
      //shadowUrl: 'leaf-shadow.png',
      iconSize:     [50, 50],
      shadowSize:   [50, 30],
      iconAnchor:   [25, 25],
      shadowAnchor: [18, 15],
      popupAnchor:  [-5, -10]
  });

  var inactive = L.icon({
      iconUrl: 'https://microcats.uqcloud.net/img/inactive.gif',
      //shadowUrl: 'leaf-shadow.png',
      iconSize:     [50, 50],
      shadowSize:   [50, 30],
      iconAnchor:   [25, 25],
      shadowAnchor: [18, 15],
      popupAnchor:  [-5, -10]
  });

  data.stations.forEach(function(station) {
    var now = new Date();
    var last = new Date(station.last_contact);

    var station_info = "<div class='row text-center'>";
    station_info += "<a href='https://microcats.uqcloud.net/" + station.name + 
		    "'><i class='fi-info large'></i></a><br>";
    station_info += "</div>";
    station_info += "Name: " + station.name + "<br>";
    station_info += "Deployed: " + station.birthday + "<br>";
    station_info += "Last contact: " + station.last_contact + "<br>";
    station_info += "Status: " + station.status + "<br>";

    if (station.status == "Active") {
      L.marker([station.x_coord, station.y_coord], {icon: active})
        .addTo(map)
        .bindPopup(station_info);
    } else {
      L.marker([station.x_coord, station.y_coord], {icon: inactive})
        .addTo(map)
        .bindPopup(station_info);
    }
  })
});

// create d3 layer

d3.json("https://microcats.uqcloud.net/stations", function (data) {
  var stations = {};
  var sensor = $('input[name=sensor]:checked').val();
  var buckets = [1,2,3,4,5];
  var colors = ["#fafde8","#edf8b1","#c7e9b4", "#7fcdbb","#41b6c4"];

  data.stations.forEach(function(station) {
    stations[station.station_ID] = new L.LatLng(station.x_coord, station.y_coord)
  })

  map._initPathRoot()
  var svg = d3.select("#map").select("svg")
    .append("g");

  var drawCircles = function(stations, sensor) {
    clearAll();
    query_url = "https://microcats.uqcloud.net/readings/"+sensor;
    d3.json(query_url, function(data) {
      var station_data = [];
      Object.keys(stations).forEach(function(sid) {
	data.results[sid].forEach(function(result) {
	  var reading = {}
	  reading.value = result[sensor];
	  reading.point = stations[sid];
	  station_data.push(reading);
	});
      });

      var colorScale = d3.scale.quantile()
        .domain([d3.min(station_data, function(d) { return d.value; }),
        buckets.length - 1, d3.max(station_data, function (d) {
        return d.value; })])
        .range(colors);

      var radius = d3.scale.quantile()
        .domain([d3.min(station_data, function(d) { return d.value; }),
        buckets.length - 1, d3.max(station_data, function (d) {
        return d.value; })])
        .range(buckets);

      var feature = svg.selectAll(".circle")
        .data(station_data);
      
      feature.enter().append("circle")
        .style("opacity", .7) 
        .style("fill", function(d){ return colorScale(d.value);})
        .attr("r", 0)
	.attr("transform", function(d) { 
          return "translate("+ 
            map.latLngToLayerPoint(d.point).x +","+ 
            map.latLngToLayerPoint(d.point).y +")";
        });

      feature.transition().duration(1000)
        .attr("r", function(d){ return radius(d.value) * 15;})

      var labels = svg.selectAll("text")
	.data(station_data);

      labels.enter().append("text")
	.text(function(d) { return d.value; })
	.attr("class", "mono")
	.attr("x", function(d) { return map.latLngToLayerPoint(d.point).x -13; })
	.attr("y", function(d) { 
	  return map.latLngToLayerPoint(d.point).y + 
	  (radius(d.value) * 15) + 10;
	});

      feature.exit().remove();
    });
  }

  var drawHex = function() {
    clearAll();
    var color = ["#E9FF63", "#7DFF63", "#63F8FF", "#99FF63", "#CFFE63", 
		  "#FFC263", "#FFC763", "#FF8E63", "#FF6464", "#95FF63",
		  "#63FFCD", "#A2FF63", "#EBFF63", "#63FFC1", "#63FFA0",
		  "#63E4FF", "#63FFFB", "#63F3FF", "#63CEFE"]
    var width = $("#map").width() + 50;
    var height = $("#map").height() + 100;
    var MapColumns = 40;
    var MapRows = 25;
    var hexRadius = d3.min([width/((MapColumns + 0.5) * Math.sqrt(3)),
      height/((MapRows + 1/3) * 1.5)]);
    var hexbin = d3.hexbin().radius(hexRadius);
    var points = [];
    for (var i = 0; i < MapRows; i++) {
      for (var j = 0; j < MapColumns; j++) {
        points.push([hexRadius * j * 1.75, hexRadius * i * 1.5]);
      }
    }

    svg.selectAll(".hexagon")
      .data(hexbin(points))
      .enter().append("path")
      .attr("class", "hexagon")
      .attr("d", function (d) {
        return "M" + d.x + "," + d.y + hexbin.hexagon();
      })
      .attr("stroke", function (d,i) {
        return "#444444";
      })
      .attr("stroke-width", "1px")
      .attr("opacity", "0.3")
      .style("fill", function (d,i) {
        return color[i];
      });
  }

  function clearAll() {
    svg.selectAll("circle").remove();
    svg.selectAll("text").remove();
    svg.selectAll(".hexagon").remove();
  }

  drawCircles(stations, sensor);

  $('select').on("change", function() {
    if (this.value == "circles") {
      drawCircles(stations, sensor);
    } else {
      drawHex();
    }
  });

  $('input[name=sensor]').on("change", function() {
    if ($('select').val() == "circles") {
      var sensor = $('input[name=sensor]:checked').val();
      drawCircles(stations, sensor);
    } else {
    }
  });

});
