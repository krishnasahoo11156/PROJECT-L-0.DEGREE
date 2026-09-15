// ─── LIVING ATLAS — app.js ───────────────────────────────────────────────────
// State machine, globe (globe.gl), interactions, panels, atlas, journal, follow.
// The globe is always running. Everything else is an overlay.
// ─────────────────────────────────────────────────────────────────────────────

import { AIRCRAFT, EVENTS, DISCOVERIES, EXPLORER_PROFILE, getPositionAlongTrajectory } from './data.js';

// ─── LIVE DATA STATE ──────────────────────────────────────────────────────────
let LIVE_AIRCRAFT = null;   // null = not yet loaded; populated by loadLiveData()
let LIVE_EVENTS   = null;
let liveStatusEl  = null;

const AIRLINE_LOOKUP = {
  BAW:'British Airways',    SAS:'Scandinavian Airlines', DLH:'Lufthansa',
  AAL:'American Airlines',  UAL:'United Airlines',        DAL:'Delta Air Lines',
  SWA:'Southwest Airlines', AFR:'Air France',             KLM:'KLM Royal Dutch',
  ANA:'All Nippon Airways', JAL:'Japan Airlines',          SIA:'Singapore Airlines',
  QFA:'Qantas',             THY:'Turkish Airlines',        UAE:'Emirates',
  QTR:'Qatar Airways',      EZY:'easyJet',                 RYR:'Ryanair',
  IBE:'Iberia',             WZZ:'Wizz Air',                VLG:'Vueling',
  LOT:'LOT Polish',         CSN:'China Southern',           CCA:'Air China',
  CES:'China Eastern',      HVN:'Vietnam Airlines',          THA:'Thai Airways',
  MAS:'Malaysia Airlines',  CPA:'Cathay Pacific',            AIC:'Air India',
  SVA:'Saudia',             ETH:'Ethiopian Airlines',        KQA:'Kenya Airways',
  AZU:'Azul',               TAM:'LATAM Airlines',             FDX:'FedEx Express',
  UPS:'UPS Airlines',       NKS:'Spirit Airlines',            JBU:'JetBlue',
  ASA:'Alaska Airlines',    HAL:'Hawaiian Airlines',          SKW:'SkyWest',
  FFT:'Frontier Airlines',  SJI:'Southern Airways',           PGT:'Pegasus Airlines',
  TOM:'TUI Airways',        VIR:'Virgin Atlantic',            EIN:'Aer Lingus',
  SWR:'Swiss Int\'l',       AUA:'Austrian Airlines',          BEL:'Brussels Airlines',
  FIN:'Finnair',            NOZ:'Norwegian',                  WJA:'WestJet',
  ACA:'Air Canada',         TAP:'TAP Air Portugal',           RAM:'Royal Air Maroc',
};

// ─── STATE ────────────────────────────────────────────────────────────────────
let state        = 'world';     // world | inspecting | following | investigating | atlas | journal
let selectedEntity = null;
let followInterval = null;
let followEventTimer = null;
let timeOffset   = 0;           // hours back from now (0 = now, -6 = 6hrs ago)
let globe        = null;
let currentDiscovery = null;

const STATES = ['world','inspecting','following','investigating','atlas','journal'];

