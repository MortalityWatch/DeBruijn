<script setup lang="ts">
import Card from 'primevue/card'
import RadioButton from 'primevue/radiobutton'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import { ref, type Ref, computed, onMounted, watch } from 'vue'
import Graph from '../components/DeBruijnGraph.vue'
import type { NetworkData } from '../model'
import {
  makeGraph,
  toNetworkData,
  readsToKmers,
  makeReads,
  downloadFastaFile,
  shortestReadLength,
  delay,
  useQuerySync
} from '../lib'
import NumberSlider from '../components/NumberSlider.vue'
import { getContigs, getEdgePaths } from '@/contig'

const options = useQuerySync({
  inputType: 'reads',
  k: 3,
  readsRaw: ['AAA', 'AAT', 'ATT', 'TTT', 'TTT', 'TTA'].join('\n'),
  genome: 'AAATTTTA',
  reads: 6,
  noiseReads: 0,
  readLength: 3,
  seed: -1
})

onMounted(() => {
  if (options.seed.value === -1) {
    options.seed.value = Math.round(1000 * Math.random())
  }
})

const contigs = ref([''])
const network: Ref<NetworkData> = ref({ nodes: [], edges: [], edgesData: [] })
const reads = computed(() => {
  if (options.inputType.value === 'genome') {
    if (options.genome.value.length < 3) return []
    else
      return makeReads(
        options.genome.value,
        options.readLength.value,
        options.reads.value,
        options.noiseReads.value,
        options.seed.value
      )
  } else {
    return options.readsRaw.value.split('\n').filter((line) => line.trim() !== '')
  }
})
const displayArray = (a: string[], sep = ' · ') => a.join(sep)
const kmers = computed(() => readsToKmers(options.k.value, reads.value))
const k_max = ref(options.readLength.value)
const readsString = computed(() => displayArray(reads.value))
const kmersString = computed(() => displayArray(kmers.value))
const longestContigLength = computed(() =>
  contigs.value && contigs.value.length > 0 ? contigs.value[0].length : 0
)

watch(options.genome, () => {
  if (options.readLength.value < options.genome.value.length) return
  options.readLength.value = Math.max(2, options.genome.value.length - 1)
})
watch(options.readsRaw, () => {
  const shortestRead = shortestReadLength(reads.value)
  k_max.value = shortestRead
  if (options.k.value < shortestRead) return
  options.k.value = Math.max(2, shortestRead)
})
watch(options.readLength, () => {
  k_max.value = options.readLength.value
  if (options.k.value >= options.genome.value.length) options.k.value = options.readLength.value
})

watch(
  [
    options.inputType,
    options.readsRaw,
    options.genome,
    options.reads,
    options.noiseReads,
    options.readLength,
    options.k,
    options.seed
  ],
  (a, b) => {
    if (options.genome.value.length >= 3) delay(parseInput, a[0] !== b[0] ? 0 : 500)
  }
)

const parseInput = () => {
  console.log('Making graph...')
  const graph = makeGraph(kmers.value)
  console.log('Making network...')
  network.value = toNetworkData(graph)
  console.log('Finding paths...')
  const paths = getEdgePaths(network.value)
  console.log('Calculating contigs...')
  contigs.value = getContigs(paths, network.value.edgesData, options.k.value)
}

onMounted(() => parseInput())
</script>

<template>
  <a href="/"><h1>De Bruijn graph genome assembly</h1></a>
  <div class="grid">
    <div class="col-12 md:col-4">
      <Card>
        <template #title>Input</template>
        <template #content>
          <div id="inputTypeToggle">
            <label for="reads" class="inputToggle ml-2">
              <RadioButton
                v-model="options.inputType.value"
                inputId="reads"
                name="reads"
                value="reads"
              />
              ䷉ Reads</label
            >&nbsp;
            <label for="genome" class="inputToggle ml-2">
              <RadioButton
                v-model="options.inputType.value"
                inputId="genome"
                name="genome"
                value="genome"
              />
              🧬 Genome</label
            >
          </div>
          <Textarea
            v-if="options.inputType.value === 'reads'"
            class="textarea"
            v-model="options.readsRaw.value"
            rows="7"
          />
          <div class="inputTypeGenome" v-if="options.inputType.value === 'genome'">
            <InputText
              name="genome"
              v-if="options.inputType.value === 'genome'"
              type="text"
              v-model="options.genome.value"
              class="textarea"
            />
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
              :min="2"
              :max="options.genome.value.length - 1"
            />
          </div>
          <NumberSlider title="k-mer size:" v-model:n="options.k.value" :min="2" :max="k_max" />
          <NumberSlider
            v-if="options.inputType.value === 'genome'"
            title="Seed:"
            v-model:n="options.seed.value"
            :min="1"
            :max="1000"
          />
          <a
            v-if="options.inputType.value === 'genome'"
            class="dl"
            style="cursor: pointer"
            @click="downloadFastaFile([options.genome.value], 'genome.fa', 'Genome')"
            >💾 Download (FASTA)</a
          >
        </template>
      </Card>
      <Card v-if="options.inputType.value == 'genome'">
        <template #title>Result</template>
        <template #content>
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
          <p>Genome length: {{ options.genome.value.length }}</p>
          <p>Longest contig length: {{ longestContigLength }}</p>
        </template>
      </Card>
    </div>
    <div class="col-12 md:col-8">
      <Card v-if="options.inputType.value === 'genome'">
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
        <template #title
          >Contigs ({{ contigs.length }})<a
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
              <span v-if="index < contigs.length - 1"> · </span>
            </span>
          </div>
          <!-- <Textarea class="textarea" v-model="contigsString" rows="5" /> -->
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
          The graph is traversed (using depth first serach (DFS)) to find all possible paths for all
          nodes, known as contigs. These paths represent all possible sequences (candidate genomes)
          of DNA that can be assembled from the k-mers, but do not necessarily have to exist in
          nature.
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

.match {
  color: green;
  font-weight: bold;
}
</style>
