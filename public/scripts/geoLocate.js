
async function getLocationData() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject('Geolocation not supported');
    }

    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const { latitude, longitude } = coords;

      // Reverse geocode with Nominatim
      const nomURL = 'https://nominatim.openstreetmap.org/reverse?' +
        new URLSearchParams({
          format: 'json',
          lat: latitude,
          lon: longitude,
          addressdetails: 1,
          zoom: 14
        });

      try {
        const ipRes = await fetch('https://ipapi.co/json/');
        const { city, region } = await ipRes.json();

        const nomRes = await fetch(nomURL);
        const nomData = await nomRes.json();
        const neighbourhood = nomData.address?.neighbourhood || 'your area';
        resolve({ latitude, longitude, neighbourhood, city });
      } catch (err) {
        reject('Reverse geocoding failed');
      }
    }, reject);
  });
}
