const appHeader = document.getElementById("app-header");
const navEvents = document.getElementById("nav-events");
const navMyEvents = document.getElementById("nav-my-events");
const authSection = document.getElementById("auth-section");
const eventsSection = document.getElementById("events-section");
const myEventsSection = document.getElementById("my-events-section");
const eventsList = document.getElementById("events-list");
const filterCategorySelect = document.getElementById("filter-category");
const myEventsList = document.getElementById("my-events-list");
const globalMessage = document.getElementById("global-message");
const toastContainer = document.getElementById("toast-container");
const loginBtn = document.getElementById("login-btn");
const showLoginBtn = document.getElementById("show-login");
const showRegisterBtn = document.getElementById("show-register");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const logoutBtn = document.getElementById("logout-btn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginMessage = document.getElementById("login-message");
const registerBtn = document.getElementById("register-btn");
const registerEmailInput = document.getElementById("register-email");
const registerPasswordInput = document.getElementById("register-password");
const registerMessage = document.getElementById("register-message");
const userInfo = document.getElementById("user-info");
const toggleCreateEventBtn = document.getElementById("toggle-create-event");
const createEventFormBlock = document.getElementById("create-event-form-block");
const createEventBtn = document.getElementById("create-event-btn");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const dateInput = document.getElementById("date");
const locationInput = document.getElementById("location");
const categorySelect = document.getElementById("category-select");
const selectedCategoriesContainer = document.getElementById(
  "selected-categories",
);
const createMessage = document.getElementById("create-message");
const editEventDialog = document.getElementById("edit-event-dialog");
const editEventForm = document.getElementById("edit-event-form");
const editEventIdInput = document.getElementById("edit-event-id");
const editTitleInput = document.getElementById("edit-title");
const editDescriptionInput = document.getElementById("edit-description");
const editDateInput = document.getElementById("edit-date");
const editLocationInput = document.getElementById("edit-location");
const editEventCancelBtn = document.getElementById("edit-event-cancel");
const editEventSaveBtn = document.getElementById("edit-event-save");
const editCategorySelect = document.getElementById("edit-category-select");
const editSelectedCategoriesContainer = document.getElementById(
  "edit-selected-categories",
);
const editEventMessage = document.getElementById("edit-event-message");
const confirmModal = document.getElementById("confirm-modal");
const confirmTitleEl = document.getElementById("confirm-title");
const confirmMessageEl = document.getElementById("confirm-message");
const confirmYesBtn = document.getElementById("confirm-yes");
const confirmNoBtn = document.getElementById("confirm-no");
const TOAST_DURATION_MS = 4200;

/** AbortController del modal de confirmación actual (revoca listeners al cerrar o al reabrir). */
let confirmModalController = null;

/** Lista de categorías cargada desde la API (actualizada por fetchCategories). */
let appCategories = [];

/** Categorías elegidas en el formulario de crear evento (id + nombre). */
let selectedCategories = [];

/** Categorías del evento en el modal de edición (se sincronizan al guardar). */
let editSelectedCategories = [];

/**
 * Obtiene categorías desde el servidor, las guarda en appCategories y devuelve el arreglo.
 * @returns {Promise<Array>}
 */
function populateCategorySelectForCreate(categories = appCategories) {
  if (!categorySelect) return;
  categorySelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Seleccionar categoría";
  categorySelect.appendChild(placeholder);
  for (const category of categories) {
    const opt = document.createElement("option");
    opt.value = String(category.id);
    opt.textContent = category.name;
    categorySelect.appendChild(opt);
  }
  categorySelect.value = "";
}

function renderSelectedCategories() {
  if (!selectedCategoriesContainer) return;
  selectedCategoriesContainer.innerHTML = "";
  for (const cat of selectedCategories) {
    const chip = document.createElement("span");
    chip.className = "selected-category-chip";
    chip.dataset.categoryId = String(cat.id);
    chip.setAttribute("role", "listitem");

    const nameEl = document.createElement("span");
    nameEl.className = "selected-category-chip-label";
    nameEl.textContent = cat.name ?? "";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "selected-category-chip-remove";
    removeBtn.setAttribute("aria-label", `Quitar categoría ${cat.name ?? ""}`);
    removeBtn.textContent = "\u2715";
    const removeId = Number(cat.id);
    removeBtn.addEventListener("click", () => {
      selectedCategories = selectedCategories.filter(
        (c) => Number(c.id) !== removeId,
      );
      renderSelectedCategories();
    });

    chip.appendChild(nameEl);
    chip.appendChild(removeBtn);
    selectedCategoriesContainer.appendChild(chip);
  }
}

function populateFilterCategorySelect(categories = appCategories) {
  if (!filterCategorySelect) return;
  const previous = filterCategorySelect.value;
  filterCategorySelect.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "Todas";
  filterCategorySelect.appendChild(allOpt);
  for (const category of categories) {
    const opt = document.createElement("option");
    opt.value = String(category.id);
    opt.textContent = category.name;
    filterCategorySelect.appendChild(opt);
  }
  const valid = Array.from(filterCategorySelect.options).some(
    (o) => o.value === previous,
  );
  filterCategorySelect.value = valid ? previous : "";
}

/** IDs numéricos extraídos de `selectedCategories` para el body `{ categories: [...] }`. */
function getSelectedCategoryIds() {
  return selectedCategories
    .map((c) => Number(c.id))
    .filter((id) => !Number.isNaN(id));
}

function clearCategoriesSelect() {
  selectedCategories = [];
  renderSelectedCategories();
  if (categorySelect) categorySelect.value = "";
}

async function fetchCategories() {
  try {
    const res = await fetch("http://localhost:3000/api/categories");
    if (!res.ok) {
      console.error("fetchCategories: respuesta no OK", res.status);
      appCategories = [];
      populateCategorySelectForCreate();
      populateFilterCategorySelect();
      return appCategories;
    }
    const data = await res.json();
    appCategories = Array.isArray(data) ? data : [];
    populateCategorySelectForCreate();
    populateFilterCategorySelect();
    return appCategories;
  } catch (err) {
    console.error(err);
    appCategories = [];
    populateCategorySelectForCreate();
    populateFilterCategorySelect();
    return appCategories;
  }
}

function setAppHeaderVisible(visible) {
  if (appHeader) appHeader.style.display = visible ? "block" : "none";
}

setAppHeaderVisible(Boolean(localStorage.getItem("token")));

function closeConfirmModal() {
  setConfirmModalBusy(false);
  if (confirmModalController) {
    confirmModalController.abort();
    confirmModalController = null;
  }
  if (confirmModal) {
    confirmModal.classList.add("hidden");
    confirmModal.setAttribute("aria-hidden", "true");
  }
}

/**
 * Muestra el modal de confirmación con título y mensaje, y ejecuta `onConfirm` al pulsar Confirmar.
 * Los listeners anteriores se eliminan vía AbortController antes de registrar los nuevos.
 */
function showConfirmModal(title, message, onConfirm) {
  closeConfirmModal();
  if (!confirmModal || !confirmTitleEl || !confirmMessageEl) return;

  confirmTitleEl.textContent = title ?? "";
  confirmMessageEl.textContent = message ?? "";

  confirmModalController = new AbortController();
  const { signal } = confirmModalController;

  const handleConfirm = async () => {
    if (typeof onConfirm !== "function") {
      closeConfirmModal();
      return;
    }
    setConfirmModalBusy(true, "Procesando…");
    try {
      const result = onConfirm();
      if (result != null && typeof result.then === "function") {
        await result;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmModalBusy(false);
      closeConfirmModal();
    }
  };

  const handleCancel = () => {
    closeConfirmModal();
  };

  confirmYesBtn?.addEventListener("click", handleConfirm, { signal });
  confirmNoBtn?.addEventListener("click", handleCancel, { signal });

  const backdrop = confirmModal.querySelector(".confirm-modal-backdrop");
  backdrop?.addEventListener("click", handleCancel, { signal });

  confirmModal.classList.remove("hidden");
  confirmModal.setAttribute("aria-hidden", "false");
}

function checkAuth() {
  const token = localStorage.getItem("token");
  if (token) {
    setAppHeaderVisible(true);
    hideAllSections();
    eventsSection?.classList.remove("hidden");
    scrollToTop();
  } else {
    setAppHeaderVisible(false);
    hideAllSections();
    authSection?.classList.remove("hidden");
    showAuthForm("login");
    scrollToTop();
  }
  updateUserInfo();
}

function clearAllToasts() {
  toastContainer?.replaceChildren();
}

function showMessage(message, type) {
  const text = String(message ?? "").trim();
  if (!toastContainer || text === "") return;

  clearAllToasts();

  const variant = type === "success" ? "success" : "error";
  const toast = document.createElement("div");
  toast.className = `toast toast-${variant}`;
  toast.setAttribute("role", "status");
  toast.textContent = text;

  toastContainer.insertBefore(toast, toastContainer.firstChild);

  const dismiss = () => {
    toast.classList.add("toast-leaving");
    setTimeout(() => {
      toast.remove();
    }, 260);
  };

  const t = setTimeout(dismiss, TOAST_DURATION_MS);
  toast.addEventListener(
    "click",
    () => {
      clearTimeout(t);
      dismiss();
    },
    { once: true },
  );
}

/**
 * Estado de carga en un botón: texto alternativo y disabled hasta `loading === false`.
 * @param {HTMLButtonElement | null | undefined} button
 * @param {boolean} loading
 * @param {string} [loadingText]
 */
function setButtonLoading(button, loading, loadingText = "Cargando…") {
  if (!button) return;
  if (loading) {
    if (button.dataset.btnReadyText == null) {
      button.dataset.btnReadyText = button.textContent?.trim() || "";
    }
    button.disabled = true;
    button.textContent = loadingText;
    button.setAttribute("aria-busy", "true");
  } else {
    button.removeAttribute("aria-busy");
    button.disabled = false;
    if (button.dataset.btnReadyText != null) {
      button.textContent = button.dataset.btnReadyText;
      delete button.dataset.btnReadyText;
    }
  }
}

function setListActionButtonsDisabled(disabled) {
  document
    .querySelectorAll(
      "#events-list .event-actions button, #my-events-list .event-actions button",
    )
    .forEach((btn) => {
      btn.disabled = disabled;
    });
}

function setConfirmModalBusy(busy, loadingLabel = "Procesando…") {
  if (!confirmYesBtn || !confirmNoBtn) return;
  if (busy) {
    if (confirmYesBtn.dataset.btnReadyText == null) {
      confirmYesBtn.dataset.btnReadyText =
        confirmYesBtn.textContent?.trim() || "Confirmar";
    }
    confirmYesBtn.disabled = true;
    confirmNoBtn.disabled = true;
    confirmYesBtn.textContent = loadingLabel;
    confirmYesBtn.setAttribute("aria-busy", "true");
  } else {
    confirmYesBtn.removeAttribute("aria-busy");
    confirmNoBtn.disabled = false;
    confirmYesBtn.disabled = false;
    if (confirmYesBtn.dataset.btnReadyText != null) {
      confirmYesBtn.textContent = confirmYesBtn.dataset.btnReadyText;
      delete confirmYesBtn.dataset.btnReadyText;
    }
  }
}

function showLoadingFeedback(text) {
  if (!globalMessage) return;
  globalMessage.textContent = text;
  globalMessage.style.color = "";
  globalMessage.setAttribute("data-loading", "true");
}

function clearLoadingFeedback() {
  if (!globalMessage || !globalMessage.hasAttribute("data-loading")) return;
  globalMessage.removeAttribute("data-loading");
  globalMessage.textContent = "";
  globalMessage.style.color = "";
}

function clearMessages() {
  clearAllToasts();
  if (globalMessage) {
    globalMessage.textContent = "";
    globalMessage.removeAttribute("data-loading");
    globalMessage.style.color = "";
  }
  if (loginMessage) loginMessage.textContent = "";
  if (registerMessage) registerMessage.textContent = "";
  if (createMessage) createMessage.textContent = "";
  if (editEventMessage) editEventMessage.textContent = "";
}

function setGlobalControlsDisabled(disabled) {
  const buttons = [
    toggleCreateEventBtn,
    createEventBtn,
    logoutBtn,
    loginBtn,
    registerBtn,
    showLoginBtn,
    showRegisterBtn,
  ];
  for (const el of buttons) {
    if (el) el.disabled = disabled;
  }
  for (const el of [navEvents, navMyEvents]) {
    if (!el) continue;
    el.style.pointerEvents = disabled ? "none" : "";
    el.setAttribute("aria-disabled", disabled ? "true" : "false");
    if (disabled) el.classList.add("nav-link-disabled");
    else el.classList.remove("nav-link-disabled");
  }
  if (filterCategorySelect) filterCategorySelect.disabled = disabled;
  if (categorySelect) categorySelect.disabled = disabled;
  if (editCategorySelect) editCategorySelect.disabled = disabled;
  setListActionButtonsDisabled(disabled);
}

let uiBusyDepth = 0;

function beginUiBusy() {
  uiBusyDepth += 1;
  if (uiBusyDepth === 1) setGlobalControlsDisabled(true);
}

function endUiBusy() {
  uiBusyDepth = Math.max(0, uiBusyDepth - 1);
  if (uiBusyDepth === 0) setGlobalControlsDisabled(false);
}

function clearUiState() {
  clearMessages();
  if (eventsList) eventsList.innerHTML = "";
  if (myEventsList) myEventsList.innerHTML = "";
  if (emailInput) emailInput.value = "";
  if (passwordInput) passwordInput.value = "";
  if (registerEmailInput) registerEmailInput.value = "";
  if (registerPasswordInput) registerPasswordInput.value = "";
  if (titleInput) titleInput.value = "";
  if (descriptionInput) descriptionInput.value = "";
  if (dateInput) dateInput.value = "";
  if (locationInput) locationInput.value = "";
  clearCategoriesSelect();
  if (filterCategorySelect) filterCategorySelect.value = "";
  showAuthForm("login");
  if (createEventFormBlock) createEventFormBlock.style.display = "none";
  toggleCreateEventBtn?.setAttribute("aria-expanded", "false");
  if (editEventDialog?.open) editEventDialog.close();
  closeConfirmModal();
  uiBusyDepth = 0;
  setGlobalControlsDisabled(false);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showAuthForm(which) {
  if (which === "register") {
    loginForm?.classList.add("hidden");
    registerForm?.classList.remove("hidden");
  } else {
    loginForm?.classList.remove("hidden");
    registerForm?.classList.add("hidden");
  }
}

function hideAllSections() {
  authSection?.classList.add("hidden");
  eventsSection?.classList.add("hidden");
  myEventsSection?.classList.add("hidden");
}

function showAuth() {
  if (!authSection || !eventsSection || !myEventsSection) return;
  setAppHeaderVisible(false);
  hideAllSections();
  authSection.classList.remove("hidden");
  showAuthForm("login");
  scrollToTop();
}

function showEvents() {
  if (!authSection || !eventsSection || !myEventsSection) return;
  const token = localStorage.getItem("token");
  if (!token || !getUserFromToken()) {
    showAuth();
    showMessage("Inicia sesión para ver los eventos", "error");
    return;
  }
  setAppHeaderVisible(true);
  hideAllSections();
  eventsSection.classList.remove("hidden");
  scrollToTop();
}

function showMyEvents() {
  if (!authSection || !eventsSection || !myEventsSection) return;
  const token = localStorage.getItem("token");
  if (!token || !getUserFromToken()) {
    showAuth();
    showMessage("Inicia sesión para ver tus eventos", "error");
    return;
  }
  setAppHeaderVisible(true);
  hideAllSections();
  myEventsSection.classList.remove("hidden");
  scrollToTop();
}

function getUserFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    const payload = JSON.parse(atob(payloadBase64));
    return {
      id: payload.id,
      role: payload.role,
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

function applyCreateEventUiForRole() {
  const user = getUserFromToken();
  const isAdmin = user?.role === "admin";
  const panel = document.getElementById("create-event-panel");

  if (!panel || !toggleCreateEventBtn || !createEventFormBlock) return;

  if (isAdmin) {
    panel.classList.remove("hidden");
    toggleCreateEventBtn.classList.remove("hidden");
  } else {
    panel.classList.add("hidden");
    toggleCreateEventBtn.classList.add("hidden");
    createEventFormBlock.style.display = "none";
    toggleCreateEventBtn.setAttribute("aria-expanded", "false");
  }
}

function applyNavbarForRole() {
  const user = getUserFromToken();
  if (!navMyEvents) return;
  if (user?.role === "admin") {
    navMyEvents.style.display = "none";
  } else {
    navMyEvents.style.display = "";
  }
}

/** Asignación de categorías al crear evento: solo administradores. */
function applyCategoryManagementUiForRole() {
  const user = getUserFromToken();
  const isAdmin = user?.role === "admin";
  const categoryUi = document.getElementById("create-event-categories-ui");
  if (!categoryUi) return;
  if (isAdmin) {
    categoryUi.classList.remove("hidden");
  } else {
    categoryUi.classList.add("hidden");
    clearCategoriesSelect();
  }
}

function updateUserInfo() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      if (userInfo) userInfo.textContent = "Sin sesión";
      return;
    }

    let email = "";
    let idVal;
    let roleVal;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      email = typeof payload.email === "string" ? payload.email.trim() : "";
      idVal = payload.id;
      roleVal = payload.role;
    } catch (err) {
      console.error(err);
      if (userInfo) userInfo.textContent = "Sin sesión";
      return;
    }

    if (userInfo) {
      if (email) {
        userInfo.textContent = email;
      } else if (idVal != null) {
        userInfo.textContent = `Usuario #${idVal}`;
      } else if (roleVal) {
        userInfo.textContent = String(roleVal);
      } else {
        userInfo.textContent = "Sesión activa";
      }
    }
  } finally {
    applyCreateEventUiForRole();
    applyNavbarForRole();
    applyCategoryManagementUiForRole();
  }
}

