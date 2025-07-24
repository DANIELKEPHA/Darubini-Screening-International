"use client";

import { NAVBAR_HEIGHT } from "@/lib/constants";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import FiltersBar from "./FiltersBar";
import FiltersFull from "./FiltersFull";
import { cleanParams } from "@/lib/utils";
import { setFilters } from "@/state";
import Map from "./Map";
import Listings from "./Listings";
import NewsLetter from "@/components/NewsLetter";
import FooterSection from "@/app/(nondashboard)/landing/FooterSection";

const SearchPage = () => {
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const isFiltersFullOpen = useAppSelector(
        (state) => state.global.isFiltersFullOpen
    );

    useEffect(() => {
        const initialFilters = Array.from(searchParams.entries()).reduce(
            (acc: any, [key, value]) => {
                if (key === "priceRange" || key === "squareFeet") {
                    acc[key] = value.split(",").map((v) => (v === "" ? null : Number(v)));
                } else if (key === "coordinates") {
                    acc[key] = value.split(",").map(Number);
                } else {
                    acc[key] = value === "any" ? null : value;
                }
                return acc;
            },
            {}
        );

        const cleanedFilters = cleanParams(initialFilters);
        dispatch(setFilters(cleanedFilters));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            className="w-full mx-auto px-5 flex flex-col"
            style={{
                minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
            }}
        >
            {/* Filters Bar */}
            <FiltersBar />

            {/* Listings Section */}
            <div className="py-8">
                <Listings />
            </div>

            {/* Map and Info Section */}
            <div className="flex flex-col md:flex-row gap-6 py-8">
                {/* Filters Full Sidebar */}
                <div
                    className={`h-[600px] transition-all duration-300 ease-in-out ${
                        isFiltersFullOpen
                            ? "w-full md:w-3/12 opacity-100 visible"
                            : "w-0 opacity-0 invisible"
                    }`}
                >
                    <FiltersFull />
                </div>

                {/* Map Section */}
                <div className="w-full md:w-1/2 h-[600px]">
                    <Map />
                </div>

                {/* Placeholder Content Section */}
                <div className="w-full md:w-1/2 h-[600px] bg-white rounded-xl p-6 shadow-lg">
                    <h2 className="text-2xl font-bold mb-4 text-primary-800">About Your Search Area</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-primary-700">Local Amenities</h3>
                            <p className="text-gray-600">
                                Discover nearby restaurants, shopping centers, and recreational facilities in your selected area.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-primary-700">Neighborhood Insights</h3>
                            <p className="text-gray-600">
                                Get to know the community, schools, and transportation options available in this location.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-primary-700">Market Trends</h3>
                            <p className="text-gray-600">
                                Stay informed about the latest real estate trends and property values in this area.
                            </p>
                        </div>
                        <button className="mt-4 bg-primary-700 text-white px-6 py-2 rounded-xl hover:bg-primary-800 transition-colors">
                            Explore More
                        </button>
                    </div>
                </div>
            </div>

            {/* Newsletter and Footer Section */}
            <div className="py-8 bg-gray-50 w-full m-0">
                <div className="w-full max-w-none">
                    <NewsLetter />
                    <FooterSection />
                </div>
            </div>
        </div>
    );
};

export default SearchPage;