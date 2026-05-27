<script setup>
import { computed, onMounted, ref } from "vue";
import {
  BookOpen,
  FileText,
  Library,
  Plus,
  Search,
  Video,
  X,
} from "lucide-vue-next";

const API_URL = import.meta.env.VITE_API_URL;

const emit = defineEmits(["close", "created"]);

const courseTitle = ref("");
const courseDescription = ref("");

const modules = ref([createEmptyModule()]);

const contentLibrary = ref([]);
const libraryStatus = ref("idle"); // idle | loading | loaded | error
const libraryError = ref("");

const openLibraryPickerFor = ref(null);
const librarySearch = ref("");

const isSubmitting = ref(false);
const submitError = ref("");

function makeLocalId() {
  return Date.now() + Math.random();
}

function createEmptyModule() {
  return {
    localId: makeLocalId(),
    title: "",
    duration: "",
    materials: [],
  };
}

function createManualMaterial(type) {
  return {
    localId: makeLocalId(),
    source: "manual",
    contentId: null,
    type,
    title: "",
    youtubeUrl: "",
    file: null,
    fileUrl: "",
    size: "",
  };
}

function createLibraryMaterial(content) {
  const isVideo = content.type === "youtube";

  return {
    localId: makeLocalId(),
    source: "library",
    contentId: content._id,
    type: isVideo ? "video" : "pdf",
    title: content.title,
    youtubeUrl: isVideo ? content.url : "",
    file: null,
    fileUrl: isVideo ? "" : content.url,
    size: "",
  };
}

async function loadLibrary() {
  if (libraryStatus.value === "loading" || libraryStatus.value === "loaded") {
    return;
  }

  libraryStatus.value = "loading";
  libraryError.value = "";

  try {
    const res = await fetch(`${API_URL}/admin/content`, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }

    const data = await res.json();
    contentLibrary.value = Array.isArray(data.content) ? data.content : [];
    libraryStatus.value = "loaded";
  } catch (error) {
    libraryStatus.value = "error";
    libraryError.value = "Kunne ikke hente content-biblioteket.";
    console.error("Failed to load content library", error);
  }
}

function addModule() {
  modules.value.push(createEmptyModule());
}

function removeModule(moduleId) {
  modules.value = modules.value.filter((module) => module.localId !== moduleId);
}

function moveModuleUp(index) {
  if (index === 0) return;
  const [module] = modules.value.splice(index, 1);
  modules.value.splice(index - 1, 0, module);
}

function moveModuleDown(index) {
  if (index === modules.value.length - 1) return;
  const [module] = modules.value.splice(index, 1);
  modules.value.splice(index + 1, 0, module);
}

function addManualMaterial(module, type) {
  module.materials.push(createManualMaterial(type));
  closeLibraryPicker();
}

function openLibraryPicker(module) {
  openLibraryPickerFor.value = module.localId;
  librarySearch.value = "";
  loadLibrary();
}

function closeLibraryPicker() {
  openLibraryPickerFor.value = null;
}

function addLibraryMaterial(module, content) {
  module.materials.push(createLibraryMaterial(content));
  closeLibraryPicker();
}

function removeMaterial(module, materialId) {
  module.materials = module.materials.filter(
    (material) => material.localId !== materialId,
  );
}

function moveMaterialUp(module, index) {
  if (index === 0) return;
  const [material] = module.materials.splice(index, 1);
  module.materials.splice(index - 1, 0, material);
}

function moveMaterialDown(module, index) {
  if (index === module.materials.length - 1) return;
  const [material] = module.materials.splice(index, 1);
  module.materials.splice(index + 1, 0, material);
}

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

  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  let videoId = "";

  if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("v=")[1]?.split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0];
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
}

function formatFileSize(file) {
  if (!file) return "";
  const sizeInKb = Math.round(file.size / 1024);
  if (sizeInKb < 1024) return `${sizeInKb} KB`;
  return `${(sizeInKb / 1024).toFixed(1)} MB`;
}

function isMaterialValid(material) {
  const hasTitle = material.title.trim() !== "";
  if (!hasTitle) return false;

  if (material.source === "library") {
    return true;
  }

  if (material.type === "video") {
    return getYoutubeEmbedUrl(material.youtubeUrl) !== "";
  }

  if (material.type === "pdf") {
    return Boolean(material.file);
  }

  return false;
}

const filteredLibrary = computed(() => {
  const query = librarySearch.value.trim().toLowerCase();
  if (!query) return contentLibrary.value;
  return contentLibrary.value.filter((item) => {
    return (
      item.title.toLowerCase().includes(query) ||
      (item.description || "").toLowerCase().includes(query) ||
      (item.category || "").toLowerCase().includes(query)
    );
  });
});

