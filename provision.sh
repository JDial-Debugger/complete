
#Suggest Path
echo "export SUGGEST_PATH=/vagrant/backend/suggest/" >> ~/.profile
#Sketch Enironmental Variables
echo "export PATH=$PATH:/vagrant/backend/suggest/JDial-debugger/SkechObject/lib/sketch-1.6.7/sketch-frontend" >> ~/.profile
echo "export SKETCH_HOME=/vagrant/backend/suggest/JDial-debugger/SkechObject/lib/sketch-1.6.7/sketch-frontend/runtime" >> ~/.profile

# install Java 8 JDK
sudo apt-get update -y
sudo apt-get install -y software-properties-common python-software-properties
sudo apt-add-repository ppa:openjdk-r/ppa -y
sudo apt-get update -y
sudo apt-get install openjdk-8-jdk -y
