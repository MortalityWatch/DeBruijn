<script setup lang="ts">
import Card from 'primevue/card'
import RadioButton from 'primevue/radiobutton'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import { ref, type Ref, computed, onMounted, watch } from 'vue'
import Graph from './components/DeBruijnGraph.vue'
import type { NetworkData } from './model'
import {
  makeGraph,
  toNetworkData,
  getContigs,
  readsToKmers,
  makeReads,
  downloadFastaFile,
  shortestReadLength,
  delay,
  generateRandomDNAString
} from './lib'
import NumberSlider from './components/NumberSlider.vue'

const genome = ref(generateRandomDNAString(10))
const n = ref(3)
const noiseReads = ref(5)
const inputType = ref('genome')
const reads_raw = ref(`${generateRandomDNAString(10)}\n${generateRandomDNAString(10)}`)
const contigs = ref([''])
const k = ref(4)
const network: Ref<NetworkData> = ref({ nodes: [], edges: [] })
const reads = computed(() => {
  if (inputType.value === 'genome') {
    if (genome.value.length < 3) return []
    else return makeReads(genome.value, n.value, minReadLength.value, noiseReads.value)
  } else {
    return reads_raw.value.split('\n').filter((line) => line.trim() !== '')
  }
})
const displayArray = (a: string[]) => a.join(' · ')
const minReadLength = ref(Math.max(5, Math.round(genome.value.length * 0.1)))
const kmers = computed(() => readsToKmers(k.value, reads.value))
const k_max = ref(minReadLength.value)
const readsString = computed(() => displayArray(reads.value))
const kmersString = computed(() => displayArray(kmers.value))
const contigsString = computed(() => displayArray(contigs.value))

watch(genome, () => {
  if (minReadLength.value < genome.value.length) return
  minReadLength.value = Math.max(2, genome.value.length - 1)
})
watch(reads_raw, () => {
  const shortestRead = shortestReadLength(reads.value)
  k_max.value = shortestRead - 1
  if (k.value < shortestRead) return
  k.value = Math.max(2, shortestRead - 1)
})
watch(minReadLength, () => {
  k_max.value = minReadLength.value
  if (k.value >= genome.value.length) k.value = minReadLength.value
})

watch([inputType, reads_raw, genome, n, noiseReads, minReadLength, k], (a, b) => {
  if (genome.value.length >= 3) delay(parseInput, a[0] !== b[0] ? 0 : 500)
})

const parseInput = () => {
  const graph = makeGraph(kmers.value)
  network.value = toNetworkData(graph)
  contigs.value = getContigs(network.value)
}

onMounted(() => parseInput())
</script>

