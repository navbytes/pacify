<script lang="ts">
import { I18nService } from '@/services/i18n/i18nService'
import { inputVariants } from '@/utils/classPatterns'
import Text from '../Text.svelte'

interface Props {
  scheme?: string
  host?: string
  port?: string
  testIdPrefix?: string
}

let {
  scheme = $bindable('http'),
  host = $bindable(''),
  port = $bindable(''),
  testIdPrefix = 'proxy',
}: Props = $props()

let hostError = $state('')
let portError = $state('')
let hostTouched = $state(false)
let portTouched = $state(false)

// Validation functions
function validateHost(value: string): string {
  if (!value.trim()) return ''

  // Basic hostname/IP validation
  const hostnameRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/

  if (!hostnameRegex.test(value) && !ipv4Regex.test(value) && !ipv6Regex.test(value)) {
    return I18nService.getMessage('invalidHost') || 'Invalid hostname or IP address'
  }

  return ''
}

function validatePort(value: string): string {
  if (!value.trim()) return ''

  const portNum = parseInt(value, 10)
  if (Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return I18nService.getMessage('invalidPort') || 'Port must be between 1 and 65535'
  }

  return ''
}

// Event handlers
function handleHostBlur() {
  hostTouched = true
  hostError = validateHost(host)
}

function handleHostInput() {
  if (hostTouched) {
    hostError = validateHost(host)
  }
}

function handlePortBlur() {
  portTouched = true
  portError = validatePort(port)
}

function handlePortInput() {
  if (portTouched) {
    portError = validatePort(port)
  }
}
</script>

<div class="space-y-4">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
      <label
        for="{testIdPrefix}-scheme"
        class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
      >
        {I18nService.getMessage('scheme') || 'Scheme'}
      </label>
      <select
        id="{testIdPrefix}-scheme"
        bind:value={scheme}
        class={inputVariants({ state: 'default', size: 'md' })}
      >
        <option value="http">HTTP</option>
        <option value="https">HTTPS</option>
        <option value="quic">QUIC</option>
        <option value="socks4">SOCKS4</option>
        <option value="socks5">SOCKS5</option>
      </select>
    </div>

    <div>
      <label
        for="{testIdPrefix}-host"
        class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
      >
        {I18nService.getMessage('host') || 'Host'}
        <span class="text-red-500">*</span>
      </label>
      <input
        id="{testIdPrefix}-host"
        type="text"
        placeholder={I18nService.getMessage('hostPlaceholder') || 'proxy.example.com'}
        bind:value={host}
        oninput={handleHostInput}
        onblur={handleHostBlur}
        data-testid="{testIdPrefix}-host-input"
        aria-invalid={hostError && hostTouched ? 'true' : 'false'}
        aria-describedby={hostError && hostTouched ? `{testIdPrefix}-host-error` : undefined}
        class={inputVariants({ state: hostError && hostTouched ? 'error' : 'default', size: 'md' })}
      >
      {#if hostError && hostTouched}
        <Text
          as="p"
          size="xs"
          classes="mt-1 text-red-600 dark:text-red-400"
          id="{testIdPrefix}-host-error"
        >
          {hostError}
        </Text>
      {/if}
    </div>

    <div>
      <label
        for="{testIdPrefix}-port"
        class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
      >
        {I18nService.getMessage('port') || 'Port'}
        <span class="text-red-500">*</span>
      </label>
      <input
        id="{testIdPrefix}-port"
        type="number"
        min="1"
        max="65535"
        placeholder={I18nService.getMessage('portPlaceholder') || '8080'}
        bind:value={port}
        oninput={handlePortInput}
        onblur={handlePortBlur}
        data-testid="{testIdPrefix}-port-input"
        aria-invalid={portError && portTouched ? 'true' : 'false'}
        aria-describedby={portError && portTouched ? `{testIdPrefix}-port-error` : undefined}
        class={inputVariants({ state: portError && portTouched ? 'error' : 'default', size: 'md' })}
      >
      {#if portError && portTouched}
        <Text
          as="p"
          size="xs"
          classes="mt-1 text-red-600 dark:text-red-400"
          id="{testIdPrefix}-port-error"
        >
          {portError}
        </Text>
      {/if}
    </div>
  </div>
</div>
