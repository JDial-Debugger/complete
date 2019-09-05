# JDial Frontend & Backend

## Prerequisites

### Standard use:

- [Vagrant](https://www.vagrantup.com/)
  - This is a tool that makes it easy to boot up virtual machines's for easy development
  - Recommended for running JDial since this app needs to be run in a Linux AMD environment
  - Instructions for installing Vagrant can be found [here](https://www.vagrantup.com/docs/installation/)
  - Once Vagrant is installed, see [Booting up the Server](https://github.com/isaacev/jdial-webapp#booting-up-the-server) for instructions on how to get JDial running inside of a Vagrant virtual machine

- [Java 8](https://docs.oracle.com/javase/8/docs/technotes/guides/install/install_overview.html)
  - If using Vagrant VM to run the server, this will be automatically installed by the Vagrantfile

- [Sketch](https://bitbucket.org/gatoatigrado/sketch-frontend/wiki/Installation)
  - If using Vagrant, here's how to install Sketch on the VM:
    1. Download [this](https://github.com/isaacev/jdial-webapp/releases/tag/0.1) pre-built Sketch tarball for Linux AMD
    2. Copy the tarball to `jdial/backend/suggest/SkechObject/lib`
    3. Sketch will be available inside the VM once the JDial HTTP server has booted up
  - If running JDial in some other environment, exposing Sketch on the system `PATH` will allow JDial to call & use Sketch
    - Installation for how to build Sketch from source are available [here](https://bitbucket.org/gatoatigrado/sketch-frontend/wiki/Installation)


### Frontend development:

- [Node & NPM](https://nodejs.org/en/)
  - Developing the frontend JavaScript source code requires Node.js and NPM for bundling, minifying, and transpiling the JavaScript
  - Install NPM dependencies by running `npm install` from inside the `jdial/frontend` directory
  - Once edits have been made to JavaScript inside `jdial/frontend/src/scripts`, run `gulp scripts` from inside the `jdial/frontend` directory to compile JavaScript
    - The various build scripts store their output in the `jdial/frontend/dist` directory

- [SASS](http://sass-lang.com/install)
  - This is only necessary when developing the frontend's styles
  - Run `gulp styles` from inside the `jdial/frontend` directory to compile all SCSS files in `jdial/frontend/src/styles` into a single CSS file
    - The output of this build process is stored in the `jdial/frontend/dist` directory


## Booting up the Server

These steps assume basic familiarity with the command line and assume that Vagrant has been installed and that this repository has been cloned locally and that the current working directory is the root directory of this project.
### Download backend git submodule
1. From the root `jdial` directory, in a linux terminal, change directory to `backend/suggest/JDial-debugger`. This directory is a git submodule for the backend JDial repository at https://github.com/JDial-Debugger/backend. To read more about git submodules, visit https://git-scm.com/book/en/v2/Git-Tools-Submodules
2. Run `git submodule init` and then `git submodule update`

### Launch Vagrant Container
Vagrant is used to ensure standard development environments across different local development machines. Read more about Vagrant at https://www.vagrantup.com/intro/index.html

1. From the root `jdial` directory (the same directory with the `Vagrantfile`), run the command `vagrant up`
  - If this is the first time you have booted up Vagrant for this project, it may take a while as a Vagrant box is downloaded and Java 8 is installed on the newly created virtual machine

2. Once the `vagrant up` command has finished, if no major errors have been reported run `vagrant ssh`. This command will log into the newly created virtual machine.

3. If `vagrant ssh` succeeds, run `cd /vagrant` to navigate to the synced directory. This directory synced between the real machine and the virtual machine so that any files available on one machine are available to the other. This directory should contain all of this project's source files.

4. The `/vagrant` directory has a few important files:
  - `server` is an HTTP server binary compatible with Linux AMD machines
  - `server.go` is the source code for the server binary
  - `boot.sh` is a Bash script for unpacking Sketch from a tarball archive and booting up the JDial HTTP server. If Sketch is not available in `jdial/backend/suggest/SkechObject/lib` the script will fail.
  - `boot-no-sketch.sh` in a Bash script that will boots the HTTP server without a need for Sketch. Any calls to HTTP endpoints on the server that depend on Sketch will return a 501 error code

5. To launch the HTTP server, run `sh boot.sh`. This command will spawn an HTTP server listening to `localhost:8080`
