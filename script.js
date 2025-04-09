// Inisialisasi peta
const map = L.map('map').setView([-8.65, 115.21], 12);

// Tambahkan base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Tambahkan layer geojson dummy
let gp2016Layer, gp2024Layer;

fetch("data/garis_pantai.geojson")
  .then(res => res.json())
  .then(data => {
    gp2016Layer = L.geoJSON(data, {
      style: { color: "blue" }
    });
    gp2024Layer = L.geoJSON(data, {
      style: { color: "red" }
    });
  });

// Toggle checkbox
document.getElementById("gp2016").addEventListener("change", function () {
  if (this.checked) gp2016Layer.addTo(map);
  else map.removeLayer(gp2016Layer);
});

document.getElementById("gp2024").addEventListener("change", function () {
  if (this.checked) gp2024Layer.addTo(map);
  else map.removeLayer(gp2024Layer);
});
