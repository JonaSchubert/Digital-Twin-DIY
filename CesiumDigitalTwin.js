// ============================================================
// 1. Cesium ion access token
// ============================================================
Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyYTRmMDgzNi0xYTVjLTQzYmUtYWVkNy1hOTE5OGFhYTM5OWYiLCJpZCI6MjkwOTA3LCJpYXQiOjE3NDM3NzAxOTl9.0h5bZmhgMCUAcCmzqK74T8T05D7e_u6_a8DUbK7nGzg";

console.log("✅ Cesium ion access token set");

// ============================================================
// 2. Performance tuning for Google tiles
// ============================================================
Cesium.RequestScheduler.requestsByServer["tile.googleapis.com:443"] = 18;
console.log("⚡ Google tile request concurrency configured");

// ============================================================
// 3. Viewer setup (Google Photorealistic requirements)
// ============================================================
let viewer;

try {
  viewer = new Cesium.Viewer("cesiumContainer", {
    globe: false,
    baseLayerPicker: false,
    timeline: false,
    animation: false,
    geocoder: Cesium.IonGeocodeProviderType.GOOGLE
  });

  console.log("✅ Viewer created with Google geocoder");
} catch (err) {
  console.error("❌ Viewer creation failed:", err);
}

// ============================================================
// 4. UI Widget (Layers - top right)
// ============================================================
let widget;

try {
  widget = document.createElement("div");
  widget.innerHTML = `
    <div id="featureWidget" style="
      position:absolute;
      top:10px;
      right:10px;
      background:rgba(42,42,42,0.9);
      color:white;
      padding:10px;
      border-radius:4px;
      font-family:sans-serif;
      font-size:13px;
      min-width:200px;
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong>Layers</strong>
        <span id="closeWidget" style="cursor:pointer;">✕</span>
      </div>
      <hr style="border:0;border-top:1px solid #666;margin:6px 0;" />
      <label>
        <input type="checkbox" id="toggleProposed" checked />
        Proposed Building
      </label>
    </div>
  `;

  viewer.container.appendChild(widget);
  console.log("✅ Feature widget created");

  widget.querySelector("#closeWidget").onclick = () => {
    widget.style.display = "none";
    console.log("🗙 Widget closed");
  };
} catch (err) {
  console.warn("⚠️ UI widget creation failed:", err);
}

// ============================================================
// 5. Views Widget (bottom left)
// ============================================================
const viewsWidget = document.createElement("div");
viewsWidget.innerHTML = `
  <div style="
    position:absolute;
    bottom:10px;
    left:10px;
    background:rgba(42,42,42,0.9);
    color:white;
    padding:8px;
    border-radius:4px;
    font-family:sans-serif;
    font-size:13px;
  ">
    <strong>Views</strong>
    <div style="
      margin-top:6px;
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:4px;
    ">
      <button id="viewTop">Top</button>
      <button id="viewFront">Front</button>
      <button id="viewBack">Back</button>
      <button id="viewSide">Side</button>
    </div>
  </div>
`;

viewer.container.appendChild(viewsWidget);
console.log("✅ Views widget created");

// Style buttons
viewsWidget.querySelectorAll("button").forEach(btn => {
  btn.style.cursor = "pointer";
  btn.style.background = "#3a3a3a";
  btn.style.color = "white";
  btn.style.border = "1px solid #666";
  btn.style.borderRadius = "3px";
});

// ============================================================
// 6. Load Google Photorealistic 3D Tiles
// ============================================================
(async () => {
  try {
    console.log("🌍 Loading Google Photorealistic 3D Tiles…");

    const googleTileset =
      await Cesium.createGooglePhotorealistic3DTileset({
        onlyUsingWithGoogleGeocoder: true
      });

    viewer.scene.primitives.add(googleTileset);
    console.log("✅ Google tiles loaded");
  } catch (err) {
    console.error("❌ Google tiles failed:", err);
  }
})();


// ============================================================
// 6b. Add Site Boundary (thick red outline - polyline)
// ============================================================
try {
  console.log("🔺 Adding site boundary polyline…");

  const boundaryPositions = Cesium.Cartesian3.fromDegreesArray([
    -1.1026274713583746, 50.795421191436276,
    -1.1025838615994417, 50.79499852088367,
    -1.1018109997604597, 50.79503221215484,
    -1.1018570322839594, 50.795457945216896,
    -1.1026274713583746, 50.795421191436276
  ]);

  const boundaryEntity = viewer.entities.add({
    name: "Site Boundary",
    polyline: {
      positions: boundaryPositions,
      width: 6, // ✅ thick outline
      material: Cesium.Color.RED,
      clampToGround: true
    }
  });

  console.log("✅ Site boundary polyline added");

} catch (err) {
  console.error("❌ Failed to add site boundary polyline:", err);
}
``


// ============================================================
// 7. Load Proposed Building (Asset ID: 4671415)
// ============================================================
let proposedTileset;
let originalStyle;

(async () => {
  try {
    console.log("🏗️ Loading Proposed Building (Asset 4671415)…");

    proposedTileset =
      await Cesium.Cesium3DTileset.fromIonAssetId(4671415);

    viewer.scene.primitives.add(proposedTileset);
    await proposedTileset.readyPromise;

    originalStyle = proposedTileset.style;
    console.log("✅ Proposed Building loaded");

    viewer.zoomTo(proposedTileset);
  } catch (err) {
    console.error("❌ Proposed Building failed:", err);
  }
})();

