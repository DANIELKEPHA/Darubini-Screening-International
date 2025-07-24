import {
  useAddFavoritePropertyMutation,
  useGetAuthUserQuery,
  useGetPropertiesQuery,
  useGetTenantQuery,
  useRemoveFavoritePropertyMutation,
} from "@/state/api";
import { useAppSelector } from "@/state/redux";
import { Property } from "@/types/prismaTypes";
import Card from "@/components/Card";
import CardCompact from "@/components/CardCompact";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import {Alert} from "@aws-amplify/ui-react";

const Listings = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const { data: tenant } = useGetTenantQuery(
      authUser?.cognitoInfo?.userId || "",
      {
        skip: !authUser?.cognitoInfo?.userId,
      }
  );
  const [addFavorite] = useAddFavoritePropertyMutation();
  const [removeFavorite] = useRemoveFavoritePropertyMutation();
  const viewMode = useAppSelector((state) => state.global.viewMode);
  const filters = useAppSelector((state) => state.global.filters);

  const {
    data: properties,
    isLoading,
    isError,
  } = useGetPropertiesQuery(filters);

  const handleFavoriteToggle = async (propertyId: number) => {
    if (!authUser) return;

    const isFavorite = tenant?.favorites?.some(
        (fav: Property) => fav.id === propertyId
    );

    try {
      if (isFavorite) {
        await removeFavorite({
          cognitoId: authUser.cognitoInfo.userId,
          propertyId,
        });
      } else {
        await addFavorite({
          cognitoId: authUser.cognitoInfo.userId,
          propertyId,
        });
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  if (isLoading) {
    return (
        <div className="w-full p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        </div>
    );
  }

  if (isError || !properties) {
    return (
        <div className="w-full p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to fetch properties. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
    );
  }

  return (
      <div className="w-full px-4 py-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {properties.length} {properties.length === 1 ? "Property" : "Properties"} in {filters.location}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Showing all available listings
          </p>
        </div>

        {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-900">No properties found</h4>
                <p className="mt-2 text-gray-500">
                  Try adjusting your search filters
                </p>
              </div>
            </div>
        ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property) => (
                  <Card
                      key={property.id}
                      property={property}
                      isFavorite={
                          tenant?.favorites?.some(
                              (fav: Property) => fav.id === property.id
                          ) || false
                      }
                      onFavoriteToggle={() => handleFavoriteToggle(property.id)}
                      showFavoriteButton={!!authUser}
                      propertyLink={`/search/${property.id}`}
                  />
              ))}
            </div>
        ) : (
            <div className="space-y-4">
              {properties.map((property) => (
                  <CardCompact
                      key={property.id}
                      property={property}
                      isFavorite={
                          tenant?.favorites?.some(
                              (fav: Property) => fav.id === property.id
                          ) || false
                      }
                      onFavoriteToggle={() => handleFavoriteToggle(property.id)}
                      showFavoriteButton={!!authUser}
                      propertyLink={`/search/${property.id}`}
                  />
              ))}
            </div>
        )}
      </div>
  );
};

export default Listings;