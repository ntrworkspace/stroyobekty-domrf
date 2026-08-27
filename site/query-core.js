(function exposeDomrfQuery(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DomrfQuery = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  const BASE_URL = "https://наш.дом.рф";
  const STARTS = { 1: "01-01", 2: "04-01", 3: "07-01", 4: "10-01" };
  const ENDS = { 1: "03-31", 2: "06-30", 3: "09-30", 4: "12-31" };

  function normalizeSlug(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase("ru-RU")
      .replace(/^\/+|\/+$/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^0-9a-zа-яё-]+/gi, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "");
  }

  function buildUrl({ geographySlug = "", fromYear, fromQuarter, toYear, toQuarter, objectTypes, parking = false }) {
    const slug = normalizeSlug(geographySlug);
    const startYear = Number(fromYear);
    const startQuarter = Number(fromQuarter);
    const endYear = Number(toYear);
    const endQuarter = Number(toQuarter);
    const types = Array.isArray(objectTypes) ? objectTypes.filter(Boolean) : [];

    if (![startYear, endYear].every(Number.isInteger) || startYear < 2020 || startYear > 2040 || endYear < 2020 || endYear > 2040) {
      throw new Error("Проверьте годы начала и окончания периода.");
    }
    if (!STARTS[startQuarter] || !ENDS[endQuarter]) throw new Error("Проверьте выбранные кварталы.");
    if (startYear * 4 + startQuarter > endYear * 4 + endQuarter) {
      throw new Error("Начало периода не может быть позже окончания.");
    }
    if (!types.length) throw new Error("Выберите хотя бы один тип объекта.");

    const base = new URL(`/новостройки/строящиеся${slug ? `/${slug}` : ""}`, BASE_URL).toString();
    const params = [
      `fromQuarter=${encodeURIComponent(`${startYear}-${STARTS[startQuarter]}`)}`,
      `objTypeCd=${types.map((type) => encodeURIComponent(type)).join(":")}`,
    ];
    if (parking) params.push("parkingFlg=1");
    params.push(`toQuarter=${encodeURIComponent(`${endYear}-${ENDS[endQuarter]}`)}`);
    return `${base}?${params.join("&")}`;
  }

  function exportDate(value = new Date()) {
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Helsinki",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value);
  }

  return { normalizeSlug, buildUrl, exportDate };
});