// ============================================================
// 8. Camera helper for saved views
// ============================================================
function flyToBuildingView(headingDeg, pitchDeg, rangeMultiplier = 2.5) {
  try {
    if (!proposedTileset || !proposedTileset.boundingSphere) {
      console.warn("⚠️ Building not ready for camera view");
      return;
    }

    const sphere = proposedTileset.boundingSphere;

    viewer.camera.flyToBoundingSphere(sphere, {
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(headingDeg),
        Cesium.Math.toRadians(pitchDeg),
        sphere.radius * rangeMultiplier
      ),
      duration: 3.3
    });

    console.log(
      `🎥 Camera view: heading=${headingDeg}, pitch=${pitchDeg}`
    );
  } catch (err) {
    console.warn("⚠️ flyToBuildingView error:", err);
  }
}

// ============================================================
// 9. Wire view buttons (SAFE ORDER)
// ============================================================
viewsWidget.querySelector("#viewTop").onclick = () => {
  flyToBuildingView(0, -90, 2.2);
};

viewsWidget.querySelector("#viewFront").onclick = () => {
  flyToBuildingView(0, -15, 2.5);
};

viewsWidget.querySelector("#viewBack").onclick = () => {
  flyToBuildingView(180, -15, 2.5);
};

viewsWidget.querySelector("#viewSide").onclick = () => {
  flyToBuildingView(90, -15, 2.5);
};

console.log("✅ View buttons wired");

// ============================================================
// 10. Toggle Proposed Building on/off
// ============================================================
try {
  widget
    .querySelector("#toggleProposed")
    .addEventListener("change", e => {
      if (proposedTileset) {
        proposedTileset.show = e.target.checked;
        console.log(
          "👁️ Proposed Building visibility:",
          e.target.checked
        );
      }
    });
} catch (err) {
  console.warn("⚠️ Toggle binding failed:", err);
}


// ============================================================
// Track last highlighted IFC feature
// ============================================================
let lastHighlightedFeature = null;
let lastFeatureOriginalColor = null;
``

// ============================================================
// 11. Click interaction – highlight IFC feature + attach CSV data
// ============================================================

const csvInfoEntity = new Cesium.Entity({
  name: "IFC + CSV Properties"
});
viewer.entities.add(csvInfoEntity);

const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

handler.setInputAction(function (movement) {
  try {
    const picked = viewer.scene.pick(movement.position);

    if (lastHighlightedFeature) {
      lastHighlightedFeature.color = lastFeatureOriginalColor;
      lastHighlightedFeature = null;
      lastFeatureOriginalColor = null;
    }

    if (
      Cesium.defined(picked) &&
      picked instanceof Cesium.Cesium3DTileFeature &&
      picked.tileset === proposedTileset
    ) {
      console.log("IFC feature clicked");

      lastHighlightedFeature = picked;
      lastFeatureOriginalColor = Cesium.Color.clone(picked.color);
      picked.color = Cesium.Color.YELLOW.withAlpha(0.85);

      const globalId =
        picked.getProperty("globalId") ||
        picked.getProperty("GlobalId");

      console.log("Resolved GlobalId:", globalId);

      if (!ifcCsvReady) {
        console.log("CSV not loaded yet");
        return;
      }

      const csvData = ifcCsvLookup[globalId];
      if (!csvData) {
        console.log("No CSV match for this GlobalId");
        return;
      }

      console.log("CSV match found for GlobalId:", globalId);

      let html = "<table style='width:100%;font-size:12px;'>";

      Object.keys(csvData).forEach(function (key) {
        html +=
          "<tr>" +
          "<td><strong>" + key + "</strong></td>" +
          "<td>" + csvData[key] + "</td>" +
          "</tr>";
      });

      html += "</table>";

      csvInfoEntity.description = html;
      viewer.selectedEntity = csvInfoEntity;
    }
  } catch (err) {
    console.warn("Picking error:", err);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// ============================================================
// 12. Load CSV from GitHub and build IFC lookup
// ============================================================

const IFC_CSV_URL =
  "https://raw.githubusercontent.com/JonaSchubert/Digital-Twin-DIY/main/DTcsv.csv";

const ifcCsvLookup = Object.create(null);
let ifcCsvReady = false;

(async function () {
  try {
    console.log("Loading IFC CSV from GitHub...");
    console.log("CSV URL:", IFC_CSV_URL);

    const response = await fetch(IFC_CSV_URL);
    if (!response.ok) {
      throw new Error("CSV fetch failed: " + response.status);
    }

    const csvText = (await response.text()).replace(/^\uFEFF/, "");
    const lines = csvText.split("\n").filter(l => l.trim().length > 0);
    const headers = lines[0].split(",").map(h => h.trim());

    let count = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const row = {};

      headers.forEach(function (h, idx) {
        row[h] = values[idx] || "";
      });

      const gid = row.globalId || row.GlobalId;
      if (gid) {
        ifcCsvLookup[gid] = row;
        count++;
      }
    }

    ifcCsvReady = true;
    console.log("IFC CSV loaded:", count, "records");
  } catch (err) {
    console.error("Failed to load IFC CSV:", err);
  }
})();