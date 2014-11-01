PROVINCES = \
	newfoundland-and-labrador \
	prince-edward-island \
	nova-scotia \
	new-brunswick \
	quebec \
	ontario \
	manitoba \
	saskatchewan \
	alberta \
	british-columbia \
	yukon \
	northwest-territories \
	nunavut

all: ../d/canada.json $(PROVINCES:%=../d/pr/%.json)

.PRECIOUS: gen/%.json/land.shp

../d/canada.json: provinces.shp
	topojson -o $@ \
		-q 1e5 \
		-s 7e-7 \
		--ignore-shapefile-properties \
		-- $^

gen/%.json/land.shp: provinces.shp extract-province.sh create-province-topojson.sh
	mkdir -p `dirname $@`
	./extract-province.sh $(patsubst gen/%.json/land.shp,%,$@) provinces/*.shp $@

../d/pr/%.json: gen/%.json/land.shp
	mkdir -p `dirname $@`
	./create-province-topojson.sh "$^" "" $@

water.shp: water/ghy_000c11a_e.zip
	(cd `dirname $<` && unzip -o `basename $<`)
	cp water/ghy_000c11a_e.dbf water.dbf
	cp water/ghy_000c11a_e.shp $@
	touch $@

roads.shp: roads/grnf000r11a_e.zip
	(cd `dirname $<` && unzip -o `basename $<`)
	cp roads/grnf000r11a_e.dbf roads.dbf
	cp roads/grnf000r11a_e.shp $@
	touch $@

provinces.shp: provinces/gpr_000b11a_e.zip
	(cd `dirname $<` && unzip -o `basename $<`)
	cp provinces/gpr_000b11a_e.dbf provinces.dbf
	cp provinces/gpr_000b11a_e.shp $@
	touch $@

tracts.shp: tracts/gct_000b11a_e.zip
	(cd `dirname $<` && unzip -o `basename $<`)
	cp tracts/gct_000b11a_e.dbf tracts.dbf
	cp tracts/gct_000b11a_e.shp $@
	touch $@

clean:
	rm -rf ./gen
	rm -f *.shp *.dbf */*.pdf */*.dbf */*.prj */*.shp */*.shx
