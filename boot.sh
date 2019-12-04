#! /bin/sh

SKETCH_TARBALL="sketch-1.6.7.linux-x86.tar.gz"
SKETCH_DIR="sketch-1.6.7"
# SKETCH_EX=$(which sketch)

cd /vagrant/backend/suggest/JDial-debugger/SkechObject/lib/
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

# Add Sketch to this script's PATH
SKETCH_PATH="$PATH:`pwd`/$SKETCH_DIR/sketch-frontend"

cd /vagrant

# DO NOT CHANGE without also changing the Vagrantfile so that port mapping is maintained
SERVER_PORT=5000
DEFAULT_DEBUG_SUGGEST_PORT=8888

boot_server() {
  echo "starting server..."
	if [ -z "$1" ]; then
		PORT=$SERVER_PORT GIN_MODE=release PATH=$SKETCH_PATH JAVA_DIR=/vagrant/backend/suggest ./server
	else
		PORT=$SERVER_PORT GIN_MODE=release PATH=$SKETCH_PATH JAVA_DIR=/vagrant/backend/suggest ./server "$1"
	fi
}
usage() { echo "Usage: $0 [-d]" 1>&2; exit 1; }

#Checks for optional -d flag to mark debug mode
while getopts ":d" o; do
  case "${o}" in
    d)
      boot_server $DEFAULT_DEBUG_SUGGEST_PORT
      exit 0 
      ;;
    *)
      usage
      ;;
  esac
done

boot_server
