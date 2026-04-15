import ToolCard from "../../tooling/ToolCard";
import { getCategoryCount } from "./catalogUtils";

const OBJECTIVE_BLOCKS = [
  {
    id: "consultas",
    title: "Quero consultar",
    description: "CEP, dominio, clima, IP e outras buscas prontas.",
    accent: "from-cyan-500 to-blue-600",
  },
  {
    id: "texto",
    title: "Quero ajustar texto",
    description: "Formatar, limpar, converter e reorganizar conteudo.",
    accent: "from-violet-500 to-fuchsia-600",
  },
  {
    id: "geradores",
    title: "Quero gerar algo",
    description: "Senhas, nicknames, mocks, documentos e codigos.",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    id: "api-teste",
    title: "Quero testar",
    description: "Regex, JSON, JWT, HTTP e validacoes tecnicas.",
    accent: "from-orange-500 to-rose-500",
  },
];

function buildCatalogSections(filteredTools, activeCategory, query) {
  const normalizedQuery = query.trim();
  const hasFilters = normalizedQuery.length > 0 || activeCategory !== "todas";

  if (hasFilters) {
    return [
      {
        id: "results",
        title: normalizedQuery
          ? `Resultados para "${normalizedQuery}"`
          : "Ferramentas desta area",
        description: normalizedQuery
          ? "Mostrando as ferramentas que mais combinam com sua busca."
          : "Lista filtrada pela area selecionada.",
        tools: filteredTools,
      },
    ];
  }

  const used = new Set();

  function takeTools(predicate) {
    const tools = filteredTools.filter((tool) => !used.has(tool.id) && predicate(tool));
    tools.forEach((tool) => used.add(tool.id));
    return tools;
  }

  const sections = [
    {
      id: "start",
      title: "Comece por aqui",
      description: "As ferramentas que resolvem as tarefas mais comuns logo de cara.",
      tools: takeTools((tool) => tool.isQuickAccess),
    },
    {
      id: "new",
      title: "Novidades em destaque",
      description: "Recursos novos para explorar sem precisar procurar muito.",
      tools: takeTools((tool) => tool.isFeaturedNew),
    },
    {
      id: "lookup",
      title: "Buscar informacoes",
      description: "Consultas de CEP, dominio, APIs, clima e rede.",
      tools: takeTools((tool) => tool.family === "lookup"),
    },
    {
      id: "text",
      title: "Editar textos",
      description: "Converter, organizar, limpar e transformar conteudo.",
      tools: takeTools((tool) => tool.family === "text"),
    },
    {
      id: "generator",
      title: "Criar itens prontos",
      description: "Geradores de senha, nickname, bio, documentos, mocks e mais.",
      tools: takeTools((tool) => tool.family === "generator"),
    },
    {
      id: "tester",
      title: "Validar e testar",
      description: "Ferramentas para conferir regras, payloads e respostas tecnicas.",
      tools: takeTools((tool) => tool.family === "tester"),
    },
  ];

  return sections.filter((section) => section.tools.length > 0);
}

