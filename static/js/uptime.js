function draw_uptime(canvas, station) {
  var timeframe = {"days": []};
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var start = moment().startOf("year");
  var end = moment().endOf("year");
  var now = start;
  while (now.format("YYYY-MM-DD") != end.format("YYYY-MM-DD")) {
    var format = now.format("YYYY-MM-DD");
    var today = moment(format, "YYYY-MM-DD");
    timeframe['days'].push({"date": format, "moment": today});
    now.add(1, 'days');
  }

  var margin = {top: 30, right: 10, bottom: 10, left: 0 },
    width = $(canvas).parent().parent().width() + margin.left + margin.right,
    height = $(canvas).height(),
    gridSize = Math.floor(width / 66);

  var svg = d3.select(canvas).append("svg")
    .attr("width", width)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var uptimeChart = function (station, timeframe) {
    var buckets = 7,
    colors = ['#ffffff', '#ced6e3', '#adbad1', '#8d9fbf', 
	      '#6c84ac', '#536a93', '#405372'];

    query_url = "https://microcats.uqcloud.net/get/uptime/"+station;

    d3.json(query_url, function(data) {
      if (data.hasOwnProperty('results')) {
        timeframe.days.forEach(function(day) {
          if (day.date in data.results) {
            day.count = data.results[day.date];
          } else {
            day.count = 0;
          }
        });

        var colorScale = d3.scale.quantile()
          .domain([0, 6, 140])
          .range(colors);

	var monthLabels = svg.selectAll(".months")
    	  .data(months)
    	  .enter().append("text")
    	  .text(function(d) { return d; })
    	  .attr("x", function(d, i) { var year = moment().year();
				      var month_start = moment("01-"+d+"-"+year, "DD-MMM-YYYY");
				      return ((i + month_start.week()) * gridSize); })
    	  .attr("y", 0)
    	  .attr("class", "mono axis");

        var cards = svg.selectAll(".blocks")
	  .data(timeframe.days)
	  .enter().append("rect")
          .attr("x", function(d) { return (d.moment.week() + d.moment.month()) * gridSize; })
          .attr("y", function(d) { return (d.moment.day() * gridSize) + gridSize; })
          .attr("rx", 2)
          .attr("ry", 2)
          .attr("class", "block bordered")
          .attr("width", gridSize)
          .attr("height", gridSize)
          .style("fill", colors[0]);

        cards.transition().duration(50)
          .style("fill", function(d) { return colorScale(d.count); });

	var tip = d3.tip()
	  .attr('class', 'd3-tip')
	  .offset([-10, 0])
	  .html(function(d) { return "<b>"+d.count+" readings</b> on " + d.date; });

	svg.call(tip);

	cards.on('mouseover', tip.show)
	  .on('mouseout', tip.hide);

	svg.append("text")
    	  .text("A sensor node sends messages approximately every ten minutes - about 137 messages are expected per day.")
    	  .attr("x", (gridSize * 9))
    	  .attr("y", 9 * gridSize)
    	  .attr("class", "mono axis");

	svg.append("text")
    	  .text("This visualisation tracks the uptime of the sensor node based on the number of messages sent each day.")
    	  .attr("x", (gridSize * 9))
    	  .attr("y", 10 * gridSize)
    	  .attr("class", "mono axis");

	var legend = svg.selectAll(".legend")
	  .data([0].concat(colorScale.quantiles()), function(d) { return d; })
	  .enter().append("g")
	  .attr("class", "legend")
	  .append("rect")
	  .attr("x", function(d, i) { return (i+1) * gridSize; })
	  .attr("y", (9 * gridSize))
	  .attr("rx", 2)
	  .attr("ry", 2)
	  .attr("height", gridSize)
	  .attr("width", gridSize)
	  .attr("class", "block bordered")
	  .style("fill", function(d, i) { return colors[i]; });

      } else {
      }
    });
  }

  uptimeChart(station, timeframe);
}
