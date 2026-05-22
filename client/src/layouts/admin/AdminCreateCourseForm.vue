<script setup>
    import { computed, ref } from "vue";

    import { createCourse } from "../../data/dummyCourseService.js";

    const emit = defineEmits(["close"]);

    const courseTitle = ref("");
    const courseDescription = ref("");

    const lessons = ref([
        {
            id: 1,
            title: "",
            contentType: "video",
            duration: "",
            youtubeUrl: "",
            pdfFile: null,
        },
    ]);

    const addLesson = () => {
        lessons.value.push({
            id: Date.now(),
            title: "",
            contentType: "video",
            duration: "",
            youtubeUrl: "",
            pdfFile: null,
        });
    };

    const removeLesson = (lessonId) => {
        lessons.value = lessons.value.filter((lesson) => lesson.id !== lessonId);
    };

    const closeModal = () => {
        emit("close");
    };

    const handlePdfUpload = (event, lesson) => {
        const file = event.target.files[0];

        if (!file) return;

        lesson.pdfFile = file;
    };

    const getYoutubeEmbedUrl = (url) => {
        if (!url) return "";

        let videoId = "";

        if (url.includes("youtube.com/watch?v=")) {
            videoId = url.split("v=")[1]?.split("&")[0];
        }

        if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1]?.split("?")[0];
        }

        if (url.includes("youtube.com/embed/")) {
            videoId = url.split("embed/")[1]?.split("?")[0];
        }

        return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    };

    const isFormValid = computed(() => {
        const hasCourseTitle = courseTitle.value.trim() !== "";

        const hasValidLessons = lessons.value.every((lesson) => {
            const hasTitle = lesson.title.trim() !== "";
            const hasDuration = lesson.duration.trim() !== "";

            if (lesson.contentType === "video") {
                return (
                    hasTitle &&
                    hasDuration &&
                    getYoutubeEmbedUrl(lesson.youtubeUrl) !== ""
                );
            }

            if (lesson.contentType === "pdf") {
                return hasTitle && hasDuration && lesson.pdfFile;
            }

            return false;
        });

        return hasCourseTitle && hasValidLessons;
    });

    const createNewCourse = () => {
        if (!isFormValid.value) return;

        const newCourse = {
            title: courseTitle.value.trim(),
            description: courseDescription.value.trim(),
            modules: lessons.value.map((lesson) => {
                const material =
                    lesson.contentType === "video"
                        ? {
                            type: "video",
                            title: lesson.title,
                            url: getYoutubeEmbedUrl(lesson.youtubeUrl),
                            duration: lesson.duration,
                        }
                        : {
                            type: "pdf",
                            title: lesson.title,
                            fileUrl: `/files/${lesson.pdfFile.name}`,
                            size: `${Math.round(lesson.pdfFile.size / 1024)} KB`,
                        };

                return {
                    title: lesson.title,
                    description: "",
                    materials: [material],
                };
            }),
        };

        createCourse(newCourse);

        emit("close");
    };
</script>

<template>
    <div class="modal-overlay">
        <div class="modal">
            <header class="modal-header">
                <div>
                    <h1>Opret nyt kursus</h1>
                    <p>Definer kursusindhold og lektioner.</p>
                </div>

                <button class="modal-close"
                        type="button"
                        @click="closeModal">
                    ×
                </button>
            </header>

            <div class="modal-body">
                <section class="form-section">
                    <h2 class="form-section-title">Kursus info</h2>

                    <div class="form-group">
                        <input v-model="courseTitle"
                               class="input"
                               type="text"
                               placeholder="Kursus titel" />
                    </div>

                    <div class="form-group">
                        <textarea v-model="courseDescription"
                                  class="input textarea"
                                  placeholder="Kort beskrivelse af kurset..."></textarea>
                    </div>
                </section>

                <section class="form-section">
                    <h2 class="form-section-title">Lektioner / trin</h2>

                    <article v-for="lesson in lessons"
                             :key="lesson.id"
                             class="lesson-card">
                        <div class="form-group">
                            <label class="input-label">Titel på trin</label>

                            <input v-model="lesson.title"
                                   class="input"
                                   type="text"
                                   placeholder="F.eks. Introduktion til systemet" />
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="input-label">Indholdstype</label>

                                <select v-model="lesson.contentType"
                                        class="input">
                                    <option value="video">Video</option>
                                    <option value="pdf">PDF</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="input-label">Varighed / omfang</label>

                                <input v-model="lesson.duration"
                                       class="input"
                                       type="text"
                                       placeholder="F.eks. 12 min" />
                            </div>
                        </div>

                        <div v-if="lesson.contentType === 'video'"
                             class="form-group">
                            <label class="input-label">YouTube-link</label>

                            <input v-model="lesson.youtubeUrl"
                                   class="input"
                                   type="url"
                                   placeholder="Indsæt YouTube-link her..." />

                            <div v-if="getYoutubeEmbedUrl(lesson.youtubeUrl)"
                                 class="video-preview">
                                <iframe :src="getYoutubeEmbedUrl(lesson.youtubeUrl)"
                                        title="YouTube video preview"
                                        frameborder="0"
                                        allowfullscreen></iframe>
                            </div>

                            <div v-else
                                 class="upload-placeholder">
                                <span class="upload-icon">▶</span>
                                <strong>Indsæt et YouTube-link</strong>
                                <small>Videoen vises automatisk her</small>
                            </div>
                        </div>

                        <div v-if="lesson.contentType === 'pdf'"
                             class="form-group">
                            <label class="input-label">Filvedhæftning</label>

                            <label class="upload-placeholder">
                                <span class="upload-icon">↑</span>

                                <strong>
                                    {{
                    lesson.pdfFile
                      ? lesson.pdfFile.name
                      : "Klik for at uploade PDF"
                                    }}
                                </strong>

                                <small>Max 500MB</small>

                                <input type="file"
                                       accept="application/pdf"
                                       hidden
                                       @change="handlePdfUpload($event, lesson)" />
                            </label>
                        </div>

                        <button v-if="lessons.length > 1"
                                class="btn btn-text"
                                type="button"
                                @click="removeLesson(lesson.id)">
                            Fjern trin
                        </button>
                    </article>

                    <button class="add-lesson-btn"
                            type="button"
                            @click="addLesson">
                        + Tilføj trin til kursus
                    </button>
                </section>
            </div>

            <footer class="modal-footer">
                <button class="btn btn-light"
                        type="button"
                        @click="closeModal">
                    Annuller
                </button>

                <button class="btn btn-primary"
                        type="button"
                        :disabled="!isFormValid"
                        @click="createNewCourse">
                    Opret kursus nu
                </button>
            </footer>
        </div>
    </div>
</template>