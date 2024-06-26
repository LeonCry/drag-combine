<template>
  <section ref="container" class="relative h-full w-full">
    <Vue3DraggableResizable
      v-for="i in initNumber"
      :id="i"
      :key="i"
      ref="dragRef"
      class="relative"
      :init-w="HW"
      :init-h="HW"
      @contextmenu="(e) => showOption(e, 'combine')"
    >
      <div
        class="vdr-box h-full w-full bg-red-100 text-center leading-[200px]"
        :class="{
          'border-2 border-[#007bff]': selectedIds?.includes(i + ''),
        }"
      >
        {{ i }}
      </div>
    </Vue3DraggableResizable>
    <Selector :start="start" :end="end" />
    <ContextMenu
      v-model:menuContext="menuContext"
      :handle-combine="handleCombine"
      :handle-combine-off="handleCombineOff"
    />
    <Vue3DraggableResizable
      v-for="fn in fatherParcels"
      :id="fn.parcelId"
      :key="fn.parcelId"
      ref="fatherRef"
      lock-aspect-ratio
      :resizable="false"
      class="relative z-10"
      @contextmenu="(e) => showOption(e, 'combineOff', fn.parcelId)"
      @drag-start="activeFatherRefId = fn.parcelId"
      @drag-end="activeFatherRefId = undefined"
    >
      <div
        class="vdr-box h-full w-full border-2 border-dashed border-gray-400 bg-[#0072ed10]"
      ></div>
    </Vue3DraggableResizable>
  </section>
</template>
<script setup lang="ts">
import { last, max, min, uid } from 'radash';
import Vue3DraggableResizable from 'vue3-draggable-resizable';
import 'vue3-draggable-resizable/dist/Vue3DraggableResizable.css';
type DragElementType = InstanceType<typeof Vue3DraggableResizable>;
const initNumber = 6;
const HW = 200;
const container = ref<HTMLDivElement | null>(null);
const dragRef = ref<DragElementType[] | null>(null);
const selectedDragRef = ref<DragElementType[]>([]);
const fatherRef = ref<DragElementType[] | null>(null);
// 组合包裹的子元素
const fatherParcels = ref<{ parcelElement: DragElementType[]; parcelId: string }[]>([]);
//触发拖动的父元素iD
const activeFatherRefId = ref();
const draggable = ref(true);
const isCombining = ref(false);
const handleCombine = async () => {
  if (!selectedDragRef.value) return;
  fatherParcels.value.push({
    parcelElement: [...selectedDragRef.value],
    parcelId: uid(8, '*'),
  });
  await nextTick();
  if (!fatherRef.value || !fatherRef.value.length) return;
  isCombining.value = true;
  draggable.value = false;
  menuContext.value = undefined;
  const minlt = min(selectedDragRef.value, (d) => d.left)!;
  const maxlt = max(selectedDragRef.value, (d) => d.left)!;
  const mintt = min(selectedDragRef.value, (d) => d.top)!;
  const maxtt = max(selectedDragRef.value, (d) => d.top)!;
  last(fatherRef.value)?.setWidth(maxlt.left - minlt.left + maxlt.width);
  last(fatherRef.value)?.setHeight(maxtt.top - mintt.top + maxtt.width);
  last(fatherRef.value)?.setLeft(minlt.left);
  last(fatherRef.value)?.setTop(mintt.top);
  selectedDragRef.value = [];
};
const handleCombineOff = (offIndex?: string) => {
  isCombining.value = false;
  draggable.value = true;
  menuContext.value = undefined;
  fatherParcels.value = fatherParcels.value.filter((fp) => fp.parcelId !== offIndex);
};
const menuContext = ref<
  { left: number; top: number; type: 'combine' | 'combineOff'; offIndex?: string } | undefined
>();
const showOption = (e: MouseEvent, type: 'combine' | 'combineOff', offIndex?: string) => {
  e.preventDefault();
  if ([0, 1].includes(selectedDragRef.value!.length) && offIndex === undefined) return;
  menuContext.value = {
    left: e.clientX,
    top: e.clientY,
    type,
    offIndex,
  };
};
useEventListener('mousemove', (e: MouseEvent) => {
  if (e.buttons !== 1 || activeFatherRefId.value === undefined) return;
  fatherParcels.value
    .find((fp) => fp.parcelId === activeFatherRefId.value)
    ?.parcelElement?.forEach((d) => {
      d.setLeft(d.left + e.movementX);
      d.setTop(d.top + e.movementY);
    });
});
const start = ref({
  x: 0,
  y: 0,
});
const end = ref({
  x: 0,
  y: 0,
});
const selecting = ref(false);
const getSelectedDrag = () => {
  if (!dragRef.value) return;
  const minT = Math.min(start.value.y, end.value.y);
  const maxT = Math.max(start.value.y, end.value.y);
  const minL = Math.min(start.value.x, end.value.x);
  const maxL = Math.max(start.value.x, end.value.x);
  selectedDragRef.value = dragRef.value.filter((d) => {
    return d.left >= minL && d.left <= maxL && d.top <= maxT && d.top >= minT;
  });
};
const selectedIds = computed(() => {
  return selectedDragRef.value?.map((s) => s.containerRef.id) || [];
});
useEventListener(container, 'mousedown', (e: MouseEvent) => {
  if (
    (e.target as HTMLElement).classList.contains('vdr-container') ||
    (e.target as HTMLElement).classList.contains('vdr-box')
  )
    return;
  selectedDragRef.value = [];
  selecting.value = true;
  start.value = {
    x: e.clientX,
    y: e.clientY,
  };
  end.value = {
    x: e.clientX,
    y: e.clientY,
  };
});
useEventListener(container, 'mousemove', (e: MouseEvent) => {
  if (!selecting.value) return;
  end.value = {
    x: e.clientX,
    y: e.clientY,
  };
  getSelectedDrag();
});
useEventListener(container, 'mouseup', (e: MouseEvent) => {
  end.value = {
    x: e.clientX,
    y: e.clientY,
  };
  selecting.value = false;
  start.value = { x: 0, y: 0 };
  end.value = { x: 0, y: 0 };
});
</script>
