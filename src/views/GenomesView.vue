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
  genome1: 'AAATTTTA',
  genome2: 'GGTTTAGA',
  reads: 10,
  readLength: 3,
  seed: 74
})

// State
const isCalculating = ref(false)
const contigs: Ref<string[]> = ref([])
const network: Ref<NetworkData> = ref({ nodes: [], edges: [], edgesData: [] })

// Computed State
const reads = computed(() => {
  if (options.genome1.value.length < 3 || options.genome2.value.length < 3) return []
  else
    return [
      ...makeReads(
        options.genome1.value,
        options.readLength.value,
        options.reads.value,
        0,
        options.seed.value
      ),
      ...makeReads(
        options.genome2.value,
        options.readLength.value,
        options.reads.value,
        0,
        options.seed.value
      )
    ]
})
const kmers = computed(() => readsToKmers(options.k.value, reads.value))
const readsString = computed(() => displayArray(reads.value))
const kmersString = computed(() => displayArray(kmers.value))

const longestContigLength = computed(() =>
  contigs.value && contigs.value.length > 0 ? contigs.value[0].length : 0
)

watch([options.genome1, options.genome2], () => {
  if (options.readLength.value > options.genome1.value.length) {
    options.readLength.value = Math.max(3, options.genome1.value.length - 1)
  }
  if (options.readLength.value > options.genome2.value.length) {
    options.readLength.value = Math.max(3, options.genome2.value.length - 1)
  }
})
watch(options.readLength, () => {
  if (
    options.k.value >= options.genome1.value.length ||
    options.k.value >= options.genome2.value.length
  ) {
    options.k.value = options.readLength.value
  }

  if (options.k.value > options.readLength.value) options.k.value = options.readLength.value
})

watch(
  [options.genome1, options.genome2, options.reads, options.readLength, options.k, options.seed],
  (a, b) => {
    if (options.genome1.value.length >= 3 && options.genome2.value.length >= 3)
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
          <div class="container">
            <InputText name="genome" type="text" v-model="options.genome1.value" class="textarea" />
            <a
              class="dl"
              style="cursor: pointer"
              @click="downloadFastaFile([options.genome1.value], 'genome1.fa', 'Genome')"
              >💾 Download (FASTA)</a
            >
            <InputText name="genome" type="text" v-model="options.genome2.value" class="textarea" />
            <a
              class="dl"
              style="cursor: pointer"
              @click="downloadFastaFile([options.genome2.value], 'genome2.fa', 'Genome')"
              >💾 Download (FASTA)</a
            >
          </div>
          <NumberSlider
            title="# of genome reads:"
            v-model:n="options.reads.value"
            :min="0"
            :max="10"
          />
          <NumberSlider
            title="Read length:"
            v-model:n="options.readLength.value"
            :min="3"
            :max="Math.min(options.genome1.value.length, options.genome2.value.length) - 1"
          />
          <NumberSlider
            title="k-mer size:"
            v-model:n="options.k.value"
            :min="3"
            :max="options.readLength.value"
          />
          <NumberSlider title="Seed:" v-model:n="options.seed.value" :min="1" :max="100" />
        </template>
      </Card>
      <Card>
        <template #title>Result</template>
        <template #content>
          <p>Genome 1 length: {{ options.genome1.value.length }}</p>
          <p>Genome 2 length: {{ options.genome2.value.length }}</p>
          <div v-if="!isCalculating">
            <p>
              Any contig matches input genomes:
              <span
                v-if="
                  contigs.some(
                    (contig) => contig === options.genome1.value || contig === options.genome2.value
                  )
                "
                >✅</span
              >
              <span
                v-if="
                  !contigs.some(
                    (contig) => contig === options.genome1.value || contig === options.genome2.value
                  )
                "
                >❌</span
              >
            </p>
            <p>
              Longest contig matches input genome:
              <span
                v-if="contigs[0] === options.genome1.value || contigs[0] === options.genome2.value"
                >✅</span
              >
              <span
                v-if="contigs[0] !== options.genome1.value && contigs[0] !== options.genome2.value"
                >❌</span
              >
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
              <span
                :class="{
                  match: contig === options.genome1.value || contig === options.genome2.value
                }"
                >{{ contig }}</span
              >
              <span v-if="index < contigs.length - 1">{{ SEP }}</span>
            </span>
          </div>
          <ProgressSpinner v-if="isCalculating" style="width: 50px; height: 50px" />
        </template>
      </Card>
    </div>
  </div>
</template>
