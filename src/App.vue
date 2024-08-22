<script setup lang="ts">
import Menubar from 'primevue/menubar'

const items = [
  { icon: '䷉', label: 'Reads', to: '/' },
  { icon: '🧬', label: 'Genome', to: '/genome' },
  // { icon: '🧬🧬', label: 'Genomes', to: '/genomes' },
  { icon: '📖', label: 'About', to: '/about' }
]
</script>

<template>
  <a href="/"><h1>De Bruijn graph genome assembly</h1></a>
  <Menubar :model="items">
    <template #item="{ item }">
      <router-link class="flex items-center" :to="item.to">
        <span class="ml-2">{{ item.icon }}</span>
        <span class="ml-2">{{ item.label }}</span>
        <span
          v-if="item.shortcut"
          class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1"
          >{{ item.shortcut }}</span
        >
      </router-link>
    </template>
  </Menubar>
  <br />
  <RouterView v-slot="{ Component }">
    <template v-if="Component">
      <div id="content">
        <component :is="Component"></component>
      </div>
    </template>
  </RouterView>
</template>

<style>
.dl {
  font-size: 10pt;
  float: right;
}

.textarea {
  width: 100%;
}

.p-card,
.p-inputtext {
  margin-bottom: 10px;
}

.match {
  color: green;
  font-weight: bold;
}

.container {
  margin-bottom: 20px;
}
</style>
