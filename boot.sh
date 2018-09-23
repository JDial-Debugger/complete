#! /bin/sh

SKETCH_TARBALL="sketch-1.6.7.linux-x86.tar.gz"
SKETCH_DIR="sketch-1.6.7"
# SKETCH_EX=$(which sketch)

cd /vagrant/backend/suggest/JDial-debugger/SkechObject/lib/
echo "Hello, world!"
# Extract the sketch binary if it's not extracted already
if ! [ -d "./$SKETCH_DIR" ]; then
  if [ -e "./$SKETCH_TARBALL" ]; then
    echo "extracting sketch..."
    tar xf "./$SKETCH_TARBALL"
    echo "done extracting sketch"
  else
    echo "cant find sketch"
    echo "quitting in error..."
    exit 1
  fi
else
  echo "found sketch"
fi
echo "Now we are down here!"

# Add Sketch to this script's PATH
SKETCH_PATH="$PATH:`pwd`/$SKETCH_DIR/sketch-frontend"

cd /vagrant

# DO NOT CHANGE without also changing the Vagrantfile so that port mapping is maintained
echo "starting server..."
PORT=3000 GIN_MODE=release PATH=$SKETCH_PATH JAVA_DIR=/vagrant/backend/suggest ./server
