<script lang="ts">
  import Text from './Text.svelte'

  interface Props {
    checked?: boolean
    onchange?: (checked: boolean) => void
    id?: string
    'aria-label'?: string
  }
  let { checked = $bindable(), onchange, id = '', 'aria-label': ariaLabel }: Props = $props()
</script>

<label class="relative inline-block w-11 h-6 cursor-pointer">
  <input
    {id}
    type="checkbox"
    bind:checked
    onchange={() => (onchange ? onchange(checked ?? false) : null)}
    class="sr-only peer"
    aria-label={ariaLabel}
  />
  <Text
    classes="absolute inset-0 rounded-full bg-slate-300 transition-colors duration-200 ease-in-out
           peer-checked:bg-blue-600
           before:absolute before:content-[''] before:h-5 before:w-5 before:left-[2px] before:bottom-[2px]
           before:bg-white before:rounded-full before:transition-transform before:duration-200 before:ease-in-out
           peer-checked:before:translate-x-5
           peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"
  ></Text>
</label>
