import { parks } from './data/parks.js';

const mapEl = document.getElementById('map');
const heroMap = document.getElementById('heroMap');
const gridEl = document.getElementById('parkGrid');
const spotlightName = document.getElementById('spotlightName');
const spotlightDesc = document.getElementById('spotlightDesc');
const spotlightTags = document.getElementById('spotlightTags');
const searchInput = document.getElementById('searchInput');
const regionSelect = document.getElementById('regionSelect');
const seasonSelect = document.getElementById('seasonSelect');
const environmentSelect = document.getElementById('environmentSelect');
const activityChips = document.getElementById('activityChips');
const moodChips = document.getElementById('moodChips');
const promptInput = document.getElementById('promptInput');
const daysInput = document.getElementById('daysInput');
const generatePlan = document.getElementById('generatePlan');
const planOutput = document.getElementById('planOutput');
const timelineGrid = document.getElementById('timelineGrid');
const countParks = document.getElementById('countParks');
const mapSpotlight = document.getElementById('mapSpotlight');

let activityFilter = null;
let moodFilter = null;

const environments = {
  Coastal: ["coast", "bay", "island", "marine"],
  Mountains: ["alpine", "peaks", "mountain", "volcano"],
  Canyon: ["canyon", "gorge"],
  Desert: ["desert", "dune"],
  Forest: ["forest", "wood", "grove"],
  Islands: ["island", "archipelago", "reef"],
};

const deriveEnvironment = (park) => {
  const text = `${park.environment} ${park.description} ${park.tagline}`.toLowerCase();
  for (const [env, keys] of Object.entries(environments)) {
    if (keys.some((k) => text.includes(k))) return env;
  }
  return "Wild";
};

const formatStates = (states) => states.join(" · ");

function renderMarkers(target, parksList) {
  target.innerHTML = '';
  parksList.forEach((park, idx) => {
    const marker = document.createElement('div');
    marker.className = 'marker';
    marker.style.left = `${park.coordinates.x}%`;
    marker.style.top = `${park.coordinates.y}%`;
    marker.innerHTML = `<span>${park.emoji}</span><span class="mini-label">${park.name.split(' ')[0]}</span>`;
    marker.style.zIndex = 5 + idx;
    marker.addEventListener('mouseenter', () => updateSpotlight(park));
    marker.addEventListener('click', () => updateSpotlight(park));
    target.appendChild(marker);
  });
}

