export type SectorKey =
  | 'industrial-engineering'
  | 'contracting'
  | 'real-estate'
  | 'healthcare'
  | 'solar-energy';

export interface SectorDefinition {
  key: SectorKey;
  pageSlug: string;
  route: string;
  zoneCode: string;
  accentHex: string;
  iconName: 'Cog' | 'HardHat' | 'Building2' | 'Stethoscope' | 'Sun';
  imageUrl: string;
  en: {
    shortLabel: string;
    title: string;
    subtitle: string;
    summary: string;
    highlights: string[];
  };
  ar: {
    shortLabel: string;
    title: string;
    subtitle: string;
    summary: string;
    highlights: string[];
  };
}

export const GROUP_SECTORS: SectorDefinition[] = [
  {
    key: 'industrial-engineering',
    pageSlug: 'park-pumps',
    route: '/divisions/industrial-engineering',
    zoneCode: '01',
    accentHex: '#2574C7',
    iconName: 'Cog',
    imageUrl: '/images/hero-pumps.jpg',
    en: {
      shortLabel: 'Industrial & Eng.',
      title: 'Industrial & Engineering Solutions',
      subtitle: 'Pumping stations, fluid networks, water treatment & mechanical skids',
      summary:
        'Authorized engineering supply, sizing, commissioning, and after-sales maintenance of industrial pumping, water treatment, and fire-safety systems.',
      highlights: [
        'Industrial & Commercial Pumping Systems',
        'Water Treatment, Dosing & Booster Plants',
        'Authorized OEM Global Partnerships Since 1989',
      ],
    },
    ar: {
      shortLabel: 'الصناعة والهندسة',
      title: 'الحلول الصناعية والهندسية',
      subtitle: 'محطات الضخ، شبكات المياه، أنظمة المعالجة والمعدات الميكانيكية',
      summary:
        'توريد وتصميم وتشغيل وصيانة أنظمة الضخ الصناعية ومعالجة المياه وحلول السلامة بالتعاون مع كبرى الشركات المصنعة العالمية.',
      highlights: [
        'أنظمة الضخ الصناعية والتجارية',
        'محطات معالجة المياه وتعزيز الضغط',
        'شراكات عالمية معتمدة منذ عام ١٩٨٩',
      ],
    },
  },
  {
    key: 'contracting',
    pageSlug: 'park-contracting',
    route: '/divisions/contracting',
    zoneCode: '02',
    accentHex: '#D93829',
    iconName: 'HardHat',
    imageUrl: '/images/sector-utilities.jpg',
    en: {
      shortLabel: 'Contracting',
      title: 'Contracting & Construction',
      subtitle: 'Turnkey electromechanical, civil & municipal infrastructure execution',
      summary:
        'Specialized civil and MEP contracting delivering structural developments, utility pipework networks, and turnkey facility installations across Saudi Arabia.',
      highlights: [
        'Electromechanical & Infrastructure Contracting',
        'Testing, Commissioning & Preventive Maintenance',
        'Integrated Project Delivery Across KSA',
      ],
    },
    ar: {
      shortLabel: 'المقاولات',
      title: 'المقاولات والإنشاءات',
      subtitle: 'تنفيذ المشاريع الإنشائية والكهروميكانيكية والبنية التحتية',
      summary:
        'مقاولات متخصصة للأعمال الإنشائية والكهروميكانيكية وشبكات البنية التحتية مع الفحص والتشغيل التجريبي وعقود الصيانة الوقائية.',
      highlights: [
        'المقاولات الكهروميكانيكية والبنية التحتية',
        'أعمال الفحص والتشغيل التجريبي والضمان',
        'تنفيذ متكامل للمشاريع في أنحاء المملكة',
      ],
    },
  },
  {
    key: 'real-estate',
    pageSlug: 'park-real-estate',
    route: '/divisions/real-estate',
    zoneCode: '03',
    accentHex: '#3B82F6',
    iconName: 'Building2',
    imageUrl: '/images/partners-banner.jpg',
    en: {
      shortLabel: 'Real Estate',
      title: 'Real Estate Development',
      subtitle: 'Modern residential compounds, commercial towers & urban assets',
      summary:
        'Planning, development, and long-term asset stewardship of contemporary residential and commercial properties engineered for enduring urban value.',
      highlights: [
        'Commercial & Residential Developments',
        'Integrated MEP & Utility Readiness',
        'Long-Term Property & Asset Stewardship',
      ],
    },
    ar: {
      shortLabel: 'التطوير العقاري',
      title: 'التطوير العقاري',
      subtitle: 'الأبراج التجارية والمجمعات السكنية وتطوير الأصول الحضرية',
      summary:
        'تخطيط وتطوير وإدارة الأصول العقارية السكنية والتجارية الحديثة وفق معايير هندسية مستدامة تواكب النهضة العمرانية في المملكة.',
      highlights: [
        'تطوير المجمعات السكنية والأبراج التجارية',
        'بنية تحتية ومرافق هندسية متكاملة',
        'إدارة مستدامة للأصول والممتلكات',
      ],
    },
  },
  {
    key: 'healthcare',
    pageSlug: 'park-healthcare',
    route: '/divisions/healthcare',
    zoneCode: '04',
    accentHex: '#0EA5E9',
    iconName: 'Stethoscope',
    imageUrl: '/images/facility-pump-room.jpg',
    en: {
      shortLabel: 'Healthcare',
      title: 'Medical Clinics & Healthcare',
      subtitle: 'Contemporary outpatient clinics & integrated healthcare environments',
      summary:
        'Developing and supporting modern medical clinics and healthcare facilities designed around patient-centered architecture and clinical reliability.',
      highlights: [
        'Modern Outpatient Medical Clinics',
        'Patient-Centered Architectural Environments',
        'Integrated Clinical Utility & Facility Standards',
      ],
    },
    ar: {
      shortLabel: 'الرعاية الصحية',
      title: 'العيادات الطبية والرعاية الصحية',
      subtitle: 'عيادات طبية حديثة وبيئات رعاية صحية متكاملة',
      summary:
        'تطوير وتشغيل ودعم العيادات الطبية والمرافق الصحية الحديثة وفق تصميمات معمارية متطورة ومعايير اعتمادية عالية لخدمة المرضى.',
      highlights: [
        'عيادات طبية ومراكز رعاية تخصصية حديثة',
        'بيئات معمارية مصممة لراحة وسلامة المريض',
        'أنظمة مرافق طبية موثوقة ومستدامة',
      ],
    },
  },
  {
    key: 'solar-energy',
    pageSlug: 'park-solar-energy',
    route: '/divisions/solar-energy',
    zoneCode: '05',
    accentHex: '#F59E0B',
    iconName: 'Sun',
    imageUrl: '/images/sector-utilities.jpg',
    en: {
      shortLabel: 'Solar Energy',
      title: 'Solar Energy Systems',
      subtitle: 'Photovoltaic arrays, solar pumping & sustainable clean power',
      summary:
        'Deploying high-efficiency photovoltaic installations, solar-powered pumping systems, and clean energy infrastructure supporting Saudi sustainability goals.',
      highlights: [
        'Commercial & Industrial Photovoltaic Arrays',
        'Solar Water Pumping & Off-Grid Integration',
        'Sustainable Energy Infrastructure Solutions',
      ],
    },
    ar: {
      shortLabel: 'الطاقة الشمسية',
      title: 'أنظمة الطاقة الشمسية',
      subtitle: 'محطات الطاقة الكهروضوئية والضخ الشمسي والطاقة المتجددة',
      summary:
        'تصميم وتنفيذ أنظمة الطاقة الشمسية الكهروضوئية وحلول الضخ بالطاقة الشمسية لدعم التحول نحو الطاقة النظيفة والاستدامة في المملكة.',
      highlights: [
        'أنظمة الألواح الشمسية للمنشآت التجارية والصناعية',
        'حلول ضخ المياه بالطاقة الشمسية',
        'بنية تحتية داعمة للطاقة المتجددة والاستدامة',
      ],
    },
  },
];

export function getSectorByKey(key: string): SectorDefinition | undefined {
  if (key === 'pumps') return GROUP_SECTORS[0];
  return GROUP_SECTORS.find((s) => s.key === key);
}
