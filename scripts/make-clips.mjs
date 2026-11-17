#!/usr/bin/env node
// Generates synthetic, fully-licensed demo clips for VidPop.
// Each line is spoken with macOS `say`, measured with ffprobe, and stitched with
// ffmpeg so the transcript timestamps are exact (no speech-to-text guessing).
//
// Usage: node scripts/make-clips.mjs            (all clips)
//        node scripts/make-clips.mjs tokyo-day1 (one clip)
// Requires macOS (`say`) and ffmpeg/ffprobe on PATH.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'clips');
const GAP = 0.45; // seconds of silence between lines

const CLIPS = [
  {
    id: 'myth-facts',
    title: '4 facts that sound fake',
    creator: '@dailyfactdrop',
    suggestedMode: 'verify',
    voice: 'Samantha',
    colors: ['0x1b1464', '0x6a0572', '0xd7263d'],
    lines: [
      'Okay, here are four facts that sound fake, but people swear they are true.',
      'First up. The Great Wall of China is the only human-made structure you can see from space with your naked eye.',
      'Wild, right? The next one is about Paris.',
      'The Eiffel Tower actually grows about fifteen centimetres taller in the summer, because the iron expands in the heat.',
      'Number three, and this one honestly changed my life.',
      'Scientists have proven that humans only use ten percent of their brains.',
      'And finally, archaeologists found pots of honey in ancient Egyptian tombs that were still edible after three thousand years.',
      'Follow for part two!',
    ],
  },
  {
    id: 'tokyo-day1',
    title: 'Day 1 in Tokyo',
    creator: '@wanderwithmika',
    suggestedMode: 'discover',
    voice: 'Karen',
    colors: ['0x0f3057', '0x00587a', '0xe7e7de'],
    lines: [
      'Day one in Tokyo, and I am already obsessed.',
      'I shot everything today on a compact Fujifilm X100 series camera, and the colours straight out of camera are unreal.',
      'We picked up a seven day Japan Rail Pass, which saved us a ton on the bullet train.',
      'Pro tip: pack a portable power bank, because you will be using maps on your phone all day.',
      'Also, fun fact. Tokyo is the most populous metropolitan area in the world.',
      'Tomorrow we are heading to Kyoto. See you there!',
    ],
  },
];

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const duration = (file) =>
  parseFloat(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]));
const vttTime = (t) => {
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = (t % 60).toFixed(3);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s.padStart(6, '0')}`;
};

function makeClip(clip) {
  const tmp = mkdtempSync(join(tmpdir(), `vidpop-${clip.id}-`));
  try {
    const segments = [];
    const concatList = [];
    const silence = join(tmp, 'gap.wav');
    run('ffmpeg', ['-y', '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono`, '-t', String(GAP), silence]);

    let t = 0.6; // short lead-in
    const lead = join(tmp, 'lead.wav');
    run('ffmpeg', ['-y', '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono`, '-t', String(t), lead]);
    concatList.push(lead);

    clip.lines.forEach((text, i) => {
      const aiff = join(tmp, `l${i}.aiff`);
      const wav = join(tmp, `l${i}.wav`);
      run('say', ['-v', clip.voice, '-r', '185', '-o', aiff, text]);
      run('ffmpeg', ['-y', '-i', aiff, '-ar', '44100', '-ac', '1', wav]);
      const d = duration(wav);
      segments.push({ start: +t.toFixed(3), end: +(t + d).toFixed(3), text });
      t += d + GAP;
      concatList.push(wav, silence);
    });

    const listFile = join(tmp, 'list.txt');
    writeFileSync(listFile, concatList.map((f) => `file '${f}'`).join('\n'));
    const audio = join(tmp, 'audio.m4a');
    run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c:a', 'aac', '-b:a', '128k', audio]);
    const total = duration(audio);

    mkdirSync(OUT, { recursive: true });
    const mp4 = join(OUT, `${clip.id}.mp4`);
    const [c0, c1, c2] = clip.colors;
    run('ffmpeg', [
      '-y',
      '-f', 'lavfi',
      '-i', `gradients=s=720x1280:r=30:c0=${c0}:c1=${c1}:c2=${c2}:n=3:speed=0.015:d=${total.toFixed(2)}`,
      '-i', audio,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'veryfast', '-crf', '28',
      '-c:a', 'copy', '-shortest', '-movflags', '+faststart',
      mp4,
    ]);

    const meta = {
      id: clip.id,
      title: clip.title,
      creator: clip.creator,
      suggestedMode: clip.suggestedMode,
      src: `/clips/${clip.id}.mp4`,
      duration: +total.toFixed(3),
      segments,
      synthetic: true,
    };
    writeFileSync(join(OUT, `${clip.id}.json`), JSON.stringify(meta, null, 2));
    const vtt = ['WEBVTT', '', ...segments.flatMap((s, i) => [`${i + 1}`, `${vttTime(s.start)} --> ${vttTime(s.end)}`, s.text, ''])];
    writeFileSync(join(OUT, `${clip.id}.vtt`), vtt.join('\n'));
    console.log(`✓ ${clip.id}: ${segments.length} segments, ${total.toFixed(1)}s`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const only = process.argv[2];
CLIPS.filter((c) => !only || c.id === only).forEach(makeClip);
writeFileSync(
  join(OUT, 'index.json'),
  JSON.stringify(CLIPS.map(({ id, title, creator, suggestedMode }) => ({ id, title, creator, suggestedMode })), null, 2),
);
