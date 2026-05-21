<template>
  <div class="admin-dashboard">

    <div class="admin-header">
      <div>
        <h1>Administration</h1>
        <p>Administrér brugere, kurser og se statistik.</p>
      </div>

      <AppButton class="create-course-btn">
        Opret kursus
      </AppButton>
    </div>

    <div class="stats-grid">
      <AppCard class="stat-card">

  <div class="card-icon">
    <Users :size="20" />
  </div>

  <p>AKTIVE PARTNERE</p>
  <h2>124</h2>

</AppCard>

      <AppCard class="stat-card">
        <div class="card-icon">
    <BookOpen :size="20" />
  </div>

        <p>AKTIVE KURSER</p>
        <h2>12</h2>
      </AppCard>

      <AppCard class="stat-card">
        <div class="card-icon">
    <TrendingUp :size="20" />
  </div>
        <p>NYE LEADS</p>
        <h2>8</h2>
      </AppCard>
    </div>

    <div class="partner-section">

      <h3 class="table-title">
  PARTNERE OG LEADS
</h3>

  <div class="table-header">
    <span>Partner</span>
    <span>Status</span>
    <span>Survey</span>
    <span>Handlinger</span>
  </div>

  <div
  class="partner-row"
  v-for="partner in partners"
  :key="partner.id"
>

  <div class="partner-info">
    <strong>{{ partner.name }}</strong>
    <p>{{ partner.company }}</p>
  </div>

  <span
  class="status"
  :class="partner.statusClass"
>
  {{ partner.status }}
</span>

  <AppButton class="survey-btn">
    SE SVAR
  </AppButton>

  <AppButton class="approve-btn">
    {{ partner.action }}
  </AppButton>
</div>

</div>

  </div>

  
</template>

<script setup>
import AppCard from '../../components/ui/AppCard.vue';
import AppButton from '../../components/ui/AppButton.vue';

import {
  Users,
  BookOpen,
  TrendingUp
} from "lucide-vue-next";

const partners = [
  {
    id: 1,
    name: "Søren Hansen",
    company: "Hansens Skilte",
    status: "Ikke godkendt",
    statusClass: "pending",
    action: "Godkend Partner",
  },

  {
    id: 2,
    name: "Maria Jensen",
    company: "Nordic Print",
    status: "I gang",
    statusClass: "active",
    action: "Tildel kurser",
  },

  {
    id: 3,
    name: "Lars Nielsen",
    company: "City Signs",
    status: "Fuldført",
    statusClass: "approved",
    action: "Se partner",
  },
];
  

</script>

<style scoped>
.admin-dashboard {
  padding: 40px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-header h1 {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 8px;
}

.admin-header p {
  color: #666;
}

.create-course-btn {
  background: #ff4d26;
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 40px;
}

.stat-card {
  background: white;
  border-radius: 18px;
  padding: 24px;
  min-height: 158px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  box-shadow: 0 8px 20px rgba(0,0,0,0.05);
}

.stat-card p {
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.stat-card h2 {
  font-size: 36px;
  font-weight: 700;
  margin: 0;
}

.partner-section {
  background: white;
  border-radius: 18px;
  padding: 24px;
  margin-top: 40px;

  box-shadow: 0 8px 20px rgba(0,0,0,0.05);
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  
  align-items: center;

  background: #f5f5f5;
  margin: 0px -24px;
  padding: 18px 24px;

  border-radius: 0px;

  font-size: 12px;
  font-weight: 700;

  text-transform: uppercase;

  color: #666;

  column-gap: 40px;
}

.partner-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;

  align-items: center;

  padding: 24px 0;

  border-bottom: 1px solid #f0f0f0;

  column-gap: 40px;
}

.partner-row:hover {
  background: #fafafa;
}

.partner-info strong {
  display: block;
  font-size: 14px;
  margin-bottom: 4px;
}

.partner-info p {
  font-size: 13px;
  color: #777;
}

.status {
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  text-transform: uppercase;
  justify-self: start;
}

.pending {
  color: #a855f7;
}

.active {
  color: #ff5b2e;
}

.approved {
  color: #22c55e;
}

.survey-btn {
  background: white;
  border: 1px solid #ddd;
  color: #444;
  padding: 10px 18px;
  border-radius: 10px;
  width: fit-content;
  height: fit-content;
  justify-self: start;
}

.approve-btn {
  background: #ff4d26;
  color: white;
  border: none;
  padding: 12px 18px;
  border-radius: 10px;
  font-weight: 600;
  width: fit-content;
  height: fit-content;
  justify-self: start;
}

.table-title {
  margin-bottom: 20px;
}

.card-icon {
  width: 42px;
  height: 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #f5f5f5;
  border-radius: 12px;

  margin-bottom: 18px;
}
</style>