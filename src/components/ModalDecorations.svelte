<script lang="ts">
import { modalAccentBarVariants, modalDecorativeBlurVariants } from '@/utils/classPatterns'

interface DecorativeBlur {
  position: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft'
  color: 'bluePurple' | 'pinkOrange' | 'tealCyan' | 'purplePink' | 'greenTeal'
}

interface Props {
  accentGradient?: 'bluePurple' | 'purplePink' | 'tealBlue' | 'orangeRed' | 'greenTeal'
  decorations?: DecorativeBlur[]
}

let {
  accentGradient = 'bluePurple',
  decorations = [
    { position: 'topRight', color: 'bluePurple' },
    { position: 'bottomLeft', color: 'pinkOrange' },
  ],
}: Props = $props()
</script>

<!-- Top gradient accent -->
<div class={modalAccentBarVariants({ gradient: accentGradient })}></div>

<!-- Decorative blur elements -->
{#each decorations as decoration (decoration.position)}
  <div class={modalDecorativeBlurVariants(decoration)}></div>
{/each}
