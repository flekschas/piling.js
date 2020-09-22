#!/bin/sh

### Copy example data
mkdir -p examples-build/data

# 1. Photos
cp -r examples/data/coco-cars-remote-subsample.json examples-build/data/coco-cars.json

# 2. Matrices
cp -r examples/data/rao-2014-gm12878-chr-22-peaks.json examples-build/data/

# 3. COVID-19
cp -r examples/data/covid-19.json examples-build/data/

# 4. Drawings
cp -r examples/data/cake.json examples-build/data/
cp -r examples/data/flower.json examples-build/data/
cp -r examples/data/necklace.json examples-build/data/
cp -r examples/data/piano.json examples-build/data/
cp -r examples/data/power-outlet.json examples-build/data/
cp -r examples/data/teapot.json examples-build/data/
cp -r examples/data/smiley-face.json examples-build/data/
cp -r examples/data/snowman.json examples-build/data/

# 5. Ridge Plot
cp -r examples/data/monthly_temp_deviation_decades.json examples-build/data/

# 6. Vitessce
cp -r examples/data/vitessce-sample.json examples-build/data/

# 7. Scatterplots
cp -r examples/data/worldbank.json examples-build/data/

# 8. Time Series
cp -r examples/data/us-daily-precipitation-remote.json examples-build/data/us-daily-precipitation.json


### Copy docs
mkdir -p examples-build/docs

cp -r docs/ examples-build/docs


### Assets
cp examples/favicon.png examples-build/
