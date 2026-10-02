"use client";

import React from "react";

// Consistent visual style tokens
const PLUM = "#5B3FA3";
const CORAL = "#FF8066";
const YELLOW = "#F6C85F";
const SOFT_BLUE = "#8EC5E8";
const SOFT_GREEN = "#77BFA3";
const CREAM = "#FFF9F0";
const CHARCOAL = "#202124";

interface IllustrationProps {
  className?: string;
  size?: number;
}

/**
 * Modern cartoon character sitting comfortably reading an open book
 * with a friendly reading lamp and gentle floating stars.
 */
export function HeroReadingCharacter({ className = "", size = 380 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
    >
      {/* Background Soft Organic Blob */}
      <path
        d="M340 210C360 270 310 350 240 370C170 390 90 350 60 280C30 210 70 120 140 70C210 20 320 150 340 210Z"
        fill="#FBF3E7"
      />

      {/* Floating Gentle Stars */}
      <g opacity="0.9">
        {/* Star 1 */}
        <path
          d="M75 130L78 138L86 141L78 144L75 152L72 144L64 141L72 138Z"
          fill={YELLOW}
        />
        {/* Star 2 */}
        <path
          d="M335 95L338 102L345 105L338 108L335 115L332 108L325 105L332 102Z"
          fill={CORAL}
        />
        {/* Star 3 */}
        <path
          d="M315 285L317 290L322 292L317 294L315 299L313 294L308 292L313 290Z"
          fill={YELLOW}
        />
      </g>

      {/* Modern Curved Reading Lamp */}
      <g>
        {/* Lamp Base */}
        <ellipse cx="90" cy="330" rx="26" ry="6" fill="#D9D0C3" />
        {/* Lamp Stem */}
        <path
          d="M90 330C90 260 92 180 140 135"
          stroke={CHARCOAL}
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Lamp Shade */}
        <path
          d="M130 145L160 122C165 118 172 122 172 128L165 158C162 163 155 166 148 163L132 153C127 151 126 147 130 145Z"
          fill={YELLOW}
        />
        {/* Warm light cone */}
        <path
          d="M148 163L185 240L230 220L165 158Z"
          fill={YELLOW}
          fillOpacity="0.18"
        />
      </g>

      {/* Reading Armchair / Beanbag */}
      <ellipse cx="230" cy="310" rx="95" ry="45" fill={SOFT_BLUE} />
      <path
        d="M165 240C165 180 285 180 295 240C305 300 155 300 165 240Z"
        fill={SOFT_BLUE}
        opacity="0.85"
      />

      {/* Friendly Reading Character */}
      <g>
        {/* Legs / Cozy Sitting Stance */}
        <path
          d="M175 285C195 265 235 270 260 285C275 295 245 320 215 320C185 320 165 295 175 285Z"
          fill={PLUM}
        />

        {/* Torso in Cozy Sweater */}
        <path
          d="M190 205C190 185 260 185 260 205L255 275C255 285 195 285 195 275Z"
          fill={CORAL}
        />

        {/* Head */}
        <circle cx="225" cy="155" r="28" fill="#F8CEB4" />

        {/* Playful Hair Bun */}
        <circle cx="235" cy="120" r="16" fill={CHARCOAL} />
        <path
          d="M205 150C205 130 245 125 245 145C235 140 215 145 205 150Z"
          fill={CHARCOAL}
        />

        {/* Glasses */}
        <rect
          x="208"
          y="150"
          width="14"
          height="10"
          rx="3"
          stroke={CHARCOAL}
          strokeWidth="2.5"
          fill="none"
        />
        <rect
          x="226"
          y="150"
          width="14"
          height="10"
          rx="3"
          stroke={CHARCOAL}
          strokeWidth="2.5"
          fill="none"
        />
        <line x1="222" y1="155" x2="226" y2="155" stroke={CHARCOAL} strokeWidth="2.5" />

        {/* Serene Smile */}
        <path
          d="M218 168C222 172 228 172 232 168"
          stroke={CHARCOAL}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Arms holding the open book */}
        <path
          d="M190 225C175 240 185 265 205 260"
          stroke={CORAL}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M260 225C275 240 265 265 245 260"
          stroke={CORAL}
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Open Book in Hands */}
        <g transform="translate(195, 235)">
          {/* Book Spine */}
          <path d="M30 20L30 3" stroke={CHARCOAL} strokeWidth="3" />
          {/* Left Page */}
          <path
            d="M30 6C18 3 5 8 2 12L2 30C5 26 18 21 30 24Z"
            fill="#FFFFFF"
            stroke={CHARCOAL}
            strokeWidth="2.5"
          />
          {/* Right Page */}
          <path
            d="M30 6C42 3 55 8 58 12L58 30C55 26 42 21 30 24Z"
            fill="#FFFFFF"
            stroke={CHARCOAL}
            strokeWidth="2.5"
          />
          {/* Text lines on pages */}
          <line x1="8" y1="17" x2="24" y2="15" stroke={SOFT_BLUE} strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="22" x2="22" y2="20" stroke={SOFT_BLUE} strokeWidth="2" strokeLinecap="round" />
          <line x1="36" y1="15" x2="52" y2="17" stroke={SOFT_BLUE} strokeWidth="2" strokeLinecap="round" />
          <line x1="38" y1="20" x2="50" y2="22" stroke={SOFT_BLUE} strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>

      {/* Floating Pages */}
      <g opacity="0.85">
        <rect
          x="300"
          y="180"
          width="20"
          height="28"
          rx="3"
          transform="rotate(18 300 180)"
          fill="#FFFFFF"
          stroke={SOFT_GREEN}
          strokeWidth="2"
        />
        <line x1="306" y1="192" x2="318" y2="196" stroke={SOFT_GREEN} strokeWidth="2" strokeLinecap="round" />
        <line x1="308" y1="198" x2="316" y2="201" stroke={SOFT_GREEN} strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Tiny Plant Beside */}
      <g transform="translate(305, 305)">
        <path d="M12 25L12 10" stroke={SOFT_GREEN} strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="6" cy="12" rx="6" ry="4" transform="rotate(-30 6 12)" fill={SOFT_GREEN} />
        <ellipse cx="18" cy="8" rx="6" ry="4" transform="rotate(25 18 8)" fill={SOFT_GREEN} />
        <path d="M5 25H19L17 35H7L5 25Z" fill={PLUM} />
      </g>
    </svg>
  );
}

