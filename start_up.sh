#!/bin/bash

/etc/init.d/avahi-daemon restart
exec node $1
