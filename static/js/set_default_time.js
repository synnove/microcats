function current_time() {
  var now = moment().format("YYYY-MM-DD");

  $("input[type='date']").val(now);

}

current_time();
