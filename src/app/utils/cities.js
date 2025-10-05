const cities = [
  // Major Maharashtra Cities
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567 },
  { name: 'Nagpur', lat: 21.1458, lon: 79.0882 },
  { name: 'Nashik', lat: 19.9975, lon: 73.7898 },
  { name: 'Aurangabad', lat: 19.8762, lon: 75.3433 },
  { name: 'Solapur', lat: 17.6599, lon: 75.9064 },
  { name: 'Kolhapur', lat: 16.7050, lon: 74.2433 },
  { name: 'Thane', lat: 19.2183, lon: 72.9781 },
  { name: 'Navi Mumbai', lat: 19.0330, lon: 73.0297 },
  { name: 'Kalyan-Dombivli', lat: 19.2403, lon: 73.1305 },
  { name: 'Vasai-Virar', lat: 19.4612, lon: 72.7985 },
  { name: 'Amravati', lat: 20.9374, lon: 77.7796 },
  { name: 'Sangli', lat: 16.8524, lon: 74.5815 },
  { name: 'Jalgaon', lat: 21.0077, lon: 75.5626 },
  { name: 'Akola', lat: 20.7002, lon: 77.0082 },
  { name: 'Latur', lat: 18.4088, lon: 76.5604 },
  { name: 'Dhule', lat: 20.9042, lon: 74.7749 },
  { name: 'Ahmednagar', lat: 19.0948, lon: 74.7480 },
  { name: 'Chandrapur', lat: 19.9615, lon: 79.2961 },
  { name: 'Parbhani', lat: 19.2608, lon: 76.7611 },
  { name: 'Ichalkaranji', lat: 16.6980, lon: 74.4587 },
  { name: 'Jalna', lat: 19.8347, lon: 75.8800 },
  { name: 'Bhusawal', lat: 21.0443, lon: 75.7849 },
  { name: 'Panvel', lat: 18.9894, lon: 73.1103 },
  { name: 'Satara', lat: 17.6805, lon: 73.9993 },
  { name: 'Beed', lat: 18.9894, lon: 75.7497 },
  { name: 'Yavatmal', lat: 20.3897, lon: 78.1304 },
  { name: 'Achalpur', lat: 21.2567, lon: 77.5101 },
  { name: 'Osmanabad', lat: 18.1760, lon: 76.0395 },
  { name: 'Nanded', lat: 19.1383, lon: 77.3210 },
  { name: 'Wardha', lat: 20.7453, lon: 78.5975 },
  { name: 'Udgir', lat: 18.3926, lon: 77.1173 },
  { name: 'Hinganghat', lat: 20.5489, lon: 78.8343 },
  { name: 'Ratnagiri', lat: 16.9902, lon: 73.3120 },
  { name: 'Phaltan', lat: 17.9914, lon: 74.4322 },
  { name: 'Gondia', lat: 21.4539, lon: 80.1939 },
  { name: 'Bhandara', lat: 21.1704, lon: 79.6520 },
  { name: 'Washim', lat: 20.1101, lon: 77.1331 },
  { name: 'Hingoli', lat: 19.7160, lon: 77.1474 },
  { name: 'Baramati', lat: 18.1502, lon: 74.5770 },
  { name: 'Malegaon', lat: 20.5579, lon: 74.5287 },
  { name: 'Pandharpur', lat: 17.6792, lon: 75.3303 },
  { name: 'Bid', lat: 18.9894, lon: 75.7497 },
  { name: 'Amalner', lat: 21.0390, lon: 75.0577 },
  { name: 'Ambajogai', lat: 18.7312, lon: 76.3828 },
  { name: 'Manjlegaon', lat: 18.8753, lon: 76.4587 },
  { name: 'Parli Vaijnath', lat: 18.8541, lon: 76.4201 },
  { name: 'Buldhana', lat: 20.5311, lon: 76.1847 },
  { name: 'Gadhinglaj', lat: 16.2220, lon: 74.3502 },
  { name: 'Karad', lat: 17.2889, lon: 74.1820 },
  { name: 'Wai', lat: 17.9537, lon: 73.8900 },
  { name: 'Paithan', lat: 19.4760, lon: 75.3820 },
  { name: 'Lonavala', lat: 18.7537, lon: 73.4066 },
  { name: 'Alibag', lat: 18.6414, lon: 72.8722 },
  
  // Other Major Indian Cities
  { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
  { name: 'Lucknow', lat: 26.8467, lon: 80.9462 },
  { name: 'Belagavi', lat: 15.8497, lon: 74.4977 },
];

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

export function getNearestCity(latitude, longitude) {
  if (!latitude || !longitude) return 'Unknown';

  let nearestCity = cities[0];
  let minDistance = getDistance(latitude, longitude, cities[0].lat, cities[0].lon);

  for (const city of cities) {
    const distance = getDistance(latitude, longitude, city.lat, city.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }

  return nearestCity.name;
}