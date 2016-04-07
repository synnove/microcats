from flask import Flask
from flask import render_template, request, redirect, send_file, url_for, g
from flask import send_from_directory, jsonify
from datetime import datetime
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

@app.route("/")
def main_page():
  debug = ""

  return render_template('layout.html', page_title="im a map",
    site_name="microcats", username=g.username,
    debug=debug)

# VISIBLE PAGES BELOW -----------------------------------------------------------

@app.route("/about")
def about_page():
  debug = ""

  return render_template("about.html", page_title="about me",
    site_name="microcats", username=g.username,
    debug=debug)

@app.route("/map")
def map_page():
  debug = db.get_readings_between(1, 'DOG', "2015-11-29 19:50:32", "2015-11-30 19:50:32")

  return render_template("maps.html", page_title="im a map",
    site_name="microcats", username=g.username,
    debug=debug)

@app.route("/viz")
def visualisations_page():
  debug = ""

  return render_template("graphs.html", page_title="im lots of things",
    site_name="microcats", username=g.username,
    debug=debug)

# API PAGES BELOW -----------------------------------------------------------

@app.route("/sensors")
def get_sensors():
  sensor_json = {'sensors': []}
  query = db.get_sensor_info()

  for sid, description, name, x, y in query:
    new_sensor = {"name": name, "sensor_ID": sid, "x_coord": x, "y_coord": y}

    if (description == ''):
      new_sensor['description'] = "none"
    else:
      new_sensor['description'] = description

    birthday = db.get_birthday(sid)
    new_sensor['birthday'] = str(birthday)
    last_contact = db.get_last_reading_time(sid)
    new_sensor['last_contact'] = str(last_contact)
    sensor_json['sensors'].append(new_sensor)
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
    sensor_list = db.get_sensor_info()
    result_json = {'results': []}

    for sensor in sensor_list:
      sid = sensor[0]
      sensor_data = {}
      sensor_data[str(sid)] = []
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
        sensor_data[str(sid)].append(reading)
      result_json['results'].append(sensor_data)
    return jsonify(result_json)

@app.route('/img/<path:filename>')
def serve_static(filename):
  return send_from_directory(app.config['IMG_FOLDER'], filename)

def build_geojson(points, number_owned):
  geo = {"type": "GeometryCollection", "geometries": []}
  for i, point in enumerate(points):
    geo['geometries'].append({"circle": {"coordinates": point,
      "radius": number_owned[i] * 10}})
  return geo

if __name__ == "__main__":
  app.run(debug=True)
