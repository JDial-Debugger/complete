SKETCH_DIR="sketch-1.6.7"
# Add Sketch to this script's PATH
SKETCH_PATH="$PATH:`pwd`/$SKETCH_DIR/sketch-frontend"

PORT=5000 GIN_MODE=release PATH=$SKETCH_PATH JAVA_DIR=./backend/suggest ./server
