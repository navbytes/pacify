<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' = 'md'
  export let color: string = 'text-blue-500'

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
