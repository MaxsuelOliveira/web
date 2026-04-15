import categories from "../../modules/catalog/categories";
import tools from "../../modules/catalog/tools";

export default function Footer() {
  return (
    <footer className="mt-10 w-full border-t border-white/60 bg-white/70 py-8 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-4 text-center md:flex-row md:items-center md:justify-between md:px-6 md:text-left">
        <div>
          <p className="text-sm font-extrabold tracking-[0.08em] text-slate-600">
            Ferramentas Online
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {tools.length} modulos organizados em {categories.length - 1} areas
            principais para pesquisar, transformar, gerar e validar dados.
          </p>
        </div>

        <div className="flex flex-col gap-1 text-sm text-slate-500 md:items-end">
          <span>&copy; {new Date().getFullYear()} Paradevs.com.br</span>
          <span>Base em React, TailwindCSS e Node.js ESM</span>
        </div>
      </div>
    </footer>
  );
}
