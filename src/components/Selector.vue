<template>
  <div class="absolute border-[#0073ED] bg-[#0072ed41]" :style="style" />
</template>
<script setup lang="ts">
const props = defineProps<{
  start: { x: number; y: number } | undefined;
  end: { x: number; y: number } | undefined;
}>();
const style = computed(() => {
  if (!props.start || !props.end) return;
  const width = Math.abs(props.end.x - props.start.x) + 'px';
  const height = Math.abs(props.end.y - props.start.y) + 'px';
  const left = Math.min(props.end.x, props.start.x) + 'px';
  const top = Math.min(props.end.y, props.start.y) + 'px';
  return { width, height, left, top };
});
</script>
