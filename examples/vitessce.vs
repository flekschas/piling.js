export default `#version 300 es

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;

in vec2 aPosition;
in vec2 aTexCoords;

out vec2 vTexCoord;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vTexCoord = aTexCoords;
}
`;
