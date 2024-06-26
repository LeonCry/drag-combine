<template>
  <ul
    v-if="menuContext"
    ref="menuRef"
    class="vdr-box absolute z-20 h-10 w-16 border-black bg-green-100 text-center"
    :style="{ left: menuContext?.left + 'px', top: menuContext?.top + 'px' }"
  >
    <li
      v-if="menuContext.type === 'combine'"
      class="vdr-box cursor-pointer p-2 hover:bg-green-200"
      @click="handleCombine"
    >
      组合
    </li>
    <li
      v-if="menuContext.type === 'combineOff'"
      class="vdr-box cursor-pointer p-2 hover:bg-green-200"
      @click="handleCombineOff(menuContext?.offIndex)"
    >
      解除
    </li>
  </ul>
</template>
<script setup lang="ts">
const props = defineProps<{
  menuContext:
    | {
        left: number;
        top: number;
        type: 'combine' | 'combineOff';
        // 如果解除组合,则OffIndex表示解除第几个组合
        offIndex?: string;
      }
    | undefined;
  handleCombine: () => void;
  handleCombineOff: (offIndex?: string) => void;
}>();
const emits = defineEmits<{
  'update:menuContext': [
    | {
        left: number;
        top: number;
        type: 'combine' | 'combineOff';
        offIndex?: string;
      }
    | undefined,
  ];
}>();
const menuContext = useVModel(props, 'menuContext', emits);
const menuRef = ref<HTMLUListElement | null>(null);
onClickOutside(menuRef, () => {
  menuContext.value = undefined;
});
</script>
