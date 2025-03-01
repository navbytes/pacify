<script lang="ts">
  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import { type ProxyConfig, type ListViewType } from '@/interfaces'
  import { settingsStore } from '@/stores/settingsStore'
  import { ShieldCheck, Pencil, Trash } from 'lucide-svelte'
  import Button from './Button.svelte'
  import FlexGroup from './FlexGroup.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import DraggableItem from './DragDrop/DraggableItem.svelte'

  interface Props {
    proxy: ProxyConfig
    pageType?: ListViewType
    dragType?: string
    onScriptEdit: (scriptId: string) => void
  }

  let {
    proxy,
    pageType = 'POPUP',
    onScriptEdit,
    dragType = $bindable(),
  }: Props = $props()

  async function handleSetProxy(isActive: boolean, scriptId?: string) {
    if (!scriptId) return
    await settingsStore.setProxy(scriptId, isActive)
  }

  function openEditor(scriptId?: string) {
    if (!scriptId) return
    onScriptEdit(scriptId)
  }

  async function handleScriptDelete(scriptId?: string) {
    if (!scriptId) return
    if (confirm(I18nService.getMessage('deleteConfirm'))) {
      await settingsStore.deletePACScript(scriptId)
    }
  }
</script>

<DraggableItem
  name={proxy.name || ''}
  id={proxy.id || ''}
  dataType={pageType}
  disabled={pageType === 'POPUP'}
  bind:dragType
>
  <div
    class={`
      flex items-center justify-between p-3 relative
      rounded-lg bg-white dark:bg-gray-800 
      border border-[var(--script-color)]
      ${pageType === 'QUICK_SWITCH' ? 'border-dashed' : 'border-solid'}
      ${pageType === 'POPUP' ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
    `}
    style={`--script-color: ${proxy.color}`}
    role="button"
    tabindex="0"
    data-color={proxy.color}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleSetProxy(!proxy.isActive, proxy.id)
      }
    }}
  >
    <div class="flex items-center gap-2" data-color={proxy.color}>
      <div class="text-[var(--script-color)]" data-label>
        {#if proxy.isActive}
          <ShieldCheck />
        {/if}
      </div>
      <span class="text-sm">{proxy.name}</span>
    </div>

    <FlexGroup direction="horizontal" childrenGap="sm" alignItems="center">
      <ToggleSwitch
        checked={proxy.isActive}
        onchange={(checked) => handleSetProxy(checked, proxy.id)}
      />
      {#if pageType === 'OPTIONS'}
        <Button color="primary" minimal onclick={() => openEditor(proxy.id)}>
          {#snippet icon()}<Pencil />{/snippet}
        </Button>
        <Button
          color="error"
          minimal
          onclick={() => handleScriptDelete(proxy.id)}
        >
          {#snippet icon()}<Trash />{/snippet}
        </Button>
      {/if}
    </FlexGroup>
  </div>
</DraggableItem>
