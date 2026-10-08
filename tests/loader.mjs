import { readFile } from "node:fs/promises";

/**
 * Тесты грузят src/*.js как ESM, хотя package.json без "type": "module"
 * (seed и herrac-sync остаются CommonJS).
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let rel = specifier.slice(2);
    if (!/\.(js|json|mjs|cjs|node)$/.test(rel)) rel += ".js";
    return nextResolve(new URL(`../src/${rel}`, import.meta.url).href, context);
  }
  if (specifier === "next/headers" || specifier === "next/server") {
    return nextResolve(`${specifier}.js`, context);
  }
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !/\.(js|json|mjs|cjs|node)$/.test(specifier)
  ) {
    return nextResolve(`${specifier}.js`, context);
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith("file:") && url.includes("/src/") && url.endsWith(".js")) {
    const source = await readFile(new URL(url), "utf8");
    return { format: "module", source, shortCircuit: true };
  }
  if (url.startsWith("file:") && url.endsWith(".json")) {
    const source = await readFile(new URL(url), "utf8");
    return { format: "json", source, shortCircuit: true };
  }
  return nextLoad(url, context);
}
