# 1-View Cycle & Live Mailroom Video Prompts (Google Flow, 24–30s)

Prompt sheet and production guide for generating the **12 perspective-shifted 1-view cycle clips** (`cycle1..4_{morning,day,evening}.mp4`) plus the **live-action Mailroom letter arrival clip** (`mailroom_letter.mp4`).

> [!IMPORTANT]
> **Mandatory global suffix — append to EVERY Beat 1 and Extend prompt:**
> `No text, no captions, no handwriting, no printed letters, no timestamp, no camera label, no watermark, no on-screen UI or HUD anywhere in the frame.`

---

## 1. Starter Keyframes

All 13 style-locked widescreen PNG keyframes (`1376×768`, 16:9) live outside git in:

```text
/config/workspace/christmas-dashboard/cycle-keyframes/
├── cycle1_morning_anchor.png
├── cycle1_day_anchor.png
├── cycle1_evening_anchor.png
├── cycle2_morning_anchor.png
├── cycle2_day_anchor.png
├── cycle2_evening_anchor.png
├── cycle3_morning_anchor.png
├── cycle3_day_anchor.png
├── cycle3_evening_anchor.png
├── cycle4_morning_anchor.png
├── cycle4_day_anchor.png
├── cycle4_evening_anchor.png
└── mailroom_letter_anchor.png
```

---

## 2. Google Flow Build Recipe (24–30s, No Locked Last Frame)

Unlike the 4-grid wall (which needed identical first/last frames to loop in place every 10s), the **1-view cycle** advances through 4 scenes (`~90–120s` before returning to scene 1) and preloads the next clip silently ~6s before each transition:

1. In Google Flow, pick **Frames to Video** and upload the starter keyframe as **First Frame ONLY** (leave Last Frame empty).
2. Choose either extend chain:
   - **Omni Flash (recommended, 30s with 1 seam):** Beat 1 (`15s`) → **Extend** once (`+15s` = **30s total**). Combine Beat 2 + Beat 3 notes into the single Extend prompt.
   - **Veo 3.1 (24s with 2 seams):** Beat 1 (`8s`) → **Extend** (`+8s` = 16s) with Beat 2 → **Extend** (`+8s` = **24s total**) with Beat 3.
3. Keep the camera **locked / tripod-steady** (or only tiny organic handheld micro-breathe) so live `REC`/clock overlays look natural, and keep Beat 3 winding calmly down so returning ~90s later feels seamless.

---

## 3. CYCLE 01 — Reindeer Paddock (`cycle1_*.mp4`)

### `cycle1_morning.mp4` (`cycle1_morning_anchor.png`)
- **Beat 1 (0–8/15s):** Locked eye-level winter camera by the wooden paddock fence at pink-and-blue Arctic dawn. Warm lanterns glow beside the open barn doors. The elf in the green knitted sweater walks steadily along the fence carrying the brass lantern and wooden oat bucket, opens the paddock gate latch, and pours fresh golden oats into the wooden trough as steam puffs rhythmically from both reindeer's nostrils in the cold morning air. Gentle smoke curls from the barn chimney.
- **Beat 2 (Extend):** The elf sets the wooden bucket down beside the trough and gently scratches one reindeer behind the antlers while checking the lantern light. Both reindeer happily munch oats and hay, ears flicking, frosty breath drifting across the warm lantern glow.
- **Beat 3 (Extend / Settle):** The elf gives both reindeer an affectionate pat on the shoulder, picks up the empty bucket and glowing brass lantern, and walks peacefully back toward the warm open barn doorway while the two reindeer remain calmly eating at the trough.

### `cycle1_day.mp4` (`cycle1_day_anchor.png`)
- **Beat 1 (0–8/15s):** Locked eye-level winter camera by the snowy paddock fence in bright Arctic daylight with light snowflakes drifting down. Beside the open barn doors, the elf checks and jingles a leather sleigh harness with brass bells, then signals playfully toward the yard. One reindeer trots briskly up to the wooden jumping hurdle, paws the snow, and pops into a brief joyful magical hover-hop right above the hurdle.
- **Beat 2 (Extend):** The reindeer lands softly in the powder snow with a celebratory shake of its antlers while the other two reindeer trot closer beside the wooden fence, tails swishing in the falling snow. The elf hangs the harness neatly by the barn door and steps into the yard carrying a grooming brush.
- **Beat 3 (Extend / Settle):** The elf brushes snow lightly off the nearest reindeer's flank as all three reindeer settle calmly around the hurdles in the steady snowfall, breath misting faintly in the crisp Arctic air.

