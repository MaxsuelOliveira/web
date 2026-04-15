import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import categories from "../../modules/catalog/categories";
import tools, { quickAccessTools } from "../../modules/catalog/tools";
import Footer from "./Footer";
import CatalogPanel from "./app-shell/CatalogPanel";
import WorkspacePanel from "./app-shell/WorkspacePanel";
import { getFilteredTools } from "./app-shell/catalogUtils";

export default function AppShell() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("todas");
  const searchInputRef = useRef(null);
  const deferredQuery = useDeferredValue(query);

  const filteredTools = useMemo(
    () =>
      getFilteredTools(tools, {
        activeCategory,
        deferredQuery,
      }),
    [activeCategory, deferredQuery],
  );

  const activeTool = tools.find((tool) => tool.slug === slug) ?? null;
  const previewTool = activeTool ?? filteredTools[0] ?? tools[0];
  const activeCategoryLabel =
    categories.find((category) => category.id === previewTool.category)?.label ??
    "Todas";
  const isWorkspaceMode = Boolean(activeTool);

  const quickTools = useMemo(() => quickAccessTools.slice(0, 6), []);

  useEffect(() => {
    function handleSearchShortcut(event) {
      const target = event.target;
      const isTypingTarget =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (isTypingTarget && !(event.ctrlKey && event.key.toLowerCase() === "k")) {
        return;
      }

      if (event.key === "/" || (event.ctrlKey && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    }

    window.addEventListener("keydown", handleSearchShortcut);

    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  function handleSelectTool(nextSlug) {
    navigate(`/ferramenta/${nextSlug}`);
  }

  function handleSelectCategory(nextCategory) {
    setActiveCategory(nextCategory);
  }

  function handleClearFilters() {
    setQuery("");
    setActiveCategory("todas");
  }

  function handleBackToCatalog() {
    navigate("/");
  }

  return (
    <div className="relative min-h-screen">
      <div className="app-orb app-orb-primary" />
      <div className="app-orb app-orb-secondary" />
      <div className="app-orb app-orb-tertiary" />

      <div className="relative flex min-h-screen flex-col">
        <div className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col px-3 py-3 md:px-4 lg:px-6">
          <div className="flex flex-1 flex-col gap-4">
            <main className="min-w-0 space-y-4">
              {!isWorkspaceMode ? (
                <CatalogPanel
                  tools={tools}
                  categories={categories}
                  activeCategory={activeCategory}
                  query={query}
                  filteredTools={filteredTools}
                  quickTools={quickTools}
                  searchInputRef={searchInputRef}
                  onSelectCategory={handleSelectCategory}
                  onSelectTool={handleSelectTool}
                  onChangeQuery={setQuery}
                  onClearFilters={handleClearFilters}
                />
              ) : null}

              {isWorkspaceMode ? (
                <WorkspacePanel
                  activeTool={activeTool}
                  activeCategoryLabel={activeCategoryLabel}
                  onBackToCatalog={handleBackToCatalog}
                />
              ) : null}
            </main>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