const isFormValid = computed(() => {
  if (!courseTitle.value.trim()) return false;
  if (modules.value.length === 0) return false;

  return modules.value.every((module) => {
    if (!module.title.trim()) return false;
    if (!module.duration.trim()) return false;
    if (module.materials.length === 0) return false;
    return module.materials.every(isMaterialValid);
  });
});

function closeModal() {
  if (isSubmitting.value) return;
  emit("close");
}

function parseDurationMinutes(value) {
  if (!value) return undefined;
  const match = String(value).match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function buildPayload() {
  return {
    title: courseTitle.value.trim(),
    description: courseDescription.value.trim(),
    modules: modules.value.map((module, moduleIndex) => {
      const expectedDuration = parseDurationMinutes(module.duration);

      return {
        title: module.title.trim(),
        description: "",
        order: moduleIndex + 1,
        duration: expectedDuration,
        materials: module.materials.map((material) => {
          // contentId sendes med når materialet kommer fra biblioteket.
          // Backend bruger den til at hente title/url live fra Content
          // ved read-time, så biblioteks-ændringer slår igennem på kurser.
          const contentId =
            material.source === "library" ? material.contentId : undefined;

          if (material.type === "video") {
            const url =
              material.source === "library"
                ? material.youtubeUrl
                : getYoutubeEmbedUrl(material.youtubeUrl);

            return {
              type: "youtube",
              title: material.title.trim(),
              url,
              expectedDuration,
              contentId,
            };
          }

          return {
            type: "pdf",
            title: material.title.trim(),
            url: material.fileUrl,
            expectedDuration,
            contentId,
          };
        }),
      };
    }),
  };
}

async function createNewCourse() {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  submitError.value = "";

  try {
    const res = await fetch(`${API_URL}/admin/courses`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Kunne ikke oprette kurset.");
    }

    const data = await res.json();
    emit("created", data.course);
    emit("close");
  } catch (err) {
    submitError.value = err.message || "Kunne ikke oprette kurset.";
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  loadLibrary();
});
</script>

<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <header class="modal-header">
        <div>
          <h1>Opret nyt kursus</h1>
          <p>Definer kursusindhold og moduler.</p>
        </div>

        <button class="modal-close" type="button" @click="closeModal">×</button>
      </header>

      <div class="modal-body">
        <section class="form-section">
          <h2 class="form-section-title">Kursus info</h2>

          <div class="form-group">
            <label class="input-label">Kursus titel <span class="required">*</span></label>
            <input
              v-model="courseTitle"
              class="input"
              type="text"
              placeholder="Kursus titel"
              required
            />
          </div>

          <div class="form-group">
            <label class="input-label">Beskrivelse <span class="required">*</span></label>
            <textarea
              v-model="courseDescription"
              class="input textarea"
              placeholder="Kort beskrivelse af kurset..."
              required
            ></textarea>
          </div>
        </section>

        <section class="form-section">
          <div class="section-heading">
            <h2 class="form-section-title">Moduler ({{ modules.length }})</h2>
            <p class="section-subtitle">
              Et kursus består af et eller flere moduler. Hvert modul indeholder
              et eller flere materialer.
            </p>
          </div>

          <article
            v-for="(module, moduleIndex) in modules"
            :key="module.localId"
            class="module-card"
          >
            <div class="module-card-top">
              <div class="module-card-meta">
                <span class="module-index">Modul {{ moduleIndex + 1 }}</span>
                <strong>{{ module.title || "Nyt modul" }}</strong>
                <small>{{ module.materials.length }} materiale(r)</small>
              </div>

              <div class="order-actions">
                <button
                  type="button"
                  :disabled="moduleIndex === 0"
                  title="Flyt op"
                  @click="moveModuleUp(moduleIndex)"
                >
                  ↑
                </button>

                <button
                  type="button"
                  :disabled="moduleIndex === modules.length - 1"
                  title="Flyt ned"
                  @click="moveModuleDown(moduleIndex)"
                >
                  ↓
                </button>

                <button
                  v-if="modules.length > 1"
                  type="button"
                  class="remove-btn"
                  title="Fjern modul"
                  @click="removeModule(module.localId)"
                >
                  <X :size="16" />
                </button>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="input-label">Titel på modul <span class="required">*</span></label>
                <input
                  v-model="module.title"
                  class="input"
                  type="text"
                  placeholder="F.eks. Velkommen til Modulex"
                  required
                />
              </div>

              <div class="form-group">
                <label class="input-label">Varighed <span class="required">*</span></label>
                <input
                  v-model="module.duration"
                  class="input"
                  type="text"
                  placeholder="F.eks. 12 min"
                  required
                />
              </div>
            </div>

            <div class="material-section">
              <div class="material-section-header">
                <div>
                  <h3>Materialer<span class="required"> *</span></h3>
                  <p>Vælg fra bibliotek eller tilføj manuelt.</p>
                </div>

                <div class="material-add-actions">
                  <button
                    class="btn btn-light"
                    type="button"
                    @click="openLibraryPicker(module)"
                  >
                    <Library :size="14" /> Fra bibliotek
                  </button>

                  <button
                    class="btn btn-light"
                    type="button"
                    @click="addManualMaterial(module, 'video')"
                  >
                    <Video :size="14" /> Ny video
                  </button>

                  <button
                    class="btn btn-light"
                    type="button"
                    @click="addManualMaterial(module, 'pdf')"
                  >
                    <FileText :size="14" /> Ny PDF
                  </button>
                </div>
              </div>

              <div
                v-if="openLibraryPickerFor === module.localId"
                class="library-picker"
              >
                <div class="library-picker-header">
                  <div class="library-search">
                    <Search :size="14" />
                    <input
                      v-model="librarySearch"
                      type="text"
                      placeholder="Søg titel, beskrivelse eller kategori..."
                    />
                  </div>

                  <button
                    type="button"
                    class="library-close"
                    @click="closeLibraryPicker"
                  >
                    <X :size="16" />
                  </button>
                </div>

                <div v-if="libraryStatus === 'loading'" class="library-state">
                  Henter content-bibliotek...
                </div>

                <div v-else-if="libraryStatus === 'error'" class="library-state error">
                  {{ libraryError }}
                  <button class="btn-text" type="button" @click="loadLibrary">
                    Prøv igen
                  </button>
                </div>

                <div
                  v-else-if="filteredLibrary.length === 0"
                  class="library-state"
                >
                  Ingen content matcher søgningen.
                </div>

                <ul v-else class="library-list">
                  <li
                    v-for="item in filteredLibrary"
                    :key="item._id"
                    class="library-item"
                    @click="addLibraryMaterial(module, item)"
                  >
                    <span class="library-item-icon">
                      <Video v-if="item.type === 'youtube'" :size="16" />
                      <FileText v-else :size="16" />
                    </span>

                    <div class="library-item-body">
                      <strong>{{ item.title }}</strong>
                      <small>
                        {{ item.type === "youtube" ? "Video" : "PDF" }}
                        <template v-if="item.category">
                          · {{ item.category }}
                        </template>
                      </small>
                    </div>

                    <Plus :size="16" />
                  </li>
                </ul>
              </div>

              <div
                v-if="module.materials.length === 0"
                class="material-empty-state"
              >
                <BookOpen :size="20" />
                <strong>Ingen materialer endnu</strong>
                <p>Tilføj mindst ét materiale for at oprette modulet.</p>
              </div>

              <div
                v-for="(material, materialIndex) in module.materials"
                :key="material.localId"
                class="material-card"
              >
                <div class="material-card-top">
                  <div class="material-card-meta">
                    <span class="material-type-badge" :data-type="material.type">
                      <Video v-if="material.type === 'video'" :size="12" />
                      <FileText v-else :size="12" />
                      {{ material.type === "video" ? "Video" : "PDF" }}
                    </span>

                    <span
                      class="material-source-badge"
                      :data-source="material.source"
                    >
                      {{ material.source === "library" ? "Fra bibliotek" : "Manuelt" }}
                    </span>
                  </div>

                  <div class="order-actions">
                    <button
                      type="button"
                      :disabled="materialIndex === 0"
                      @click="moveMaterialUp(module, materialIndex)"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      :disabled="materialIndex === module.materials.length - 1"
                      @click="moveMaterialDown(module, materialIndex)"
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      class="remove-btn"
                      @click="removeMaterial(module, material.localId)"
                    >
                      <X :size="16" />
                    </button>
                  </div>
                </div>

                <div class="form-group">
                  <label class="input-label">Titel på materiale <span class="required">*</span></label>
                  <input
                    v-model="material.title"
                    class="input"
                    type="text"
                    :disabled="material.source === 'library'"
                    placeholder="F.eks. Introduktionsvideo"
                    required
                  />
                </div>

                <div v-if="material.source === 'library'" class="library-ref">
                  Materialet er hentet fra biblioteket og opdateres automatisk
                  hvis det redigeres dér.
                </div>

                <template v-else>
                  <div v-if="material.type === 'video'" class="form-group">
                    <label class="input-label">YouTube-link <span class="required">*</span></label>
                    <input
                      v-model="material.youtubeUrl"
                      class="input"
                      type="url"
                      placeholder="Indsæt YouTube-link her..."
                      required
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
                    <label class="input-label">PDF-fil <span class="required">*</span></label>

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
                        required
                        @change="handleFileUpload($event, material)"
                      />
                    </label>
                  </div>
                </template>
              </div>
            </div>
          </article>

          <button class="add-lesson-btn" type="button" @click="addModule">
            <Plus :size="16" /> Tilføj nyt modul
          </button>
        </section>
      </div>

      <footer class="modal-footer">
        <p v-if="submitError" class="submit-error">{{ submitError }}</p>

        <div class="modal-footer-actions">
          <button
            class="btn btn-light"
            type="button"
            :disabled="isSubmitting"
            @click="closeModal"
          >
            Annuller
          </button>

          <button
            class="btn btn-primary"
            type="button"
            :disabled="!isFormValid || isSubmitting"
            @click="createNewCourse"
          >
            {{ isSubmitting ? "Opretter..." : "Opret kursus nu" }}
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.section-heading {
  margin-bottom: 16px;
}

.section-subtitle {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-top: 4px;
}

.module-card {
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-paper);
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 14px;
}

