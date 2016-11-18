#! /bin/sh

# ensure that the Sketch frontend is included in the executable path
FRONTEND_PATH="$PATH:oracle/SkechObject/lib/sketch-1.7.2/sketch-frontend"

# DO NOT CHANGE without also changing the Vagrantfile so that port mapping is maintained
PORT=3000

GIN_MODE=release PATH=$FRONTEND_PATH PORT=$PORT JAVA_DIR=/vagrant/oracle ./server