<template>
  <h1>De Bruijn graph genome assembly</h1>
  <div class="grid">
    <div class="col-12 md:col-4">
      <Card>
        <template #title>Input</template>
        <template #content>
          <div id="inputTypeToggle">
            <label for="reads" class="inputToggle ml-2">
              <RadioButton v-model="inputType" inputId="reads" name="reads" value="reads" />
              ䷉ Reads</label
            >&nbsp;
            <label for="genome" class="inputToggle ml-2">
              <RadioButton v-model="inputType" inputId="genome" name="genome" value="genome" />
              🧬 Genome</label
            >
          </div>
          <Textarea v-if="inputType === 'reads'" class="textarea" v-model="reads_raw" rows="5" />
          <div class="inputTypeGenome" v-if="inputType === 'genome'">
            <InputText
              name="genome"
              v-if="inputType === 'genome'"
              type="text"
              v-model="genome"
              class="textarea"
            />
            <NumberSlider title="# of genome reads:" v-model:n="n" :min="0" :max="10" />
            <NumberSlider title="# of random reads:" v-model:n="noiseReads" :min="0" :max="10" />
            <NumberSlider
              title="Minimum read length:"
              v-model:n="minReadLength"
              :min="2"
              :max="genome.length - 1"
            />
          </div>
          <NumberSlider title="k-mer size:" v-model:n="k" :min="2" :max="k_max" />
          <a
            v-if="inputType === 'genome'"
            class="dl"
            style="cursor: pointer"
            @click="downloadFastaFile([genome], 'genome.fa')"
            >💾 Download (FASTA)</a
          >
        </template>
      </Card>
      <Card v-if="inputType == 'genome'">
        <template #title>Result</template>
        <template #content>
          <p>
            Any contig matches input genome:
            <span v-if="contigs.some((contig) => contig === genome)">✅</span>
            <span v-if="!contigs.some((contig) => contig === genome)">❌</span>
          </p>
          <p>
            Longest contig matches input genome:
            <span v-if="contigs[0] === genome">✅</span>
            <span v-if="contigs[0] !== genome">❌</span>
          </p>
          <p>Genome length: {{ genome.length }}</p>
          <p>Longest contig length: {{ contigs[0].length }}</p>
        </template>
      </Card>
    </div>
    <div class="col-12 md:col-8">
      <Card v-if="inputType === 'genome'">
        <template #title
          >Reads ({{ reads.length }})
          <a class="dl" style="cursor: pointer" @click="downloadFastaFile(reads, 'reads.fa')"
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
        <template #title
          >Contigs ({{ contigs.length }})<a
            class="dl"
            style="cursor: pointer"
            @click="downloadFastaFile(contigs, 'contigs.fa')"
            >💾 Download FASTA</a
          ></template
        >
        <template #content>
          <Textarea class="textarea" v-model="contigsString" rows="5" />
        </template>
      </Card>
    </div>
  </div>
  <div>
    <Card>
      <template #title>About</template>
      <template #content>
        <p>
          This tool visualizes short read genome assembly using the De Bruijn graph algorithm. It
          showcases the theory behind the complex process of in-silico genome assembly, making it
          more accessible and understandable. This method was the primary method, that was used
          during the creation of the SARS-CoV-2 reference genome.
        </p>

        <h2>How the Algorithm Works</h2>
        <p>
          The De Bruijn graph algorithm is a widely used method for genome assembly, particularly
          used for handling short reads from sequencing technologies. Here's a step-by-step
          breakdown of the process:
        </p>

        <h3>1. Reads Splitting into k-mers:</h3>
        <p>
          The short genomic reads are divided into smaller, overlapping sequences of length (k),
          known as k-mers.
        </p>

        <h3>2. Constructing the Graph:</h3>
        <p>
          Each (k-1)-mer represents a node in the graph. Edges are created between nodes based on
          the k-mers. Specifically, an edge is formed from one (k-1)-mer to another if there is a
          k-mer that bridges them (i.e., the suffix of the first (k-1)-mer matches the prefix of the
          second (k-1)-mer).
        </p>

        <h3>3. Traversing the Graph:</h3>
        <p>
          The graph is traversed to find all possible paths, known as contigs. These paths represent
          all possible sequences of DNA that can be assembled from the k-mers, but do not
          necessarily have to exist in nature.
        </p>

        <h3>4. Result</h3>
        <p>
          The tool shows if the original sequence (i.e. that of a bacterium or virus) was found in
          the results (contigs) and if it matches the longest found contig.
        </p>

        <h2>Input Modes</h2>
        <p>The tool offers two input modes for flexibility:</p>
        <p></p>

        <h3>1. Reads Mode:</h3>
        <p>
          Users can define a list of genomic reads. This mode is suitable for working with
          sequencing data where the target genome is unknown and needs to be assembled from the
          provided reads.
        </p>

        <h3>2. Genome Mode:</h3>
        <p>
          Users can define a reference genome. Based on this reference, the tool generates reads
          with added random noise to simulate additional genomic material (bacterial, human, etc.).
          This mode is useful for testing the assembly process and understanding how other genetic
          material might impact the assembly.
        </p>

        <h2>Data Download</h2>
        <p>
          Reads and contigs can be downloaded in FASTA format for further bioinformatic processing.
        </p>

        <p>
          In summary, this tool provides a powerful way to visualize and understand the genome
          assembly process and its potential issues using the De Bruijn graph algorithm.
        </p>

        <h2>Open Source</h2>
        <p>
          The full code of this tool can be found at:
          <a target="_blank" href="https://github.com/MortalityWatch/DeBruijn">Source Code</a>
        </p>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.dl {
  font-size: 10pt;
  float: right;
}

.textarea {
  width: 100%;
}

.p-card {
  margin-bottom: 5px;
}

.p-inputtext,
#inputTypeToggle {
  margin-bottom: 15px;
}

.inputToggle {
  cursor: pointer;
}
</style>
