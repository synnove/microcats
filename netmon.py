from datetime import datetime
import queries as db
import smtplib
import pyping

records = {}
alerts = []
admins = db.get_admin_emails()
logfile = "/home/s4367459/microcats/logs/catmonitor.log"
mesh_addr = "gs710-meshlium-01.eait.uq.edu.au"

# read last recorded measurements from file
try:
  f = open(logfile, 'r')
  for line in f:
    if (line.strip() != ""):
      tokens = line.split("|")
      records[tokens[0]] = (tokens[1],tokens[2])
  f.close()
except:
  print "Could not read from log file or log file does not exist"

# check meshlium active
res = pyping.ping(mesh_addr)
if (res.ret_code == 0):
  # check if meshlium was previously down
  if ("meshlium" in records):
    msg = "[Update] meshlium connection restored"
    alerts.append(msg)
  with open(logfile, "w") as f:
    sensors = [ (id, name) for id, _, name, _, _ in db.get_all_station_info()]
    for id, name in sensors:
      diff = None
      last = db.get_last_reading_time(id)
      (prev, last_diff) = records.get(name, ("",""))
      try:
        last_diff = int(last_diff)
      except:
        last_diff = 0
      if (prev != ""):
        prev = datetime.strptime(prev, '%Y-%m-%d %H:%M:%S')
        now = datetime.now()
        if (last == prev):
          diff = int((now - last).total_seconds() // 60)
          if (diff == 30):
	    msg = "[Alert] {} inactive - last contact {} minutes ago at {}"
  	    msg = msg.format(name, diff, last)
  	    alerts.append(msg)
          elif (last_diff > 60 and (diff % 60 == 0)):
	    msg = "[Reminder] {} inactive for {} minutes - last contact {}"
  	    msg = msg.format(name, diff, last)
  	    alerts.append(msg)
        else:
          diff = int((now - last).total_seconds() // 60)
          if (diff < 30 and last_diff >= 30):
	    msg = "[Update] {} recovered from inactive status at {}"
  	    msg = msg.format(name, last)
  	    alerts.append(msg)
          elif diff >= 30:
	    msg = "[Alert] {} inactive - last contact {} minutes ago at {}"
  	    msg = msg.format(name, diff, last)
  	    alerts.append(msg)
      f.write("{}|{}|{}\n".format(name, last, diff))
  f.close()
else:
  with open(logfile, "a") as f:
    f.write("{}|{}|{}\n".format("meshlium", "", ""))
  f.close()
  msg = "[Alert] lost connection to meshlium"
  alerts.append(msg)

sender = "admin@microcats.uqcloud.net"
server = "mailhub.eait.uq.edu.au"

if alerts:
  for admin in admins:
    msg = "From: {}\r\n".format(sender)
    msg += "To: {}\r\n".format(admin)
    msg += "Subject: microcats status alert\r\n"
    for alert in alerts:
      msg += "{}\r\n".format(alert)
    print msg
    server = smtplib.SMTP(server)
    server.set_debuglevel(0)
    server.sendmail(sender, admin, msg)
    server.quit()
