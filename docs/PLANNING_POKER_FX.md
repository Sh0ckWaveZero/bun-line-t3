# 🎴 Planning Poker — Reveal FX Rules

กติกาเอฟเฟกต์ตอนเปิดไพ่ (Reveal FX) ฉบับสมบูรณ์ — ที่มา, สูตรคำนวณ, ตารางผลลัพธ์ และวิธีทดสอบ
อ้างอิง source ปัจจุบัน: `src/features/planning-poker/helpers/fx-rarity.ts`, `components/RevealOverlay.tsx`, `components/ArcaneReveal.tsx`

---

## 1. กติกาสรุป 3 บรรทัด

1. **ยิ่งค่าเฉลี่ยต่ำ ยิ่งอลัง** — story เล็ก (แตกงานดี) ได้ฉลองหนัก โดยชั้นมาจาก **โซนของค่าเฉลี่ย** (ค่า 3-5 = จุดหวานของ Fibonacci → epic)
2. **สตรีคไต่ชั้น** — ทีมประเมินดี (ค่าเฉลี่ย ≤ 8) ติดกันแต่ละรอบ ชั้นไต่ขึ้นชั้นละ 1: epic → legendary → mythic (ค่า > 8 ตัดสตรีค)
3. **โชว์ในโซนหมุนเวียนตามรอบ** — ทีมที่ประมาณใกล้เคียงกันทุกรอบจะเห็นหลายโชว์ในโซนนั้น ไม่ติดโชว์เดียว (ค่า+รอบเดิม = โชว์เดิม ยัง deterministic)
4. **ทุกคนโหวตตัวเลขเดียวกัน (consensus) = อลังสุดทันที (mythic)** ไม่ว่าค่าจะเท่าไร (แต่ทุกคนกด ☕/? ไม่นับ)

---

## 2. ชั้นความหายาก (Rarity) — 6 ชั้นตรงกับ demo

ชั้นมาจาก **โซนของค่าเฉลี่ย** (threshold เฉพาะของ FX ไม่ผูก tier สีหน้าไพ่) — 6 ชั้นตรงกับ "Six signature shows" ของ `@react-cards-opening`:

| ค่าเฉลี่ย | ชั้น FX | เหตุผล |
| --- | --- | --- |
| ≤ 1 (รวม ½) | **mythic** | แตกงานสุด ๆ — สงวนให้ค่าต่ำมากเท่านั้น |
| ≤ 2 | **legendary** | ประเมินดีมาก |
| ≤ 5 (3, 5) | **epic** | จุดหวานของ Fibonacci — โซนที่เจอบ่อย |
| ≤ 8 | **rare** | ค่ากลาง |
| ≤ 13 | **uncommon** | story ใหญ่ |
| > 13 | **common** | story ใหญ่มาก |
| ไม่ใช่ตัวเลข (?, ☕, โหวตมากสุดที่ไม่ใช่เลข) | **common** | ไม่มีอะไรให้ฉลอง |

**ข้อยกเว้นเดียว:** `isConsensus` จาก server (ทุกคนโหวตค่าเดียวกัน ≥ 2 คน) บนค่า**ตัวเลข** → `mythic` ทันที
ทุกคนกด ☕ หรือ ? พร้อมกัน **ไม่** ได้โบนัส (ขอพักไม่ใช่เรื่องฉลอง)

### สตรีค (Streak) — ความหายากไต่ขึ้นเรื่อย ๆ

รอบที่ค่าเฉลี่ย **≤ 8** นับเป็น "รอบดี" — รอบดีติดกันแต่ละรอบ (นับจาก history ก่อนรอบปัจจุบัน) บวกชั้นเพิ่มชั้นละ 1 (cap mythic):

```
ประมาณ 3 ต่อเนื่อง:  รอบ 1 epic → รอบ 2 legendary → รอบ 3 mythic → คง mythic
ประมาณ 8 ต่อเนื่อง:  รอบ 1 rare → epic → legendary → mythic
รอบไหนค่าเฉลี่ย > 8  → สตรีครีเซ็ต กลับโซนตามค่า (ค่าสูงไม่ได้โบนัสจากอดีต)
```

โค้ด: `resolveFxRarity(value, isConsensus, streak)` + `countGoodStreak(history)` ใน `helpers/fx-rarity.ts` — pure function โซน deterministic จากค่า (history ของ server มีรอบปัจจุบันเป็นแถวท้าย `countGoodStreak` ข้ามให้เอง)

---

## 3. โชว์ในโซน (Shows) — หลายแบบต่อชั้น หมุนตามรอบ

แต่ละชั้นมี **หลายโชว์** (โชว์แรก = signature ของ demo "Six signature shows") เลือกด้วย
`hashValue("ค่าเฉลี่ย:เลขรอบ") % จำนวนโชว์` — ทีมที่ประมาณใกล้เคียงกันทุกรอบจะเห็นโชว์หมุนวนในโซน
finale burst ตอนไพ่พลิกจะเล่น**โชว์ถัดไป**ของชั้น (ไม่ใช่โชว์ซ้ำเดิม)

