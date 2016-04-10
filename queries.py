import psycopg2 as pgsql

def get_station_info():
  """ gets information about sensor nodes to be displayed on popup """
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select sid, description, name, ST_X(location), ST_Y(location) 
    from thesis.gatton_sensors""")
  rows = cur.fetchall()
  return rows

def get_sensor_list():
  """ gets a list of the available sensor types """
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select distinct sensor from thesis.gatton""")
  rows = cur.fetchall()
  return [(x, y[0]) for x,y in enumerate(rows)]

def get_birthday(sid):
  """ get date of first sensor reading/ "birthday" """
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select time::timestamp::date from thesis.gatton where sid = %s 
    order by time asc limit 1""", (sid,))
  rows = cur.fetchall()
  if (rows):
      return rows[0][0]
  else:
      return None

def get_last_reading_time(sid):
  """ get timestamp of latest sensor reading - use to determine active/inactive 
    state """
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select time from thesis.gatton where sid = %s order by time desc 
    limit 1""", (sid,))
  rows = cur.fetchall()
  if (rows):
      return rows[0][0]
  else:
      return None

def get_closest_reading(sid, attr, time):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select sensor, value, time from thesis.gatton d natural join 
  (select abs(extract(epoch from timestamp %s) - extract(epoch from time)) as timediff, 
  id from thesis.gatton group by id) as timediffs 
  where sid = %s and sensor = %s order by timediff asc limit 1""", (time, sid, attr))
  rows = cur.fetchall()
  if (rows):
      return rows
  else:
      return None

def get_readings_between(sid, attr, time_start, time_end):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select sensor, value, time from thesis.gatton where sid = %s and 
    sensor = %s and time >= timestamp %s and time <= timestamp %s""", 
    (sid, attr, time_start, time_end))
  rows = cur.fetchall()
  if (rows):
      return rows
  else:
      return None

def get_hourly_average(sid, attr, time_start):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select avg(value::numeric), date_trunc('hour', time) from thesis.gatton 
    where sid = %s and sensor = %s and time >= date_trunc('day', timestamp %s) and 
    time <= date_trunc('day', timestamp %s) + interval '1 week' group by date_trunc('hour', time) order by date_trunc('hour', time) asc""", 
    (sid, attr, time_start, time_start))
  rows = cur.fetchall()
  if (rows):
      return rows
  else:
      return None

def get_pw():
  """ reads password from file """
  f = open('pgsql.pw', 'r')
  pw = f.read()
  f.close()
  return pw.rstrip()

def db_connect():
  """ connects to postgresql database """
  pw = get_pw()
  conn = pgsql.connect("dbname='microcats' user='postgres' host='localhost' password = '" + pw + "'")
  return conn
