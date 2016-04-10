var station = $('input[name=station]:checked').val();
var sensor = $('input[name=sensor]:checked').val();
var time = "2015-12-01 19:50:32";

$("select").on("change", function() {
  d3.select("svg").remove();
  if (this.value == "heatmap") {
    draw_heatmap();
  } else {
  }
});

draw_heatmap();

function draw_heatmap() {
  var margin = { top: 45, right: 25, bottom: 25, left: 25 },
    width = $("#chart").width(),
    height = $("#chart").height() / 100 * 30,
    gridSize = Math.floor(width / 25),
    legendElementWidth = gridSize*2.5,
    buckets = 9,
    colors = ["#fafde8","#edf8b1","#c7e9b4",
      "#7fcdbb","#41b6c4","#1d91c0",
      "#225ea8","#253494","#081d58"],
    times = ["00", "01", "02", "03", "04", "05", 
      "06", "07", "08", "09", "10", "11", 
      "12", "13", "14", "15", "16", "17", 
      "18", "19", "20", "21", "22", "23"];
  console.log(height);

  var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var days = [];
  var week = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  var start_day = new Date(time.split(" ").join("T")).getDay();
  for (i = 0; i < 7; i++) {
    days.push(week[start_day%7])
    start_day++;
  }

  var dayLabels = svg.selectAll(".dayLabel")
    .data(days)
    .enter().append("text")
    .text(function (d) { return d; })
    .attr("x", 0)
    .attr("y", function (d, i) { return i * gridSize; })
    .style("text-anchor", "end")
    .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
    .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });
    
  var timeLabels = svg.selectAll(".timeLabel")
    .data(times)
    .enter().append("text")
    .text(function(d) { return d; })
    .attr("x", function(d, i) { return i * gridSize; })
    .attr("y", 0)
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + gridSize / 2 + ", -6)")
    .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

  var heatMap = function (query_url) {
    console.log(query_url);
    d3.json(query_url, function(data) {
      data.results.forEach(function(record) {
	var date = new Date(record.time.split(" ").join("T"));
        record.day = date.getDay();
        record.hour = date.getHours();
      });

      var colorScale = d3.scale.quantile()
        .domain([d3.min(data.results, function(d) { return d.value; }), 
	buckets - 1, d3.max(data.results, function (d) { 
        return d.value; })])
        .range(colors);

      var cards = svg.selectAll(".hour")
        .data(data.results, function(d) {return d.day+':'+d.hour;});

      cards.enter().append("rect")
        .attr("x", function(d) { return ((d.hour - 1) * gridSize) + 23; })
        .attr("y", function(d) { return ((d.day - 1) * gridSize) + 23; })
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("class", "hour bordered")
        .attr("width", gridSize)
        .attr("height", gridSize)
        .style("fill", colors[0]);

      cards.transition().duration(1000)
        .style("fill", function(d) { return colorScale(d.value); });

      cards.append("title").text(function(d) { return d.value; });
        
      cards.exit().remove();

      var legend = svg.selectAll(".legend")
        .data([0].concat(colorScale.quantiles()), function(d) { return d; });

      legend.enter().append("g")
        .attr("class", "legend");

      legend.append("rect")
        .attr("x", function(d, i) { return legendElementWidth * i; })
        .attr("y", height)
        .attr("width", legendElementWidth)
        .attr("height", gridSize / 2)
        .style("fill", function(d, i) { return colors[i]; });

      legend.append("text")
        .attr("class", "mono")
        .text(function(d) { return "≥ " + Math.round(d * 100) / 100; })
        .attr("x", function(d, i) { return legendElementWidth * i; })
        .attr("y", height + gridSize);

      legend.exit().remove();
    });  
  }

  heatMap("https://microcats.uqcloud.net/average/"+station+"/"+sensor+"/"+time);
  $('input[type=radio][name=station]').change(function() {
    station = this.value;
    heatMap("https://microcats.uqcloud.net/average/"+station+"/"+sensor+"/"+time);
  });
  $('input[type=radio][name=sensor]').change(function() {
    sensor = this.value;
    heatMap("https://microcats.uqcloud.net/average/"+station+"/"+sensor+"/"+time);
  });
}
