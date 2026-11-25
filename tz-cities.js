/* Offline IANA timezone -> default city map for Nordpol Web.
   Exposed on window.NordpolTzCities with zero build step. */
(() => {
  const RAW = {
    "Europe/Copenhagen": ["Copenhagen", 55.68, 12.57],
    "Europe/Stockholm": ["Stockholm", 59.33, 18.07],
    "Europe/Oslo": ["Oslo", 59.91, 10.75],
    "Europe/Helsinki": ["Helsinki", 60.17, 24.94],
    "Europe/Mariehamn": ["Mariehamn", 60.10, 19.93],
    "Atlantic/Reykjavik": ["Reykjavik", 64.15, -21.94],
    "Atlantic/Faroe": ["Tórshavn", 62.01, -6.77],
    "America/Nuuk": ["Nuuk", 64.18, -51.72],
    "America/Godthab": ["Nuuk", 64.18, -51.72],
    "Europe/London": ["London", 51.51, -0.13],
    "Europe/Dublin": ["Dublin", 53.35, -6.26],
    "Europe/Paris": ["Paris", 48.86, 2.35],
    "Europe/Brussels": ["Brussels", 50.85, 4.35],
    "Europe/Luxembourg": ["Luxembourg", 49.61, 6.13],
    "Europe/Amsterdam": ["Amsterdam", 52.37, 4.90],
    "Europe/Berlin": ["Berlin", 52.52, 13.40],
    "Europe/Busingen": ["Zurich", 47.37, 8.54],
    "Europe/Vienna": ["Vienna", 48.21, 16.37],
    "Europe/Zurich": ["Zurich", 47.37, 8.54],
    "Europe/Vaduz": ["Vaduz", 47.14, 9.52],
    "Europe/Madrid": ["Madrid", 40.42, -3.70],
    "Atlantic/Canary": ["Las Palmas", 28.12, -15.44],
    "Europe/Lisbon": ["Lisbon", 38.72, -9.14],
    "Atlantic/Azores": ["Ponta Delgada", 37.74, -25.67],
    "Atlantic/Madeira": ["Funchal", 32.65, -16.91],
    "Europe/Rome": ["Rome", 41.90, 12.50],
    "Europe/San_Marino": ["Rome", 41.90, 12.50],
    "Europe/Vatican": ["Rome", 41.90, 12.50],
    "Europe/Warsaw": ["Warsaw", 52.23, 21.01],
    "Europe/Prague": ["Prague", 50.08, 14.44],
    "Europe/Bratislava": ["Bratislava", 48.15, 17.11],
    "Europe/Budapest": ["Budapest", 47.50, 19.04],
    "Europe/Ljubljana": ["Ljubljana", 46.06, 14.51],
    "Europe/Zagreb": ["Zagreb", 45.81, 15.98],
    "Europe/Belgrade": ["Belgrade", 44.79, 20.45],
    "Europe/Athens": ["Athens", 37.98, 23.73],
    "Europe/Bucharest": ["Bucharest", 44.43, 26.10],
    "Europe/Sofia": ["Sofia", 42.70, 23.32],
    "Europe/Tallinn": ["Tallinn", 59.44, 24.75],
    "Europe/Riga": ["Riga", 56.95, 24.11],
    "Europe/Vilnius": ["Vilnius", 54.69, 25.28],
    "Europe/Kyiv": ["Kyiv", 50.45, 30.52],
    "Europe/Kiev": ["Kyiv", 50.45, 30.52],
    "Europe/Istanbul": ["Istanbul", 41.01, 28.98],
    "Europe/Moscow": ["Moscow", 55.76, 37.62],
    "America/New_York": ["New York", 40.71, -74.01],
    "America/Toronto": ["Toronto", 43.65, -79.38],
    "America/Montreal": ["Montreal", 45.50, -73.57],
    "America/Detroit": ["Detroit", 42.33, -83.05],
    "America/Chicago": ["Chicago", 41.88, -87.63],
    "America/Winnipeg": ["Winnipeg", 49.90, -97.14],
    "America/Mexico_City": ["Mexico City", 19.43, -99.13],
    "America/Monterrey": ["Monterrey", 25.69, -100.32],
    "America/Cancun": ["Cancún", 21.16, -86.85],
    "America/Denver": ["Denver", 39.74, -104.99],
    "America/Phoenix": ["Phoenix", 33.45, -112.07],
    "America/Edmonton": ["Edmonton", 53.54, -113.49],
    "America/Los_Angeles": ["Los Angeles", 34.05, -118.24],
    "America/Vancouver": ["Vancouver", 49.28, -123.12],
    "America/Anchorage": ["Anchorage", 61.22, -149.90],
    "Pacific/Honolulu": ["Honolulu", 21.31, -157.86],
    "America/Halifax": ["Halifax", 44.65, -63.57],
    "America/St_Johns": ["St. John's", 47.56, -52.71],
    "America/Sao_Paulo": ["São Paulo", -23.55, -46.63],
    "America/Rio_Branco": ["Rio Branco", -9.97, -67.81],
    "America/Manaus": ["Manaus", -3.12, -60.02],
    "America/Argentina/Buenos_Aires": ["Buenos Aires", -34.60, -58.38],
    "America/Buenos_Aires": ["Buenos Aires", -34.60, -58.38],
    "America/Santiago": ["Santiago", -33.45, -70.67],
    "America/Bogota": ["Bogotá", 4.71, -74.07],
    "America/Lima": ["Lima", -12.05, -77.04],
    "America/Caracas": ["Caracas", 10.48, -66.90],
    "America/Puerto_Rico": ["San Juan", 18.47, -66.11],
    "America/Havana": ["Havana", 23.11, -82.37],
    "America/Panama": ["Panama City", 8.98, -79.52],
    "Africa/Johannesburg": ["Johannesburg", -26.20, 28.05],
    "Africa/Cairo": ["Cairo", 30.04, 31.24],
    "Africa/Nairobi": ["Nairobi", -1.29, 36.82],
    "Africa/Lagos": ["Lagos", 6.52, 3.38],
    "Africa/Casablanca": ["Casablanca", 33.57, -7.59],
    "Asia/Dubai": ["Dubai", 25.20, 55.27],
    "Asia/Riyadh": ["Riyadh", 24.71, 46.68],
    "Asia/Jerusalem": ["Jerusalem", 31.77, 35.21],
    "Asia/Kolkata": ["New Delhi", 28.61, 77.21],
    "Asia/Calcutta": ["New Delhi", 28.61, 77.21],
    "Asia/Bangkok": ["Bangkok", 13.76, 100.50],
    "Asia/Ho_Chi_Minh": ["Ho Chi Minh City", 10.82, 106.63],
    "Asia/Jakarta": ["Jakarta", -6.21, 106.85],
    "Asia/Singapore": ["Singapore", 1.35, 103.82],
    "Asia/Kuala_Lumpur": ["Kuala Lumpur", 3.14, 101.69],
    "Asia/Manila": ["Manila", 14.60, 120.98],
    "Asia/Shanghai": ["Shanghai", 31.23, 121.47],
    "Asia/Hong_Kong": ["Hong Kong", 22.32, 114.17],
    "Asia/Taipei": ["Taipei", 25.03, 121.57],
    "Asia/Seoul": ["Seoul", 37.57, 126.98],
    "Asia/Tokyo": ["Tokyo", 35.68, 139.69],
    "Australia/Sydney": ["Sydney", -33.87, 151.21],
    "Australia/Melbourne": ["Melbourne", -37.81, 144.96],
    "Australia/Brisbane": ["Brisbane", -27.47, 153.03],
    "Australia/Adelaide": ["Adelaide", -34.93, 138.60],
    "Australia/Perth": ["Perth", -31.95, 115.86],
    "Pacific/Auckland": ["Auckland", -36.85, 174.76],
    "Pacific/Fiji": ["Suva", -18.14, 178.44]
  };

  const TZ_CITIES = Object.create(null);
  for (const [tz, [name, lat, lon]] of Object.entries(RAW)) {
    TZ_CITIES[tz] = { name, lat, lon, tz };
  }

  function browserTimeZone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      return "";
    }
  }

  function defaultHomeForTz(tz, fallbackName) {
    const zone = String(tz || browserTimeZone() || "").trim();
    if (zone && Object.prototype.hasOwnProperty.call(TZ_CITIES, zone)) {
      const c = TZ_CITIES[zone];
      return { name: c.name, lat: c.lat, lon: c.lon, tz: c.tz };
    }
    return { name: fallbackName || "Home", lat: 51.5, lon: 0, tz: zone };
  }

  window.NordpolTzCities = {
    TZ_CITIES,
    browserTimeZone,
    defaultHomeForTz
  };
})();
