msgs = []

with open("/var/log/mqtt-recv.log") as file_in:
    for line in file_in:
      if line.startswith("INFO:receive:"):
	cut = line.split(":", 2)
	msgs.append(cut[2])

with open("/home/s4367459/microcats/logs/mqtt.log", "w") as file_out:
  if (len(msgs) > 40):
    msgs = msgs[len(msgs)-40:]
  for msg in msgs:
    file_out.write(msg)

file_in.close()
file_out.close()
