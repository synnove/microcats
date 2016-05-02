// form interaction

draw();

function draw() {
  var stations = [];
  stations.push($( "span.id" ).text());
  var sensor = "BAT";
  var time = moment();
  var time_start = time.format('YYYY-MM-DD ') + "00:00:00";
  var time_end = time.add(moment.duration({'days': 1}))
		  .format('YYYY-MM-DD ') + "23:00:00";
  draw_linegraph(stations, sensor, time_start, time_end);
}