/**
 * Cartoon character looking through an empty bookshelf
 * Perfect for Empty States and 404 error page.
 */
export function EmptyShelfIllustration({ className = "", size = 260 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
    >
      {/* Soft Background */}
      <circle cx="150" cy="150" r="130" fill="#FFF4E6" />

      {/* Empty Wooden Bookshelf */}
      <rect x="50" y="70" width="200" height="160" rx="16" fill="#F0E5D5" stroke={CHARCOAL} strokeWidth="3.5" />
      {/* Top shelf line */}
      <line x1="50" y1="125" x2="250" y2="125" stroke={CHARCOAL} strokeWidth="3.5" />
      {/* Middle shelf line */}
      <line x1="50" y1="180" x2="250" y2="180" stroke={CHARCOAL} strokeWidth="3.5" />

      {/* One lone tilted book on top shelf */}
      <rect
        x="80"
        y="90"
        width="16"
        height="32"
        rx="3"
        transform="rotate(-15 80 90)"
        fill={CORAL}
        stroke={CHARCOAL}
        strokeWidth="2.5"
      />
      {/* Tiny plant on bottom shelf */}
      <path d="M225 180L222 170H236L233 180H225Z" fill={PLUM} stroke={CHARCOAL} strokeWidth="2" />
      <circle cx="229" cy="165" r="5" fill={SOFT_GREEN} />

      {/* Inquisitive Cartoon Character Peeking */}
      <circle cx="150" cy="155" r="24" fill="#F8CEB4" stroke={CHARCOAL} strokeWidth="3" />
      <path d="M135 140C135 125 165 125 165 140Z" fill={CHARCOAL} />
      {/* Curious Eyes */}
      <circle cx="144" cy="155" r="3" fill={CHARCOAL} />
      <circle cx="156" cy="155" r="3" fill={CHARCOAL} />
      {/* Question mark / surprise */}
      <path
        d="M175 130C175 124 182 120 186 124C189 128 185 132 183 134V137"
        stroke={CORAL}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="183" cy="142" r="1.5" fill={CORAL} />
    </svg>
  );
}

/**
 * Cartoon open book with sparkles and bookmark ribbon
 */
