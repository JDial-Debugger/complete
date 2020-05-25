package main

import (
    //"bytes"
    //"io/ioutil"
    //"net/http"
    //"os"
    //"os/exec"
    //"path/filepath"
   // "strconv"
  //  "strings"

 //   "github.com/gin-gonic/gin"
//    "github.com/golang/glog"
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
    r.POST("/suggestFunc", handleSuggestionFunc(java_dir))

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
    //cmd.Env = os.Environ()
    //cmd.Env = append(cmd.Env, "CLASSPATH=/vagrant/backend/trace/bin:/vagrant/backend/trace/packages/*")

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
      println(err)
        glog.Error("ERROR :0")
    }

    // Return that string as the HTTP response
    c.String(http.StatusOK, out.String())
}

func handleSuggestionFunc(java_dir string) gin.HandlerFunc {
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

        var inputFile *os.File
        var inputFileName string
        var err error

        if inputFile, err = ioutil.TempFile(TMP_DIR, "jdial_input"); err != nil {
            glog.Fatal(err)
        } else {
            inputFileName = tmpTraceFile.Name()
            // defer os.Remove(tmpTraceFile.Name())
        }

        // Write the full trace string to a file
        inputFileBuf := c.GetRawData()

        if err = ioutil.WriteFile(inputFileName, inputFileBug, 0644); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{
                "error": "unable to process the full execution trace",
            })

            // Exit the handler early
            glog.Error(err)
            return
        }

        var cmdOut []byte

        //copied from eclipse>debugger>threads>bottom one (usr/lib/jvm...)>properties
        var classpath = "/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/resources.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/rt.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/jsse.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/jce.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/charsets.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/cldrdata.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/dnsns.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/localedata.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/sunpkcs11.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/zipfs.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/icedtea-sound.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/sunec.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/nashorn.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/jaccess.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/sunjce_provider.jar:/home/matt/Madison/Research/JDial/new11-1/backend/suggest/JDial-debugger/SkechObject/target/classes:/home/matt/.p2/pool/plugins/org.junit_4.12.0.v201504281640/junit.jar:/home/matt/.p2/pool/plugins/org.hamcrest.core_1.3.0.v20180420-1519.jar:/home/matt/.m2/repository/junit/junit/4.13/junit-4.13.jar:/home/matt/.m2/repository/org/hamcrest/hamcrest-core/1.3/hamcrest-core-1.3.jar:/home/matt/.m2/repository/com/google/code/gson/gson/2.8.6/gson-2.8.6.jar:/home/matt/.m2/repository/org/slf4j/slf4j-api/1.7.30/slf4j-api-1.7.30.jar:/home/matt/.m2/repository/ch/qos/logback/logback-classic/1.2.3/logback-classic-1.2.3.jar:/home/matt/.m2/repository/ch/qos/logback/logback-core/1.2.3/logback-core-1.2.3.jar:/home/matt/.m2/repository/com/google/guava/guava/28.2-jre/guava-28.2-jre.jar:/home/matt/.m2/repository/com/google/guava/failureaccess/1.0.1/failureaccess-1.0.1.jar:/home/matt/.m2/repository/com/google/guava/listenablefuture/9999.0-empty-to-avoid-conflict-with-guava/listenablefuture-9999.0-empty-to-avoid-conflict-with-guava.jar:/home/matt/.m2/repository/com/google/code/findbugs/jsr305/3.0.2/jsr305-3.0.2.jar:/home/matt/.m2/repository/org/checkerframework/checker-qual/2.10.0/checker-qual-2.10.0.jar:/home/matt/.m2/repository/com/google/errorprone/error_prone_annotations/2.3.4/error_prone_annotations-2.3.4.jar:/home/matt/.m2/repository/com/google/j2objc/j2objc-annotations/1.3/j2objc-annotations-1.3.jar:/home/matt/.m2/repository/org/mockito/mockito-core/3.3.3/mockito-core-3.3.3.jar:/home/matt/.m2/repository/net/bytebuddy/byte-buddy/1.10.5/byte-buddy-1.10.5.jar:/home/matt/.m2/repository/net/bytebuddy/byte-buddy-agent/1.10.5/byte-buddy-agent-1.10.5.jar:/home/matt/.m2/repository/org/objenesis/objenesis/2.6/objenesis-2.6.jar:/home/matt/.m2/repository/org/powermock/powermock-module-junit4-legacy/2.0.2/powermock-module-junit4-legacy-2.0.2.jar:/home/matt/.m2/repository/org/powermock/powermock-module-junit4-common/2.0.2/powermock-module-junit4-common-2.0.2.jar:/home/matt/.m2/repository/org/powermock/powermock-reflect/2.0.2/powermock-reflect-2.0.2.jar:/home/matt/.m2/repository/org/powermock/powermock-core/2.0.2/powermock-core-2.0.2.jar:/home/matt/.m2/repository/org/javassist/javassist/3.24.0-GA/javassist-3.24.0-GA.jar:/home/matt/.m2/repository/org/powermock/powermock-api-mockito2/2.0.2/powermock-api-mockito2-2.0.2.jar:/home/matt/.m2/repository/org/powermock/powermock-api-support/2.0.2/powermock-api-support-2.0.2.jar:/home/matt/.m2/repository/org/antlr/antlr4-runtime/4.8-1/antlr4-runtime-4.8-1.jar"

        cmdArgs := []string{
            "-cp",
            classpath,
            "repair.RepairEngine",
            "funcCorrection",
            inputFileName,
        }

		//Enables remote debugging on host machine from eclipse IDE
		debugArg := "-Xdebug"
		debugServerArg := "-Xrunjdwp:transport=dt_socket,address=8888,server=y,suspend=y"
		//Any flag will trigger debug mode (don't have time to learn go right now)
		if len(os.Args) > 1 {
			cmdArgs = append([]string{debugArg, debugServerArg}, cmdArgs...)
		}

        cmdName := "java"
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
