function draw_dhchart(station, sensor, time_start, time_end, timeframe) {

  // lets set some variables and create our svg
  var margin = { top: 30, right: 10, bottom: 50, left: 90 },
    width = $("#chart").width() + margin.left + margin.right,
    height = $("#chart").height();

  var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // this function, when called, handles the actual drawing
  var dhChart = function (station, sensor, time_start, time_end, timeframe) {

    // set some more variables here
    var gridSize = 0,
    legendElementWidth = 0,
    buckets = 9,
    colors = ["#fafde8","#edf8b1","#c7e9b4",
      "#7fcdbb","#41b6c4","#1d91c0",
      "#225ea8","#253494","#081d58"],
    days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    dates = Array.apply(null, {length: 31}).map(function (x, i) { return i+1 }),
    hours = ["00", "01", "02", "03", "04", "05", 
      "06", "07", "08", "09", "10", "11", 
      "12", "13", "14", "15", "16", "17", 
      "18", "19", "20", "21", "22", "23"];

    // this function handles labelling for WEEK charts
    var drawWeek = function() {
      svg.selectAll(".yLabel").remove();
      svg.selectAll(".xLabel").remove();
      svg.selectAll(".legend").remove();
      svg.selectAll(".block").remove();
      var labels = [];
      var day = moment(time_start);
      var dow = day.day();
      for (i = 0; i < 7; i++) {
        labels.push(days[dow%7])
        dow++;
      }
  
      var dayLabels = svg.selectAll(".yLabel")
        .data(labels)
        .enter().append("text")
        .text(function (d) { return d; })
        .attr("x", 0)
        .attr("y", function (d, i) { return i * gridSize; })
        .style("text-anchor", "end")
        .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
        .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? 
          "yLabel mono axis axis-workweek" : "yLabel mono axis"); });

      var timeLabels = svg.selectAll(".xLabel")
        .data(hours)
        .enter().append("text")
        .text(function(d) { return d; })
        .attr("x", function(d, i) { return i * gridSize; })
        .attr("y", 0)
        .style("text-anchor", "middle")
        .attr("transform", "translate(" + gridSize / 2 + ", -6)")
        .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? 
	  "xLabel mono axis axis-worktime" : "xLabel mono axis"); });
    }

    // this function handles labelling for WEEK charts
    var drawMonth = function() {
      svg.selectAll(".yLabel").remove();
      svg.selectAll(".xLabel").remove();
      svg.selectAll(".legend").remove();
      svg.selectAll(".block").remove();
      var labels = [];
      var start = moment(time_start);
      var month = start.month();
      for (i = 0; i < 6; i++) {
        labels.push(months[month%12])
        month++;
      }
  
      var monthLabels = svg.selectAll(".yLabel")
        .data(labels)
        .enter().append("text")
        .text(function (d) { return d; })
        .attr("x", 0)
        .attr("y", function (d, i) { return i * gridSize; })
        .style("text-anchor", "end")
        .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
        .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? 
          "yLabel mono axis axis-workweek" : "yLabel mono axis"); });

      var dateLabels = svg.selectAll(".xLabel")
        .data(dates)
        .enter().append("text")
        .text(function(d) { return d; })
        .attr("x", function(d, i) { return i * gridSize; })
        .attr("y", 0)
        .style("text-anchor", "middle")
        .attr("transform", "translate(" + gridSize / 2 + ", -6)")
        .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? 
	  "xLabel mono axis axis-worktime" : "xLabel mono axis"); });
    }


    // call the relevant axis labelling function depending on timeframe
    // also set the query URL because we want different averages
    if (timeframe == "Week") {
      gridSize = Math.floor(width / (hours.length + 1)) - 10;
      legendElementWidth = gridSize*2;
      drawWeek();
      query_url = "https://microcats.uqcloud.net/hour-average/"+station+"/"
        +sensor+"/"+time_start+"/"+time_end;
    } else {
      gridSize = Math.floor(width / dates.length) - 10;
      legendElementWidth = gridSize*2;
      drawMonth();
      query_url = "https://microcats.uqcloud.net/day-average/"+station+"/"
	+sensor+"/"+time_start+"/"+time_end;
    }

    // get the data from the server and process it
    console.log(query_url);
    d3.json(query_url, function(data) {
      if (data.hasOwnProperty('results')) {
	svg.selectAll("text.warning").remove();
	svg.selectAll(".hour").remove();
	var day = moment(time_start);
      	var dow = day.day();
      	var moy = day.month();

	data.results.forEach(function(record) {
      	  var date = moment(record.time, "YYYY-MM-DD HH:mm:ss");
      	  record.day = date.day() - dow;
	  if (record.day < 0) {
	    record.day += 7;
	  }
      	  record.hour = date.hour();
      	  record.month = date.month() - moy;
	  if (record.month < 0) {
	    record.month += 12;
	  }
      	  record.date = date.date();
	  console.log(record.date, "|", record.month);
      	});

      	var colorScale = d3.scale.quantile()
      	  .domain([d3.min(data.results, function(d) { return d.value; }), 
      	  buckets - 1, d3.max(data.results, function (d) { 
      	  return d.value; })])
      	  .range(colors);

	var cards;

	if (timeframe == "Week") {
	  cards = svg.selectAll(".block")
      	    .data(data.results, function(d) {return d.day+':'+d.hour;});
	  cards.enter().append("rect")
      	    .attr("x", function(d) {return ((d.hour - 1) * gridSize) + gridSize;})
      	    .attr("y", function(d) {return ((d.day - 1) * gridSize) + gridSize;})
      	    .attr("rx", 2)
      	    .attr("ry", 2)
      	    .attr("class", "block bordered")
      	    .attr("width", gridSize)
      	    .attr("height", gridSize)
      	    .style("fill", colors[0])
	    .append("title")
	    .text(function(d) { return d.value; });
	} else {
	  cards = svg.selectAll(".block")
      	    .data(data.results, function(d) {return d.month+':'+d.date;});
	  cards.enter().append("rect")
      	    .attr("x", function(d) {return ((d.date - 2) * gridSize) + gridSize;})
      	    .attr("y", function(d) {return ((d.month - 1) * gridSize) + gridSize;})
      	    .attr("rx", 2)
      	    .attr("ry", 2)
      	    .attr("class", "block bordered")
      	    .attr("width", gridSize)
      	    .attr("height", gridSize)
      	    .style("fill", colors[0])
	    .append("title")
	    .text(function(d) { return d.value; });
	}

      	cards.transition().duration(50)
      	  .style("fill", function(d) { return colorScale(d.value); });

      	cards.exit().remove();

      	var legend = svg.selectAll(".legend")
      	  .data([0].concat(colorScale.quantiles()), function(d) { return d; });

      	legend.enter().append("g")
      	  .attr("class", "legend");

      	legend.append("rect")
      	  .attr("x", function(d, i) { return legendElementWidth * i; })
	  .attr("y", (7 * gridSize) + (gridSize/4))
      	  .attr("width", legendElementWidth)
      	  .attr("height", gridSize / 2)
      	  .style("fill", function(d, i) { return colors[i]; });

      	legend.append("text")
      	  .attr("class", "mono")
      	  .text(function(d) { return "≥ " + Math.round(d * 100) / 100; })
      	  .attr("x", function(d, i) { return legendElementWidth * i; })
	  .attr("y", 8 * gridSize);

      	legend.exit().remove();
      } else {
	svg.selectAll(".xLabel").remove();
	svg.selectAll(".yLabel").remove();
	svg.selectAll(".legend").remove();
	svg.selectAll(".block").remove();
	var popup = new Foundation.Reveal($('#error'));
	popup.open();
      }
    });  
  }

  // here we get back user directions from the control panel
  // and react accordingly
  dhChart(station,sensor,time_start,time_end, timeframe);
  $('input[type=radio][name=station]').change(function() {
    station = this.value;
    dhChart(station,sensor,time_start,time_end, timeframe);
  });
  $('input[type=radio][name=sensor]').change(function() {
    sensor = this.value;
    dhChart(station,sensor,time_start,time_end, timeframe);
  });
  $("#viz-type").submit(function( event ) {
    event.preventDefault();
    var times = getTimeframe();
    dhChart(station,sensor,times[0],times[1], timeframe);
  });
  $("input[type=button].timeframe").click(function(event) {
    event.preventDefault();
    var timeframe = $(this).val();
    $("input[type=button].timeframe").prop('disabled', false);
    $(this).prop('disabled', true);
    var times = getTimeframe();
    dhChart(station,sensor,times[0],times[1], timeframe);
  });

  var getTimeframe = function() {
    time = moment($("input[type='date']").val());
    time_start = time.format('YYYY-MM-DD HH:mm:ss');
    timeframe = $("input[type='button']:disabled").val();
    if (timeframe == "Week") {
      time_end = time.add(moment.duration({'days': 7}))
		  .format('YYYY-MM-DD HH:mm:ss');
    } else if (timeframe == "Month") {
      time_end = time.add(moment.duration({'months': 6}))
		  .format('YYYY-MM-DD HH:mm:ss');
    } else {
      time_end = time.add(moment.duration({'years': 1}))
		  .format('YYYY-MM-DD HH:mm:ss');
    }
    return [time_start, time_end];
  };
}