export function OpenBookIllustration({ className = "", size = 120 }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="80" cy="80" r="72" fill="#F4EFFF" />
      {/* Ribbon */}
      <path d="M80 50L80 95L86 90L92 95L92 50Z" fill={CORAL} />
      {/* Left Page */}
      <path
        d="M80 58C62 53 42 60 36 67L36 102C42 95 62 88 80 93Z"
        fill="#FFFFFF"
        stroke={PLUM}
        strokeWidth="3.5"
      />
      {/* Right Page */}
      <path
        d="M80 58C98 53 118 60 124 67L124 102C118 95 98 88 80 93Z"
        fill="#FFFFFF"
        stroke={PLUM}
        strokeWidth="3.5"
      />
      {/* Text Lines */}
      <line x1="46" y1="78" x2="68" y2="74" stroke={SOFT_BLUE} strokeWidth="3" strokeLinecap="round" />
      <line x1="46" y1="86" x2="65" y2="82" stroke={SOFT_BLUE} strokeWidth="3" strokeLinecap="round" />
      <line x1="92" y1="74" x2="114" y2="78" stroke={SOFT_BLUE} strokeWidth="3" strokeLinecap="round" />
      <line x1="95" y1="82" x2="114" y2="86" stroke={SOFT_BLUE} strokeWidth="3" strokeLinecap="round" />
      {/* Sparkles */}
      <path d="M125 45L127 50L132 52L127 54L125 59L123 54L118 52L123 50Z" fill={YELLOW} />
    </svg>
  );
}

/**
 * Category icons in consistent READORA cartoon style
 */
export function CategoryIllustration({
  slug,
  size = 48,
  className = "",
}: {
  slug: string;
  size?: number;
  className?: string;
}) {
  const s = slug.toLowerCase();

  if (s.includes("fiction") || s.includes("literature")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <rect x="8" y="10" width="48" height="44" rx="14" fill="#F4EFFF" />
        <path d="M22 20H42C44 20 46 22 46 24V44C46 44 38 41 32 44C26 41 18 44 18 44V24C18 22 20 20 22 20Z" fill="#FFFFFF" stroke={PLUM} strokeWidth="2.5" />
        <path d="M32 24V42" stroke={PLUM} strokeWidth="2" />
        <circle cx="44" cy="18" r="4" fill={YELLOW} />
      </svg>
    );
  }

  if (s.includes("tech")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <rect x="8" y="10" width="48" height="44" rx="14" fill="#EAF5FC" />
        <rect x="18" y="20" width="28" height="20" rx="5" fill="#FFFFFF" stroke={SOFT_BLUE} strokeWidth="2.5" />
        <line x1="24" y1="27" x2="30" y2="27" stroke={PLUM} strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="33" x2="36" y2="33" stroke={SOFT_GREEN} strokeWidth="2" strokeLinecap="round" />
        <path d="M28 40L26 44H38L36 40" stroke={SOFT_BLUE} strokeWidth="2" />
      </svg>
    );
  }

  if (s.includes("business")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <rect x="8" y="10" width="48" height="44" rx="14" fill="#EBF7F2" />
        <rect x="18" y="22" width="28" height="22" rx="5" fill="#FFFFFF" stroke={SOFT_GREEN} strokeWidth="2.5" />
        <path d="M26 22V18C26 16.8954 26.8954 16 28 16H36C37.1046 16 38 16.8954 38 18V22" stroke={SOFT_GREEN} strokeWidth="2.5" />
        <circle cx="32" cy="33" r="3" fill={YELLOW} />
      </svg>
    );
  }

  if (s.includes("self") || s.includes("mind") || s.includes("philosophy")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <rect x="8" y="10" width="48" height="44" rx="14" fill="#FFF4E6" />
        <circle cx="32" cy="32" r="14" fill="#FFFFFF" stroke={CORAL} strokeWidth="2.5" />
        <path d="M26 30C28 27 36 27 38 30" stroke={CORAL} strokeWidth="2" strokeLinecap="round" />
        <path d="M26 36C29 39 35 39 38 36" stroke={PLUM} strokeWidth="2" strokeLinecap="round" />
        <circle cx="43" cy="20" r="3" fill={YELLOW} />
      </svg>
    );
  }

  if (s.includes("child")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <rect x="8" y="10" width="48" height="44" rx="14" fill="#FFF9EB" />
        <path d="M32 18L35 25L43 26L37 32L39 40L32 36L25 40L27 32L21 26L29 25Z" fill={YELLOW} stroke={CHARCOAL} strokeWidth="2" />
      </svg>
    );
  }

  // Generic Default Book
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <rect x="8" y="10" width="48" height="44" rx="14" fill="#F4EFFF" />
      <rect x="20" y="18" width="24" height="28" rx="4" fill="#FFFFFF" stroke={PLUM} strokeWidth="2.5" />
      <line x1="26" y1="26" x2="38" y2="26" stroke={CORAL} strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="32" x2="34" y2="32" stroke={SOFT_BLUE} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
