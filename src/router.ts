import { createRouter, createWebHistory } from 'vue-router'
import ReadsView from './views/ReadsView.vue'
import GenomeView from './views/GenomeView.vue'
import GenomesView from './views/GenomesView.vue'
import AboutView from './views/AboutView.vue'

const routes = [
  { path: '/', name: 'Reads', component: ReadsView },
  { path: '/genome', name: 'Genome', component: GenomeView },
  { path: '/genomes', name: 'Genomes', component: GenomesView },
  { path: '/about', name: 'About', component: AboutView }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

export default router
