<script lang="ts">
  import { onDestroy } from 'svelte'
  import { ScriptTemplates } from '@/constants/templates'
  import CloseIcon from '@/icons/CloseIcon.svelte'
  import type { FormState, PACScript } from '@/interfaces'
  import { ScriptService } from '@/services/ScriptService'
  import type { DebounceTimeout } from '@/interfaces/misc'

  interface Props {
    script?: PACScript | undefined
    onSave: (script: Omit<PACScript, 'id'>) => void
    onCancel: () => void
  }

  let { script = undefined, onSave, onCancel }: Props = $props()

  let formState: FormState = $state({
    name: script?.name || '',
    color: script?.color || '#2196f3',
    quickSwitch: script?.quickSwitch || false,
    scriptContent: script?.script || ScriptTemplates.empty,
  })

  // Variables for validation
  let errorMessage: string | null = $state(null)
  let isValid: boolean = $state(false)
  let debounceTimeout: DebounceTimeout = $state(null)

  $effect(() => {
    const validateScript = () => {
      const result = ScriptService.validatePACScript(formState.scriptContent)
      isValid = result.isValid
      errorMessage = result.errorMessage
    }

    // Initial validation
    validateScript()

    // Set up debounced validation for changes
    const timeoutId = setTimeout(validateScript, 500)

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
    }
  })

  // Cleanup timeout on component destroy to prevent memory leaks
  onDestroy(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }
  })

  async function handleSubmit() {
    const result = ScriptService.validatePACScript(formState.scriptContent)
    isValid = result.isValid
    errorMessage = result.errorMessage

    if (!isValid) return

    const scriptData: Omit<PACScript, 'id'> = {
      name: formState.name,
      color: formState.color,
      quickSwitch: formState.quickSwitch,
      script: formState.scriptContent,
      isActive: false,
    }
    onSave(scriptData)
  }

  function loadTemplate(template: keyof typeof ScriptTemplates) {
    if (
      formState.scriptContent.trim() &&
      !confirm('Replace current content?')
    ) {
      return
    }
    const result = ScriptService.validatePACScript(ScriptTemplates[template])
    formState.scriptContent = ScriptTemplates[template]
    isValid = result.isValid
    errorMessage = result.errorMessage
  }
  function cancelEdit() {
    onCancel()
  }
</script>

<div class="modal-overlay" role="dialog" aria-modal="true">
  <div class="modal-content">
    <div class="modal-header">
      <h2>PAC Script Editor</h2>
      <button class="icon-button" type="reset" onclick={cancelEdit}>
        <CloseIcon />
      </button>
    </div>

    <div class="content-wrapper">
      <div class="editor-form">
        <div class="form-group">
          <input
            id="name"
            type="text"
            bind:value={formState.name}
            placeholder="Enter Script Name"
            required
          />
        </div>
        <div class="row">
          <div class="form-group color-picker">
            <label for="scriptColor">Script Color</label>
            <input
              type="color"
              id="scriptColor"
              bind:value={formState.color}
              required
            />
          </div>

          <div class="form-group checkbox-group">
            <input
              type="checkbox"
              id="quickSwitch"
              bind:checked={formState.quickSwitch}
            />
            <label for="quickSwitch">Enable Quick Switch</label>
          </div>
        </div>

        <div class="form-group">
          <label for="pacScript">PAC Script</label>

          <div class="template-cards">
            <button class="template-card" onclick={() => loadTemplate('basic')}>
              <div class="template-card-title">Basic Template</div>
              <div class="template-card-description">
                A minimal PAC script that provides direct access to internal
                company domains while routing all other traffic through a single
                proxy server, ideal for basic network configurations.
              </div>
            </button>
            <button
              class="template-card"
              onclick={() => loadTemplate('advanced')}
            >
              <div class="template-card-title">Advanced Template</div>
              <div class="template-card-description">
                A basic PAC script that routes internal network traffic
                directly, handles special domains through dedicated proxies, and
                uses a default proxy with direct fallback for all other traffic,
                suitable for simple corporate network setups.
              </div>
            </button>
            <button class="template-card" onclick={() => loadTemplate('pro')}>
              <div class="template-card-title">Pro Template</div>
              <div class="template-card-description">
                An enterprise-grade PAC script template that implements
                intelligent proxy routing with failover chains, work-hours based
                rules, geographic routing, security policies, and
                protocol-specific handling for different types of network
                traffic and domains.
              </div>
            </button>
          </div>
          <textarea
            id="pacScript"
            bind:value={formState.scriptContent}
            spellcheck="false"
          ></textarea>
          {#if errorMessage}
            <div class="error-message">{errorMessage}</div>
          {/if}
        </div>

        <div class="button-group">
          <button class="secondary-button" onclick={cancelEdit}>
            Cancel
          </button>
          <button
            class="primary-button"
            disabled={!isValid}
            onclick={handleSubmit}
          >
            Save Script
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  @import '../styles//editor.css';
</style>
