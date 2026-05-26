<script setup>
import { computed, ref } from "vue";

import { createCourse } from "../../data/dummyCourseService.js";

const emit = defineEmits(["close"]);

const courseTitle = ref("");
const courseDescription = ref("");

const lessons = ref([
  {
    id: makeLocalId(),
    title: "",
    duration: "",
    materials: [],
  },
]);

function makeLocalId() {
  return Date.now() + Math.random();
}

function addLesson() {
  lessons.value.push({
    id: makeLocalId(),
    title: "",
    duration: "",
    materials: [],
  });
}

function removeLesson(lessonId) {
  lessons.value = lessons.value.filter((lesson) => lesson.id !== lessonId);
}

function addMaterial(lesson, type) {
  lesson.materials.push({
    id: makeLocalId(),
    type,
    title: "",
    youtubeUrl: "",
    file: null,
  });
}

function removeMaterial(lesson, materialId) {
  lesson.materials = lesson.materials.filter(
    (material) => material.id !== materialId,
  );
}

function moveMaterialUp(lesson, index) {
  if (index === 0) return;

  const materials = lesson.materials;
  const materialToMove = materials[index];

  materials.splice(index, 1);
  materials.splice(index - 1, 0, materialToMove);
}

function moveMaterialDown(lesson, index) {
  if (index === lesson.materials.length - 1) return;

  const materials = lesson.materials;
  const materialToMove = materials[index];

  materials.splice(index, 1);
  materials.splice(index + 1, 0, materialToMove);
}

function closeModal() {
  emit("close");
}
// gemmer også fileUrl og size, så PDF'en kan bruges både i backend og UI.
function handleFileUpload(event, material) {
  const file = event.target.files[0];

  if (!file) return;

  material.file = file;
  material.fileUrl = `/files/${file.name}`;
  material.size = formatFileSize(file);

  if (!material.title.trim()) {
    material.title = file.name;
  }

  event.target.value = "";
}

function getYoutubeEmbedUrl(url) {
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
}

function formatFileSize(file) {
  if (!file) return "";

  const sizeInKb = Math.round(file.size / 1024);

  if (sizeInKb < 1024) {
    return `${sizeInKb} KB`;
  }

  return `${(sizeInKb / 1024).toFixed(1)} MB`;
}

function isMaterialValid(material) {
  const hasTitle = material.title.trim() !== "";

  if (material.type === "video") {
    return hasTitle && getYoutubeEmbedUrl(material.youtubeUrl) !== "";
  }

  if (material.type === "pdf") {
    return hasTitle && material.file;
  }

  return false;
}

const isFormValid = computed(() => {
  const hasCourseTitle = courseTitle.value.trim() !== "";

  const hasValidLessons = lessons.value.every((lesson) => {
    const hasLessonTitle = lesson.title.trim() !== "";
    const hasDuration = lesson.duration.trim() !== "";
    const hasMaterials = lesson.materials.length > 0;
    const allMaterialsValid = lesson.materials.every((material) =>
      isMaterialValid(material),
    );

    return hasLessonTitle && hasDuration && hasMaterials && allMaterialsValid;
  });

  return hasCourseTitle && hasValidLessons;
});

function createNewCourse() {
  if (!isFormValid.value) return;

  const newCourse = {
    title: courseTitle.value.trim(),
    description: courseDescription.value.trim(),

    modules: lessons.value.map((lesson) => {
      return {
        title: lesson.title.trim(),
        description: "",
        duration: lesson.duration.trim(),

        materials: lesson.materials.map((material) => {
          if (material.type === "video") {
            return {
              type: "video",
              title: material.title.trim(),
              url: getYoutubeEmbedUrl(material.youtubeUrl),
              duration: lesson.duration.trim(),
            };
          }

          return {
            type: "pdf",
            title: material.title.trim(),
            fileUrl: `/files/${material.file.name}`,
            size: formatFileSize(material.file),
          };
        }),
      };
    }),
  };

  createCourse(newCourse);

  emit("close");
}
</script>

