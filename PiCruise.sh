#!/bin/sh
# /etc/init.d/PiCruise
### BEGIN INIT INFO
# Provides:          PiCruise
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Start daemon at boot time
# Description:       Enable service provided by daemon.
### END INIT INFO

/usr/bin/node /home/pi/picruise/app.js > /home/pi/picruise/PiCruise.log
