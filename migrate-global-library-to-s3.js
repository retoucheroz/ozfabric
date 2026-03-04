/**
 * migrate-global-library-to-s3.js
 * 
 * global_library tablosundaki base64 url ve thumbUrl değerlerini
 * S3'e upload edip DB'yi gerçek URL'lerle günceller.
 * 
 * Kullanım:
 *   npm install @aws-sdk/client-s3 @neondatabase/serverless dotenv
 *   node migrate-global-library-to-s3.js
 */

// dotenv intentionally removed — env vars passed via CLI
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { neon } = require('@neondatabase/serverless');

// ── Config ──────────────────────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL;
const AWS_REGION   = process.env.AWS_REGION        || 'eu-central-1';
const S3_BUCKET    = process.env.AWS_S3_BUCKET;
const S3_PREFIX    = 'global-library'; // klasör adı bucket içinde

if (!DATABASE_URL || !S3_BUCKET) {
  console.error('❌  DATABASE_URL ve AWS_S3_BUCKET env değişkenleri gerekli');
  process.exit(1);
}

const s3  = new S3Client({ region: AWS_REGION });
const sql = neon(DATABASE_URL);

// ── Helpers ──────────────────────────────────────────────────────────────────

/** base64 data URI'yi S3'e yükler, public URL döner */
async function uploadBase64ToS3(base64DataUri, s3Key) {
  const matches = base64DataUri.match(/^data:(.+);base64,(.+)$/s);
  if (!matches) throw new Error(`Geçersiz data URI: ${base64DataUri.slice(0, 80)}`);

  const mimeType  = matches[1];                          // image/jpeg
  const buffer    = Buffer.from(matches[2], 'base64');
  const ext       = mimeType.split('/')[1] || 'jpg';
  const fullKey   = `${S3_PREFIX}/${s3Key}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket:      S3_BUCKET,
    Key:         fullKey,
    Body:        buffer,
    ContentType: mimeType,
  }));

  // Public URL — bucket'ın public erişimi varsa bu format çalışır
  // Private bucket kullanıyorsan CloudFront veya presigned URL'e geç
  return `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${fullKey}`;
}

/** Değerin base64 data URI olup olmadığını kontrol eder */
function isBase64DataUri(value) {
  return typeof value === 'string' && value.startsWith('data:');
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍  global_library kayıtları çekiliyor...');
  const rows = await sql`SELECT id, category, data FROM global_library`;
  console.log(`📦  ${rows.length} kayıt bulundu\n`);

  let updated = 0;
  let skipped = 0;
  let errors  = 0;

  for (const row of rows) {
    const { id, category, data } = row;
    let changed = false;
    const newData = { ...data };

    try {
      // -- url alanı --
      if (isBase64DataUri(data.url)) {
        console.log(`⬆️   [${category}] ${id} → url upload ediliyor...`);
        newData.url = await uploadBase64ToS3(data.url, `${id}-url`);
        changed = true;
        console.log(`   ✅  url → ${newData.url}`);
      }

      // -- thumbUrl alanı --
      if (isBase64DataUri(data.thumbUrl)) {
        console.log(`⬆️   [${category}] ${id} → thumbUrl upload ediliyor...`);
        newData.thumbUrl = await uploadBase64ToS3(data.thumbUrl, `${id}-thumb`);
        changed = true;
        console.log(`   ✅  thumbUrl → ${newData.thumbUrl}`);
      }

      // -- DB güncelle --
      if (changed) {
        await sql`
          UPDATE global_library
          SET data = ${JSON.stringify(newData)}::jsonb
          WHERE id = ${id}
        `;
        updated++;
        console.log(`   💾  DB güncellendi\n`);
      } else {
        skipped++;
      }

    } catch (err) {
      errors++;
      console.error(`   ❌  Hata [${id}]:`, err.message);
    }
  }

  console.log('\n── Özet ──────────────────────────────────────');
  console.log(`✅  Güncellenen kayıt : ${updated}`);
  console.log(`⏭️   Atlanan kayıt    : ${skipped}`);
  console.log(`❌  Hatalı kayıt      : ${errors}`);
  console.log('──────────────────────────────────────────────');
  console.log('\n🏁  Migration tamamlandı!');
  console.log('💡  DB boyutunu küçültmek için VACUUM çalıştır:');
  console.log('    VACUUM FULL global_library;');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
