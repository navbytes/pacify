<script lang="ts">
import { I18nService } from '@/services/i18n/i18nService'
import { formLabelVariants, inputVariants } from '@/utils/classPatterns'
import { Eye, EyeOff, Lock, Info } from '@/utils/icons'
import Text from '../Text.svelte'

interface Props {
  scheme?: string
  host?: string
  port?: string
  username?: string
  password?: string
  testIdPrefix?: string
}

let {
  scheme = $bindable('http'),
  host = $bindable(''),
  port = $bindable(''),
  username = $bindable(''),
  password = $bindable(''),
  testIdPrefix = 'proxy',
}: Props = $props()

let hostError = $state('')
let portError = $state('')
let hostTouched = $state(false)
let portTouched = $state(false)
let showPassword = $state(false)
let showAuthSection = $state(false)

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

// Auto-expand auth section if credentials exist
$effect(() => {
  if (username || password) {
    showAuthSection = true
  }
})
</script>

<div class="space-y-4">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
      <label for="{testIdPrefix}-scheme" class={formLabelVariants({ size: 'xs' })}>
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
      <label for="{testIdPrefix}-host" class={formLabelVariants({ size: 'xs' })}>
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
      <label for="{testIdPrefix}-port" class={formLabelVariants({ size: 'xs' })}>
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

  <!-- Authentication Section (Optional) -->
  <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
    <button
      type="button"
      onclick={() => (showAuthSection = !showAuthSection)}
      class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
    >
      <Lock class="w-4 h-4" />
      <span>{I18nService.getMessage('authentication') || 'Authentication'}</span>
      <span class="text-xs text-slate-500">({I18nService.getMessage('optional') || 'Optional'})</span>
      <svg
        class="w-4 h-4 ml-auto transition-transform {showAuthSection ? 'rotate-180' : ''}"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    {#if showAuthSection}
      <div class="mt-4 space-y-4">
        <!-- Info message about credential storage -->
        <div class="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Info class="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <Text as="p" size="xs" classes="text-blue-800 dark:text-blue-200">
            {I18nService.getMessage('authStorageInfo') ||
              'Credentials are stored encrypted in Chrome sync storage and will sync across your devices.'}
          </Text>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Username -->
          <div>
            <label for="{testIdPrefix}-username" class={formLabelVariants({ size: 'xs' })}>
              {I18nService.getMessage('username') || 'Username'}
            </label>
            <input
              id="{testIdPrefix}-username"
              type="text"
              placeholder={I18nService.getMessage('usernamePlaceholder') || 'username'}
              bind:value={username}
              data-testid="{testIdPrefix}-username-input"
              class={inputVariants({ state: 'default', size: 'md' })}
            >
          </div>

          <!-- Password -->
          <div>
            <label for="{testIdPrefix}-password" class={formLabelVariants({ size: 'xs' })}>
              {I18nService.getMessage('password') || 'Password'}
            </label>
            <div class="relative">
              <input
                id="{testIdPrefix}-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={I18nService.getMessage('passwordPlaceholder') || '••••••••'}
                bind:value={password}
                data-testid="{testIdPrefix}-password-input"
                class={inputVariants({ state: 'default', size: 'md' }) + ' pr-10'}
              >
              <button
                type="button"
                onclick={() => (showPassword = !showPassword)}
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded"
                aria-label={showPassword
                  ? I18nService.getMessage('hidePassword') || 'Hide password'
                  : I18nService.getMessage('showPassword') || 'Show password'}
                data-testid="{testIdPrefix}-password-toggle"
              >
                {#if showPassword}
                  <EyeOff class="w-4 h-4" />
                {:else}
                  <Eye class="w-4 h-4" />
                {/if}
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
