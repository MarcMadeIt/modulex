<template>
    <div class="error-box">
        {{ message }}
    </div>
</template>

<script setup>defineProps({
  message: {
    type: String,
    default: 'Der skete en fejl. Prøv igen.'
  }
})</script>