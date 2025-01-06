<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte'
  import { ScriptTemplates } from '@/constants/templates'
  import CloseIcon from '@/icons/CloseIcon.svelte'
  import type { FormState, PACScript, ValidationResult } from '@/interfaces'
  import { ScriptService } from '@/services/ScriptService'
  import type { DebounceTimeout } from '@/interfaces/misc'

  const dispatch = createEventDispatcher()

  export let script: PACScript | undefined = undefined

  let formState: FormState = {
    name: script?.name || '',
    color: script?.color || '#2196f3',
    quickSwitch: script?.quickSwitch || false,
    scriptContent: script?.script || ScriptTemplates.empty,
  }

  // Variables for validation
  let errorMessage: string | null = null
  let isValid: boolean = false
  let debounceTimeout: DebounceTimeout = null

  // Debounced validation
  $: {
    // Clear previous timeout if scriptContent changes before debounce duration
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }

    debounceTimeout = setTimeout(() => {
      const result = ScriptService.validatePACScript(formState.scriptContent)
      isValid = result.isValid
      errorMessage = result.errorMessage
    }, 500) // 500ms debounce duration
  }

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
    dispatch('save', { script: scriptData })
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
</script>

<div class="modal-overlay" role="dialog" aria-modal="true">
  <div class="modal-content">
    <div class="modal-header">
      <h2>PAC Script Editor</h2>
      <button
        class="icon-button"
        type="reset"
        on:click={() => dispatch('close')}
      >
        <CloseIcon />
      </button>
    </div>

    <div class="content-wrapper">
      <form on:submit|preventDefault={handleSubmit} class="editor-form">
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
            <button
              class="template-card"
              on:click={() => loadTemplate('basic')}
            >
              <div class="template-card-title">Basic Template</div>
              <div class="template-card-description">
                A minimal PAC script that provides direct access to internal
                company domains while routing all other traffic through a single
                proxy server, ideal for basic network configurations.
              </div>
            </button>
            <button
              class="template-card"
              on:click={() => loadTemplate('advanced')}
            >
              <div class="template-card-title">Advanced Template</div>
              <div class="template-card-description">
                A basic PAC script that routes internal network traffic
                directly, handles special domains through dedicated proxies, and
                uses a default proxy with direct fallback for all other traffic,
                suitable for simple corporate network setups.
              </div>
            </button>
            <button class="template-card" on:click={() => loadTemplate('pro')}>
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
          <button
            class="secondary-button"
            type="reset"
            on:click={() => dispatch('close')}
          >
            Cancel
          </button>
          <button class="primary-button" type="submit" disabled={!isValid}>
            Save Script
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<style>
  @import '../styles//editor.css';
</style>
