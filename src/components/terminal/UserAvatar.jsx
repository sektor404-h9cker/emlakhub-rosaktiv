"use client";

import { getAvatarPreset } from "@/data/avatars";

export default function UserAvatar({
  name = "?",
  avatarId = "slate",
  size = "md",
  className = "",
}) {
  const preset = getAvatarPreset(avatarId);
  const initial = (name || "?").charAt(0).toUpperCase();
  const sizeCls =
    size === "lg"
      ? "h-16 w-16 text-[22px]"
      : size === "sm"
        ? "h-8 w-8 text-[12px]"
        : "h-10 w-10 text-[14px]";

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
        sizeCls,
        className,
      ].join(" ")}
      style={{
        background: `linear-gradient(145deg, ${preset.from}, ${preset.to})`,
        boxShadow: `0 0 0 2px rgba(0,0,0,0.35), 0 0 0 3px ${preset.ring}33`,
      }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
