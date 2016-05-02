function draw_linegraph(stations, sensor, time_start, time_end) {
  var margin = { top: 45, right: 50, bottom: 45, left: 50 },
    width = $("#chart").width() - margin.right - margin.left,
    height = $("#chart").height() - margin.top - margin.bottom,
    colors = ["#4b8ad7","#de2536","#fbe97a",
      "#7fcdbb","#41b6c4","#1d91c0",
      "#225ea8","#253494","#081d58"];

  var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")

  var draw_lines = function (error, all_data) {
    if (!(all_data[0].hasOwnProperty('err'))) {
      var x = d3.scale.linear()
        .domain([0, 23])
        .range([0, width]);

      var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(24);

      var tx = "translate(" + margin.left + "," + (height + margin.top) + ")";
      console.log("transform: " + tx);
      svg.append("g")
        .call(xAxis)
        .attr("class", "x axis")
        .attr("transform", tx);

      svg.append("text")
        .attr("class", "title mono")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(260, 20)")
        .text("Graph of " + sensor + " values over 24 hours");

      var ty = "translate(" + margin.left + "," + margin.top + ")";
      console.log("transform: " + ty);
      svg.append("g")
        .attr("class", "y axis")
        .attr("transform", ty);

      svg.selectAll("text.title")
        .attr("class", "title mono")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(260, 20)")
        .text("Graph of " + sensor + " values over 24 hours");

      svg.selectAll("path.graph")
        .remove();

      var mins = []
      var maxs = []
      all_data.forEach(function (data) {
        mins.push(d3.min(data.results, function(d) {return d.value;}));
        maxs.push(d3.max(data.results, function(d) {return d.value;}));
      });

      var y = d3.scale.linear()
        .domain([Math.floor(d3.min(mins)), Math.ceil(d3.max(maxs))])
        .range([height, 0]);

      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10);

      svg.selectAll("g.y.axis")
        .transition().duration(20)
        .call(yAxis);

      var line = d3.svg.line()
        .x(function(d) { 
          var t = d.time.split(" ");
          var h = t[1].split(":");
          return x(parseInt(h[0])); })
        .y(function(d) { return y(d.value); });

      var i = 0;
      var tl = "translate(" + margin.left + "," + margin.top + ")";
      all_data.forEach(function (data) {
        svg.append("path")
          .attr("d", line(data.results))
          .attr("class", "graph")
          .attr("stroke", colors[i])
          .attr("fill", "none")
          .attr("transform", ty)
          .style("stroke-width", 2)
        i++;
      });
    } else {
      svg.selectAll(".legend").remove();
      svg.selectAll(".hour").remove();
      svg.append("text")
        .attr("class", "title mono warning")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(400,220)")
        .text("No results found with search parameters! Please try again!")
    }
  }

  get_all_data(stations, sensor, time_start, time_end);
  $('input[type=checkbox][name=station]').change(function() {
    stations = $('input[name=station]:checked').map(function(){
      return $(this).val(); }).get();
    get_all_data(stations, sensor, time_start, time_end);
  });
  $('input[type=radio][name=sensor]').change(function() {
    sensor = this.value;
    get_all_data(stations, sensor, time_start, time_end);
  });
  $("#viz-type").submit(function( event ) {
    event.preventDefault();
    time = moment($("input[type='datetime-local']").val());
    time_start = time.format('YYYY-MM-DD ') + "00:00:00";
    time_end = time.add(moment.duration({'days': 1}))
                .format('YYYY-MM-DD ') + "23:00:00";
    get_all_data(stations, sensor, time_start, time_end);
  });

  function get_all_data(stations, sensor, time_start, time_end) {
    console.log(stations);
    var q = d3_queue.queue()
    stations.forEach(function (station) {
      q.defer(d3.json, "https://microcats.uqcloud.net/average/"
        +station+"/"+sensor+"/"+time_start+"/"+time_end);
    });
    q.awaitAll(draw_lines);
  }
}
