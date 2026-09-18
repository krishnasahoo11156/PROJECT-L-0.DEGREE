// ─── LIVING ATLAS — MOCK DATA ────────────────────────────────────────────────
// Realistic sample data. All callsigns, routes, and coordinates are plausible.

var AIRCRAFT = [
  {
    id: 'SAS4872', type: 'aircraft',
    callsign: 'SAS4872', airline: 'Scandinavian Airlines',
    aircraftType: 'Airbus A321neo', registration: 'SE-DOY', squawk: '3842',
    origin: { code: 'ARN', name: 'Stockholm Arlanda', country: 'Sweden', lat: 59.651, lng: 17.918 },
    destination: { code: 'JFK', name: 'New York JFK', country: 'United States', lat: 40.641, lng: -73.778 },
    altitude: 38400, speed: 487, heading: 247, verticalRate: -200,
    lat: 58.3, lng: -14.2, progress: 0.67,
    timestamp: '2026-09-14T21:43:00Z',
    isCuriosity: true,
    curiosityNote: 'Route deviates north of the active North Atlantic Track System corridor',
    trajectory: [
      [59.651, 17.918],[60.2, 10.5],[61.8, 0.2],[62.5,-10.1],
      [61.9,-20.5],[59.8,-30.2],[58.3,-14.2],
      [55.0,-45.0],[50.0,-55.0],[44.0,-65.0],[40.641,-73.778]
    ],
    altitudeHistory: [36200, 37100, 37800, 38400, 38400, 38200, 38000, 37600, 37200, 38400],
    currentWaypointIdx: 6
  },
  {
    id: 'BAW118', type: 'aircraft',
    callsign: 'BAW118', airline: 'British Airways',
    aircraftType: 'Boeing 777-300ER', registration: 'G-STBB', squawk: '4521',
    origin: { code: 'LHR', name: 'London Heathrow', country: 'United Kingdom', lat: 51.477, lng: -0.461 },
    destination: { code: 'LAX', name: 'Los Angeles International', country: 'United States', lat: 33.943, lng: -118.408 },
    altitude: 41000, speed: 512, heading: 310, verticalRate: 0,
    lat: 54.5, lng: -28.4, progress: 0.38,
    timestamp: '2026-09-14T21:43:00Z',
    isCuriosity: false,
    trajectory: [
      [51.477,-0.461],[52.5,-10.0],[53.0,-20.0],[54.5,-28.4],
      [52.0,-40.0],[48.0,-55.0],[40.0,-80.0],[33.943,-118.408]
    ],
    altitudeHistory: [41000,41000,41000,41000,41000,41000,41000,41000,41000,41000],
    currentWaypointIdx: 3
  },
  {
    id: 'DLH441', type: 'aircraft',
    callsign: 'DLH441', airline: 'Lufthansa',
    aircraftType: 'Airbus A380-800', registration: 'D-AIML', squawk: '2341',
    origin: { code: 'FRA', name: 'Frankfurt Airport', country: 'Germany', lat: 50.033, lng: 8.571 },
    destination: { code: 'ORD', name: "Chicago O'Hare", country: 'United States', lat: 41.978, lng: -87.905 },
    altitude: 39000, speed: 498, heading: 305, verticalRate: 0,
    lat: 55.2, lng: -20.1, progress: 0.52,
    isCuriosity: false,
    trajectory: [
      [50.033,8.571],[52.0,0.0],[54.0,-10.0],[55.2,-20.1],
      [54.0,-35.0],[51.0,-55.0],[41.978,-87.905]
    ],
    altitudeHistory: [39000,39000,39000,39000,39000,39000,39000,39000,39000,39000],
    currentWaypointIdx: 3
  },
  {
    id: 'QFA1', type: 'aircraft',
    callsign: 'QFA1', airline: 'Qantas',
    aircraftType: 'Boeing 787-9 Dreamliner', registration: 'VH-ZNA', squawk: '7701',
    origin: { code: 'SYD', name: 'Sydney Kingsford Smith', country: 'Australia', lat: -33.946, lng: 151.177 },
    destination: { code: 'LAX', name: 'Los Angeles International', country: 'United States', lat: 33.943, lng: -118.408 },
    altitude: 42000, speed: 528, heading: 65, verticalRate: 0,
    lat: 5.2, lng: -168.4, progress: 0.71,
    isCuriosity: false,
    trajectory: [
      [-33.946,151.177],[-20.0,170.0],[-10.0,180.0],[5.2,-168.4],
      [15.0,-160.0],[25.0,-150.0],[33.943,-118.408]
    ],
    altitudeHistory: [42000,42000,42000,42000,42000,42000,42000,42000,42000,42000],
    currentWaypointIdx: 3
  },
  {
    id: 'UAE201', type: 'aircraft',
    callsign: 'UAE201', airline: 'Emirates',
    aircraftType: 'Airbus A380-800', registration: 'A6-EVE', squawk: '6621',
    origin: { code: 'DXB', name: 'Dubai International', country: 'UAE', lat: 25.253, lng: 55.364 },
    destination: { code: 'LHR', name: 'London Heathrow', country: 'United Kingdom', lat: 51.477, lng: -0.461 },
    altitude: 40000, speed: 485, heading: 315, verticalRate: 0,
    lat: 38.0, lng: 25.4, progress: 0.45,
    isCuriosity: false,
    trajectory: [
      [25.253,55.364],[30.0,45.0],[35.0,35.0],[38.0,25.4],
      [42.0,15.0],[47.0,5.0],[51.477,-0.461]
    ],
    altitudeHistory: [40000,40000,40000,40000,40000,40000,40000,40000,40000,40000],
    currentWaypointIdx: 3
  },
  {
    id: 'KAL902', type: 'aircraft',
    callsign: 'KAL902', airline: 'Korean Air',
    aircraftType: 'Boeing 747-8i', registration: 'HL7644', squawk: '3312',
    origin: { code: 'ICN', name: 'Incheon International', country: 'South Korea', lat: 37.469, lng: 126.451 },
    destination: { code: 'ANC', name: 'Ted Stevens Anchorage', country: 'United States', lat: 61.174, lng: -149.996 },
    altitude: 35500, speed: 475, heading: 30, verticalRate: 0,
    lat: 52.1, lng: 165.4, progress: 0.48,
    isCuriosity: true,
    curiosityNote: 'Routing unusually close to the Aleutian Islands restricted airspace boundary',
    trajectory: [
      [37.469,126.451],[42.0,140.0],[48.0,155.0],[52.1,165.4],
      [56.0,175.0],[59.0,-170.0],[61.174,-149.996]
    ],
    altitudeHistory: [35500,35500,35200,35000,35500,35500,35500,35500,35500,35500],
    currentWaypointIdx: 3
  },
  {
    id: 'AFR082', type: 'aircraft',
    callsign: 'AFR082', airline: 'Air France',
    aircraftType: 'Boeing 777-200ER', registration: 'F-GSPJ', squawk: '4432',
    origin: { code: 'CDG', name: 'Charles de Gaulle', country: 'France', lat: 49.009, lng: 2.547 },
    destination: { code: 'GRU', name: 'São Paulo Guarulhos', country: 'Brazil', lat: -23.432, lng: -46.469 },
    altitude: 39500, speed: 502, heading: 215, verticalRate: 0,
    lat: 5.4, lng: -20.1, progress: 0.60,
    isCuriosity: false,
    trajectory: [
      [49.009,2.547],[40.0,-5.0],[25.0,-15.0],[5.4,-20.1],
      [-5.0,-25.0],[-15.0,-35.0],[-23.432,-46.469]
    ],
    altitudeHistory: [39500,39500,39500,39500,39500,39500,39500,39500,39500,39500],
    currentWaypointIdx: 3
  },
  {
    id: 'THY001', type: 'aircraft',
    callsign: 'THY001', airline: 'Turkish Airlines',
    aircraftType: 'Airbus A350-900', registration: 'TC-LGA', squawk: '5512',
    origin: { code: 'IST', name: 'Istanbul Airport', country: 'Turkey', lat: 41.275, lng: 28.752 },
    destination: { code: 'JFK', name: 'New York JFK', country: 'United States', lat: 40.641, lng: -73.778 },
    altitude: 37800, speed: 492, heading: 295, verticalRate: 0,
    lat: 42.1, lng: -10.2, progress: 0.55,
    isCuriosity: false,
    trajectory: [
      [41.275,28.752],[43.0,15.0],[43.5,5.0],[42.1,-10.2],
      [40.5,-30.0],[40.641,-73.778]
    ],
    altitudeHistory: [37800,37800,37800,37800,37800,37800,37800,37800,37800,37800],
    currentWaypointIdx: 3
  }
];

