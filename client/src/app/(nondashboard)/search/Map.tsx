"use client";
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAppSelector } from "@/state/redux";
import { useGetPropertiesQuery } from "@/state/api";
import { Property } from "@/types/prismaTypes";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const filters = useAppSelector((state) => state.global.filters);
  const {
    data: properties,
    isLoading,
    isError,
  } = useGetPropertiesQuery(filters);

  useEffect(() => {
    if (isLoading || isError || !properties || !mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/daniel-kepha/cm9pj1kf500av01sb38su7x9w",
      center: filters.coordinates || [39.6682, -4.0435],
      zoom: 9,
    });
    mapRef.current = map;

    properties.forEach((property) => {
      const marker = createPropertyMarker(property, map);
      const markerElement = marker.getElement();
      const path = markerElement.querySelector("path[fill='#3FB1CE']");
      if (path) path.setAttribute("fill", "#000000");
    });

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      resizeObserver.disconnect();
    };
  }, [isLoading, isError, properties, filters.coordinates]);

  if (isLoading) return <div className="text-gray-600">Loading...</div>;
  if (isError || !properties) return <div className="text-red-600">Failed to fetch properties</div>;

  return (
      <div className="w-full h-full relative rounded-xl border border-gray-200">
        <div
            className="map-container rounded-xl"
            ref={mapContainerRef}
            style={{
              width: "100%",
              height: "100%",
              minHeight: "500px",
            }}
        />
      </div>
  );
};

const createPropertyMarker = (property: Property, map: mapboxgl.Map) => {
  const marker = new mapboxgl.Marker()
      .setLngLat([
        property.location.coordinates.longitude,
        property.location.coordinates.latitude,
      ])
      .setPopup(
          new mapboxgl.Popup().setHTML(
              `
        <div class="marker-popup p-2 bg-white rounded-lg shadow-md">
          <div class="marker-popup-image h-16 w-full bg-gray-200 rounded-md mb-2"></div>
          <div>
            <a href="/search/${property.id}" target="_blank" class="marker-popup-title text-primary-800 font-semibold hover:underline">${property.name}</a>
            <p class="marker-popup-price text-gray-700">
              $${property.pricePerMonth}
              <span class="marker-popup-price-unit text-gray-500"> / month</span>
            </p>
          </div>
        </div>
        `
          )
      )
      .addTo(map);
  return marker;
};

export default Map;