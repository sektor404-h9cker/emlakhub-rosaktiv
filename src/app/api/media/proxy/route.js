/**
 * Прокси фото herrac → same-origin.
 * herrac stream часто отвечает 206; браузерный <img> ломается, если
 * отдать 200 + Content-Range. Всегда отдаём полный буфер как 200 image/*.
 */
import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "herrac.gov.az",
  "www.herrac.gov.az",
  "eherrac.com",
  "www.eherrac.com",
  "apiherrac.gov.az",
]);

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function isAllowed(raw) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    return ALLOWED_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function sniffImageType(buf) {
  if (!buf || buf.byteLength < 4) return null;
  const b = Buffer.from(buf.slice(0, 12));
  if (b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)
    return "image/png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

async function fetchUpstream(url) {
  const common = {
    Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "User-Agent": BROWSER_UA,
    Referer: "https://herrac.gov.az/auctions",
    Origin: "https://herrac.gov.az",
    "Accept-Language": "az-AZ,az;q=0.9,en;q=0.8,ru;q=0.7",
  };

  // 1) Полный ответ без Range — предпочтительно для <img>
  let res = await fetch(url, {
    headers: common,
    redirect: "follow",
    cache: "no-store",
  });

  // 2) Некоторые стримы herrac отдают только с Range
  if (!res.ok && res.status !== 206) {
    res = await fetch(url, {
      headers: { ...common, Range: "bytes=0-" },
      redirect: "follow",
      cache: "no-store",
    });
  }

  return res;
}

export async function GET(req) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !isAllowed(url)) {
    return NextResponse.json({ error: "url not allowed" }, { status: 400 });
  }

  try {
    const upstream = await fetchUpstream(url);

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: `upstream ${upstream.status}` },
        { status: 502 }
      );
    }

    const buf = await upstream.arrayBuffer();
    const head = Buffer.from(buf.slice(0, 24)).toString("utf8").trimStart();
    if (head.startsWith("{") || head.startsWith("<!") || head.startsWith("<html")) {
      return NextResponse.json({ error: "not an image" }, { status: 502 });
    }

    const sniffed = sniffImageType(buf);
    const upstreamType = upstream.headers.get("content-type") || "";
    const type =
      sniffed ||
      (upstreamType.startsWith("image/") && !upstreamType.includes("json")
        ? upstreamType.split(";")[0].trim()
        : "image/jpeg");

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Content-Length": String(buf.byteLength),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
        // Не пробрасываем Content-Range — ломает <img> при status 200
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "proxy failed" },
      { status: 502 }
    );
  }
}
