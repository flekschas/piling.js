import { ndjsonToJsonText } from 'ndjson-to-json-text';
import createPilingJs from '../src/library';
import {
  createQuickDrawRenderer,
  createQuickDrawCoverRenderer
} from '../src/renderer';
import { createQuickDrawCoverAggregator } from '../src/aggregator';

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

  const testData = data.slice(0, 1000);

  const quickDrawRenderer = createQuickDrawRenderer();
  const quickDrawCoverAggregator = createQuickDrawCoverAggregator();
  const quickDrawCoverRenderer = createQuickDrawCoverRenderer();

  const pilingJs = createPilingJs(element, {
    renderer: quickDrawRenderer,
    aggregateRenderer: quickDrawCoverRenderer,
    coverAggregator: quickDrawCoverAggregator,
    items: testData,
    itemSize: 64,
    cellPadding: 25,
    pileVisibilityItems: pile => pile.items.length === 1,
    pileItemAlignment: 'overlap',
    pileBackgroundColor: 'rgba(255, 255, 255, 0.66)',
    backgroundColor: '#ffffff',
    lassoFillColor: '#000000',
    lassoStrokeColor: '#000000'
  });

  return pilingJs;
};

export default createDrawingPiles;