### `cycle1_evening.mp4` (`cycle1_evening_anchor.png`)
- **Beat 1 (0–8/15s):** Locked cozy eye-level view just inside the warm lantern-lit timber barn looking out toward the starry snowy paddock under a vivid green Aurora Borealis rippling gently across the sky. The three reindeer lie nestled in golden hay; the front reindeer blinks sleepily, twitches an ear, and its crimson nose pulses with a soft warm red glow.
- **Beat 2 (Extend):** Outside, the green Aurora curtains shimmer smoothly above the spruce forest while a faint swirl of wind-blown snow drifts across the fence line. Inside the stall, the hanging oil lanterns sway imperceptibly, casting warm amber highlights across the hay as the sleeping reindeer breathe deeply.
- **Beat 3 (Extend / Settle):** The front reindeer rests its chin softly onto the golden straw, letting out a quiet warm sigh as its crimson nose settles into a steady cozy ember glow under the rippling northern lights.

---

## 4. CYCLE 02 — Toy Workshop (`cycle2_*.mp4`)

### `cycle2_morning.mp4` (`cycle2_morning_anchor.png`)
- **Beat 1 (0–8/15s):** Locked diagonal mid-level camera inside the rustic timber toy workshop illuminated by warm morning overhead lamps. Both elves at the foreground oak workbench lift their steaming ceramic cocoa mugs, clink them gently in a cheerful morning toast, take a warm sip, and set the mugs back down as the miniature wooden toy train begins chugging smoothly around the curved wooden track.
- **Beat 2 (Extend):** One elf winds a brass key beside the workbench while the wooden conveyor belt whirs to life down the center aisle; the miniature wooden train loops continuously around the bench track as the elves inspect blueprints and pick up wooden mallets and paintbrushes.
- **Beat 3 (Extend / Settle):** Both elves roll up their sleeves and turn toward their work positions beside the oak bench while the tiny train keeps circling smoothly and steam rises gently from the cocoa mugs.

### `cycle2_day.mp4` (`cycle2_day_anchor.png`)
- **Beat 1 (0–8/15s):** Locked diagonal mid-level workshop camera during peak daytime hustle. Along the central wooden conveyor belt, evenly spaced red-and-gold wrapped Christmas presents glide steadily toward the foreground. At the foreground oak bench, the green-clad elf paints smooth red strokes onto a wooden toy train engine while the red-clad elf pulls a golden ribbon bow tight on a finished gift box.
- **Beat 2 (Extend):** The red-clad elf lifts the newly tied red-and-gold present off the workbench and sets it neatly onto a passing gap on the moving conveyor belt, then immediately reaches for a wooden rocking horse to wrap next while the green-clad elf inspects the freshly painted train wheel and tiny golden sparks flicker faintly at a far background workbench.
- **Beat 3 (Extend / Settle):** Both elves resume their crisp rhythmic crafting—brushing paint and folding bright wrapping paper—while presents travel smoothly along the conveyor belt in steady workshop harmony.

### `cycle2_evening.mp4` (`cycle2_evening_anchor.png`)
- **Beat 1 (0–8/15s):** Locked diagonal mid-level camera during quiet after-hours night shift; overhead ceiling lights are off, cool blue moonlit snow glows at high cabin windows, and warm brass desk lamps light the benches. The night-shift elf holding the glowing brass lantern and blank wooden clipboard walks slowly forward down the aisle beside the idle conveyor belt, pausing by the foreground workbench to inspect the finished red wooden train.
- **Beat 2 (Extend):** Raising the brass lantern slightly to cast warm amber light over the oak bench, the elf lightly adjusts the wooden train straight on the table, glances up along the towering shelves packed with wrapped gifts, and gives an approving nod while tapping a pencil gently against the blank clipboard.
- **Beat 3 (Extend / Settle):** Turning calmly back toward the far aisle, the elf lowers the lantern slightly and walks slowly toward the back timber door, leaving the silent workshop warm and serene under the glowing brass desk lamps.

---

## 5. CYCLE 03 — Nice-List Mailroom (`cycle3_*.mp4`)

### `cycle3_morning.mp4` (`cycle3_morning_anchor.png`)
- **Beat 1 (0–8/15s):** Locked closer angled mailroom camera across the oak sorting table toward the brass pneumatic pipes and frosted arched window in pale Arctic morning light. Two brass pressure valves along the left wall vent crisp puffs of white steam as envelopes drop softly down the chutes into the woven wicker baskets. The green-clad elf gathers a neat sheaf of cream envelopes from the front basket and carries them to the oak sorting table.
- **Beat 2 (Extend):** Standing at the oak sorting table, the elf briskly taps the envelopes into an even stack, loops natural hemp twine neatly around the bundle, and checks the stacked trays beside the brass ink stamps while another gentle puff of steam rises from the pneumatic valve behind.
- **Beat 3 (Extend / Settle):** Setting the tied bundle onto the cubby shelf tray, the elf straightens the stamps along the table edge and reaches calmly toward the next basket of morning letters.

