export const createVegaLiteRenderer = ({ baseSpec, vega, vegaLite }) => (
  itemSources
) =>
  Promise.all(
    itemSources.map((itemSrc) => {
      const values = Object.prototype.hasOwnProperty.call(itemSrc, 'values')
        ? itemSrc.values
        : itemSrc;
      const itemSpec = Object.prototype.hasOwnProperty.call(itemSrc, 'itemSpec')
        ? itemSrc.itemSpec
        : {};

      const spec = {
        ...baseSpec,
        ...itemSpec,
        data: { values },
      };

      const view = new vega.View(vega.parse(vegaLite.compile(spec).spec), {
        renderer: 'none',
      });

      return view.toCanvas();
    })
  );

export default createVegaLiteRenderer;
