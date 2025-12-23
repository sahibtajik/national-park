# National Park A–Z AI Atlas

Design-forward, single-page experience for all 63 U.S. National Parks. The UI uses 3D-inspired emoji markers, glassmorphism cards, and an AI-style concierge that curates park matches and mini itineraries.

## Running the experience
1. From the repository root start a lightweight server (so ES modules load correctly):
   ```bash
   python -m http.server 4173
   ```
2. Open `http://localhost:4173` in your browser to explore the interactive map, filters, and AI concierge.

## Features
- 63-park dataset with regions, seasons, vibes, and signature activities.
- Stylized map markers with hover/tap spotlight details.
- Rich filtering by search, region, season, environment, and activity chips.
- AI concierge that scores parks by your prompt, season, and mood chips, then returns curated picks with mini itineraries.
- Timeline quick-picks highlighting seasonal vibes across the system.
