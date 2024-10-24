import type { LayerProps } from "react-map-gl";

export const clusterLayer: LayerProps = {
  id: "clusters",
  type: "circle",
  source: "earthquakes",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#737373",
      5,
      "#a3a3a3",
      15,
      "#d4d4d4",
      75,
      "#e5e5e5",
      150,
      "#ffffff",
    ],
    "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
  },
};

export const clusterCountLayer: LayerProps = {
  id: "cluster-count",
  type: "symbol",
  source: "earthquakes",
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
    "text-size": 12,
  },
};

export const unclusteredPointLayer: LayerProps = {
  id: "unclustered-point",
  type: "circle",
  source: "earthquakes",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": [
      "step",
      ["get", "mag"],
      "#57abf0",
      1,
      "#6ecdb7",
      2,
      "#f1ca4a",
      3,
      "#e98339",
      4,
      "#e54a30",
      5,
      "#502eec",
    ],
    "circle-radius": 8,
    "circle-stroke-width": 1,
    "circle-stroke-color": "#fff",
  },
};

export const faultsLayer: LayerProps = {
  id: "faults-layer",
  type: "line",
  source: "faults",
  paint: {
    "line-color": "#f0F000",
    "line-width": 1,
  },
};
