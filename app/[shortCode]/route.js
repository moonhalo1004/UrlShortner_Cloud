import { findUrlByShortCode } from "../../lib/db";
import { recordClick } from "../../lib/stats";

export async function GET(request, { params }) {
  // URL에서 단축 코드 추출
  const { shortCode } = await params;

  // PostgreSQL에서 원본 URL 조회
  const originalUrl = await findUrlByShortCode(shortCode);

  // 존재하지 않는 단축 코드 처리
  if (!originalUrl) {
    return Response.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Short URL not found.",
        },
      },
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // 정상적인 단축 URL에 접근한 경우 클릭 수 기록
  await recordClick(shortCode);

  // 원본 URL로 HTTP 307 리다이렉트
  return new Response(null, {
    status: 307,
    headers: {
      Location: originalUrl,
      "Cache-Control": "no-store",
    },
  });
}