### `cycle3_day.mp4` (`cycle3_day_anchor.png`)
- **Beat 1 (0–8/15s):** Locked closer angled mailroom camera during peak daytime rush. Across the oak sorting table, the foreground elf presses a wooden brass-headed wax stamper firmly onto a sealed envelope, lifts it with a crisp inspection, and slides it onto the finished tray while the second elf lifts a cream envelope to examine it closely through a brass magnifying glass.
- **Beat 2 (Extend):** A quick swoosh of air sends two fresh letters tumbling out of a brass pneumatic chute into the left wicker basket; both elves glance cheerfully toward the basket, and the foreground elf scoops up a fresh stack onto the table before dropping sealed letters into the plump red velvet mailbag beside the bench.
- **Beat 3 (Extend / Settle):** Both elves settle smoothly back into their steady daytime rhythm—one stamping seals cleanly while the other sorts trays beneath the bright frosted arched window.

### `cycle3_evening.mp4` (`cycle3_evening_anchor.png`)
- **Beat 1 (0–8/15s):** Locked closer angled mailroom camera at tranquil moonlit night with gentle snow falling outside the arched frosted window. Illuminated solely by the warm brass banker's lamp on the oak sorting table, the elder elf sits calmly beside the completely blank, softly glowing golden parchment scroll, dipping the white feather quill neatly into the brass inkwell.
- **Beat 2 (Extend):** Slowly and thoughtfully, the elder elf hovers a finger lightly above the glowing golden parchment (leaving the parchment completely blank and luminous without writing visible marks), nods warmly with a gentle smile, and pauses to glance up toward the quiet frosted window as snowflakes drift past.
- **Beat 3 (Extend / Settle):** Setting the feather quill resting softly beside the inkwell, the elder elf folds hands peacefully near the warm golden glow of the scroll in quiet nighttime calm.

---

## 6. CYCLE 04 — North Pole Bakery (`cycle4_*.mp4`)

### `cycle4_morning.mp4` (`cycle4_morning_anchor.png`)
- **Beat 1 (0–8/15s):** Locked eye-level hearth-side bakery camera looking across the flour-dusted oak counter toward the roaring brick wood-fired oven. Warm flames dance inside the oven as the smiling elf slides the wooden baker's peel smoothly out from the hearth, carrying it over to the foreground oak table to set down the tray of warm steaming star-shaped gingerbread cookies.
- **Beat 2 (Extend):** Resting the wooden peel neatly beside the brick hearth, the elf returns to the flour-dusted counter, picks up a fine mesh flour sifter, and dusts a gentle snowy shower of powdered sugar down over the warm gingerbread stars while soft steam rises past the hanging copper pots.
- **Beat 3 (Extend / Settle):** Setting the sifter beside the mixing bowl, the elf admires the warm golden batch of cookies with a proud smile while the fire crackles steadily inside the brick oven.

### `cycle4_day.mp4` (`cycle4_day_anchor.png`)
- **Beat 1 (0–8/15s):** Locked eye-level hearth-side bakery camera in bright cozy daytime light with roaring oven flames and twinkling warm fairy lights along the pine garlands. Leaning over the oak table, the left elf carefully squeezes a pastry piping bag of white royal icing in delicate scallops along the gingerbread house roof while the right elf gently arranges star cookies on the cooling tray.
- **Beat 2 (Extend):** The right elf sneaks a tiny corner piece of gingerbread, winks playfully with a big smile, and holds out a bowl of red frosting sprinkles so the left elf can scatter cheerful festive touches across the gingerbread house while snow falls gently outside the frosted windows.
- **Beat 3 (Extend / Settle):** Both elves lean back happily to admire their finished gingerbread house together before returning smoothly to piping neat icing trim along the eaves.

### `cycle4_evening.mp4` (`cycle4_evening_anchor.png`)
- **Beat 1 (0–8/15s):** Locked eye-level hearth-side bakery camera in quiet starry evening ambiance. Outside the frosted lattice windows deep blue snow drifts softly; inside, glowing red-orange embers shimmer peacefully in the brick oven while twinkling warm fairy lights sparkle gently along the pine garlands and reflect in the hanging copper pots.
- **Beat 2 (Extend):** An elf's hand enters warmly from the side under the hanging copper lamp to adjust the festive ceramic plate of golden gingerbread stars beside the glass of cold milk, placing one extra star cookie gently on top before stepping softly away so the quiet table remains centered and serene.
- **Beat 3 (Extend / Settle):** The empty counter sits completely peaceful and ready for Santa—fairy lights twinkling softly, oven embers pulsing gently in warm crimson-amber light, and snowflakes drifting silently outside the dark frosted glass.

