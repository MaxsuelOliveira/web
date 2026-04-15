export const DEFAULT_THEME = "dark";
export const THEME_CLASS_MAP = {
  dark: "theme-dark",
};

export function applyTheme(theme = DEFAULT_THEME) {
  const className = THEME_CLASS_MAP[theme];

  if (!className || typeof document === "undefined") {
    return;
  }

  document.body.classList.remove(...Object.values(THEME_CLASS_MAP));
  document.body.classList.add(className);
}
