export const COST_CATEGORIES = [
  { value: "aluguel", label: "Aluguel" },
  { value: "equipe", label: "Equipe" },
  { value: "pro_labore", label: "Pró-labore" },
  { value: "marketing", label: "Marketing" },
  { value: "softwares", label: "Softwares" },
  { value: "contador", label: "Contador" },
  { value: "equipamentos", label: "Equipamentos / manutenção" },
  { value: "agua_luz_internet", label: "Água, luz e internet" },
  { value: "outros", label: "Outros" },
] as const;

export type CostCategoryValue = (typeof COST_CATEGORIES)[number]["value"];

export function costCategoryLabel(value: string): string {
  return COST_CATEGORIES.find((c) => c.value === value)?.label ?? "Outros";
}
