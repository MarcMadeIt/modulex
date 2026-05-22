import { reactive } from "vue";
 
const API_URL = import.meta.env.VITE_API_URL;
 
const state = reactive({
  user: null,
  ready: false, // har vi tjekket /auth/me endnu?
});
 
export const auth = {
  state,
  get isLoggedIn() {
    return !!state.user;
  },
  get role() {
    return state.user?.role || null;
  },
  setUser(user) {
    state.user = user;
  },
  // Kaldes ved app-start: spørg serveren hvem vi er (cookien sendes automatisk)
  async fetchMe() {
    try {
      const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
      state.user = res.ok ? (await res.json()).user : null;
    } catch {
      state.user = null;
    } finally {
      state.ready = true;
    }
  },
  async logout() {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    state.user = null;
  },
};