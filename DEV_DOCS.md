# Developer Documentation

**Note, if you are trying to find out how to use pile.js please go to the [main docs](DOCS.md). This file only contains information for developing pile.js!**


# Depile

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


# PIXI.js Screengraph

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


# Pile API

Each visual [item](#item-api) is part of a pile. The pile class is the primary interface to manage and interact with the items. You never create pile instances yourself but 

## Pile properties

| Name          | Type                                                                      | Description                                                 | Read only |
| ------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- | --------- |
| bBox          | see notes                                                                 | The bounding box of the pile                                | `true`    |
| border        | [PIXI.Graphics](http://pixijs.download/release/docs/PIXI.Graphics.html)   | The bounding box of the pile                                | `true`    |
| cover         | [PIXI.Sprite](http://pixijs.download/release/docs/PIXI.Sprite.html)       | The cover of the pile if any                                | `true`    |
| cX            | float                                                                     | The center position of the pile graphics in x-axis          | `true`    |
| cY            | float                                                                     | The center position of the pile graphics in y-axis          | `true`    |
| graphics      | [PIXI.Graphics](http://pixijs.download/release/docs/PIXI.Graphics.html)   | The PIXI graphics object of the pile                        | `true`    |
| hasCover      | boolean                                                                   | Whether the pile has a cover or not                         |           |
| id            | int                                                                       | The id of the pile                                          | `true`    |
| isFocus       | boolean                                                                   | Whether the pile is selected by the user or not             |           |
| isTempDepiled | boolean                                                                   | Whether the pile is temporarily depiled or not              |           |
| itemContainer | [PIXI.Container](http://pixijs.download/release/docs/PIXI.Container.html) | The item container of the pile which contains items' sprite | `true`    |
| items         | Array                                                                     | An array of item instances in the pile                      | `true`    |
| size          | int                                                                       | The number of items in the pile                             | `true`    |
| x             | float                                                                     | The position of the pile graphics in x-axis                 | `true`    |
| y             | float                                                                     | The position of the pile graphics in y-axis                 | `true`    |

**Notes:**

- If the property is not read only, it can be set by `pile.property(newProperty)`. E.g.,

  ```javascript
  // Set 'hasCover' property to true
  pile.hasCover(true);
  ```

- `bBox` is an object which has the following properties: `minX`, `minY`, `maxX`, `maxY` and `pileId`.

## Pile methods

#### `pile.blur()`

Blur pile border.

#### `pile.hover()`

Drow pile border when the user is hovering on the pile.

#### `pile.focus()`

Drow pile border when the user select the pile.

#### `pile.active()`

Drow pile border when the pile is temporarily depiled.

#### `pile.addItem(itemInstance)`

Add an item instance to the pile.

#### `pile.hasItem(itemInstance)`

**Returns:** a boolean value of whether the pile has this item instance or not.

#### `pile.removeItems()`

Remove all the item instances in the pile.

#### `pile.borderSize(newBorderSize)`

Set the pile border size to the new value.

#### `pile.opacity(newOpacity, noAnimate)`

Set the pile opacity to the new value. `noAnimate` is a boolean value. If it's `true`, the opacity change will not be animated.

#### `pile.scale(newScale, noAnimate)`

Set the pile scale to the new value. `noAnimate` is a boolean value. If it's `true`, the scale change will not be animated.

#### `pile.calcBBox()`

**Returns:** the newly calculated bounding box of the pile. It's an object that has these properties: `minX`, `minY`, `maxX` and `maxY`.

#### `pile.updateBBox()`

Update the bounding box of the pile.

#### `pile.destroy()`

Destroy the pile instance.

#### `pile.drawBorder(size, mode)`

**Arguments:**

- `size`: an int value of the border size.
- `mode`: `Hover`, `Focus` or `Active`. Different mode refers to different border color and opacity. See [properties in `.set()`](#pilingsetproperty-value).

#### `pile.moveTo(x, y)`

Move the pile graphics to position `[x, y]`.


# Item API

## Item properties

| Name             | Type                                                                    | Description                                          | Read only |
| ---------------- | ----------------------------------------------------------------------- | ---------------------------------------------------- | --------- |
| id               | int                                                                     | The id of the item                                   | `true`    |
| x                | float                                                                   | The position of the item sprite in x-axis            | `true`    |
| y                | float                                                                   | The position of the item sprite in y-axis            | `true`    |
| originalPosition | [float, float]                                                          | The position of the item when it's initially created | `true`    |
| preview          | [PIXI.Graphics](http://pixijs.download/release/docs/PIXI.Graphics.html) | The preview of the item if any                       | `true`    |
| sprite           | [PIXI.Sprite](http://pixijs.download/release/docs/PIXI.Sprite.html)     | The PIXI sprite object of the item                   | `true`    |

## Item methods

#### `item.destroy()`

Destroy the item instance.

#### `item.moveTo(x, y)`

Move the item sprite to position `[x, y]`.

#### `item.opacity(newOpacity, noAnimate)`

Set the item opacity to the new value. `noAnimate` is a boolean value. If it's `true`, the opacity change will not be animated.
