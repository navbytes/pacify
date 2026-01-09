<script lang="ts">
import type { Snippet } from 'svelte'

interface Props {
  classes?: string
  children?: Snippet
}

let { classes = '', children }: Props = $props()
</script>

<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800 {classes}">
  {@render children?.()}
</div>
