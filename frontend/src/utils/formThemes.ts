export interface FormTheme {
  id: string;
  name: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  bg: string;
  cardBg: string;
  text: string;
  muted: string;
  border: string;
}

export const FORM_THEMES: FormTheme[] = [
  // ── Default ──────────────────────────────────────────────
  { id: 'forest',      name: 'Forest',      primary: '#1B6B4A', primaryLight: '#E8F5EE', primaryDark: '#134F36', bg: '#FAFAF8', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#6B6B66', border: '#E8E8E4' },

  // ── Blues ─────────────────────────────────────────────────
  { id: 'ocean',       name: 'Ocean',       primary: '#1565C0', primaryLight: '#E3F0FF', primaryDark: '#0D47A1', bg: '#F0F7FF', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#5A6B7A', border: '#CDDFF5' },
  { id: 'sky',         name: 'Sky',         primary: '#0284C7', primaryLight: '#E0F5FF', primaryDark: '#0369A1', bg: '#F0F9FF', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#5B7A8A', border: '#BAE6FD' },
  { id: 'indigo',      name: 'Indigo',      primary: '#3949AB', primaryLight: '#E8EBF8', primaryDark: '#283593', bg: '#F0F3FF', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#606880', border: '#C5CAE9' },
  { id: 'corporate',   name: 'Corporate',   primary: '#1E3A5F', primaryLight: '#E3EAF3', primaryDark: '#152B47', bg: '#F5F7FA', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#5A6675', border: '#D0D9E4' },

  // ── Greens ────────────────────────────────────────────────
  { id: 'mint',        name: 'Mint',        primary: '#059669', primaryLight: '#D1FAE5', primaryDark: '#047857', bg: '#F0FDF8', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#4A7A65', border: '#A7F3D0' },
  { id: 'teal',        name: 'Teal',        primary: '#0F7A7A', primaryLight: '#CCEFEF', primaryDark: '#0A5A5A', bg: '#F0FAFA', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#4A6B6B', border: '#99DDDD' },

  // ── Purples ───────────────────────────────────────────────
  { id: 'grape',       name: 'Grape',       primary: '#7C3AED', primaryLight: '#EDE9FE', primaryDark: '#5B21B6', bg: '#F5F3FF', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#6B5B8A', border: '#DDD6FE' },
  { id: 'purple',      name: 'Purple',      primary: '#6B4A9A', primaryLight: '#F0E8FF', primaryDark: '#4F3275', bg: '#F5F0FF', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#6A5A80', border: '#D8C8F0' },

  // ── Pinks & Reds ──────────────────────────────────────────
  { id: 'rose',        name: 'Rose',        primary: '#BE185D', primaryLight: '#FCE7F3', primaryDark: '#9D174D', bg: '#FFF5F8', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#7A4A60', border: '#FBCFE8' },
  { id: 'coral',       name: 'Coral',       primary: '#E05C4B', primaryLight: '#FDECEA', primaryDark: '#C04535', bg: '#FFF5F3', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#7A5050', border: '#FAC5BE' },
  { id: 'crimson',     name: 'Crimson',     primary: '#B22222', primaryLight: '#FDEAEA', primaryDark: '#8B1A1A', bg: '#FFF5F5', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#7A4A4A', border: '#F5C2C2' },

  // ── Warm ──────────────────────────────────────────────────
  { id: 'sunset',      name: 'Sunset',      primary: '#D4621B', primaryLight: '#FEF0E7', primaryDark: '#A84D14', bg: '#FFF8F0', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#7A5A45', border: '#FAD5B8' },
  { id: 'amber',       name: 'Amber',       primary: '#B8860B', primaryLight: '#FEF8E0', primaryDark: '#8B6508', bg: '#FFFBF0', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#7A6A40', border: '#F5E0A0' },
  { id: 'warm_sand',   name: 'Warm Sand',   primary: '#8B6914', primaryLight: '#FDF3DC', primaryDark: '#6A500F', bg: '#FDF8F0', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#7A6A50', border: '#EDD9A3' },
  { id: 'terracotta',  name: 'Terracotta',  primary: '#9C4221', primaryLight: '#FDEEE8', primaryDark: '#7A3318', bg: '#FFF7F4', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#7A5548', border: '#F5C4B0' },

  // ── Indian Cultural ───────────────────────────────────────
  { id: 'saffron',     name: 'Saffron',     primary: '#E07B00', primaryLight: '#FFF3E0', primaryDark: '#B85F00', bg: '#FFFAF2', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#7A6040', border: '#F5D5A0' },
  { id: 'lotus',       name: 'Lotus',       primary: '#C2185B', primaryLight: '#FCE4EC', primaryDark: '#960F45', bg: '#FFF0F6', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#7A4060', border: '#F8BBD9' },
  { id: 'peacock',     name: 'Peacock',     primary: '#006374', primaryLight: '#CDF0F5', primaryDark: '#004A57', bg: '#F0FAFB', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#405A60', border: '#9AE0E8' },
  { id: 'marigold',    name: 'Marigold',    primary: '#D4900A', primaryLight: '#FEF5DC', primaryDark: '#A87008', bg: '#FFFDF0', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#7A6838', border: '#F5E08A' },
  { id: 'henna',       name: 'Henna',       primary: '#8B2500', primaryLight: '#FDECEA', primaryDark: '#6A1C00', bg: '#FFF5F0', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#7A4838', border: '#F5C5B0' },

  // ── Minimal ───────────────────────────────────────────────
  { id: 'snow',        name: 'Snow',        primary: '#2D2D2D', primaryLight: '#F0F0F0', primaryDark: '#1A1A1A', bg: '#FFFFFF',  cardBg: '#FAFAFA', text: '#1A1A18', muted: '#6B6B66', border: '#E8E8E4' },
  { id: 'slate',       name: 'Slate',       primary: '#475569', primaryLight: '#E8ECF0', primaryDark: '#334155', bg: '#F8FAFC', cardBg: '#FFFFFF', text: '#1A1A18', muted: '#64748B', border: '#CBD5E1' },

  // ── Dark themes ───────────────────────────────────────────
  { id: 'midnight',    name: 'Midnight',    primary: '#4A9EDB', primaryLight: '#1A2E45', primaryDark: '#3A8EC8', bg: '#0F1117', cardBg: '#1A1D27', text: '#E8E8F0', muted: '#8888A0', border: '#2A2D3A' },
  { id: 'charcoal',    name: 'Charcoal',    primary: '#7B9EFF', primaryLight: '#1E2035', primaryDark: '#6B8EEF', bg: '#1C1C1E', cardBg: '#2C2C2E', text: '#E8E8EC', muted: '#888890', border: '#3A3A3C' },
  { id: 'obsidian',    name: 'Obsidian',    primary: '#A78BFA', primaryLight: '#1E1830', primaryDark: '#9370E8', bg: '#0D0D1A', cardBg: '#16162A', text: '#E8E8F8', muted: '#8880A8', border: '#2A2840' },
  { id: 'dark_forest', name: 'Dark Forest', primary: '#4CAF82', primaryLight: '#0F2820', primaryDark: '#3A9A6E', bg: '#0A1A0F', cardBg: '#0F2318', text: '#E0F0E8', muted: '#70A080', border: '#1A3828' },
  { id: 'eclipse',     name: 'Eclipse',     primary: '#F0A030', primaryLight: '#2A2010', primaryDark: '#D08820', bg: '#0F0F0A', cardBg: '#1A1A10', text: '#F0F0E0', muted: '#A0A080', border: '#2A2820' },
];

export const DEFAULT_THEME_ID = 'forest';

export function getTheme(themeId?: string): FormTheme {
  return FORM_THEMES.find((t) => t.id === themeId) ?? FORM_THEMES[0];
}
