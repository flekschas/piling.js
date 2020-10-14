<script>
  const slots = $$props.$$slots
</script>

<style>
  h4 {
    font-size: 1.125em;
    line-height: 1.25em;
    margin: 1em 0 0 0;
  }

  p {
    margin: 0.125em 0;
  }

  .authors :global(ol) {
    display: flex;
    flex-wrap: wrap;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .authors :global(ol > li) {
    margin-right: 0.25em;
  }

  .authors :global(ol > li:last-child) {
    margin-right: 0;
  }

  .authors :global(ol > li:after) {
    content: ', ';
  }

  .authors :global(ol > li:last-child:after) {
    content: '.';
  }

  .authors :global(ol > li:last-child:before) {
    content: ' and ';
  }

  .venue {
    display: flex;
    flex-wrap: wrap;
  }

  .venue > * {
    margin-left: 0.25em;
  }

  .venue > *:first-child {
    margin-left: 0;
  }

  .venue > *:after {
    content: ', ';
  }

  .venue > *:last-child:after {
    content: '.';
  }

  .journal {
    font-style: italic;
  }

  .series:before {
    content: ' (';
  }

  .series:after {
    content: ')';
  }
</style>

<article>
  <h4>
    <slot name="title" />
  </h4>

  <p class="authors">
    <slot name="authors" />
  </p>

  <p class="venue">
    {#if slots.journal}
      <span class="journal-series">
        <span class="journal">
          <slot name="journal" />
        </span>
        {#if slots.series}
          <span class="series">
            <slot name="series" />
          </span>
        {/if}
      </span>
    {/if}
    {#if slots.year}
      <span class="year">
        <slot name="year" />
      </span>
    {/if}
    {#if slots.doi}
      <span class="doi">
        <slot name="doi" />
      </span>
    {/if}
  </p>
</article>

<!-- To avoid annoying warnings: https://github.com/sveltejs/svelte/issues/4546#issuecomment-626348879 -->
{#if false}<slot></slot>{/if}