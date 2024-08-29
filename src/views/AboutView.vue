<script setup lang="ts">
import Card from 'primevue/card'
</script>

<template>
  <Card>
    <template #title>About</template>
    <template #content>
      <p>
        This tool visualizes short read genome assembly using the De Bruijn graph algorithm. It
        showcases the theory behind the complex process of in-silico genome assembly, making it more
        accessible and understandable. This method was the primary method, that was used during the
        creation of the SARS-CoV-2 reference genome.
      </p>

      <h2>How the Algorithm Works</h2>
      <p>
        The De Bruijn graph algorithm is a widely used method for genome assembly, particularly used
        for handling short reads from sequencing technologies. Here's a step-by-step breakdown of
        the process:
      </p>

      <h3>1. Reads Splitting into k-mers:</h3>
      <p>
        The short genomic reads are divided into smaller, overlapping sequences of length (k), known
        as k-mers.
      </p>

      <h3>2. Constructing the Graph:</h3>
      <p>
        Each (k-1)-mer represents a node in the graph. Edges are created between nodes based on the
        k-mers. Specifically, an edge is formed from one (k-1)-mer to another if there is a k-mer
        that bridges them (i.e., the suffix of the first (k-1)-mer matches the prefix of the second
        (k-1)-mer).
      </p>

      <h3>3. Traversing the Graph:</h3>
      <p>
        The graph is traversed (using depth first serach (DFS)) to find all possible paths for all
        nodes, known as contigs. These paths represent all possible sequences (candidate genomes) of
        DNA that can be assembled from the k-mers, but do not necessarily have to exist in nature.
      </p>

      <h3>4. Result</h3>
      <p>
        The tool shows if the original sequence (i.e. that of a bacterium or virus) was found in the
        results (contigs) and if it matches the longest found contig.
      </p>

      <h2>Input Modes</h2>
      <p>The tool offers two input modes for flexibility:</p>
      <p></p>

      <h3>1. Reads Mode:</h3>
      <p>
        Users can define a list of genomic reads. This mode is suitable for working with sequencing
        data where the target genome is unknown and needs to be assembled from the provided reads.
      </p>

      <h3>2. Genome Mode:</h3>
      <p>
        Users can define a reference genome. Based on this reference, the tool generates reads with
        added random noise to simulate additional genomic material (bacterial, human, etc.). This
        mode is useful for testing the assembly process and understanding how other genetic material
        might impact the assembly.
      </p>

      <h2>Data Download</h2>
      <p>
        Reads and contigs can be downloaded in FASTA format for further bioinformatic processing.
      </p>

      <p>
        In summary, this tool provides a powerful way to visualize and understand the genome
        assembly process and its potential issues using the De Bruijn graph algorithm.
      </p>

      <h2>Aligning Reads against Genome or Contigs</h2>
      <p>
        You can align the reads against the genome or contigs using common bioinformatics tools.
      </p>
      <p>bowtie2-build genome.fa genome</p>
      <p>bowtie2 --no-unal -x genome -fU reads.fa| samtools sort -@ 7 -o temp.bam</p>
      <p>samtools index temp.bam</p>
      <p>samtools view genome.fa | awk '{printf "%-20s %-100s\n", $1, $10}' &&</p>
      <p>samtools view temp.bam | awk '{printf "%-20s %*s%s\n", $1, $4-1, "", $10}'</p>
      <h2>Open Source</h2>
      <p>
        The full code of this tool can be found at:
        <a target="_blank" href="https://github.com/MortalityWatch/DeBruijn">Source Code</a>
      </p>
    </template>
  </Card>
</template>
