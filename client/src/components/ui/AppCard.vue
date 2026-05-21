<template>
    <article class="card" :class="{ 'card-dark': dark }">
        <slot />
    </article>
</template>

<script setup>
    defineProps({
        dark: {
            type: Boolean,
            default: false
        }
    })
</script>

<!--
Brug af card

   <h3 class="card-title">Intro til Modulex Systemer</h3>
  <p class="card-text">
    En grundlæggende gennemgang af vores systemer.
  </p>
</AppCard>

    -->
