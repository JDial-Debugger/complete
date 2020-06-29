const express = require('express')
const path = require('path')
const fs = require('fs')
const tmp = require('tmp')
const HttpStatus = require('http-status-codes')
const { spawn, fork, execSync } = require('child_process')
const app = express()
const port = 5000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/', express.static(path.join(__dirname, "../frontend/views")))
app.use('/public', express.static(path.join(__dirname, "../frontend/dist")))
app.use('/assets', express.static(path.join(__dirname, "../frontend/assets")))


const traceRes = []

/**
 * Invokes Trace Generator Java program with given source code
 * TODO better error handling
 */
app.post('/trace', (req, res) => {
    console.log(req.body.source)
    const javaArgs = [
        '-cp', 
        '../backend/trace/bin:../backend/trace/packages/*', 
        'GenerateTrace'
    ]

    const traceProc = spawn('java', javaArgs)
    traceProc.stdout.on('data', data => {
        console.log(`${data}`)
        res.status(HttpStatus.OK).send(data)
    })
    traceProc.stderr.on('data', data => console.error(`${data}`))
    traceProc.stdin.write(req.body.source)
    traceProc.stdin.end()
})

const executeTraceGenSync = code => {

    const javaArgs = [
        'java',
        '-cp', 
        '../backend/trace/bin:../backend/trace/packages/*', 
        'GenerateTrace'
    ]

    return execSync(javaArgs.join(' '), { input: code }).toString()

}

app.post('/traces', (req, res) => {
    console.log(req.body)
    const results = []
    for (const source of req.body) {
        results.push(executeTraceGenSync(source))
    }
    res.status(HttpStatus.OK).send(results)
})

/**
 * Invokes Suggest Engine to make a function repair
 * TODO better error handling
 */
app.post('/suggestFunc', (req, res) => {
    console.log(JSON.stringify(req.body))
    const tmpInput = tmp.fileSync({ mode: 0o644, prefix: 'jdial-', postfix: '.json'})
    fs.writeFileSync(tmpInput.name, JSON.stringify(req.body))
    console.log(tmpInput)

    //copied from eclipse>debugger>threads>bottom one (usr/lib/jvm...)>properties
    var classpath = "/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/resources.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/rt.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/jsse.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/jce.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/charsets.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/cldrdata.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/dnsns.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/localedata.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/sunpkcs11.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/zipfs.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/icedtea-sound.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/sunec.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/nashorn.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/jaccess.jar:/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/sunjce_provider.jar:/home/matt/Madison/Research/JDial/new11-1/backend/suggest/JDial-debugger/SkechObject/target/classes:/home/matt/.p2/pool/plugins/org.junit_4.12.0.v201504281640/junit.jar:/home/matt/.p2/pool/plugins/org.hamcrest.core_1.3.0.v20180420-1519.jar:/home/matt/.m2/repository/junit/junit/4.13/junit-4.13.jar:/home/matt/.m2/repository/org/hamcrest/hamcrest-core/1.3/hamcrest-core-1.3.jar:/home/matt/.m2/repository/com/google/code/gson/gson/2.8.6/gson-2.8.6.jar:/home/matt/.m2/repository/org/slf4j/slf4j-api/1.7.30/slf4j-api-1.7.30.jar:/home/matt/.m2/repository/ch/qos/logback/logback-classic/1.2.3/logback-classic-1.2.3.jar:/home/matt/.m2/repository/ch/qos/logback/logback-core/1.2.3/logback-core-1.2.3.jar:/home/matt/.m2/repository/com/google/guava/guava/28.2-jre/guava-28.2-jre.jar:/home/matt/.m2/repository/com/google/guava/failureaccess/1.0.1/failureaccess-1.0.1.jar:/home/matt/.m2/repository/com/google/guava/listenablefuture/9999.0-empty-to-avoid-conflict-with-guava/listenablefuture-9999.0-empty-to-avoid-conflict-with-guava.jar:/home/matt/.m2/repository/com/google/code/findbugs/jsr305/3.0.2/jsr305-3.0.2.jar:/home/matt/.m2/repository/org/checkerframework/checker-qual/2.10.0/checker-qual-2.10.0.jar:/home/matt/.m2/repository/com/google/errorprone/error_prone_annotations/2.3.4/error_prone_annotations-2.3.4.jar:/home/matt/.m2/repository/com/google/j2objc/j2objc-annotations/1.3/j2objc-annotations-1.3.jar:/home/matt/.m2/repository/org/mockito/mockito-core/3.3.3/mockito-core-3.3.3.jar:/home/matt/.m2/repository/net/bytebuddy/byte-buddy/1.10.5/byte-buddy-1.10.5.jar:/home/matt/.m2/repository/net/bytebuddy/byte-buddy-agent/1.10.5/byte-buddy-agent-1.10.5.jar:/home/matt/.m2/repository/org/objenesis/objenesis/2.6/objenesis-2.6.jar:/home/matt/.m2/repository/org/powermock/powermock-module-junit4-legacy/2.0.2/powermock-module-junit4-legacy-2.0.2.jar:/home/matt/.m2/repository/org/powermock/powermock-module-junit4-common/2.0.2/powermock-module-junit4-common-2.0.2.jar:/home/matt/.m2/repository/org/powermock/powermock-reflect/2.0.2/powermock-reflect-2.0.2.jar:/home/matt/.m2/repository/org/powermock/powermock-core/2.0.2/powermock-core-2.0.2.jar:/home/matt/.m2/repository/org/javassist/javassist/3.24.0-GA/javassist-3.24.0-GA.jar:/home/matt/.m2/repository/org/powermock/powermock-api-mockito2/2.0.2/powermock-api-mockito2-2.0.2.jar:/home/matt/.m2/repository/org/powermock/powermock-api-support/2.0.2/powermock-api-support-2.0.2.jar:/home/matt/.m2/repository/org/antlr/antlr4-runtime/4.8-1/antlr4-runtime-4.8-1.jar"

    const javaArgs = [
        "java",
        "-cp",
        classpath,
        "repair.RepairEngine",
        "funcCorrection",
        tmpInput.name,
    ]

    const result = execSync(javaArgs.join(' ')).toString()
    console.log(result)
    const lines = result.trim().split('\n')
    console.log(lines[lines.length - 1])
    res.status(HttpStatus.OK).send(JSON.parse(lines[lines.length - 1]))
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))