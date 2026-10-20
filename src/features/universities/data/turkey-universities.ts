export type TurkeyUniversityOption = {
  city?: string;
  country: string;
  domain: string;
  name: string;
  website: string;
};

export const TURKEY_UNIVERSITY_OPTIONS: TurkeyUniversityOption[] = [
  university("İstanbul Texniki Universiteti", "Istanbul", "itu.edu.tr"),
  university("Istanbul University", "Istanbul", "istanbul.edu.tr"),
  university("Bogazici University", "Istanbul", "boun.edu.tr"),
  university("Middle East Technical University", "Ankara", "metu.edu.tr"),
  university("Ankara University", "Ankara", "ankara.edu.tr"),
  university("Hacettepe University", "Ankara", "hacettepe.edu.tr"),
  university("Bilkent University", "Ankara", "bilkent.edu.tr", "https://w3.bilkent.edu.tr"),
  university("Koc University", "Istanbul", "ku.edu.tr"),
  university("Sabanci University", "Istanbul", "sabanciuniv.edu"),
  university("Yildiz Technical University", "Istanbul", "yildiz.edu.tr"),
  university("Marmara University", "Istanbul", "marmara.edu.tr"),
  university("Galatasaray University", "Istanbul", "gsu.edu.tr"),
  university("Istanbul Medeniyet University", "Istanbul", "medeniyet.edu.tr"),
  university("Istanbul Aydin University", "Istanbul", "aydin.edu.tr"),
  university("Istanbul Medipol University", "Istanbul", "medipol.edu.tr"),
  university("Bahçeşehir University", "Istanbul", "bau.edu.tr"),
  university("Istanbul Bilgi University", "Istanbul", "bilgi.edu.tr"),
  university("Yeditepe University", "Istanbul", "yeditepe.edu.tr"),
  university("Ozyegin University", "Istanbul", "ozyegin.edu.tr"),
  university("Istanbul Gelisim University", "Istanbul", "gelisim.edu.tr"),
  university("Istanbul Arel University", "Istanbul", "arel.edu.tr"),
  university("Istinye University", "Istanbul", "istinye.edu.tr"),
  university("Altinbas University", "Istanbul", "altinbas.edu.tr"),
  university("Acibadem University", "Istanbul", "acibadem.edu.tr"),
  university("Beykent University", "Istanbul", "beykent.edu.tr"),
  university("Uskudar University", "Istanbul", "uskudar.edu.tr"),
  university("MEF University", "Istanbul", "mef.edu.tr"),
  university("Piri Reis University", "Istanbul", "pirireis.edu.tr"),
  university("Dogus University", "Istanbul", "dogus.edu.tr"),
  university("Isik University", "Istanbul", "isikun.edu.tr"),
  university("Istanbul Sabahattin Zaim University", "Istanbul", "izu.edu.tr"),
  university("Istanbul Kultur University", "Istanbul", "iku.edu.tr"),
  university("Istanbul Commerce University", "Istanbul", "ticaret.edu.tr"),
  university("Izmir Institute of Technology", "Izmir", "iyte.edu.tr"),
  university("Ege University", "Izmir", "ege.edu.tr"),
  university("Dokuz Eylul University", "Izmir", "deu.edu.tr"),
  university("Izmir Katip Celebi University", "Izmir", "ikcu.edu.tr"),
  university("Izmir University of Economics", "Izmir", "ieu.edu.tr"),
  university("Yasar University", "Izmir", "yasar.edu.tr"),
  university("Anadolu University", "Eskisehir", "anadolu.edu.tr"),
  university("Eskisehir Osmangazi University", "Eskisehir", "ogu.edu.tr"),
  university("Bursa Uludag University", "Bursa", "uludag.edu.tr"),
  university("Kocaeli University", "Kocaeli", "kocaeli.edu.tr"),
  university("Sakarya University", "Sakarya", "sakarya.edu.tr"),
  university("Akdeniz University", "Antalya", "akdeniz.edu.tr"),
  university("Cukurova University", "Adana", "cu.edu.tr"),
  university("Mersin University", "Mersin", "mersin.edu.tr"),
  university("Gaziantep University", "Gaziantep", "gantep.edu.tr"),
  university("Erciyes University", "Kayseri", "erciyes.edu.tr"),
  university("Selcuk University", "Konya", "selcuk.edu.tr"),
  university("Necmettin Erbakan University", "Konya", "erbakan.edu.tr"),
  university("Pamukkale University", "Denizli", "pau.edu.tr"),
  university("Aydin Adnan Menderes University", "Aydin", "adu.edu.tr"),
  university("Manisa Celal Bayar University", "Manisa", "cbu.edu.tr"),
  university("Mugla Sitki Kocman University", "Mugla", "mu.edu.tr"),
  university("Balikesir University", "Balikesir", "balikesir.edu.tr"),
  university("Canakkale Onsekiz Mart University", "Canakkale", "comu.edu.tr"),
  university("Trakya University", "Edirne", "trakya.edu.tr"),
  university("Tekirdag Namik Kemal University", "Tekirdag", "nku.edu.tr"),
  university("Ondokuz Mayis University", "Samsun", "omu.edu.tr"),
  university("Karadeniz Technical University", "Trabzon", "ktu.edu.tr"),
  university("Ataturk University", "Erzurum", "atauni.edu.tr"),
  university("Inonu University", "Malatya", "inonu.edu.tr"),
  university("Firat University", "Elazig", "firat.edu.tr"),
  university("Dicle University", "Diyarbakir", "dicle.edu.tr"),
  university("Harran University", "Sanliurfa", "harran.edu.tr"),
  university("Van Yuzuncu Yil University", "Van", "yyu.edu.tr"),
  university("Sivas Cumhuriyet University", "Sivas", "cumhuriyet.edu.tr"),
  university("Tokat Gaziosmanpasa University", "Tokat", "gop.edu.tr"),
  university("Kirikkale University", "Kirikkale", "kku.edu.tr"),
  university("Afyon Kocatepe University", "Afyonkarahisar", "aku.edu.tr"),
  university("Kutahya Dumlupinar University", "Kutahya", "dpu.edu.tr"),
  university("Suleyman Demirel University", "Isparta", "sdu.edu.tr"),
  university("Bolu Abant Izzet Baysal University", "Bolu", "ibu.edu.tr"),
  university("Zonguldak Bulent Ecevit University", "Zonguldak", "beun.edu.tr"),
  university("Kahramanmaras Sutcu Imam University", "Kahramanmaras", "ksu.edu.tr"),
  university("Recep Tayyip Erdogan University", "Rize", "erdogan.edu.tr"),
  university("Ordu University", "Ordu", "odu.edu.tr"),
  university("Giresun University", "Giresun", "giresun.edu.tr"),
  university("Aksaray University", "Aksaray", "aksaray.edu.tr"),
  university("Nevsehir Haci Bektas Veli University", "Nevsehir", "nevsehir.edu.tr"),
  university("Karabuk University", "Karabuk", "karabuk.edu.tr"),
  university("Bartin University", "Bartin", "bartin.edu.tr"),
  university("Sinop University", "Sinop", "sinop.edu.tr"),
  university("Kastamonu University", "Kastamonu", "kastamonu.edu.tr"),
  university("TOBB University of Economics and Technology", "Ankara", "etu.edu.tr"),
  university("Baskent University", "Ankara", "baskent.edu.tr"),
  university("Atilim University", "Ankara", "atilim.edu.tr"),
  university("Cankaya University", "Ankara", "cankaya.edu.tr"),
  university("TED University", "Ankara", "tedu.edu.tr"),
  university("Ankara Medipol University", "Ankara", "ankaramedipol.edu.tr"),
];

