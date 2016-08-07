// create map
var map = L.map('map', { zoomControl: false }).setView([-27.4995, 153.0145], 18);

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

map.dragging.disable();
map.touchZoom.disable();
map.doubleClickZoom.disable();
map.scrollWheelZoom.disable();
map.keyboard.disable();

// create sensor icons
d3.json("https://microcats.uqcloud.net/get/stations", function (data) {
  var active = L.icon({
      iconUrl: 'https://microcats.uqcloud.net/img/active.png',
      iconSize:     [35, 90],
      iconAnchor:   [17, 45],
      popupAnchor:  [0, -40]
  });

  var inactive = L.icon({
      iconUrl: 'https://microcats.uqcloud.net/img/inactive.png',
      iconSize:     [35, 90],
      iconAnchor:   [17, 45],
      popupAnchor:  [0, -40]
  });

  data.stations.forEach(function(station) {
    var now = new Date();
    var last = new Date(station.last_contact);

    var station_info = "Name: " + station.name + "<br>";
    station_info += "Deployed: " + station.birthday + "<br>";
    station_info += "Last contact: " + station.last_contact + "<br>";
    station_info += "Status: " + station.status + "<br>";
    station_info += "<span class='right'><a href='https://microcats.uqcloud.net/sensor/" + station.name + 
		    "' style='text-align:right;'>more details</a></span>";

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

d3.json("https://microcats.uqcloud.net/get/stations", function (data) {
  var stations = {};
  var sensor = $('input[name=sensor]:checked').val();
  var buckets = [1,2,3,4,5,6,7,8,9];
  var colors = ["#84D4F7","#9FD8C7","#62C6BE", "#A1D7C9","#C3DC76",
		"#FFF8A7","#F9E1C5","#F8ABB3", "#F1585A"];

  data.stations.forEach(function(station) {
    stations[station.station_ID] = new L.LatLng(station.x_coord, station.y_coord)
  })

  map._initPathRoot()
  var svg = d3.select("#map").select("svg")
    .append("g");

  var defs = svg.append("defs");
  var filter = defs.append("filter")
    .attr("id", "blur");

  filter.append("feGaussianBlur")
    .attr("stdDeviation", 4)
    .attr("in", "SourceGraphic")
    .attr("result", "result1")
    .attr("id", "feGaussianBlur4202");

  filter.append("feTurbulence")
    .attr("type", "fractalNoise")
    .attr("baseFrequency", 0.05)
    .attr("numOctaves", 4)
    .attr("result", "result0")
    .attr("id", "feTurbulence4204");

  filter.append("feDisplacementMap")
    .attr("in2", "result0")
    .attr("scale", 20)
    .attr("xChannelSelector", "R")
    .attr("yChannelSelector", "G")
    .attr("in", "result2")
    .attr("id", "feDisplacementMap4206");

  filter.append("feGaussianBlur")
    .attr("stdDeviation", 3)
    .attr("in", "SourceGraphic")
    .attr("result", "result4")
    .attr("id", "feGaussianBlur4208");

  filter.append("feComposite")
    .attr("in2", "result2")
    .attr("operator", "arithmetic")
    .attr("k1", 1.5)
    .attr("k2", -0.25)
    .attr("k3", 0.5)
    .attr("k4", 0)
    .attr("in", "result4")
    .attr("result", "result5")
    .attr("id", "feComposite4210");

  var drawCircles = function(stations, sensor) {
    clearAll();
    query_url = "https://microcats.uqcloud.net/get/readings/"+sensor;
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
	.style("filter", "url(#blur)")
        .attr("r", 0)
	.attr("transform", function(d) { 
          return "translate("+ 
            map.latLngToLayerPoint(d.point).x +","+ 
            map.latLngToLayerPoint(d.point).y +")";
        });

      feature.transition().duration(1000)
        .attr("r", function(d){ return radius(d.value) * 8;})

      var labels = svg.selectAll(".rect")
	.data(station_data);

      labels.enter().append("rect")
	.style("opacity", .5)
	.style("fill", "#ffffff")
	.attr("width", 40)
	.attr("height", 15)
	.attr("rx", 2)
	.attr("ry", 2)
	.attr("x", function(d) { return map.latLngToLayerPoint(d.point).x - 20; })
	.attr("y", function(d) { return map.latLngToLayerPoint(d.point).y + 15; });

      var label_text = svg.selectAll("text")
	.data(station_data);

      label_text.enter().append("text")
	.text(function(d) { return d.value; })
	.style("text-anchor", "middle")
	.attr("class", "mono")
	.attr("x", function(d) { return map.latLngToLayerPoint(d.point).x; })
	.attr("y", function(d) { return map.latLngToLayerPoint(d.point).y + 26; });

      feature.exit().remove();
    });
  }

  var drawTopo = function(stations, sensor) {
    clearAll();
    var color = d3.scale.linear()
            .domain([10000, 50000, 100000])
            .range(["#57b5cd", "#81b562", "#eb8d5d"]);
    query_url = "https://microcats.uqcloud.net/get/readings/"+sensor;
    d3.json(query_url, function(data) {
      var station_data = [];
      Object.keys(stations).forEach(function(sid) {
	data.results[sid].forEach(function(result) {
	  var reading = {}
	  reading.lat = stations[sid].lat;
	  reading.lng = stations[sid].lng;
	  reading.count = result[sensor];
	  station_data.push(reading);
	});
      });
      console.log(station_data);
      var heat = L.heatLayer(station_data, {radius: 50}).addTo(map);
    });
  }

  function clearAll() {
    svg.selectAll("circle").remove();
    svg.selectAll("text").remove();
    svg.selectAll("rect").remove();
  }

  drawCircles(stations, sensor);

  $('select').on("change", function() {
    if (this.value == "circles") {
      drawCircles(stations, sensor);
    } else {
      drawTopo(stations, sensor);
    }
  });

  $('input[name=sensor]').on("change", function() {
    var sensor = $('input[name=sensor]:checked').val();
    if ($('select').val() == "circles") {
      drawCircles(stations, sensor);
    } else {
      drawTopo(stations, sensor);
    }
  });

});
