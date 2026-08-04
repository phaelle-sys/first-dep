import { Breadcrumb } from "@/components/ui";
import { BienForm } from "@/components/BienForm";

export default function NewBienPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumb
        items={[
          { label: "Biens", href: "/biens" },
          { label: "Nouveau bien" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-white">
        Nouveau bien
      </h1>
      <p className="mb-6 text-sm text-slate-400">
        Renseignez les informations principales. Vous pourrez ensuite ajouter
        des unités, documents et photos, ou synchroniser un dossier Drive.
      </p>
      <div className="card p-6">
        <BienForm />
      </div>
    </div>
  );
}