function formatDate(dateString) {
  if (dateString == null || dateString === "") return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateForEditInput(value) {
  if (value == null || value === "") return "";
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function clearEditCategoryState() {
  editSelectedCategories = [];
  if (editSelectedCategoriesContainer) {
    editSelectedCategoriesContainer.innerHTML = "";
  }
  populateEditCategorySelect();
}

function populateEditCategorySelect() {
  if (!editCategorySelect) return;
  editCategorySelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Seleccionar categoría";
  editCategorySelect.appendChild(placeholder);
  for (const category of appCategories) {
    const opt = document.createElement("option");
    opt.value = String(category.id);
    opt.textContent = category.name;
    editCategorySelect.appendChild(opt);
  }
  editCategorySelect.value = "";
}

function renderEditSelectedCategories() {
  if (!editSelectedCategoriesContainer) return;
  editSelectedCategoriesContainer.innerHTML = "";
  for (const cat of editSelectedCategories) {
    const chip = document.createElement("span");
    chip.className = "selected-category-chip";
    chip.dataset.categoryId = String(cat.id);
    chip.setAttribute("role", "listitem");

    const nameEl = document.createElement("span");
    nameEl.className = "selected-category-chip-label";
    nameEl.textContent = cat.name ?? "";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "selected-category-chip-remove";
    removeBtn.setAttribute("aria-label", `Quitar categoría ${cat.name ?? ""}`);
    removeBtn.textContent = "\u2715";
    const removeId = Number(cat.id);
    removeBtn.addEventListener("click", () => {
      editSelectedCategories = editSelectedCategories.filter(
        (c) => Number(c.id) !== removeId,
      );
      renderEditSelectedCategories();
    });

    chip.appendChild(nameEl);
    chip.appendChild(removeBtn);
    editSelectedCategoriesContainer.appendChild(chip);
  }
}

function closeEditEventDialog() {
  if (editEventDialog?.open) editEventDialog.close();
  if (editEventMessage) {
    editEventMessage.textContent = "";
    editEventMessage.style.color = "";
  }
  clearEditCategoryState();
}

async function openEditEventDialog(eventId, triggerButton) {
  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("Inicia sesión para continuar", "error");
    return;
  }

  beginUiBusy();
  if (triggerButton) setButtonLoading(triggerButton, true, "Cargando…");
  try {
    const [getRes, catRes] = await Promise.all([
      fetch(`http://localhost:3000/api/events/${eventId}`),
      fetch(`http://localhost:3000/api/events/${eventId}/categories`),
    ]);
    const ev = await getRes.json().catch(() => ({}));
    if (!getRes.ok) {
      showMessage(
        ev?.message || ev?.error || "No se pudo cargar el evento",
        "error",
      );
      return;
    }

    let catList = [];
    if (catRes.ok) {
      const rows = await catRes.json().catch(() => []);
      catList = Array.isArray(rows) ? rows : [];
    }
    editSelectedCategories = catList
      .map((c) => ({
        id: Number(c.id),
        name: c.name ?? "",
      }))
      .filter((c) => !Number.isNaN(c.id));
    renderEditSelectedCategories();
    populateEditCategorySelect();

    if (editEventIdInput) editEventIdInput.value = String(eventId);
    if (editTitleInput) editTitleInput.value = ev.title ?? "";
    if (editDescriptionInput) editDescriptionInput.value = ev.description ?? "";
    if (editDateInput) editDateInput.value = formatDateForEditInput(ev.date);
    if (editLocationInput) editLocationInput.value = ev.location ?? "";
    if (editEventMessage) {
      editEventMessage.textContent = "";
      editEventMessage.style.color = "";
    }

    editEventDialog?.showModal();
  } catch (err) {
    console.error(err);
    showMessage("Error al cargar el evento", "error");
  } finally {
    if (triggerButton) setButtonLoading(triggerButton, false);
    endUiBusy();
  }
}

async function saveEditEventFromDialog() {
  if (!editEventForm?.checkValidity()) {
    editEventForm?.reportValidity();
    return;
  }

  const id = editEventIdInput?.value;
  const token = localStorage.getItem("token");
  if (!id || !token) {
    showMessage("Sesión o evento no válido", "error");
    return;
  }

  const body = {
    title: editTitleInput?.value?.trim() ?? "",
    description: editDescriptionInput?.value?.trim() ?? "",
    date: editDateInput?.value ?? "",
    location: editLocationInput?.value?.trim() ?? "",
  };

  beginUiBusy();
  if (editEventSaveBtn) setButtonLoading(editEventSaveBtn, true, "Guardando…");
  if (editEventCancelBtn) editEventCancelBtn.disabled = true;
  try {
    const putRes = await fetch(`http://localhost:3000/api/events/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await putRes.json().catch(() => ({}));
    if (!putRes.ok) {
      showMessage(
        data?.message || data?.error || "No se pudo guardar",
        "error",
      );
      return;
    }
    const categoryIds = editSelectedCategories
      .map((c) => Number(c.id))
      .filter((cid) => !Number.isNaN(cid));
    const syncRes = await fetch(
      `http://localhost:3000/api/events/${id}/categories`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categories: categoryIds }),
      },
    );
    const syncData = await syncRes.json().catch(() => ({}));
    if (!syncRes.ok) {
      showMessage(
        syncData?.message ||
          syncData?.error ||
          "Evento guardado; error al actualizar categorías",
        "error",
      );
      await fetchAndRenderEvents();
      return;
    }

    closeEditEventDialog();
    showMessage("Evento actualizado", "success");
    await fetchAndRenderEvents();
  } catch (err) {
    console.error(err);
    showMessage("Error al guardar", "error");
  } finally {
    if (editEventSaveBtn) setButtonLoading(editEventSaveBtn, false);
    if (editEventCancelBtn) editEventCancelBtn.disabled = false;
    endUiBusy();
  }
}

