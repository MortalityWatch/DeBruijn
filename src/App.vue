<template>
  <RouterView v-slot="{ Component }">
    <template v-if="Component">
      <div id="content">
        <component :is="Component"></component>
      </div>
    </template>
  </RouterView>
</template>
