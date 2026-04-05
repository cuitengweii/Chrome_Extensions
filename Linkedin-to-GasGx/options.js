import {
  COLLECTOR_SETTINGS_KEY,
  DEFAULT_COLLECTOR_SETTINGS,
  DEFAULT_PAGE_RULES,
  normalizeCollectorSettings
} from "./collector-settings.js";

const categoryOptionsInput = document.getElementById("categoryOptions");
const defaultCategorySelect = document.getElementById("defaultCategory");
const defaultPublisherInput = document.getElementById("defaultPublisher");
const saveButton = document.getElementById("saveSettings");
const resetButton = document.getElementById("resetSettings");
const statusNode = document.getElementById("status");
const ruleGroupsNode = document.getElementById("ruleGroups");
const customSelectStates = new WeakMap();

function arrayToMultiline(values) {
  return (values || []).join("\n");
}

function multilineToArray(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function setStatus(message) {
  statusNode.textContent = message;
}

function closeOpenCustomSelects(exceptWrapper) {
  document.querySelectorAll(".custom-select.is-open").forEach((wrapper) => {
    if (wrapper === exceptWrapper) return;
    wrapper.classList.remove("is-open");
    const trigger = wrapper.querySelector(".custom-select-trigger");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  });
}

function syncCustomSelect(select) {
  const state = customSelectStates.get(select);
  if (!state) return;
  const selectedOption = select.selectedOptions[0] || select.options[0];
  state.trigger.textContent = selectedOption ? selectedOption.textContent : "Select an option";
  state.wrapper.classList.toggle("is-disabled", select.disabled);
  state.trigger.disabled = select.disabled;
  state.menu.querySelectorAll(".custom-dropdown-item").forEach((item) => {
    item.classList.toggle("is-selected", item.dataset.value === select.value);
  });
}

function rebuildCustomSelectOptions(select) {
  const state = customSelectStates.get(select);
  if (!state) return;

  state.menu.innerHTML = "";
  Array.from(select.options).forEach((option) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "custom-dropdown-item";
    item.dataset.value = option.value;
    item.textContent = option.textContent;
    item.disabled = option.disabled;
    item.addEventListener("click", () => {
      if (option.disabled) return;
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      closeOpenCustomSelects();
      state.trigger.focus();
    });
    state.menu.appendChild(item);
  });

  syncCustomSelect(select);
}

function ensureCustomSelect(select) {
  if (customSelectStates.has(select)) {
    rebuildCustomSelectOptions(select);
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "custom-select";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "custom-select-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");

  const menu = document.createElement("div");
  menu.className = "custom-dropdown-menu";
  menu.setAttribute("role", "listbox");

  select.classList.add("native-select");
  const parent = select.parentNode;
  parent.insertBefore(wrapper, select);
  wrapper.appendChild(select);
  wrapper.appendChild(trigger);
  wrapper.appendChild(menu);

  customSelectStates.set(select, { wrapper, trigger, menu });

  trigger.addEventListener("click", () => {
    if (select.disabled) return;
    const willOpen = !wrapper.classList.contains("is-open");
    closeOpenCustomSelects(wrapper);
    wrapper.classList.toggle("is-open", willOpen);
    trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });

  trigger.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if (select.disabled) return;
    if (!wrapper.classList.contains("is-open")) {
      closeOpenCustomSelects(wrapper);
      wrapper.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    }
    const target = menu.querySelector(".custom-dropdown-item.is-selected") || menu.querySelector(".custom-dropdown-item");
    target?.focus();
  });

  menu.addEventListener("keydown", (event) => {
    const items = Array.from(menu.querySelectorAll(".custom-dropdown-item:not(:disabled)"));
    if (!items.length) return;
    const currentIndex = items.indexOf(document.activeElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = items[Math.min(currentIndex + 1, items.length - 1)] || items[0];
      next.focus();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const prev = items[Math.max(currentIndex - 1, 0)] || items[0];
      prev.focus();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeOpenCustomSelects();
      trigger.focus();
    }
  });

  select.addEventListener("change", () => {
    syncCustomSelect(select);
  });

  rebuildCustomSelectOptions(select);
}

function enhanceCustomSelects(root = document) {
  root.querySelectorAll("select").forEach((select) => ensureCustomSelect(select));
}

function populateDefaultCategoryOptions(categories, selectedValue) {
  defaultCategorySelect.innerHTML = "";
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    if (category === selectedValue) option.selected = true;
    defaultCategorySelect.appendChild(option);
  });
  ensureCustomSelect(defaultCategorySelect);
}

