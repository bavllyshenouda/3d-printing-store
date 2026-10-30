export interface GovernorateOption {
  id: string;
  en: string;
  ar: string;
  shippingFee: number;
}

export const EGYPTIAN_GOVERNORATES: GovernorateOption[] = [
  { id: "cairo", en: "Cairo", ar: "القاهرة", shippingFee: 45 },
  { id: "giza", en: "Giza", ar: "الجيزة", shippingFee: 45 },
  { id: "alexandria", en: "Alexandria", ar: "الإسكندرية", shippingFee: 60 },
  { id: "qalyubia", en: "Qalyubia", ar: "القليوبية", shippingFee: 60 },
  { id: "sharqia", en: "Sharqia", ar: "الشرقية", shippingFee: 60 },
  { id: "dakahlia", en: "Dakahlia", ar: "الدقهلية", shippingFee: 60 },
  { id: "gharbia", en: "Gharbia", ar: "الغربية", shippingFee: 60 },
  { id: "menofia", en: "Menofia", ar: "المنوفية", shippingFee: 60 },
  { id: "beheira", en: "Beheira", ar: "البحيرة", shippingFee: 60 },
  { id: "kafr_el_sheikh", en: "Kafr El Sheikh", ar: "كفر الشيخ", shippingFee: 60 },
  { id: "damietta", en: "Damietta", ar: "دمياط", shippingFee: 60 },
  { id: "port_said", en: "Port Said", ar: "بورسعيد", shippingFee: 60 },
  { id: "ismailia", en: "Ismailia", ar: "الإسماعيلية", shippingFee: 60 },
  { id: "suez", en: "Suez", ar: "السويس", shippingFee: 60 },
  { id: "fayoum", en: "Fayoum", ar: "الفيوم", shippingFee: 65 },
  { id: "beni_suef", en: "Beni Suef", ar: "بني سويف", shippingFee: 70 },
  { id: "minya", en: "Minya", ar: "المنيا", shippingFee: 75 },
  { id: "asyut", en: "Asyut", ar: "أسيوط", shippingFee: 75 },
  { id: "sohag", en: "Sohag", ar: "سوهاج", shippingFee: 80 },
  { id: "qena", en: "Qena", ar: "قنا", shippingFee: 80 },
  { id: "luxor", en: "Luxor", ar: "الأقصر", shippingFee: 85 },
  { id: "aswan", en: "Aswan", ar: "أسوان", shippingFee: 85 },
  { id: "red_sea", en: "Red Sea (Hurghada)", ar: "البحر الأحمر (الغردقة)", shippingFee: 90 },
  { id: "south_sinai", en: "South Sinai (Sharm)", ar: "جنوب سيناء (شرم الشيخ)", shippingFee: 90 },
  { id: "north_sinai", en: "North Sinai", ar: "شمال سيناء", shippingFee: 95 },
  { id: "matrouh", en: "Matrouh / North Coast", ar: "مطروح / الساحل الشمالي", shippingFee: 90 },
  { id: "new_valley", en: "New Valley", ar: "الوادي الجديد", shippingFee: 95 },
];

export function getGovernorate(nameOrId?: string | null): GovernorateOption | undefined {
  if (!nameOrId) return undefined;
  const search = nameOrId.trim().toLowerCase();
  return EGYPTIAN_GOVERNORATES.find(
    (g) =>
      g.id.toLowerCase() === search ||
      g.en.toLowerCase() === search ||
      g.ar === nameOrId.trim()
  );
}

export function getShippingFee(governorateNameOrId?: string | null): number {
  const gov = getGovernorate(governorateNameOrId);
  return gov ? gov.shippingFee : 50; // default 50 EGP
}

