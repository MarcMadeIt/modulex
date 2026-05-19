<template>
    <div class="input-group">
        <label v-if="label" class="input-label">
            {{ label }}
        </label>

        <input class="input"
               :class="{ 'input-error': error }"
               :type="type"
               :placeholder="placeholder"
               :value="modelValue"
               @input="$emit('update:modelValue', $event.target.value)" />

        <p v-if="error" class="error-text">
            {{ error }}
        </p>
    </div>
</template>

<script setup>
defineProps({
  modelValue: String,
  label: String,
  placeholder: String,
  error: String,
  type: {
    type: String,
    default: 'text'
  }
})

defineEmits(['update:modelValue'])
</script>