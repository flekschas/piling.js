<script>
  export let ratio = 100;
</script>

<style>
  .ratio {
    position: relative;
    width: 100%;
  }

  .ratio-block {
    display: block;
    width: 100%;
  }

  .content {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
</style>

<div class="ratio">
  <div class="ratio-block" style={`padding-top: ${1 / ratio * 100}%`}></div>
  <div class="content">
    <slot></slot>
  </div>
</div>