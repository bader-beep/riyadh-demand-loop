import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function main() {
  const csvPath = join(__dirname, '..', 'seed', 'places.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  console.log(`[SEED] Found ${records.length} rows in places.csv`);

  let created = 0;
  let updated = 0;

  for (const row of records) {
    const category = row.category.toUpperCase();
    const parkingEase = row.parking_ease.toUpperCase();
    const kidsFriendly = row.kids_friendly === 'true';
    const strollerFriendly = row.stroller_friendly === 'true';
    const prayerRoom = row.prayer_room === 'true';
    const hoursJson = row.hours_json && row.hours_json.trim() !== '' ? row.hours_json.trim() : null;

    const result = await prisma.place.upsert({
      where: {
        name_ar_district_category: {
          name_ar: row.name_ar,
          district: row.district,
          category: category,
        },
      },
      update: {
        name_en: row.name_en,
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        kids_friendly: kidsFriendly,
        stroller_friendly: strollerFriendly,
        prayer_room: prayerRoom,
        parking_ease: parkingEase,
        hours_json: hoursJson,
        is_active: true,
      },
      create: {
        name_ar: row.name_ar,
        name_en: row.name_en,
        category: category,
        district: row.district,
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        kids_friendly: kidsFriendly,
        stroller_friendly: strollerFriendly,
        prayer_room: prayerRoom,
        parking_ease: parkingEase,
        hours_json: hoursJson,
        is_active: true,
      },
    });

    // Check if it was newly created by comparing created_at and updated_at
    if (result.created_at.getTime() === result.updated_at.getTime()) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(`[SEED] Done. Created: ${created}, Updated: ${updated}, Total: ${records.length}`);

  // Create predictions for places that don't have one
  const placesWithoutPrediction = await prisma.place.findMany({
    where: {
      is_active: true,
      prediction: null,
    },
    select: { id: true },
  });

  for (const place of placesWithoutPrediction) {
    await prisma.prediction.create({
      data: {
        place_id: place.id,
        now_crowd_level: 'MEDIUM',
        now_wait_band: '10-20',
        confidence: 'LOW',
        confidence_score: 0,
        forecast_json: '[]',
        best_windows_json: '[]',
        generated_at: new Date(),
      },
    });
  }

  console.log(`[SEED] Created ${placesWithoutPrediction.length} default predictions`);
}

main()
  .catch((e) => {
    console.error('[SEED] Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
