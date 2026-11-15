// Add/edit plant form with inline validation messages (FR-001, FR-002, FR-003, FR-015).
import {
  DEFAULT_MAX_HOURS_OUTSIDE,
  DEFAULT_WATERING_DAYS,
  type FieldErrors,
  type PlantInput,
} from "../domain/plant";

export type FieldName = keyof FieldErrors;

export interface FieldSpec {
  name: FieldName;
  label: string;
  type: "text" | "number" | "datetime-local";
  value: string;
}

export interface PlantFormElements {
  form: HTMLFormElement;
  inputs: Map<FieldName, HTMLInputElement>;
  showErrors(errors: FieldErrors): void;
  clearErrors(): void;
}

let fieldCounter = 0;

/** Builds labeled inputs with error slots inside a form. */
export function buildForm(ariaLabel: string, fields: FieldSpec[]): PlantFormElements {
  const form = document.createElement("form");
  form.setAttribute("aria-label", ariaLabel);
  form.noValidate = true;

  const inputs = new Map<FieldName, HTMLInputElement>();
  const errorEls = new Map<FieldName, HTMLElement>();

  for (const f of fields) {
    fieldCounter += 1;
    const id = `field-${fieldCounter}`;
    const wrap = document.createElement("div");
    wrap.className = "field";

    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = f.label;

    const input = document.createElement("input");
    input.id = id;
    input.name = f.name;
    input.type = f.type;
    input.defaultValue = f.value;
    input.value = f.value;
    if (f.type === "number") input.step = "1";
    if (f.name === "name") input.maxLength = 200; // validation reports > 50 with a message

    const err = document.createElement("p");
    err.className = "field-error";
    err.id = `${id}-error`;
    err.hidden = true;

    wrap.append(label, input, err);
    form.append(wrap);
    inputs.set(f.name, input);
    errorEls.set(f.name, err);
  }

  const clearErrors = () => {
    for (const [name, input] of inputs) {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
      const err = errorEls.get(name)!;
      err.textContent = "";
      err.hidden = true;
    }
  };

  const showErrors = (errors: FieldErrors) => {
    clearErrors();
    let first: HTMLInputElement | undefined;
    for (const [name, input] of inputs) {
      const msg = errors[name];
      if (!msg) continue;
      const err = errorEls.get(name)!;
      err.textContent = msg;
      err.hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", err.id);
      first ??= input;
    }
    first?.focus();
  };

  return { form, inputs, showErrors, clearErrors };
}

export function readPlantInput(inputs: Map<FieldName, HTMLInputElement>): PlantInput {
  return {
    name: inputs.get("name")!.value,
    wateringIntervalDays: inputs.get("wateringIntervalDays")!.valueAsNumber,
    maxHoursOutside: inputs.get("maxHoursOutside")!.valueAsNumber,
  };
}

export function plantFields(values?: Partial<PlantInput>): FieldSpec[] {
  return [
    { name: "name", label: "Name", type: "text", value: values?.name ?? "" },
    {
      name: "wateringIntervalDays",
      label: "Water every (days)",
      type: "number",
      value: String(values?.wateringIntervalDays ?? DEFAULT_WATERING_DAYS),
    },
    {
      name: "maxHoursOutside",
      label: "Max time outside (hours)",
      type: "number",
      value: String(values?.maxHoursOutside ?? DEFAULT_MAX_HOURS_OUTSIDE),
    },
  ];
}

/** The persistent "Add plant" form (FR-001, FR-002). */
export function createAddPlantForm(onSubmit: (input: PlantInput) => FieldErrors | null): HTMLElement {
  const section = document.createElement("section");
  section.className = "card";
  const h = document.createElement("h2");
  h.textContent = "Add a plant";

  const { form, inputs, showErrors, clearErrors } = buildForm("Add plant", plantFields());
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Add plant";
  form.append(submit);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const errors = onSubmit(readPlantInput(inputs));
    if (errors) {
      showErrors(errors);
      return;
    }
    clearErrors();
    form.reset();
    inputs.get("name")!.focus();
  });

  section.append(h, form);
  return section;
}
