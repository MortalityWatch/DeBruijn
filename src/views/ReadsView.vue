<script setup lang="ts">
import Card from 'primevue/card'
import Textarea from 'primevue/textarea'
import { ref, type Ref, computed, onMounted, watch } from 'vue'
import Graph from '../components/DeBruijnGraph.vue'
import type { NetworkData } from '../model'
import {
  readsToKmers,
  downloadFastaFile,
  shortestReadLength,
  useQuerySync,
  NEW_LINE,
  SEP,
  displayArray
} from '../lib'
import NumberSlider from '../components/NumberSlider.vue'
import ProgressSpinner from 'primevue/progressspinner'
import { parseInput } from '@/workers/workerHelper'

// User Input
const options = useQuerySync({
  k: 3,
  reads: ['AAA', 'AAT', 'ATT', 'TTT', 'TTT', 'TTA']
})
const readsRaw = ref(options.reads.value.join(NEW_LINE))

// State
const isCalculating = ref(false)
const contigs: Ref<string[]> = ref([])
const network: Ref<NetworkData> = ref({ nodes: [], edges: [], edgesData: [] })

// Computed State
const k_max = computed(() => shortestReadLength(options.reads.value))
const kmers = computed(() => readsToKmers(options.k.value, options.reads.value))
const kmersString = computed(() => displayArray(kmers.value))

// Watchers
watch([readsRaw, options.k], () => {
  options.reads.value = readsRaw.value.replace(SEP, NEW_LINE).split(NEW_LINE)
  const shortestRead = shortestReadLength(options.reads.value)
  if (options.k.value >= shortestRead) options.k.value = Math.max(2, shortestRead)
  parseInput(options.k.value, kmers.value, network, contigs, isCalculating)
})

onMounted(() => parseInput(options.k.value, kmers.value, network, contigs, isCalculating))
</script>

<template>
  <div class="grid">
    <div class="col-12 md:col-4">
      <Card>
        <template #title>Input</template>
        <template #content>
          <div class="container">
            <Textarea class="textarea" v-model="readsRaw" rows="7" />
            <a
              class="dl"
              style="cursor: pointer"
              @click="downloadFastaFile(options.reads.value, 'reads.fa', 'Read')"
              >💾 Download FASTA</a
            >
          </div>
          <NumberSlider title="k-mer size:" v-model:n="options.k.value" :min="2" :max="k_max" />
        </template>
      </Card>
    </div>
    <div class="col-12 md:col-8">
      <Card>
        <template #title>k-mers ({{ kmers.length }})</template>
        <template #content>
          <Textarea class="textarea" v-model="kmersString" rows="3" />
        </template>
      </Card>
      <Card>
        <template #title>De-Bruijn Graph</template>
        <template #content>
          <Graph :networkData="network"></Graph>
        </template>
      </Card>
      <Card>
        <template #title>
          Contigs ({{ contigs.length }})<a
            class="dl"
            style="cursor: pointer"
            @click="downloadFastaFile(contigs, 'contigs.fa', 'Contig')"
            >💾 Download FASTA</a
          ></template
        >
        <template #content>
          <div>
            <span v-for="(contig, index) in contigs" :key="index">
              <span>{{ contig }}</span>
              <span v-if="index < contigs.length - 1">{{ SEP }}</span>
            </span>
          </div>
          <ProgressSpinner v-if="isCalculating" style="width: 50px; height: 50px" />
        </template>
      </Card>
    </div>
  </div>
</template>
