<script lang="ts">
  import SettingsIcon from '@/icons/Settings.svelte'
  import ScriptList from '@/components/ScriptList.svelte'
  import ImportIcon from '@/icons/ImportIcon.svelte'
  import { ChromeService } from '@/services/ChromeService'

  function openSettings() {
    ChromeService.openOptionsPage()
  }
</script>

<div>
  <header>
    <h1>PACify</h1>
    <div class="header-buttons">
      <!-- <button id="importExportButton" class="icon-button" title="Import/Export">
        <ImportIcon />
      </button> -->
      <button
        id="settingsButton"
        class="icon-button"
        title="Open Settings"
        on:click={openSettings}
      >
        <SettingsIcon />
      </button>
    </div>
  </header>

  <ScriptList pageType="POPUP" />
</div>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  }
</style>
