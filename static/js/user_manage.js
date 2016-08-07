$('input[type=submit]').on('click', function(e) {
  e.preventDefault();
  var form = $(this).parent().parent().attr("id");
  var form_id = '#' + form;

  if (form == "new_admin") {

    $.getJSON($SCRIPT_ROOT + '/_new_admin', {
      uid: $(form_id + ' input[name=uid]').val(),
      name: $(form_id + ' input[name=name]').val(),
      mail: $(form_id + ' input[name=email]').val(),
    }, function(data) {
      var popup = "";
      if (data.result == "success") {
	popup += '<div class="callout success radius" data-closable>';
      } else {
	popup += '<div class="callout warning radius" data-closable>';
      }
	popup += data.msg;
	popup += '<a href="" class="close" data-close>&times;</a>'
	popup += '</div>'
	$('#err_msg').html(popup);
    });

  } else {

    var act = "";
    if (form == "add_admin") {
      act = "add";
    } else {
      act = "remove";
    }

    $.getJSON($SCRIPT_ROOT + '/_mod_admin', {
      uid: $(form_id + ' select').val(),
      action: act,
    }, function(data) {
      var popup = "";
      if (data.result == "success") {
	popup += '<div class="callout success radius" data-closable>';
      } else {
	popup += '<div class="callout warning radius" data-closable>';
      }
	popup += data.msg;
	popup += '<a href="" class="close" data-close>&times;</a>'
	popup += '</div>'
	$('#err_msg').html(popup);
    });

  }
});

$('a.close').on('click', function(e) {
  e.preventDefault();
  location.reload();
});
