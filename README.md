# JDial Frontend & Backend

## Installation

1. Download & unzip `jdial.zip`
2. In the newly unpacked `jdial` directory, there are a few items of note
  - `frontend/` contains all JS, HTML, CSS code for rendering the web app
  - `backend/` contains server-side Java logic for creating a program trace and making source code suggestions
  - `server.go` is the Go source code for a basic HTTP server for serving the web app. The `./server` binary is that source code compiled for Linux AMD 64 machines. `boot.sh` will run the server binary with the proper ENV variables
3. **On a local Linux AMD 64 machine** boot the web server by running:

  $ sh boot.sh

4. **Navigate to `http://localhost:3000`** and you should see the app's frontend

## Dependencies
- Java 1.8

## Build Dependencies (optional)
- Sketch dependencies **if you plan on building Sketch yourself**
- Go 1.7 **if you plan on compiling server.go**
  - Running `sh build.sh` will compile `server.go` into a binary targeting Linux AMD 64 machines. To target other architectures, read about the Go language's use of GOOS & GOARCH environment variables