async function deleteEvent(eventId) {
  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("Inicia sesión para continuar", "error");
    return;
  }

  beginUiBusy();
  try {
    const res = await fetch(`http://localhost:3000/api/events/${eventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showMessage(
        data?.message || data?.error || "Error al eliminar evento",
        "error",
      );
      return;
    }

    showMessage("Evento eliminado", "success");
    await fetchAndRenderEvents();
  } catch (err) {
    console.error(err);
    showMessage("Error al eliminar evento", "error");
  } finally {
    endUiBusy();
  }
}

async function registerToEvent(eventId, triggerButton) {
  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("Inicia sesión para continuar", "error");
    return;
  }

  beginUiBusy();
  if (triggerButton) setButtonLoading(triggerButton, true, "Inscribiendo…");
  try {
    const res = await fetch("http://localhost:3000/api/registrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        event_id: eventId,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showMessage(
        data?.message || data?.error || "Error al inscribirse",
        "error",
      );
      return;
    }

    showMessage("Inscripción exitosa", "success");
    await fetchAndRenderEvents();
  } catch (err) {
    console.error(err);
    showMessage("Error al inscribirse", "error");
  } finally {
    if (triggerButton) setButtonLoading(triggerButton, false);
    endUiBusy();
  }
}

async function cancelRegistration(registrationId) {
  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("Inicia sesión para continuar", "error");
    return;
  }

  beginUiBusy();
  try {
    const res = await fetch(
      `http://localhost:3000/api/registrations/${registrationId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showMessage(
        data?.message || data?.error || "Error al cancelar inscripción",
        "error",
      );
      return;
    }

    showMessage("Inscripción cancelada", "success");
    await loadMyEvents();
  } catch (err) {
    console.error(err);
    showMessage("Error al cancelar inscripción", "error");
  } finally {
    endUiBusy();
  }
}

