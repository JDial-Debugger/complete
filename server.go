package main

import (
    "bytes"
    "io/ioutil"
    "net/http"
    "os"
    "os/exec"
    "path/filepath"
    "strconv"
    "strings"

    "github.com/gin-gonic/gin"
    "github.com/golang/glog"
)

const TMP_DIR string = "/tmp"

type TraceRequest struct {
    Source string `form:"source" json:"source" binding:"required"`
    Input  string `form:"input" json:"input"`
    Trace  string `form:"trace" json:"trace"`
}

type SuggestionRequest struct {
    FullTrace    string `form:"full_trace" json:"full_trace" binding:"required"`
    Point        string `form:"modified_point" json:"modified_point" binding:"required"`
    PointIndex   int    `form:"modified_point_index" json:"modified_point_index" binding:"required"`
    FocusedLines []int  `form:"focused_lines" json:"focused_lines"`
}

func main() {
    var port, java_dir string

    // Ensure that the PORT environment variable is set before proceeding
    if port = os.Getenv("PORT"); port == "" {
        glog.Fatal("$PORT must be set")
    }

    if java_dir = os.Getenv("JAVA_DIR"); java_dir == "" {
        glog.Fatal("$JAVA_DIR must be set")
    }

    // Create a Gin router with default configuration
    r := gin.Default()

    // Serve the main view HTML file from the root endpoint
    r.StaticFile("/", "./frontend/views/index.html")

    // Serve static assets (CSS, JavaScript, images, etc.)
    r.Static("/public", "./frontend/dist")
    r.Static("/assets", "./frontend/assets")

    // Attach API handling functions to their respective HTTP endpoints
    r.POST("/trace", handleTrace)
    r.POST("/suggest", handleSuggestion(java_dir))

    // Start the router listening for incoming requests on the specified port
    r.Run(":" + port)
}

func handleTrace(c *gin.Context) {
    // Create an empty TraceRequest struct that can be populated with the
    // incoming JSON fields
    var trace TraceRequest

    // Populate the TraceRequest struct with data from the HTTP POST body
    c.BindJSON(&trace)

    // If the "source" field of the HTTP POST body contained no data, return
    // an error to the client and stop handling this request
    if len(trace.Source) == 0 {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "no source code data provided",
        })

        glog.Error("no source code data provided")
        return
    }

    // Use the OS to call Java with the given classpath and starting class
    cmd := exec.Command(
        "java",
        "-cp",
        "backend/trace/bin:backend/trace/packages/*",
        "GenerateTrace",
    )

    // In the HTTP request was a string containing Java source code. The Java
    // tracing program expects this data to be input via standard input. Pass
    // this data to the newly created OS exec command over `stdin`
    cmd.Stdin = strings.NewReader(trace.Source)

    // Create a buffer to store data emitted by the Java tracing program
    var out bytes.Buffer

    // Pipe any data passed from the Java program to `stdout` into the newly
    // created `out` buffer
    cmd.Stdout = &out

    // Run the command since the custom `stdin` and `stdout` pipes have been
    // initialized. Capture any errors
    err := cmd.Run()

    // Log any errors emitted during the execution of the Java tracing program
    if err != nil {
        glog.Error(err)
    }

    // Return that string as the HTTP response
    c.String(http.StatusOK, out.String())
}

func handleSuggestion(java_dir string) gin.HandlerFunc {
    return func (c *gin.Context) {
        if hasSketch := os.Getenv("SKETCH"); hasSketch == "FALSE" {
            c.JSON(http.StatusNotImplemented, gin.H{
                "error": "sketch not included on this server",
            })
            return
        }

        var sugReq SuggestionRequest

        if c.BindJSON(&sugReq) != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": "malformed JSON fields",
            })
            return
        }

        var tmpTraceFile, tmpPointFile *os.File
        var tmpTraceFilename, tmpPointFilename string
        var err error

        if tmpTraceFile, err = ioutil.TempFile(TMP_DIR, "trace"); err != nil {
            glog.Fatal(err)
        } else {
            tmpTraceFilename = tmpTraceFile.Name()
            // defer os.Remove(tmpTraceFile.Name())
        }

        if tmpPointFile, err = ioutil.TempFile(TMP_DIR, "point"); err != nil {
            glog.Fatal(err)
        } else {
            tmpPointFilename = tmpPointFile.Name()
            // defer os.Remove(tmpPointFile.Name())
        }

        // Write the full trace string to a file
        fullTraceBuf := []byte(sugReq.FullTrace)

        if err = ioutil.WriteFile(tmpTraceFilename, fullTraceBuf, 0644); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{
                "error": "unable to process the full execution trace",
            })

            // Exit the handler early
            glog.Error(err)
            return
        }

        // WRite the modified execution point to a file
        pointBuf := []byte(sugReq.Point)

        if err = ioutil.WriteFile(tmpPointFilename, pointBuf, 0644); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{
                "error": "unable to process the modified execution point",
            })

            // Exit the handler early
            glog.Error(err)
            return
        }

        var cmdOut []byte

        var classpath = strings.Join([]string{
            filepath.Join(java_dir, "bin"),
            filepath.Join(java_dir, "JavaMeddler_ANTLR_PARSE/*"),
            filepath.Join(java_dir, "SkechObject/lib/*"),
            filepath.Join(java_dir, "."),
        }, ":")

        focusedLinesStr := ""

        for i, lineNum := range sugReq.FocusedLines {
            if i > 0 {
                focusedLinesStr += ","
            }

            focusedLinesStr += strconv.Itoa(lineNum)
        }

        cmdName := "java"
        cmdArgs := []string{
            "-cp",
            classpath,
            "QDEntry",
            tmpTraceFilename,
            strconv.Itoa(sugReq.PointIndex),
            tmpPointFilename,
            "[" + focusedLinesStr + "]",
        }

        if cmdOut, err = exec.Command(cmdName, cmdArgs...).Output(); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{
                "error": "unable to make a suggestion",
            })

            // Exit the handler early
            glog.Error(err)
            return
        }

        c.String(http.StatusOK, string(cmdOut))
    }
}
