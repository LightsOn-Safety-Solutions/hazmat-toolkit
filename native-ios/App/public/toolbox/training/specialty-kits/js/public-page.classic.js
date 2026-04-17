(function () {
  "use strict";

  const TABLE_NAME = "specialty_kits";
  const DEFAULT_US_VIEW = { center: [39.8283, -98.5795], zoom: 4 };

  const KIT_CATEGORY_OPTIONS = [
    "Leak Control Kit",
    "Plug and Patch Kit",
    "Overpack / Containment",
    "Transfer / Flare Kit",
    "Foam / Suppression Kit",
    "Decon Kit",
    "Air Monitoring Kit",
    "Rail Response Kit",
    "Pipeline Response Kit",
    "Waterway / Marine Spill Kit",
    "Battery / EV Incident Kit",
    "General Hazmat Response Kit",
    "Firefighting Specialty Kit"
  ];

  const KIT_TYPE_OPTIONS = [
    "Propane",
    "LNG",
    "Natural Gas",
    "Chlorine",
    "Ammonia",
    "Flammable Liquid",
    "Corrosive",
    "Oxidizer",
    "Cryogenic",
    "Railcar",
    "Cargo Tank",
    "Drum",
    "Cylinder",
    "Battery / EV",
    "Marine Spill"
  ];

  const HAZARD_FOCUS_OPTIONS = [
    "Flammable Gas",
    "Flammable Liquid",
    "Toxic Inhalation Hazard",
    "Corrosive Materials",
    "Cryogenic Materials",
    "Oxidizers",
    "Unknown Hazmat",
    "WMD / Terrorism",
    "Industrial Fire",
    "Lithium-Ion Battery"
  ];

  const EQUIPMENT_CAPABILITIES_OPTIONS = [
    "Leak Control",
    "Product Transfer",
    "Flaring",
    "Vapor Control",
    "Foam Application",
    "Decontamination",
    "Monitoring Support",
    "Plugging / Patching",
    "Overpacking",
    "Water Injection",
    "Tank Cooling Support"
  ];

  const DEPLOYMENT_TYPE_OPTIONS = [
    "Fixed Location",
    "Trailer-Based",
    "Vehicle-Mounted",
    "Cache / Warehouse",
    "Team-Deployed"
  ];

  const AVAILABILITY_STATUS_OPTIONS = [
    "Available 24/7",
    "Business Hours Only",
    "Call Ahead Required",
    "Limited Availability",
    "Temporarily Unavailable"
  ];

  const ACCESS_TYPE_OPTIONS = [
    "Mutual Aid",
    "Agency-Owned",
    "Private Company Approval Required",
    "Contractor Deployment Required",
    "Public Safety Request Required"
  ];

  const STORAGE_ENVIRONMENT_OPTIONS = [
    "Fire Station",
    "Training Center",
    "Industrial Facility",
    "Warehouse",
    "Trailer Yard",
    "Mobile Unit"
  ];

  const TRANSPORT_CAPABLE_OPTIONS = ["Yes", "No", "Depends on Request"];
  const RESPONSE_TEAM_INCLUDED_OPTIONS = ["Yes", "No", "Optional"];
  const TRAINING_REQUIRED_OPTIONS = ["Yes", "No", "Recommended"];

  const REGION_OPTIONS = [
    "Northeast",
    "Southeast",
    "Midwest",
    "South Central",
    "Mountain West",
    "Southwest",
    "West Coast",
    "Mid-Atlantic",
    "Great Plains"
  ];

  const STATE_OPTIONS = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
  ];

  function asTrimmedString(value) {
    return String(value ?? "").trim();
  }

  function toArray(value) {
    if (Array.isArray(value)) {
      return value.map((item) => asTrimmedString(item)).filter(Boolean);
    }
    if (typeof value === "string") {
      return value.split(",").map((item) => asTrimmedString(item)).filter(Boolean);
    }
    return [];
  }

  function escapeHtml(input) {
    return String(input ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function el(id) {
    return document.getElementById(id);
  }

  function buildSearchString(kit) {
    const parts = [
      kit.kitName,
      kit.organizationName,
      kit.contactName,
      kit.city,
      kit.state,
      kit.region,
      kit.kitCategory,
      (kit.kitTypes || []).join(" "),
      (kit.hazardFocus || []).join(" "),
      (kit.equipmentCapabilities || []).join(" "),
      kit.notes
    ];
    return parts.filter(Boolean).join(" ").toLowerCase();
  }

  function normalizeKitRecord(input) {
    const record = input || {};
    return {
      id: asTrimmedString(record.id),
      kitName: asTrimmedString(record.kitName || record.kit_name),
      organizationName: asTrimmedString(record.organizationName || record.organization_name),
      contactName: asTrimmedString(record.contactName || record.contact_name),
      phone: asTrimmedString(record.phone),
      secondaryPhone: asTrimmedString(record.secondaryPhone || record.secondary_phone),
      email: asTrimmedString(record.email),
      notes: asTrimmedString(record.notes),
      city: asTrimmedString(record.city),
      state: asTrimmedString(record.state).toUpperCase(),
      region: asTrimmedString(record.region),
      lat: Number.isFinite(Number(record.lat)) ? Number(record.lat) : null,
      lng: Number.isFinite(Number(record.lng)) ? Number(record.lng) : null,
      locationLabel: asTrimmedString(record.locationLabel || record.location_label),
      kitCategory: asTrimmedString(record.kitCategory || record.kit_category),
      kitTypes: toArray(record.kitTypes ?? record.kit_types),
      hazardFocus: toArray(record.hazardFocus ?? record.hazard_focus),
      equipmentCapabilities: toArray(record.equipmentCapabilities ?? record.equipment_capabilities),
      deploymentType: asTrimmedString(record.deploymentType || record.deployment_type),
      availabilityStatus: asTrimmedString(record.availabilityStatus || record.availability_status),
      accessType: asTrimmedString(record.accessType || record.access_type),
      storageEnvironment: asTrimmedString(record.storageEnvironment || record.storage_environment),
      transportCapable: asTrimmedString(record.transportCapable || record.transport_capable),
      responseTeamIncluded: asTrimmedString(record.responseTeamIncluded || record.response_team_included),
      trainingRequired: asTrimmedString(record.trainingRequired || record.training_required),
      recordStatus: asTrimmedString(record.recordStatus || record.record_status),
      visibility: asTrimmedString(record.visibility)
    };
  }

  function normalizeKitArray(records) {
    return (records || []).map((record) => normalizeKitRecord(record));
  }

  function kitMatchesFilters(kit, filterState) {
    const keyword = asTrimmedString(filterState.keyword).toLowerCase();
    if (keyword && !buildSearchString(kit).includes(keyword)) return false;

    if (filterState.kitCategory && kit.kitCategory !== filterState.kitCategory) return false;
    if (filterState.state && kit.state !== filterState.state) return false;
    if (filterState.region && kit.region !== filterState.region) return false;
    if (filterState.deploymentType && kit.deploymentType !== filterState.deploymentType) return false;
    if (filterState.availabilityStatus && kit.availabilityStatus !== filterState.availabilityStatus) return false;
    if (filterState.accessType && kit.accessType !== filterState.accessType) return false;
    if (filterState.storageEnvironment && kit.storageEnvironment !== filterState.storageEnvironment) return false;
    if (filterState.transportCapable && kit.transportCapable !== filterState.transportCapable) return false;
    if (filterState.responseTeamIncluded && kit.responseTeamIncluded !== filterState.responseTeamIncluded) return false;
    if (filterState.trainingRequired && kit.trainingRequired !== filterState.trainingRequired) return false;

    if (filterState.kitType.length && !kit.kitTypes.some((value) => filterState.kitType.includes(value))) return false;
    if (filterState.hazardFocus.length && !kit.hazardFocus.some((value) => filterState.hazardFocus.includes(value))) return false;
    if (filterState.equipmentCapabilities.length && !kit.equipmentCapabilities.some((value) => filterState.equipmentCapabilities.includes(value))) return false;

    return true;
  }

  function getFilteredKits(kits, filterState) {
    return (kits || []).filter((kit) => kitMatchesFilters(kit, filterState));
  }

  function resolveConfig() {
    const runtime = window.SPECIALTY_KITS_CONFIG || {};
    return {
      supabaseUrl: String(runtime.supabaseUrl || "").replace(/\/$/, ""),
      supabaseAnonKey: String(runtime.supabaseAnonKey || "")
    };
  }

  const config = resolveConfig();
  let supabaseClient;

  function hasSupabaseConfig() {
    return Boolean(config.supabaseUrl && config.supabaseAnonKey);
  }

  function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error("Supabase client SDK not loaded.");
    }
    if (!hasSupabaseConfig()) {
      throw new Error("Missing Supabase URL or anon key. Set window.SPECIALTY_KITS_CONFIG first.");
    }
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return supabaseClient;
  }

  if (!window.L) {
    throw new Error("Leaflet (window.L) is not available.");
  }

  const map = L.map("map", { zoomControl: true, minZoom: 3 }).setView(
    DEFAULT_US_VIEW.center,
    DEFAULT_US_VIEW.zoom
  );

  function attachResilientBaseMap(targetMap, onFallback) {
    let switched = false;
    let switchedToSecondary = false;
    let tileLoaded = false;
    let tileErrors = 0;

    const primary = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors"
    });

    function switchToFallback() {
      if (switched) {
        return;
      }
      switched = true;
      targetMap.removeLayer(primary);
      const fallbackLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20,
        subdomains: "abcd",
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
      }).addTo(targetMap);

      let fallbackLoaded = false;
      fallbackLayer.on("tileload", () => {
        fallbackLoaded = true;
      });

      window.setTimeout(() => {
        if (fallbackLoaded || switchedToSecondary) {
          return;
        }
        switchedToSecondary = true;
        targetMap.removeLayer(fallbackLayer);
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
          {
            maxZoom: 19,
            attribution: "Tiles &copy; Esri"
          }
        ).addTo(targetMap);
      }, 5000);

      onFallback();
    }

    primary.on("tileload", () => {
      tileLoaded = true;
      tileErrors = Math.max(0, tileErrors - 1);
    });

    primary.on("tileerror", () => {
      tileErrors += 1;
      if (tileErrors >= 8) {
        switchToFallback();
      }
    });

    primary.addTo(targetMap);

    window.setTimeout(() => {
      if (!tileLoaded) {
        switchToFallback();
      }
    }, 5000);
  }

  const pinIcon = L.divIcon({
    className: "",
    html: '<div class="pin"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  const state = { kits: [], filtered: [], markersById: new Map() };
  const ui = {
    status: el("status"),
    resultCount: el("resultCount"),
    items: el("items"),
    noResults: el("noResults"),
    search: el("filterQuery"),
    resetFilters: el("btnResetFilters"),
    centerUs: el("btnCenterUS"),
    filtersForm: el("filtersForm")
  };

  const filterDefs = {
    kitCategory: { options: KIT_CATEGORY_OPTIONS, type: "single" },
    kitType: { options: KIT_TYPE_OPTIONS, type: "multi" },
    hazardFocus: { options: HAZARD_FOCUS_OPTIONS, type: "multi" },
    equipmentCapabilities: { options: EQUIPMENT_CAPABILITIES_OPTIONS, type: "multi" },
    state: { options: STATE_OPTIONS, type: "single" },
    region: { options: REGION_OPTIONS, type: "single" },
    deploymentType: { options: DEPLOYMENT_TYPE_OPTIONS, type: "single" },
    availabilityStatus: { options: AVAILABILITY_STATUS_OPTIONS, type: "single" },
    accessType: { options: ACCESS_TYPE_OPTIONS, type: "single" },
    storageEnvironment: { options: STORAGE_ENVIRONMENT_OPTIONS, type: "single" },
    transportCapable: { options: TRANSPORT_CAPABLE_OPTIONS, type: "single" },
    responseTeamIncluded: { options: RESPONSE_TEAM_INCLUDED_OPTIONS, type: "single" },
    trainingRequired: { options: TRAINING_REQUIRED_OPTIONS, type: "single" }
  };

  function setStatus(message, klass) {
    if (!ui.status) return;
    ui.status.innerHTML = `<strong>Status:</strong> <span class="${escapeHtml(klass || "ok")}">${escapeHtml(message)}</span>`;
  }

  attachResilientBaseMap(map, () => {
    setStatus("Map tiles switched to backup provider.", "warn");
  });

  function popupHtml(kit) {
    const location = kit.locationLabel || (kit.city ? `${kit.city}, ${kit.state}` : "Location unavailable");
    return `
      <div class="popup">
        <h3>${escapeHtml(kit.kitName)}</h3>
        <div class="tagline">${escapeHtml(kit.organizationName || "Organization unspecified")}</div>
        ${kit.kitCategory ? `<div class="kv"><span>Category:</span> ${escapeHtml(kit.kitCategory)}</div>` : ""}
        ${kit.availabilityStatus ? `<div class="kv"><span>Availability:</span> ${escapeHtml(kit.availabilityStatus)}</div>` : ""}
        ${location ? `<div class="kv"><span>Location:</span> ${escapeHtml(location)}</div>` : ""}
      </div>
    `;
  }

  function clearMarkers() {
    state.markersById.forEach((marker) => map.removeLayer(marker));
    state.markersById.clear();
  }

  function renderMarkers() {
    clearMarkers();
    state.filtered.forEach((kit) => {
      if (!Number.isFinite(kit.lat) || !Number.isFinite(kit.lng)) return;
      const marker = L.marker([kit.lat, kit.lng], { icon: pinIcon }).addTo(map);
      marker.bindPopup(popupHtml(kit), { maxWidth: 560, keepInView: true });
      state.markersById.set(kit.id, marker);
    });

    const points = state.filtered
      .filter((kit) => Number.isFinite(kit.lat) && Number.isFinite(kit.lng))
      .map((kit) => [kit.lat, kit.lng]);

    if (points.length === 1) {
      map.setView(points[0], 7, { animate: true });
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [20, 20], maxZoom: 7 });
    } else {
      map.setView(DEFAULT_US_VIEW.center, DEFAULT_US_VIEW.zoom, { animate: true });
    }
  }

  function renderList() {
    if (!ui.items) return;
    ui.items.innerHTML = "";
    if (ui.noResults) {
      ui.noResults.hidden = state.filtered.length > 0;
    }

    state.filtered.forEach((kit) => {
      const item = document.createElement("div");
      item.className = "item";
      const subtitle = [kit.kitCategory || "General", kit.state || "Unspecified", kit.availabilityStatus || "Availability not listed"].join(" | ");
      item.innerHTML = `
        <div class="meta">
          <div class="name" title="${escapeHtml(kit.kitName)}">${escapeHtml(kit.kitName)}</div>
          <div class="small" title="${escapeHtml(subtitle)}">${escapeHtml(subtitle)}</div>
          <div class="small" title="${escapeHtml(kit.organizationName || "")}">${escapeHtml(kit.organizationName || "Organization unspecified")}</div>
        </div>
        <div class="miniActions">
          <button class="miniBtn" type="button" data-action="zoom" data-id="${escapeHtml(kit.id)}">Zoom</button>
        </div>
      `;
      ui.items.appendChild(item);
    });
  }

  function updateCount() {
    if (ui.resultCount) {
      ui.resultCount.textContent = `${state.filtered.length} of ${state.kits.length} kits`;
    }
  }

  function getFilterState() {
    const values = {
      keyword: asTrimmedString(ui.search?.value),
      kitCategory: "",
      kitType: [],
      hazardFocus: [],
      equipmentCapabilities: [],
      state: "",
      region: "",
      deploymentType: "",
      availabilityStatus: "",
      accessType: "",
      storageEnvironment: "",
      transportCapable: "",
      responseTeamIncluded: "",
      trainingRequired: ""
    };

    Object.keys(filterDefs).forEach((field) => {
      const def = filterDefs[field];
      if (def.type === "multi") {
        const checked = Array.from(ui.filtersForm.querySelectorAll(`input[name="${field}"]:checked`));
        values[field] = checked.map((input) => input.value);
      } else {
        const selectEl = ui.filtersForm.querySelector(`select[name="${field}"]`);
        values[field] = selectEl ? selectEl.value : "";
      }
    });

    return values;
  }

  function applyFilters() {
    state.filtered = getFilteredKits(state.kits, getFilterState());
    renderList();
    renderMarkers();
    updateCount();
    setStatus(`Loaded ${state.filtered.length} kit(s).`, state.filtered.length ? "ok" : "warn");
  }

  function buildFilterUI() {
    const multiMounts = {
      kitType: el("kitTypeOptions"),
      hazardFocus: el("hazardFocusOptions"),
      equipmentCapabilities: el("equipmentCapabilitiesOptions")
    };

    Object.keys(multiMounts).forEach((field) => {
      const container = multiMounts[field];
      if (!container) return;
      filterDefs[field].options.forEach((value) => {
        const label = document.createElement("label");
        label.className = "checkItem";
        label.innerHTML = `<input type="checkbox" name="${escapeHtml(field)}" value="${escapeHtml(value)}" /> <span>${escapeHtml(value)}</span>`;
        container.appendChild(label);
      });
    });

    const singleMap = {
      kitCategory: el("filterKitCategory"),
      state: el("filterState"),
      region: el("filterRegion"),
      deploymentType: el("filterDeploymentType"),
      availabilityStatus: el("filterAvailabilityStatus"),
      accessType: el("filterAccessType"),
      storageEnvironment: el("filterStorageEnvironment"),
      transportCapable: el("filterTransportCapable"),
      responseTeamIncluded: el("filterResponseTeamIncluded"),
      trainingRequired: el("filterTrainingRequired")
    };

    Object.entries(singleMap).forEach(([field, selectEl]) => {
      if (!selectEl) return;
      filterDefs[field].options.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        selectEl.appendChild(option);
      });
    });
  }

  async function loadApprovedKits() {
    if (!hasSupabaseConfig()) {
      setStatus("Supabase config missing. Configure window.SPECIALTY_KITS_CONFIG first.", "bad");
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("record_status", "approved")
        .eq("visibility", "public");
      if (error) throw error;
      state.kits = normalizeKitArray(data || []);
      applyFilters();
    } catch (error) {
      setStatus(`Error: ${error.message || "Load failed."}`, "bad");
    }
  }

  function bindEvents() {
    ui.search?.addEventListener("input", applyFilters);
    ui.filtersForm?.addEventListener("change", applyFilters);
    ui.resetFilters?.addEventListener("click", () => {
      ui.filtersForm?.reset();
      applyFilters();
    });
    ui.centerUs?.addEventListener("click", () => {
      map.setView(DEFAULT_US_VIEW.center, DEFAULT_US_VIEW.zoom, { animate: true });
    });
    ui.items?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action='zoom']");
      if (!button) return;
      const kit = state.kits.find((item) => item.id === button.getAttribute("data-id"));
      if (!kit || !Number.isFinite(kit.lat) || !Number.isFinite(kit.lng)) return;
      map.setView([kit.lat, kit.lng], 10, { animate: true });
      state.markersById.get(kit.id)?.openPopup();
    });
  }

  function init() {
    buildFilterUI();
    bindEvents();
    loadApprovedKits();
  }

  init();
})();