var EVENTS = [
  {
    id: 'EVT001', type: 'wildfire',
    name: 'Northern California Wildfire Complex',
    lat: 39.8, lng: -122.5,
    severity: 'high', area: '127,000 acres', containment: '23%', windSpeed: '34 km/h',
    startDate: '2026-09-10', timestamp: '2026-09-14T21:00:00Z',
    isCuriosity: true,
    curiosityNote: 'Rapid perimeter expansion — 34% growth in 6 hours',
    description: 'Multiple fires merging near Mendocino National Forest. Unusual spread detected.'
  },
  {
    id: 'EVT002', type: 'earthquake',
    name: 'M5.2 Earthquake — Tohoku',
    lat: 35.6, lng: 141.8,
    severity: 'medium', magnitude: 5.2, depth: '42 km',
    timestamp: '2026-09-14T19:31:22Z', isCuriosity: false,
    description: 'Moderate earthquake off the Pacific coast of Japan, Tohoku region.'
  },
  {
    id: 'EVT003', type: 'cyclone',
    name: 'Cyclonic Storm ARNAV',
    lat: 14.2, lng: 88.6,
    severity: 'high', windSpeed: '118 km/h', category: 'Category 1',
    timestamp: '2026-09-14T18:00:00Z', isCuriosity: true,
    curiosityNote: 'Intensification rate exceeds typical Bay of Bengal seasonal norms',
    description: 'Tropical cyclone with unusual rapid intensification in Bay of Bengal.'
  },
  {
    id: 'EVT004', type: 'volcanic',
    name: 'Teide Volcanic Unrest',
    lat: 28.3, lng: -16.6,
    severity: 'low', alertLevel: 'Yellow',
    timestamp: '2026-09-14T12:00:00Z', isCuriosity: false,
    description: 'Minor seismic activity beneath Teide volcano, Canary Islands.'
  }
];

