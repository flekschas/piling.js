<style>
  main {
    position: relative;
    overflow-x: hidden;
  }

  .content {
    margin-left: 1rem;
    margin-right: 1rem;
    padding: 0.25rem 0 2rem 0;
  }

  /* 640px */
  @media screen and (min-width: 40em) {
    .content {
      margin-left: 8.3334%;  /* 1/12 */
      margin-right: 8.3334%;
      padding: 0.5rem 0 2rem 0;
    }

    .fullscreen {
      margin-left: -10%;  /* 1/6 */
      margin-right: -10%;
    }
  }

  /* 720px */
  @media screen and (min-width: 45em) {
    .content {
      padding: 1rem 0 2rem 0;
    }
  }

  /* 960px */
  @media screen and (min-width: 60em) {
    .content {
      margin-left: 16.6667%;  /* 1/6 */
      margin-right: 16.6667%;
    }

    .fullscreen {
      margin-left: -25%;  /* 1/6 */
      margin-right: -25%;
    }
  }

  /* 1280px */
  @media screen and (min-width: 80em) {
    .content {
      margin-left: 20%;  /* 1/5 */
      margin-right: 20%;
    }

    .fullscreen {
      margin-left: -33.334%;  /* 1/6 */
      margin-right: -33.334%;
    }
  }

  /* 1600px */
  @media screen and (min-width: 100em) {
    .content {
      max-width: 960px;
      margin-left: auto;  /* 1/5 */
      margin-right: auto;
    }
  }
</style>

<main>
  <div class="content">
    <slot />
  </div>
</main>
