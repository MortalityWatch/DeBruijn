<script setup lang="ts">
import Slider from 'primevue/slider'
import { ref, watch } from 'vue'

// Define props and emit using v-model syntax
const props = defineProps<{ title: string; n: number; min: number; max: number }>()
const emit = defineEmits(['update:n'])

const n_ = ref(props.n)
watch(n_, (newVal) => emit('update:n', newVal))
watch(
  () => props.n,
  (newVal) => (n_.value = newVal)
)
</script>

<template>
  <div>
    <div class="grid">
      <div class="col-12">
        <p>{{ props.title }}</p>
      </div>
    </div>
    <div class="grid">
      <div class="col-10">
        <Slider v-model="n_" :min="props.min" :max="props.max" class="w-56" />
      </div>
      <div class="col-2">{{ n_ }}</div>
    </div>
  </div>
</template>
