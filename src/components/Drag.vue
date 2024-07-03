<template>
  <section ref="container" class="absolute h-full w-full overflow-hidden border border-black">
    <Vue3DraggableResizable
      v-for="d in initData"
      :id="d.id"
      :key="d.id"
      ref="dragRef"
      parent
      class="base-sign relative"
      :init-w="HW"
      :init-h="HW"
      :style="{ scale }"
      :scale-ratio="scale"
    >
      <div
        class="vdr-box h-full w-full select-none border border-red-400 bg-red-100 text-center leading-[200px]"
        :class="{
          '!border-2 !border-[#007bff]': selectedIds?.includes(d.id + ''),
        }"
      >
        {{ d.label }}
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
      parent
      lock-aspect-ratio
      :resizable="false"
      class="combine-sign relative z-10 select-none"
      :style="{ scale }"
      :scale-ratio="scale"
      @contextmenu="(e) => showOption(e, 'combineOff', fn.parcelId)"
      @drag-start="activeFatherRefId = fn.parcelId"
      @drag-end="activeFatherRefId = undefined"
    >
      <div
        :class="{
          '!border-2 !border-[#007bff]': selectedIds?.includes(fn.parcelId + ''),
        }"
        class="vdr-box absolute z-10 h-full w-full bg-[#10ff4f37]"
      ></div>
    </Vue3DraggableResizable>
    <!-- circled -->
    <Vue3DraggableResizable
      ref="circledRef"
      parent
      lock-aspect-ratio
      :resizable="false"
      class="circle-sign relative z-20 select-none"
      class-name-draggable="empty"
      :style="{ scale }"
      :scale-ratio="scale"
      @contextmenu="(e) => showOption(e, 'combine')"
    >
      <div class="vdr-box circle-sign absolute z-20 h-full w-full"></div>
    </Vue3DraggableResizable>
    <button class="absolute right-2 top-2 h-8 w-16 bg-amber-200" @click="scale = 0.5">
      缩放.5
    </button>
  </section>
</template>
<script setup lang="ts">
import { last, max, min, sift, uid } from 'radash';
import Vue3DraggableResizable from 'vue3-draggable-resizable';
import 'vue3-draggable-resizable/dist/Vue3DraggableResizable.css';
type DragElementType = InstanceType<typeof Vue3DraggableResizable> & { belong?: string };
type mouseXY =
  | {
      x: number;
      y: number;
    }
  | undefined;
const initData = [
  {
    id: 1,
    label: 1,
  },
  {
    id: 2,
    label: 2,
  },
  {
    id: 3,
    label: 3,
  },
  {
    id: 4,
    label: 4,
  },
  {
    id: 5,
    label: 5,
  },
  {
    id: 6,
    label: 6,
  },
];
const HW = 200;
const scale = ref(1);
const container = ref<HTMLDivElement | null>(null);
const containerBounding = useElementBounding(container);
const dragRef = ref<DragElementType[] | null>(null);
const selectedDragRef = ref<DragElementType[]>([]);
const circledRef = ref<DragElementType | null>(null);
const fatherRef = ref<DragElementType[] | null>(null);
// 组合包裹的子元素
const fatherParcels = ref<
  { parcelElement: DragElementType[]; parcelId: string; fatherRef?: DragElementType }[]
>([]);
//触发拖动的父元素iD
const activeFatherRefId = ref();
const isCombining = ref(false);
const handleCombine = async () => {
  if (!selectedDragRef.value) return;
  // 如果选中的dragger有已经组合了的,则先将其解除组合,获取内部元素
  const hasCombinedInSelected = selectedDragRef.value.filter((s) =>
    s.containerRef.classList.contains('combine-sign'),
  );
  if (hasCombinedInSelected.length) {
    const combinedIds = hasCombinedInSelected.map((h) => h.containerRef.id);
    const liberated = combinedIds.map((c) => handleCombineOff(c))?.flat() || [];
    // 将已组合的从selected中删除
    selectedDragRef.value = selectedDragRef.value.filter(
      (s) => !combinedIds.includes(s.containerRef.id),
    );
    selectedDragRef.value.push(...liberated);
  }
  fatherParcels.value.push({
    parcelElement: [...selectedDragRef.value],
    parcelId: uid(8, '*'),
    fatherRef: undefined,
  });
  selectedDragRef.value.forEach((s) => (s.belong = last(fatherParcels.value)?.parcelId));
  await nextTick();
  if (!fatherRef.value || !fatherRef.value.length) return;
  isCombining.value = true;
  menuContext.value = undefined;
  const minlt = min(selectedDragRef.value, (d) => d.left)!;
  const maxlt = max(selectedDragRef.value, (d) => d.left)!;
  const mintt = min(selectedDragRef.value, (d) => d.top)!;
  const maxtt = max(selectedDragRef.value, (d) => d.top)!;
  const lastFR = last(fatherRef.value)!;
  lastFR?.setWidth(maxlt.left - minlt.left + maxlt.width);
  lastFR?.setHeight(maxtt.top - mintt.top + maxtt.width);
  lastFR?.setLeft(minlt.left);
  lastFR?.setTop(mintt.top);
  // 将被组合的元素汇入fatherRef.value.containerRef中
  selectedDragRef.value.forEach((s) => {
    lastFR.containerRef.appendChild(s.containerRef);
    s.setLeft(s.left - lastFR.left);
    s.setTop(s.top - lastFR.top);
  });
  last(fatherParcels.value)!.fatherRef = lastFR;
  selectedDragRef.value = [];
};
const handleCombineOff = (offIndex?: string) => {
  isCombining.value = false;
  menuContext.value = undefined;
  const liberateDraggers: DragElementType[] = [];
  const unCombinedElement = fatherParcels.value.find((fp) => fp.parcelId === offIndex);
  unCombinedElement?.parcelElement.forEach((up) => {
    up.belong = undefined;
    up.setLeft(up.left + unCombinedElement.fatherRef!.left);
    up.setTop(up.top + unCombinedElement.fatherRef!.top);
    container.value?.appendChild(up.containerRef);
    liberateDraggers.push(up);
  });
  fatherParcels.value = fatherParcels.value.filter((fp) => fp.parcelId !== offIndex);
  return liberateDraggers;
};
const menuContext = ref<
  { left: number; top: number; type: 'combine' | 'combineOff'; offIndex?: string } | undefined
