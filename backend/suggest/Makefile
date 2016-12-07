classpath = bin:JavaMeddler_ANTLR_PARSE/*:SkechObject/lib/*:packages/*:.
factory   = SkechObject/src/constraintfactory
core      = SkechObject/src/sketchobj/core

suggest:
	mkdir -p bin
	javac -cp $(classpath) QDEntry.java SkechObject/src/*.java SkechObject/src/*/*.java SkechObject/src/*/*/*.java -d bin

clean:
	rm -rf bin/constraintfactory
	rm -rf bin/javaparser
	rm -rf bin/jsonast
	rm -rf bin/jsonparser
	rm -rf bin/sketchobj
	rm -rf bin/visitor
	rm -rf *.class