function setState(newState) {
  const prev = state;
  state = newState;
  document.body.className = `state-${newState}`;

  // Globe resize on investigation
  if (globe) {
    if (newState === 'investigating') {
      setTimeout(() => { globe.width(Math.round(window.innerWidth * 0.44)); }, 50);
    } else if (prev === 'investigating') {
      setTimeout(() => { globe.width(window.innerWidth); }, 50);
    }
    // Auto-rotate only in world state
    globe.controls().autoRotate = (newState === 'world');
  }

  // Panel open/close
  $('panel-inspection').classList.toggle('panel-open', newState === 'inspecting');
  $('panel-follow').classList.toggle('panel-open', newState === 'following');
  $('panel-investigation').classList.toggle('panel-open', newState === 'investigating');

  // Full screens
  $('screen-atlas').classList.toggle('screen-open', newState === 'atlas');
  $('screen-journal').classList.toggle('screen-open', newState === 'journal');
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const fmt = {
  lat: n => `${Math.abs(n).toFixed(1)}°${n >= 0 ? 'N' : 'S'}`,
  lng: n => `${Math.abs(n).toFixed(1)}°${n >= 0 ? 'E' : 'W'}`,
  coords: (lat, lng) => `${fmt.lat(lat)}  ${fmt.lng(lng)}`,
  alt: n => `${n.toLocaleString()} ft`,
  speed: n => `${n} kts`,
  hdg: n => `${n}°`,
  pct: n => `${Math.round(n * 100)}%`,
  date: () => {
    const d = new Date('2026-09-14T21:43:00Z');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  }
};

function formatTimestamp(ts) {
  const d = new Date(ts);
  return `${d.getDate()} ${d.toLocaleString('en',{month:'short'}).toUpperCase()} ${d.getFullYear()}  ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')} UTC`;
}

// ─── GLOBE SETUP ─────────────────────────────────────────────────────────────
function initGlobe() {
  const container = $('globe-container');

  globe = Globe()(container);

  globe
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
    .atmosphereColor('#3a7fff')
    .atmosphereAltitude(0.30)
    .width(window.innerWidth)
    .height(window.innerHeight);

  // ── Photorealistic rotating cloud layer ────────────────────────────────────
  if (typeof THREE !== 'undefined') {
    const CLOUD_ALT  = 0.005;
    const CLOUD_SPIN = 0.004; // degrees/frame
    new THREE.TextureLoader().load(
      'https://unpkg.com/three-globe/example/img/clouds.png',
      texture => {
        const clouds = new THREE.Mesh(
          new THREE.SphereGeometry(globe.getGlobeRadius() * (1 + CLOUD_ALT), 75, 75),
          new THREE.MeshPhongMaterial({ map: texture, transparent: true, opacity: 0.82, depthWrite: false })
        );
        globe.scene().add(clouds);
        (function spinClouds() {
          clouds.rotation.y -= CLOUD_SPIN * (Math.PI / 180);
          requestAnimationFrame(spinClouds);
        })();
      }
    );
  }

  // Controls
  globe.controls().autoRotate = true;
  globe.controls().autoRotateSpeed = 0.25;
  globe.controls().enableDamping = true;
  globe.controls().dampingFactor = 0.06;
  globe.controls().minDistance = 110;
  globe.controls().maxDistance = 600;

  // Interaction hooks
  globe.onPointClick(entity => {
    if (!entity) return;
    selectedEntity = entity;
    globe.controls().autoRotate = false;
    // Focus globe on entity
    globe.pointOfView({ lat: entity.lat, lng: entity.lng, altitude: 1.4 }, 800);
    openInspection(entity);
    setState('inspecting');
  });

  globe.onPointHover((entity) => {
    if (entity) showEntityTooltip(entity);
    else hideEntityTooltip();
  });

  globe.onGlobeClick(() => {
    if (state === 'inspecting') closeInspection();
  });

  // Initial camera position
  globe.pointOfView({ lat: 30, lng: 0, altitude: 2.5 });

  // Show HUD after globe loaded
  setTimeout(() => {
    $('entity-count-badge').classList.add('visible');
    $('time-control').classList.add('visible');
  }, 1800);

  updateGlobeEntities();
  startAircraftMovement();
}

// ─── GLOBE ENTITY DATA ────────────────────────────────────────────────────────
function getAllEntities() {
  // Use live data if loaded, fall back to curated demo data
  const aircraft = LIVE_AIRCRAFT !== null ? LIVE_AIRCRAFT : AIRCRAFT;
  const events   = LIVE_EVENTS   !== null ? LIVE_EVENTS   : EVENTS;
  return [...aircraft, ...events];
}

function updateGlobeEntities() {
  if (!globe) return;
  const entities = getAllEntities();

  // Points (all entities)
  globe
    .pointsData(entities)
    .pointLat(d => d.lat)
    .pointLng(d => d.lng)
    .pointColor(d => {
      if (d.isCuriosity) return '#E8A838';
      if (d.type === 'aircraft') return '#4A9FFF';
      if (d.type === 'wildfire' || d.type === 'cyclone') return '#E05555';
      if (d.type === 'earthquake') return '#9B6FD0';
      return '#3ECFAA';
    })
    .pointAltitude(d => d.isCuriosity ? 0.018 : 0.012)
    .pointRadius(d => d.isCuriosity ? 0.45 : 0.28)
    .pointLabel(d => `${d.callsign || d.name}`)
    .pointResolution(8);

  // Rings for curiosity entities (subtle, not blaring)
  const curiosities = entities.filter(e => e.isCuriosity);
  globe
    .ringsData(curiosities)
    .ringLat(d => d.lat)
    .ringLng(d => d.lng)
    .ringColor(() => t => `rgba(232,168,56,${Math.max(0, 0.5 - t * 0.5)})`)
    .ringMaxRadius(2.5)
    .ringPropagationSpeed(0.7)
    .ringRepeatPeriod(3200);

  // Trajectory arc for selected entity only
  if (selectedEntity && selectedEntity.trajectory && selectedEntity.trajectory.length >= 2) {
    const traj = selectedEntity.trajectory;
    globe
      .arcsData([{
        startLat: traj[0][0], startLng: traj[0][1],
        endLat: traj[traj.length-1][0], endLng: traj[traj.length-1][1],
        waypoints: traj
      }])
      .arcStartLat(d => d.startLat)
      .arcStartLng(d => d.startLng)
      .arcEndLat(d => d.endLat)
      .arcEndLng(d => d.endLng)
      .arcColor(() => '#4A9FFF')
      .arcStroke(0.6)
      .arcDashLength(0.35)
      .arcDashGap(0.15)
      .arcDashAnimateTime(2500)
      .arcAltitudeAutoScale(0.3);

    // Custom trail — label at current position
    globe
      .labelsData([selectedEntity])
      .labelLat(d => d.lat)
      .labelLng(d => d.lng)
      .labelText(d => d.callsign || d.name)
      .labelSize(0.8)
      .labelColor(() => '#4A9FFF')
      .labelDotRadius(0.4)
      .labelDotOrientation(() => 'bottom')
      .labelAltitude(0.02);
  } else {
    globe.arcsData([]).labelsData([]);
  }

  // Entity count badge
  const curiosityCount = curiosities.length;
  $('entity-count-badge').querySelector('.entity-count-number').textContent = entities.length;
  $('curiosity-count').textContent = `${curiosityCount} curiosit${curiosityCount === 1 ? 'y' : 'ies'}`;
}

// ─── AIRCRAFT MOVEMENT ────────────────────────────────────────────────────────
function startAircraftMovement() {
  setInterval(() => {
    let changed = false;
    const activeAircraft = LIVE_AIRCRAFT !== null ? LIVE_AIRCRAFT : AIRCRAFT;
    activeAircraft.forEach(a => {
      if (typeof a.heading === 'number' && typeof a.lat === 'number' && typeof a.lng === 'number') {
        const rad = (a.heading * Math.PI) / 180;
        a.lat += Math.cos(rad) * 0.0008;
        a.lng += Math.sin(rad) * 0.0008 / Math.max(0.1, Math.cos((a.lat * Math.PI) / 180));
        changed = true;
      }
    });
    if (changed) {
      updateGlobeEntities();
      // If following, keep camera on entity
      if (state === 'following' && selectedEntity) {
        globe.pointOfView({ lat: selectedEntity.lat, lng: selectedEntity.lng }, 0);
      }
    }
  }, 3000);
}

// ─── TIME SLIDER ──────────────────────────────────────────────────────────────
$('time-slider').addEventListener('input', e => {
  const val = parseInt(e.target.value);
  timeOffset = -(100 - val) * 0.06; // 0 = now, -6 = 6hrs ago
  const label = val === 100 ? 'NOW' : `−${Math.abs(timeOffset).toFixed(1)}h`;
  $('time-label').textContent = label;

  const activeAircraft = LIVE_AIRCRAFT !== null ? LIVE_AIRCRAFT : AIRCRAFT;
  activeAircraft.forEach(a => {
    if (a.trajectory && a.trajectory.length >= 2) {
      const backProg = Math.max(0, (a.progress || 0.5) + timeOffset * 0.012);
      const pos = getPositionAlongTrajectory(a.trajectory, backProg);
      a.lat = pos[0];
      a.lng = pos[1];
    }
  });
  updateGlobeEntities();
});

// ─── TOOLTIPS ─────────────────────────────────────────────────────────────────
let tooltipMoveHandler = null;

function showEntityTooltip(entity) {
  const tt = $('entity-tooltip');
  const ct = $('curiosity-tooltip');
  tt.querySelector('#tt-callsign').textContent = entity.callsign || entity.name;
  tt.querySelector('#tt-type').textContent = entity.type === 'aircraft'
    ? `${entity.aircraftType} · ${entity.airline}`
    : entity.type.toUpperCase();
  tt.classList.remove('hidden');

  if (entity.isCuriosity) {
    ct.querySelector('#curiosity-tip-text').textContent = entity.curiosityNote || 'This caught our attention';
    ct.classList.remove('hidden');
  }

  if (!tooltipMoveHandler) {
    tooltipMoveHandler = e => {
      tt.style.left = (e.clientX + 14) + 'px';
      tt.style.top = (e.clientY + 14) + 'px';
      ct.style.left = (e.clientX + 14) + 'px';
      ct.style.top = (e.clientY + 40) + 'px';
    };
    document.addEventListener('mousemove', tooltipMoveHandler);
  }
}

function hideEntityTooltip() {
  $('entity-tooltip').classList.add('hidden');
  $('curiosity-tooltip').classList.add('hidden');
  if (tooltipMoveHandler) {
    document.removeEventListener('mousemove', tooltipMoveHandler);
    tooltipMoveHandler = null;
  }
}

// ─── INSPECTION PANEL ─────────────────────────────────────────────────────────
function openInspection(entity) {
  hideEntityTooltip();
  if (entity.type === 'aircraft') {
    $('insp-entity-type').textContent = 'AIRCRAFT';
    $('insp-callsign').textContent = entity.callsign;
    $('insp-status').textContent = 'AIRBORNE';
    $('insp-airline').textContent = entity.airline;
    $('insp-alt').textContent = fmt.alt(entity.altitude);
    $('insp-speed').textContent = fmt.speed(entity.speed);
    $('insp-hdg').textContent = fmt.hdg(entity.heading);
    $('insp-squawk').textContent = entity.squawk;
    $('insp-coords').textContent = fmt.coords(entity.lat, entity.lng);
    $('insp-ts').textContent = formatTimestamp(entity.timestamp);
    $('insp-origin').textContent = entity.origin.code;
    $('insp-origin-name').textContent = entity.origin.name;
    $('insp-dest').textContent = entity.destination.code;
    $('insp-dest-name').textContent = entity.destination.name;
    $('insp-prog-fill').style.width = fmt.pct(entity.progress);
    $('insp-prog-pct').textContent = fmt.pct(entity.progress);
    $('insp-route-section').style.display = '';
    $('insp-event-section').style.display = 'none';
    $('btn-follow').style.display = '';
    $('btn-investigate').style.display = '';
  } else {
    // Event entity
    $('insp-entity-type').textContent = entity.type.toUpperCase();
    $('insp-callsign').textContent = entity.name;
    $('insp-status').textContent = entity.severity ? entity.severity.toUpperCase() : 'ACTIVE';
    $('insp-airline').textContent = formatTimestamp(entity.timestamp);
    $('insp-alt').style.display = 'none';
    $('insp-squawk').parentElement.style.display = 'none';
    $('insp-hdg').parentElement.style.display = 'none';
    $('insp-speed').parentElement.style.display = 'none';
    $('insp-coords').textContent = fmt.coords(entity.lat, entity.lng);
    $('insp-ts').textContent = formatTimestamp(entity.timestamp);
    $('insp-route-section').style.display = 'none';
    $('btn-follow').style.display = 'none';
    $('btn-investigate').style.display = '';

    // Event details
    $('insp-event-section').style.display = '';
    const eventData = [];
    if (entity.area) eventData.push(['Area', entity.area]);
    if (entity.containment) eventData.push(['Containment', entity.containment]);
    if (entity.magnitude) eventData.push(['Magnitude', entity.magnitude]);
    if (entity.depth) eventData.push(['Depth', entity.depth]);
    if (entity.windSpeed) eventData.push(['Wind Speed', entity.windSpeed]);
    if (entity.category) eventData.push(['Category', entity.category]);
    if (entity.alertLevel) eventData.push(['Alert Level', entity.alertLevel]);
    $('insp-event-data').innerHTML = eventData.map(([k,v]) =>
      `<div class="quick-data-row"><span class="quick-key">${k}</span><span class="quick-val">${v}</span></div>`
    ).join('');
  }

  // Curiosity section
  if (entity.isCuriosity) {
    $('insp-curiosity-section').style.display = '';
    $('insp-curiosity-text').textContent = entity.curiosityNote;
    // Use discovery confidence if it exists
    const disc = DISCOVERIES.find(d => d.entityId === entity.id);
    const conf = disc ? disc.confidence : 65;
    $('insp-conf-fill').style.width = conf + '%';
    $('insp-conf-val').textContent = conf + '%';
  } else {
    $('insp-curiosity-section').style.display = 'none';
  }

  updateGlobeEntities(); // redraw with trajectory arc
}

function closeInspection() {
  selectedEntity = null;
  globe.arcsData([]).labelsData([]);
  globe.controls().autoRotate = true;
  setState('world');
}

$('insp-close').addEventListener('click', closeInspection);

// ─── FOLLOW MECHANIC ──────────────────────────────────────────────────────────
$('btn-follow').addEventListener('click', () => {
  if (!selectedEntity || selectedEntity.type !== 'aircraft') return;
  startFollow(selectedEntity);
});

function startFollow(entity) {
  setState('following');
  $('panel-inspection').classList.remove('panel-open');

  $('follow-callsign').textContent = entity.callsign;
  $('follow-meta').textContent = `${entity.aircraftType} · ${entity.airline}`;

  // Zoom in on entity
  globe.pointOfView({ lat: entity.lat, lng: entity.lng, altitude: 0.7 }, 1200);
  globe.controls().autoRotate = false;

  // Draw altitude timeline chart
  drawTimelineChart(entity);

  // Emit follow events over time
  scheduleFollowEvents(entity);

  // Keep camera locked on entity
  followInterval = setInterval(() => {
    if (state !== 'following') { clearInterval(followInterval); return; }
    globe.pointOfView({ lat: selectedEntity.lat, lng: selectedEntity.lng }, 0);
  }, 500);
}

function stopFollow() {
  clearInterval(followInterval);
  clearTimeout(followEventTimer);
  followInterval = null;
  selectedEntity = null;
  $('follow-events-list').innerHTML = '';
  globe.controls().autoRotate = true;
  setState('world');
}

$('btn-stop-follow').addEventListener('click', stopFollow);

function drawTimelineChart(entity) {
  const canvas = $('timeline-chart');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const history = entity.altitudeHistory || Array(10).fill(entity.altitude);
  const min = Math.min(...history) - 1000;
  const max = Math.max(...history) + 1000;
  const pts = history.map((v, i) => ({
    x: (i / (history.length - 1)) * w,
    y: h - ((v - min) / (max - min)) * h * 0.85 - h * 0.05
  }));

  // Grid lines
  ctx.strokeStyle = 'rgba(26,48,80,0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = (h / 3) * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Area fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(74,159,255,0.25)');
  grad.addColorStop(1, 'rgba(74,159,255,0)');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, h);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length-1].x, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#4A9FFF';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // Current point
  const last = pts[pts.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#4A9FFF';
  ctx.fill();
  ctx.strokeStyle = '#060A0F';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Altitude labels
  ctx.fillStyle = 'rgba(94,132,168,0.8)';
  ctx.font = '9px Space Grotesk';
  ctx.textAlign = 'right';
  [min, max].forEach((v, i) => {
    ctx.fillText(`${Math.round(v/100)*100}ft`, w - 4, i === 0 ? h - 4 : 12);
  });
}

