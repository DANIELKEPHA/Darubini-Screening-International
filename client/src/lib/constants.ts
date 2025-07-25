import {
  Wifi,
  Waves,
  Dumbbell,
  Car,
  PawPrint,
  Tv,
  Thermometer,
  Cigarette,
  Cable,
  Maximize,
  Bath,
  Phone,
  Sprout,
  Hammer,
  Bus,
  Mountain,
  VolumeX,
  Home,
  Warehouse,
  Building,
  Castle,
  Trees,
  LucideIcon,
} from "lucide-react";

export enum AmenityEnum {
  WasherDryer = "WasherDryer",
  AirConditioning = "AirConditioning",
  Dishwasher = "Dishwasher",
  HighSpeedInternet = "HighSpeedInternet",
  HardwoodFloors = "HardwoodFloors",
  WalkInClosets = "WalkInClosets",
  Microwave = "Microwave",
  Refrigerator = "Refrigerator",
  Pool = "Pool",
  Gym = "Gym",
  Parking = "Parking",
  PetsAllowed = "PetsAllowed",
  WiFi = "WiFi",
}

export enum RegionEnum {
  MOMBASA = "Mombasa",
  KWALE = "Kwale",
  KILIFI = "Kilifi",
  TANA_RIVER = "Tana River",
  LAMU = "Lamu",
  TAITA_TAVETA = "Taita Taveta",
  GARISSA = "Garissa",
  WAJIR = "Wajir",
  MANDERA = "Mandera",
  MARSABIT = "Marsabit",
  ISIOLO = "Isiolo",
  MERU = "Meru",
  THARAKA_NITHI = "Tharaka-Nithi",
  EMBU = "Embu",
  KITUI = "Kitui",
  MACHAKOS = "Machakos",
  MAKUENI = "Makueni",
  NYANDARUA = "Nyandarua",
  NYERI = "Nyeri",
  KIRINYAGA = "Kirinyaga",
  MURANG_A = "Murang'a",
  KIAMBU = "Kiambu",
  TURKANA = "Turkana",
  WEST_POKOT = "West Pokot",
  SAMBURU = "Samburu",
  TRANS_NZOIA = "Trans Nzoia",
  UASIN_GISHU = "Uasin Gishu",
  ELGEYO_MARAKWET = "Elgeyo-Marakwet",
  NANDI = "Nandi",
  BARINGO = "Baringo",
  LAIKIPIA = "Laikipia",
  NAKURU = "Nakuru",
  NAROK = "Narok",
  KAJIADO = "Kajiado",
  KERICHO = "Kericho",
  BOMET = "Bomet",
  KAKAMEGA = "Kakamega",
  VIHIGA = "Vihiga",
  BUNGOMA = "Bungoma",
  BUSIA = "Busia",
  SIAYA = "Siaya",
  KISUMU = "Kisumu",
  HOMA_BAY = "Homa Bay",
  MIGORI = "Migori",
  KISII = "Kisii",
  NYAMIRA = "Nyamira",
  NAIROBI = "Nairobi"
}

export const AmenityIcons: Record<AmenityEnum, LucideIcon> = {
  WasherDryer: Waves,
  AirConditioning: Thermometer,
  Dishwasher: Waves,
  HighSpeedInternet: Wifi,
  HardwoodFloors: Home,
  WalkInClosets: Maximize,
  Microwave: Tv,
  Refrigerator: Thermometer,
  Pool: Waves,
  Gym: Dumbbell,
  Parking: Car,
  PetsAllowed: PawPrint,
  WiFi: Wifi,
};

export enum HighlightEnum {
  HighSpeedInternetAccess = "HighSpeedInternetAccess",
  WasherDryer = "WasherDryer",
  AirConditioning = "AirConditioning",
  Heating = "Heating",
  SmokeFree = "SmokeFree",
  CableReady = "CableReady",
  SatelliteTV = "SatelliteTV",
  DoubleVanities = "DoubleVanities",
  TubShower = "TubShower",
  Intercom = "Intercom",
  SprinklerSystem = "SprinklerSystem",
  RecentlyRenovated = "RecentlyRenovated",
  CloseToTransit = "CloseToTransit",
  GreatView = "GreatView",
  QuietNeighborhood = "QuietNeighborhood",
}

export const HighlightIcons: Record<HighlightEnum, LucideIcon> = {
  HighSpeedInternetAccess: Wifi,
  WasherDryer: Waves,
  AirConditioning: Thermometer,
  Heating: Thermometer,
  SmokeFree: Cigarette,
  CableReady: Cable,
  SatelliteTV: Tv,
  DoubleVanities: Maximize,
  TubShower: Bath,
  Intercom: Phone,
  SprinklerSystem: Sprout,
  RecentlyRenovated: Hammer,
  CloseToTransit: Bus,
  GreatView: Mountain,
  QuietNeighborhood: VolumeX,
};

export enum PropertyTypeEnum {
  Rooms = "Rooms",
  Tinyhouse = "Tinyhouse",
  Apartment = "Apartment",
  Villa = "Villa",
  Townhouse = "Townhouse",
  Cottage = "Cottage",
}

export const PropertyTypeIcons: Record<PropertyTypeEnum, LucideIcon> = {
  Rooms: Home,
  Tinyhouse: Warehouse,
  Apartment: Building,
  Villa: Castle,
  Townhouse: Home,
  Cottage: Trees,
};

// Add this constant at the end of the file
export const NAVBAR_HEIGHT = 52; // in pixels

// Test users for development
export const testUsers = {
  tenant: {
    username: "Carol White",
    userId: "us-east-2:76543210-90ab-cdef-1234-567890abcdef",
    signInDetails: {
      loginId: "carol.white@example.com",
      authFlowType: "USER_SRP_AUTH",
    },
  },
  tenantRole: "tenant",
  manager: {
    username: "John Smith",
    userId: "us-east-2:12345678-90ab-cdef-1234-567890abcdef",
    signInDetails: {
      loginId: "john.smith@example.com",
      authFlowType: "USER_SRP_AUTH",
    },
  },
  managerRole: "manager",
};
