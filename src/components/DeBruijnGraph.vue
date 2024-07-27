<script setup lang="ts">
import type { NetworkData } from '@/model'
import { Network } from 'vis-network'
import { onMounted, ref, watch } from 'vue'

const network = ref<Network | null>(null)
const networkContainer = ref<HTMLElement | null>(null)

const props = defineProps<{ networkData: NetworkData }>()

const updateNetwork = () => {
  if (!networkContainer.value) return
  network.value = new Network(networkContainer.value, props.networkData, { autoResize: false })
}

onMounted(() => updateNetwork)

watch(
  () => props.networkData,
  () => updateNetwork()
)
</script>

<template>
  <div ref="networkContainer" class="network-container"></div>
</template>

<style scoped>
.network-container {
  width: 100% !important;
  height: 400px;
  border: 1px solid lightgray;
}
</style>
