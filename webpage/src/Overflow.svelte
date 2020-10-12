<style>
  .overflow {
    margin-left: 0;
    margin-right: 0;
  }

  /* 960px */
  @media screen and (min-width: 60em) {
    .overflow {
      margin-left: -12.5%;  /* 1/12 */
      margin-right: -12.5%;
    }
  }
</style>

<div class="overflow">
  <slot />
</div>