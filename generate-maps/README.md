Raw boundary files
==================

This directory holds raw boundary files, used to generate the TopoJSON map files
in `../d/`. (Those files are included in the Git repository, so you don't _need_
to do anything in this directory.)

Prerequisites
-------------

Should you wish to regenerate the TopoJSON map files, you'll need to download
some prerequisites which aren't in this Git repository:

* [provinces/gpr_000b11a_e.zip](http://www12.statcan.gc.ca/census-recensement/2011/geo/bound-limit/files-fichiers/gpr_000b11a_e.zip)
* [ogr2ogr](http://trac.osgeo.org/gdal/wiki/DownloadingGdalBinaries)
* TopoJSON command-line tools: `npm install -g topojson`

Running
-------

Run `make` to regenerate everything in `../d/`.
