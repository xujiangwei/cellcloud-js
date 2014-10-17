#!/bin/bash

echo 'Cell Cloud for JavaScript Builder (20141003)'

echo '*** Start building...'

# clear old files
rm -r ../bin

mkdir ../bin

cat filelist | while read FILE
do
	echo "../"$FILE
	cat "../"$FILE >> "../bin/nucleus.js"
done

# compress file
java -jar yuicompressor-2.4.8.jar ../bin/nucleus.js --charset utf8 --type js -o ../bin/nucleus-min.js -v

echo '*** End ****'
