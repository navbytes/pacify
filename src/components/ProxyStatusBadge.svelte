<script lang="ts">
  import type { ProxyTestResult } from '@/interfaces'
  import { ProxyTestService } from '@/services/ProxyTestService'

  /**
   * ProxyStatusBadge Component
   * Phase 1: Foundation & Testing
   *
   * Displays the test status of a proxy with visual indicators
   */
  interface Props {
    testResult?: ProxyTestResult
    isActive: boolean
    compact?: boolean
  }

  let { testResult, isActive, compact = false }: Props = $props()

  let statusInfo = $derived(() => {
    // Active proxies always show as active
    if (isActive) {
      return {
        icon: '🟢',
        text: 'ACTIVE',
        color: 'success',
        detail: null
      }
    }

    // No test result
    if (!testResult) {
      return {
        icon: '⚪',
        text: 'Not tested',
        color: 'neutral',
        detail: null
      }
    }

    // Failed test
    if (!testResult.success) {
      return {
        icon: '🔴',
        text: 'Failed',
        color: 'error',
        detail: testResult.error
      }
    }

    // Successful test - check response time
    if (testResult.responseTime) {
      if (testResult.responseTime < 2000) {
        return {
          icon: '🟢',
          text: compact ? 'OK' : `OK (${testResult.responseTime}ms)`,
          color: 'success',
          detail: `Tested ${ProxyTestService.getTimeSinceTest(testResult)}`
        }
      }

      if (testResult.responseTime < 5000) {
        return {
          icon: '🟡',
          text: compact ? 'Slow' : `Slow (${testResult.responseTime}ms)`,
          color: 'warning',
          detail: `Tested ${ProxyTestService.getTimeSinceTest(testResult)}`
        }
      }

      return {
        icon: '🟠',
        text: compact ? 'Very Slow' : `Very Slow (${testResult.responseTime}ms)`,
        color: 'warning',
        detail: `Tested ${ProxyTestService.getTimeSinceTest(testResult)}`
      }
    }

    // Success but no response time
    return {
      icon: '🟢',
      text: 'OK',
      color: 'success',
      detail: `Tested ${ProxyTestService.getTimeSinceTest(testResult)}`
    }
  })
</script>

<div class="status-badge" data-color={statusInfo.color} class:compact>
  <span class="icon">{statusInfo.icon}</span>
  <span class="text">{statusInfo.text}</span>

  {#if statusInfo.detail && !compact}
    <span class="detail">{statusInfo.detail}</span>
  {/if}
</div>

<style>
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .status-badge.compact {
    padding: 2px 8px;
    font-size: 11px;
  }

  .icon {
    font-size: 14px;
    line-height: 1;
  }

  .text {
    white-space: nowrap;
  }

  .detail {
    opacity: 0.7;
    font-size: 10px;
    font-weight: 400;
  }

  /* Color variants */
  .status-badge[data-color='success'] {
    background: #dcfce7;
    color: #15803d;
    border: 1px solid #86efac;
  }

  .status-badge[data-color='warning'] {
    background: #fef3c7;
    color: #b45309;
    border: 1px solid #fcd34d;
  }

  .status-badge[data-color='error'] {
    background: #fee2e2;
    color: #b91c1c;
    border: 1px solid #fca5a5;
  }

  .status-badge[data-color='neutral'] {
    background: #f3f4f6;
    color: #6b7280;
    border: 1px solid #d1d5db;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .status-badge[data-color='success'] {
      background: #14532d;
      color: #86efac;
      border-color: #166534;
    }

    .status-badge[data-color='warning'] {
      background: #78350f;
      color: #fcd34d;
      border-color: #92400e;
    }

    .status-badge[data-color='error'] {
      background: #7f1d1d;
      color: #fca5a5;
      border-color: #991b1b;
    }

    .status-badge[data-color='neutral'] {
      background: #374151;
      color: #d1d5db;
      border-color: #4b5563;
    }
  }
</style>