function scheduleFollowEvents(entity) {
  const events = [
    { delay: 5000, title: 'ALTITUDE CHANGE', desc: 'Descending 200 ft/min — possible turbulence avoidance' },
    { delay: 14000, title: 'AIRSPACE BOUNDARY', desc: 'Crossing into Gander Oceanic FIR' },
    { delay: 24000, title: 'WEATHER ADVISORY NEARBY', desc: 'SIGMET active 180nm south of current track' }
  ];

  events.forEach(ev => {
    followEventTimer = setTimeout(() => {
      if (state !== 'following') return;
      addFollowEvent(ev.title, ev.desc);
    }, ev.delay);
  });
}

function addFollowEvent(title, desc) {
  const list = $('follow-events-list');
  const card = document.createElement('div');
  card.className = 'follow-event-card';
  card.innerHTML = `<div class="follow-event-title">◈ ${title}</div><div class="follow-event-desc">${desc}</div>`;
  list.prepend(card);
}

// ─── INVESTIGATION ────────────────────────────────────────────────────────────
$('btn-investigate').addEventListener('click', () => {
  if (!selectedEntity) return;
  openInvestigation(selectedEntity);
});

function openInvestigation(entity) {
  setState('investigating');
  $('panel-inspection').classList.remove('panel-open');

  $('inv-entity-name').textContent = entity.callsign || entity.name;

  // Find corresponding discovery data for rich content
  const disc = DISCOVERIES.find(d => d.entityId === entity.id) || buildDiscoveryFromEntity(entity);

  populateInvDataTab(entity, disc);
  populateInvContextTab(entity, disc);
  populateInvRelatedTab(disc);
  populateInvUnderstandingTab(disc);

  // Reset to DATA tab
  switchInvTab('data');
}

