<template>
    <div class="course-modal-overlay">
        <div class="course-modal">
            <header class="course-modal-header">
                <div>
                    <h2>
                        {{ mode === "duplicate" ? "Opret nyt kursus" : "Redigér kursus" }}
                    </h2>

                    <p>
                        {{
              mode === "duplicate"
                ? "Kurset er kopieret. Du kan rette indholdet før oprettelse."
                : "Redigér eksisterende indtastninger og lektioner."
                        }}
                    </p>
                </div>

                <button class="course-modal-close"
                        type="button"
                        @click="closeModal">
                    ×
                </button>
            </header>

            <div class="course-modal-body">
                <section class="form-section">
                    <h3>Kursus info</h3>

                    <input v-model="courseTitle"
                           class="input"
                           type="text"
                           placeholder="Kursus titel" />

                    <textarea v-model="courseDescription"
                              class="input textarea"
                              placeholder="Kursus beskrivelse"></textarea>
                </section>

                <section class="form-section">
                    <h3>Lektioner ({{ lessons.length }})</h3>

                    <div v-for="(lesson, lessonIndex) in lessons"
                         :key="lesson.localId"
                         class="lesson-edit-card">
                        <div class="lesson-edit-top">
                            <div>
                                <strong>{{ lessonIndex + 1 }}. {{ lesson.title || "Ny lektion" }}</strong>
                                <small>{{ lesson.materials.length }} materiale(r)</small>
                            </div>

                            <div class="lesson-order-actions">
                                <button type="button"
                                        :disabled="lessonIndex === 0"
                                        @click="moveLessonUp(lessonIndex)">
                                    ↑
                                </button>

                                <button type="button"
                                        :disabled="lessonIndex === lessons.length - 1"
                                        @click="moveLessonDown(lessonIndex)">
                                    ↓
                                </button>

                                <button type="button"
                                        class="remove-btn"
                                        @click="removeLesson(lesson.localId)">
                                    ×
                                </button>
                            </div>
                        </div>

                        <input v-model="lesson.title"
                               class="input"
                               type="text"
                               placeholder="Titel på lektion" />

                        <input v-model="lesson.duration"
                               class="input"
                               type="text"
                               placeholder="Varighed / omfang" />

                        <div class="material-header">
                            <div>
                                <strong>Materialer til denne lektion</strong>
                                <p>Tilføj PDF’er og videoer i den rækkefølge de skal ses.</p>
                            </div>

                            <div class="material-add-actions">
                                <button class="small-btn"
                                        type="button"
                                        @click="addMaterial(lesson, 'video')">
                                    + Video
                                </button>

                                <button class="small-btn"
                                        type="button"
                                        @click="addMaterial(lesson, 'pdf')">
                                    + PDF
                                </button>
                            </div>
                        </div>

                        <div v-for="(material, materialIndex) in lesson.materials"
                             :key="material.localId"
                             class="material-card">
                            <div class="material-card-top">
                                <strong>
                                    {{ materialIndex + 1 }}. {{ material.type === "video" ? "Video" : "PDF" }}
                                </strong>

                                <div class="material-order-actions">
                                    <button type="button"
                                            :disabled="materialIndex === 0"
                                            @click="moveMaterialUp(lesson, materialIndex)">
                                        ↑
                                    </button>

                                    <button type="button"
                                            :disabled="materialIndex === lesson.materials.length - 1"
                                            @click="moveMaterialDown(lesson, materialIndex)">
                                        ↓
                                    </button>

                                    <button class="remove-btn"
                                            type="button"
                                            @click="removeMaterial(lesson, material.localId)">
                                        Fjern
                                    </button>
                                </div>
                            </div>

                            <input v-model="material.title"
                                   class="input"
                                   type="text"
                                   placeholder="Titel på materiale" />

                            <input v-if="material.type === 'video'"
                                   v-model="material.url"
                                   class="input"
                                   type="url"
                                   placeholder="YouTube-link" />

                            <label v-if="material.type === 'pdf'"
                                   class="upload-box">
                                <strong>
                                    {{ material.fileName || "Klik for at uploade PDF" }}
                                </strong>

                                <small>{{ material.size || "PDF-fil" }}</small>

                                <input type="file"
                                       accept="application/pdf"
                                       hidden
                                       @change="handlePdfUpload($event, material)" />
                            </label>
                        </div>
                    </div>

                    <button class="add-lesson-btn"
                            type="button"
                            @click="addLesson">
                        + Tilføj lektion
                    </button>
                </section>
            </div>

            <footer class="course-modal-footer">
                <button class="footer-btn footer-btn-light"
                        type="button"
                        @click="closeModal">
                    Annuller
                </button>

                <button class="footer-btn footer-btn-dark"
                        type="button"
                        :disabled="!isFormValid"
                        @click="saveCourse">
                    {{ mode === "duplicate" ? "Opret kursus nu" : "Gem ændringer" }}
                </button>
            </footer>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from "vue";

