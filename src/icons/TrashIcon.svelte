<!-- TrashIcon.svelte -->
<script lang="ts">
  export let size = '24'
  export let class_ = ''
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
  <polyline points="3 6 5 6 21 6" />
  <path
    d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
  />
</svg>
