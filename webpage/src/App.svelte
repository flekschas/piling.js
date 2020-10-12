<script>
  import { onMount } from 'svelte';

  import Button from '@smui/button';
  import IconButton from '@smui/icon-button';
  import mediumZoom from 'medium-zoom';

  import Badge from './Badge.svelte';
  import ExampleGallery from './ExampleGallery.svelte';
  import Footer from './Footer.svelte';
  import GitHubBadge from './GitHubBadge.svelte';
  import Headline from './Headline.svelte';
  import Main from './Main.svelte';
  import Overflow from './Overflow.svelte';
  import Publication from './Publication.svelte';
  import Ratio from './Ratio.svelte';
  import Section from './Section.svelte';
  import TopNav from './TopNav.svelte';

  import createPilingImages from './piling-images.js';
  import createPilingLineCharts from './piling-line-charts.js';
  import createPilingAreaCharts from './piling-area-charts.js';

  const introCode = `import createPilingJs, { createImageRenderer } from 'piling.js';

const piling = createPilingJs(domElement, {
  items: [
    { src: 'https://storage.googleapis.com/pilingjs/coco-cars/000000209544.jpg' },
    { src: 'https://storage.googleapis.com/pilingjs/coco-cars/000000218397.jpg' },
    { src: 'https://storage.googleapis.com/pilingjs/coco-cars/000000342185.jpg' },
    { src: 'https://storage.googleapis.com/pilingjs/coco-cars/000000383158.jpg' },
  ],
  itemRenderer: createImageRenderer(),
  columns: 4,
  darkMode: true
});`;

  const viewSpecs = `piling.set({
  columns: 4,
  pileBorderSize: 4,
  pileItemOffset: [5,5],
});`

  const pileState = `{
  index: 0,
  id: '0',
  x: 0,
  y: 5,
  items: ['0', '1', '2']
}`

  const pileBorderSize = `const piling = createPilingJs(domElement, {
  items: [/* Items of your choice */],
  pileBorderSize: (pile) => pile.items.length,
  pileScale: (pile) => 1 + Math.log10(pile.items.length),
});`;

  const pileItemBrightness = `const piling = createPilingJs(domElement, {
  items: [/* Items of your choice */],
  pileItemBrightness: (item, i, pile) =>
    Math.min(0.5, 0.01 * (pile.items.length - i - 1)),,
});`;

  let pilingElIntro;
  let pilingElPileProp;
  let pilingElPileItemProp;

  let dragDrop = false;
  let multiSelect = false;
  let lasso = false;
  let inPlaceBrowsing = false;
  let previewBrowsing = false;
  let dispersiveBrowsing = false;
  let hierarchicalBrowsing = false;
  let pileDispersion = false;
  let pileScaling = false;

  function show(demo) {
    dragDrop = demo === 'dragDrop' ? !dragDrop : false;
    multiSelect = demo === 'multiSelect' ? !multiSelect : false;
    lasso = demo === 'lasso' ? !lasso : false;
    inPlaceBrowsing = demo === 'inPlaceBrowsing' ? !inPlaceBrowsing : false;
    previewBrowsing = demo === 'previewBrowsing' ? !previewBrowsing : false;
    dispersiveBrowsing = demo === 'dispersiveBrowsing' ? !dispersiveBrowsing : false;
    hierarchicalBrowsing = demo === 'hierarchicalBrowsing' ? !hierarchicalBrowsing : false;
    pileDispersion = demo === 'pileDispersion' ? !pileDispersion : false;
    pileScaling = demo === 'pileScaling' ? !pileScaling : false;
  }

  onMount(() => {
    createPilingImages(pilingElIntro);
    createPilingAreaCharts(pilingElPileProp);
    createPilingLineCharts(pilingElPileItemProp);
    mediumZoom('.zoomable', { margin: 24, background: 'rgba(0, 0, 0, 0.8)' });
  });
</script>