.module-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border-light);
}

.module-card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.module-card-meta strong {
  font-size: 15px;
}

.module-card-meta small {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.module-index {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-primary-orange);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: 14px;
  margin-bottom: 18px;
}

.order-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.order-actions button {
  border: none;
  background: var(--color-primary-ultralight);
  color: var(--color-text-primary);
  border-radius: 8px;
  padding: 8px 10px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.order-actions button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.remove-btn {
  color: var(--color-primary-orange) !important;
}

.material-section {
  margin-top: 6px;
}

.material-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.material-section-header h3 {
  font-size: 14px;
  margin-bottom: 2px;
}

.material-section-header p {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.material-add-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.material-add-actions .btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.library-picker {
  border: 1px solid var(--color-border-light);
  background: var(--color-primary-ultralight);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 14px;
}

.library-picker-header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.library-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-input-bg);
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 8px 12px;
  color: var(--color-text-secondary);
}

.library-search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  font-family: inherit;
  color: var(--color-text-primary);
}

.library-close {
  border: none;
  background: var(--color-bg-paper);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.library-state {
  padding: 18px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.library-state.error {
  color: var(--color-primary-orange);
}

.library-state .btn-text {
  border: none;
  background: transparent;
  color: var(--color-primary-orange);
  font-weight: 800;
  cursor: pointer;
  margin-left: 8px;
}

.library-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
}

.library-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-bg-paper);
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.library-item:hover {
  border-color: var(--color-primary-orange);
}

