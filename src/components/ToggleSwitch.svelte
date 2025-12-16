<script lang="ts">
  import { toggleSwitchTrackClasses } from '@/utils/classPatterns'

  interface Props {
    checked?: boolean
    onchange?: (checked: boolean) => void
    id?: string
    'aria-label'?: string
  }
  let { checked = $bindable(), onchange, id = '', 'aria-label': ariaLabel }: Props = $props()
</script>

<label class="relative w-12 h-7 cursor-pointer min-h-[44px] flex items-center">
  <input
    {id}
    type="checkbox"
    bind:checked
    onchange={() => {
      if (onchange) onchange(checked ?? false)
    }}
    class="sr-only peer"
    aria-label={ariaLabel}
    data-testid="proxy-checkbox"
  />
  <span class={toggleSwitchTrackClasses}></span>
</label>
