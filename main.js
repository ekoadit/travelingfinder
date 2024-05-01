const axios = require('axios');
const readlineSync = require('readline-sync');

const apiUrl = 'https://api.opentripmap.com/0.1/en/places/radius';
const apiKey = '5ae2e3f221c38a28845f05b6d846ee30763e7022043ccdb84ffcdb22'; // Ganti dengan kunci API Anda dari OpenTripMap
const latitude = '51.5074'; // Koordinat London sebagai contoh
const longitude = '-0.1278';
const radius = '10000'; // Radius dalam meter

// Fungsi untuk menghitung jarak antara dua titik koordinat
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Fungsi untuk melakukan filter tempat wisata berdasarkan kategori
const filterByCategory = (places, category) => {
  return places.filter(place => place.category.includes(category));
};

// Panggil API untuk mendapatkan data tempat wisata
axios.get(`${apiUrl}?apikey=${apiKey}&radius=${radius}&lon=${longitude}&lat=${latitude}`)
  .then(response => {
    const places = response.data.features.map(place => ({
      name: place.properties.name,
      rating: place.properties.rate,
      popularity: place.properties.popularity,
      category: place.properties.kinds,
      distance: calculateDistance(latitude, longitude, place.geometry.coordinates[1], place.geometry.coordinates[0])
      // Properti lain yang diperlukan bisa ditambahkan di sini
    }));

    // Logika tambahan setelah mendapatkan data tempat wisata
    console.log('Data Tempat Wisata:', places);

    // Logika tambahan
    const sortedByRating = places.sort((a, b) => b.rating - a.rating);
    console.log('Tempat Wisata Berdasarkan Rating Tertinggi:', sortedByRating);

    // Fungsi tambahan
    const getNearestPlace = (places, userLatitude, userLongitude) => {
      let nearestPlace;
      let minDistance = Infinity;

      places.forEach(place => {
        if (place.geometry && place.geometry.coordinates) {
          const distance = calculateDistance(userLatitude, userLongitude, place.geometry.coordinates[1], place.geometry.coordinates[0]);
          if (distance < minDistance) {
            minDistance = distance;
            nearestPlace = place;
          }
        }
      });

      return nearestPlace;
    };

    const displayPlaceDetails = (places, placeName) => {
      const selectedPlace = places.find(place => place.name.toLowerCase() === placeName.toLowerCase());
      if (selectedPlace) {
        console.log('Detail Tempat Wisata:', selectedPlace);
      } else {
        console.log('Tempat wisata tidak ditemukan.');
      }
    };

    const sortByDistance = (places, userLatitude, userLongitude) => {
      return places.sort((a, b) => a.distance - b.distance);
    };

    const filterByRatingRange = (places, minRating, maxRating) => {
      return places.filter(place => place.rating >= minRating && place.rating <= maxRating);
    };

    // Contoh penggunaan fungsi tambahan
    const nearestPlace = getNearestPlace(places, latitude, longitude);
    console.log('Tempat Wisata Terdekat:', nearestPlace);

    displayPlaceDetails(places, 'London Eye');

    const sortedByDistance = sortByDistance(places, latitude, longitude);
    console.log('Tempat Wisata Berdasarkan Jarak:', sortedByDistance);

    const ratedPlaces = filterByRatingRange(places, 4, 5); // Tempat dengan rating antara 4 dan 5
    console.log('Tempat Wisata dengan Rating 4-5:', ratedPlaces);

    // Mulai interaksi dengan pengguna untuk memilih kategori tempat wisata
    const showCategoryOptions = () => {
      console.log('Pilih kategori tempat wisata:');
      console.log('1. Alam');
      console.log('2. Sejarah');
      console.log('3. Makanan');
    };

    // Fungsi untuk menampilkan hasil rekomendasi
    const displayRecommendations = (places) => {
      console.log('Hasil Rekomendasi:');
      places.forEach(place => {
        console.log(`- ${place.name} (${place.category}), Rating: ${place.rating}, Jarak: ${place.distance} meter`);
      });
    };

    // Fungsi untuk memulai interaksi dengan pengguna
    const askCategory = () => {
      showCategoryOptions(); // Menampilkan pilihan kategori
      const answer = readlineSync.question('Masukkan pilihan kategori (1/2/3): ');

      let category;
      switch (answer) {
        case '1':
          category = 'natural';
          break;
        case '2':
          category = 'historic';
          break;
        case '3':
          category = 'restaurant';
          break;
        case 'exit':
          console.log('Terima kasih telah menggunakan aplikasi.');
          return;
        default:
          console.log('Pilihan kategori tidak valid.');
          askCategory(); // Mengulang pertanyaan jika input tidak valid
          return;
      }

      // Filter tempat wisata berdasarkan kategori yang dipilih
      const filteredPlaces = filterByCategory(places, category);

      // Tampilkan hasil rekomendasi
      displayRecommendations(filteredPlaces);

      // Menanyakan apakah pengguna ingin melihat detail atau keluar
      const detailAnswer = readlineSync.question('Apakah Anda ingin melihat detail tempat wisata tertentu? (ya/tidak): ');
      if (detailAnswer.toLowerCase() === 'ya') {
        const placeName = readlineSync.question('Masukkan nama tempat wisata yang ingin dilihat detailnya: ');
        displayPlaceDetails(filteredPlaces, placeName);
      }

      console.log('Terima kasih telah menggunakan aplikasi.');
    };

    // Memulai interaksi dengan pengguna
    askCategory();
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });
