<template>
    <div class="app-layout">
        <Sidebar />

        <main class="app-main">
            <div class="topbar">
                <div class="user-role">
                    <div class="user-icon">👥</div>

                    <div class="role-text">
                        Laura
                        <span>Partner</span>
                    </div>
                </div>
            </div>

            <section class="hero-card">
                <div>
                    <h1 class="hero-title">
                        Velkommen tilbage, <span>{{ companyName }}</span>
                    </h1>

                    <p>
                        Du er godt på vej til at blive Modulex certificeret partner.
                       
                    </p>

                    <AppButton arrow>
                        Fortsæt træning
                    </AppButton>
                </div>

                <div class="hero-boxes">
                    <div class="hero-box"></div>
                    <div class="hero-box"></div>
                    <div class="hero-box"></div>
                    <div class="hero-box"></div>
                    <div class="hero-box"></div>
                    <div class="hero-box"></div>
                    <div class="hero-box"></div>
                    <div class="hero-box"></div>
                </div>
            </section>

            <section class="dashboard-section">
                <h2>Dine kurser</h2>

                <div class="course-grid">
                    <AppCard v-for="course in courses"
                             :key="course.id">
                        <div class="card-header">
                            <div class="icon-box">
                                {{ course.icon }}
                            </div>

                            <span class="badge"
                                  :class="course.completed ? 'badge-success' : 'badge-muted'">
                                {{ course.completed ? 'Fuldført' : 'Ikke gennemført' }}
                            </span>
                        </div>

                        <h3 class="card-title">
                            {{ course.title }}
                        </h3>

                        <p class="card-text">
                            {{ course.description }}
                        </p>

                        <div class="card-actions">
                            <AppButton variant="text" arrow>
                                {{ course.completed ? 'Gense' : 'Start' }}
                            </AppButton>
                        </div>
                    </AppCard>
                </div>
            </section>

            <section class="dashboard-section">
                <h2>Status over gennemførte kurser</h2>

                <ProgressBar :percentage="progressPercentage" />

                <p class="progress-text">
                    <strong>{{ progressPercentage }}%</strong> gennemført
                </p>
            </section>
        </main>
    </div>
</template>

<script setup>
    import { computed } from 'vue'

    import Sidebar from '../components/layout/Sidebar.vue'
    import AppCard from '../components/ui/AppCard.vue'
    import AppButton from '../components/ui/AppButton.vue'
    import ProgressBar from '../components/ui/ProgressBar.vue'

    const companyName = 'company_name'

    const courses = [
        {
            id: 1,
            icon: '▣',
            title: 'Intro til Modulex Systemer',
            description: 'En grundlæggende gennemgang af vores skiltesystemer.',
            completed: true
        },
        {
            id: 2,
            icon: '▤',
            title: 'Intro til Modulex Systemer',
            description: 'En grundlæggende gennemgang af vores produktløsninger.',
            completed: false
        },
        {
            id: 3,
            icon: '▻',
            title: 'Intro til Modulex Systemer',
            description: 'En introduktion til design og udlevering.',
            completed: false
        }
    ]

    const progressPercentage = computed(() => {
        const completedCourses = courses.filter(course => course.completed).length

        return Math.round((completedCourses / courses.length) * 100)
    })
</script>