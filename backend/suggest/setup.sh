#! /bin/sh

# download & unpack Sketch 1.7.2 binary
mkdir -p SkechObject/lib
cd SkechObject/lib
wget http://people.csail.mit.edu/asolar/sketch-1.7.2.tar.gz
tar zxf sketch-1.7.2.tar.gz

# compile Java files
make suggest
