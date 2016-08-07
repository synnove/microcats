$("div.variable").each(function(i) {
  if($(this).hasClass("edit")) {
    //$(this).append("&emsp;<i class='fi-pencil'></i>");
    //$(this).append(" <span class='tiny'>(edit)</span>");
  }
});

$(document).ready(function() {
  $('.edit').editable($SCRIPT_ROOT + '/_update_sensors', {
    indicator : 'Saving...',
    tooltip   : 'Click to edit'
  });
});