function buildDiscoveryFromEntity(entity) {
  return {
    observation: entity.description || 'This entity was flagged for further examination.',
    technicalData: {},
    aiAnalysis: 'Insufficient data for a confident analysis. Continued monitoring recommended.',
    confidence: 50,
    relatedEvents: []
  };
}

function populateInvDataTab(entity, disc) {
  // Technical data table
  const table = $('inv-data-table');
  const data = disc.technicalData || {};
  if (Object.keys(data).length === 0) {
    // Build from entity
    if (entity.type === 'aircraft') {
      data['CALLSIGN'] = entity.callsign;
      data['AIRCRAFT'] = entity.aircraftType;
      data['ALTITUDE'] = fmt.alt(entity.altitude);
      data['SPEED'] = fmt.speed(entity.speed);
      data['HEADING'] = fmt.hdg(entity.heading);
      data['POSITION'] = fmt.coords(entity.lat, entity.lng);
    }
  }
  table.innerHTML = Object.entries(data).map(([k,v]) =>
    `<tr><td>${k}</td><td>${v}</td></tr>`
  ).join('');

  // Trajectory waypoints
  const wp = $('inv-waypoints');
  const traj = entity.trajectory || [];
  const currentIdx = entity.currentWaypointIdx || Math.floor(traj.length * 0.6);
  wp.innerHTML = traj.map((pt, i) => {
    const isCurrent = i === currentIdx;
    const isPast = i < currentIdx;
    const note = isCurrent ? '← CURRENT POSITION' : isPast ? 'passed' : 'ahead';
    return `<div class="waypoint-row ${isCurrent ? 'current' : ''}">
      <span class="waypoint-idx">${String(i+1).padStart(2,'0')}</span>
      <span class="waypoint-coords">${fmt.lat(pt[0])}  ${fmt.lng(pt[1])}</span>
      <span class="waypoint-note">${note}</span>
    </div>`;
  }).join('');
}

function populateInvContextTab(entity, disc) {
  $('inv-narrative').textContent = disc.observation || entity.description || '';

  // Draw altitude/speed chart
  const canvas = $('context-chart');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const history = entity.altitudeHistory || Array(10).fill(entity.altitude || 38000);
  const min = Math.min(...history) - 2000;
  const max = Math.max(...history) + 2000;

  // Background grid
  ctx.strokeStyle = 'rgba(26,48,80,0.5)';
  ctx.lineWidth = 1;
  [0.25, 0.5, 0.75].forEach(r => {
    ctx.beginPath(); ctx.moveTo(0, h * r); ctx.lineTo(w, h * r); ctx.stroke();
  });

  const pts = history.map((v, i) => ({
    x: (i / (history.length - 1)) * (w - 20) + 10,
    y: (h - 10) - ((v - min) / (max - min)) * (h - 20)
  }));

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(74,159,255,0.2)');
  grad.addColorStop(1, 'rgba(74,159,255,0)');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, h - 10);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length-1].x, h - 10);
  ctx.fillStyle = grad; ctx.fill();

  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = '#4A9FFF'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();

  // Labels
  ctx.fillStyle = '#5E84A8'; ctx.font = '9px Space Grotesk';
  ctx.textAlign = 'left';
  ctx.fillText(`${Math.round(max/100)*100} ft`, 4, 14);
  ctx.fillText(`${Math.round(min/100)*100} ft`, 4, h - 4);
}

function populateInvRelatedTab(disc) {
  const list = $('inv-related-list');
  const events = disc.relatedEvents || [];
  if (events.length === 0) {
    list.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:20px 0">No related events found for this entity.</div>';
    return;
  }
  list.innerHTML = events.map(ev => `
    <div class="related-card">
      <div class="related-card-header">
        <span class="related-type-tag">${ev.type}</span>
        <span class="related-title">${ev.title}</span>
      </div>
      <div class="related-note">${ev.note}</div>
    </div>
  `).join('');
}

function populateInvUnderstandingTab(disc) {
  $('inv-understanding').textContent = disc.aiAnalysis || '';
  const conf = disc.confidence || 60;
  $('inv-conf-fill').style.width = conf + '%';
  $('inv-conf-pct').textContent = conf + '%';
}

// Investigation tabs
document.querySelectorAll('.inv-tab').forEach(tab => {
  tab.addEventListener('click', () => switchInvTab(tab.dataset.tab));
});

