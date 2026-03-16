# samples/

This folder holds your audio files. It is gitignored — you bring your own samples.

## Folder structure

| Folder        | Contents                                                      |
| ------------- | ------------------------------------------------------------- |
| `kicks/`      | Kick drum samples (WAV/MP3)                                   |
| `snares/`     | Snare drum samples                                            |
| `hats/`       | Hi-hat samples (open, closed, pedal)                          |
| `bass/`       | Bass one-shots and loops                                      |
| `fx/`         | FX and atmosphere samples                                     |
| `recordings/` | Your own recorded audio (sax, vocals, instruments)            |
| `packs/`      | Downloaded sample packs (Cymatics, 99Sounds, Freesound, etc.) |

## Where to get free samples

- [Cymatics](https://cymatics.fm/pages/free-download-vault) — high quality free packs
- [99Sounds](https://99sounds.org) — curated free packs
- [Freesound](https://freesound.org) — community library, CC licensed
- [Splice Free](https://splice.com/sounds/search?is_free=true) — free tier samples

## Math synthesis

Score can generate sounds entirely from Web Audio API math — no samples needed.
Set `synth: true` on any component to use synthesis instead of a sample file.
