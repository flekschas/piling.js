<script>
  export let level = 1;
  export let lines = false;
  export let id = '';

  level = Math.max(1, Math.min(6, level));

  const showAnchor = id && id.length;
</script>

<style>
  h1, h2, h3, h4, h5, h6 {
    color: var(--text-color);
    line-height: 1.5;
    transition: font-size var(--tnormal) var(--ease);
    font-weight: bold;
  }

  h1, h2, h3 {
    margin: 5rem 0 1.5rem 0;
  }

  h1 + h2 {
    margin-top: 1.5rem;
  }

  h1 {
    position: relative;
    margin: 2rem 0 1rem 0;
    font-size: 2rem;
    line-height: 1.25;
    color: var(--bg-color);
  }

  h1 .container {
    position: relative;
    height: 100%;
    width: 100%;
  }

  h1 .text {
    position: relative;
    z-index: 1;
  }

  h1 .bar {
    position: absolute;
    z-index: 0;
    top: 0.02em;
    left: -0.125em;
    display: block;
    width: calc(100% + 0.25em);
    height: 0.25em;
    border-radius: 0.075em;
    background: var(--primary-color);
  }

  h1 .bar:nth-child(2) {
    top: 0.32em;
  }

  h1 .bar:nth-child(3) {
    top: 0.62em;
  }

  h1 .bar:nth-child(4) {
    top: 0.92em;
  }

  h2 {
    font-size: 1.5rem;
  }

  h3 {
    font-size: 1.25em;
  }

  h4 {
    margin: 1.5rem 0 0.125rem 0;
    font-size: 1rem;
  }

  h5,
  h6 {
    font-size: 1rem;
  }

  .lines {
    display: flex;
    align-items: center;
  }

  .lines:after {
    content: '';
    display: block;
    flex-grow: 1;
    height: 1px;
    background: var(--gray-medium);
  }

  .lines:after {
    margin-left: 1rem;
  }

  .container {
    position: relative;
  }

  .anchor {
    display: block;
    position: absolute;
    left: 0;
    margin-right: 0.25em;
    opacity: 0;
    color: var(--gray-medium);
    box-shadow: none;
    transition: opacity var(--tnormal) var(--ease);
  }

  .showAnchor .anchor:hover,
  .showAnchor:target .anchor {
    color: var(--primary-color);
  }

  .showAnchor:hover .anchor,
  .showAnchor:target .anchor {
    opacity: 1;
  }

  .text {
    transition: padding-left var(--tnormal) var(--ease);
  }

  .showAnchor:hover .text,
  .showAnchor:target .text {
    padding-left: 0.75em;
  }

  /* 400px */
  @media screen and (min-width: 25rem) {
    h1 .text :global(> *:last-child) {
      font-size: inherit;
    }
  }

  /* 480px */
  @media screen and (min-width: 30rem) {
    h1 {
      font-size: 2.5rem;
      line-height: 1.25;
      text-align: center;
    }

    h2 {
      font-size: 1.75rem;
      text-align: center;
    }

    h3 {
      font-size: 1.375em;
      text-align: center;
    }

    h4 {
      margin: 1.5rem 0 0.125rem 0;
      font-size: 1.125rem;
    }

    h5,
    h6 {
      font-size: 1rem;
    }

    .lines:before {
      content: '';
      display: block;
      flex-grow: 1;
      height: 1px;
      background: var(--gray-medium);
    }

    .lines:before {
      margin-right: 1rem;
    }
  }

  /* 720px */
  @media screen and (min-width: 45rem) {
    h1 {
      font-size: 3rem;
      line-height: 1.25;
    }
  }

  /* 1280px */
  @media screen and (min-width: 80rem) {
    h1 {
      font-size: 4rem;
      line-height: 1.2em;
    }
  }

  /* 1600px */
  @media screen and (min-width: 100rem) {
    h1 {
      font-size: 5rem;
      line-height: 1.125em;
    }
  }
</style>

{#if level === 1}
  <h1 class:lines class:showAnchor id={id}>
    <span class="container">
      <span class="text"><slot /></span>
      <span class="bar" />
      <span class="bar" />
      <span class="bar" />
      <span class="bar" />
    </span>
  </h1>
{:else if level === 2}
  <h2 class:lines class:showAnchor id={id}>
    <span class="container">
      {#if id}<a href={`#${id}`} class="anchor">#</a>{/if}
      <span class="text"><slot /></span>
    </span>
  </h2>
{:else if level === 3}
  <h3 class:lines class:showAnchor id={id}>
    <span class="container">
      {#if id}<a href={`#${id}`} class="anchor">#</a>{/if}
      <span class="text"><slot /></span>
    </span>
  </h3>
{:else if level === 4}
  <h4 class:lines class:showAnchor id={id}>
    <span class="container">
      {#if id}<a href={`#${id}`} class="anchor">#</a>{/if}
      <span class="text"><slot /></span>
    </span>
  </h4>
{:else if level === 5}
  <h5 class:lines class:showAnchor id={id}>
    <span class="container">
      {#if id}<a href={`#${id}`} class="anchor">#</a>{/if}
      <span class="text"><slot /></span>
    </span>
  </h5>
{:else if level === 6}
  <h6 class:lines class:showAnchor id={id}>
    <span class="container">
      {#if id}<a href={`#${id}`} class="anchor">#</a>{/if}
      <span class="text"><slot /></span>
    </span>
  </h6>
{/if}