async function fetchEventCategories(eventId) {
  try {
    const res = await fetch(
      `http://localhost:3000/api/events/${eventId}/categories`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

function renderCategoryBadges(container, categories) {
  container.innerHTML = "";
  for (const category of categories) {
    const tag = document.createElement("span");
    tag.className = "category-badge";
    tag.textContent = category.name ?? "";
    container.appendChild(tag);
  }
}

async function fetchAndRenderEvents() {
  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("Inicia sesión para continuar", "error");
    return;
  }

  beginUiBusy();
  showLoadingFeedback("Cargando eventos…");
  if (eventsList) eventsList.innerHTML = "<p>Loading...</p>";

  try {
    const categoryFilter = filterCategorySelect?.value?.trim() ?? "";
    const eventsUrl =
      categoryFilter === ""
        ? "http://localhost:3000/api/events"
        : `http://localhost:3000/api/events?category=${encodeURIComponent(categoryFilter)}`;

    const res = await fetch(eventsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error("Error al cargar eventos", res.status, await res.text());
      if (eventsList) eventsList.innerHTML = "";
      showMessage("Error al cargar eventos", "error");
      return;
    }

    const events = await res.json();
    if (eventsList) eventsList.innerHTML = "";

    if (!Array.isArray(events) || events.length === 0) {
      if (eventsList) eventsList.innerHTML = "<p>No events found</p>";
      return;
    }

    const currentUser = getUserFromToken();
    const currentUserRole = currentUser?.role;

    const pendingCategoryRows = [];

    for (const event of events) {
      const row = document.createElement("div");
      row.className = "event-card";
      const title = document.createElement("div");
      title.className = "event-title";
      title.textContent = event.title ?? "(sin título)";
      const date = document.createElement("div");
      date.className = "event-meta";
      date.textContent = `Fecha: ${formatDate(event.date)}`;
      const location = document.createElement("div");
      location.className = "event-meta";
      location.textContent = `Ubicación: ${event.location ?? "-"}`;
      const description = document.createElement("div");
      description.className = "event-meta";
      description.textContent = `Descripción: ${event.description ?? "-"}`;
      const categoriesWrap = document.createElement("div");
      categoriesWrap.className = "event-categories";
      const actions = document.createElement("div");
      actions.className = "event-actions";
      row.appendChild(title);
      row.appendChild(date);
      row.appendChild(location);
      row.appendChild(description);
      row.appendChild(categoriesWrap);
      pendingCategoryRows.push({ eventId: event.id, el: categoriesWrap });

      if (currentUserRole === "user") {
        const registerBtnEl = document.createElement("button");
        registerBtnEl.type = "button";
        registerBtnEl.className = "btn btn-primary";
        registerBtnEl.textContent = "Inscribirme";
        registerBtnEl.onclick = (e) =>
          void registerToEvent(event.id, e.currentTarget);
        actions.appendChild(registerBtnEl);
      }

      if (currentUserRole === "admin") {
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "btn btn-secondary";
        editButton.textContent = "Editar";
        editButton.onclick = (e) =>
          void openEditEventDialog(event.id, e.currentTarget);
        actions.appendChild(editButton);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn btn-danger";
        deleteButton.textContent = "Eliminar";
        deleteButton.onclick = () =>
          showConfirmModal("Eliminar evento", "¿Estás seguro?", () =>
            deleteEvent(event.id),
          );
        actions.appendChild(deleteButton);
      }

      if (actions.childElementCount > 0) {
        row.appendChild(actions);
      }
      eventsList?.appendChild(row);
    }

    await Promise.all(
      pendingCategoryRows.map(async ({ eventId, el }) => {
        const categories = await fetchEventCategories(eventId);
        renderCategoryBadges(el, categories);
      }),
    );
  } finally {
    clearLoadingFeedback();
    endUiBusy();
  }
}

async function loadMyEvents() {
  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("Inicia sesión para continuar", "error");
    return;
  }

  const user = getUserFromToken();
  if (user?.role === "admin") {
    showMessage("Admins do not have event registrations", "error");
    if (myEventsList) myEventsList.innerHTML = "";
    return;
  }

  beginUiBusy();
  showLoadingFeedback("Cargando tus eventos…");
  if (myEventsList) myEventsList.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(
      "http://localhost:3000/api/registrations/my-events",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      console.error(
        "Error al cargar mis eventos",
        res.status,
        await res.text(),
      );
      if (myEventsList) myEventsList.innerHTML = "";
      showMessage("Error al cargar mis eventos", "error");
      return;
    }

    const events = await res.json();
    if (myEventsList) myEventsList.innerHTML = "";

    if (!Array.isArray(events) || events.length === 0) {
      if (myEventsList) myEventsList.innerHTML = "<p>No events found</p>";
      return;
    }

    const pendingCategoryRowsMy = [];

    for (const event of events) {
      const row = document.createElement("div");
      row.className = "event-card";
      const title = document.createElement("div");
      title.className = "event-title";
      title.textContent = event.title ?? "(sin título)";
      const date = document.createElement("div");
      date.className = "event-meta";
      date.textContent = `Fecha: ${formatDate(event.date)}`;
      const location = document.createElement("div");
      location.className = "event-meta";
      location.textContent = `Ubicación: ${event.location ?? "-"}`;
      const description = document.createElement("div");
      description.className = "event-meta";
      description.textContent = `Descripción: ${event.description ?? "-"}`;
      const categoriesWrap = document.createElement("div");
      categoriesWrap.className = "event-categories";
      const actions = document.createElement("div");
      actions.className = "event-actions";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-secondary";
      button.textContent = "Cancelar inscripción";
      button.onclick = () =>
        showConfirmModal("Cancelar inscripción", "¿Confirmás la acción?", () =>
          cancelRegistration(event.registration_id),
        );
      row.appendChild(title);
      row.appendChild(date);
      row.appendChild(location);
      row.appendChild(description);
      row.appendChild(categoriesWrap);
      pendingCategoryRowsMy.push({ eventId: event.id, el: categoriesWrap });
      actions.appendChild(button);
      row.appendChild(actions);
      myEventsList?.appendChild(row);
    }

    await Promise.all(
      pendingCategoryRowsMy.map(async ({ eventId, el }) => {
        const categories = await fetchEventCategories(eventId);
        renderCategoryBadges(el, categories);
      }),
    );
  } catch (err) {
    console.error(err);
    if (myEventsList) myEventsList.innerHTML = "";
    showMessage("Error al cargar mis eventos", "error");
  } finally {
    clearLoadingFeedback();
    endUiBusy();
  }
}

