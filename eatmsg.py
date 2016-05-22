from datetime import datetime
import paho.mqtt.client as mqtt
import json
import psycopg2
import logging
import queries as db

logging.basicConfig(format='%(levelname)s:%(message)s',filename='/var/log/mqtt-recv.log',level=logging.INFO)

def print_log(msg):
  print msg
  logging.info(msg)

def on_connect(client, userdata, flags, rc):
  print_log("Connected with result code "+str(rc))
  client.subscribe("Meshcat")

def on_message(client, userdata, msg):
  print_log(datetime.strftime(datetime.now(), '%Y-%m-%d %H:%M:%S') + " | message received!")
  try:
    message = json.loads(msg.payload)
  except ValueError:
    print_log("Invalid message format!")
    return
  station_secret = message["id_secret"]
  sensor = message["sensor"]
  value = message["value"]
  format_date = message["datetime"].split("+")[0]
  timestamp = datetime.strptime(format_date, '%Y-%m-%dT%H:%M:%S')
  sid = db.get_id_from_secret(station_secret)
  if (sid and sensor != "ACC" and sensor != "STR"):
    db.insert_data(sid, sensor, value, timestamp)
  if (not sid):
    sid = "-"
    #sid = db.new_station(station_secret)
    #print_log("Add new sensor with ID " + str(sid))
  print_log("receive: sid: {} | sensor: {} | value: {} | timestamp: {}".format(sid,sensor,value,timestamp))

mqtt = mqtt.Client()
mqtt.on_connect = on_connect
mqtt.on_message = on_message

mqtt.connect("localhost", 1883)

mqtt.loop_forever()