function buildRuleCard(rule, index) {
  const card = document.createElement("article");
  card.className = "rule-card";
  card.dataset.ruleId = rule.id;
  card.innerHTML = `
    <h3>${rule.label}</h3>
    <div class="rule-grid">
      <label>
        Rule Label
        <input data-field="label" type="text" value="${rule.label}">
      </label>
      <label>
        Path Prefixes
        <textarea data-field="pathnamePrefixes">${arrayToMultiline(rule.pathnamePrefixes)}</textarea>
      </label>
      <label class="full">
        Post Selectors
        <textarea data-field="postSelectors">${arrayToMultiline(rule.postSelectors)}</textarea>
      </label>
      <label class="full">
        Injection Host Selectors
        <textarea data-field="injectionHostSelectors">${arrayToMultiline(rule.injectionHostSelectors)}</textarea>
      </label>
      <label class="full">
        Action Bar Selectors
        <textarea data-field="actionBarSelectors">${arrayToMultiline(rule.actionBarSelectors)}</textarea>
      </label>
      <label class="full">
        Control Menu Trigger Selectors
        <textarea data-field="controlMenuTriggerSelectors">${arrayToMultiline(rule.controlMenuTriggerSelectors)}</textarea>
      </label>
      <label class="full">
        Copy Link Menu Item Selectors
        <textarea data-field="copyLinkMenuItemSelectors">${arrayToMultiline(rule.copyLinkMenuItemSelectors)}</textarea>
      </label>
      <label>
        Inject Mode
        <select data-field="injectMode">
          <option value="append_to_action_bar"${rule.injectMode === "append_to_action_bar" ? " selected" : ""}>append_to_action_bar</option>
          <option value="after_action_bar"${rule.injectMode === "after_action_bar" ? " selected" : ""}>after_action_bar</option>
        </select>
      </label>
      <label>
        Platform
        <input type="text" value="${rule.platform}" disabled>
      </label>
    </div>
  `;
  card.dataset.index = String(index);
  return card;
}

function renderRuleGroups(settings) {
  ruleGroupsNode.innerHTML = "";
  const grouped = settings.pageRules.reduce((accumulator, rule, index) => {
    const platform = rule.platform || "web";
    if (!accumulator.has(platform)) accumulator.set(platform, []);
    accumulator.get(platform).push({ rule, index });
    return accumulator;
  }, new Map());

  grouped.forEach((entries, platform) => {
    const section = document.createElement("section");
    section.className = "rule-group";
    const heading = document.createElement("div");
    heading.className = "panel";
    heading.innerHTML = `<h2>${platform === "linkedin" ? "LinkedIn" : platform === "x" ? "X" : platform}</h2>`;
    section.appendChild(heading);
    entries.forEach(({ rule, index }) => section.appendChild(buildRuleCard(rule, index)));
    ruleGroupsNode.appendChild(section);
  });
  enhanceCustomSelects(ruleGroupsNode);
}

function readSettingsFromForm() {
  const categories = multilineToArray(categoryOptionsInput.value);
  const pageRules = [];
  document.querySelectorAll(".rule-card").forEach((card) => {
    const index = Number(card.dataset.index || "-1");
    const baseRule = DEFAULT_PAGE_RULES[index] || DEFAULT_PAGE_RULES[0];
    pageRules.push({
      ...baseRule,
      id: card.dataset.ruleId || baseRule.id,
      platform: baseRule.platform,
      label: card.querySelector("[data-field='label']").value.trim(),
      pathnamePrefixes: multilineToArray(card.querySelector("[data-field='pathnamePrefixes']").value),
      postSelectors: multilineToArray(card.querySelector("[data-field='postSelectors']").value),
      injectionHostSelectors: multilineToArray(card.querySelector("[data-field='injectionHostSelectors']").value),
      actionBarSelectors: multilineToArray(card.querySelector("[data-field='actionBarSelectors']").value),
      controlMenuTriggerSelectors: multilineToArray(card.querySelector("[data-field='controlMenuTriggerSelectors']").value),
      copyLinkMenuItemSelectors: multilineToArray(card.querySelector("[data-field='copyLinkMenuItemSelectors']").value),
      injectMode: card.querySelector("[data-field='injectMode']").value
    });
  });

  return normalizeCollectorSettings({
    categoryOptions: categories,
    defaultCategory: defaultCategorySelect.value,
    defaultPublisher: defaultPublisherInput.value.trim(),
    pageRules
  });
}

function renderSettings(settings) {
  categoryOptionsInput.value = arrayToMultiline(settings.categoryOptions);
  populateDefaultCategoryOptions(settings.categoryOptions, settings.defaultCategory);
  defaultPublisherInput.value = settings.defaultPublisher;
  renderRuleGroups(settings);
  enhanceCustomSelects(document);
}

async function loadSettings() {
  const data = await chrome.storage.local.get([COLLECTOR_SETTINGS_KEY]);
  const settings = normalizeCollectorSettings(data[COLLECTOR_SETTINGS_KEY] || DEFAULT_COLLECTOR_SETTINGS);
  renderSettings(settings);
}

categoryOptionsInput.addEventListener("input", () => {
  const categories = multilineToArray(categoryOptionsInput.value);
  populateDefaultCategoryOptions(categories.length ? categories : DEFAULT_COLLECTOR_SETTINGS.categoryOptions, defaultCategorySelect.value);
});

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element) || event.target.closest(".custom-select")) return;
  closeOpenCustomSelects();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeOpenCustomSelects();
});

saveButton.addEventListener("click", async () => {
  const settings = readSettingsFromForm();
  await chrome.storage.local.set({ [COLLECTOR_SETTINGS_KEY]: settings });
  renderSettings(settings);
  setStatus("Settings saved.");
});

resetButton.addEventListener("click", async () => {
  const settings = normalizeCollectorSettings(DEFAULT_COLLECTOR_SETTINGS);
  await chrome.storage.local.set({ [COLLECTOR_SETTINGS_KEY]: settings });
  renderSettings(settings);
  setStatus("Defaults restored.");
});

loadSettings().catch((error) => {
  console.error("[GasGx Collector] Failed to load options", error);
  setStatus(`Failed to load settings: ${error.message}`);
});
