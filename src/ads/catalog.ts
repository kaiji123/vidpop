// Demo sponsored catalog: 20 fictional stores × 6 products = 120 offers.
// Every store and product is made up for the demo. Prices are illustrative USD.
// Row: [id, name, price, wasPrice (0 = none), rating, reviews, emoji, blurb, keywords "a|b|c"]

export interface Store {
  id: string;
  name: string;
  tagline: string;
  color: string;
}

export interface Product {
  id: string;
  store: Store;
  name: string;
  price: number;
  was?: number;
  rating: number;
  reviews: number;
  emoji: string;
  blurb: string;
  keywords: string[];
}

type Row = [string, string, number, number, number, number, string, string, string];

const STORES: (Store & { rows: Row[] })[] = [
  {
    id: 'shutterhaus', name: 'ShutterHaus', tagline: 'Cameras for people who travel', color: '#2b4c7e',
    rows: [
      ['sh-compact', 'ShutterHaus C23 Compact Camera', 1199, 1349, 4.7, 2140, '📷', 'APS-C sensor, fixed 23mm f/2 lens, film-style colour profiles.', 'camera|compact camera|x100|fujifilm|point and shoot|street photography'],
      ['sh-mirrorless', 'ShutterHaus M7 Mirrorless Body', 1649, 0, 4.6, 980, '📸', '33MP full-frame body with in-body stabilisation.', 'mirrorless|camera body|full frame|sony alpha|canon eos|nikon z|dslr'],
      ['sh-prime', 'ShutterHaus 35mm f/1.8 Prime Lens', 449, 529, 4.8, 1310, '🔭', 'Sharp, light everyday prime with quiet autofocus.', 'lens|prime lens|35mm|50mm|bokeh'],
      ['sh-tripod', 'ShutterHaus TravelLite Carbon Tripod', 239, 0, 4.5, 760, '🦯', '1.2 kg carbon tripod that folds to 40 cm.', 'tripod|long exposure|timelapse|time lapse'],
      ['sh-bag', 'ShutterHaus Sling 8L Camera Bag', 89, 109, 4.4, 1890, '👜', 'Quick-access sling with padded dividers.', 'camera bag|sling bag|gear bag'],
      ['sh-card', 'ShutterHaus Pro 256GB SD Card', 54, 69, 4.7, 5320, '💾', 'V60 card fast enough for 4K and burst shooting.', 'sd card|memory card|storage card'],
    ],
  },
  {
    id: 'voltpack', name: 'VoltPack', tagline: 'Power for the road', color: '#1f7a4d',
    rows: [
      ['vp-10k', 'VoltPack Slim 10,000 mAh Power Bank', 39, 49, 4.6, 8420, '🔋', 'Airline-safe, 20W USB-C, thinner than a phone.', 'power bank|portable charger|battery pack|battery'],
      ['vp-20k', 'VoltPack Max 20,000 mAh Power Bank', 69, 0, 4.5, 3110, '🔋', 'Charges a laptop over 65W USB-C PD.', 'power bank|laptop battery|20000 mah|portable charger'],
      ['vp-gan', 'VoltPack 65W GaN Wall Charger', 45, 59, 4.7, 4260, '🔌', 'Three ports, one plug, folds flat.', 'charger|wall charger|gan charger|fast charging|usb c charger'],
      ['vp-cable', 'VoltPack Braided USB-C Cable 3-Pack', 19, 0, 4.6, 12030, '➰', '1 m, 2 m and 3 m braided 100W cables.', 'cable|usb c cable|charging cable|lightning cable'],
      ['vp-adapter', 'VoltPack Universal Travel Adapter', 34, 0, 4.5, 6700, '🌐', 'Works in 150+ countries, with 2 USB-C ports.', 'travel adapter|plug adapter|power adapter|outlet'],
      ['vp-pad', 'VoltPack 3-in-1 Wireless Charging Pad', 59, 79, 4.3, 2210, '📳', 'Phone, watch and earbuds on one stand.', 'wireless charger|charging pad|magsafe|qi charger|iphone|smartphone|phone|pixel phone|galaxy'],
    ],
  },
  {
    id: 'raillink', name: 'RailLink Travel', tagline: 'Trains, tickets and data, sorted before you fly', color: '#b3261e',
    rows: [
      ['rl-jp7', 'Japan Rail Pass, 7 Days', 335, 0, 4.7, 9800, '🚄', 'Unlimited JR trains including most Shinkansen.', 'jr pass|japan rail pass|rail pass|shinkansen|bullet train'],
      ['rl-jp14', 'Japan Rail Pass, 14 Days', 525, 0, 4.7, 4100, '🚅', 'Two weeks of unlimited JR travel.', 'jr pass|japan rail pass|rail pass|two weeks in japan'],
      ['rl-eurail', 'Europe Global Rail Pass, 10 Days in 2 Months', 449, 499, 4.5, 3600, '🚆', '33 countries, travel days you choose.', 'eurail|interrail|europe rail pass|train in europe|rail pass'],
      ['rl-airport', 'Airport Express Ticket, Return', 38, 0, 4.4, 2750, '✈️', 'City centre to the airport in under an hour.', 'airport express|airport train|narita express|airport transfer'],
      ['rl-ic', 'Preloaded Transit IC Card', 25, 0, 4.6, 5120, '💳', 'Tap in on metros, buses and convenience stores.', 'suica|pasmo|ic card|metro card|subway|transit card'],
      ['rl-esim', 'Travel eSIM, 10 GB / 15 Days', 22, 29, 4.5, 7340, '📶', 'Instant mobile data on arrival, no roaming fees.', 'esim|sim card|mobile data|roaming|pocket wifi'],
    ],
  },
  {
    id: 'sonora', name: 'Sonora Audio', tagline: 'Hear more of it', color: '#5b3cc4',
    rows: [
      ['so-anc', 'Sonora Quiet One Noise-Cancelling Headphones', 279, 349, 4.6, 6120, '🎧', 'Adaptive ANC and 40-hour battery.', 'headphones|noise cancelling|noise canceling|over ear|anc'],
      ['so-buds', 'Sonora Pocket Wireless Earbuds', 129, 159, 4.4, 9030, '🎵', 'IPX4, 8 hours per charge, wireless case.', 'earbuds|airpods|wireless earbuds|in ear'],
      ['so-speaker', 'Sonora Roam Portable Speaker', 99, 0, 4.5, 4380, '🔊', 'Waterproof, floats and plays for 15 hours.', 'speaker|bluetooth speaker|portable speaker'],
      ['so-monitors', 'Sonora Studio 5 Monitor Speakers (Pair)', 349, 0, 4.7, 820, '🎚️', 'Flat response for mixing and podcasting.', 'studio monitors|monitor speakers|desk speakers|music production'],
      ['so-mic', 'Sonora Cast USB Microphone', 119, 139, 4.6, 3310, '🎙️', 'Plug-in broadcast sound for streaming and calls.', 'microphone|mic|podcast|streaming setup|usb mic'],
      ['so-turntable', 'Sonora Spin Bluetooth Turntable', 229, 0, 4.3, 1150, '💿', 'Belt drive, built-in preamp, streams to speakers.', 'turntable|record player|vinyl'],
    ],
  },
  {
    id: 'pixelforge', name: 'Pixelforge', tagline: 'Gear for the next level', color: '#0b6e99',
    rows: [
      ['pf-pad', 'Pixelforge Pro Wireless Controller', 69, 0, 4.5, 7200, '🎮', 'Hall-effect sticks, remappable back buttons.', 'controller|gamepad|joystick|playstation|xbox|nintendo switch'],
      ['pf-keyboard', 'Pixelforge 75% Mechanical Keyboard', 129, 149, 4.7, 3900, '⌨️', 'Hot-swap switches, gasket mount, wireless.', 'keyboard|mechanical keyboard|keycaps'],
      ['pf-mouse', 'Pixelforge Feather 58g Gaming Mouse', 79, 0, 4.6, 5100, '🖱️', 'Ultralight wireless with 26K sensor.', 'mouse|gaming mouse|wireless mouse'],
      ['pf-headset', 'Pixelforge Arena Gaming Headset', 99, 119, 4.4, 4600, '🎧', 'Spatial audio and detachable boom mic.', 'gaming headset|headset'],
      ['pf-monitor', 'Pixelforge 27" 1440p 165Hz Monitor', 299, 379, 4.6, 2850, '🖥️', 'IPS panel, 1 ms, HDR400.', 'monitor|gaming monitor|display|screen'],
      ['pf-capture', 'Pixelforge 4K Capture Card', 159, 0, 4.4, 1420, '📼', 'Stream and record consoles in 4K60 passthrough.', 'capture card|streaming|twitch|obs'],
    ],
  },
  {
    id: 'northbeam', name: 'Northbeam Computing', tagline: 'Work from anywhere', color: '#3d5a80',
    rows: [
      ['nb-laptop', 'Northbeam Air 14 Laptop', 999, 1149, 4.6, 2380, '💻', '14" OLED, 18-hour battery, 1.1 kg.', 'laptop|notebook|macbook|ultrabook|chromebook'],
      ['nb-tablet', 'Northbeam Slate 11 Tablet', 449, 0, 4.5, 3170, '📱', '11" 120Hz display for notes and streaming.', 'tablet|ipad|android tablet'],
      ['nb-stylus', 'Northbeam Ink Stylus', 79, 0, 4.4, 1900, '🖊️', 'Pressure-sensitive pen with magnetic charging.', 'stylus|apple pencil|digital pen|drawing tablet'],
      ['nb-stand', 'Northbeam Fold Aluminium Laptop Stand', 39, 49, 4.7, 6400, '📐', 'Raises your screen to eye level, folds to pocket size.', 'laptop stand|desk setup|ergonomic|home office'],
      ['nb-hub', 'Northbeam 8-in-1 USB-C Hub', 49, 0, 4.5, 5200, '🔗', 'HDMI 4K, SD reader, 100W pass-through.', 'usb hub|usb c hub|dongle|docking station|dock'],
      ['nb-ssd', 'Northbeam 1TB Portable SSD', 89, 119, 4.7, 7600, '🗄️', '1,050 MB/s in a drop-proof shell.', 'ssd|external drive|hard drive|portable ssd|backup'],
    ],
  },
  {
    id: 'hearthly', name: 'Hearthly Home', tagline: 'A smarter, calmer home', color: '#8c5e2a',
    rows: [
      ['hh-bulbs', 'Hearthly Colour Smart Bulbs, 4-Pack', 49, 69, 4.5, 8100, '💡', '16M colours, schedules and voice control.', 'smart bulb|light bulb|smart lights|led lights|hue'],
      ['hh-doorbell', 'Hearthly Video Doorbell', 99, 129, 4.3, 4300, '🔔', '2K video, package detection, no subscription.', 'doorbell|video doorbell|ring|security camera'],
      ['hh-vacuum', 'Hearthly Robo S2 Robot Vacuum', 299, 399, 4.4, 3700, '🧹', 'Lidar mapping, self-empty base.', 'robot vacuum|roomba|vacuum|vacuum cleaner'],
      ['hh-plug', 'Hearthly Smart Plug, 2-Pack', 24, 0, 4.6, 10200, '🔌', 'Turn anything into a smart device with energy tracking.', 'smart plug|smart home|alexa|google home'],
      ['hh-thermo', 'Hearthly Learning Thermostat', 179, 0, 4.5, 2100, '🌡️', 'Learns your schedule and cuts heating bills.', 'thermostat|heating|nest|energy bill'],
      ['hh-purifier', 'Hearthly Clear Air Purifier', 149, 189, 4.6, 3900, '🌬️', 'HEPA H13 for rooms up to 40 m².', 'air purifier|air quality|allergies|hepa|pollen'],
    ],
  },
  {
    id: 'copperpot', name: 'Copperpot Kitchen', tagline: 'Cook like you mean it', color: '#a0522d',
    rows: [
      ['cp-knife', 'Copperpot 8" Damascus Chef\'s Knife', 129, 159, 4.8, 2600, '🔪', '67-layer steel, hand-sharpened to 15°.', 'chef knife|chefs knife|kitchen knife|knife|santoku'],
      ['cp-skillet', 'Copperpot 10" Cast-Iron Skillet', 39, 0, 4.7, 9100, '🍳', 'Pre-seasoned and oven-safe for life.', 'cast iron|skillet|frying pan|pan'],
      ['cp-airfryer', 'Copperpot Crisp 5.5L Air Fryer', 89, 119, 4.6, 12400, '🍟', 'Dual-zone basket, crisp with no oil.', 'air fryer|airfryer|fryer'],
      ['cp-mixer', 'Copperpot Tilt-Head Stand Mixer', 279, 349, 4.7, 3300, '🥣', '5 qt bowl, 10 speeds, three attachments.', 'stand mixer|mixer|baking|kitchenaid'],
      ['cp-blender', 'Copperpot Vortex Blender', 119, 0, 4.5, 4800, '🥤', '1,400W, crushes ice in seconds.', 'blender|smoothie|vitamix|nutribullet'],
      ['cp-rice', 'Copperpot Fuzzy-Logic Rice Cooker', 99, 0, 4.7, 5600, '🍚', 'Perfect sushi, jasmine and brown rice.', 'rice cooker|rice|zojirushi|onigiri|instant pot|pressure cooker|slow cooker'],
    ],
  },
  {
    id: 'daybreak', name: 'Daybreak Coffee Co.', tagline: 'Better mornings, by the cup', color: '#6f4e37',
    rows: [
      ['db-espresso', 'Daybreak Barista Espresso Machine', 449, 549, 4.6, 2900, '☕', 'Built-in grinder and steam wand, 15 bar.', 'espresso machine|espresso|coffee machine|cappuccino|flat white|nespresso'],
      ['db-grinder', 'Daybreak Conical Burr Grinder', 129, 0, 4.7, 3400, '⚙️', '40 grind settings from espresso to cold brew.', 'coffee grinder|burr grinder|grinder'],
      ['db-pourover', 'Daybreak Pour-Over Starter Kit', 59, 69, 4.8, 2100, '🫖', 'Dripper, gooseneck kettle, scale and filters.', 'pour over|pourover|v60|chemex|drip coffee|kettle'],
      ['db-beans', 'Daybreak Single-Origin Beans, 1 kg', 34, 0, 4.6, 6800, '🫘', 'Ethiopian Yirgacheffe, roasted to order.', 'coffee beans|coffee|beans|roast|cafe'],
      ['db-frother', 'Daybreak Handheld Milk Frother', 19, 25, 4.4, 11200, '🥛', 'Silky foam for lattes in 15 seconds.', 'milk frother|frother|oat milk'],
      ['db-matcha', 'Daybreak Ceremonial Matcha Set', 49, 0, 4.7, 1700, '🍵', 'Uji matcha with bamboo whisk and bowl.', 'matcha|matcha latte|green tea|tea set|tea'],
    ],
  },
  {
    id: 'stride', name: 'Stride Athletics', tagline: 'Move every day', color: '#d1495b',
    rows: [
      ['st-shoes', 'Stride Glide 4 Running Shoes', 139, 160, 4.6, 7700, '👟', 'Supercritical foam for daily miles.', 'running shoes|sneakers|trainers|running|marathon|nike|adidas'],
      ['st-watch', 'Stride Pulse GPS Fitness Watch', 249, 299, 4.5, 4100, '⌚', 'GPS, heart rate, sleep and 14-day battery.', 'smartwatch|fitness watch|apple watch|fitbit|garmin|fitness tracker|step count'],
      ['st-mat', 'Stride Grip Yoga Mat', 69, 0, 4.7, 5400, '🧘', 'Natural rubber, 5 mm, non-slip when sweaty.', 'yoga mat|yoga|pilates|stretching'],
      ['st-dumbbells', 'Stride Adjustable Dumbbells, 2–24 kg', 299, 379, 4.6, 2600, '🏋️', 'Fifteen weights in one dial-select pair.', 'dumbbells|weights|home gym|strength training|workout'],
      ['st-roller', 'Stride Recovery Foam Roller', 29, 0, 4.5, 3900, '🧻', 'High-density textured roller for sore muscles.', 'foam roller|recovery|massage gun|sore muscles'],
      ['st-bottle', 'Stride 1L Insulated Water Bottle', 32, 0, 4.7, 14200, '🧴', 'Cold for 24 hours, leak-proof lid.', 'water bottle|bottle|hydration|stanley|hydro flask'],
    ],
  },
  {
    id: 'ridgeline', name: 'Ridgeline Outdoor', tagline: 'Go further outside', color: '#386641',
    rows: [
      ['rg-tent', 'Ridgeline 2-Person Ultralight Tent', 329, 399, 4.6, 1800, '⛺', '1.4 kg freestanding, pitches in 3 minutes.', 'tent|camping|campsite|backpacking'],
      ['rg-bag', 'Ridgeline −5°C Down Sleeping Bag', 219, 0, 4.7, 1300, '🛌', '650-fill down, packs to the size of a bottle.', 'sleeping bag|sleeping pad|camping'],
      ['rg-pack', 'Ridgeline Trail 40L Hiking Backpack', 159, 189, 4.6, 2700, '🎒', 'Ventilated back panel, rain cover included.', 'backpack|hiking backpack|rucksack|daypack|hiking|trek'],
      ['rg-poles', 'Ridgeline Carbon Trekking Poles', 89, 0, 4.5, 1600, '🥢', 'Foldable, 250 g per pair.', 'trekking poles|hiking poles|walking sticks|mount fuji|summit'],
      ['rg-lamp', 'Ridgeline 400-Lumen Headlamp', 35, 45, 4.6, 5100, '🔦', 'USB-C rechargeable with red night mode.', 'headlamp|flashlight|torch'],
      ['rg-stove', 'Ridgeline Micro Camping Stove', 49, 0, 4.5, 2400, '🔥', 'Boils a litre in 3.5 minutes.', 'camping stove|stove|campfire|cooking outdoors'],
    ],
  },
  {
    id: 'wayfarer', name: 'Wayfarer Luggage', tagline: 'Pack once, travel lighter', color: '#264653',
    rows: [
      ['wf-carryon', 'Wayfarer Cabin Carry-On, 38L', 229, 279, 4.7, 6300, '🧳', 'Fits overhead bins on most airlines, with a laptop sleeve.', 'carry on|carry-on|suitcase|luggage|cabin bag|hand luggage'],
      ['wf-checked', 'Wayfarer Large Checked Suitcase, 95L', 299, 0, 4.6, 3200, '🧳', 'Polycarbonate shell, 360° spinner wheels.', 'checked bag|suitcase|luggage'],
      ['wf-cubes', 'Wayfarer Compression Packing Cubes, 4-Pack', 39, 0, 4.8, 9400, '🧊', 'Pack 30% more in the same bag.', 'packing cubes|packing|pack light'],
      ['wf-pillow', 'Wayfarer Memory Foam Travel Pillow', 34, 44, 4.4, 7100, '😴', 'Supports your chin, so you can actually sleep on long flights.', 'travel pillow|neck pillow|long flight|jet lag'],
      ['wf-wallet', 'Wayfarer RFID Passport Wallet', 29, 0, 4.6, 4800, '🛂', 'Holds passport, cards, boarding pass and a pen.', 'passport|passport holder|wallet|travel wallet'],
      ['wf-tracker', 'Wayfarer Luggage Tracker Tag', 29, 0, 4.5, 5600, '📍', 'Find your bag anywhere on the map.', 'luggage tracker|airtag|tracker|lost luggage|tile'],
    ],
  },
  {
    id: 'lumen', name: 'Lumen Skin', tagline: 'Simple skincare that works', color: '#c06c84',
    rows: [
      ['lu-spf', 'Lumen Daily Fluid Sunscreen SPF 50', 24, 0, 4.7, 11800, '🧴', 'Invisible finish, no white cast.', 'sunscreen|spf|sunblock|sun cream|uv'],
      ['lu-moist', 'Lumen Barrier Repair Moisturiser', 28, 34, 4.6, 6900, '🫧', 'Ceramides and niacinamide for dry skin.', 'moisturizer|moisturiser|skincare|dry skin|face cream'],
      ['lu-vitc', 'Lumen 15% Vitamin C Serum', 32, 0, 4.5, 5200, '🍊', 'Brightens and evens skin tone.', 'serum|vitamin c|skincare routine|dark spots'],
      ['lu-cleanse', 'Lumen Gentle Gel Cleanser', 18, 0, 4.6, 8300, '🧼', 'pH-balanced and fragrance-free.', 'cleanser|face wash|skincare'],
      ['lu-masks', 'Lumen Hydrating Sheet Masks, 10-Pack', 22, 29, 4.4, 4600, '🎭', 'Hyaluronic acid for skin after a flight.', 'sheet mask|face mask|k-beauty|korean skincare|j-beauty'],
      ['lu-balm', 'Lumen SPF 30 Lip Balm Trio', 12, 0, 4.5, 7300, '💋', 'Tinted, unscented and mint.', 'lip balm|chapstick|lips'],
    ],
  },
  {
    id: 'threadfold', name: 'Thread & Fold', tagline: 'Clothes that travel well', color: '#4a4e69',
    rows: [
      ['tf-rain', 'Thread & Fold Packable Rain Jacket', 129, 159, 4.6, 3800, '🧥', 'Waterproof 3-layer shell that packs into its pocket.', 'rain jacket|raincoat|jacket|rain|umbrella'],
      ['tf-merino', 'Thread & Fold Merino Travel Tee', 59, 0, 4.7, 5100, '👕', 'Odour-resistant, so you can wear it for days.', 't-shirt|tee|merino|shirt|uniqlo'],
      ['tf-down', 'Thread & Fold Ultralight Down Jacket', 149, 189, 4.6, 4200, '🧥', '250 g of warmth that packs into a pouch.', 'down jacket|puffer|puffer jacket|winter coat|coat'],
      ['tf-jeans', 'Thread & Fold Stretch Selvedge Jeans', 98, 0, 4.5, 2900, '👖', 'Japanese denim with 2% stretch.', 'jeans|denim|trousers|pants'],
      ['tf-beanie', 'Thread & Fold Wool Beanie', 29, 0, 4.7, 3600, '🧢', 'Recycled wool, one size.', 'beanie|hat|cap|winter hat'],
      ['tf-shades', 'Thread & Fold Polarised Sunglasses', 79, 99, 4.5, 4400, '🕶️', 'UV400, acetate frames, scratch-resistant.', 'sunglasses|shades|ray-ban|ray ban'],
    ],
  },
  {
    id: 'pageturn', name: 'Pageturn Books', tagline: 'Your next favourite read', color: '#7d4f50',
    rows: [
      ['pt-reader', 'Pageturn Glow E-Reader', 139, 159, 4.7, 8700, '📖', '7" glare-free screen with warm light, waterproof.', 'e-reader|ereader|kindle|kobo|e-book|ebook'],
      ['pt-tokyo', 'Tokyo Pocket Guide, 2027 Edition', 19, 0, 4.6, 1900, '🗾', 'Neighbourhood walks, food and late-night spots.', 'travel guide|guidebook|tokyo guide|lonely planet|itinerary'],
      ['pt-cook', 'Weeknight Ramen and Rice: The Cookbook', 29, 35, 4.8, 1400, '🍜', '80 recipes in 30 minutes or less.', 'cookbook|recipe|recipes|ramen'],
      ['pt-history', 'Empires of the Silk Road (Hardcover)', 32, 0, 4.7, 2200, '📜', 'A sweeping history of trade routes across Asia.', 'history book|history|ancient|empire|archaeology'],
      ['pt-science', 'Big Questions: Space for Curious Kids', 16, 0, 4.8, 3100, '🪐', 'Illustrated answers to 100 space questions.', 'science book|space|astronomy|planets|nasa|kids book'],
      ['pt-audio', 'Pageturn Audiobooks, 3 Months', 29, 45, 4.5, 6200, '🎧', 'One audiobook a month, yours to keep.', 'audiobook|audible|podcast|reading'],
    ],
  },
  {
    id: 'brightblock', name: 'Brightblock Toys', tagline: 'Play that builds', color: '#e9a23b',
    rows: [
      ['bb-bricks', 'Brightblock City Train Building Set, 1,100 pcs', 89, 109, 4.7, 4100, '🧱', 'Motorised train with track and station.', 'building blocks|building set|bricks|lego'],
      ['bb-puzzle', 'Brightblock 1000-Piece Mount Fuji Puzzle', 24, 0, 4.6, 2600, '🧩', 'Thick, glare-free pieces with a poster guide.', 'puzzle|jigsaw|jigsaw puzzle'],
      ['bb-boardgame', 'Brightblock Trade Winds Board Game', 44, 0, 4.7, 3400, '🎲', 'Strategy for 2–5 players in 60 minutes.', 'board game|tabletop|card game|game night'],
      ['bb-rc', 'Brightblock Turbo RC Car', 59, 79, 4.4, 2800, '🏎️', '30 km/h off-road with two batteries.', 'rc car|remote control car|toy car|drone'],
      ['bb-plush', 'Brightblock Shiba Plush, 30 cm', 22, 0, 4.8, 6700, '🐕', 'Extra soft and machine-washable.', 'plush|stuffed animal|teddy|soft toy|shiba'],
      ['bb-stem', 'Brightblock Junior Robotics STEM Kit', 69, 0, 4.6, 1900, '🤖', 'Build and code 12 robots, ages 8+.', 'stem kit|robotics|coding for kids|educational toy|science kit'],
    ],
  },
  {
    id: 'pawsome', name: 'Pawsome Pets', tagline: 'Happy pets, happy homes', color: '#f28482',
    rows: [
      ['pw-food', 'Pawsome Grain-Free Dog Food, 12 kg', 64, 74, 4.6, 5300, '🦴', 'Salmon and sweet potato for sensitive stomachs.', 'dog food|puppy|dog|kibble'],
      ['pw-litter', 'Pawsome Clumping Cat Litter, 10 kg', 22, 0, 4.5, 7900, '🐈', 'Low dust, odour-locking clay.', 'cat litter|litter box|cat'],
      ['pw-harness', 'Pawsome No-Pull Dog Harness', 34, 0, 4.7, 6100, '🐕‍🦺', 'Reflective, padded, easy on and off.', 'dog harness|leash|dog walk|collar'],
      ['pw-tree', 'Pawsome Cat Tree Tower, 140 cm', 89, 109, 4.5, 3200, '🌳', 'Scratching posts, hammock and two condos.', 'cat tree|scratching post|kitten'],
      ['pw-cam', 'Pawsome Treat-Tossing Pet Camera', 129, 0, 4.4, 2400, '📹', 'See, talk to and treat your pet from anywhere.', 'pet camera|pet cam|furbo|pet'],
      ['pw-chews', 'Pawsome Durable Chew Toy Bundle', 26, 0, 4.6, 4800, '🎾', 'Five toys for heavy chewers.', 'dog toy|chew toy|tennis ball|fetch'],
    ],
  },
  {
    id: 'greenleaf', name: 'Greenleaf Garden', tagline: 'Grow something', color: '#55a630',
    rows: [
      ['gl-monstera', 'Greenleaf Monstera in Ceramic Pot', 49, 0, 4.6, 2900, '🪴', 'A 60 cm statement plant, delivered healthy.', 'houseplant|plant|plants|monstera|indoor plant'],
      ['gl-seeds', 'Greenleaf Herb Garden Seed Kit', 19, 24, 4.5, 5100, '🌱', 'Basil, mint, coriander, chives and pots.', 'seeds|herb garden|grow your own|basil'],
      ['gl-pruners', 'Greenleaf Bypass Pruning Shears', 29, 0, 4.7, 3700, '✂️', 'SK5 steel blades with an ergonomic grip.', 'pruning shears|pruners|secateurs|gardening|bonsai'],
      ['gl-hose', 'Greenleaf Expandable Garden Hose, 30 m', 39, 49, 4.3, 4400, '🚿', 'Lightweight, with 10-pattern spray nozzle.', 'garden hose|hose|watering'],
      ['gl-bed', 'Greenleaf Raised Garden Bed', 89, 0, 4.6, 1800, '🥕', 'Galvanised steel, 180 × 90 cm.', 'raised bed|garden bed|vegetable garden|allotment'],
      ['gl-light', 'Greenleaf Full-Spectrum Grow Light', 45, 59, 4.5, 2600, '🔆', 'Timer and dimmer for indoor plants.', 'grow light|indoor garden|hydroponics'],
    ],
  },
  {
    id: 'spokewise', name: 'Spokewise Cycles', tagline: 'Ride the city', color: '#2a9d8f',
    rows: [
      ['sw-ebike', 'Spokewise Metro E-Bike', 1599, 1899, 4.6, 1200, '🚲', '80 km range, belt drive, hydraulic brakes.', 'e-bike|ebike|electric bike|electric bicycle'],
      ['sw-helmet', 'Spokewise MIPS Commuter Helmet', 89, 0, 4.7, 3100, '⛑️', 'Integrated rear light and magnetic buckle.', 'helmet|bike helmet|cycling helmet'],
      ['sw-lock', 'Spokewise Folding Bike Lock', 69, 79, 4.6, 2700, '🔒', 'Hardened steel, gold-rated security.', 'bike lock|u-lock|lock'],
      ['sw-lights', 'Spokewise 800-Lumen Bike Light Set', 44, 0, 4.5, 3900, '🚨', 'USB-C front and rear lights, daytime flash.', 'bike lights|bike light|cycling lights'],
      ['sw-commuter', 'Spokewise City 7 Commuter Bike', 649, 0, 4.5, 900, '🚴', '7-speed hub, fenders and rack included.', 'bike|bicycle|cycling|commute|road bike|city bike'],
      ['sw-kit', 'Spokewise Puncture Repair Kit + Mini Pump', 29, 0, 4.6, 4200, '🛠️', 'Everything to fix a flat at the roadside.', 'bike pump|puncture|flat tyre|flat tire|repair kit'],
    ],
  },
  {
    id: 'kitbench', name: 'Kitbench Tools', tagline: 'Build it yourself', color: '#495057',
    rows: [
      ['kb-drill', 'Kitbench 20V Cordless Drill Driver', 99, 129, 4.7, 6200, '🔩', 'Two batteries, 60 Nm torque, LED light.', 'drill|cordless drill|power tool|screwdriver|diy'],
      ['kb-toolset', 'Kitbench 120-Piece Home Tool Set', 59, 0, 4.6, 5400, '🧰', 'Hammer, pliers, sockets and bits in one case.', 'tool set|toolbox|toolkit|tools|hammer'],
      ['kb-laser', 'Kitbench 40 m Laser Measure', 39, 0, 4.5, 3100, '📏', 'Area, volume and Pythagoras modes.', 'laser measure|tape measure|measuring'],
      ['kb-meter', 'Kitbench Auto-Ranging Multimeter', 34, 44, 4.6, 2700, '🔌', 'True RMS, continuity buzzer, backlit.', 'multimeter|electronics|voltage|circuit'],
      ['kb-printer', 'Kitbench Forge 3D Printer', 299, 369, 4.5, 1900, '🖨️', 'Auto-levelling, 250 mm³ build, quiet.', '3d printer|3d printing|printer|filament'],
      ['kb-solder', 'Kitbench Digital Soldering Station', 69, 0, 4.6, 1500, '🪛', 'Heats in 9 seconds, 200–480 °C.', 'soldering iron|soldering|arduino|raspberry pi'],
    ],
  },
];

export const PRODUCTS: Product[] = STORES.flatMap(({ rows, ...store }) =>
  rows.map(([id, name, price, was, rating, reviews, emoji, blurb, kw]) => ({
    id, store, name, price, was: was || undefined, rating, reviews, emoji, blurb,
    keywords: kw.split('|'),
  })),
);

export const productById = (id: string | null) => PRODUCTS.find((p) => p.id === id);

export const formatPrice = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0 });
