#! /bin/sh

SKETCH_TARBALL="sketch-1.6.7.done.tar.gz"
SKETCH_DIR="sketch-1.6.7"
SKETCH_EX=$(which sketch)

cd /vagrant/backend/suggest/SkechObject/lib/

# Extract the sketch binary if it's not extracted already
if ! [ -d "./$SKETCH_DIR" ]; then
  if [ -e "./$SKETCH_TARBALL" ]; then
    tar xvf "./$SKETCH_TARBALL"
  else
    echo "cant find sketch!"
    exit 1
  fi
fi

# Add Sketch to this script's PATH
SKETCH_PATH="$PATH:`pwd`/$SKETCH_DIR/sketch-frontend"

cd /vagrant

# DO NOT CHANGE without also changing the Vagrantfile so that port mapping is maintained
PORT=3000 GIN_MODE=release PATH=$SKETCH_PATH JAVA_DIR=/vagrant/backend/suggest ./server