| ชั้น | โชว์ (แต่ละโชว์เล่นพร้อมกันทั้งชุด) | bursts |
| --- | --- | --- |
| common | slam+dust · pixels+dust | 0 |
| uncommon | ripples+leaves+fireflies · bubbles+petals · rain+fireflies | 0 |
| rare | converge+frost+hex+shards+rim+glitter · comets+stardust+glitter · hex+frost+ring-of-pixels | 1 |
| epic | implosion+sigil+diamond+starburst+punch+spiral+orbit · nova+shockwave+stardust · aurora+fountain+spiral | 1 |
| legendary | halo+flash+sunburst+pillar+shake+starburst+coins+beams+embers · fireworks+confetti+flash · nova+shockwave+lightning+stardust | 2 |
| mythic | 13 ตัวเต็ม (flicker→smoke) · 10 ตัว · 10 ตัว — **ใหญ่สุดของ ladder** | 2 |

ขนาดโชว์ไต่ขึ้นตามชั้นเสมอ (2 → 3 → 6 → 7 → 9 → 10-13) — ชั้นสูงสุดต้องอลังสุด
เอฟเฟกต์ทุกชื่อมาจากคลัง 64 ของ `@react-cards-opening/effects` (typed `EffectName`)
วงเวทเร่งตามชั้นผ่าน `data-fx-rarity` ใน `input.css` (epic 14s / legendary 7s+18s / mythic 4s+10s + glow 40px)

### ตัวอย่างจริง: ทีมประมาณ 3 ต่อเนื่อง 6 รอบ

| รอบ | ชั้น | โชว์ |
| --- | --- | --- |
| 1 | epic | implosion + sigil + diamond + starburst + punch + spiral + orbit |
| 2 | epic | aurora + fountain + spiral |
| 3 | epic | nova + shockwave + stardust |
| 4 | epic | (วนกลับโชว์แรก) |

---

## 4. จังหวะการเล่น (Timeline)

ทั้งหมดเป็น constant ใน `RevealOverlay.tsx` — JS เป็นแหล่งเดียว ส่งเข้า CSS ผ่าน custom properties

| เวลา (ms) | เหตุการณ์ |
| --- | --- |
| 0 | backdrop เข้า (300ms), กองไพ่โหวตโปรยลง (deal −60ms) |
| 480 | โชว์ของรอบเล่นครั้งแรก (รอ backdrop ทึบ + วงเวทพีค) |
| 580 (deal+120 → lift) | hero ยกตัวจากกอง |
| 700 | hero พลิก → shine (พลิก+620ms) |
| 800, 940, 1080… | โชว์ถัดไปของชั้นยิงตาม bursts (เว้น 140ms) |
| 3900 | ปิดเอง (close 400ms) — คลิกข้ามได้ตลอด |

จอแคบ (< 640px): กล่อง/การ์ด/พัดย่อตาม media queries ใน `input.css`

---

## 5. ข้อยกเว้นการแสดง

- **คนเข้ามาใหม่กลางรอบที่เปิดแล้ว** ไม่เห็น overlay (เล่นเฉพาะคนที่เห็นจังหวะ revealed สลับ false→true) — ผลดูได้ที่ ResultsPanel
- `prefers-reduced-motion: reduce` — ข้าม overlay ทั้งก้อน (lib เองก็ไม่เล่น)
- ไม่มี summary/ไม่มีคนโหวต — overlay ไม่แสดง

---

## 6. วิธีทดสอบ

### Unit test

```bash
bun test tests/features/planning-poker/fx-rarity.test.ts
```

ครอบ: ตารางโซน 6 ชั้น, consensus/non-numeric, ความ deterministic ของโซน, hash หมุนตามรอบ

### QA hooks (dev build เท่านั้น — production ไม่อ่าน)

ต่อท้าย URL ห้อง:

```
/planning-poker/CODE?fx=mythic&fxSeed=7
```

- `?fx=` บังคับชั้น: `common|uncommon|rare|epic|legendary|mythic` (ข้ามกติกาโซน)
- `?fxSeed=` บังคับโชว์ในชั้น (seed % จำนวนโชว์) — ใช้พรีวิวโชว์อื่นในชั้นเดียวกัน
- กด New round (เลขรอบ +1) = โชว์หมุนไปตาม hash จริง

### หลักการแก้

- เพิ่ม/แก้โชว์ → `FX_RARITY_PROFILES` ใน `ArcaneReveal.tsx` (ชื่อต้องเป็น `EffectName` จาก lib — ดู `EFFECT_LIST` ใน package; แนะนำ ≤7 เอฟเฟกต์/โชว์เพื่อความลื่น)
- แก้โซนชั้น → `FX_ZONE_BY_VALUE` ใน `fx-rarity.ts`
- ห้ามใส่ความสุ่มลอย ๆ — ความหลากหลายมาจาก hash(ค่า:รอบ) ที่ deterministic เสมอ
