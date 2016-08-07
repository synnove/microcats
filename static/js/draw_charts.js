// data loading

d3.json("https://microcats.uqcloud.net/get/stations", function(json){
  station_radio(json.stations);
  $("select").on("change", function() {
    if (this.value == "dh-chart") {
      station_radio(json.stations);
    } else {
      station_checkbox(json.stations);
    }
  });
});

d3.json("https://microcats.uqcloud.net/get/sensors", function(json){
  sensor_radio(json.sensors);
  $("select").on("change", function() {
    sensor_radio(json.sensors);
  });
});

// form interaction

draw();

$("select").on("change", function() {
  d3.select("svg").remove();
  $("#chart-opts").empty();
  draw();
});

var canvas = ".chart";

function draw() {
  var viz = $("select option:selected").val();
  if (viz == "dh-chart") {
    var time = moment($("input[type='date']").val());
    var time_start = time.format('YYYY-MM-DD HH:mm:ss');
    var time_end = time.add(moment.duration({'days': 7}))
		    .format('YYYY-MM-DD HH:mm:ss');
    var timeframe = $("input[type='button']:disabled").val();

    function check_dh_vars(station, sensor) {
      if(sensor && station){
        draw_dhchart(canvas, station, sensor, time_start, time_end, timeframe);
      }
    }
    setTimeout(function() {
      var station = $('input[name=station]:checked').val();
      var sensor = $('input[name=sensor]:checked').val();
      check_dh_vars(station,sensor);
    },2000);
  } else if (viz == "line-graph") {
    var time = moment($("input[type='datetime-local']").val());
    var time_start = time.format('YYYY-MM-DD ') + "00:00:00";
    var time_end = time.add(moment.duration({'days': 1}))
		    .format('YYYY-MM-DD ') + "23:00:00";

    function check_lg_vars(stations, sensor) {
      if(sensor && stations){
        draw_linegraph(canvas, stations, sensor, time_start, time_end);
      }
    }
    setTimeout(function() {
      var stations = $('input[name=station]:checked').map(function(){
      return $(this).val(); }).get();
      var sensor = $('input[name=sensor]:checked').val();
      console.log(stations);
      check_lg_vars(stations, sensor);
    },1000);
  }
}

// form generating functions

function sensor_radio(data) {
  var i = 1;
  $('#chart-opts').append("<div class='row'><fieldset class='sensors'>");
  $("<div class='large-12 columns'><legend>Select a Sensor</legend></div></div>")
    .appendTo("fieldset.sensors");
  $.each(data, function (sensor, name) {
     $(document.createElement('input')).attr({
        name:  'sensor', value: sensor, type:  'radio'
     }).appendTo("fieldset.sensors");
    $("<label for='"+sensor+"'>"+name+"</label></div>")
      .appendTo("fieldset.sensors");
    if (i == 1) {
      $("input[name=sensor][value=" + sensor + "]").prop('checked', true);
    }
    if (i == 4) {
      $("<br>").appendTo("fieldset.sensors");
    }
    i++;
  });
  $('#chart-opts').append("</fieldset></div>");
}

function station_radio(data) {
  var i = 0;
  $('#chart-opts').append("<div class='row'><fieldset class='station'>");
  $("<div class='large-12 columns'><legend>Select a Station</legend></div></div>")
    .appendTo("fieldset.station");
  data.forEach(function (station) {
    $(document.createElement('input')).attr({
      name:  'station', value: station.station_ID, type:  'radio'
    }).appendTo("fieldset.station");
    $("<label for='"+station.station_ID+"'>"+station.name+"</label>")
      .appendTo("fieldset.station");
    if (i == 0) {
      $("input[name=station][value=" + station.station_ID + "]").prop('checked', true);
    }
    i++;
  });
  $('#chart-opts').append("</fieldset></div>");
}

function station_checkbox(data) {
  var i = 0;
  $('#chart-opts').append("<div class='row'><fieldset class='station'>");
  $("<div class='large-12 columns'><legend>Select Stations</legend></div></div>")
    .appendTo("fieldset.station");
  data.forEach(function (station) {
    $(document.createElement('input')).attr({
      name:  'station', value: station.station_ID, type:  'checkbox'
    }).appendTo("fieldset.station");
    $("<label for='"+station.station_ID+"'>"+station.name+"</label>")
      .appendTo("fieldset.station");
    if (i == 0) {
      $("input[name=station][value=" + station.station_ID + "]").prop('checked', true);
    }
    i++;
  });
  $('#chart-opts').append("</fieldset></div>");
}
