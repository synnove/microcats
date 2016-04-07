// create map
var map = L.map('map').setView([-27.4980, 153.014], 16);

L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    subdomains: ['a','b','c','d'],
    mapId: 'xaellia.pblg62p6',
    token: 'pk.eyJ1IjoieGFlbGxpYSIsImEiOiJjaWxicm8xbGYxamNldWdrbmZuaWE2bXRyIn0.g_PnYml4Xiw7-SFPKHL9bg'
}).addTo(map);

// create sensor icons

d3.json("https://microcats.uqcloud.net/sensors", function (data) {
  var active = L.icon({
      iconUrl: 'https://microcats.uqcloud.net/img/pusheen.png',
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

  data.sensors.forEach(function(sensor) {
    var now = new Date();
    var last = new Date(sensor.last_contact);

    if (((now - last)/60000) < 15) {
      L.marker([sensor.x_coord, sensor.y_coord], {icon: active})
        .addTo(map)
        .bindPopup("Name: " + sensor.name + "<br>" +
  	"Active since: " + sensor.birthday + "<br>" +
  	"Last contact: " + sensor.last_contact + "<br>");
    } else {
      L.marker([sensor.x_coord, sensor.y_coord], {icon: inactive})
        .addTo(map)
        .bindPopup("Name: " + sensor.name + "<br>" +
  	"Active since: " + sensor.birthday + "<br>" +
  	"Last contact: " + sensor.last_contact + "<br>");
    }
  })
});

// create d3 layer

map._initPathRoot()

var svg = d3.select("#map").select("svg"),
    g = svg.append("g");

d3.json("https://microcats.uqcloud.net/sensors", function (data) {
//  $("#debug-panel").append(JSON.stringify(data, undefined, 2));
//  $("#debug-panel").append("<br>-----<br>");
  data.sensors.forEach(function(sensor) {
    $("#debug-panel").append("<br>-----<br>");
    $("#debug-panel").append(sensor.x_coord, " | ", sensor.y_coord);
    $("#debug-panel").append(sensor.x_coord, " | ", sensor.y_coord);
    sensor.LatLng = new L.LatLng(sensor.x_coord, sensor.y_coord)
  })

  var feature = g.selectAll("circle")
    .data(data.sensors)
    .enter().append("circle")
    .style("opacity", .7) 
    .style("fill", "red")
    .attr("r", 40);

  $("#circles").change(function(){  
    console.log(this.checked); 
    if (this.checked) {
      feature.style("opacity", .7);
    } else {
      feature.style("opacity", 0);
    }
  });

  map.on("viewreset", update);
  update();

  function update() {
    feature.attr("transform", 
      function(d) { 
	return "translate("+ 
      	map.latLngToLayerPoint(d.LatLng).x +","+ 
      	map.latLngToLayerPoint(d.LatLng).y +")";
      }
    )
  }
});
