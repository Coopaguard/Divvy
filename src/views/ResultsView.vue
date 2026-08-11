<script setup lang="ts">
// ResultsView — étape 4 : ce que chacun a avancé, puis la répartition
import ExpensesPieChart from '@/ui/components/ExpensesPieChart.vue'
import ExpensesSummary from '@/ui/components/ExpensesSummary.vue'
</script>

<template>
  <ExpensesSummary>
    <ExpensesPieChart />
  </ExpensesSummary>
</template>