<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <header class="modal-header">
        <div>
          <h1>Opret nyt kursus</h1>
          <p>Definer kursusindhold og lektioner.</p>
        </div>

        <button class="modal-close" type="button" @click="closeModal">×</button>
      </header>

      <div class="modal-body">
        <section class="form-section">
          <h2 class="form-section-title">Kursus info</h2>

          <div class="form-group">
            <input
              v-model="courseTitle"
              class="input"
              type="text"
              placeholder="Kursus titel"
            />
          </div>

          <div class="form-group">
            <textarea
              v-model="courseDescription"
              class="input textarea"
              placeholder="Kort beskrivelse af kurset..."
            ></textarea>
          </div>
        </section>

        <section class="form-section">
          <h2 class="form-section-title">Lektioner / trin</h2>

          <article
            v-for="lesson in lessons"
            :key="lesson.id"
            class="lesson-card"
          >
            <div class="form-group">
              <label class="input-label">Titel på trin</label>

              <input
                v-model="lesson.title"
                class="input"
                type="text"
                placeholder="F.eks. Se video og læs guide"
              />
            </div>

            <div class="form-group">
              <label class="input-label">Varighed / omfang</label>

              <input
                v-model="lesson.duration"
                class="input"
                type="text"
                placeholder="F.eks. 12 min"
              />
            </div>

            <div class="lesson-materials-header">
              <div>
                <h3>Materialer til dette trin</h3>
                <p>Tilføj én eller flere videoer/PDF’er til samme trin.</p>
              </div>

              <div class="material-add-actions">
                <button
                  class="btn btn-light"
                  type="button"
                  @click="addMaterial(lesson, 'video')"
                >
                  + Video
                </button>

                <button
                  class="btn btn-light"
                  type="button"
                  @click="addMaterial(lesson, 'pdf')"
                >
                  + PDF
                </button>
              </div>
            </div>

            <div
              v-if="lesson.materials.length === 0"
              class="material-empty-state"
            >
              <strong>Ingen materialer endnu</strong>
              <p>
                Klik på + Video eller + PDF for at tilføje materiale til
                trinnet.
              </p>
            </div>

            <div
              v-for="(material, materialIndex) in lesson.materials"
              :key="material.id"
              class="material-card"
            >
              <div class="material-card-top">
                <div>
                  <strong>
                    {{ materialIndex + 1 }}.
                    {{ material.type === "video" ? "Video" : "PDF" }}
                  </strong>

                  <p>
                    {{ material.type === "video" ? "YouTube-link" : "PDF-fil" }}
                  </p>
                </div>

                <div class="material-order-actions">
                  <button
                    type="button"
                    :disabled="materialIndex === 0"
                    @click="moveMaterialUp(lesson, materialIndex)"
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    :disabled="materialIndex === lesson.materials.length - 1"
                    @click="moveMaterialDown(lesson, materialIndex)"
                  >
                    ↓
                  </button>

                  <button
                    type="button"
                    class="remove-material-btn"
                    @click="removeMaterial(lesson, material.id)"
                  >
                    Fjern
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="input-label">Titel på materiale</label>

                <input
                  v-model="material.title"
                  class="input"
                  type="text"
                  placeholder="F.eks. Introduktionsvideo eller produktguide"
                />
              </div>

              <div v-if="material.type === 'video'" class="form-group">
                <label class="input-label">YouTube-link</label>

                <input
                  v-model="material.youtubeUrl"
                  class="input"
                  type="url"
                  placeholder="Indsæt YouTube-link her..."
                />

                <div
                  v-if="getYoutubeEmbedUrl(material.youtubeUrl)"
                  class="video-preview"
                >
                  <iframe
                    :src="getYoutubeEmbedUrl(material.youtubeUrl)"
                    title="YouTube video preview"
                    frameborder="0"
                    allowfullscreen
                  ></iframe>
                </div>

                <div v-else class="upload-placeholder">
                  <span class="upload-icon">▶</span>
                  <strong>Indsæt et YouTube-link</strong>
                  <small>Videoen vises automatisk her</small>
                </div>
              </div>

              <div v-if="material.type === 'pdf'" class="form-group">
                <label class="input-label">PDF-fil</label>

                <label class="upload-placeholder">
                  <span class="upload-icon">↑</span>

                  <strong>
                    {{
                      material.file
                        ? material.file.name
                        : "Klik for at uploade PDF"
                    }}
                  </strong>

                  <small>
                    {{
                      material.file
                        ? formatFileSize(material.file)
                        : "Max 500MB"
                    }}
                  </small>

                  <input
                    type="file"
                    accept="application/pdf"
                    hidden
                    @change="handleFileUpload($event, material)"
                  />
                </label>
              </div>
            </div>

            <button
              v-if="lessons.length > 1"
              class="btn btn-text"
              type="button"
              @click="removeLesson(lesson.id)"
            >
              Fjern trin
            </button>
          </article>

          <button class="add-lesson-btn" type="button" @click="addLesson">
            + Tilføj trin til kursus
          </button>
        </section>
      </div>

      <footer class="modal-footer">
        <button class="btn btn-light" type="button" @click="closeModal">
          Annuller
        </button>

        <button
          class="btn btn-primary"
          type="button"
          :disabled="!isFormValid"
          @click="createNewCourse"
        >
          Opret kursus nu
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.lesson-materials-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin: 22px 0 14px;
}

.lesson-materials-header h3 {
  font-size: 15px;
  margin-bottom: 4px;
}

.lesson-materials-header p {
  color: #777;
  font-size: 13px;
}

.material-add-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.material-empty-state {
  border: 1px dashed #ddd;
  background: #fafafa;
  border-radius: 16px;
  padding: 22px;
  text-align: center;
  margin-bottom: 16px;
}

.material-empty-state strong {
  display: block;
  margin-bottom: 6px;
}

.material-empty-state p {
  color: #777;
  font-size: 13px;
}

.material-card {
  border: 1px solid #eee;
  background: #fafafa;
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 14px;
}

.material-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 14px;
}

.material-card-top strong {
  display: block;
  font-size: 13px;
  text-transform: uppercase;
  color: #ff4d26;
  margin-bottom: 4px;
}

.material-card-top p {
  color: #777;
  font-size: 12px;
}

.material-order-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.material-order-actions button {
  border: none;
  background: white;
  color: #222;
  border-radius: 8px;
  padding: 8px 10px;
  font-weight: 800;
  cursor: pointer;
}

.material-order-actions button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.remove-material-btn {
  color: #ff4d26 !important;
}
</style>
