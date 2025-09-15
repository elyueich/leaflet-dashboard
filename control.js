document.addEventListener("DOMContentLoaded", () => {
  const menuToggleArea = document.getElementById("menu-toggle-area");
  const menuToggleIcon = document.getElementById("menu-toggle");
  const sideMenu = document.getElementById("sidemenu");
  const mainContent = document.getElementById("main-content");
  const menuItems = document.querySelectorAll(".sidemenu-item");
  const menuDivs = document.querySelectorAll(".menu-div");
  const closeButtons = document.querySelectorAll(".close-button");
  const geolocationBtn = document.getElementById("geolocation-btn");
  const fullscreenBtn = document.getElementById("fullscreen-btn");
  const transparencySlider = document.getElementById("transparency-slider");
  const tableIcons = document.querySelectorAll(".table-icon");
  const tableContent = document.getElementById("table-content");
  const legendaContainer = document.getElementById("legenda-container");
  const noLegendText = document.getElementById("no-legend-text");
  const filterInitialText = document.getElementById("filter-initial-text");
  const kecamatanFilterGroup = document.getElementById(
    "kecamatan-filter-group"
  );
  const kecamatanFilter = document.getElementById("kecamatan-filter");
  const desaFilterGroup = document.getElementById("desa-filter-group");
  const desaFilter = document.getElementById("desa-filter");
  const layerCheckboxes = document.querySelectorAll('input[name="overlay"]');
  const resetButton = document.getElementById("reset-filter-btn");

  // New elements for the visualization tab
  const visualisasiTabContainer = document.getElementById(
    "visualisasi-tab-container"
  );
  const visualisasiTabHeader = document.getElementById(
    "visualisasi-tab-header"
  );
  const visualisasiTabTitle = document.getElementById("visualisasi-tab-title");
  const visualisasiTabContent = document.getElementById(
    "visualisasi-tab-content"
  );
  const visualisasiTabCloseBtn = document.querySelector(
    ".visualisasi-tab-close-btn"
  );
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  // Initialize Leaflet map
  var map = L.map("map").setView([-8.65, 115.15], 11);

  // Define available basemaps
  var esriGrayCanvas = L.tileLayer.provider("Esri.WorldGrayCanvas");
  var osmLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  });

  var esriSatelitLayer = L.tileLayer.provider("Esri.WorldImagery");

  // Add default basemap to the map
  esriGrayCanvas.addTo(map);
  let currentBasemap = esriGrayCanvas;
  let geolocationLayer = null;

  // Variables to store GeoJSON layers and data
  let slrlnLayer = null;
  let waveLayer = null;
  let glglnLayer = null;
  let slplnLayer = null;
  let garisPantai2016Layer = null;
  let garisPantai2017Layer = null;
  let garisPantai2018Layer = null;
  let garisPantai2019Layer = null;
  let garisPantai2020Layer = null;
  let garisPantai2021Layer = null;
  let garisPantai2022Layer = null;
  let garisPantai2023Layer = null;
  let garisPantai2024Layer = null;

  const geojsonLayers = {
    slrln: null,
    waveln: null,
    glgln: null,
    slpln: null,
    "garis-pantai-2016": null,
    "garis-pantai-2017": null,
    "garis-pantai-2018": null,
    "garis-pantai-2019": null,
    "garis-pantai-2020": null,
    "garis-pantai-2021": null,
    "garis-pantai-2022": null,
    "garis-pantai-2023": null,
    "garis-pantai-2024": null,
  };
  const geojsonData = {};
  let activeGarisPantaiLayers = [];

  // Array to hold visualisasi data
  let visualisasiItems = [];
  let currentVisualisasiIndex = 0;

  // Keep track of the topmost overlay layer and an array of active layers
  let currentTopLayer = null;
  let activeLayers = [];

  // Adjust map size when layout changes
  const resizeObserver = new ResizeObserver(() => {
    map.invalidateSize();
  });
  resizeObserver.observe(mainContent);

  // Add event listener for menu toggle button
  menuToggleArea.addEventListener("click", () => {
    const isSideMenuVisible = sideMenu.classList.contains("show-sidemenu");

    if (isSideMenuVisible) {
      sideMenu.classList.remove("show-sidemenu");
      mainContent.classList.remove("pushed-by-sidemenu");
      // visualisasiTabContainer.classList.remove('pushed-by-sidemenu');
      menuToggleIcon.classList.remove("fa-arrow-left");
      menuToggleIcon.classList.add("fa-bars");

      // Sembunyikan semua menu div dan hapus status aktif saat side menu ditutup
      menuDivs.forEach((div) => div.classList.remove("show"));
      menuItems.forEach((item) => item.classList.remove("active"));
    } else {
      sideMenu.classList.add("show-sidemenu");
      mainContent.classList.add("pushed-by-sidemenu");
      // visualisasiTabContainer.classList.add('pushed-by-sidemenu');
      menuToggleIcon.classList.remove("fa-bars");
      menuToggleIcon.classList.add("fa-arrow-left");
    }
  });

  // Add event listener for each menu item in the side menu
  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetId = item.getAttribute("data-target");
      const targetDiv = document.getElementById(targetId);

      if (item.classList.contains("active")) {
        item.classList.remove("active");
        targetDiv.classList.remove("show");
      } else {
        menuItems.forEach((menuItem) => menuItem.classList.remove("active"));
        menuDivs.forEach((div) => div.classList.remove("show"));

        item.classList.add("active");
        targetDiv.classList.add("show");
      }
    });
  });

  // Add event listener for each close button
  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target-close");
      const targetDiv = document.getElementById(targetId);
      const correspondingMenuItem = document.querySelector(
        `.sidemenu-item[data-target="${targetId}"]`
      );

      targetDiv.classList.remove("show");
      if (correspondingMenuItem) {
        correspondingMenuItem.classList.remove("active");
      }
    });
  });

  // Add event listener for the new visualization tab close button
  visualisasiTabCloseBtn.addEventListener("click", () => {
    visualisasiTabContainer.style.display = "none";
    visualisasiItems = []; // Bersihkan array visualisasi saat tab ditutup
    currentVisualisasiIndex = 0;
  });

  // Add event listener for basemap controls
  const basemapControls = document.getElementById("basemap-controls");
  basemapControls.addEventListener("change", (e) => {
    const selectedBasemap = e.target.value;

    if (currentBasemap) {
      map.removeLayer(currentBasemap);
    }

    if (selectedBasemap === "osm") {
      osmLayer.addTo(map);
      currentBasemap = osmLayer;
    } else if (selectedBasemap === "esri-satelit") {
      esriSatelitLayer.addTo(map);
      currentBasemap = esriSatelitLayer;
    } else if (selectedBasemap === "esri-bw") {
      esriGrayCanvas.addTo(map);
      currentBasemap = esriGrayCanvas;
    }
  });

  // Fungsi untuk memperbarui legenda berdasarkan layer yang aktif
  function updateLegend() {
    legendaContainer.innerHTML = ""; // Bersihkan legenda yang ada

    let hasLegend = false;
    const kerentananLegends = [];
    const garisPantaiLegends = [];

    if (slrlnLayer && map.hasLayer(slrlnLayer)) {
      kerentananLegends.push({
        type: "single",
        title: "SLR Line",
        data: [
          {
            color: "#FFA500",
            text: "Garis Pantai dengan Tingkat Kerentanan Kenaikan Permukaan Air Laut",
          },
        ],
      });
    }

    if (waveLayer && map.hasLayer(waveLayer)) {
      kerentananLegends.push({
        type: "single",
        title: "WAVE Line",
        data: [
          {
            color: "#008000",
            text: "Garis Pantai dengan Tingkat Kerentanan Gelombang dan Arus",
          },
        ],
      });
    }

    if (glglnLayer && map.hasLayer(glglnLayer)) {
      const glglnData = [
        {
          color: "#008000",
          text: "Sangat Rendah (Batuan Vulkanik & Plutonik)",
        },
        {
          color: "#00ff00",
          text: "Rendah (Batuan Gunung Api & Sedimen Terkonsolidasi)",
        },
        {
          color: "#ffff00",
          text: "Sedang (Sedimen Terkonsolidasi & Alluvium)",
        },
        { color: "#ff9900", text: "Tinggi (Sedimen Terkonsolidasi)" },
        {
          color: "#ff0000",
          text: "Sangat Tinggi (Sedimen Tak Terkonsolidasi)",
        },
      ];
      kerentananLegends.push({
        type: "multiple",
        title: "GLG Line (Geologi)",
        data: glglnData,
      });
    }

    if (slplnLayer && map.hasLayer(slplnLayer)) {
      const slplnData = [
        { color: "#008000", text: "Sangat Rendah (> 12%)" },
        { color: "#00ff00", text: "Rendah (9-12%)" },
        { color: "#ffff00", text: "Sedang (6-9%)" },
        { color: "#ff9900", text: "Tinggi (3-6%)" },
        { color: "#ff0000", text: "Sangat Tinggi (< 3%)" },
      ];
      kerentananLegends.push({
        type: "multiple",
        title: "SLP Line (Lereng Pantai)",
        data: slplnData,
      });
    }

    if (garisPantai2016Layer && map.hasLayer(garisPantai2016Layer)) {
      garisPantaiLegends.push({ color: "blue", text: "Garis Pantai 2016" });
    }

    if (garisPantai2017Layer && map.hasLayer(garisPantai2017Layer)) {
      garisPantaiLegends.push({ color: "red", text: "Garis Pantai 2017" });
    }

    if (garisPantai2018Layer && map.hasLayer(garisPantai2018Layer)) {
      garisPantaiLegends.push({ color: "#800080", text: "Garis Pantai 2018" });
    }

    if (garisPantai2019Layer && map.hasLayer(garisPantai2019Layer)) {
      garisPantaiLegends.push({ color: "#FFA500", text: "Garis Pantai 2019" });
    }

    if (garisPantai2020Layer && map.hasLayer(garisPantai2020Layer)) {
      garisPantaiLegends.push({ color: "#008080", text: "Garis Pantai 2020" });
    }

    if (garisPantai2021Layer && map.hasLayer(garisPantai2021Layer)) {
      garisPantaiLegends.push({ color: "#A52A2A", text: "Garis Pantai 2021" });
    }

    if (garisPantai2022Layer && map.hasLayer(garisPantai2022Layer)) {
      garisPantaiLegends.push({ color: "#FFC0CB", text: "Garis Pantai 2022" });
    }

    if (garisPantai2023Layer && map.hasLayer(garisPantai2023Layer)) {
      garisPantaiLegends.push({ color: "#32CD32", text: "Garis Pantai 2023" });
    }

    if (garisPantai2024Layer && map.hasLayer(garisPantai2024Layer)) {
      garisPantaiLegends.push({ color: "#00FFFF", text: "Garis Pantai 2024" });
    }

    if (kerentananLegends.length > 0) {
      const kerentananDetails = document.createElement("details");
      kerentananDetails.className = "legend-details";
      kerentananDetails.open = true;
      const kerentananSummary = document.createElement("summary");
      kerentananSummary.className = "legend-summary";
      kerentananSummary.innerHTML = `Variabel Kerentanan <i class="fas fa-chevron-down"></i>`;
      kerentananDetails.appendChild(kerentananSummary);

      const kerentananContent = document.createElement("div");
      kerentananContent.className = "legend-dropdown-content";
      kerentananLegends.forEach((section) => {
        const sectionDiv = document.createElement("div");
        sectionDiv.className = "legend-section";

        const titleEl = document.createElement("h5");
        titleEl.className = "legend-subsection-title";
        titleEl.textContent = section.title;
        sectionDiv.appendChild(titleEl);

        section.data.forEach((item) => {
          const legendItem = document.createElement("div");
          legendItem.className = "legend-item";
          legendItem.innerHTML = `
                                <div class="legend-color-box" style="background-color: ${item.color};"></div>
                                <span>${item.text}</span>
                            `;
          sectionDiv.appendChild(legendItem);
        });
        kerentananContent.appendChild(sectionDiv);
      });
      kerentananDetails.appendChild(kerentananContent);
      legendaContainer.appendChild(kerentananDetails);
      hasLegend = true;
    }

    if (garisPantaiLegends.length > 0) {
      const garisPantaiDetails = document.createElement("details");
      garisPantaiDetails.className = "legend-details";
      garisPantaiDetails.open = true;
      const garisPantaiSummary = document.createElement("summary");
      garisPantaiSummary.className = "legend-summary";
      garisPantaiSummary.innerHTML = `Garis Pantai <i class="fas fa-chevron-down"></i>`;
      garisPantaiDetails.appendChild(garisPantaiSummary);

      const garisPantaiContent = document.createElement("div");
      garisPantaiContent.className = "legend-dropdown-content";
      garisPantaiLegends.forEach((item) => {
        const legendItem = document.createElement("div");
        legendItem.className = "legend-item";
        legendItem.innerHTML = `
                            <div class="legend-color-box" style="background-color: ${item.color};"></div>
                            <span>${item.text}</span>
                        `;
        garisPantaiContent.appendChild(legendItem);
      });
      garisPantaiDetails.appendChild(garisPantaiContent);
      legendaContainer.appendChild(garisPantaiDetails);
      hasLegend = true;
    }

    if (hasLegend) {
      noLegendText.style.display = "none";
    } else {
      noLegendText.style.display = "block";
    }
  }

  // Fungsi untuk menentukan style berdasarkan skor
  function styleVARKERLayer(feature) {
    const skor = feature.properties.SKOR;
    let color = "#ff0000"; // Default color (Sangat Tinggi)

    if (skor == 1) {
      color = "#008000"; // Hijau Tua
    } else if (skor == 2) {
      color = "#00ff000"; // Hijau Muda
    } else if (skor == 3) {
      color = "#ffff00"; // Kuning
    } else if (skor == 4) {
      color = "#ff9900"; // Oranye
    }

    return {
      color: color,
      weight: 3,
    };
  }

  // Fungsi untuk menentukan style garis pantai berdasarkan filter
  function styleGarisPantai(feature, year) {
    const selectedKecamatan = kecamatanFilter.value.toLowerCase();
    const selectedDesa = desaFilter.value.toLowerCase();

    const featureKec = (feature.properties.Kec || "").toLowerCase();
    const featureDesa = (feature.properties.Desa || "").toLowerCase();

    let isVisible = true;

    if (selectedKecamatan && featureKec !== selectedKecamatan) {
      isVisible = false;
    }

    if (selectedDesa && featureDesa !== selectedDesa) {
      isVisible = false;
    }

    let color;
    switch (year) {
      case 2016:
        color = "blue";
        break;
      case 2017:
        color = "red";
        break;
      case 2018:
        color = "#800080"; // Ungu
        break;
      case 2019:
        color = "#FFA500"; // Oranye
        break;
      case 2020:
        color = "#008080"; // Teal
        break;
      case 2021:
        color = "#A52A2A"; // Coklat
        break;
      case 2022:
        color = "#FFC0CB"; // Merah Muda
        break;
      case 2023:
        color = "#32CD32"; // Hijau Lemon
        break;
      case 2024:
        color = "#00FFFF"; // Sian
        break;
      default:
        color = "#000000"; // Hitam (default)
    }

    return {
      color: isVisible ? color : "transparent",
      weight: isVisible ? 2 : 0,
      opacity: isVisible ? 1 : 0,
    };
  }

  // Fungsi untuk memuat data GeoJSON
  async function loadGeoJSONLayer(layerName) {
    let geojsonUrl = "";
    let styleFunction;
    let onEachFeatureFunction;

    if (layerName === "slrln") {
      geojsonUrl =
        "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Kerentanan/SLRLN.geojson";
      styleFunction = styleVARKERLayer;
    } else if (layerName === "waveln") {
      geojsonUrl =
        "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Kerentanan/WAVELN.geojson";
      styleFunction = styleVARKERLayer;
    } else if (layerName === "glgln") {
      geojsonUrl =
        "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Kerentanan/GLGLN.geojson";
      styleFunction = styleVARKERLayer;
    } else if (layerName === "slpln") {
      geojsonUrl =
        "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Kerentanan/SLPLN.geojson";
      styleFunction = styleVARKERLayer;
    } else if (layerName === "garis-pantai-2016") {
      geojsonUrl =
        "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20160309.geojson";
      styleFunction = (feature) => styleGarisPantai(feature, 2016);
    } else if (layerName === "garis-pantai-2017") {
      geojsonUrl =
        "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20170821.geojson";
      styleFunction = (feature) => styleGarisPantai(feature, 2017);
    } else if (layerName === "garis-pantai-2018") {
      geojsonUrl =
        "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20180418.geojson";
      styleFunction = (feature) => styleGarisPantai(feature, 2018);
    } else if (layerName === "garis-pantai-2019") {
      geojsonUrl =
        "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20190508.geojson";
      styleFunction = (feature) => styleGarisPantai(feature, 2019);
    } else if (layerName === "garis-pantai-2020") {
      geojsonUrl =
        "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20200422.geojson";
      styleFunction = (feature) => styleGarisPantai(feature, 2020);
    } else if (layerName === "garis-pantai-2021") {
      geojsonUrl =
        "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20210512.geojson";
      styleFunction = (feature) => styleGarisPantai(feature, 2021);
    } else if (layerName === "garis-pantai-2022") {
      geojsonUrl =
        "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20220402.geojson";
      styleFunction = (feature) => styleGarisPantai(feature, 2022);
    } else if (layerName === "garis-pantai-2023") {
      geojsonUrl =
        "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20230929.geojson";
      styleFunction = (feature) => styleGarisPantai(feature, 2023);
    } else if (layerName === "garis-pantai-2024") {
      geojsonUrl =
        "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20240511.geojson";
      styleFunction = (feature) => styleGarisPantai(feature, 2024);
    }

    onEachFeatureFunction = (feature, layer) => {
      if (feature.properties) {
        let popupContent = "<table>";
        for (let key in feature.properties) {
          if (
            feature.properties.hasOwnProperty(key) &&
            feature.properties[key] !== null &&
            feature.properties[key] !== ""
          ) {
            popupContent += `<tr><td><b>${key}</b></td><td>: ${feature.properties[key]}</td></tr>`;
          }
        }
        popupContent += `</table><button class="show-image-btn" data-layer-name="${layerName}">Tampilkan Visualisasi</button>`;
        layer.bindPopup(popupContent);
      }
    };

    map.spin(true, {
      lines: 13,
      length: 10,
      width: 5,
      radius: 15,
      scale: 0.5,
    });

    try {
      const response = await fetch(geojsonUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();

      // Simpan data di cache
      geojsonData[layerName] = data;

      const layer = L.geoJSON(data, {
        style: styleFunction,
        onEachFeature: onEachFeatureFunction,
      });

      map.spin(false);
      return layer;
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
      map.spin(false);
      return null;
    }
  }

  // Fungsi untuk memperbarui dropdown filter berdasarkan layer garis pantai yang aktif
  function updateFilterDropdowns() {
    const kecSet = new Set();
    const desaSet = new Set();

    activeGarisPantaiLayers.forEach((layerName) => {
      const data = geojsonData[layerName];
      if (data) {
        data.features.forEach((feature) => {
          if (feature.properties && feature.properties.Kec) {
            kecSet.add(feature.properties.Kec);
          }
          if (feature.properties && feature.properties.Desa) {
            desaSet.add(feature.properties.Desa);
          }
        });
      }
    });

    const sortedKecamatan = Array.from(kecSet).sort();
    const sortedDesa = Array.from(desaSet).sort();

    kecamatanFilter.innerHTML =
      '<option value="">-- Semua Kecamatan --</option>';
    sortedKecamatan.forEach((kec) => {
      const option = document.createElement("option");
      option.value = kec;
      option.textContent = kec;
      kecamatanFilter.appendChild(option);
    });

    // Tambahkan event listener untuk memfilter desa berdasarkan kecamatan
    kecamatanFilter.onchange = () => {
      const selectedKecamatan = kecamatanFilter.value;
      const filteredDesaSet = new Set();
      if (selectedKecamatan) {
        activeGarisPantaiLayers.forEach((layerName) => {
          const data = geojsonData[layerName];
          if (data) {
            data.features.forEach((feature) => {
              if (
                feature.properties &&
                feature.properties.Desa &&
                feature.properties.Kec.toLowerCase() ===
                  selectedKecamatan.toLowerCase()
              ) {
                filteredDesaSet.add(feature.properties.Desa);
              }
            });
          }
        });
      } else {
        sortedDesa.forEach((desa) => filteredDesaSet.add(desa));
      }

      const sortedFilteredDesa = Array.from(filteredDesaSet).sort();
      desaFilter.innerHTML = '<option value="">-- Semua Desa --</option>';
      sortedFilteredDesa.forEach((desa) => {
        const option = document.createElement("option");
        option.value = desa;
        option.textContent = desa;
        desaFilter.appendChild(option);
      });
      toggleResetButton();
    };
  }

  // Fungsi untuk mengontrol visibilitas tombol reset
  function toggleResetButton() {
    if (kecamatanFilter.value !== "" || desaFilter.value !== "") {
      resetButton.style.display = "block";
    } else {
      resetButton.style.display = "none";
    }
  }

  // Handle dropdown perubahan filter
  kecamatanFilter.addEventListener("change", () => {
    if (garisPantai2016Layer) {
      garisPantai2016Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2016)
      );
    }
    if (garisPantai2017Layer) {
      garisPantai2017Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2017)
      );
    }
    if (garisPantai2018Layer) {
      garisPantai2018Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2018)
      );
    }
    if (garisPantai2019Layer) {
      garisPantai2019Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2019)
      );
    }
    if (garisPantai2020Layer) {
      garisPantai2020Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2020)
      );
    }
    if (garisPantai2021Layer) {
      garisPantai2021Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2021)
      );
    }
    if (garisPantai2022Layer) {
      garisPantai2022Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2022)
      );
    }
    if (garisPantai2023Layer) {
      garisPantai2023Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2023)
      );
    }
    if (garisPantai2024Layer) {
      garisPantai2024Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2024)
      );
    }
    toggleResetButton();
  });

  desaFilter.addEventListener("change", () => {
    if (garisPantai2016Layer) {
      garisPantai2016Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2016)
      );
    }
    if (garisPantai2017Layer) {
      garisPantai2017Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2017)
      );
    }
    if (garisPantai2018Layer) {
      garisPantai2018Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2018)
      );
    }
    if (garisPantai2019Layer) {
      garisPantai2019Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2019)
      );
    }
    if (garisPantai2020Layer) {
      garisPantai2020Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2020)
      );
    }
    if (garisPantai2021Layer) {
      garisPantai2021Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2021)
      );
    }
    if (garisPantai2022Layer) {
      garisPantai2022Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2022)
      );
    }
    if (garisPantai2023Layer) {
      garisPantai2023Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2023)
      );
    }
    if (garisPantai2024Layer) {
      garisPantai2024Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2024)
      );
    }
    toggleResetButton();
  });

  // Handle klik tombol "Reset Filter"
  resetButton.addEventListener("click", () => {
    // Reset nilai dropdown
    kecamatanFilter.value = "";
    desaFilter.value = "";

    // Perbarui tampilan dropdown desa (untuk menghapus opsi filter sebelumnya)
    kecamatanFilter.dispatchEvent(new Event("change"));

    // Terapkan gaya kembali ke semua fitur di layer garis pantai
    if (garisPantai2016Layer) {
      garisPantai2016Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2016)
      );
    }
    if (garisPantai2017Layer) {
      garisPantai2017Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2017)
      );
    }
    if (garisPantai2018Layer) {
      garisPantai2018Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2018)
      );
    }
    if (garisPantai2019Layer) {
      garisPantai2019Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2019)
      );
    }
    if (garisPantai2020Layer) {
      garisPantai2020Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2020)
      );
    }
    if (garisPantai2021Layer) {
      garisPantai2021Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2021)
      );
    }
    if (garisPantai2022Layer) {
      garisPantai2022Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2022)
      );
    }
    if (garisPantai2023Layer) {
      garisPantai2023Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2023)
      );
    }
    if (garisPantai2024Layer) {
      garisPantai2024Layer.setStyle((feature) =>
        styleGarisPantai(feature, 2024)
      );
    }
    toggleResetButton();
  });

  // Dapatkan semua grup checkbox
  const overlayControlGroups = document.querySelectorAll(".checkbox-group");

  // Tambahkan event listener untuk setiap grup checkbox
  overlayControlGroups.forEach((group) => {
    group.addEventListener("change", async (e) => {
      const layerValue = e.target.value;
      const isChecked = e.target.checked;
      let addedLayer = null;
      const layerId = layerValue.replace(/-/g, "_"); // Create a valid variable name

      if (isChecked) {
        // Check if the layer has been loaded before
        if (!geojsonLayers[layerValue]) {
          const newLayer = await loadGeoJSONLayer(layerValue);
          if (newLayer) {
            geojsonLayers[layerValue] = newLayer;
          }
        }

        if (geojsonLayers[layerValue]) {
          geojsonLayers[layerValue].addTo(map).bringToFront();
          addedLayer = geojsonLayers[layerValue];
          activeLayers.push(addedLayer);
        }
      } else {
        const layerToRemove = geojsonLayers[layerValue];
        if (layerToRemove) {
          map.removeLayer(layerToRemove);
          // Remove the layer from the activeLayers array
          activeLayers = activeLayers.filter(
            (layer) => layer !== layerToRemove
          );
        }
      }

      // Set the current top layer to the last item in the active layers array
      currentTopLayer =
        activeLayers.length > 0 ? activeLayers[activeLayers.length - 1] : null;

      // Update the global variables for each layer
      if (layerValue === "slrln")
        slrlnLayer = isChecked ? geojsonLayers[layerValue] : null;
      if (layerValue === "waveln")
        waveLayer = isChecked ? geojsonLayers[layerValue] : null;
      if (layerValue === "glgln")
        glglnLayer = isChecked ? geojsonLayers[layerValue] : null;
      if (layerValue === "slpln")
        slplnLayer = isChecked ? geojsonLayers[layerValue] : null;
      if (layerValue === "garis-pantai-2016")
        garisPantai2016Layer = isChecked ? geojsonLayers[layerValue] : null;
      if (layerValue === "garis-pantai-2017")
        garisPantai2017Layer = isChecked ? geojsonLayers[layerValue] : null;
      if (layerValue === "garis-pantai-2018")
        garisPantai2018Layer = isChecked ? geojsonLayers[layerValue] : null;
      if (layerValue === "garis-pantai-2019")
        garisPantai2019Layer = isChecked ? geojsonLayers[layerValue] : null;
      if (layerValue === "garis-pantai-2020")
        garisPantai2020Layer = isChecked ? geojsonLayers[layerValue] : null;
      if (layerValue === "garis-pantai-2021")
        garisPantai2021Layer = isChecked ? geojsonLayers[layerValue] : null;
      if (layerValue === "garis-pantai-2022")
        garisPantai2022Layer = isChecked ? geojsonLayers[layerValue] : null;
      if (layerValue === "garis-pantai-2023")
        garisPantai2023Layer = isChecked ? geojsonLayers[layerValue] : null;
      if (layerValue === "garis-pantai-2024")
        garisPantai2024Layer = isChecked ? geojsonLayers[layerValue] : null;

      if (layerValue.startsWith("garis-pantai")) {
        if (isChecked) {
          activeGarisPantaiLayers.push(layerValue);
        } else {
          activeGarisPantaiLayers = activeGarisPantaiLayers.filter(
            (item) => item !== layerValue
          );
        }

        if (activeGarisPantaiLayers.length > 0) {
          filterInitialText.style.display = "none";
          kecamatanFilterGroup.style.display = "block";
          desaFilterGroup.style.display = "block";
          updateFilterDropdowns();
        } else {
          kecamatanFilter.value = "";
          desaFilter.value = "";
          kecamatanFilterGroup.style.display = "none";
          desaFilterGroup.style.display = "none";
          filterInitialText.style.display = "block";
        }
      }
      updateLegend();
    });
  });

  // Fungsi untuk menampilkan visualisasi
  function renderVisualisasi() {
    visualisasiTabContent.innerHTML = "";

    // Show/hide navigation buttons based on the number of items
    if (visualisasiItems.length > 1) {
      prevBtn.style.display = "block";
      nextBtn.style.display = "block";
    } else {
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
    }

    if (visualisasiItems.length === 0) {
      visualisasiTabContent.innerHTML =
        '<p style="text-align: center; color: #777;">Tidak ada visualisasi untuk ditampilkan.</p>';
      return;
    }

    const item = visualisasiItems[currentVisualisasiIndex];
    visualisasiTabTitle.textContent = item.title;

    const innerContent = document.createElement("div");
    innerContent.className = "visualisasi-tab-content-inner";

    if (item.type === "image-comparison") {
      const comparisonWrapper = document.createElement("div");
      comparisonWrapper.className = "image-comparison";

      const image1 = document.createElement("img");
      image1.src = item.image1.url;
      image1.alt = item.image1.alt;

      const image2Wrapper = document.createElement("div");
      image2Wrapper.className = "image-comparison-wave";
      const image2 = document.createElement("img");
      image2.src = item.image2.url;
      image2.alt = item.image2.alt;
      image2Wrapper.appendChild(image2);

      const slider = document.createElement("div");
      slider.className = "image-comparison-slider";

      comparisonWrapper.appendChild(image1);
      comparisonWrapper.appendChild(image2Wrapper);
      comparisonWrapper.appendChild(slider);
      innerContent.appendChild(comparisonWrapper);

      let isDragging = false;
      slider.addEventListener("mousedown", (e) => {
        e.preventDefault();
        isDragging = true;
      });
      document.addEventListener("mouseup", () => {
        isDragging = false;
      });
      document.addEventListener("mousemove", (e) => {
        if (isDragging) {
          const rect = comparisonWrapper.getBoundingClientRect();
          let newX = e.clientX - rect.left;
          if (newX < 0) newX = 0;
          if (newX > rect.width) newX = rect.width;

          const percentage = (newX / rect.width) * 100;
          image2Wrapper.style.width = `${percentage}%`;
          slider.style.left = `${percentage}%`;
        }
      });
    } else if (item.type === "image") {
      const imageWrapper = document.createElement("div");
      imageWrapper.className = "image-wrapper";
      const img = document.createElement("img");
      img.className = "visualisasi-image";
      img.src = item.url;
      img.alt = item.title;
      imageWrapper.appendChild(img);

      const controls = document.createElement("div");
      controls.className = "image-controls zoom-only";
      controls.innerHTML = `
                        <button class="image-control-btn zoom-in-btn"><i class="fas fa-plus"></i></button>
                        <button class="image-control-btn zoom-out-btn"><i class="fas fa-minus"></i></button>
                        <button class="image-control-btn reset-zoom-btn"><i class="fas fa-sync-alt"></i></button>
                    `;
      innerContent.appendChild(imageWrapper);
      innerContent.appendChild(controls);

      let currentZoom = 1.0;
      let panX = 0;
      let panY = 0;
      let isDragging = false;
      let startX, startY;
      const updateImageTransform = () => {
        img.style.transform = `scale(${currentZoom}) translate(${panX}px, ${panY}px)`;
      };
      controls.querySelector(".zoom-in-btn").addEventListener("click", () => {
        currentZoom += 0.2;
        updateImageTransform();
      });
      controls.querySelector(".zoom-out-btn").addEventListener("click", () => {
        if (currentZoom > 1.0) {
          currentZoom -= 0.2;
          updateImageTransform();
        }
      });
      controls
        .querySelector(".reset-zoom-btn")
        .addEventListener("click", () => {
          currentZoom = 1.0;
          panX = 0;
          panY = 0;
          updateImageTransform();
        });
      imageWrapper.addEventListener("mousedown", (e) => {
        if (currentZoom > 1.0) {
          isDragging = true;
          imageWrapper.classList.add("is-dragging");
          startX = e.clientX - panX;
          startY = e.clientY - panY;
        }
      });
      imageWrapper.addEventListener("mousemove", (e) => {
        if (isDragging) {
          panX = e.clientX - startX;
          panY = e.clientY - startY;
          updateImageTransform();
        }
      });
      imageWrapper.addEventListener("mouseup", () => {
        isDragging = false;
        imageWrapper.classList.remove("is-dragging");
      });
      imageWrapper.addEventListener("mouseleave", () => {
        isDragging = false;
        imageWrapper.classList.remove("is-dragging");
      });
    }

    visualisasiTabContent.appendChild(innerContent);
    updateNavButtons();
  }

  // Fungsi untuk memperbarui status tombol navigasi
  function updateNavButtons() {
    if (visualisasiItems.length > 1) {
      prevBtn.style.display = "block";
      nextBtn.style.display = "block";
      prevBtn.disabled = currentVisualisasiIndex === 0;
      nextBtn.disabled =
        currentVisualisasiIndex === visualisasiItems.length - 1;
    } else {
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
    }
  }

  // Tambahkan event listener untuk tombol navigasi
  prevBtn.addEventListener("click", () => {
    if (currentVisualisasiIndex > 0) {
      currentVisualisasiIndex--;
      renderVisualisasi();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentVisualisasiIndex < visualisasiItems.length - 1) {
      currentVisualisasiIndex++;
      renderVisualisasi();
    }
  });

  // Tambahkan fungsionalitas drag-and-drop pada tab visualisasi
  let isDraggingVisualisasi = false;
  let offset = {
    x: 0,
    y: 0,
  };

  visualisasiTabHeader.addEventListener("mousedown", (e) => {
    isDraggingVisualisasi = true;
    visualisasiTabContainer.classList.add("is-dragging");
    offset.x = e.clientX - visualisasiTabContainer.offsetLeft;
    offset.y = e.clientY - visualisasiTabContainer.offsetTop;
  });

  document.addEventListener("mouseup", () => {
    isDraggingVisualisasi = false;
    visualisasiTabContainer.classList.remove("is-dragging");
  });

  document.addEventListener("mousemove", (e) => {
    if (isDraggingVisualisasi) {
      const newX = e.clientX - offset.x;
      const newY = e.clientY - offset.y;

      visualisasiTabContainer.style.left = `${newX}px`;
      visualisasiTabContainer.style.top = `${newY}px`;
      visualisasiTabContainer.style.transform = "none";
    }
  });

  // Tambahkan event listener untuk tombol di dalam popup
  map.on("popupopen", function () {
    const btn = document.querySelector(".show-image-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        const slrCheckbox = document.querySelector('input[value="slrln"]');
        const waveCheckbox = document.querySelector('input[value="waveln"]');
        const glglnCheckbox = document.querySelector('input[value="glgln"]');
        const slplnCheckbox = document.querySelector('input[value="slpln"]');

        // Clear the visualization items and populate based on checkboxes
        visualisasiItems = [];

        if (slrCheckbox.checked) {
          visualisasiItems.push({
            type: "image",
            title: "Visualisasi Data SLR",
            url: "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/GAMBAR/Visualisasi%20Trend%20SLR%20INT10.png",
          });
        }
        if (waveCheckbox.checked) {
          visualisasiItems.push({
            type: "image",
            title: "Visualisasi Data WAVE",
            url: "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/GAMBAR/Visualisasi%20Mean%20Wave%20INT10.png",
          });
        }
        if (glglnCheckbox.checked) {
          visualisasiItems.push({
            type: "image",
            title: "Visualisasi Data GLG",
            url: "https://placehold.co/800x600/800080/FFFFFF?text=Visualisasi+GLG",
          });
        }
        if (slplnCheckbox.checked) {
          visualisasiItems.push({
            type: "image",
            title: "Visualisasi Data SLP",
            url: "https://placehold.co/800x600/800080/FFFFFF?text=Visualisasi+SLP",
          });
        }

        // Handle image comparison if both SLR and WAVE are selected
        if (slrCheckbox.checked && waveCheckbox.checked) {
          visualisasiItems.push({
            type: "image-comparison",
            title: "Perbandingan Visualisasi SLR dan WAVE",
            image1: {
              url: "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/GAMBAR/Visualisasi%20Trend%20SLR%20INT10.png",
              alt: "Visualisasi Data SLR",
            },
            image2: {
              url: "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/GAMBAR/Visualisasi%20Mean%20Wave%20INT10.png",
              alt: "Visualisasi Data WAVE",
            },
          });
        }

        // Open the tab and render the first item
        visualisasiTabContainer.style.display = "flex";
        currentVisualisasiIndex = 0;
        renderVisualisasi();
      });
    }
  });

  // Geolocation Functionality
  let locationMarker = null;
  let accuracyCircle = null;

  geolocationBtn.addEventListener("click", () => {
    if ("geolocation" in navigator) {
      map.spin(true, {
        lines: 13,
        length: 10,
        width: 5,
        radius: 15,
        scale: 0.5,
      });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.spin(false);
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          const latlng = [lat, lon];

          // Hapus marker dan lingkaran sebelumnya jika ada
          if (locationMarker) {
            map.removeLayer(locationMarker);
          }
          if (accuracyCircle) {
            map.removeLayer(accuracyCircle);
          }

          // Tambahkan marker ke lokasi
          locationMarker = L.marker(latlng, {
            icon: L.icon({
              iconUrl:
                "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              tooltipAnchor: [16, -28],
              shadowUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
              shadowSize: [41, 41],
            }),
            className: "geolocation-marker",
          })
            .addTo(map)
            .bindPopup(`<b>Lokasi Anda</b><br>Akurasi: ${accuracy} meter`)
            .openPopup();

          // Tambahkan lingkaran akurasi
          accuracyCircle = L.circle(latlng, accuracy, {
            color: "blue",
            fillColor: "#3b82f6",
            fillOpacity: 0.2,
            weight: 2,
          }).addTo(map);

          // Pindahkan peta ke lokasi
          map.setView(latlng, 15);
        },
        (error) => {
          map.spin(false);
          console.error("Error getting location:", error.message);
          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Akses lokasi ditolak.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Informasi lokasi tidak tersedia.";
              break;
            case error.TIMEOUT:
              errorMessage = "Waktu permintaan lokasi habis.";
              break;
            default:
              errorMessage = "Terjadi kesalahan yang tidak diketahui.";
              break;
          }
          alert(`Gagal mendapatkan lokasi Anda.\nError: ${errorMessage}`);
        }
      );
    } else {
      alert("Geolokasi tidak didukung oleh browser ini.");
    }
  });

  // Handle transparency slider
  transparencySlider.addEventListener("input", (e) => {
    const opacity = e.target.value / 100;

    // Cek layer teratas yang saat ini aktif dan terapkan opasitas
    if (currentTopLayer && map.hasLayer(currentTopLayer)) {
      currentTopLayer.setStyle({
        opacity: opacity,
      });
    }
  });

  // Handle Fullscreen button
  fullscreenBtn.addEventListener("click", () => {
    const mapContainer = map.getContainer();
    const icon = fullscreenBtn.querySelector("i");

    if (document.fullscreenElement) {
      document.exitFullscreen();
      icon.className = "fas fa-expand";
    } else {
      mapContainer.requestFullscreen();
      icon.className = "fas fa-compress";
    }
  });

  // Listen for fullscreen change events to update the button icon
  document.addEventListener("fullscreenchange", () => {
    const icon = fullscreenBtn.querySelector("i");
    if (!document.fullscreenElement) {
      icon.className = "fas fa-expand";
    }
    map.invalidateSize();
  });

  // Handle table icon clicks
  tableIcons.forEach((icon) => {
    icon.addEventListener("click", async (e) => {
      const layerName = e.target.getAttribute("data-layer");

      // Sembunyikan semua menu div dan hapus status aktif
      menuDivs.forEach((div) => div.classList.remove("show"));
      menuItems.forEach((item) => item.classList.remove("active"));

      // Buka menu Tabel dan tandai sebagai aktif
      const tabelMenu = document.getElementById("tabel-menu");
      const tabelMenuItem = document.querySelector(
        '.sidemenu-item[data-target="tabel-menu"]'
      );
      tabelMenu.classList.add("show");
      tabelMenuItem.classList.add("active");
      mainContent.classList.add("pushed-by-sidemenu");
      sideMenu.classList.add("show-sidemenu");
      menuToggleIcon.classList.remove("fa-bars");
      menuToggleIcon.classList.add("fa-arrow-left");

      // Tampilkan loading state
      tableContent.innerHTML =
        '<p style="text-align: center; color: #777;">Memuat data tabel...</p>';

      let data = geojsonData[layerName];

      // Jika data belum ada, muat dari server
      if (!data) {
        let geojsonUrl = "";
        if (layerName === "slrln") {
          geojsonUrl =
            "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Kerentanan/SLRLN.geojson";
        } else if (layerName === "waveln") {
          geojsonUrl =
            "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Kerentanan/WAVELN.geojson";
        } else if (layerName === "glgln") {
          geojsonUrl =
            "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Kerentanan/GLGLN.geojson";
        } else if (layerName === "slpln") {
          geojsonUrl =
            "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Kerentanan/SLPLN.geojson";
        } else if (layerName === "garis-pantai-2016") {
          geojsonUrl =
            "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20160309.geojson";
        } else if (layerName === "garis-pantai-2017") {
          geojsonUrl =
            "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20170821.geojson";
        } else if (layerName === "garis-pantai-2018") {
          geojsonUrl =
            "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20180418.geojson";
        } else if (layerName === "garis-pantai-2019") {
          geojsonUrl =
            "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20190508.geojson";
        } else if (layerName === "garis-pantai-2020") {
          geojsonUrl =
            "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20200422.geojson";
        } else if (layerName === "garis-pantai-2021") {
          geojsonUrl =
            "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20210512.geojson";
        } else if (layerName === "garis-pantai-2022") {
          geojsonUrl =
            "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20220402.geojson";
        } else if (layerName === "garis-pantai-2023") {
          geojsonUrl =
            "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20230929.geojson";
        } else if (layerName === "garis-pantai-2024") {
          geojsonUrl =
            "https://raw.githubusercontent.com/elyueich/leaflet-dashboard/main/data/Garis%20Pantai/GP20240511.geojson";
        }

        try {
          const response = await fetch(geojsonUrl);
          if (!response.ok) throw new Error("Network response was not ok");
          data = await response.json();
          geojsonData[layerName] = data; // Simpan di cache
        } catch (error) {
          tableContent.innerHTML =
            '<p style="text-align: center; color: #777;">Gagal memuat data tabel.</p>';
          console.error("Failed to load table data:", error);
          return;
        }
      }

      // Buat tabel dari data GeoJSON
      if (data && data.features && data.features.length > 0) {
        const features = data.features;
        const properties = features[0].properties;

        // Tentukan header berdasarkan data yang ada
        let headers = Object.keys(properties);
        // Mengubah nama header untuk Garis Pantai
        if (layerName.startsWith("garis-pantai")) {
          headers = headers.map((header) => {
            if (header.toUpperCase() === "KEC") return "Kecamatan";
            if (header.toUpperCase() === "DESA") return "Desa";
            return header; // Biarkan properti lainnya apa adanya
          });
        }

        let tableHTML = "<table><thead><tr>";
        headers.forEach((header) => {
          tableHTML += `<th>${header}</th>`;
        });
        tableHTML += "</tr></thead><tbody>";

        features.forEach((feature) => {
          tableHTML += "<tr>";
          const currentProps = feature.properties;
          // Iterasi menggunakan header yang sudah ditentukan
          headers.forEach((header) => {
            // Cari key asli dari header yang sudah diubah namanya
            let originalKey = Object.keys(currentProps).find((key) => {
              if (key.toUpperCase() === "KEC" && header === "Kecamatan")
                return true;
              if (key.toUpperCase() === "DESA" && header === "Desa")
                return true;
              return key === header;
            });
            tableHTML += `<td>${currentProps[originalKey] || ""}</td>`;
          });
          tableHTML += "</tr>";
        });

        tableHTML += "</tbody></table>";
        tableContent.innerHTML = tableHTML;
      } else {
        tableContent.innerHTML =
          '<p style="text-align: center; color: #777;">Tidak ada data untuk layer ini.</p>';
      }
    });
  });
});
