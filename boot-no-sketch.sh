#! /bin/sh

cd /vagrant

# DO NOT CHANGE without also changing the Vagrantfile so that port mapping is maintained
PORT=3000 GIN_MODE=release SKETCH=FALSE JAVA_DIR=/vagrant/backend/suggest ./server