showLoginBtn?.addEventListener("click", () => {
  showAuthForm("login");
});

showRegisterBtn?.addEventListener("click", () => {
  showAuthForm("register");
});

toggleCreateEventBtn?.addEventListener("click", () => {
  if (!createEventFormBlock) return;
  const show = createEventFormBlock.style.display !== "block";
  createEventFormBlock.style.display = show ? "block" : "none";
  toggleCreateEventBtn?.setAttribute("aria-expanded", String(show));
});

editEventCancelBtn?.addEventListener("click", () => {
  closeEditEventDialog();
});

editEventForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  void saveEditEventFromDialog();
});

editEventDialog?.addEventListener("click", (e) => {
  if (e.target === editEventDialog) closeEditEventDialog();
});

loginBtn?.addEventListener("click", async () => {
  const email = emailInput?.value?.trim() ?? "";
  const password = passwordInput?.value ?? "";

  if (!email || !password) {
    showMessage("Email y contraseña son obligatorios", "error");
    return;
  }

  beginUiBusy();
  setButtonLoading(loginBtn, true, "Entrando…");
  try {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showMessage(data?.message || "Error al iniciar sesión", "error");
      return;
    }

    localStorage.setItem("token", data.token);
    showMessage("Sesión iniciada", "success");
    checkAuth();
    await fetchAndRenderEvents();
  } catch (err) {
    console.error(err);
    showMessage("Error al iniciar sesión", "error");
  } finally {
    setButtonLoading(loginBtn, false);
    endUiBusy();
  }
});

