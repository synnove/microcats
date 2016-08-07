import psycopg2 as pgsql

def get_id_from_name(name):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select sid from thesis.sensors where name = %s""", (name,))
  rows = cur.fetchall()
  if (rows):
      return rows[0][0]
  else:
      return None

def check_user_exists(username):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select * from thesis.users where uid = %s""", (username,))
  rows = cur.fetchone()
  if (rows):
    return True
  return False

def add_or_update_user(username, mail, name):
  user = check_user_exists(username)
  if (not user):
    conn = db_connect()
    cur = conn.cursor()
    cur.execute("""insert into thesis.users (uid, mail, name) values (%s,%s,%s)"""
      , (username,mail, name))
    conn.commit()
  else:
    conn = db_connect()
    cur = conn.cursor()
    cur.execute("""update thesis.users set mail = %s, name = %s where uid = %s"""
      , (mail, name, username))
    conn.commit()

def check_user_admin(username):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select role from thesis.users where uid = %s""", (username,))
  rows = cur.fetchone()
  if (rows):
    if (rows[0] == 'admin'):
      return True
  return False

def admin_to_user(username):
  conn = db_connect()
  cur = conn.cursor()
  try:
    cur.execute("""update thesis.users set role = 'user' where uid = %s""", (username,))
    conn.commit()
  except Exception, e:
    return False
  return True

def user_to_admin(username):
  conn = db_connect()
  cur = conn.cursor()
  try:
    cur.execute("""update thesis.users set role = 'admin' where uid = %s""", (username,))
    conn.commit()
  except Exception, e:
    return False
  return True

def add_new_admin(username, name, email):
  conn = db_connect()
  cur = conn.cursor()
  try:
    cur.execute("""insert into thesis.users (uid, role, mail, name) values (%s, %s, %s, %s)""", (username,'admin',email,name))
    conn.commit()
  except Exception, e:
    return False
  return True

def get_all_users():
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select * from thesis.users order by name asc""")
  rows = cur.fetchall()
  if (rows):
      return rows
  return False

def get_admin_emails():
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select mail from thesis.users where role = %s""", ('admin',))
  rows = cur.fetchall()
  if (rows):
    return [mail[0] for mail in rows]
  return []

def get_id_from_secret(secret):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select sid from thesis.sensors where id_secret = %s""", 
    (secret,))
  rows = cur.fetchone()
  if (rows):
      return rows[0]
  else:
      return None

def get_all_station_info():
  """ gets information about sensor nodes to be displayed on popup """
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select sid, description, name, ST_X(location), ST_Y(location) 
    from thesis.sensors""")
  rows = cur.fetchall()
  return rows

def get_station_info(sid):
  """ gets information about sensor nodes to be displayed on popup """
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select sid, description, name, ST_X(location), ST_Y(location) 
    from thesis.sensors where sid = %s""", (sid,))
  rows = cur.fetchone()
  return rows

def get_sensor_list():
  """ gets a list of the available sensor types """
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select distinct sensor from thesis.data""")
  rows = cur.fetchall()
  return [(x, y[0]) for x,y in enumerate(rows)]

def get_birthday(sid):
  """ get date of first sensor reading/ "birthday" """
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select time::timestamp::date from thesis.data where sid = %s 
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
  cur.execute("""select time from thesis.data where sid = %s order by time desc 
    limit 1""", (sid,))
  rows = cur.fetchall()
  if (rows):
      return rows[0][0]
  else:
      return None

def get_closest_reading(sid, attr, time):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select sensor, value, time from thesis.data d natural join 
  (select abs(extract(epoch from timestamp %s) - extract(epoch from time)) as timediff, 
  id from thesis.data group by id) as timediffs 
  where sid = %s and sensor = %s order by timediff asc limit 1""", (time, sid, attr))
  rows = cur.fetchall()
  if (rows):
      return rows
  else:
      return None

