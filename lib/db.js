import { neon } from "@neondatabase/serverless";

// Neon PostgreSQL 연결
const sql = neon(process.env.DATABASE_URL);

/*
 * saveUrl()
 *
 * 생성한 단축 코드와 원본 URL을
 * Neon PostgreSQL 데이터베이스에 저장합니다.
 */
export async function saveUrl(shortCode, originalUrl) {
  await sql`
    INSERT INTO urls (short_code, original_url)
    VALUES (${shortCode}, ${originalUrl})
  `;
}

/*
 * findUrlByShortCode()
 *
 * 단축 코드를 이용하여 데이터베이스에서
 * 원본 URL을 조회합니다.
 */
export async function findUrlByShortCode(shortCode) {
  const rows = await sql`
    SELECT original_url
    FROM urls
    WHERE short_code = ${shortCode}
    LIMIT 1
  `;

  // 해당 단축 코드가 존재하지 않는 경우
  if (rows.length === 0) {
    return null;
  }

  // 조회한 원본 URL 반환
  return rows[0].original_url;
}

/*
 * 원본 URL을 조회하여 기존 단축 코드를 반환합니다.
 */
export async function findUrlByOriginalUrl(originalUrl) {
  const rows = await sql`
    SELECT short_code
    FROM urls
    WHERE original_url = ${originalUrl}
    LIMIT 1
  `;

  // 기존에 저장된 URL이 없는 경우
  if (rows.length === 0) {
    return null;
  }

  // 기존에 저장된 단축 코드 반환
  return rows[0].short_code;
}