function switchInvTab(tabId) {
  document.querySelectorAll('.inv-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  document.querySelectorAll('.inv-tab-content').forEach(c => c.classList.toggle('active', c.id === `inv-tab-${tabId}`));
}

$('btn-back-investigation').addEventListener('click', () => {
  if (selectedEntity) {
    openInspection(selectedEntity);
    setState('inspecting');
  } else {
    setState('world');
  }
});

$('inv-btn-save').addEventListener('click', () => {
  showSaveConfirm();
  setTimeout(() => setState('atlas'), 800);
});

function showSaveConfirm() {
  const btn = $('inv-btn-save');
  btn.textContent = '◈ SAVED TO ATLAS';
  btn.style.borderColor = 'var(--success)';
  btn.style.color = 'var(--success)';
  btn.style.background = 'var(--success-dim)';
}

// ─── SURPRISE ME ─────────────────────────────────────────────────────────────
$('btn-surprise').addEventListener('click', doSurpriseMe);

function doSurpriseMe() {
  const overlay = $('surprise-overlay');
  overlay.classList.remove('arrived');
  overlay.classList.add('visible');
  $('surprise-text').textContent = 'Searching for something interesting…';
  $('surprise-arrive').style.opacity = '0';
  globe.controls().autoRotate = false;

  // Spin to a random intermediate location
  const midLat = (Math.random() - 0.5) * 80;
  const midLng = (Math.random() - 0.5) * 360;
  globe.pointOfView({ lat: midLat, lng: midLng, altitude: 3.5 }, 600);

  setTimeout(() => {
    // Pick a curiosity entity to travel to
    const curiosities = getAllEntities().filter(e => e.isCuriosity);
    const target = curiosities.length > 0 ? curiosities[Math.floor(Math.random() * curiosities.length)] : getAllEntities()[0];
    $('surprise-text').textContent = 'Found something…';

    globe.pointOfView({ lat: target.lat, lng: target.lng, altitude: 1.6 }, 2200);

    setTimeout(() => {
      overlay.classList.add('arrived');
      $('surprise-arrive').style.opacity = '1';
      $('surprise-text').textContent = 'You\'ve arrived.';

      setTimeout(() => {
        overlay.classList.remove('visible');
        overlay.classList.remove('arrived');
        // Don't auto-open inspection — let the user explore
      }, 2800);
    }, 2300);
  }, 700);
}

// ─── MY ATLAS ────────────────────────────────────────────────────────────────
$('btn-open-atlas').addEventListener('click', openAtlas);
$('btn-back-atlas').addEventListener('click', () => {
  setState('world');
  globe.controls().autoRotate = true;
});

function openAtlas() {
  setState('atlas');
  renderExplorerProfile();
  renderDiscoveryList();
  renderAtlasMap();
}

function renderExplorerProfile() {
  const p = EXPLORER_PROFILE;
  $('profile-name').textContent = p.name;
  $('profile-total').textContent = p.totalDiscoveries;
  $('profile-regions').textContent = p.regionsExplored;
  $('profile-cat-grid').innerHTML = [
    { icon: '✈', num: p.byCategory.aviation, cat: 'AVIATION' },
    { icon: '⛵', num: p.byCategory.maritime, cat: 'MARITIME' },
    { icon: '🌋', num: p.byCategory.natural, cat: 'NATURAL' },
    { icon: '🛰', num: p.byCategory.space, cat: 'SPACE' }
  ].map(item => `
    <div class="profile-stat-item">
      <div class="stat-icon">${item.icon}</div>
      <div class="stat-num">${item.num}</div>
      <div class="stat-cat">${item.cat}</div>
    </div>
  `).join('');
}

function renderDiscoveryList() {
  const list = $('discovery-list');
  list.innerHTML = DISCOVERIES.map(d => `
    <div class="discovery-item" data-id="${d.id}" role="button" tabindex="0">
      <span class="discovery-num">#${d.id}</span>
      <div class="discovery-info">
        <div class="discovery-title">${d.title}</div>
        <div class="discovery-meta">${d.region} · ${d.date}</div>
      </div>
      <div class="discovery-status ${d.status === 'OPEN' ? 'open' : 'resolved'}"></div>
    </div>
  `).join('');

  list.querySelectorAll('.discovery-item').forEach(item => {
    item.addEventListener('click', () => {
      const disc = DISCOVERIES.find(d => d.id === item.dataset.id);
      if (disc) openJournal(disc);
    });
  });
}

// ─── ATLAS MAP (D3) ──────────────────────────────────────────────────────────
function renderAtlasMap() {
  const container = $('atlas-map-container');
  const w = container.clientWidth;
  const h = container.clientHeight;
  const svg = d3.select('#atlas-map').attr('width', w).attr('height', h);
  svg.selectAll('*').remove();

  const projection = d3.geoNaturalEarth1()
    .scale(w / 6.4)
    .translate([w / 2, h / 2]);

  const path = d3.geoPath().projection(projection);

  // Background
  svg.append('rect').attr('width', w).attr('height', h).attr('fill', '#060A0F');

  // Graticule
  const graticule = d3.geoGraticule().step([30, 30]);
  svg.append('path')
    .datum(graticule())
    .attr('d', path)
    .attr('fill', 'none')
    .attr('stroke', '#0F1B2D')
    .attr('stroke-width', 0.5);

  // Load world topology
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(r => r.json())
    .then(world => {
      const land = topojson.feature(world, world.objects.land);
      const countries = topojson.mesh(world, world.objects.countries);

      svg.append('path')
        .datum(land)
        .attr('d', path)
        .attr('fill', '#0F1B2D')
        .attr('stroke', 'none');

      svg.append('path')
        .datum(countries)
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', '#1A3050')
        .attr('stroke-width', 0.5);

      // Discovery pins
      DISCOVERIES.forEach(d => {
        const pos = projection([d.lng, d.lat]);
        if (!pos) return;

        const g = svg.append('g')
          .attr('transform', `translate(${pos[0]}, ${pos[1]})`)
          .style('cursor', 'pointer')
          .on('click', () => openJournal(d));

        // Outer ring
        if (d.status === 'OPEN') {
          g.append('circle').attr('r', 12).attr('fill', 'none')
            .attr('stroke', '#E8A838').attr('stroke-width', 0.8).attr('opacity', 0.4);
        }

        // Pin circle
        g.append('circle').attr('r', 7)
          .attr('fill', d.status === 'OPEN' ? '#E8A838' : '#3A5470')
          .attr('stroke', '#060A0F').attr('stroke-width', 1.5);

        // Pin number
        g.append('text')
          .attr('text-anchor', 'middle').attr('dy', '0.35em')
          .attr('fill', '#060A0F')
          .attr('font-size', '7px').attr('font-weight', '700')
          .attr('font-family', 'Space Grotesk')
          .text(d.id);

        // Hover label
        g.append('title').text(`#${d.id} — ${d.title}`);
      });
    })
    .catch(() => {
      // Fallback: just show discovery pins without land
      svg.append('text')
        .attr('x', w/2).attr('y', h/2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#304A65')
        .attr('font-family', 'Space Grotesk')
        .attr('font-size', '13px')
        .text('Map data unavailable offline. Discoveries shown below.');
    });
}

// ─── FIELD JOURNAL ────────────────────────────────────────────────────────────
$('btn-back-journal').addEventListener('click', () => {
  setState('atlas');
  renderDiscoveryList();
  renderAtlasMap();
});

function openJournal(disc) {
  currentDiscovery = disc;
  setState('journal');

  $('journal-disc-num').textContent = `DISCOVERY #${disc.id}`;
  $('journal-cat-tag').textContent = disc.category;
  $('journal-title').textContent = disc.title;
  $('journal-location').textContent = disc.location;
  $('journal-date').textContent = disc.date;
  $('journal-time').textContent = disc.time;
  $('journal-coords').textContent = fmt.coords(disc.lat, disc.lng);
  $('journal-status').textContent = disc.status === 'OPEN' ? '● OPEN INVESTIGATION' : '○ RESOLVED';
  $('journal-status').style.color = disc.status === 'OPEN' ? 'var(--curiosity)' : 'var(--text-muted)';
  $('journal-observation').textContent = disc.observation;

  // Tech data table
  const table = $('journal-tech-table');
  table.innerHTML = Object.entries(disc.technicalData || {}).map(([k,v]) =>
    `<tr><td>${k}</td><td>${v}</td></tr>`
  ).join('');

  // AI analysis
  $('journal-ai').textContent = disc.aiAnalysis || '';
  $('journal-conf-fill').style.width = (disc.confidence || 50) + '%';
  $('journal-conf-pct').textContent = (disc.confidence || 50) + '%';

  // Related events
  const relatedSection = $('journal-related-section');
  const relatedList = $('journal-related-list');
  if (disc.relatedEvents && disc.relatedEvents.length > 0) {
    relatedSection.style.display = '';
    relatedList.innerHTML = disc.relatedEvents.map(ev => `
      <div class="journal-related-item">
        <div class="journal-related-header">
          <span class="journal-related-type">${ev.type}</span>
          <span class="journal-related-title">${ev.title}</span>
        </div>
        <div class="journal-related-note">${ev.note}</div>
      </div>
    `).join('');
  } else {
    relatedSection.style.display = 'none';
  }

  // Notes
  $('journal-notes').value = disc.notes || '';
  $('journal-notes').oninput = e => { disc.notes = e.target.value; };

  // Quick data sidebar
  const quickItems = [
    ['CATEGORY', disc.category],
    ['STATUS', disc.status],
    ['REGION', disc.region],
    ['DATE', disc.date],
    ['TIME', disc.time]
  ];
  $('journal-quick-data').innerHTML = quickItems.map(([k,v]) =>
    `<div class="quick-data-row"><span class="quick-key">${k}</span><span class="quick-val">${v}</span></div>`
  ).join('');

  // Mini trajectory map
  renderJournalTrajectory(disc);
}

function renderJournalTrajectory(disc) {
  const svg = d3.select('#journal-traj-svg');
  svg.selectAll('*').remove();
  const parent = $('journal-mini-map');
  const w = parent.clientWidth || 300;
  const h = parent.clientHeight || 220;
  svg.attr('width', w).attr('height', h).attr('viewBox', `0 0 ${w} ${h}`);

  const traj = disc.trajectory || [];
  if (traj.length < 2) {
    // Just show a pin for non-trajectory discoveries
    svg.append('circle').attr('cx', w/2).attr('cy', h/2).attr('r', 8)
      .attr('fill', '#E8A838').attr('opacity', 0.8);
    svg.append('circle').attr('cx', w/2).attr('cy', h/2).attr('r', 20)
      .attr('fill', 'none').attr('stroke', '#E8A838').attr('stroke-width', 1).attr('opacity', 0.3);
    return;
  }

  const lats = traj.map(p => p[0]);
  const lngs = traj.map(p => p[1]);
  const latMin = Math.min(...lats) - 2, latMax = Math.max(...lats) + 2;
  const lngMin = Math.min(...lngs) - 4, lngMax = Math.max(...lngs) + 4;

  const toX = lng => ((lng - lngMin) / (lngMax - lngMin)) * (w - 40) + 20;
  const toY = lat => h - ((lat - latMin) / (latMax - latMin)) * (h - 40) - 20;

  // Background
  svg.append('rect').attr('width', w).attr('height', h).attr('fill', '#0D1520');

  // Grid
  svg.append('line').attr('x1', 0).attr('y1', h/2).attr('x2', w).attr('y2', h/2)
    .attr('stroke', '#1A3050').attr('stroke-width', 0.5);
  svg.append('line').attr('x1', w/2).attr('y1', 0).attr('x2', w/2).attr('y2', h)
    .attr('stroke', '#1A3050').attr('stroke-width', 0.5);

  // Path
  const line = d3.line().x(d => toX(d[1])).y(d => toY(d[0])).curve(d3.curveCatmullRom);
  svg.append('path').datum(traj).attr('d', line)
    .attr('fill', 'none').attr('stroke', '#4A9FFF')
    .attr('stroke-width', 2).attr('stroke-dasharray', '6 3').attr('opacity', 0.8);

  // Dots at origin and destination
  [[traj[0], '#5E84A8', 5], [traj[traj.length-1], '#4A9FFF', 5]].forEach(([pt, color, r]) => {
    svg.append('circle').attr('cx', toX(pt[1])).attr('cy', toY(pt[0]))
      .attr('r', r).attr('fill', color).attr('opacity', 0.9);
  });

  // Current position (last in partial trajectory)
  const cur = traj[traj.length - 1];
  svg.append('circle').attr('cx', toX(cur[1])).attr('cy', toY(cur[0]))
    .attr('r', 6).attr('fill', 'none').attr('stroke', '#4A9FFF').attr('stroke-width', 1.5).attr('opacity', 0.5);

  // Labels
  const labelStyle = { fill: '#5E84A8', 'font-size': '9px', 'font-family': 'Space Grotesk' };
  const orig = traj[0];
  svg.append('text').attr('x', toX(orig[1])).attr('y', toY(orig[0]) - 10)
    .attr('text-anchor', 'middle').text(disc.technicalData?.['ORIGIN']?.split(' ')[0] || 'ORIGIN')
    .attr('fill', '#5E84A8').attr('font-size', '8px').attr('font-family', 'Space Grotesk');
}

// Journal actions
$('journal-btn-status').addEventListener('click', () => {
  if (!currentDiscovery) return;
  currentDiscovery.status = currentDiscovery.status === 'OPEN' ? 'RESOLVED' : 'OPEN';
  $('journal-status').textContent = currentDiscovery.status === 'OPEN' ? '● OPEN INVESTIGATION' : '○ RESOLVED';
  $('journal-status').style.color = currentDiscovery.status === 'OPEN' ? 'var(--curiosity)' : 'var(--text-muted)';
});

// ─── WINDOW RESIZE ────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  if (!globe) return;
  if (state === 'investigating') {
    globe.width(Math.round(window.innerWidth * 0.44)).height(window.innerHeight);
  } else {
    globe.width(window.innerWidth).height(window.innerHeight);
  }
});

