classpath = bin:JDial-debugger/JavaMeddler_ANTLR_PARSE/*:JDial-debugger/SkechObject/lib/*:packages/*:.
factory   = JDial-debugger/SkechObject/src/constraintfactory
core      = JDial-debugger/SkechObject/src/sketchobj/core

suggest:
	mkdir -p bin
	javac -cp $(classpath) QDEntry.java JDial-debugger/SkechObject/src/*.java JDial-debugger/SkechObject/src/*/*.java JDial-debugger/SkechObject/src/*/*/*.java -d bin

clean:
	rm -rf bin/constraintfactory
	rm -rf bin/javaparser
	rm -rf bin/jsonast
	rm -rf bin/jsonparser
	rm -rf bin/sketchobj
	rm -rf bin/visitor
	rm -rf *.class
