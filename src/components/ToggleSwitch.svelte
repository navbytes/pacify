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

<label class="relative inline-block w-12 h-7 cursor-pointer">
  <input
    {id}
    type="checkbox"
    bind:checked
    onchange={() => (onchange ? onchange(checked ?? false) : null)}
    class="sr-only peer"
    aria-label={ariaLabel}
  />
  <Text
    classes="absolute inset-0 rounded-full bg-slate-400 dark:bg-slate-600 transition-colors duration-200 ease-in-out
           peer-checked:bg-green-500 dark:peer-checked:bg-green-600
           before:absolute before:content-[''] before:h-5 before:w-5 before:left-[4px] before:bottom-[4px]
           before:bg-white before:rounded-full before:transition-transform before:duration-200 before:ease-in-out before:shadow-md
           peer-checked:before:translate-x-5
           peer-focus:outline-none peer-focus-visible:ring-4 peer-focus-visible:ring-green-300 dark:peer-focus-visible:ring-green-800 peer-focus-visible:ring-offset-2
           hover:bg-slate-500 dark:hover:bg-slate-500 peer-checked:hover:bg-green-600 dark:peer-checked:hover:bg-green-500"
  ></Text>
</label>