>();
const showOption = (e: MouseEvent, type: 'combine' | 'combineOff', offIndex?: string) => {
  e.preventDefault();
  // 组合前先解除圈选
  unCircled();
  if ([0, 1].includes(selectedDragRef.value!.length) && offIndex === undefined) return;
  menuContext.value = {
    left: e.clientX - containerBounding.left.value,
    top: e.clientY - containerBounding.top.value,
    type,
    offIndex,
  };
};
const start = ref<mouseXY>();
const end = ref<mouseXY>();
const selecting = ref(false);
const getSelectedDrag = () => {
  if (!dragRef.value || !start.value || !end.value) return;
  const minT = Math.min(start.value.y, end.value.y);
  const maxT = Math.max(start.value.y, end.value.y);
  const minL = Math.min(start.value.x, end.value.x);
  const maxL = Math.max(start.value.x, end.value.x);
  const selectBaseDrag =
    dragRef.value.filter((d) => {
      return d.left >= minL && d.left <= maxL && d.top <= maxT && d.top >= minT && !d.belong;
    }) || [];
  const selectFatherDrag =
    fatherRef.value?.filter((d) => {
      return d.left >= minL && d.left <= maxL && d.top <= maxT && d.top >= minT && !d.belong;
    }) || [];
  selectedDragRef.value = [...selectBaseDrag, ...selectFatherDrag];
};
const selectedIds = computed(() => {
  return sift(selectedDragRef.value?.map((s) => s.containerRef?.id) || []);
});
// 解除圈选组合
const unCircled = () => {
  // 解除组合
  if (selectedDragRef.value?.length) {
    selectedDragRef.value.forEach((sv) => {
      sv.setLeft(sv.left + circledRef.value!.left);
      sv.setTop(sv.top + circledRef.value!.top);
      container.value?.appendChild(sv.containerRef);
    });
    circledRef.value?.setLeft(0);
    circledRef.value?.setTop(0);
    circledRef.value?.setWidth(0);
    circledRef.value?.setHeight(0);
  }
};
const isInSide = (
  element: DragElementType,
  fatherElement: DragElementType,
  x: number,
  y: number,
) => {
  if (
    element.left + fatherElement.left < x &&
    element.top + fatherElement.top < y &&
    element.left + fatherElement.left + element.width > x &&
    element.top + fatherElement.top + element.height > y
  )
    return true;
  return false;
};
useEventListener(container, 'mousedown', (e: MouseEvent) => {
  let jump = false;
  if ((e.target as HTMLElement).classList.contains('circle-sign')) {
    const inSide = selectedDragRef.value.some((s) =>
      isInSide(s, circledRef.value!, e.clientX, e.clientY),
    );
    if (inSide) return;
    jump = true;
  }
  if ((e.target as HTMLElement).classList.contains('vdr-container') && !jump) return;
  if ((e.target as HTMLElement).classList.contains('vdr-box') && !jump) return;
  // 解除组合
  unCircled();
  selectedDragRef.value = [];
  selecting.value = true;
  start.value = {
    x: e.clientX - containerBounding.left.value,
    y: e.clientY - containerBounding.top.value,
  };
  end.value = {
    x: e.clientX - containerBounding.left.value,
    y: e.clientY - containerBounding.top.value,
  };
});
useEventListener(container, 'mousemove', (e: MouseEvent) => {
  if (!selecting.value) return;
  end.value = {
    x: e.clientX - containerBounding.left.value,
    y: e.clientY - containerBounding.top.value,
  };
  getSelectedDrag();
});
useEventListener(container, 'mouseup', (e: MouseEvent) => {
  if (!selecting.value) return;
  end.value = {
    x: e.clientX - containerBounding.left.value,
    y: e.clientY - containerBounding.top.value,
  };
  selecting.value = false;
  start.value = undefined;
  end.value = undefined;
  if (!selectedDragRef.value?.length || !circledRef.value) return;
  // 如果只有一个元素,也没必要放入circledRef中
  if (selectedDragRef.value?.length === 1) return;
  const minlt = min(selectedDragRef.value, (d) => d.left)!;
  const maxlt = max(selectedDragRef.value, (d) => d.left)!;
  const mintt = min(selectedDragRef.value, (d) => d.top)!;
  const maxtt = max(selectedDragRef.value, (d) => d.top)!;
  circledRef.value.setWidth(maxlt.left - minlt.left + maxlt.width);
  circledRef.value.setHeight(maxtt.top - mintt.top + maxtt.width);
  circledRef.value.setLeft(minlt.left);
  circledRef.value.setTop(mintt.top);
  // circledRef.value.containerRef中
  selectedDragRef.value.forEach((s) => {
    circledRef.value!.containerRef.appendChild(s.containerRef);
    s.setLeft(s.left - circledRef.value!.left);
    s.setTop(s.top - circledRef.value!.top);
  });
});
</script>
<style>
.empty {
  border: none !important;
}
</style>
