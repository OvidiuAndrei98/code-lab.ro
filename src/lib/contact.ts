export const contactEmail = "contact@code-lab.ro";

export const contactServiceOptions = [
  {
    id: "website",
    value: "Website",
    hint: "Ce face afacerea ta și ce trebuie să comunice site-ul?",
  },
  {
    id: "ecommerce",
    value: "Magazin online",
    hint: "Ce produse vinzi? Există deja un magazin pe care vrei să-l schimbăm?",
  },
  {
    id: "aplicatii",
    value: "Aplicație web",
    hint: "Ce proces vrei să organizezi și cine va folosi aplicația?",
  },
  {
    id: "indecis",
    value: "Nu știu încă",
    hint: "De unde pornește ideea și ce problemă ai vrea să rezolvi?",
  },
] as const;

export const contactBudgetOptions = [
  "Îl stabilim împreună",
  "Sub 2.000 €",
  "2.000 – 5.000 €",
  "5.000 – 10.000 €",
  "Peste 10.000 €",
] as const;

export const contactLimits = { name: 120, email: 254, message: 8000 } as const;

export type ContactFields = {
  name: string;
  email: string;
  service: string;
  budget: string;
  message: string;
};
export type ContactErrors = Partial<Record<keyof ContactFields, string>>;

export function validateContact(fields: ContactFields): ContactErrors {
  const errors: ContactErrors = {};
  if (!contactServiceOptions.some((option) => option.value === fields.service))
    errors.service = "Alege un serviciu sau «Nu știu încă».";
  if (!fields.message)
    errors.message = "Scrie câteva cuvinte despre ce ai în minte.";
  else if (fields.message.length > contactLimits.message)
    errors.message = "Mesajul poate avea cel mult 8.000 de caractere.";
  if (!fields.name) errors.name = "Scrie cum te numești.";
  else if (
    fields.name.length > contactLimits.name ||
    /[\r\n\x00-\x1f\x7f]/.test(fields.name)
  )
    errors.name = "Verifică numele introdus.";
  if (!fields.email) errors.email = "Scrie adresa la care te putem contacta.";
  else if (
    fields.email.length > contactLimits.email ||
    !/^[A-Z0-9.!#$%&'*+\-/=?^_`{|}~]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$/i.test(
      fields.email,
    )
  )
    errors.email = "Verifică adresa de email.";
  if (
    fields.budget &&
    !contactBudgetOptions.some((option) => option === fields.budget)
  )
    errors.budget = "Alege un buget din listă.";
  return errors;
}

export function formatContactBrief(fields: ContactFields) {
  return `Salut, CODELAB!\n\nNume: ${fields.name}\nEmail: ${fields.email}\nProiect: ${fields.service}\nBuget orientativ: ${fields.budget || contactBudgetOptions[0]}\n\n${fields.message}\n`;
}
