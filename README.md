# The JDial Debugger

The world's first debugger of its kind to allow users to get code recommendations based on state manipulation and function input/output examples. 

To learn more about how JDial works and what exactly it is capable of, read our [getting started page](https://github.com/JDial-Debugger/complete/wiki/Getting-Started)

## Prerequisites

- [Sketch](https://bitbucket.org/gatoatigrado/sketch-frontend/wiki/Installation)
  - If using Vagrant, here's how to install Sketch on the VM:
    1. Download [this](https://github.com/isaacev/jdial-webapp/releases/tag/0.1) pre-built Sketch tarball for Linux AMD
    2. Copy the tarball to `jdial/backend/suggest/SkechObject/lib`
    3. Sketch will be available inside the VM once the JDial HTTP server has booted up
  - If running JDial in some other environment, exposing Sketch on the system `PATH` will allow JDial to call & use Sketch
    - Installation for how to build Sketch from source are available [here](https://bitbucket.org/gatoatigrado/sketch-frontend/wiki/Installation)

### Download and compile backend git submodule
1. From the root `jdial` directory, in a linux terminal, change directory to `backend/suggest/JDial-debugger`. This directory is a git submodule for the backend JDial repository at https://github.com/JDial-Debugger/backend. To read more about git submodules, visit https://git-scm.com/book/en/v2/Git-Tools-Submodules
2. Run `git submodule init` and then `git submodule update`
3. Build backend code: `cd backend/suggest`, `make`
