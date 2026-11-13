import sectorContractingImg from '../assets/images/sector_contracting_1794544467171.jpg';
import sectorRealEstateImg from '../assets/images/sector_real_estate_1794544467222.jpg';
import sectorHealthcareImg from '../assets/images/sector_healthcare_1794544466669.jpg';
import sectorSolarImg from '../assets/images/sector_solar_1794544467006.jpg';
import productFirePumpImg from '../assets/images/product_fire_pump_1794544467868.jpg';

export {
  sectorContractingImg,
  sectorRealEstateImg,
  sectorHealthcareImg,
  sectorSolarImg,
  productFirePumpImg,
};

export interface StaticLibraryAsset {
  url: string;
  name: string;
  folder: string;
}

export const STATIC_CORPORATE_ASSETS: StaticLibraryAsset[] = [
  {
    url: '/assets/aistudio/image_ad8ad2f2-dc9e-407d-af3f-5c7149625b89_6b02dcf2.jpg',
    name: 'Official United Park Co. (PARK) Logo',
    folder: 'general',
  },
  {
    url: '/images/hero-pumps.jpg',
    name: 'Industrial Pumps & Engineering Facility',
    folder: 'sectors',
  },
  {
    url: sectorContractingImg,
    name: 'Contracting & MEP Infrastructure Site',
    folder: 'sectors',
  },
  {
    url: sectorRealEstateImg,
    name: 'Jeddah Commercial Real Estate Tower & Plaza',
    folder: 'sectors',
  },
  {
    url: sectorHealthcareImg,
    name: 'Modern Outpatient Medical Clinic Interior',
    folder: 'sectors',
  },
  {
    url: sectorSolarImg,
    name: 'Solar Photovoltaic Array & Clean Power Plant',
    folder: 'sectors',
  },
  {
    url: '/images/product-pump.jpg',
    name: 'Industrial Vertical Multistage Pump',
    folder: 'products',
  },
  {
    url: productFirePumpImg,
    name: 'NFPA-20 Fire-Fighting Pump Skid Package',
    folder: 'products',
  },
  {
    url: '/images/facility-pump-room.jpg',
    name: 'Industrial Booster & Pump Room',
    folder: 'projects',
  },
  {
    url: '/images/sector-utilities.jpg',
    name: 'Municipal Utilities & Energy Grid',
    folder: 'projects',
  },
  {
    url: '/images/partners-banner.jpg',
    name: 'Corporate Skyline & Partner Banner',
    folder: 'banners',
  },
];
