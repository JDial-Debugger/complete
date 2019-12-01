classpath 	= bin:JDial-debugger/JavaMeddler_ANTLR_PARSE/*:JDial-debugger/SkechObject/lib/*:packages/*:.
src-dir		= JDial-debugger/SkechObject/src
json-parser-dir	= JDial-debugger/SkechObject/src/jsonparser
java-parser-dir	= JDial-debugger/SkechObject/src/javaparser



suggest: json-parser java-parser
	mkdir -p bin
	javac -cp $(classpath) QDEntry.java $(src-dir)/*.java $(src-dir)/*/*.java $(src-dir)/*/*/*.java -d bin
	
json-parser: $(json-parser-dir)/json.g4
	antlr4 -no-listener -visitor -package jsonparser $(json-parser-dir)/json.g4
	
java-parser: $(java-parser-dir)/simpleJava.g4
	antlr4 -no-listener -visitor -package javaparser $(java-parser-dir)/simpleJava.g4

clean: clean-java-parser clean-json-parser
	rm -rf bin/constraintfactory
	rm -rf bin/javaparser
	rm -rf bin/jsonast
	rm -rf bin/jsonparser
	rm -rf bin/sketchobj
	rm -rf bin/visitor
	rm -rf *.class

clean-json-parser:
	rm $(json-parser-dir)/json*.java

clean-java-parser:
	rm $(java-parser-dir)/simpleJava*.java
