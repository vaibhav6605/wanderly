/**
 * Seed script — populates a fresh Atlas (or local) database with realistic
 * demo data so the site has tours to browse immediately after deploy.
 *
 * Usage (from the backend/ directory):
 *   node scripts/seed.js           # skips if data already exists
 *   node scripts/seed.js --force   # drops existing data and re-seeds
 *
 * Requires MONGO_URI in .env (or as an environment variable).
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { Category } from '../src/models/Category.js'
import { Destination } from '../src/models/Destination.js'
import { Tour } from '../src/models/Tour.js'
import { User } from '../src/models/User.js'

const FORCE = process.argv.includes('--force')

// ── Helpers ────────────────────────────────────────────────────────────────

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(8, 0, 0, 0)
  return d
}

function log(msg) {
  process.stdout.write(`  ${msg}\n`)
}

// ── Seed data ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Adventure', icon: '🧗', description: 'Thrilling outdoor activities for adrenaline seekers' },
  { name: 'Cultural', icon: '🏛️', description: 'Immersive experiences in history, art, and local traditions' },
  { name: 'Beach & Islands', icon: '🏝️', description: 'Sun, sand, and tropical escapes' },
  { name: 'Wildlife & Safari', icon: '🦁', description: 'Get close to nature and wildlife in their natural habitats' },
  { name: 'Trekking & Hiking', icon: '🥾', description: 'Multi-day treks through mountains and wilderness' },
  { name: 'City Explorer', icon: '🌆', description: "Curated tours of the world's most iconic cities" },
]

const DESTINATIONS = [
  { name: 'Bali', country: 'Indonesia', city: 'Denpasar', popularTags: ['temples', 'rice terraces', 'surfing'] },
  { name: 'Patagonia', country: 'Argentina', city: 'El Calafate', popularTags: ['glaciers', 'trekking', 'wilderness'] },
  { name: 'Serengeti', country: 'Tanzania', city: 'Arusha', popularTags: ['safari', 'big five', 'migration'] },
  { name: 'Kyoto', country: 'Japan', city: 'Kyoto', popularTags: ['temples', 'geisha', 'cherry blossom'] },
  { name: 'Santorini', country: 'Greece', city: 'Thira', popularTags: ['caldera', 'sunset', 'white villages'] },
  { name: 'Machu Picchu', country: 'Peru', city: 'Cusco', popularTags: ['inca', 'archaeology', 'mountains'] },
  { name: 'Iceland', country: 'Iceland', city: 'Reykjavik', popularTags: ['northern lights', 'volcanoes', 'glaciers'] },
  { name: 'Rajasthan', country: 'India', city: 'Jaipur', popularTags: ['palaces', 'deserts', 'forts'] },
  { name: 'Amalfi Coast', country: 'Italy', city: 'Positano', popularTags: ['coastline', 'food', 'villages'] },
  { name: 'Queenstown', country: 'New Zealand', city: 'Queenstown', popularTags: ['bungee', 'skiing', 'fjords'] },
]

// ── Main ───────────────────────────────────────────────────────────────────

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('Error: MONGO_URI is not set. Copy .env.example to .env and fill it in.')
    process.exit(1)
  }

  console.log('\n🌱  Wanderly seed script')
  console.log('─'.repeat(40))

  await mongoose.connect(process.env.MONGO_URI)
  log('Connected to MongoDB')

  // Guard: skip unless forced
  if (!FORCE) {
    const tourCount = await Tour.countDocuments()
    if (tourCount > 0) {
      log(`Database already has ${tourCount} tours. Run with --force to re-seed.`)
      await mongoose.disconnect()
      return
    }
  }

  // Wipe existing data when forcing
  if (FORCE) {
    await Promise.all([
      Tour.deleteMany({}),
      Category.deleteMany({}),
      Destination.deleteMany({}),
    ])
    log('Cleared existing tours, categories, and destinations')
  }

  // ── Admin user ─────────────────────────────────────────────────────────

  let admin = await User.findOne({ role: 'admin' })
  if (!admin) {
    const passwordHash = await bcrypt.hash('Admin@1234', 12)
    admin = await User.create({
      name: 'Wanderly Admin',
      email: 'admin@wanderly.com',
      password: passwordHash,
      role: 'admin',
      isEmailVerified: true,
    })
    log(`Created admin user — email: admin@wanderly.com  password: Admin@1234`)
  } else {
    log(`Using existing admin: ${admin.email}`)
  }

  // ── Categories ─────────────────────────────────────────────────────────

  const cats = {}
  for (const c of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { name: c.name },
      { $setOnInsert: c },
      { upsert: true, new: true },
    )
    cats[c.name] = doc._id
  }
  log(`Seeded ${CATEGORIES.length} categories`)

  // ── Destinations ───────────────────────────────────────────────────────

  const dests = {}
  for (const d of DESTINATIONS) {
    const doc = await Destination.findOneAndUpdate(
      { name: d.name, country: d.country },
      { $setOnInsert: d },
      { upsert: true, new: true },
    )
    dests[d.name] = doc._id
  }
  log(`Seeded ${DESTINATIONS.length} destinations`)

  // ── Tours ──────────────────────────────────────────────────────────────

  const TOURS = [
    {
      title: 'Bali Spirit & Temples',
      summary: 'Explore sacred temples, terraced rice fields, and the spiritual heart of Bali on this immersive 8-day journey.',
      description: `Bali's nickname "The Island of the Gods" is no accident. Over 8 days you'll visit ancient temples draped in volcanic mist, wander through the UNESCO-listed Jatiluwih rice terraces, and witness the mesmerizing Kecak fire dance at Uluwatu Cliff Temple at sunset.\n\nYou'll stay in a traditional family compound in Ubud, the cultural capital, where your mornings begin with optional yoga and your afternoons are spent watching master woodcarvers and silversmiths at work. A cooking class taught by a local family is a highlight — expect to leave knowing exactly how to make a proper nasi goreng.\n\nThe final two days take you to the southern coast for snorkeling in crystal-clear waters around Nusa Penida before a farewell dinner in a rice paddy.`,
      category: cats['Cultural'],
      destinations: [dests['Bali']],
      duration: { days: 8, nights: 7 },
      price: 1299,
      discountPrice: 1099,
      maxGroupSize: 14,
      difficulty: 'easy',
      inclusions: ['Airport transfers', 'All breakfasts + 4 dinners', 'English-speaking guide', 'Temple entrance fees', 'Cooking class', 'Snorkeling gear'],
      exclusions: ['International flights', 'Travel insurance', 'Lunches', 'Personal expenses'],
      itinerary: [
        { day: 1, title: 'Arrival & Ubud Welcome Dinner', description: 'Airport pickup and transfer to your Ubud compound. Evening welcome dinner.' },
        { day: 2, title: 'Sacred Monkey Forest & Tegalalang', description: 'Morning walk through the Sacred Monkey Forest. Afternoon at Tegalalang rice terraces.' },
        { day: 3, title: 'Tirta Empul & Batik Workshop', description: 'Ritual purification bath at Tirta Empul temple, followed by a batik fabric workshop.' },
        { day: 4, title: 'Jatiluwih UNESCO Rice Terraces', description: 'Full-day excursion to the sweeping Jatiluwih terraces — a UNESCO World Heritage landscape.' },
        { day: 5, title: 'Cooking Class & Free Afternoon', description: 'Morning cooking class with a local family. Free afternoon to explore Ubud market.' },
        { day: 6, title: 'Uluwatu & Kecak Fire Dance', description: 'Drive south to Uluwatu Cliff Temple. Watch the legendary Kecak fire dance at sunset.' },
        { day: 7, title: 'Nusa Penida Snorkeling', description: 'Full-day boat trip to Nusa Penida. Snorkel with manta rays at Manta Point.' },
        { day: 8, title: 'Departure', description: 'Hotel breakfast and transfer to Ngurah Rai airport.' },
      ],
      startDates: [
        { date: daysFromNow(14), availableSeats: 12 },
        { date: daysFromNow(28), availableSeats: 14 },
        { date: daysFromNow(56), availableSeats: 10 },
      ],
    },
    {
      title: 'Patagonia Glacier Trek',
      summary: 'Trek to the foot of the Perito Moreno Glacier and hike the legendary W Circuit through Torres del Paine.',
      description: `Few places on Earth feel as untouched as Patagonia. This 12-day expedition takes you deep into Chilean and Argentine Patagonia — a region of thundering glaciers, knife-edge peaks, and impossibly blue lakes.\n\nYou'll spend three days walking the W Circuit in Torres del Paine National Park, overnighting in mountain refugios. The highlight is a dawn start to the Mirador Las Torres — the moment when the first light hits the granite towers and turns them copper is something people fly halfway around the world to see.\n\nCrossing into Argentina, you'll board a boat that takes you level with the Perito Moreno Glacier and then strap on crampons for a blue-ice trekking session on the glacier itself. Expert guides with 15+ years of Patagonia experience lead every step.`,
      category: cats['Trekking & Hiking'],
      destinations: [dests['Patagonia']],
      duration: { days: 12, nights: 11 },
      price: 2899,
      maxGroupSize: 10,
      difficulty: 'challenging',
      inclusions: ['All national park fees', 'Mountain refugio accommodation', 'Glacier trekking crampons & equipment', 'Expert bilingual guide', 'All meals on trek days', 'Airport transfers'],
      exclusions: ['International flights', 'Travel insurance', 'Meals in El Calafate', 'Tips'],
      itinerary: [
        { day: 1, title: 'El Calafate Arrival', description: 'Arrival and briefing. Equipment check. Welcome dinner.' },
        { day: 2, title: 'Perito Moreno Glacier — Boat + Ice Trek', description: 'Morning boat to the glacier face, afternoon blue-ice trek with crampons.' },
        { day: 3, title: 'Transfer to Puerto Natales, Chile', description: 'Cross the border into Chile. Gear check for the W Circuit.' },
        { day: 4, title: 'W Circuit — Valle del Francés', description: 'Trek through the Valley of the French into the heart of the park.' },
        { day: 5, title: 'W Circuit — Mirador Grey Glacier', description: 'Hike to the hanging Grey Glacier and turquoise lake.' },
        { day: 6, title: 'W Circuit — Mirador Las Torres', description: 'Pre-dawn start for the iconic sunrise view of the granite towers.' },
        { day: 7, title: 'Rest Day — Puerto Natales', description: 'Free day for gear drying, hot showers, and local restaurants.' },
        { day: 8, title: 'Lago Grey Kayaking', description: 'Optional half-day kayak among floating icebergs on Lago Grey.' },
        { day: 9, title: 'El Chaltén — Fitz Roy Viewpoint', description: 'Drive to El Chaltén and hike to the base of Mount Fitz Roy.' },
        { day: 10, title: 'Laguna de los Tres', description: 'Full-day hike to the mirror lake at Fitz Roy\'s base — stunning reflections.' },
        { day: 11, title: 'Return to El Calafate', description: 'Scenic drive back. Farewell dinner.' },
        { day: 12, title: 'Departure', description: 'Transfer to El Calafate airport.' },
      ],
      startDates: [
        { date: daysFromNow(21), availableSeats: 8 },
        { date: daysFromNow(60), availableSeats: 10 },
        { date: daysFromNow(90), availableSeats: 6 },
      ],
    },
    {
      title: 'Serengeti Great Migration Safari',
      summary: "Witness the world's greatest wildlife spectacle — a million wildebeest thundering across the Serengeti plains.",
      description: `The Great Migration is considered the most dramatic wildlife event on earth. Between July and October, over 1.5 million wildebeest and 500,000 zebras cross the Mara River in search of fresh grass — and the predators follow. This 9-day safari puts you front-row for all of it.\n\nYou'll spend five nights in luxury tented camps positioned strategically along the migration route. Your experienced tracker and Maasai guide can read the landscape like a book — they'll get you to the river crossings before the crowds and stay after others leave.\n\nBeyond the migration, expect close encounters with the Big Five: lion prides napping under acacias, massive elephant herds at waterholes, and a memorable leopard draped over a tree at golden hour.`,
      category: cats['Wildlife & Safari'],
      destinations: [dests['Serengeti']],
      duration: { days: 9, nights: 8 },
      price: 3499,
      maxGroupSize: 8,
      difficulty: 'easy',
      inclusions: ['All game drives in 4x4 Land Cruiser', 'Luxury tented camp accommodation', 'Full board (all meals)', 'Flying between camps', 'Ngorongoro Crater day trip', 'Park fees', 'Airport transfers'],
      exclusions: ['International flights to Arusha/Kilimanjaro', 'Visa fees', 'Gratuities', 'Laundry', 'Alcoholic beverages'],
      itinerary: [
        { day: 1, title: 'Arusha Arrival & Briefing', description: 'Transfer to lodge. Safari briefing and welcome dinner under the stars.' },
        { day: 2, title: 'Tarangire National Park', description: 'Game drive in Tarangire — famous for its massive elephant herds and ancient baobabs.' },
        { day: 3, title: 'Ngorongoro Crater', description: 'Descend 600m into the UNESCO crater — the densest concentration of wildlife on earth.' },
        { day: 4, title: 'Fly to Central Serengeti', description: 'Scenic flight over the Serengeti. Afternoon game drive from camp.' },
        { day: 5, title: 'Mara River Crossing', description: 'Full-day wait at the river for the wildebeest crossing. Picnic lunch on the plains.' },
        { day: 6, title: 'Predator Game Drive', description: 'Early morning drive targeting cheetah and leopard. Sundowner on a kopje.' },
        { day: 7, title: 'Northern Serengeti Bush Walk', description: 'Guided bush walk with a Maasai ranger. See the landscape on foot.' },
        { day: 8, title: 'Final Game Drive & Fly Out', description: 'Morning drive then flight back to Arusha. Farewell dinner.' },
        { day: 9, title: 'Departure', description: 'Transfer to Kilimanjaro International Airport.' },
      ],
      startDates: [
        { date: daysFromNow(10), availableSeats: 6 },
        { date: daysFromNow(40), availableSeats: 8 },
        { date: daysFromNow(75), availableSeats: 4 },
      ],
    },
    {
      title: 'Kyoto & Tokyo: Ancient Meets Modern',
      summary: "Seven days moving between Japan's imperial past in Kyoto and its electrifying future in Tokyo.",
      description: `Japan is a country of contrasts that somehow feels utterly coherent. This 7-day tour splits your time between Kyoto — city of 1,600 Buddhist temples, geisha districts, and meditative bamboo groves — and Tokyo, the most kinetic city on the planet.\n\nIn Kyoto you'll walk the Fushimi Inari mountain trail lined with thousands of vermilion torii gates, participate in a traditional matcha tea ceremony, and stroll the preserved wooden streets of Gion district at dusk. A day trip to Nara lets you hand-feed the city's famously polite deer in front of the world's largest wooden building.\n\nIn Tokyo the pace shifts completely — you'll explore Shibuya's neon scramble crossing, taste your way through Tsukiji Outer Market, and visit teamLab Borderless, the world's largest digital art museum.`,
      category: cats['Cultural'],
      destinations: [dests['Kyoto']],
      duration: { days: 7, nights: 6 },
      price: 1799,
      discountPrice: 1599,
      maxGroupSize: 16,
      difficulty: 'easy',
      inclusions: ['All ground transport (Shinkansen included)', 'Hotels (3★ ryokan in Kyoto, 4★ in Tokyo)', 'Tea ceremony', 'Nara day trip', 'Airport transfers', 'IC transport card'],
      exclusions: ['International flights', 'Meals (except welcome dinner)', 'Travel insurance', 'TeamLab entry (optional add-on)'],
      itinerary: [
        { day: 1, title: 'Arrival in Kyoto', description: 'Airport pickup. Transfer to your traditional ryokan. Welcome dinner in a kaiseki restaurant.' },
        { day: 2, title: 'Fushimi Inari & Gion', description: 'Morning hike through the Fushimi Inari torii gates. Evening walk through Gion geisha district.' },
        { day: 3, title: 'Arashiyama & Tea Ceremony', description: 'Bamboo grove and Tenryu-ji garden in the morning. Afternoon matcha tea ceremony.' },
        { day: 4, title: 'Nara Day Trip', description: 'Full day in Nara: Todai-ji temple, the giant Buddha, and deer park.' },
        { day: 5, title: 'Shinkansen to Tokyo', description: 'Morning bullet train. Afternoon exploring Asakusa\'s Senso-ji temple and market.' },
        { day: 6, title: 'Shibuya, Harajuku & Tsukiji', description: 'Scramble crossing, Takeshita Street fashion, fresh sushi breakfast at Tsukiji.' },
        { day: 7, title: 'Departure', description: 'Free morning. Transfer to Narita or Haneda airport.' },
      ],
      startDates: [
        { date: daysFromNow(18), availableSeats: 14 },
        { date: daysFromNow(35), availableSeats: 16 },
        { date: daysFromNow(65), availableSeats: 12 },
      ],
    },
    {
      title: 'Santorini & Greek Islands Sail',
      summary: 'Sail between Santorini, Mykonos, and Milos on a private catamaran — white villages, volcanic beaches, and the Aegean at your feet.',
      description: `This 8-day voyage loops you through the best of the Cyclades aboard a 40-foot sailing catamaran with a skipper and chef. Wake up in a different bay every morning — sometimes alongside a ruined castle, sometimes off a black-sand beach where the volcanic sand is warm to the touch even in October.\n\nSantorini's caldera is your starting point — you'll watch the famous sunset from Oia before anyone else because you're anchored right below it. Mykonos gives you a night in the famous windmill town. But the revelation is Milos, less visited and strikingly beautiful, with the chalky Sarakiniko moonscape and the sea caves at Sykia accessible only by boat.\n\nCatering is handled by an onboard Greek chef — expect fresh octopus, gigantes plaki, and local wines every evening.`,
      category: cats['Beach & Islands'],
      destinations: [dests['Santorini']],
      duration: { days: 8, nights: 7 },
      price: 2299,
      maxGroupSize: 10,
      difficulty: 'easy',
      inclusions: ['Catamaran with skipper + chef', 'All meals onboard', 'Cabin accommodation on boat', 'Fuel and port fees', 'Snorkeling equipment', 'Transfers from/to Santorini airport'],
      exclusions: ['International flights', 'Travel insurance', 'Alcoholic beverages', 'Shore excursion fees', 'Gratuities'],
      itinerary: [
        { day: 1, title: 'Santorini — Oia Sunset', description: 'Board the catamaran at Ammoudi Bay. Sail under the caldera cliffs to Oia for sunset.' },
        { day: 2, title: 'Red Beach & Hot Springs', description: 'Snorkel at the famous Red Beach. Swim in the natural volcanic hot springs.' },
        { day: 3, title: 'Ios — the Party Island', description: 'Sail to Ios. Hike up to the Chora village for panoramic views, evening in the port.' },
        { day: 4, title: 'Milos — Sarakiniko', description: 'Early arrival at Milos. Morning at the lunar Sarakiniko landscape, afternoon cave swimming.' },
        { day: 5, title: 'Milos — Kleftiko Sea Caves', description: 'Anchor at the pirate caves of Kleftiko — snorkeling in crystal arches of rock.' },
        { day: 6, title: 'Folegandros', description: 'The most unspoiled island in the Cyclades. Hike to Panagia church, dinner in the Chora square.' },
        { day: 7, title: 'Mykonos — Windmills & Little Venice', description: 'Sail into Mykonos. Explore the iconic windmills, Little Venice, and the market streets.' },
        { day: 8, title: 'Return to Santorini & Departure', description: 'Morning sail back to Santorini. Disembark and transfer to the airport.' },
      ],
      startDates: [
        { date: daysFromNow(22), availableSeats: 8 },
        { date: daysFromNow(50), availableSeats: 10 },
        { date: daysFromNow(80), availableSeats: 6 },
      ],
    },
    {
      title: 'Inca Trail to Machu Picchu',
      summary: 'Hike the legendary 4-day Inca Trail through cloud forest and Andean passes to arrive at Machu Picchu at the Sun Gate.',
      description: `The Inca Trail is one of the world's great treks — not just for the destination (though arriving through the Sun Gate at dawn with Machu Picchu materializing out of the mist is as good as it gets) but for everything in between: cloud forest dripping with orchids, ruins that no one visits except trekkers, views of snow peaks above 4,200m passes.\n\nThe 45km trail is done in four days with professional porters who carry your camping gear so you only carry your daypack. Nights are in comfortable tented camps along the trail, with a chef cooking hot three-course meals. You'll reach Machu Picchu on the morning of day four, arriving at the Sun Gate before the first bus tourists, with the terraces below lit by the rising sun.\n\nPermits are strictly limited to 500 people per day — book well in advance.`,
      category: cats['Trekking & Hiking'],
      destinations: [dests['Machu Picchu']],
      duration: { days: 7, nights: 6 },
      price: 1650,
      maxGroupSize: 12,
      difficulty: 'difficult',
      inclusions: ['Inca Trail permit', 'Professional licensed guide', 'Porters', 'All camping equipment', 'All meals on trail', 'Machu Picchu entrance fee', 'Train back to Cusco', 'Altitude acclimatization day'],
      exclusions: ['International flights to Lima/Cusco', 'Sleeping bag (rental available)', 'Travel insurance (mandatory)', 'Tips for porters'],
      itinerary: [
        { day: 1, title: 'Cusco Arrival & Acclimatization', description: 'Transfer from Cusco airport. Gentle afternoon walk to Sacred Valley to acclimatize at 2,800m.' },
        { day: 2, title: 'Sacred Valley & Briefing', description: 'Visit Pisac ruins and Ollantaytambo fortress. Trek briefing and gear check.' },
        { day: 3, title: 'Trail Day 1 — Km82 to Wayllabamba', description: 'Trail start at Km82. Walk through farmland and cloud forest (12km, 400m ascent).' },
        { day: 4, title: 'Trail Day 2 — Dead Woman\'s Pass', description: 'Hardest day: cross Dead Woman\'s Pass at 4,215m. Views of glaciated peaks. (16km)' },
        { day: 5, title: 'Trail Day 3 — Runkurakay & Phuyupatamarca', description: 'Several ruins today including Phuyupatamarca — "Town in the Clouds". Descend through cloud forest.' },
        { day: 6, title: 'Trail Day 4 — Sun Gate & Machu Picchu', description: 'Pre-dawn start to reach the Sun Gate at sunrise. Full guided tour of Machu Picchu citadel.' },
        { day: 7, title: 'Train & Return to Cusco', description: 'Free morning at Aguas Calientes. Afternoon train back to Cusco. Farewell dinner.' },
      ],
      startDates: [
        { date: daysFromNow(30), availableSeats: 10 },
        { date: daysFromNow(58), availableSeats: 12 },
        { date: daysFromNow(100), availableSeats: 8 },
      ],
    },
    {
      title: 'Iceland Northern Lights & Fire',
      summary: "Chase the Aurora Borealis across Iceland's volcanic highlands — geysers, black sand beaches, waterfalls, and the midnight sky on fire.",
      description: `Iceland in winter is a different planet. In six days you'll drive the Golden Circle and the South Coast, swim in the geothermal waters of the Blue Lagoon, hike across a glacier, and — if the skies cooperate — watch the Northern Lights ripple green and violet above a snow-covered lava field.\n\nYour guide is a professional aurora forecaster who tracks geomagnetic activity daily and drives you to the darkest, clearest location away from any light pollution. Historical data shows 80%+ of our departures see the Aurora at least once.\n\nBeyond the lights: Geysir erupting every five minutes, Gullfoss waterfall thundering into a gorge, puffin colonies at Reynisfjara black-sand beach, and ice caves inside the Vatnajökull glacier — the largest in Europe.`,
      category: cats['Adventure'],
      destinations: [dests['Iceland']],
      duration: { days: 6, nights: 5 },
      price: 2099,
      maxGroupSize: 12,
      difficulty: 'moderate',
      inclusions: ['4WD minibus transport', 'Hotel accommodation (3★)', 'Glacier hike crampons & ice axes', 'Aurora forecast service', 'Blue Lagoon entry', 'All breakfasts', 'Airport transfers'],
      exclusions: ['International flights', 'Dinners (plenty of good restaurants)', 'Travel insurance', 'Ice cave entry (optional, seasonal)'],
      itinerary: [
        { day: 1, title: 'Reykjavik Arrival', description: 'Airport pickup. Afternoon city walk including Hallgrímskirkja church and Harpa Concert Hall.' },
        { day: 2, title: 'Golden Circle', description: 'Þingvellir National Park, Geysir hot spring area (erupts every 5 min), Gullfoss waterfall.' },
        { day: 3, title: 'South Coast & Black Sand Beach', description: 'Seljalandsfoss (walk behind the waterfall), Skógafoss, Reynisfjara black-sand beach.' },
        { day: 4, title: 'Glacier Hike on Sólheimajökull', description: 'Morning glacier hike with crampons and ice axes. Afternoon free. Evening aurora hunt.' },
        { day: 5, title: 'Blue Lagoon & Aurora', description: 'Afternoon at the famous Blue Lagoon. Night aurora hunt with the forecast guide.' },
        { day: 6, title: 'Departure', description: 'Blue Lagoon is on the way to the airport — optional final soak before check-in.' },
      ],
      startDates: [
        { date: daysFromNow(15), availableSeats: 10 },
        { date: daysFromNow(45), availableSeats: 12 },
        { date: daysFromNow(70), availableSeats: 8 },
      ],
    },
    {
      title: 'Royal Rajasthan Palace Tour',
      summary: "Travel through India's most regal state — Jaipur's pink palaces, Jodhpur's blue city, and the Thar Desert under a billion stars.",
      description: `Rajasthan is India at its most theatrical. Maharajas built forts the size of small cities on clifftops; bazaars overflow with camel-hide puppets, block-printed textiles, and silver jewellery; and the Thar Desert stretches to Pakistan with nothing in between but camel caravans and night skies so dark you can see the Milky Way clearly with the naked eye.\n\nThis 10-day itinerary covers the Golden Triangle (Delhi–Agra–Jaipur) plus the deeper Rajasthan that most tourists never reach: the indigo-painted lanes of Jodhpur, the marble-white Jain temples of Ranakpur, and a genuine camel-trek overnight in the dunes outside Jaisalmer.\n\nYou'll stay two nights in a heritage haveli that was a 19th-century merchant mansion — thick walls that stay cool in the desert heat, inner courtyards, and hand-painted frescoes in every corridor.`,
      category: cats['Cultural'],
      destinations: [dests['Rajasthan']],
      duration: { days: 10, nights: 9 },
      price: 1450,
      discountPrice: 1199,
      maxGroupSize: 14,
      difficulty: 'easy',
      inclusions: ['Private A/C vehicle throughout', 'Hotel + 2 nights heritage haveli', 'Taj Mahal entry', 'All breakfasts + 3 dinners', 'Camel trek + desert camp', 'English-speaking guide', 'Airport transfers'],
      exclusions: ['International flights', 'Lunches', 'Camera fees at monuments', 'Tips', 'Travel insurance'],
      itinerary: [
        { day: 1, title: 'Delhi Arrival', description: 'Airport pickup. Evening walk in Paharganj market.' },
        { day: 2, title: 'Delhi Sightseeing', description: 'Qutub Minar, Humayun\'s Tomb, India Gate, and Red Fort.' },
        { day: 3, title: 'Agra — Taj Mahal at Sunrise', description: 'Early train to Agra. Taj Mahal at dawn before crowds. Agra Fort.' },
        { day: 4, title: 'Jaipur — Pink City', description: 'Drive to Jaipur. Amber Fort, City Palace, Hawa Mahal (Palace of the Winds).' },
        { day: 5, title: 'Jaipur Markets & Jantar Mantar', description: 'Morning at Jantar Mantar observatory. Afternoon in Johari Bazaar for gems and textiles.' },
        { day: 6, title: 'Jodhpur — The Blue City', description: 'Drive to Jodhpur. Mehrangarh Fort overlooking the indigo-painted old city.' },
        { day: 7, title: 'Ranakpur Jain Temples', description: 'Day trip to Ranakpur — 1,444 intricately carved marble columns, all different.' },
        { day: 8, title: 'Jaisalmer — The Golden City', description: 'Drive through the Thar Desert to Jaisalmer. Explore the sandstone fort at dusk.' },
        { day: 9, title: 'Camel Trek & Desert Camp', description: 'Afternoon camel trek into the dunes. Overnight in a desert camp under the stars.' },
        { day: 10, title: 'Fly Back to Delhi & Departure', description: 'Morning jeep safari. Flight from Jaisalmer to Delhi for onward connection.' },
      ],
      startDates: [
        { date: daysFromNow(20), availableSeats: 12 },
        { date: daysFromNow(50), availableSeats: 14 },
        { date: daysFromNow(85), availableSeats: 10 },
      ],
    },
    {
      title: 'Amalfi Coast & Cinque Terre',
      summary: 'Cliffside villages, lemon groves, and the bluest water in Europe on a 9-day Italian coastal masterpiece.',
      description: `Italy's two most famous coastlines in a single trip. The Amalfi Coast in the south is pure drama — vertical limestone cliffs dropping into the Tyrrhenian Sea, towns that seem to have been glued to the rock face, and the scent of lemon groves everywhere. The Cinque Terre in the north is gentler but no less beautiful: five medieval fishing villages connected by coastal trails above terraced vineyards.\n\nYou'll travel between the coasts on a private sailing yacht, spending nights in local family-run guesthouses rather than chain hotels. A full day is dedicated to a cooking class with an Amalfi nonna — making fresh pasta, limoncello, and the local pumpkin-flower fritto.\n\nKey stops: Positano, Ravello (with its famous gardens), Pompeii, and the boat-only accessible sea caves of the Blue Grotto on Capri.`,
      category: cats['Beach & Islands'],
      destinations: [dests['Amalfi Coast']],
      duration: { days: 9, nights: 8 },
      price: 1999,
      maxGroupSize: 12,
      difficulty: 'moderate',
      inclusions: ['Boat transfers along coast', 'Boutique guesthouse accommodation', 'Cooking class', 'Pompeii guided entry', 'Blue Grotto boat entry', 'All breakfasts', 'Airport transfers'],
      exclusions: ['International flights', 'Lunches and dinners (except cooking class)', 'Cinque Terre hiking card', 'Travel insurance'],
      itinerary: [
        { day: 1, title: 'Naples Arrival', description: 'Airport pickup. Transfer to Positano by private boat.' },
        { day: 2, title: 'Positano & Praiano', description: 'Explore Positano\'s vertical streets and ceramic-tiled church. Afternoon in quiet Praiano.' },
        { day: 3, title: 'Pompeii & Herculaneum', description: 'Full day at the Roman ruins of Pompeii and Herculaneum — preserved by Vesuvius in 79AD.' },
        { day: 4, title: 'Ravello & Cooking Class', description: 'Morning in Ravello\'s Villa Rufolo gardens. Afternoon pasta and limoncello cooking class.' },
        { day: 5, title: 'Capri & Blue Grotto', description: 'Full day on Capri island. Swim off the rocks, visit the Villa Jovis, enter the Blue Grotto by rowboat.' },
        { day: 6, title: 'Train North to Cinque Terre', description: 'High-speed train to La Spezia. Transfer to Riomaggiore, the first of the five villages.' },
        { day: 7, title: 'Trail Hiking: Manarola to Corniglia', description: 'Hike the vineyards trail. Each village has its own character and own anchovies recipe.' },
        { day: 8, title: 'Vernazza & Monterosso', description: 'Boat between the two northern villages. Afternoon beach swim. Farewell dinner in Vernazza.' },
        { day: 9, title: 'Departure from Genoa or Pisa', description: 'Transfer to airport for onward flights.' },
      ],
      startDates: [
        { date: daysFromNow(25), availableSeats: 10 },
        { date: daysFromNow(55), availableSeats: 12 },
        { date: daysFromNow(90), availableSeats: 8 },
      ],
    },
    {
      title: 'New Zealand South Island Adventure',
      summary: 'Bungee jump in Queenstown, kayak Milford Sound, and hike the Routeburn Track through Middle-earth landscapes.',
      description: `New Zealand's South Island is the adventure capital of the world and one of the most scenically diverse places on Earth — all within a country smaller than California. In 10 days you'll cover fjords, glaciers, mountains, and some of the finest hiking trails in the Southern Hemisphere.\n\nQueenstown serves as your base for the first half: the original bungee jump off the Kawarau Bridge, a jet boat through the Shotover Canyon, and world-class mountain biking on the Queenstown Trail. A small-plane flight takes you over Mt Cook to the West Coast glaciers.\n\nMilford Sound in Fiordland National Park is non-negotiable — a cruise through the fjord past Mitre Peak and waterfalls that flow even on sunny days. You'll close out with two days on the Routeburn Track, one of the 'Great Walks' that winds above the treeline through landscapes straight out of Lord of the Rings.`,
      category: cats['Adventure'],
      destinations: [dests['Queenstown']],
      duration: { days: 10, nights: 9 },
      price: 2499,
      maxGroupSize: 10,
      difficulty: 'challenging',
      inclusions: ['Queenstown bungee + jet boat combo', 'Milford Sound cruise', 'Routeburn Track 2-day guided hike', 'Small-plane glacier flight', '4★ hotel + trail lodges', 'Airport transfers', 'All track fees'],
      exclusions: ['International flights', 'Meals (self-catered on track, restaurants in Queenstown)', 'Travel insurance', 'Ski pass (optional in winter)'],
      itinerary: [
        { day: 1, title: 'Queenstown Arrival', description: 'Airport pickup. Explore the lakefront and Skyline Gondola for panoramic views.' },
        { day: 2, title: 'Bungee + Jet Boat Day', description: 'Morning Kawarau Bridge bungee jump. Afternoon Shotover Canyon jet boat.' },
        { day: 3, title: 'Glacier Flight over Mt Cook', description: 'Small-plane scenic flight over Mt Cook and the Franz Josef and Fox glaciers.' },
        { day: 4, title: 'Wanaka & Ruby Island Kayak', description: 'Drive to Wanaka. Kayak to Ruby Island on crystal Lake Wanaka.' },
        { day: 5, title: 'Te Anau & Fiordland Intro', description: 'Transfer to Te Anau — gateway to Fiordland. Evening glowworm cave visit.' },
        { day: 6, title: 'Milford Sound Cruise', description: 'Full-day excursion on Milford Sound — waterfalls, seals, dolphins, Mitre Peak.' },
        { day: 7, title: 'Routeburn Track Day 1', description: 'Trail start at the Divide. Hike through beech forest to Routeburn Falls Hut.' },
        { day: 8, title: 'Routeburn Track Day 2 — Harris Saddle', description: 'Climb to Harris Saddle (1,255m) for 360° alpine views. Descend to Routeburn Flats.' },
        { day: 9, title: 'Queenstown Return & Farewell', description: 'Complete the track. Transfer back to Queenstown. Farewell dinner by the lake.' },
        { day: 10, title: 'Departure', description: 'Transfer to Queenstown Airport.' },
      ],
      startDates: [
        { date: daysFromNow(32), availableSeats: 8 },
        { date: daysFromNow(65), availableSeats: 10 },
        { date: daysFromNow(95), availableSeats: 6 },
      ],
    },
  ]

  let created = 0
  for (const tourData of TOURS) {
    try {
      await Tour.create({ ...tourData, createdBy: admin._id })
      created++
    } catch (err) {
      log(`  ⚠  Skipped "${tourData.title}": ${err.message}`)
    }
  }
  log(`Created ${created} tours`)

  console.log('\n✅  Seed complete!\n')
  console.log('   Admin login:  admin@wanderly.com  /  Admin@1234')
  console.log('   Change the admin password after first login.\n')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message)
  process.exit(1)
})