<style>
  code {
    padding: 0.05em 0.1em;
    font-size: 0.9em;
    color: var(--code-color);
    background: var(--code-bg-color);
    border-radius: 0.125em;
  }

  code a {
    margin: -0.05em -0.1em;
    padding: 0.05em 0.1em;
    box-shadow: inset 0 0 0 0 var(--code-color);
    border-radius: 0.125em 0.125em 0 0;
  }

  code a:hover {
    color: var(--primary-color);
    background: var(--primary-bg-color);
    box-shadow: inset 0 -0.25em 0 0 var(--primary-color);
  }

  pre {
    padding: 0.5em;
    font-size: 0.85em;
    line-height: 1.25em;
    background: var(--code-bg-color);
    box-shadow: -2px 0 0 0 var(--code-color);
    border-radius: 0 0.125em 0.125em 0;
    overflow-x: auto;
  }

  pre code {
    background: transparent;
  }

  .container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    box-shadow: 0 0 0 1px var(--gray-medium);
    border-radius: 0.25rem;
  }

  .container-pilingjs {
    margin-top: 1rem;
    margin-bottom: 1rem;
  }

  .container-warn {
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    color: black;
    background: var(--gray-medium);
  }

  .caption,
  .caption-inline {
    color: var(--gray-medium);
    text-align: center;
  }

  .caption {
    position: absolute;
    left: 0;
    right: 0;
  }

  .video {
    width: 100%;
    height: 100%;
  }

  .example-buttons {
    margin-left: -1px;
    margin-right: -1px;
  }

  .example-buttons :global(.smui-button__group) {
    display: flex;
  }

  .example-buttons :global(.mdc-button) {
    flex-grow: 1;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  .example-buttons :global(.mdc-button:disabled) {
    border-color: var(--gray-medium);
    cursor: not-allowed;
  }

  .example-buttons :global(.mdc-button:disabled .mdc-button__label) {
    text-decoration: line-through;
    opacity: 0.75;
  }

  .no-wrap {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  .interactions {
    padding: 0;
    list-style: none;
  }

  .interactions > li {
    display: flex;
  }

  .interactions > li .text {
    flex-grow: 1;
  }

  .interactions > li .demo {
    position: relative;
    margin-left: 1rem;
  }

  .popover {
    position: absolute;
    z-index: 10;
    top: 2.5rem;
    left: 50%;
    transform: translate(-50%, 0);
    padding: 0.25rem;
    min-width: 10rem;
    min-height: 6.25rem;
    border-radius: 0.25rem;
    border: 2px solid var(--gray-medium);
    background-color: black;
    background: black url(/images/loading.png) no-repeat center center;
    background-size: contain;
  }

  ol.centered {
    display: flex;
    padding: 0;
    margin: 0.5em 0;
    justify-content: center;
    list-style: none;
  }

  ol.arrowed li {
    display: flex;
    align-items: center;
  }

  ol.arrowed li:after {
    content: '';
    display: block;
    width: 0;
    height: 0;
    margin: 0 0.5em;
    border-top: 0.25em solid transparent;
    border-bottom: 0.25em solid transparent;
    border-left: 0.25em solid var(--gray-medium);
  }

  ol.arrowed li:last-child:after {
    display: none;
  }

  /* 640px */
  @media screen and (min-width: 40em) {
    .bigger {
      font-size: 1.125em;
    }
  }

  /* 960px */
  @media screen and (min-width: 60em) {
    .bigger {
      font-size: 1.25em;
    }

    .justify {
      text-align: justify;
    }
  }

  /* 1280px */
  @media screen and (min-width: 80em) {
    .bigger {
      font-size: 1.375em;
    }
  }
</style>

<Main>
  <GitHubBadge />
  <TopNav />
  <Headline level={1}>Piling.js</Headline>
  <Headline level={2}>
    <span class="no-wrap">A JavaScript Library for</span>
    <span class="no-wrap">Interactive Visual Piling</span>
    <span class="no-wrap">of Small Multiples</span>
  </Headline>
  <Section>
    <div slot="center">
      <p class="bigger justify">Piling.js is a JavaScript library to build <a href="https://piling.lekschas.de" target="_blank" rel="noreferrer noopener">visual piling interfaces</a> for exploring large collections of small multiples. Piling.js is data-agnostic and build around a declaritive view specification to avoid having to write low-level code. Being build on top of <a href="https://www.pixijs.com" target="_blank" rel="noreferrer noopener">PixiJS</a>' powerful WebGl rendering framework, Piling.js can render up to several thousand small multiples.</p>
    </div>
  </Section>
  <Section>
    <div slot="center">
      <Overflow>
        <ExampleGallery />
      </Overflow>
    </div>
  </Section>
  <Section>
    <div slot="center">
      <Headline level={3} id="introduction" lines>Introduction</Headline>
      <p>Piling.js allows to build visual piling interfaces for exploring small multiples with relatively little efforts. As a visualization designer, you have to specify the data of the small multiple items, a matching renderer for turning the items into an visual form, and a declarative view specification to define the visual pile encoding. In turn, Piling.js handles the piling state and interactions for manually and data-driven arranging and grouping the small multiples.</p>
      <p>Piling.js entirely relies on you when it comes to the visual design of the individual small multiple items to be data and use-case agnostic. Out of the box, Piling.js supports rendering images, matrices, and SVG (yes, <a href="https://d3js.org/" target="_blank" rel="noreferrer noopener">D3</a> is supported too). Ultimately, all items are rendered with WebGL using <a href="https://www.pixijs.com" target="_blank" rel="noreferrer noopener">PixiJS</a> for scalability. Piling.js's view specification is inspired by D3's <code><a href="https://github.com/d3/d3-selection#selection_attr" target="_blank" rel="noreferrer noopener">attr()</a></code> for ease of use and functional expressiveness.</p>
      <p>For example, the code below is all that is needed to get started.</p>
    </div>
    <div slot="left">
      <pre><code class="language-js">{introCode}</code></pre>
    </div>
    <div slot="right">
      <Ratio ratio={2800/1800}>
        <div class="container container-pilingjs" bind:this={pilingElIntro} />
      </Ratio>
    </div>
  </Section>
  <Section>
    <article slot="center">
      <Headline level={3} id="interactions" lines>Interactions</Headline>
      <p>Piling should be seen as a dynamic process where the grouping state can change frequently. Therefore, Piling.js supports the following mouse interactions:</p>
      <ul class="interactions">
        <li>
          <p class="text">
            <strong>Drag and Drop Grouping</strong><br/> Click and hold a pile and drag it onto another pile.
          </p>
          <p class="demo">
            <IconButton class="material-icons" on:click={() => show('dragDrop')} dense>pageview</IconButton>
            {#if dragDrop}
              <div class="popover">
                <img
                  src="https://user-images.githubusercontent.com/932103/78094083-aa298c80-73a1-11ea-95c8-f436e70b2c9d.gif"
                  alt="Drag and drop interaction">
              </div>
            {/if}
          </p>
        </li>
        <li>
          <p class="text">
            <strong>Multi-Select Grouping</strong><br/> First, hold down <Badge text="SHIFT" /> and click on the piles you want to group. Then, click <em>again</em> on one of the selected piles to stack all items onto this pile.
          </p>
          <p class="demo">
            <IconButton class="material-icons" on:click={() => show('multiSelect')} dense>pageview</IconButton>
            {#if multiSelect}
              <div class="popover">
                <img
                  src="https://user-images.githubusercontent.com/932103/78094274-27ed9800-73a2-11ea-9efe-3f9121337657.gif"
                  alt="Multi-select interaction">
              </div>
            {/if}
          </p>
        </li>
        <li>
          <p class="text">
            <strong>Lasso Grouping</strong><br/> First, click on an empty area of the canvas and wait for a translucent circle to appear under your cursor. Then, click and hold onto the translucent circle and draw the lasso.
          </p>
          <p class="demo">
            <IconButton class="material-icons" on:click={() => show('lasso')} dense>pageview</IconButton>
            {#if lasso}
              <div class="popover">
                <img
                  src="https://user-images.githubusercontent.com/932103/78094424-84e94e00-73a2-11ea-8958-55ba0c032b65.gif"
                  alt="Lasso interaction">
              </div>
            {/if}
          </p>
        </li>
        <li>
          <p class="text">
            <strong>In-Place Browsing</strong><br/> Click on a pile and mouse over a partially-shown item.
          </p>
          <p class="demo">
            <IconButton class="material-icons" on:click={() => show('inPlaceBrowsing')} dense>pageview</IconButton>
            {#if inPlaceBrowsing}
              <div class="popover">
                <img
                  src="https://user-images.githubusercontent.com/39853191/78209002-7604b780-74d8-11ea-9211-34503e424135.gif"
                  alt="In-place browsing interaction">
              </div>
            {/if}
          </p>
        </li>
        <li>
          <p class="text">
            <strong>Preview Browsing</strong><br/> Click on a pile and mouse over a preview.
          </p>
          <p class="demo">
            <IconButton class="material-icons" on:click={() => show('previewBrowsing')} dense>pageview</IconButton>
            {#if previewBrowsing}
              <div class="popover">
                <img
                  src="https://user-images.githubusercontent.com/39853191/78207017-03dda400-74d3-11ea-8078-ed1d891f93d5.gif"
                  alt="Preview browsing interaction">
              </div>
            {/if}
          </p>
        </li>
        <li>
          <p class="text">
            <strong>Dispersive Browsing</strong><br/> Double click on a pile.
          </p>
          <p class="demo">
            <IconButton class="material-icons" on:click={() => show('dispersiveBrowsing')} dense>pageview</IconButton>
            {#if dispersiveBrowsing}
              <div class="popover">
                <img
                  src="https://user-images.githubusercontent.com/39853191/78208161-42c12900-74d6-11ea-8ea9-01886a59b37f.gif"
                  alt="Dispersive browing interaction">
              </div>
            {/if}
          </p>
        </li>
        <li>
          <p class="text">
            <strong>Hierarchical Browsing</strong><br/> Right click on a pile and select <em>"Browse Separately"</em>.
          </p>
          <p class="demo">
            <IconButton class="material-icons" on:click={() => show('hierarchicalBrowsing')} dense>pageview</IconButton>
            {#if hierarchicalBrowsing}
              <div class="popover">
                <img
                  src="https://user-images.githubusercontent.com/39853191/78208546-38ebf580-74d7-11ea-9c82-57265446f015.gif"
                  alt="Hierarchical browsing interaction">
              </div>
            {/if}
          </p>
        </li>
        <li>
          <p class="text">
            <strong>Pile Dispersion</strong><br/> Hold down <Badge text="ALT" /> and click on a pile.
          </p>
          <p class="demo">
            <IconButton class="material-icons" on:click={() => show('pileDispersion')} dense>pageview</IconButton>
            {#if pileDispersion}
              <div class="popover">
                <img
                  src="https://user-images.githubusercontent.com/39853191/78209508-ca5c6700-74d9-11ea-8604-bbdc4159f3c5.gif"
                  alt="Pile dispersion interaction">
              </div>
            {/if}
          </p>
        </li>
        <li>
          <p class="text">
            <strong>Pile Scaling</strong><br/> Hold down <Badge text="ALT" /> and scroll over a pile.
          </p>
          <p class="demo">
            <IconButton class="material-icons" on:click={() => show('pileScaling')} dense>pageview</IconButton>
            {#if pileScaling}
              <div class="popover">
                <img
                  src="https://user-images.githubusercontent.com/39853191/78210748-b9adf000-74dd-11ea-87b8-29a96d5400fc.gif"
                  alt="Pile scaling interaction">
              </div>
            {/if}
          </p>
        </li>
      </ul>
    </article>
  </Section>
  <Section>
    <article slot="center">
      <Headline level={3} id="rendering-pipeline" lines>Rendering Pipeline</Headline>
      <p>To support many different pile design, Piling.js is build around the following 3-step rendering pipeline:</p>

      <Overflow>
        <figure style="margin: 2rem 0;">
          <img
            class="zoomable"
            src="images/rendering-pipeline.png"
            alt="Renderng Pipeline"
          >
        </figure>
      </Overflow>

      <p><strong>Data:</strong> Piling.js expects the small multiples data to come in form of a list of objects. Each small multiple item is represented by an object, which must feature a <code>src</code> property and can optionally contain other metadata properties. The item <code>src</code> can come in any form as long as it's understood by the renderer.</p>

      <p><strong>Aggregation:</strong> To increase the content awareness of piles, Piling.js supports rendering pile covers and item previews. The covers and previews typically show a summary of the pile and item respectively. To optain such a summary, the data as to be aggregated by a corresponding aggregator function. For instance, the cover of a pile of matrices could visualize the mean or standard deviation of the matrices. And the previews could show the column- or row-wise sum. When you think of a pile as a 3-way tensor (x-axis &times; y-axis &times; items) then the cover aggregator is expected to reduce the tensor along the <em>items</em> while the preview aggregator is expected to reduce the tensor along the <em>e-axis</em> or <em>y-axis</em> (or both).</p>

      <p><strong>Rendering:</strong> Finally, the items' <code>src</code> properties are passed to a renderer function. The renderer function's task is to translate the data into a form that is renderable by PixiJS. See the accaptable <code>source</code> types of <code>PIXI.Texture</code>'s <code><a href="https://pixijs.download/dev/docs/PIXI.Texture.html#from" target="_blank" rel="noreferrer noopener">from()</a></code> and <code><a href="https://pixijs.download/dev/docs/PIXI.Texture.html#fromBuffer" target="_blank" rel="noreferrer noopener">fromBuffer()</a></code>. To get you started quickly, Piling.js provides <a href="https://piling.js.org/docs/?id=predefined-renderers">renderers for images, matrices, SVGs</a> out of the box.</p>
    </article>
  </Section>
  <Section>
    <div slot="top">
      <Headline level={3} id="view-specification" lines>View Specification</Headline>
      <p>The view specification is a flat object defining the visual properties of the piling interface. You can either specify the properties on initialization or using <code>set()</code>. If you know D3, you can think of this method as being similar to <code>attr()</code> with the added benefit that you can set multiple properties at once.</p>
      <pre><code class="language-js">{viewSpecs}</code></pre>
      <p>Piling.js distinguishes between <em>global</em>, <em>pile-specific</em>, and <em>pile item-specific</em> properties. For instance, in the example above, <code>columns</code> is a global, <code>pileBorderSize</code> is a pile-specific, and <code>pileItemOffset</code> is a pile item-specific property. The main difference between the three property types is that pile- and pile item-specific properties support functional values for data-driven pile encodings. Pile-specific properties accept a function that receives as input the state corresponding pile and is expected to return a valid value. The pile state is an object of the following form:</p>
      <pre><code class="language-js">{pileState}</code></pre>
      <p>Pile-item specific properties accept a function that receives as input the item state, item index (related to the pile), and pile state. The item state is an object and corresponds to <code>items</code> that you passed into <code>createPilingJs()</code>.</p>
  </Section>
  <Section>
    <div slot="top">
      <p>For instance, in the following example the pile border size and scale is a function of the number of items on a pile. Try piling up multiple items and see how the border size and pile scale increases!</p>
    </div>
    <div slot="left">
      <Ratio ratio={2800/1800}>
        <div class="container container-pilingjs" bind:this={pilingElPileProp} />
      </Ratio>
    </div>
    <div slot="right">
      <pre><code class="language-js">{pileBorderSize}</code></pre>
    </div>
  </Section>
  <Section>
    <div slot="top">
      <p>In the next example, we demonstrate how a pile item-specific property works using <code>pileItemBrightness</code>. The item brightness ranges from <code>-1</code> (completely black) to <code>1</code> (completely white). Try piling up some items and see how items with a lower index <em>fade out</em> as we decrease their brightness.</p>
    </div>
    <div slot="left">
      <pre><code class="language-js">{pileItemBrightness}</code></pre>
    </div>
    <div slot="right">
      <Ratio ratio={2800/1800}>
        <div class="container container-pilingjs" bind:this={pilingElPileItemProp} />
      </Ratio>
    </div>
  </Section>
  <Section>
    <div slot="center">
      <Headline level={3} id="more-resources" lines>More Resources</Headline>
      <p>If you want to dive deeper into the design space of visual piling please take a look at <a href="https://piling.lekschas.de" target="_blank" rel="noreferrer noopener">piling.lekschas.de</a> and our publication.</p>
      <Publication>
        <a href="https://vcg.seas.harvard.edu/pubs/piling" target="_blank" slot="title">A Generic Framework and Library for Exploration of Small Multiples through Interactive Piling</a>
        <ol slot="authors">
          <li>Fritz Lekschas</li>
          <li>Xinyi Zhou</li>
          <li>Wei Chen</li>
          <li>Nils Gehlenborg</li>
          <li>Benjamin Bach</li>
          <li>Hanspeter Pfister</li>
        </ol>
        <span slot="journal">To appear in IEEE Transactions on Visualization and Computer Graphics</span>
        <span slot="series">InfoVis '20</span>
        <span slot="year">2020</span>
      </Publication>
    </div>
  </Section>
</Main>
<Footer />