registerBtn?.addEventListener("click", async () => {
  const email = registerEmailInput?.value?.trim() ?? "";
  const password = registerPasswordInput?.value ?? "";

  beginUiBusy();
  setButtonLoading(registerBtn, true, "Registrando…");
  try {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showMessage(
        data?.message || data?.error || "No se pudo crear la cuenta",
        "error",
      );
      return;
    }

    showMessage("Cuenta creada correctamente", "success");
  } catch (err) {
    console.error(err);
    showMessage("Error al registrar la cuenta", "error");
  } finally {
    setButtonLoading(registerBtn, false);
    endUiBusy();
  }
});

navEvents?.addEventListener("click", async (e) => {
  e.preventDefault();
  showEvents();
  if (!localStorage.getItem("token")) return;
  try {
    await fetchAndRenderEvents();
  } catch (err) {
    console.error(err);
    showMessage("Error al cargar eventos", "error");
  }
});

navMyEvents?.addEventListener("click", async (e) => {
  e.preventDefault();
  showMyEvents();
  if (!localStorage.getItem("token")) return;
  try {
    await loadMyEvents();
  } catch (err) {
    console.error(err);
    showMessage("Error al cargar tus eventos", "error");
  }
});

filterCategorySelect?.addEventListener("change", () => {
  if (!localStorage.getItem("token")) return;
  void fetchAndRenderEvents().catch((err) => {
    console.error(err);
    showMessage("Error al cargar eventos", "error");
  });
});

