<script setup>
const companyName = 'company_name'

const courses = [
  {
    id: 1,
    title: 'Intro til Modulex Systemer',
    description: 'En grundlæggende gennemgang af vores skiltesystemer.',
    status: 'Fuldført',
    action: 'Gense'
  },
  {
    id: 2,
    title: 'Intro til Modulex Systemer',
    description: 'En grundlæggende gennemgang af vores produktløsninger.',
    status: 'Ikke gennemført',
    action: 'Fortsæt'
  },
  {
    id: 3,
    title: 'Intro til Modulex Systemer',
    description: 'En introduktion til design, opsætning og udlevering.',
    status: 'Ikke gennemført',
    action: 'Start'
  }
]
</script>

<template>
    <div class="app-layout">
        <aside class="sidebar">
            <div class="sidebar-logo">
                module<span class="logo-accent">x</span>
            </div>

            <nav class="sidebar-nav">
                <a href="#" class="sidebar-link sidebar-link-active">
                    <span>Dashboard</span>
                    <span>›</span>
                </a>

                <a href="#" class="sidebar-link">
                    <span>Kurser</span>
                    <span>›</span>
                </a>

                <a href="#" class="sidebar-link">
                    <span>Indstillinger</span>
                    <span>›</span>
                </a>
            </nav>

            <div class="sidebar-footer">
                <a href="#" class="sidebar-link">
                    <span>Log ud</span>
                </a>
            </div>
        </aside>

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
                        Færdiggør dine åbne moduler for at få adgang til bestillingsportalen.
                    </p>

                    <button class="btn btn-primary">
                        Fortsæt træning
                        <span>→</span>
                    </button>
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
                    <article v-for="course in courses"
                             :key="course.id"
                             class="card">
                        <div class="card-header">
                            <div class="icon-box">▣</div>

                            <span class="badge"
                                  :class="course.status === 'Fuldført'
                  ? 'badge-success'
                  : 'badge-muted'">
                                {{ course.status }}
                            </span>
                        </div>

                        <h3 class="card-title">
                            {{ course.title }}
                        </h3>

                        <p class="card-text">
                            {{ course.description }}
                        </p>

                        <div class="card-actions">
                            <button class="btn btn-text">
                                {{ course.action }} ›
                            </button>
                        </div>
                    </article>
                </div>
            </section>

            <section class="dashboard-section">
                <h2>Status over gennemførte kurser</h2>

                <div class="progress">
                    <div class="progress-fill" style="width: 33%"></div>
                </div>

                <p><strong>33%</strong> gennemført</p>
            </section>
        </main>
    </div>
</template>