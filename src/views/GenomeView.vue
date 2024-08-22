<script setup lang="ts">
import Card from 'primevue/card'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import { ref, type Ref, computed, onMounted, watch } from 'vue'
import Graph from '../components/DeBruijnGraph.vue'
import type { NetworkData } from '../model'
import {
  readsToKmers,
  makeReads,
  downloadFastaFile,
  delay,
  useQuerySync,
  SEP,
  displayArray
} from '../lib'
import NumberSlider from '../components/NumberSlider.vue'
import ProgressSpinner from 'primevue/progressspinner'
import { parseInput } from '@/workers/workerHelper'

// User Input
const options = useQuerySync({
  k: 3,
  genome: 'AAATTTTA',
  reads: 6,
  noiseReads: 0,
  readLength: 3,
  seed: 73
})

// State
const isCalculating = ref(false)
const contigs: Ref<string[]> = ref([])
const network: Ref<NetworkData> = ref({ nodes: [], edges: [], edgesData: [] })

// Computed State
const reads = computed(() => {
  if (options.genome.value.length < 3) return []
  else
    return makeReads(
      options.genome.value,
      options.readLength.value,
      options.reads.value,
      options.noiseReads.value,
      options.seed.value
    )
})
const kmers = computed(() => readsToKmers(options.k.value, reads.value))
const readsString = computed(() => displayArray(reads.value))
const kmersString = computed(() => displayArray(kmers.value))
const longestContigLength = computed(() =>
  contigs.value && contigs.value.length > 0 ? contigs.value[0].length : 0
)

watch(options.genome, () => {
  if (options.readLength.value < options.genome.value.length) return
  options.readLength.value = Math.max(3, options.genome.value.length - 1)
})
watch(options.readLength, () => {
  if (options.k.value >= options.genome.value.length) options.k.value = options.readLength.value
  if (options.k.value > options.readLength.value) options.k.value = options.readLength.value
})

watch(
  [options.genome, options.reads, options.noiseReads, options.readLength, options.k, options.seed],
  (a, b) => {
    if (options.genome.value.length >= 3)
      delay(
        () => parseInput(options.k.value, kmers.value, network, contigs, isCalculating),
        a[0] !== b[0] ? 0 : 500
      )
  }
)

onMounted(() => parseInput(options.k.value, kmers.value, network, contigs, isCalculating))
</script>

<template>
  <div class="grid">
    <div class="col-12 md:col-4">
      <Card>
        <template #title>Input</template>
        <template #content>
          <InputText name="genome" type="text" v-model="options.genome.value" class="textarea" />
          <NumberSlider
            title="# of genome reads:"
            v-model:n="options.reads.value"
            :min="0"
            :max="10"
          />
          <NumberSlider
            title="# of random reads:"
            v-model:n="options.noiseReads.value"
            :min="0"
            :max="10"
          />
          <NumberSlider
            title="Read length:"
            v-model:n="options.readLength.value"
            :min="3"
            :max="options.genome.value.length - 1"
          />
          <NumberSlider
            title="k-mer size:"
            v-model:n="options.k.value"
            :min="3"
            :max="options.readLength.value"
          />
          <NumberSlider title="Seed:" v-model:n="options.seed.value" :min="1" :max="100" />
          <a
            class="dl"
            style="cursor: pointer"
            @click="downloadFastaFile([options.genome.value], 'genome.fa', 'Genome')"
            >💾 Download (FASTA)</a
          >
        </template>
      </Card>
      <Card>
        <template #title>Result</template>
        <template #content>
          <p>Genome length: {{ options.genome.value.length }}</p>
          <div v-if="!isCalculating">
            <p>
              Any contig matches input genome:
              <span v-if="contigs.some((contig) => contig === options.genome.value)">✅</span>
              <span v-if="!contigs.some((contig) => contig === options.genome.value)">❌</span>
            </p>
            <p>
              Longest contig matches input genome:
              <span v-if="contigs[0] === options.genome.value">✅</span>
              <span v-if="contigs[0] !== options.genome.value">❌</span>
            </p>
            <p>Longest contig length: {{ longestContigLength }}</p>
          </div>
          <ProgressSpinner v-if="isCalculating" style="width: 50px; height: 50px" />
        </template>
      </Card>
    </div>
    <div class="col-12 md:col-8">
      <Card>
        <template #title
          >Reads ({{ reads.length }})
          <a
            class="dl"
            style="cursor: pointer"
            @click="downloadFastaFile(reads, 'reads.fa', 'Read')"
            >💾 Download FASTA</a
          >
        </template>
        <template #content>
          <Textarea class="textarea" v-model="readsString" rows="3" />
        </template>
      </Card>
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
              <span :class="{ match: contig === options.genome.value }">{{ contig }}</span>
              <span v-if="index < contigs.length - 1">{{ SEP }}</span>
            </span>
          </div>
          <ProgressSpinner v-if="isCalculating" style="width: 50px; height: 50px" />
        </template>
      </Card>
    </div>
  </div>
</template>
