<style>
  section {
    position: relative;
    margin: 2rem 0;
  }

  .columns {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .column {
    position: relative;
    width: 100%;
  }

  /* 960px */
  @media screen and (min-width: 60em) {
    .columns {
      margin-left: -12.5%;  /* 1/12 */
      margin-right: -12.5%;
    }

    .column {
      width: calc(50% - 0.5rem);
    }

    .column:first-child {
      margin-right: 0.5rem;
    }

    .column:last-child {
      margin-left: 0.5rem;
    }
  }

  /* 1280px */
  @media screen and (min-width: 80em) {
    .column {
      width: calc(50% - 1rem);
    }

    .column:first-child {
      margin-right: 1rem;
    }

    .column:last-child {
      margin-left: 1rem;
    }
  }
</style>

<section>
  <slot name="top" />
  <slot name="center" />
  <div class="columns">
    <div class="column">
      <slot name="left" />
    </div>
    <div class="column">
      <slot name="right" />
    </div>
  </div>
  <slot name="bottom" />
</section>

<!-- To avoid annoying warnings: https://github.com/sveltejs/svelte/issues/4546#issuecomment-626348879 -->
{#if false}<slot></slot>{/if}
