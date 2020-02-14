import { ndjsonToJsonText } from 'ndjson-to-json-text';
import createPilingJs from '../src/library';
import { createQuickDrawRenderer } from '../src/renderer';

const createDrawingPiles = async element => {
  const ndjsonText = await fetch('data/apple.ndjson').then(body =>
    body.text().then(s => s)
  );

  const jsonText = ndjsonToJsonText(ndjsonText);

  const data = JSON.parse(jsonText).map(d => {
    d.src = d.drawing;
    delete d.drawing;
    return d;
  });

  const testData = data.slice(0, 100);

  const quickDrawRenderer = createQuickDrawRenderer();

  const pilingJs = createPilingJs(element, {
    renderer: quickDrawRenderer,
    items: testData
  });

  return pilingJs;
};

export default createDrawingPiles;
