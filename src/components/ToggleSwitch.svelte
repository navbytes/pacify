<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  type ToggleEvent = {
    checked: boolean
  }

  const dispatch = createEventDispatcher<{
    change: ToggleEvent
    checked: ToggleEvent
  }>()

  export let checked = false
  export let label = ''

  function handleChange() {
    dispatch('change', { checked })
    dispatch('checked', { checked })
  }
</script>

<label class="switch">
  <input type="checkbox" bind:checked on:change={handleChange} />
  <span class="slider"></span>
  {#if label}
    <span class="label">{label}</span>
  {/if}
</label>

<style>
  @import '../styles/toggle.css';
</style>
