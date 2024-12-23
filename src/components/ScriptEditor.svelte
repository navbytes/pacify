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

<div class="modal-overlay">
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
      <div class="template-buttons">
        <button
          class="secondary-button"
          type="button"
          on:click={() => loadTemplate('basic')}
        >
          Basic Template
        </button>
        <button
          class="secondary-button"
          type="button"
          on:click={() => loadTemplate('advanced')}
        >
          Advanced Template
        </button>
        <button
          class="secondary-button"
          type="button"
          on:click={() => loadTemplate('pro')}
        >
          Pro Template
        </button>
      </div>

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
            <label for="color">Script Color</label>
            <input
              id="color"
              type="color"
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
          <label for="script">PAC Script</label>
          <textarea
            id="script"
            bind:value={formState.scriptContent}
            spellcheck="false"
            required
          ></textarea>
        </div>

        <div class="button-group">
          {#if errorMessage}
            <p class="error-message">{errorMessage}</p>
          {/if}
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
