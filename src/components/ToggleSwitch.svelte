<script lang="ts">
  interface Props {
    isChecked?: boolean
    label?: string
    onToggle: (checked: boolean) => void
  }

  let { isChecked = $bindable(false), label = '', onToggle }: Props = $props()

  function handleToggle(event: Event) {
    const input = event.target as HTMLInputElement
    onToggle(input.checked)
  }
</script>

<label class="switch">
  <input type="checkbox" bind:checked={isChecked} onchange={handleToggle} />
  <span class="slider"></span>
  {#if label}
    <span class="label">{label}</span>
  {/if}
</label>

<style>
  @import '../styles/toggle.css';
</style>
