import * as PIXI from 'pixi.js';

/**
 * A custom buffer resource for PIXI to support WebGL2 data textures
 */
class CustomBufferResource extends PIXI.resources.Resource {
  constructor(source, options) {
    const { width, height, internalFormat, format, type } = options || {};

    if (!width || !height || !internalFormat || !format || !type) {
      throw new Error(
        'CustomBufferResource width, height, internalFormat, format, or type invalid'
      );
    }

    super(width, height);

    this.data = source;
    this.internalFormat = internalFormat;
    this.format = format;
    this.type = type;
  }

  upload(renderer, baseTexture, glTexture) {
    const gl = renderer.gl;

    gl.pixelStorei(
      gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
      baseTexture.alphaMode === 1 // PIXI.ALPHA_MODES.UNPACK but `PIXI.ALPHA_MODES` are not exported
    );

    glTexture.width = baseTexture.width;
    glTexture.height = baseTexture.height;

    gl.texImage2D(
      baseTexture.target,
      0,
      gl[this.internalFormat],
      baseTexture.width,
      baseTexture.height,
      0,
      gl[this.format],
      gl[this.type],
      this.data
    );

    return true;
  }
}

export default CustomBufferResource;
