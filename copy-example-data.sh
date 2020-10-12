#!/bin/sh

### Copy example data
mkdir -p webpage-build/demos/data

# 1. Photos
cp -r examples/data/coco-cars-remote-subsample.json webpage-build/demos/data/coco-cars.json

# 2. Matrices
cp -r examples/data/rao-2014-gm12878-chr-22-peaks.json webpage-build/demos/data/

# 3. COVID-19
cp -r examples/data/covid-19.json webpage-build/demos/data/

# 4. Drawings
cp -r examples/data/cake.json webpage-build/demos/data/
cp -r examples/data/flower.json webpage-build/demos/data/
cp -r examples/data/necklace.json webpage-build/demos/data/
cp -r examples/data/piano.json webpage-build/demos/data/
cp -r examples/data/power-outlet.json webpage-build/demos/data/
cp -r examples/data/teapot.json webpage-build/demos/data/
cp -r examples/data/smiley-face.json webpage-build/demos/data/
cp -r examples/data/snowman.json webpage-build/demos/data/

# 5. Ridge Plot
cp -r examples/data/monthly_temp_deviation_decades.json webpage-build/demos/data/

# 6. Vitessce
cp -r examples/data/vitessce-sample.json webpage-build/demos/data/

# 7. Scatterplots
cp -r examples/data/worldbank.json webpage-build/demos/data/

# 8. Time Series
cp -r examples/data/us-daily-precipitation-remote.json webpage-build/demos/data/us-daily-precipitation.json


### Copy docs
mkdir -p webpage-build/docs

cp -r docs/ webpage-build/docs


### Assets
cp examples/favicon.png webpage-build/demos/
