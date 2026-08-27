(() => {
  "use strict";

  const Query = window.DomrfQuery;
  const form = document.querySelector("#query-form");
  const slugInput = document.querySelector("#geography-slug");
  const labelInput = document.querySelector("#geography-label");
  const generatedUrl = document.querySelector("#generated-url");
  const openUrl = document.querySelector("#open-url");
  const errorBox = document.querySelector("#form-error");
  const toast = document.querySelector("#toast");

  const roman = { 1: "I", 2: "II", 3: "III", 4: "IV" };

  function displayLabel(slug) {
    if (!slug) return "Вся Россия";
    const provided = labelInput.value.trim();
    if (provided) return provided;
    return slug.replace(/-/g, " ").replace(/^./, (letter) => letter.toLocaleUpperCase("ru-RU"));
  }

  function checkedTypes() {
    return [...form.querySelectorAll('input[name="object_type"]:checked')].map((input) => input.value);
  }

  function buildState() {
    const slug = Query.normalizeSlug(slugInput.value);
    const fromYear = Number(document.querySelector("#from-year").value);
    const fromQuarter = Number(document.querySelector("#from-quarter").value);
    const toYear = Number(document.querySelector("#to-year").value);
    const toQuarter = Number(document.querySelector("#to-quarter").value);
    const types = checkedTypes();
    const parking = document.querySelector("#parking").checked;
    const sourceUrl = Query.buildUrl({
      geographySlug: slug,
      fromYear,
      fromQuarter,
      toYear,
      toQuarter,
      objectTypes: types,
      parking,
    });

    return {
      geography_slug: slug,
      geography_label: displayLabel(slug),
      from_year: fromYear,
      from_quarter: fromQuarter,
      to_year: toYear,
      to_quarter: toQuarter,
      object_types: types,
      parking,
      source_url: sourceUrl,
    };
  }

  function exportDate() {
    return Query.exportDate();
  }

  function render() {
    try {
      const state = buildState();
      errorBox.hidden = true;
      generatedUrl.value = state.source_url;
      openUrl.href = state.source_url;
      document.querySelector("#summary-title").textContent = state.geography_label;
      document.querySelector("#summary-period").textContent = `${roman[state.from_quarter]} кв. ${state.from_year} — ${roman[state.to_quarter]} кв. ${state.to_year}`;
      document.querySelector("#summary-types").textContent = state.object_types.map((value) => value === "D006_1" ? "Жилой дом" : "Деловой центр").join(" · ");
      document.querySelector("#summary-parking").textContent = state.parking ? "Да" : "Неважно";
      const tableSlug = state.geography_slug || "all-russia";
      document.querySelector("#export-path").textContent = `exports/${exportDate()}/<run-id>/objects_nashdom_${tableSlug}_${exportDate()}.tsv`;
      localStorage.setItem("domrf-query", JSON.stringify(state));
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
      generatedUrl.value = "";
      openUrl.removeAttribute("href");
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }

  document.querySelectorAll(".preset").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".preset").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      slugInput.value = button.dataset.slug;
      labelInput.value = button.dataset.label;
      render();
    });
  });

  slugInput.addEventListener("input", () => {
    document.querySelectorAll(".preset").forEach((item) => item.classList.toggle("is-active", item.dataset.slug === Query.normalizeSlug(slugInput.value)));
  });
  form.addEventListener("input", render);
  form.addEventListener("change", render);

  document.querySelector("#copy-url").addEventListener("click", async () => {
    if (!generatedUrl.value) return;
    try {
      await navigator.clipboard.writeText(generatedUrl.value);
      showToast("Ссылка скопирована");
    } catch {
      generatedUrl.select();
      document.execCommand("copy");
      showToast("Ссылка скопирована");
    }
  });

  document.querySelector("#download-request").addEventListener("click", () => {
    try {
      const state = { schema_version: 1, export_date: exportDate(), ...buildState() };
      const payload = new Blob([`${JSON.stringify(state, null, 2)}\n`], { type: "application/json;charset=utf-8" });
      const anchor = document.createElement("a");
      anchor.href = URL.createObjectURL(payload);
      anchor.download = `domrf-request-${state.geography_slug || "all-russia"}-${state.export_date}.json`;
      anchor.click();
      URL.revokeObjectURL(anchor.href);
      showToast("Параметры скачаны");
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
    }
  });

  render();
})();
