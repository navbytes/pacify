<!-- CircleCheckIcon.svelte -->
<script lang="ts">
  interface Props {
    size?: string
    color?: string
    class_?: string
    isActive?: boolean
  }

  let {
    size = '24',
    color = 'currentColor',
    isActive = false,
    class_ = '',
  }: Props = $props()
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke={color}
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={class_}
>
  <circle cx="12" cy="12" r="10" />
  {#if isActive}
    <polyline points="16 10 11 15 8 12" />{/if}
</svg>
