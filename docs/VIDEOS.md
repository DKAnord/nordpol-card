# Making the camera videos

The cam wall plays short looping clips. **The card works without any videos** (tiles show a "SIGNAL LOST" static
effect), so videos are an optional upgrade. Because they are big and AI-generated, they are **not stored in the repo** –
you make your own (prompts in [video-prompts.md](video-prompts.md)) or download the optional pack from the
GitHub Release.

## Workflow in Google Flow

1. Generate the three **empty base scenes** (paddock, workshop, mailroom) as images, then one **anchor frame** per
   clip (see [video-prompts.md](video-prompts.md)).
2. In Flow, use *Frames to video*: put the **same anchor image as both First Frame and Last Frame** → a seamless loop.
3. Add the *global suffix* from `video-prompts.md` to every prompt (no text/timestamps/UI in the picture – the card draws those live).
4. Download the MP4, then shrink it with the ffmpeg command below (Flow exports are often 1080p+ and several MB too big).

> [!NOTE]
> Veo/Flow output carries an invisible **SynthID** watermark and C2PA metadata that survive re-encoding – this is normal;
> mention in your README that the clips are AI-generated. Depending on your plan Flow may also stamp a *visible* mark – check
> the corners of your downloads and crop/avoid clips that have one before publishing. Verify Google's current terms for your
> plan (commercial use / redistribution) before you put the pack on a public Release.

## File naming

```
<config>/www/nordpol/cam<N>_<period>.mp4          →  4-view grid (10s seamless loops)
<config>/www/nordpol/cycle<N>_<period>.mp4        →  1-view cycle (24–30s perspective shots)
<config>/www/nordpol/mailroom_letter_<period>.mp4 →  live-action letter arrival (or mailroom_letter.mp4)
```

| Cam (order in `cams:`) | morning | day | evening |
|---|---|---|---|
| 1 | `cam1_morning.mp4` | `cam1_day.mp4` | `cam1_evening.mp4` |
| 2 | `cam2_morning.mp4` | `cam2_day.mp4` | `cam2_evening.mp4` |
| 3 | `cam3_morning.mp4` | `cam3_day.mp4` | `cam3_evening.mp4` |
| 4 | `cam4_morning.mp4` | `cam4_day.mp4` | `cam4_evening.mp4` |

* **1-view cycle & Letter-to-Santa clips:** See [cycle-video-prompts.md](cycle-video-prompts.md) for the 24–30s Google Flow `First Frame + Extend` workflow (no locked end-frame needed), 13 starter keyframes, and `letter_cue` alignment tuning. When `cycle<N>_<period>.mp4` or `mailroom_letter*.mp4` are not present yet, the card automatically falls back to `cam<N>_<period>.mp4`.
* Period names and start times are configurable (`cams.periods`). Existing files such as `cam1_morgen.mp4` keep working
  if you set `periods: [{name: morgen, from: "05:00"}, …]`.
* Missing file? The card falls back to the same cam's other periods, then to the optional `src:` clip, then static noise.
  You can therefore ship/finish clips one at a time.
* Custom path per cam: `cams: [{ label: "…", file: /local/mycam1 }]` → `/local/mycam1_<period>.mp4`.

## Surveillance overlay – don't bake it in

The card draws the **REC dot, live date/time, camera name, scanlines and vignette on top of your clip in real time**
(`cams.overlay`, default `minimal`). Generate clips **clean**, with no text, timestamp or UI in the picture:

* a timestamp burned into a looping clip would jump back every loop and never match the real time;
* live text stays sharp at any size, follows the user's date format and language, and costs nothing in file size.

`overlay: minimal` (default) only adds REC, clock and camera name and leaves your clip untouched. `overlay: true` adds scanlines/vignette (`cctv_style: color | mono`). Change the clock with `date_format`. If you want a heavier film look (grain, fisheye,
compression artefacts) baked in, do it in the clip itself with ffmpeg *without text*, e.g.
`-vf "noise=alls=12:allf=t,vignette=PI/5,eq=saturation=0.7"`.

## Technical spec (keeps the pack small and Home Assistant–friendly)

| Setting | Recommended |
|---|---|
| Aspect | 16:9 |
| Length | 8–10 s, **seamless loop** (same first/last frame) |
| Codec | H.264 (`libx264`), `yuv420p`, `+faststart` |
| Size | ≤ 5 MB per clip, ≤ 1280×720 |
| Audio | none (card plays muted) |

Compress/normalise any clip:

```bash
ffmpeg -i in.mp4 -an -vf "scale=1280:-2" -c:v libx264 -crf 28 -preset slow \
       -pix_fmt yuv420p -movflags +faststart cam1_day.mp4
```

## Distributing the pack

1. Collect the 12 clips in `media/` (git-ignored).
2. `cd media && zip nordpol-videos.zip cam*_*.mp4`
3. Attach the video pack zip(s) (e.g. `nordpol-videos-cam1-2.zip` and `nordpol-videos-cam3-4.zip`) to a GitHub **Release** (not to git history – keeps clones small).
4. Users unzip into `<config>/www/nordpol/`.

> [!IMPORTANT]
> State the licence of the pack in the README (e.g. CC BY 4.0) and that it is AI-generated with Google Flow (Veo);
> confirm your plan's terms allow redistribution before publishing.
