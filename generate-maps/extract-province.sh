#!/bin/sh
#
# Extracts a single province into a new shapefile.
#
# Usage: extract-province.sh [province] [provinces-shapefile] [outfile]

PROVINCE=$1
INFILE=$2
OUTFILE=$3

# Calculate PRUID
case $PROVINCE in
	newfoundland-and-labrador) PRUID=10;;
	prince-edward-island) PRUID=11;;
	nova-scotia) PRUID=12;;
	new-brunswick) PRUID=13;;
	quebec) PRUID=24;;
	ontario) PRUID=35;;
	manitoba) PRUID=46;;
	saskatchewan) PRUID=47;;
	alberta) PRUID=48;;
	british-columbia) PRUID=59;;
	yukon) PRUID=60;;
	northwest-territories) PRUID=61;;
	nunavut) PRUID=62;;
esac

set -x
ogr2ogr \
	-overwrite \
	-f 'ESRI Shapefile' \
	-where "PRUID='$PRUID'" \
	-nln $(basename $OUTFILE .shp) \
	$(dirname $OUTFILE) \
	$INFILE \
	$(basename $INFILE .shp)
