<template>
  <div class="base-card" :class="{ 'base-card--selected': selected, 'base-card--clickable': clickable }">
    <div v-if="$slots.icon" class="base-card__icon">
      <slot name="icon"></slot>
    </div>
    <div class="base-card__content">
      <h3 v-if="title" class="base-card__title">{{ title }}</h3>
      <p v-if="subtitle" class="base-card__subtitle">{{ subtitle }}</p>
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="base-card__footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  selected: {
    type: Boolean,
    default: false
  },
  clickable: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.base-card {
  background-color: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--content-padding);
  transition: all 0.2s ease;
}

.base-card--clickable {
  cursor: pointer;
}

.base-card--clickable:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.base-card--selected {
  border-color: var(--primary-color);
  background-color: rgba(79, 70, 229, 0.05);
}

.base-card__icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

.base-card__content {
  flex: 1;
}

.base-card__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--text-color);
}

.base-card__subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.base-card__footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}
</style>