// ─── SEARCH ─────────────────────────────────────────────────────
$('search-input').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const q = e.target.value.trim().toUpperCase();
  const match = getAllEntities().find(en =>
    (en.callsign && en.callsign.toUpperCase().includes(q)) ||
    (en.name && en.name.toUpperCase().includes(q)) ||
    (en.id && String(en.id).toUpperCase().includes(q))
  );
  if (match) {
    selectedEntity = match;
    globe.pointOfView({ lat: match.lat, lng: match.lng, altitude: 1.4 }, 1200);
    setTimeout(() => { openInspection(match); setState('inspecting'); }, 900);
    e.target.value = '';
    e.target.blur();
  }
});

// ─── SAVE from inspection ─────────────────────────────────────────────────────
$('btn-save-insp').addEventListener('click', () => {
  const btn = $('btn-save-insp');
  btn.textContent = '✓ SAVED';
  btn.style.color = 'var(--success)';
  btn.style.borderColor = 'var(--success)';
  setTimeout(() => {
    btn.innerHTML = '<span class="btn-icon">◈</span>SAVE';
    btn.style.color = '';
    btn.style.borderColor = '';
  }, 2000);
});

// ─── LIVE DATA INTEGRATION ───────────────────────────────────────────────────
function deriveAirline(cs) {
  const prefix = (cs || '').slice(0, 3).toUpperCase();
  return AIRLINE_LOOKUP[prefix] || (cs.length >= 3 ? cs.slice(0, 3) + ' Group' : 'Charter');
}

