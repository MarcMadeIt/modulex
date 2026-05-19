<template>
    <div class="progress">
        <div class="progress-fill"
             :style="{ width: `${percentage}%` }"></div>
    </div>
</template>

<script setup>
    defineProps({
        percentage: {
            type: Number,
            required: true
        }
    })
</script>

<!--
Brug af bar

   <ProgressBar :percentage="40" />

    -->