categorySelect?.addEventListener("change", () => {
  const raw = categorySelect.value?.trim() ?? "";
  if (raw === "") return;
  const id = Number(raw);
  if (Number.isNaN(id)) {
    categorySelect.value = "";
    return;
  }
  if (selectedCategories.some((c) => c.id === id)) {
    categorySelect.value = "";
    return;
  }
  const cat = appCategories.find((c) => String(c.id) === raw);
  const name =
    cat?.name ?? categorySelect.selectedOptions[0]?.textContent?.trim() ?? "";
  selectedCategories.push({ id, name });
  categorySelect.value = "";
  renderSelectedCategories();
});

editCategorySelect?.addEventListener("change", () => {
  const raw = editCategorySelect.value?.trim() ?? "";
  if (raw === "") return;
  const id = Number(raw);
  if (Number.isNaN(id)) {
    editCategorySelect.value = "";
    return;
  }
  if (editSelectedCategories.some((c) => Number(c.id) === id)) {
    editCategorySelect.value = "";
    return;
  }
  const cat = appCategories.find((c) => String(c.id) === raw);
  const name =
    cat?.name ??
    editCategorySelect.selectedOptions[0]?.textContent?.trim() ??
    "";
  editSelectedCategories.push({ id, name });
  editCategorySelect.value = "";
  renderEditSelectedCategories();
});

logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("token");
  clearUiState();
  checkAuth();
  showMessage("Sesión cerrada", "success");
});

createEventBtn?.addEventListener("click", async () => {
  const title = titleInput?.value?.trim() ?? "";
  const description = descriptionInput?.value?.trim() ?? "";
  const date = dateInput?.value ?? "";
  const location = locationInput?.value?.trim() ?? "";
  const token = localStorage.getItem("token");

  if (!token) {
    showMessage("Inicia sesión para crear eventos", "error");
    return;
  }

  beginUiBusy();
  setButtonLoading(createEventBtn, true, "Creando…");
  try {
    const res = await fetch("http://localhost:3000/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description, date, location }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showMessage(
        data?.message || data?.error || "Error al crear evento",
        "error",
      );
      return;
    }

    const eventId = data?.id;
    const categoryIds = getSelectedCategoryIds();

    if (eventId != null && categoryIds.length > 0) {
      const catRes = await fetch(
        `http://localhost:3000/api/events/${eventId}/categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ categories: categoryIds }),
        },
      );
      const catData = await catRes.json().catch(() => ({}));
      if (!catRes.ok) {
        showMessage(
          catData?.message ||
            catData?.error ||
            "Evento creado; error al asignar categorías",
          "error",
        );
        if (titleInput) titleInput.value = "";
        if (descriptionInput) descriptionInput.value = "";
        if (dateInput) dateInput.value = "";
        if (locationInput) locationInput.value = "";
        await fetchAndRenderEvents();
        return;
      }
    }

    showMessage("Evento creado correctamente", "success");
    if (titleInput) titleInput.value = "";
    if (descriptionInput) descriptionInput.value = "";
    if (dateInput) dateInput.value = "";
    if (locationInput) locationInput.value = "";
    clearCategoriesSelect();

    await fetchAndRenderEvents();
  } catch (err) {
    console.error(err);
    showMessage("Error al crear evento", "error");
  } finally {
    setButtonLoading(createEventBtn, false);
    endUiBusy();
  }
});

checkAuth();
void fetchCategories().catch((err) => {
  console.error(err);
});
if (localStorage.getItem("token")) {
  fetchAndRenderEvents().catch((err) => {
    console.error(err);
    showMessage("Error al cargar eventos", "error");
  });
}
