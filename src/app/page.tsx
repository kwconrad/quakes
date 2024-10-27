"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Layer, Map, MapRef, Source } from "react-map-gl";
import useSWR from "swr";

import useOnClickOutside from "@/hooks/useOnClickOutside";
import { GeoJSONSource, LngLatLike } from "mapbox-gl";
import {
  clusterCountLayer,
  clusterLayer,
  faultsLayer,
  unclusteredPointLayer,
} from "./layers";
import QuakeIcon from "./quakes-app-brand-icon.svg";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

type Quake = {
  title: string;
  mag: number;
  time: number;
  tsunami: number;
};

const ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [value, setValue] = useState("");
  const [quake, setQuake] = useState<Quake | undefined>(undefined);
  const changeValue = (e: ChangeEvent<HTMLInputElement>) =>
    setValue(e.target.value);
  const [debouncedValue, setDebouncedValue] = useState(""); // Debounced value (updated after 500ms)

  // Effect to update the debounced value after 500ms
  useEffect(() => {
    // Set a timeout to update debouncedValue after 500ms of inactivity
    const handler = setTimeout(() => {
      setDebouncedValue(value); // Update the debounced value
    }, 500);

    // Cleanup the timeout if inputValue changes before 500ms (user is still typing)
    return () => {
      clearTimeout(handler);
    };
  }, [value]); // Only run the effect if inputValue changes

  const today = () => new Date().toLocaleDateString("en");
  const yesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString("en");
  };

  const dataUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${yesterday()}&endtime=${today()}`;
  const apiUrl = `https://api.mapbox.com/search/geocode/v6/forward?q=${debouncedValue}&access_token=${ACCESS_TOKEN}`;

  const { data, error, isLoading } = useSWR(apiUrl, fetcher);

  const mapRef = useRef<MapRef | null>(null);

  const flyToLocation = (location: LngLatLike) => {
    if (!mapRef.current) return;
    setDebouncedValue("");
    setValue("");
    setQuake(undefined);

    mapRef.current.flyTo({ center: location, zoom: 9 });
  };

  const onClick = (event: any) => {
    if (!event.features) return;

    const feature = event.features[0];

    if (!feature?.properties || !feature.geometry) return;

    const clusterId = feature.properties.cluster_id;

    if (feature.properties.mag) {
      setQuake(feature.properties);
    } else {
      setQuake(undefined);
    }

    if (!mapRef.current) return;

    const mapboxSource = mapRef.current.getSource(
      "earthquakes"
    ) as GeoJSONSource;

    mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (!mapRef.current || !zoom || err) {
        return;
      }

      mapRef.current.easeTo({
        center: feature.geometry.coordinates,
        zoom,
        duration: 500,
      });
    });
  };

  const resultsContainerRef = useRef<HTMLDivElement | null>(null);
  const clearQuery = () => setValue("");
  useOnClickOutside(resultsContainerRef, clearQuery);

  const quakeContainerRef = useRef<HTMLDivElement | null>(null);
  const clearQuake = () => setQuake(undefined);
  useOnClickOutside(quakeContainerRef, clearQuake);

  const getDateFromTimeString = (time: number) => {
    const date = new Date(time);
    return date.toLocaleTimeString("en");
  };

  const createMagnitudeLegend = () => {
    const magnitudeLegendItems: { id: string; color: string; title: string }[] =
      [];
    const colors = [
      "#57abf0",
      "#6ecdb7",
      "#f1ca4a",
      "#e98339",
      "#e54a30",
      "#502eec",
    ];
    colors.forEach((color, idx) => {
      magnitudeLegendItems.push({
        id: `magitude-item-${idx + 1}`,
        color,
        title: `${idx} to ${idx + 1}`,
      });
    });
    magnitudeLegendItems[
      magnitudeLegendItems.length - 1
    ].title = `5 or greater`;
    return magnitudeLegendItems;
  };

  return (
    <div className="w-full h-full relative">
      <div className="z-20 absolute top-0 left-0 right-0 p-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <QuakeIcon className="w-5 h-5"></QuakeIcon>
          <h1 className="text-xl text-white font-bold">Quakes</h1>
        </div>
        <div className="w-full flex flex-col gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              changeValue(e);
            }}
            placeholder="Search city or region"
            className="bg-neutral-800/60 border-neutral-700 backdrop-blur-md border text-white placeholder:text-neutral-200 rounded-md px-4 py-2 w-full sm:w-72 focus:outline-none focus:border-neutral-300"
          />
          <AnimatePresence initial>
            {data?.features.length > 0 && (
              <motion.div
                ref={resultsContainerRef}
                initial={{ filter: "blur(20px)", opacity: 0.2, y: +32 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                exit={{ filter: "blur(20px)", opacity: 0.2, y: +32 }}
                className="flex w-80 rounded-md flex-col bg-neutral-800/60 border-neutral-300 backdrop-blur-md border"
              >
                {data.features.map((feature: any) => {
                  return (
                    <div
                      key={feature.id}
                      className="w-full flex items-start truncate p-4 hover:bg-white/5 cursor-pointer"
                      onClick={() =>
                        flyToLocation(feature.geometry.coordinates)
                      }
                    >
                      <span className="text-white">
                        {feature.properties.full_address}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="z-20 bottom-0 left-0 absolute pb-9 px-2">
        <div className="border py-3 px-4 flex flex-col gap-3 bg-neutral-800/60 border-neutral-700  backdrop-blur-md text-white">
          <span className="font-medium">Magnitude</span>
          <div className="flex flex-col gap-2">
            {createMagnitudeLegend().map((item) => (
              <div className="flex gap-2" key={item.id}>
                <div
                  className="rounded-full w-4 h-4 border border-white"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="font-normal text-sm">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="z-20 bottom-0 right-0 absolute p-4">
        <AnimatePresence initial>
          {quake && (
            <motion.div
              ref={quakeContainerRef}
              initial={{ filter: "blur(20px)", opacity: 0.2, y: -20 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              exit={{ filter: "blur(20px)", opacity: 0.2, y: -20 }}
              className={clsx(
                "flex flex-col w-60 border p-4 text-white rounded-md",
                {
                  "bg-neutral-800/60 border-neutral-700  backdrop-blur-md":
                    quake.mag <= 2,
                  "bg-yellow-400/40 border-yellow-900  backdrop-blur-md ":
                    quake.mag > 2 && quake.mag < 4,
                  "bg-red-400/40 border-red-900 backdrop-blur-md ":
                    quake.mag >= 4,
                }
              )}
            >
              <div className="mb-2">
                <QuakeIcon className="w-6 h-6"></QuakeIcon>
              </div>
              <span>{quake.title}</span>
              <span>Date: {getDateFromTimeString(quake.time)}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="z-10 absolute inset-0 w-full h-full">
        <Map
          ref={mapRef}
          mapboxAccessToken={ACCESS_TOKEN}
          style={{ width: "100%", height: "100%" }}
          interactiveLayerIds={
            clusterLayer.id && unclusteredPointLayer.id
              ? [clusterLayer.id, unclusteredPointLayer.id]
              : []
          }
          initialViewState={{
            longitude: -122.4,
            latitude: 37.8,
            zoom: 14,
          }}
          onClick={onClick}
          mapStyle="mapbox://styles/mapbox/dark-v11"
        >
          <Source
            id="faults"
            type="geojson"
            data={
              "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"
            }
          >
            <Layer {...faultsLayer} />
          </Source>
          {dataUrl && (
            <Source
              id="earthquakes"
              type="geojson"
              data={dataUrl}
              cluster={true}
              clusterMaxZoom={14}
              clusterRadius={50}
            >
              <Layer {...clusterLayer} />
              <Layer {...clusterCountLayer} />
              <Layer {...unclusteredPointLayer} />
            </Source>
          )}
        </Map>
      </div>
    </div>
  );
}