import {
  createCourse,
  updateCourseWithLessons,
} from "../../data/dummyCourseService.js";

const props = defineProps({
  courseData: {
    type: Object,
    required: true,
  },
  mode: {
    type: String,
    default: "edit",
  },
});

const emit = defineEmits(["close", "saved"]);

const courseTitle = ref(
  props.mode === "duplicate"
    ? `${props.courseData.course.title} (Kopi)`
    : props.courseData.course.title
);

const courseDescription = ref(props.courseData.course.description);

const lessons = ref(
  props.courseData.modules.map((module) => {
    return {
      localId: makeLocalId(),
      _id: props.mode === "duplicate" ? null : module._id,
      title: module.title,
      description: module.description || "",
      duration: module.duration || "",
      materials: (module.materials || []).map((material) => {
        return {
          localId: makeLocalId(),
          type: material.type,
          title: material.title,
          url: material.url || "",
          fileUrl: material.fileUrl || "",
          fileName: material.fileUrl ? material.fileUrl.split("/").pop() : "",
          size: material.size || "",
        };
      }),
    };
  })
);

function makeLocalId() {
  return Date.now() + Math.random();
}

function closeModal() {
  emit("close");
}

function addLesson() {
  lessons.value.push({
    localId: makeLocalId(),
    _id: null,
    title: "",
    description: "",
    duration: "",
    materials: [],
  });
}

function removeLesson(lessonId) {
  lessons.value = lessons.value.filter((lesson) => lesson.localId !== lessonId);
}

function moveLessonUp(index) {
  if (index === 0) return;

  const lesson = lessons.value[index];

  lessons.value.splice(index, 1);
  lessons.value.splice(index - 1, 0, lesson);
}

function moveLessonDown(index) {
  if (index === lessons.value.length - 1) return;

  const lesson = lessons.value[index];

  lessons.value.splice(index, 1);
  lessons.value.splice(index + 1, 0, lesson);
}

function addMaterial(lesson, type) {
  lesson.materials.push({
    localId: makeLocalId(),
    type,
    title: "",
    url: "",
    fileUrl: "",
    fileName: "",
    size: "",
  });
}

function removeMaterial(lesson, materialId) {
  lesson.materials = lesson.materials.filter(
    (material) => material.localId !== materialId
  );
}

function moveMaterialUp(lesson, index) {
  if (index === 0) return;

  const material = lesson.materials[index];

  lesson.materials.splice(index, 1);
  lesson.materials.splice(index - 1, 0, material);
}

function moveMaterialDown(lesson, index) {
  if (index === lesson.materials.length - 1) return;

  const material = lesson.materials[index];

  lesson.materials.splice(index, 1);
  lesson.materials.splice(index + 1, 0, material);
}

function handlePdfUpload(event, material) {
  const file = event.target.files[0];

  if (!file) return;

  material.fileName = file.name;
  material.fileUrl = `/files/${file.name}`;
  material.size = `${Math.round(file.size / 1024)} KB`;

  if (!material.title) {
    material.title = file.name;
  }

  event.target.value = "";
}

function getYoutubeEmbedUrl(url) {
  if (!url) return "";

  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  let videoId = "";

  if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("v=")[1]?.split("&")[0];
  }

  if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0];
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

const isFormValid = computed(() => {
  if (!courseTitle.value.trim()) return false;

  return lessons.value.every((lesson) => {
    if (!lesson.title.trim()) return false;
    if (lesson.materials.length === 0) return false;

    return lesson.materials.every((material) => {
      if (!material.title.trim()) return false;

      if (material.type === "video") {
        return material.url.trim() !== "";
      }

      if (material.type === "pdf") {
        return material.fileUrl !== "";
      }

      return false;
    });
  });
});

