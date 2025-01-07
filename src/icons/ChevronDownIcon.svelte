<!-- ChevronDownIcon.svelte -->
<script lang="ts">
  interface Props {
    size?: string;
    class_?: string;
  }

  let { size = '24', class_ = '' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={class_}
>
  <polyline points="6 9 12 15 18 9" />
</svg>
