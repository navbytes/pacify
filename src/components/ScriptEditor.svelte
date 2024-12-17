<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte'
  import { ScriptTemplates } from '@/constants/templates'
  import CloseIcon from '@/icons/CloseIcon.svelte'
  import type { PACScript } from '@/interfaces'

  const dispatch = createEventDispatcher()

  export let script: PACScript | undefined = undefined

  let name = script?.name || ''
  let color = script?.color || '#2196f3'
  let quickSwitch = script?.quickSwitch || false
  let scriptContent = script?.script || ScriptTemplates.empty

  // Variables for validation
  let errorMessage: string | null = null
  let isValid: boolean = false
  let debounceTimeout: NodeJS.Timeout | null = null

  // Validation function
  function validateScript(script: string) {
    if (!script.trim()) {
      throw new Error('Script cannot be empty')
    }
    if (!script.includes('FindProxyForURL')) {
      throw new Error('Script must contain FindProxyForURL function')
    }
    if (!/function\s+FindProxyForURL\s*\([^)]*\)/.test(script)) {
      throw new Error('Invalid FindProxyForURL function declaration')
    }
    // Check for common proxy keywords
    const proxyKeywords = ['DIRECT', 'PROXY', 'SOCKS', 'HTTP']
    if (!proxyKeywords.some((keyword) => script.includes(keyword))) {
      throw new Error('Script must contain at least one proxy directive')
    }
  }

  // Debounced validation
  $: {
    // Clear previous timeout if scriptContent changes before debounce duration
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }

    debounceTimeout = setTimeout(() => {
      try {
        validateScript(scriptContent)
        errorMessage = null
        isValid = true
      } catch (error) {
        errorMessage = (error as Error).message
        isValid = false
      }
    }, 500) // 500ms debounce duration
  }

  // Cleanup timeout on component destroy to prevent memory leaks
  onDestroy(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }
  })

  async function handleSubmit() {
    try {
      validateScript(scriptContent)
      const scriptData: Omit<PACScript, 'id'> = {
        name,
        color,
        quickSwitch,
        script: scriptContent,
        isActive: false,
      }
      dispatch('save', { script: scriptData })
    } catch (error) {
      // This catch is redundant now but kept for safety
      errorMessage = (error as Error).message
      isValid = false
    }
  }

  function loadTemplate(template: keyof typeof ScriptTemplates) {
    if (
      confirm(
        'Loading a template will replace the current script content. Continue?'
      )
    ) {
      scriptContent = ScriptTemplates[template]
    }
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
            bind:value={name}
            placeholder="Enter Script Name"
            required
          />
        </div>
        <div class="row">
          <div class="form-group color-picker">
            <label for="color">Script Color</label>
            <input id="color" type="color" bind:value={color} required />
          </div>

          <div class="form-group checkbox-group">
            <input
              type="checkbox"
              id="quickSwitch"
              bind:checked={quickSwitch}
            />
            <label for="quickSwitch">Enable Quick Switch</label>
          </div>
        </div>

        <div class="form-group">
          <label for="script">PAC Script</label>
          <textarea
            id="script"
            bind:value={scriptContent}
            spellcheck="false"
            wrap="off"
            required
          />
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
