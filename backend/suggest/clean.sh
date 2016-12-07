#! /bin/sh

# delete the Sketch installation
rm -rf SkechObject/lib/sketch-1.7.2.tar.gz
rm -rf SkechObject/lib/sketch-1.7.2

# delete Java .class files
make clean
