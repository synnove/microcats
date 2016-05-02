from flask import Flask
from flask import render_template, request, redirect, send_file, url_for, g
from flask import send_from_directory, jsonify
from datetime import datetime, timedelta
import json
import psycopg2
import os
import queries as db
app = Flask(__name__)


IMG_FOLDER = os.path.join(os.getcwd(), 'static', 'img')
app.config['IMG_FOLDER'] = IMG_FOLDER

@app.before_request
def load_user():
    user_info = json.loads(request.headers.get('X-KVD-Payload'))
    g.username = user_info['user']

# VISIBLE PAGES BELOW -----------------------------------------------------------

# default - map view
@app.route("/")
@app.route("/map")
def map_page():
  sensors = db.get_sensor_list()
  debug = sensors

  return render_template("maps.html", page_title="im a map",
    site_name="microcats", username=g.username,
    sensors=sensors,
    debug=debug)

# about - lists all sensors + statistics
# TODO - add links to individual sensor pages
@app.route("/about")
def about_page():
  debug = ""
  station_list = db.get_all_station_info()
  station_info = []
  for sid, desc, name, x, y in station_list:
    station = {}
    station["sid"] = sid
    station["desc"] = desc
    station["name"] = name
    station["location"] = "{},{}".format(x,y)
    station["birthday"] = db.get_birthday(sid)
    station["values"] = get_station_stats(sid)
    station["last"] = db.get_last_reading_time(sid)
    station["status"] = get_station_status(sid)
    station_info.append(station)

  return render_template("about.html", page_title="about me",
    site_name="microcats", username=g.username,
    station_info=station_info,
    debug=debug)

# viz - view visualisations
@app.route("/viz")
def visualisations_page():
  debug = db.get_sensor_list()
  station_list = db.get_all_station_info()
  sensor_list = db.get_sensor_list()

  return render_template("graphs.html", page_title="im lots of things",
    site_name="microcats", username=g.username,
    station_list=station_list,
    sensor_list=sensor_list,
    debug=debug)

# shows information about each specific sensor
@app.route("/<name>", 
  methods=['GET', 'POST'])
def show_station_info(name):
  debug = []
  sid = db.get_id_from_name(name)
  station_info = db.get_station_info(sid)
  if (not station_info):
    station_info = (None, None, None, None, None)
  (_, desc, name, x, y) = station_info
  station = {}
  station["sid"] = sid
  station["desc"] = desc
  station["name"] = name
  station["location"] = "{},{}".format(x,y)
  station["birthday"] = db.get_birthday(sid)
  station["values"] = get_station_stats(sid)
  station["last"] = db.get_last_reading_time(sid)
  station["status"] = get_station_status(sid)
  vals = get_station_stats(sid)
  return render_template("station.html", page_title="im just one thing",
    site_name="microcats", username=g.username, 
    station=station, vals=vals,
    debug=debug)

# progress seminar presentation
@app.route("/pp")
def progress_seminar_presentation():
  return render_template("progress_seminar.html", page_title="look at me")

# API PAGES BELOW -----------------------------------------------------------

@app.route("/stations")
def get_stations():
  station_json = {'stations': []}
  query = db.get_all_station_info()

  for sid, description, name, x, y in query:
    birthday = db.get_birthday(sid)
    last_contact = db.get_last_reading_time(sid)
    new_station = {"name": name, "station_ID": sid, "x_coord": x, "y_coord": y}
    new_station['description'] = description
    new_station['birthday'] = str(birthday)
    new_station['last_contact'] = str(last_contact)
    new_station['status'] = get_station_status(sid)
    station_json['stations'].append(new_station)

  return jsonify(station_json)

@app.route("/sensors")
def get_sensors():
  sensor_json = {'sensors': []}
  query = db.get_sensor_list()

  for i, sensor in query:
    sensor_json['sensors'].append(sensor)
  return jsonify(sensor_json)

@app.route("/readings/<attr>", methods=['GET', 'POST'], 
  defaults={'time_from': None, 'time_to': None})
@app.route("/readings/<attr>/<time_from>", methods=['GET', 'POST'], 
  defaults={'time_to': None})
@app.route("/readings/<attr>/<time_from>/<time_to>", 
  methods=['GET', 'POST'])
def get_readings(attr, time_from, time_to):
  if (attr == 'CAT'):
    return render_template("cats.html", page_title="DID YOU ASK FOR CATS",
      site_name="microcats", username=g.username)
  else:
    station_list = db.get_all_station_info()
    result_json = {'results': {}}

    for station in station_list:
      sid = station[0]
      sensor_data = []
      if (not time_to):
        if (time_from):
          data = db.get_closest_reading(int(sid), attr.upper(), time_from)
        else:
          data = db.get_closest_reading(int(sid), attr.upper(), datetime.now())
      else:
        data = db.get_readings_between(int(sid), attr.upper(), time_from, time_to)
      if (not data):
        return jsonify({ 'err': "No results found for query" })
      for sensor, value, time in data:
        reading = {}
        reading[sensor] = value
        reading['time'] = time
        sensor_data.append(reading)
      result_json['results'][str(sid)] = sensor_data
    return jsonify(result_json)

@app.route("/hour-average/<sid>/<attr>/<time_from>/<time_to>", 
  methods=['GET', 'POST'])
def get_readings_hourly_average(sid, attr, time_from, time_to):
  result_json = {'results': []}

  data = db.get_hourly_average(int(sid), attr.upper(), time_from, time_to)
  if (not data):
    return jsonify({ 'err': "No results found for query" })
  for value, time in data:
    sensor_data = {}
    sensor_data['time'] = str(time)
    sensor_data['value'] = float(value)
    result_json['results'].append(sensor_data)
  return jsonify(result_json)

@app.route("/day-average/<sid>/<attr>/<time_from>/<time_to>", 
  methods=['GET', 'POST'])
def get_readings_daily_average(sid, attr, time_from, time_to):
  result_json = {'results': []}

  data = db.get_daily_average(int(sid), attr.upper(), time_from, time_to)
  if (not data):
    return jsonify({ 'err': "No results found for query" })
  for value, time in data:
    sensor_data = {}
    sensor_data['time'] = str(time)
    sensor_data['value'] = float(value)
    result_json['results'].append(sensor_data)
  return jsonify(result_json)

@app.route('/img/<path:filename>')
def serve_static(filename):
  return send_from_directory(app.config['IMG_FOLDER'], filename)

def get_station_stats(sid):
  attrs = db.get_sensor_list()
  vals = {}
  for i, attr in attrs:
    reading = db.get_closest_reading(sid, attr.upper(), datetime.now())
    if reading:
      (sensor,value,time) = reading[0]
      vals[sensor] = []
      highest = db.get_highest_reading(sid, attr.upper());
      lowest = db.get_lowest_reading(sid, attr.upper());
      average = db.get_average_reading(sid, attr.upper());
      vals[sensor].append(highest)
      vals[sensor].append(lowest)
      vals[sensor].append("{0:.2f}".format(average))
  return vals

def get_station_status(sid):
  last = db.get_last_reading_time(sid)
  status = None
  min_diff = None
  if last:
    diff = datetime.now() - last
    min_diff = abs(divmod(diff.total_seconds(), 60)[0])
    if min_diff < 15:
      return "Active"
  return "Inactive"

if __name__ == "__main__":
  app.run(debug=True)