---

## 7. LIVE-ACTION MAILROOM LETTER ARRIVAL (`mailroom_letter.mp4`)

Anchor image: `mailroom_letter_anchor.png`

> [!IMPORTANT]
> **Choreography timing matters!** `NordpolCams` fades the child's live letter text onto a translucent aged parchment sheet centered over the lower-center oak table from **`8.5s` to `21.5s`** (with the `"★ RECEIVED · NORTH POLE ★"` stamp popping in at **`19.0s`**). Keep the lower-center foreground table space open and hold a **completely blank cream parchment sheet** steady there during the middle beat!

- **Beat 1 — Pneumatic Arrival (0–8.5s):**
  Locked closer angled mailroom camera in warm timeless golden lantern light. Suddenly, the open curved brass pneumatic mail pipe on the left brick wall vents a dramatic crisp puff of white steam and shoots a cream envelope sealed with red wax spinning out of the brass chute straight down into the woven wicker basket. Both delighted elves jump excitedly, rush over to the basket, lift the envelope triumphantly, hurry forward to the empty oak table in the lower-center foreground, carefully break the red wax seal, and unfold a **large, flat, completely blank cream parchment sheet** squarely in the center of the lower-center oak tabletop so its entire blank surface faces the camera cleanly.
- **Beat 2 — Reading & Inspecting (8.5–21.5s, Omni Extend or Veo Extend #1):**
  Keep the **large blank cream parchment sheet completely flat, steady, still, and utterly blank** in the lower-center foreground of the oak table (zero drawn lines, zero text, zero handwriting, zero squiggles on the paper). Both elves lean joyfully side-by-side over the far/back edge of the table looking down at the blank cream parchment with delighted wide smiles, pointing gently near its edges, whispering and nodding enthusiastically in wonder as warm pendant light illuminates the paper evenly. At the end of the beat, one elf picks up the wooden brass stamp from the left corner and presses a crisp tap onto the bottom corner edge of the parchment.
- **Beat 3 — Filed for Santa (21.5–24/30s, Omni finish or Veo Extend #2):**
  The elves neatly fold the parchment into an envelope, tuck it carefully into Santa's velvet red mailbag, exchange an excited celebratory high-five / thumbs-up toward the camera, and turn back smiling toward the brass pneumatic tubes as warm dust motes dance in the golden lantern glow.

### Fine-Tuning the Parchment Overlay Coordinates

If your generated `mailroom_letter.mp4` unfolds the blank paper at slightly different timestamps or coordinates on the oak table, adjust `letter_cue` on `nordpol-cam-card` (or inside `cams:` of `nordpol-board-card`) without regenerating the video:

```yaml
cams:
  letter_cue:
    start: 8.5     # seconds when parchment fades in
    end: 21.5      # seconds when parchment fades out
    stampAt: 19.0  # seconds when ★ RECEIVED ★ stamp pops in
    x: 50          # horizontal center (%)
    y: 63          # vertical center (%)
    w: 56          # parchment width (% of video width)
    rot: -1.2      # planar tilt (deg)
    tilt: 9        # perspective X-tilt matching tabletop angle (deg)
```

---

## 8. Post-Processing & Hosting (`gh-pages` + Cloudflare Pages)

Normalize all downloads (strip audio, scale to `1280×720` or `1920×1080`, `libx264`, `yuv420p`, `+faststart`, keeping every file well below Cloudflare Pages' 25 MiB cap):

```bash
mkdir -p /config/workspace/christmas-dashboard/cycle-videos-out
for f in /config/workspace/christmas-dashboard/cycle-raw/*.mp4; do
  name=$(basename "$f")
  ffmpeg -y -i "$f" -an -vf "scale=1280:-2,fps=24" \
    -c:v libx264 -crf 25 -preset slow -pix_fmt yuv420p -movflags +faststart \
    "/config/workspace/christmas-dashboard/cycle-videos-out/$name"
done
```

Publish ONLY to the orphan `gh-pages` branch under `media/` (never commit `.mp4` files onto `main`!). Pushing `gh-pages` or re-running `.github/workflows/pages.yml` keeps both GitHub Pages and `https://nordpol.pages.dev/media/` in sync.
