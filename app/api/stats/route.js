import {
  getSummaryStats,
  getTopUrl,
  getUrlStats,
} from "../../../lib/stats";

import { authenticate } from "../../../lib/auth";
import { authorize } from "../../../lib/authorization";

export const dynamic = "force-dynamic";

// 인증되지 않은 사용자에게 HTTP 401 반환
function authenticationRequiredResponse() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin"',
      "Cache-Control": "no-store",
    },
  });
}

// 권한이 없는 사용자에게 HTTP 403 반환
function forbiddenResponse() {
  return new Response("Forbidden", {
    status: 403,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request) {

  // TODO 3: 관리자 인증 및 인가 확인
  const user = authenticate(request);

  if (!user) {
    return authenticationRequiredResponse();
  }

  if (!authorize(user, "stats:read")) {
    return forbiddenResponse();
  }

  // 기존 6주차 통계 조회 기능
  try {
    const summary = await getSummaryStats();
    const topUrl = await getTopUrl();
    const urls = await getUrlStats();

    return Response.json(
      {
        summary: {
          totalUrls: summary.totalUrls,
          totalClicks: summary.totalClicks,
          clickedUrls: summary.clickedUrls,
          topUrl: topUrl,
        },
        urls: urls,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

  } catch (error) {
    console.error("Failed to load stats", error);

    return Response.json(
      {
        error: {
          code: "STATS_ERROR",
          message: "Failed to load stats.",
        },
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}