function detectLiveCuriosity(ac) {
  const cs = (ac.flight || '').trim().toUpperCase();
  // Military / special-ops callsign patterns
  if (/^(RCH|REACH|TUTOR|MOVER|DUKE|HAWK|GHOST|EAGLE|TALON|VALOR|ATLAS|RAVEN|IRON|FURY|VIPER|LYNX|BOXER|BLADE|DARK|GRIM|STING|KNIFE|SWORD)/.test(cs)) return true;
  // Very high altitude (above commercial ceiling)
  if (typeof ac.alt_baro === 'number' && ac.alt_baro > 50000) return true;
  // Anomalously slow at cruise altitude
  if (typeof ac.alt_baro === 'number' && typeof ac.gs === 'number' && ac.alt_baro > 25000 && ac.gs < 150) return true;
  // Emergency / special squawk codes
  if (ac.squawk === '7700' || ac.squawk === '7500' || ac.squawk === '7600') return true;
  return false;
}

function getLiveCuriosityNote(ac) {
  const cs = (ac.flight || '').trim().toUpperCase();
  if (ac.squawk === '7700') return 'Squawking 7700 — Emergency declared';
  if (ac.squawk === '7500') return 'Squawking 7500 — Hijack code active';
  if (ac.squawk === '7600') return 'Squawking 7600 — Radio communication failure';
  if (typeof ac.alt_baro === 'number' && ac.alt_baro > 50000)
    return `Operating at FL${Math.round(ac.alt_baro / 100)} — above normal commercial ceiling`;
  if (/^(RCH|REACH)/.test(cs)) return 'USAF tanker/airlift callsign detected';
  if (typeof ac.gs === 'number' && typeof ac.alt_baro === 'number' && ac.alt_baro > 25000 && ac.gs < 150)
    return `Anomalously slow groundspeed (${Math.round(ac.gs)} kts) at cruising altitude`;
  return 'Unusual flight profile flagged by LOKṢA intelligence';
}

function buildLiveTrajectory(lat, lon, heading) {
  const arcDeg  = 9;
  const headRad = (heading * Math.PI) / 180;
  const dLat    = Math.cos(headRad) * arcDeg;
  const dLon    = Math.sin(headRad) * arcDeg / Math.max(0.1, Math.cos((lat * Math.PI) / 180));
  const clamp   = v => Math.max(-89, Math.min(89, v));
  return [
    [clamp(lat - dLat), lon - dLon],
    [lat, lon],
    [clamp(lat + dLat), lon + dLon],
  ];
}

function mapVatsimToEntity(p) {
  if (p.latitude == null || p.longitude == null) return null;
  const alt = typeof p.altitude === 'number' ? p.altitude : 0;
  const speed = typeof p.groundspeed === 'number' ? p.groundspeed : 0;
  if (alt < 300 && speed < 30) return null; // Filter out stationary ground craft

  const callsign = (p.callsign || '').trim();
  if (!callsign) return null;

  const heading = typeof p.heading === 'number' ? p.heading : 0;
  const squawk = p.transponder || '----';
  const fp = p.flight_plan || {};
  const acType = fp.aircraft_short || fp.aircraft || 'Civil Aircraft';
  const dep = fp.departure || 'ORIG';
  const arr = fp.arrival || 'DEST';

  const acMeta = {
    flight: callsign,
    hex: String(p.cid),
    squawk,
    alt_baro: alt,
    gs: speed,
    track: heading
  };

  const isCuriosity = detectLiveCuriosity(acMeta);
  const trajectory = buildLiveTrajectory(p.latitude, p.longitude, heading);

  return {
    id: `vatsim-${p.cid}`,
    type: 'aircraft',
    callsign,
    airline: deriveAirline(callsign),
    aircraftType: acType,
    registration: p.name || 'VATSIM Network',
    squawk,
    lat: p.latitude,
    lng: p.longitude,
    altitude: alt,
    speed,
    heading,
    verticalRate: 0,
    progress: 0.5,
    timestamp: p.last_updated || new Date().toISOString(),
    isCuriosity,
    curiosityNote: isCuriosity ? getLiveCuriosityNote(acMeta) : null,
    trajectory,
    altitudeHistory: Array(10).fill(alt),
    origin: { code: dep, name: dep, lat: trajectory[0][0], lng: trajectory[0][1] },
    destination: { code: arr, name: arr, lat: trajectory[2][0], lng: trajectory[2][1] }
  };
}

