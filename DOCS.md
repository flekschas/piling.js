# DOCS

## Depile

input: 
`distanceMat`: a matrix that every cell store the distance from the cell to the `originalPos`
`resultMat`: the result of the convolution between the grid matrix and the filter
`originalPos`: the center of the depiling pile
output: 
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