var DISCOVERIES = [
  {
    id: '042', title: 'Unusual Flight Path',
    category: 'AVIATION', categoryIcon: '✈', status: 'OPEN',
    location: 'North Atlantic Ocean', lat: 58.3, lng: -14.2,
    region: 'North Atlantic', date: '14 September 2026', time: '21:43 UTC',
    entityId: 'SAS4872',
    observation: 'SAS4872 (Airbus A321neo, Scandinavian Airlines) observed routing approximately 340km north of the active North Atlantic Track System corridor on a flight from Stockholm Arlanda to New York JFK. Deviation detected at 58.3°N, 14.2°W — an area with substantially reduced radar coverage.',
    technicalData: {
      'CALLSIGN': 'SAS4872', 'AIRCRAFT': 'Airbus A321neo', 'OPERATOR': 'Scandinavian Airlines',
      'ALTITUDE': '38,400 ft', 'SPEED': '487 kts', 'HEADING': '247°', 'SQUAWK': '3842',
      'POSITION': '58.3°N  14.2°W', 'ORIGIN': 'Stockholm Arlanda (ARN)',
      'DESTINATION': 'New York JFK (JFK)', 'ROUTE PROGRESS': '67%', 'TIMESTAMP': '14 SEP 2026  21:43 UTC'
    },
    aiAnalysis: 'The observed trajectory deviates significantly from NAT routes published for this timeframe. Three explanations are consistent with available data:\n\n(1) Active weather avoidance — a SIGMET advisory is active in the central North Atlantic for severe turbulence, coinciding with the deviation zone.\n\n(2) ATC rerouting issued by Gander Oceanic FIR — possible given the airspace structure.\n\n(3) Pre-departure operational routing decision.\n\nThe deviation places the aircraft over a corridor with reduced ATC coverage, which is procedurally normal for oceanic airspace but unusual relative to the filed track. Insufficient information to determine cause with high confidence.',
    confidence: 72,
    relatedEvents: [
      { id: 'REL001', title: 'SAS4810 — Standard NAT Track', type: 'AVIATION', note: 'Same operator, 40 min earlier. Followed published Shanwick track without deviation.' },
      { id: 'REL002', title: 'SIGMET Juliet 07', type: 'WEATHER', note: 'Severe turbulence advisory active over central North Atlantic. Valid 19:00–23:00 UTC.' },
      { id: 'REL003', title: 'HMCS Halifax', type: 'MARITIME', note: 'Canadian naval frigate operating ~180nm south of the deviation zone.' }
    ],
    notes: '',
    trajectory: [
      [59.651,17.918],[60.2,10.5],[61.8,0.2],[62.5,-10.1],
      [61.9,-20.5],[59.8,-30.2],[58.3,-14.2]
    ]
  },
  {
    id: '041', title: 'Vessel Holding Pattern',
    category: 'MARITIME', categoryIcon: '⛵', status: 'RESOLVED',
    location: 'Suez Canal Approach', lat: 29.9, lng: 32.5,
    region: 'Middle East', date: '12 September 2026', time: '14:22 UTC',
    entityId: 'MSC-AURORA',
    observation: 'Container vessel MSC Aurora in an extended circular holding pattern ~12nm north of the Suez Canal entrance. Duration of 4.2 hours inconsistent with standard transit queuing.',
    technicalData: { 'VESSEL': 'MSC Aurora', 'TYPE': 'Container Ship', 'FLAG': 'Panama', 'LENGTH': '399m', 'POSITION': '29.9°N  32.5°E', 'HOLD DURATION': '4.2 hours' },
    aiAnalysis: 'Pattern resolved after 4.2 hours consistent with documentation or customs clearance delay. Vessel proceeded through canal without incident.',
    confidence: 85, relatedEvents: [],
    notes: 'Resolved. Likely a paperwork issue, not operationally significant.',
    trajectory: [[29.9, 32.5]]
  },
  {
    id: '040', title: 'Wildfire Perimeter Expansion',
    category: 'NATURAL EVENT', categoryIcon: '🔥', status: 'OPEN',
    location: 'Northern California, USA', lat: 39.8, lng: -122.5,
    region: 'North America', date: '10 September 2026', time: '09:00 UTC',
    entityId: 'EVT001',
    observation: 'Northern California wildfire complex showing unusual expansion. Three separate ignition points merging into a single complex event.',
    technicalData: { 'EVENT': 'Wildfire Complex', 'AREA': '127,000 acres', 'CONTAINMENT': '23%', 'WIND': '34 km/h', 'STARTED': '10 Sep 2026' },
    aiAnalysis: 'Spread rate consistent with critical fire weather. Merging of three ignition points may significantly increase containment difficulty.',
    confidence: 91, relatedEvents: [], notes: '',
    trajectory: [[39.8, -122.5]]
  },
  {
    id: '039', title: 'Low-Altitude Maritime Patrol',
    category: 'AVIATION', categoryIcon: '✈', status: 'RESOLVED',
    location: 'Norwegian Sea', lat: 70.2, lng: 5.8,
    region: 'Northern Europe', date: '8 September 2026', time: '03:17 UTC',
    entityId: 'RFF01',
    observation: 'Aircraft at low altitude over international waters in the Norwegian Sea. ADS-B track intermittent, suggesting deliberate altitude management.',
    technicalData: { 'CALLSIGN': 'RFF01', 'ALTITUDE': '800–2,400 ft (variable)', 'POSITION': '70.2°N  5.8°E' },
    aiAnalysis: 'Flight profile consistent with maritime patrol in surface search mode. Norwegian P-8 Poseidon operations confirmed during NORDIC RESPONSE 2026.',
    confidence: 88, relatedEvents: [], notes: 'NORDIC RESPONSE 2026 exercise confirmed. Routine.',
    trajectory: [[70.2, 5.8]]
  },
  {
    id: '038', title: 'Trans-Pacific Vessel Cluster',
    category: 'MARITIME', categoryIcon: '⛵', status: 'OPEN',
    location: 'Western Pacific', lat: 25.0, lng: 145.0,
    region: 'Pacific Ocean', date: '7 September 2026', time: '11:00 UTC',
    entityId: 'CLUSTER-01',
    observation: 'Seven cargo vessels in unusually close proximity at a location inconsistent with standard trans-Pacific shipping lanes.',
    technicalData: { 'VESSEL COUNT': '7', 'CLUSTER RADIUS': '~12nm', 'POSITION': '25.0°N  145.0°E' },
    aiAnalysis: 'Inconsistent with standard routing. Possible fishing support operations or fleet rendezvous coordination. Warrants monitoring.',
    confidence: 65, relatedEvents: [], notes: '',
    trajectory: [[25.0, 145.0]]
  }
];

var EXPLORER_PROFILE = {
  name: 'LOKṢA',
  totalDiscoveries: 42,
  byCategory: { aviation: 18, maritime: 9, natural: 7, space: 8 },
  regionsExplored: 14,
  joinDate: '1 July 2026',
  lastActive: '14 September 2026'
};

// Helper: interpolate lat/lng position along trajectory at progress [0..1]
function getPositionAlongTrajectory(trajectory, progress) {
  if (!trajectory || trajectory.length < 2) return [0, 0];
  const n = trajectory.length - 1;
  const t = Math.max(0, Math.min(1, progress)) * n;
  const i = Math.min(Math.floor(t), n - 1);
  const f = t - i;
  const a = trajectory[i], b = trajectory[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

if (typeof window !== 'undefined') {
  window.AIRCRAFT = AIRCRAFT;
  window.EVENTS = EVENTS;
  window.DISCOVERIES = DISCOVERIES;
  window.EXPLORER_PROFILE = EXPLORER_PROFILE;
  window.getPositionAlongTrajectory = getPositionAlongTrajectory;
}
