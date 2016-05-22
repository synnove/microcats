draw();

function draw() {
  var sensors = [];
  var stations = [];
  stations.push($("span.id").text());
  $( "a.accordion-title" ).each(function () {
    if ($(this).text().search("Graph") == 0) {
      sensors.push($(this).attr("href").substring(1));
    }
  });
  for (var i in sensors) {
    canvas = ".chart.small."+sensors[i];
    var sensor = sensors[i];
    var time = moment();
    var time_start = time.format('YYYY-MM-DD ') + "00:00:00";
    var time_end = time.add(moment.duration({'days': 1}))
          	  .format('YYYY-MM-DD ') + "23:00:00";
    draw_linegraph(canvas, stations, sensor, time_start, time_end);
  }
  var canvas = ".chart.small.uptime";
  var station = $("span.id").text();
  draw_uptime(canvas, station);
}
