export default `#version 300 es

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;

in vec2 aVertexPosition;
in vec2 aTextureCoord;

out vec2 vTextureCoord;

void main() {
  gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
  vTextureCoord = aTextureCoord;
}
`;
