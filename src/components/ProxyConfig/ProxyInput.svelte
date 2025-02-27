<script lang="ts">
  import { I18nService } from '@/services/i18n/i18nService'

  export let scheme: string = 'http'
  export let host: string = ''
  export let port: string = ''
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
  <select
    bind:value={scheme}
    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
  >
    <option value="http">HTTP</option>
    <option value="https">HTTPS</option>
    <option value="quic">QUIC</option>
    <option value="socks4">SOCKS4</option>
    <option value="socks5">SOCKS5</option>
  </select>

  <input
    type="text"
    placeholder={I18nService.getMessage('host')}
    bind:value={host}
    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
  />

  <input
    type="number"
    placeholder={I18nService.getMessage('port')}
    bind:value={port}
    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
  />
</div>