function renderGrid(parksList) {
  gridEl.innerHTML = '';
  parksList.forEach((park) => {
    const env = deriveEnvironment(park);
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="card__header">
        <div class="card__emoji">${park.emoji}</div>
        <div>
          <h3>${park.name}</h3>
          <div class="meta">${formatStates(park.states)} · ${park.region} · ${env}</div>
        </div>
      </div>
      <p class="meta">${park.description}</p>
      <div class="tag-row">
        <span class="tag">${park.tagline}</span>
        <span class="tag">Best: ${park.bestTime}</span>
      </div>
    `;
    card.addEventListener('mouseenter', () => updateSpotlight(park));
    gridEl.appendChild(card);
  });
}

function updateSpotlight(park) {
  spotlightName.textContent = park.name;
  spotlightDesc.textContent = `${park.description} Best seasons: ${park.bestTime}.`;
  spotlightTags.innerHTML = '';
  const tags = [park.region, deriveEnvironment(park), ...park.activities.slice(0, 2)];
  tags.forEach((t) => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = t;
    spotlightTags.appendChild(tag);
  });
  mapSpotlight.classList.add('pulse');
  setTimeout(() => mapSpotlight.classList.remove('pulse'), 400);
}

function applyFilters() {
  const term = searchInput.value.toLowerCase();
  const region = regionSelect.value;
  const season = seasonSelect.value;
  const env = environmentSelect.value;

  const filtered = parks.filter((park) => {
    const text = `${park.name} ${park.description} ${park.tagline} ${park.activities.join(' ')}`.toLowerCase();
    const matchesTerm = !term || text.includes(term);
    const matchesRegion = region === 'all' || park.region === region;
    const matchesSeason = season === 'all' || park.seasonFocus.includes(season);
    const derived = deriveEnvironment(park);
    const matchesEnv = env === 'all' || derived === env;
    const matchesActivity = !activityFilter || park.activities.some((act) => act.toLowerCase().includes(activityFilter));
    return matchesTerm && matchesRegion && matchesSeason && matchesEnv && matchesActivity;
  });

  renderGrid(filtered);
  renderMarkers(mapEl, filtered.slice(0, 40));
  renderMarkers(heroMap, filtered.slice(0, 18));
  countParks.textContent = filtered.length;
}

function attachChipControls() {
  activityChips.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const active = chip.classList.toggle('active');
      activityChips.querySelectorAll('.chip').forEach((c) => {
        if (c !== chip) c.classList.remove('active');
      });
      activityFilter = active ? chip.dataset.activity : null;
      applyFilters();
    });
  });

  moodChips.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const active = chip.classList.toggle('active');
      moodChips.querySelectorAll('.chip').forEach((c) => {
        if (c !== chip) c.classList.remove('active');
      });
      moodFilter = active ? chip.dataset.mood : null;
    });
  });
}

function scorePark(park, prompt, season, mood) {
  const text = `${park.name} ${park.description} ${park.tagline} ${park.activities.join(' ')}`.toLowerCase();
  const tokens = prompt.split(/\s+/).filter(Boolean);
  let score = 0;
  tokens.forEach((token) => {
    if (text.includes(token)) score += 2;
  });
  if (season && park.seasonFocus.includes(season)) score += 3;
  if (mood) {
    const env = deriveEnvironment(park).toLowerCase();
    if (env.includes(mood) || park.description.toLowerCase().includes(mood)) score += 3;
  }
  if (activityFilter) {
    if (park.activities.some((act) => act.toLowerCase().includes(activityFilter))) score += 2;
  }
  score += Math.random();
  return score;
}

function generateItinerary() {
  const prompt = promptInput.value.toLowerCase();
  const days = Number(daysInput.value) || 4;
  const season = seasonSelect.value === 'all' ? null : seasonSelect.value;

  const ranked = [...parks]
    .map((park) => ({ park, score: scorePark(park, prompt, season, moodFilter) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  planOutput.innerHTML = `
    <p class="eyebrow">Curated picks</p>
    <h3>${prompt ? "Your vibe" : "Fresh inspiration"}</h3>
    <ul class="list">
      ${ranked
        .map(({ park }, idx) => {
          const env = deriveEnvironment(park);
          return `<li>
              <strong>${idx + 1}. ${park.name}</strong> · ${env} · ${park.bestTime}<br/>
              ${park.tagline}. Must-do: ${park.activities[0]}.
              <br/>Mini plan: Day 1 arrive + golden hour; Day 2 signature trail; Day 3 sunrise vista + night sky; Day ${days} finale with local icon.
            </li>`;
        })
        .join('')}
    </ul>
  `;
}

function renderTimeline() {
  const vibes = [
    { title: 'Desert glow', emoji: '🏜️', keyword: 'desert', months: 'Oct–Apr' },
    { title: 'Alpine bloom', emoji: '🏔️', keyword: 'alpine', months: 'Jul–Sep' },
    { title: 'Coastal calm', emoji: '🌊', keyword: 'coast', months: 'Mar–Jun' },
    { title: 'Rainforest mist', emoji: '🌧️', keyword: 'rainforest', months: 'May–Sep' },
  ];

  timelineGrid.innerHTML = '';
  vibes.forEach((vibe) => {
    const park = parks.find((p) => p.description.toLowerCase().includes(vibe.keyword)) || parks[0];
    const card = document.createElement('div');
    card.className = 'timeline-card';
    card.innerHTML = `
      <div class="title-row"><span>${vibe.emoji}</span><strong>${vibe.title}</strong></div>
      <p>${park.name} · ${park.bestTime}</p>
      <p>Prime months: ${vibe.months}</p>
    `;
    timelineGrid.appendChild(card);
  });
}

function init() {
  attachChipControls();
  renderMarkers(heroMap, parks.slice(0, 18));
  renderMarkers(mapEl, parks.slice(0, 40));
  renderGrid(parks);
  renderTimeline();
  updateSpotlight(parks[0]);
  countParks.textContent = parks.length;

  [searchInput, regionSelect, seasonSelect, environmentSelect].forEach((el) => {
    el.addEventListener('input', applyFilters);
    el.addEventListener('change', applyFilters);
  });

  generatePlan.addEventListener('click', generateItinerary);
}

init();
