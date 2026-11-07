import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import {
  saveUrl,
  findUrlByOriginalUrl,
} from "../../../lib/db";

export const runtime = "nodejs";

const MAX_URL_LENGTH = 2048;

const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function createShortCode(originalUrl, length = 6) {
  const hex = createHash("sha256")
    .update(originalUrl)
    .digest("hex");

  let code = "";

  for (let i = 0; i < length; i++) {
    const value = parseInt(
      hex.slice(i * 2, i * 2 + 2),
      16
    );

    code += ALPHABET[value % ALPHABET.length];
  }

  return code;
}

/*
 * POST()
 *
 * URL 입력값 검증
 * 동일 URL 중복 처리
 * 자기 서비스 URL 차단
 * PostgreSQL 저장
 */
export async function POST(request) {
  try {
    // 1. 요청 데이터 읽기
    const body = await request.json().catch(() => null);

    const raw = body?.originalUrl;
    const originalUrl =
      typeof raw === "string" ? raw.trim() : "";

    // 2. URL 미입력 검사
    if (!originalUrl) {
      return NextResponse.json(
        {
          error: {
            code: "MISSING_URL",
            message: "Original URL is required.",
          },
        },
        { status: 400 }
      );
    }

    // 3. URL 최대 길이 검사
    if (originalUrl.length > MAX_URL_LENGTH) {
      return NextResponse.json(
        {
          error: {
            code: "URL_TOO_LONG",
            message: `URL must be ${MAX_URL_LENGTH} characters or fewer.`,
          },
        },
        { status: 400 }
      );
    }

    // 4. URL 형식 검사
    let parsedUrl;

    try {
      parsedUrl = new URL(originalUrl);
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_URL",
            message: "URL must start with http:// or https://.",
          },
        },
        { status: 400 }
      );
    }

    // 5. HTTP / HTTPS 프로토콜 검사
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_URL",
            message: "URL must start with http:// or https://.",
          },
        },
        { status: 400 }
      );
    }

// 자기 서비스 URL 차단

    const baseUrl = new URL(request.url).origin;

    const serviceHost = new URL(request.url).hostname.toLowerCase();
    const targetHost = parsedUrl.hostname.toLowerCase();

    if (serviceHost === targetHost) {
      return NextResponse.json(
        {
          error: {
            code: "SELF_URL_NOT_ALLOWED",
            message: "Cannot shorten this service's own URL.",
          },
        },
        { status: 400 }
      );
    }

// 중복 URL 조회
    const existingShortCode =
      await findUrlByOriginalUrl(originalUrl);

    if (existingShortCode) {
      return NextResponse.json(
        {
          shortCode: existingShortCode,
          shortUrl: `${baseUrl}/${existingShortCode}`,
          originalUrl,
        },
        { status: 200 }
      );
    }

    /*
     * 8. 새로운 단축 코드 생성
     */
    const shortCode = createShortCode(originalUrl);

    /*
     * 9. Neon PostgreSQL 저장
     */
    await saveUrl(shortCode, originalUrl);

    /*
     * 10. 새로운 URL 생성 성공
     */
    return NextResponse.json(
      {
        shortCode,
        shortUrl: `${baseUrl}/${shortCode}`,
        originalUrl,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Failed to create short URL:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create short URL.",
        },
      },
      { status: 500 }
    );
  }
}