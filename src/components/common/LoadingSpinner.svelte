<script lang="ts">
  interface Props {
    size?: 'sm' | 'md' | 'lg'
    color?: string
  }

  let { size = 'md', color = 'text-blue-500' }: Props = $props()

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }
</script>

<div class="flex justify-center items-center">
  <div
    class={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${color}`}
  ></div>
</div>
