<template>
    <button class="btn"
            :class="buttonClasses"
            :disabled="disabled"
            @click="$emit('click')">
        <slot />
        <span v-if="arrow">→</span>
    </button>
</template>

<script setup>
    import { computed } from 'vue'

    const props = defineProps({
        variant: {
            type: String,
            default: 'primary'
        },
        full: {
            type: Boolean,
            default: false
        },
        disabled: {
            type: Boolean,
            default: false
        },
        arrow: {
            type: Boolean,
            default: false
        }
    })

    defineEmits(['click'])

    const buttonClasses = computed(() => [
        `btn-${props.variant}`,
        {
            'btn-full': props.full
        }
    ])
</script>

<!--
Brug af knapper    

    <AppButton arrow>
    Fortsæt træning
</AppButton>

<AppButton variant="dark" arrow>
    Login
</AppButton>

<AppButton variant="light" arrow>
    Upload indhold
</AppButton>
    
    -->