function saveCourse() {
  if (!isFormValid.value) return;

  const payload = {
    title: courseTitle.value.trim(),
    description: courseDescription.value.trim(),
    modules: lessons.value.map((lesson) => {
      return {
        _id: lesson._id,
        title: lesson.title.trim(),
        description: lesson.description || "",
        duration: lesson.duration || "",
        materials: lesson.materials.map((material) => {
          if (material.type === "video") {
            return {
              type: "video",
              title: material.title.trim(),
              url: getYoutubeEmbedUrl(material.url),
              duration: lesson.duration || "",
            };
          }

          return {
            type: "pdf",
            title: material.title.trim(),
            fileUrl: material.fileUrl,
            size: material.size,
          };
        }),
      };
    }),
  };

  if (props.mode === "duplicate") {
    createCourse(payload);
  } else {
    updateCourseWithLessons(props.courseData.course._id, payload);
  }

  emit("saved");
}
</script>

<style scoped>
    .course-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 1200;
        background: rgba(0, 0, 0, 0.42);
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 32px;
    }

    .course-modal {
        width: 100%;
        max-width: 760px;
        max-height: 90vh;
        background: white;
        border-radius: 24px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .course-modal-header {
        padding: 32px 36px 22px;
        display: flex;
        justify-content: space-between;
    }

        .course-modal-header h2 {
            font-size: 24px;
            margin-bottom: 6px;
        }

        .course-modal-header p {
            color: #666;
        }

    .course-modal-close {
        border: none;
        background: transparent;
        font-size: 32px;
        color: #999;
        cursor: pointer;
    }

    .course-modal-body {
        padding: 28px 36px;
        overflow-y: auto;
        display: grid;
        gap: 30px;
    }

    .form-section h3 {
        color: #ff4d26;
        font-size: 13px;
        text-transform: uppercase;
        margin-bottom: 16px;
    }

    .input {
        width: 100%;
        border: none;
        background: #fafafa;
        border-radius: 14px;
        padding: 16px 18px;
        margin-bottom: 14px;
    }

    .textarea {
        min-height: 110px;
        resize: vertical;
    }

    .lesson-edit-card {
        background: #fafafa;
        border: 1px solid #eee;
        border-radius: 18px;
        padding: 18px;
        margin-bottom: 16px;
    }

    .lesson-edit-top,
    .material-card-top,
    .material-header {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: center;
        margin-bottom: 14px;
    }

        .lesson-edit-top small,
        .material-header p {
            display: block;
            color: #777;
            margin-top: 4px;
        }

    .lesson-order-actions,
    .material-order-actions,
    .material-add-actions {
        display: flex;
        gap: 8px;
    }

        .lesson-order-actions button,
        .material-order-actions button,
        .small-btn {
            border: none;
            background: white;
            border-radius: 9px;
            padding: 8px 10px;
            font-weight: 800;
            cursor: pointer;
        }

            .lesson-order-actions button:disabled,
            .material-order-actions button:disabled {
                opacity: 0.35;
                cursor: not-allowed;
            }

    .remove-btn {
        color: #ff4d26;
    }

    .material-card {
        background: white;
        border: 1px solid #eee;
        border-radius: 14px;
        padding: 16px;
        margin-bottom: 12px;
    }

    .upload-box {
        border: 1px dashed #ddd;
        background: #fafafa;
        border-radius: 14px;
        padding: 18px;
        display: grid;
        gap: 6px;
        cursor: pointer;
    }

        .upload-box small {
            color: #777;
        }

    .add-lesson-btn {
        width: 100%;
        border: 1px dashed #ddd;
        background: white;
        border-radius: 14px;
        padding: 16px;
        font-weight: 800;
        cursor: pointer;
    }

    .course-modal-footer {
        padding: 24px 36px 32px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        background: #fafafa;
    }

    .footer-btn {
        border: none;
        padding: 16px 20px;
        border-radius: 14px;
        font-weight: 800;
        cursor: pointer;
    }

    .footer-btn-light {
        background: white;
        border: 1px solid #eee;
    }

    .footer-btn-dark {
        background: #171717;
        color: white;
    }

    .footer-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }
</style>