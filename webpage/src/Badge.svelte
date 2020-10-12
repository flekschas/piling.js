<script>
  import { getIconId } from './utils';

  export let text = '';
  export let icon = undefined;
  export let primary = false;

  icon = getIconId(icon);
</script>

<style>
  .badge {
    padding: 0.125em 0.25em;
    font-size: 0.8em;
    color: black;
    background: var(--gray-medium);
    border-radius: 0.25rem;
  }

  .primary {
    background: #eee462;
  }

  .icon {
    width: 1em;
    height: 1em;
    margin-right: 0.25em;
  }
</style>

<span class="badge" class:primary>
  {#if icon}
    <svg class="icon">
      <use
        xmlns:xlink="http://www.w3.org/1999/xlink"
        xlink:href="images/icons.svg#{icon}"></use>
    </svg>
  {/if}
  <span>{text}</span>
</span>