export function searchTurkeyUniversities(search: string, limit = 120) {
  const normalizedSearch = normalizeSearch(search);

  if (!normalizedSearch) {
    return TURKEY_UNIVERSITY_OPTIONS.slice(0, limit);
  }

  return TURKEY_UNIVERSITY_OPTIONS.filter((university) =>
    normalizeSearch(
      [
        university.name,
        university.city ?? "",
        university.domain,
        university.website,
        university.country,
      ].join(" "),
    ).includes(normalizedSearch),
  ).slice(0, limit);
}

export function mergeTurkeyUniversityOptions(
  primary: TurkeyUniversityOption[],
  fallback: TurkeyUniversityOption[],
  limit = 120,
) {
  const seen = new Set<string>();
  const merged: TurkeyUniversityOption[] = [];

  for (const university of [...primary, ...fallback]) {
    const key = normalizeSearch(university.domain || university.name);

    if (!university.name || seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(university);
  }

  return merged.slice(0, limit);
}

export function inferTurkeyUniversityCity(name: string) {
  const match = TURKEY_UNIVERSITY_OPTIONS.find(
    (university) => normalizeSearch(university.name) === normalizeSearch(name),
  );

  if (match?.city) {
    return match.city;
  }

  const normalizedName = normalizeSearch(name);

  if (
    normalizedName.includes("istanbul") ||
    normalizedName.includes("bogazici") ||
    normalizedName.includes("bahcesehir") ||
    normalizedName.includes("marmara") ||
    normalizedName.includes("koc") ||
    normalizedName.includes("sabanci")
  ) {
    return "Istanbul";
  }

  if (
    normalizedName.includes("ankara") ||
    normalizedName.includes("hacettepe") ||
    normalizedName.includes("bilkent") ||
    normalizedName.includes("middle east technical")
  ) {
    return "Ankara";
  }

  if (normalizedName.includes("ege") || normalizedName.includes("izmir")) {
    return "Izmir";
  }

  return "";
}

function university(
  name: string,
  city: string,
  domain: string,
  website = `https://www.${domain}`,
): TurkeyUniversityOption {
  return {
    city,
    country: "Türkiyə",
    domain,
    name,
    website,
  };
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}
