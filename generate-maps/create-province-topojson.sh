#!/bin/sh
#
# Creates a TopoJSON file out of the given shapefiles.
#
# Usage: create-province-topojson.sh $LAND_SHP $WATER_SHP $OUTFILE

LAND=$1
WATER=$2
OUTFILE=$3

# NT and NU have lots of points. We can't go below simplify-proportion 0.035
set -x
topojson \
	-o $OUTFILE \
	-q 1e5 \
	--simplify-proportion 0.035 \
	--ignore-shapefile-properties \
	$LAND
