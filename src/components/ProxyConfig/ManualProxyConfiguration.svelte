<script lang="ts">
  import ProxyInput from './ProxyInput.svelte'

  export let useSharedProxy: boolean = true
  export let proxySettings: any
  export let bypassListContent: string = ''

  // Map for individual proxies
  const proxyTypeMap: Record<string, string> = {
    HTTP: 'proxyForHttp',
    HTTPS: 'proxyForHttps',
    FTP: 'proxyForFtp',
    Fallback: 'fallbackProxy',
  }
</script>

<div class="space-y-6">
  <div class="flex items-center gap-2">
    <input
      type="checkbox"
      id="useSharedProxy"
      bind:checked={useSharedProxy}
      class="rounded border-gray-300 text-primary focus:ring-primary"
    />
    <label
      for="useSharedProxy"
      class="text-sm text-gray-700 dark:text-gray-300"
    >
      Use same proxy server for all protocols
    </label>
  </div>

  {#if useSharedProxy}
    <!-- Single Proxy Configuration -->
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
        Proxy Server
      </h3>
      <ProxyInput
        bind:scheme={proxySettings.singleProxy.scheme}
        bind:host={proxySettings.singleProxy.host}
        bind:port={proxySettings.singleProxy.port}
      />
    </div>
  {:else}
    <!-- Individual Proxy Configurations -->
    {#each Object.keys(proxyTypeMap) as proxyType}
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {proxyType} Proxy
        </h3>
        <ProxyInput
          bind:scheme={proxySettings[proxyTypeMap[proxyType]].scheme}
          bind:host={proxySettings[proxyTypeMap[proxyType]].host}
          bind:port={proxySettings[proxyTypeMap[proxyType]].port}
        />
      </div>
    {/each}
  {/if}

  <!-- Bypass List -->
  <div>
    <label
      for="bypassList"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      Bypass List
    </label>
    <textarea
      id="bypassList"
      bind:value={bypassListContent}
      rows="4"
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
      placeholder="Enter one pattern per line:
*.example.com
localhost
127.0.0.1
[::1]"
    ></textarea>
  </div>
</div>