export default function CatalogPanel({
  tools,
  categories,
  activeCategory,
  query,
  filteredTools,
  quickTools,
  searchInputRef,
  onSelectCategory,
  onSelectTool,
  onChangeQuery,
  onClearFilters,
}) {
  const sections = buildCatalogSections(filteredTools, activeCategory, query);
  const selectedObjective = OBJECTIVE_BLOCKS.find(
    (item) => item.id === activeCategory,
  );

  return (
    <section className="space-y-4">
      <div className="glass rounded-[28px] border border-white/60 p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-[0.08em] text-cyan-700">
              Central de ferramentas
            </p>
            <h1 className="mt-2 font-['Sora'] text-2xl font-extrabold text-slate-950 md:text-3xl">
              Escolha pelo objetivo e chegue mais rapido no resultado
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-slate-600">
              Em vez de uma lista solta, agora voce pode entrar pela tarefa que
              quer resolver. Depois, a barra fixa ajuda a refinar a busca sem
              perder o contexto da pagina.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {OBJECTIVE_BLOCKS.map((objective) => {
            const objectiveTools = tools.filter(
              (tool) => tool.category === objective.id,
            );
            const topTools = objectiveTools.slice(0, 3);
            const isActive = activeCategory === objective.id;

            return (
              <button
                key={objective.id}
                type="button"
                onClick={() => onSelectCategory(objective.id)}
                className={`rounded-[24px] border p-4 text-left transition ${
                  isActive
                    ? "border-cyan-200 bg-cyan-50 shadow-lg shadow-cyan-500/8"
                    : "border-slate-200 bg-white/88 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-white"
                }`}
              >
                <div
                  className={`inline-flex rounded-full bg-linear-to-r ${objective.accent} px-3 py-1.5 text-xs font-semibold text-white`}
                >
                  {objective.title}
                </div>

                <p className="mt-3 text-[14px] leading-6 text-slate-600">
                  {objective.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {topTools.map((tool) => (
                    <span
                      key={tool.id}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                    >
                      {tool.name}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-900">
                    {objectiveTools.length} ferramenta(s)
                  </span>
                  <span className="text-sm font-medium text-cyan-700">
                    Abrir
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sticky top-3 z-30">
        <div className="glass-strong rounded-[26px] border border-white/80 px-4 py-4 shadow-[0_18px_40px_rgba(15,68,98,0.14)]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative block flex-1">
                <span className="sr-only">Buscar ferramenta</span>
                <span className="pointer-events-none absolute left-4 top-4 text-sm font-semibold text-slate-400">
                  Buscar
                </span>
                <input
                  ref={searchInputRef}
                  className="w-full rounded-[20px] border border-white/70 bg-white/92 px-4 pb-3 pt-9 text-[15px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  placeholder="Ex.: consultar CEP, gerar nickname, formatar JSON..."
                  value={query}
                  onChange={(event) => onChangeQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && filteredTools[0]) {
                      event.preventDefault();
                      onSelectTool(filteredTools[0].slug);
                    }
                  }}
                />
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-white/92 px-3 py-1.5 text-sm font-medium text-slate-600">
                  {filteredTools.length} resultado(s)
                </span>
                <span className="rounded-full border border-slate-200 bg-white/92 px-3 py-1.5 text-sm font-medium text-slate-600">
                  {selectedObjective?.title || "Todas as ferramentas"}
                </span>
                {(query || activeCategory !== "todas") && (
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white/92 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
                    onClick={onClearFilters}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>

            <div className="scroll-soft flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => {
                const isActive = activeCategory === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onSelectCategory(category.id)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
                    }`}
                  >
                    {category.label} ({getCategoryCount(tools, category.id)})
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/80 bg-white/88 px-3 py-1.5 text-xs font-medium text-slate-600">
                Dica: pressione `/` ou `Ctrl+K` para focar na busca
              </span>
              <span className="rounded-full border border-white/80 bg-white/88 px-3 py-1.5 text-xs font-medium text-slate-600">
                Role a pagina que esta barra continua com voce
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-[28px] border border-white/60 p-4 md:p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">
              Atalhos mais usados
            </p>
            <p className="text-[13px] leading-5 text-slate-600">
              Se voce quer ir direto ao ponto, comece por uma dessas.
            </p>
          </div>
        </div>

        <div className="scroll-soft mt-3 flex gap-2 overflow-x-auto pb-1">
          {quickTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool.slug)}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
            >
              {tool.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className="glass rounded-[28px] border border-white/60 p-4 md:p-5"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">
                  {section.title}
                </h2>
                <p className="mt-1 text-[14px] leading-6 text-slate-600">
                  {section.description}
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white/92 px-3 py-1.5 text-sm font-medium text-slate-600">
                {section.tools.length} ferramenta(s)
              </span>
            </div>

            <div className="catalog-scroll scroll-soft mt-4 grid gap-3 pr-1 md:grid-cols-2 2xl:grid-cols-3">
              {section.tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} onSelect={onSelectTool} />
              ))}
            </div>
          </div>
        ))}

        {!filteredTools.length ? (
          <div className="glass rounded-[28px] border border-white/60 p-5 text-[14px] leading-6 text-slate-600">
            Nenhuma ferramenta apareceu com esse filtro. Tente procurar por uma
            tarefa mais simples, como "CEP", "JSON" ou "senha", ou volte para
            a categoria "Todas".
          </div>
        ) : null}
      </div>
    </section>
  );
}