.library-item-icon {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-ultralight);
  border-radius: 8px;
  color: var(--color-primary-orange);
  flex-shrink: 0;
}

.library-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.library-item-body strong {
  font-size: 14px;
}

.library-item-body small {
  color: var(--color-text-secondary);
  font-size: 12px;
  text-transform: uppercase;
}

.material-empty-state {
  border: 1px dashed var(--color-border);
  background: var(--color-primary-ultralight);
  border-radius: 14px;
  padding: 22px;
  text-align: center;
  margin-bottom: 16px;
  color: var(--color-text-secondary);
}

.material-empty-state strong {
  display: block;
  margin: 6px 0 4px;
  color: var(--color-text-primary);
}

.material-empty-state p {
  font-size: 13px;
}

.material-card {
  border: 1px solid var(--color-border-light);
  background: var(--color-primary-ultralight);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}

.material-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.material-card-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.material-type-badge,
.material-source-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 8px;
  border-radius: 999px;
}

.material-type-badge[data-type="video"] {
  background: var(--color-light-orange);
  color: var(--color-primary-orange);
}

.material-type-badge[data-type="pdf"] {
  background: var(--color-primary-ultralight);
  color: var(--color-text-primary);
}

.material-source-badge[data-source="library"] {
  background: var(--color-light-green);
  color: var(--color-dark-green);
}

.material-source-badge[data-source="manual"] {
  background: var(--color-bg-paper);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-light);
}

.library-ref {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-bg-paper);
  border: 1px dashed var(--color-border-light);
  border-radius: 10px;
  padding: 10px 12px;
}

.add-lesson-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.modal-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  grid-template-columns: none;
}

.modal-footer-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.submit-error {
  color: var(--color-primary-orange);
  background: var(--color-light-orange);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
  margin: 0;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .material-section-header {
    align-items: flex-start;
  }
}

.required {
  color: var(--color-primary-orange);
  font-weight: 800;
  font-size: 1.5em;
}

.input-label{
  color: var(--color-text-primary);
  font-weight:800;
}
</style>
