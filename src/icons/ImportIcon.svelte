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
  <path d="M12 3v12" />
  <path d="M8 11l4 4 4-4" />
  <path
    d="M20 21H4a2 2 0 0 1-2-2v-2c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2z"
  />
</svg>
