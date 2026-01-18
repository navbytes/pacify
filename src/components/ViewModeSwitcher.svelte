<script lang="ts">
import type { ViewMode } from '@/interfaces'
import { I18nService } from '@/services/i18n/i18nService'
import { Grid3x3, LayoutList } from '@/utils/icons'
import SegmentedControl from './SegmentedControl.svelte'

interface Props {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

let { viewMode, onViewModeChange }: Props = $props()

const viewModeOptions = [
  {
    value: 'grid' as ViewMode,
    icon: Grid3x3,
  },
  {
    value: 'list' as ViewMode,
    icon: LayoutList,
  },
]

function handleChange(value: string) {
  onViewModeChange(value as ViewMode)
}
</script>

<SegmentedControl
  options={viewModeOptions}
  value={viewMode}
  onchange={handleChange}
  size="sm"
  aria-label={I18nService.getMessage('viewMode')}
/>
