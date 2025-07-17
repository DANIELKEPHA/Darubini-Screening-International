import { useGetPropertyQuery } from "@/state/api";
import { MapPin, Star } from "lucide-react";
import React from "react";

const PropertyOverview = ({ propertyId }: PropertyOverviewProps) => {
  const {
    data: property,
    isError,
    isLoading,
  } = useGetPropertyQuery(propertyId);

  if (isLoading) return <>Loading...</>;
  if (isError || !property) {
    return <>Property not Found</>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-1">
          {property.location?.country} / {property.location?.state} /{" "}
          <span className="font-semibold text-gray-600">
            {property.location?.city}
          </span>
        </div>
        <h1 className="text-3xl font-bold my-5">{property.name}</h1>
        <div className="flex justify-between items-center">
          <span className="flex items-center text-gray-500">
            <MapPin className="w-4 h-4 mr-1 text-gray-700" />
            {property.location?.city}, {property.location?.state},{" "}
            {property.location?.country}
          </span>
          <div className="flex justify-between items-center gap-3">
            <span className="flex items-center text-yellow-500">
              <Star className="w-4 h-4 mr-1 fill-current" />
              {property.averageRating.toFixed(1)} ({property.numberOfReviews}{" "}
              Reviews)
            </span>
            <span className="text-green-600">Verified Listing</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="border border-primary-200 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center gap-4 px-5">
          <div>
            <div className="text-sm text-gray-500">Monthly Rent</div>
            <div className="font-semibold">
              ${property.pricePerMonth.toLocaleString()}
            </div>
          </div>
          <div className="border-l border-gray-300 h-10"></div>
          <div>
            <div className="text-sm text-gray-500">Bedrooms</div>
            <div className="font-semibold">{property.beds} bd</div>
          </div>
          <div className="border-l border-gray-300 h-10"></div>
          <div>
            <div className="text-sm text-gray-500">Bathrooms</div>
            <div className="font-semibold">{property.baths} ba</div>
          </div>
          <div className="border-l border-gray-300 h-10"></div>
          <div>
            <div className="text-sm text-gray-500">Square Feet</div>
            <div className="font-semibold">
              {property.squareFeet.toLocaleString()} sq ft
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="my-16 space-y-6">
        <h2 className="text-xl font-semibold">About {property.name}</h2>

        <div className="bg-gray-50 p-6 rounded-xl shadow-md space-y-4">
          <p>
            <strong>Luxury Living at Seacrest Homes:</strong> Experience resort-style living where ocean views and city convenience meet. Our newly built community offers sophisticated 2- and 3-bedroom residences.
          </p>

          <div className="border-l-4 border-blue-500 pl-4">
            <p><strong>Inside Each Unit:</strong></p>
            <ul className="list-disc list-inside text-sm text-gray-700">
              <li>High-end designer finishes</li>
              <li>Quartz countertops</li>
              <li>Stainless steel Whirlpool appliances</li>
              <li>Dedicated office nook</li>
              <li>Full-size in-unit washer & dryer</li>
            </ul>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <p><strong>Resort-Style Amenities:</strong></p>
            <ul className="list-disc list-inside text-sm text-gray-700">
              <li>Swimming pools & spas with cabanas</li>
              <li>Lavish landscaped courtyards with entertainment seating</li>
              <li>BBQ lounge with panoramic views (Palos Verdes to Downtown LA)</li>
              <li>Fitness club and yoga studio</li>
              <li>Business center with conference room, internet & coffee lounge</li>
            </ul>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <p><strong>Prime Location Benefits:</strong></p>
            <ul className="list-disc list-inside text-sm text-gray-700">
              <li>Near South Bay beaches</li>
              <li>Quick access to 110, 405, and 91 freeways</li>
              <li>Close to Del Amo Fashion Center (largest mall in Western US)</li>
              <li>Nearby hospitals: Kaiser, UCLA Harbor, Torrance Memorial, Providence Little Co. of Mary</li>
            </ul>
          </div>

          <p>
            <strong>Schedule a tour</strong> and make Seacrest your personal sanctuary.
          </p>

          <p className="text-sm italic text-gray-600">
            Seacrest Homes Apartments is located in Los Angeles County, ZIP Code 90501, and served by the Los Angeles Unified School District.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PropertyOverview;
