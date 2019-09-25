# Developer Documentation

**Note, if you are trying to find out how to use pile.js please go to the [main docs](DOCS.md). This file only contains information for developing pile.js!**

## Depile

The pseudocode for finding the closest available cell for de-piling.

**input:**

`distanceMat`: a matrix that every cell store the distance from the cell to the `originalPos`

`resultMat`: the result of the convolution between the grid matrix and the filter

`originalPos`: the center of the depiling pile

**output:**

`depilePos`: the center of the items to be placed

```
currentPos = originalPos;
depilePos = false;
while(!depilePos)
  if(resultMat(currentPos) = 0)
    depilePos = currentPos;
  if(!depilePos)
    calcDist(distanceMat, top of currentPos, originalPos);
    calcDist(distanceMat, left of currentPos, originalPos);
    calcDist(distanceMat, bottom of currentPos, originalPos);
    calcDist(distanceMat, right of currentPos, originalPos);
    currentPos = getClosestPos(distanceMat, currentPos);
return depilePos
```

## PIXI.js Screengraph

The `stage` is the root PIXI container that we render everything on.

- stage
  - lasso container
    - lasso graphics
  - active pile container
  - normal piles container
    - pile graphics
      - hover item container
      - item container
      - border container
  - lasso bg container
    - lasso fill graphics
  - grid graphics
