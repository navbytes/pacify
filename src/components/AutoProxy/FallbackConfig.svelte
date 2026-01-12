<script lang="ts">
import { AlertTriangle, ArrowDownToLine, Shield } from 'lucide-svelte'
import type { AutoProxyRouteType, ProxyConfig, ProxyServer } from '@/interfaces/settings'
import { I18nService } from '@/services/i18n/i18nService'
import {
  gradientIconBadgeVariants,
  gradientSectionVariants,
  sectionInnerContentVariants,
} from '@/utils/classPatterns/autoProxy'
import { isOrphanedRule } from '@/utils/proxyModeHelpers'
import Text from '../Text.svelte'
import ProxySelector from './ProxySelector.svelte'

interface Props {
  fallbackType: AutoProxyRouteType
  fallbackProxyId?: string
  fallbackInlineProxy?: ProxyServer
  availableProxies: ProxyConfig[]
  onchange: (
    fallbackType: AutoProxyRouteType,
    fallbackProxyId?: string,
    fallbackInlineProxy?: ProxyServer
  ) => void
}

let {
  fallbackType,
  fallbackProxyId = undefined,
  fallbackInlineProxy = undefined,
  availableProxies,
  onchange,
}: Props = $props()

// Check if the fallback references a deleted proxy
let isOrphaned = $derived(
  isOrphanedRule({ proxyType: fallbackType, proxyId: fallbackProxyId }, availableProxies)
)

// Styles using reusable patterns
const orangeSection = gradientSectionVariants({
  color: 'orange',
  rounded: '2xl',
  accentHeight: 'normal',
})
const orangeIconBadge = gradientIconBadgeVariants({ color: 'amber', size: 'md' })
const redSection = gradientSectionVariants({ color: 'red' })
const redIconBadge = gradientIconBadgeVariants({ color: 'red' })

function handleChange(proxyType: AutoProxyRouteType, proxyId?: string, inlineProxy?: ProxyServer) {
  onchange(proxyType, proxyId, inlineProxy)
}
</script>

<div class={orangeSection.wrapper()}>
  <!-- Background gradient -->
  <div class={orangeSection.background()}></div>

  <!-- Decorative elements -->
  <div class="{orangeSection.decorativeBlur()} top-0 right-0 w-28 h-28"></div>
  <div class="{orangeSection.decorativeBlur()} bottom-0 left-0 w-20 h-20"></div>

  <!-- Top accent bar -->
  <div class={orangeSection.accentBar()}></div>

  <div class="{orangeSection.content()} p-5">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-4">
      <div class={orangeIconBadge.wrapper()}>
        <div class={orangeIconBadge.glow()}></div>
        <div class={orangeIconBadge.badge()}>
          <Shield size={18} class="text-white" />
        </div>
      </div>
      <div>
        <Text weight="semibold" classes="text-slate-800 dark:text-slate-200">
          {I18nService.getMessage('fallbackBehavior') || 'Fallback Behavior'}
        </Text>
        <Text size="xs" color="muted" classes="flex items-center gap-1">
          <ArrowDownToLine size={12} />
          {I18nService.getMessage('fallbackDescription') || 'Applied when no rules match'}
        </Text>
      </div>
    </div>

    <!-- Proxy Selector -->
    <div class="{sectionInnerContentVariants({ color: 'amber' })} p-4">
      <ProxySelector
        proxyType={fallbackType}
        proxyId={fallbackProxyId}
        inlineProxy={fallbackInlineProxy}
        {availableProxies}
        onchange={handleChange}
      />
    </div>

    <!-- Orphaned warning -->
    {#if isOrphaned}
      <div class="{redSection.wrapper()} mt-4">
        <div class={redSection.background()}></div>
        <div class={redSection.accentBar()}></div>

        <div class="relative flex items-center gap-3 p-3 {redSection.content()}">
          <div class={redIconBadge.wrapper()}>
            <div class={redIconBadge.badge()}>
              <AlertTriangle size={16} class="text-white" />
            </div>
          </div>
          <Text size="sm" classes="text-red-700 dark:text-red-300">
            {I18nService.getMessage('orphanedProxyWarning') || 'The referenced proxy has been deleted. Please select a different proxy.'}
          </Text>
        </div>
      </div>
    {/if}
  </div>
</div>