def get_highest_reading(sid, attr):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select max(value::numeric) from thesis.data where sid = %s and 
    sensor = %s""", (sid, attr))
  rows = cur.fetchall()
  if (rows):
      return rows[0][0]
  else:
      return None

def get_lowest_reading(sid, attr):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select min(value::numeric) from thesis.data where sid = %s and 
    sensor = %s""", (sid, attr))
  rows = cur.fetchall()
  if (rows):
      return rows[0][0]
  else:
      return None

def get_average_reading(sid, attr):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select avg(value::numeric) from thesis.data where sid = %s and 
    sensor = %s""", (sid, attr))
  rows = cur.fetchall()
  if (rows):
      return rows[0][0]
  else:
      return None

def get_readings_between(sid, attr, time_start, time_end):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select sensor, value, time from thesis.data where sid = %s and 
    sensor = %s and time >= timestamp %s and time <= timestamp %s""", 
    (sid, attr, time_start, time_end))
  rows = cur.fetchall()
  if (rows):
      return rows
  else:
      return None

def get_daily_average(sid, attr, time_start, time_end):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select avg(value::numeric), date_trunc('day', time) from 
    thesis.data where sid = %s and sensor = %s and time >= date_trunc('day', 
    timestamp %s) and time <= date_trunc('day', timestamp %s) group by 
    date_trunc('day', time) order by date_trunc('day', time) asc""", 
    (sid, attr, time_start, time_end))
  rows = cur.fetchall()
  if (rows):
      return rows
  else:
      return None

def get_hourly_average(sid, attr, time_start, time_end):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select avg(value::numeric), date_trunc('hour', time) from 
    thesis.data where sid = %s and sensor = %s and time >= date_trunc('day', 
    timestamp %s) and time <= date_trunc('day', timestamp %s) group by 
    date_trunc('hour', time) order by date_trunc('hour', time) asc""", 
    (sid, attr, time_start, time_end))
  rows = cur.fetchall()
  if (rows):
      return rows
  else:
      return None

def get_uptime(sid):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""select date_trunc('day', time), count(*) from thesis.data where
    sid = %s and sensor = %s group by date_trunc('day', time)""", (sid, 'BAT'))
  rows = cur.fetchall()
  if (rows):
    return rows
  else:
    return None

def update_sensor_name(sid, val):
  conn = db_connect()
  cur = conn.cursor()
  try:
    cur.execute("""update thesis.sensors set name = %s where sid = %s returning name""", (val, sid))
    conn.commit()
  except Exception, e:
    return None
  return cur.fetchone()[0]

def update_sensor_desc(sid, val):
  conn = db_connect()
  cur = conn.cursor()
  try:
    cur.execute("""update thesis.sensors set description = %s where sid = %s returning description""", (val, sid))
    conn.commit()
  except Exception, e:
    return None
  return cur.fetchone()[0]

def update_sensor_loc(sid, val):
  conn = db_connect()
  cur = conn.cursor()
  try:
    cur.execute("""update thesis.sensors set location = ST_GeomFromText('POINT(%s)', 900913) where sid = %s returning ST_AsText(location)""", (val, sid))
    conn.commit()
  except Exception, e:
    return None
  return cur.fetchone()[0]

def new_station(secret):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""insert into thesis.sensors (id_secret) values (%s) returning sid"""
    , (secret,))
  conn.commit()
  return cur.fetchone()[0]

def insert_data(sid, sensor, value, time):
  conn = db_connect()
  cur = conn.cursor()
  cur.execute("""insert into thesis.data (sid, sensor, value, time) values
    (%s, %s, %s, %s)""", (sid, sensor, value, time))
  conn.commit()

def get_pw():
  """ reads password from file """
  f = open('/home/s4367459/microcats/pgsql.pw', 'r')
  pw = f.read()
  f.close()
  return pw.rstrip()

def db_connect():
  """ connects to postgresql database """
  pw = get_pw()
  conn = pgsql.connect("dbname='microcats' user='postgres' host='localhost' password = '" + pw + "'")
  return conn
