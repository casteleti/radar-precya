export const PROCEDURE_CATEGORIES = [
  { value: "facial", label: "Facial" },
  { value: "corporal", label: "Corporal" },
  { value: "injetavel", label: "Injetável" },
  { value: "outros", label: "Outros" },
] as const;

export type ProcedureCategoryValue = (typeof PROCEDURE_CATEGORIES)[number]["value"];

export function procedureCategoryLabel(value: string): string {
  return PROCEDURE_CATEGORIES.find((c) => c.value === value)?.label ?? "Outros";
}

export function procedureCategoryIcon(value: string): string {
  switch (value) {
    case "facial":
      return "🧖";
    case "corporal":
      return "💪";
    case "injetavel":
      return "💉";
    default:
      return "✨";
  }
}