function mapOpenSkyToEntity(vec) {
  const icao24  = vec[0];
  const rawCs   = vec[1];
  const country = vec[2] || '';
  const timePos = vec[3];
  const lon     = vec[5];
  const lat     = vec[6];
  const baroAlt = vec[7];
  const onGround = vec[8];
  const velocity = vec[9];
  const track   = vec[10];
  const vertRate = vec[11];
  const geoAlt  = vec[13];
  const squawk  = vec[14];

  if (lat == null || lon == null || onGround) return null;

  const callsign = (rawCs || icao24 || '').trim();
  if (!callsign) return null;

  const altMeters = baroAlt != null ? baroAlt : (geoAlt != null ? geoAlt : 10000);
  const altitude = Math.max(0, Math.round(altMeters * 3.28084));
  const speed = velocity != null ? Math.round(velocity * 1.94384) : 450;
  const heading = track != null ? Math.round(track) : 0;
  const squawkStr = squawk || '----';

  const acMeta = {
    flight: callsign,
    hex: icao24,
    squawk: squawkStr,
    alt_baro: altitude,
    gs: speed,
    track: heading
  };

  const isCuriosity = detectLiveCuriosity(acMeta);
  const trajectory = buildLiveTrajectory(lat, lon, heading);

  return {
    id: icao24,
    type: 'aircraft',
    callsign,
    airline: deriveAirline(callsign),
    aircraftType: 'Commercial / Civil',
    registration: country,
    squawk: squawkStr,
    lat,
    lng: lon,
    altitude,
    speed,
    heading,
    verticalRate: vertRate != null ? Math.round(vertRate * 196.85) : 0,
    progress: 0.5,
    timestamp: timePos ? new Date(timePos * 1000).toISOString() : new Date().toISOString(),
    isCuriosity,
    curiosityNote: isCuriosity ? getLiveCuriosityNote(acMeta) : null,
    trajectory,
    altitudeHistory: Array(10).fill(altitude),
    origin: { code: country ? country.slice(0, 3).toUpperCase() : 'ORIG', name: country || 'Origin Country', lat: trajectory[0][0], lng: trajectory[0][1] },
    destination: { code: 'DEST', name: 'En Route', lat: trajectory[2][0], lng: trajectory[2][1] }
  };
}

function mapUsgsToEvent(feature) {
  const p        = feature.properties;
  const [lon, lat, depth] = feature.geometry.coordinates;
  const mag      = p.mag || 0;
  const isCuriosity = mag >= 5.5;
  return {
    id: feature.id,
    type: 'earthquake',
    name: (p.title || `M${mag} Earthquake`).replace('M ', 'M').replace(' - ', ' — '),
    lat, lng: lon,
    severity: mag >= 6.5 ? 'high' : mag >= 5.5 ? 'medium' : 'low',
    magnitude: mag,
    depth: `${Math.round(depth || 0)} km`,
    timestamp: new Date(p.time).toISOString(),
    isCuriosity,
    curiosityNote: isCuriosity ? `M${mag} — significant event, potential regional impact` : null,
    description: p.place || 'Location unknown',
  };
}

function setLiveStatus(msg, variant) {
  if (!liveStatusEl) {
    liveStatusEl = Object.assign(document.createElement('div'), { id: 'live-status' });
    document.body.appendChild(liveStatusEl);
  }
  liveStatusEl.textContent = msg;
  liveStatusEl.className   = variant || '';
  liveStatusEl.style.opacity = '1';
}
function clearLiveStatus() {
  if (liveStatusEl) liveStatusEl.style.opacity = '0';
}

async function loadLiveData() {
  setLiveStatus('◉  Fetching live feeds…');

  // ── 1. Aircraft: VATSIM Global Network (CORS Open `*`, 1000+ live flights) ──
  try {
    const res = await fetch('https://data.vatsim.net/v3/vatsim-data.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.pilots)) {
        const mapped = data.pilots.map(mapVatsimToEntity).filter(Boolean);
        if (mapped.length > 0) {
          mapped.sort(() => Math.random() - 0.5);
          LIVE_AIRCRAFT = mapped.slice(0, 400);
        }
      }
    }
  } catch (err) {
    console.warn('[LOKSA] Primary VATSIM feed failed:', err.message);
  }

  // ── 2. Fallback Aircraft: OpenSky via proxy ──────────────────────────────
  if (!LIVE_AIRCRAFT || LIVE_AIRCRAFT.length === 0) {
    try {
      const res = await fetch('https://api.codetabs.com/v1/proxy?quest=https://opensky-network.org/api/states/all');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.states)) {
          const mapped = data.states.map(mapOpenSkyToEntity).filter(Boolean);
          if (mapped.length > 0) {
            mapped.sort(() => Math.random() - 0.5);
            LIVE_AIRCRAFT = mapped.slice(0, 300);
          }
        }
      }
    } catch (e) {
      console.warn('[LOKSA] OpenSky fallback failed:', e.message);
    }
  }

  // ── 3. Earthquakes: USGS M2.5+ past 24h (CORS Open `*`) ─────────────────
  try {
    const resp = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data.features)) {
        LIVE_EVENTS = data.features
          .filter(f => f.geometry?.coordinates && typeof f.properties.mag === 'number')
          .map(mapUsgsToEvent);
      }
    }
  } catch (err) {
    console.warn('[LOKSA] Earthquake feed failed:', err.message);
  }

  // Refresh globe + UI counters & status pill
  updateGlobeEntities();

  const acN = LIVE_AIRCRAFT ? LIVE_AIRCRAFT.length : AIRCRAFT.length;
  const eqN = LIVE_EVENTS ? LIVE_EVENTS.length : EVENTS.length;
  const live = LIVE_AIRCRAFT !== null || LIVE_EVENTS !== null;

  setLiveStatus(
    live
      ? `◉  LIVE  ·  ${acN} live aircraft  ·  ${eqN} seismic events`
      : '○  Demo mode — live feeds unavailable',
    live ? 'live' : 'offline'
  );
  setTimeout(clearLiveStatus, live ? 5000 : 7000);
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initGlobe();
  loadLiveData();
  setInterval(loadLiveData, 15000); // auto-refresh every 15 s
});
