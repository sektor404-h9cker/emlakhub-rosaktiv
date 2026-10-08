"use client";

import { getAvatarPreset } from "@/data/avatars";
import { personInitials } from "@/lib/staffProfile";

export default function UserAvatar({
  name = "?",
  avatarId = "slate",
  size = "md",
  className = "",
  status,
  initials,
}) {
  const preset = getAvatarPreset(avatarId);
  const letters =
    initials ||
    personInitials({ displayName: name }) ||
    (name || "?").charAt(0).toUpperCase();
  const sizeCls =
    size === "lg"
      ? "h-16 w-16 text-[20px]"
      : size === "sm"
        ? "h-8 w-8 text-[11px]"
        : "h-10 w-10 text-[13px]";
  const dotSize =
    size === "lg" ? "h-3.5 w-3.5" : size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";

  return (
    <span className={["relative inline-flex shrink-0", className].join(" ")}>
      <span
        className={[
          "inline-flex items-center justify-center rounded-full font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
          sizeCls,
        ].join(" ")}
        style={{
          background: `linear-gradient(145deg, ${preset.from}, ${preset.to})`,
          boxShadow: `0 0 0 2px rgba(0,0,0,0.35), 0 0 0 3px ${preset.ring}33`,
        }}
        aria-hidden
      >
        {letters}
      </span>
      {status ? (
        <span
          className={[
            "absolute bottom-0 right-0 rounded-full ring-2 ring-[#0a0c12]",
            dotSize,
          ].join(" ")}
          style={{ background: status }}
          aria-hidden
        />
      ) : null}
    </span>
  );
}
