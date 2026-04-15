export function getCategoryCount(tools, categoryId) {
  if (categoryId === "todas") {
    return tools.length;
  }

  return tools.filter((tool) => tool.category === categoryId).length;
}

export function getToolSearchScore(tool, normalizedQuery) {
  let score = 0;

  if (normalizedQuery) {
    const name = tool.name.toLowerCase();
    const badge = tool.badge.toLowerCase();
    const description = tool.description.toLowerCase();
    const slug = tool.slug.toLowerCase();
    const tags = tool.tags.map((tag) => tag.toLowerCase());

    if (name === normalizedQuery) {
      score += 240;
    }

    if (slug === normalizedQuery) {
      score += 200;
    }

    if (tags.includes(normalizedQuery)) {
      score += 180;
    }

    if (name.startsWith(normalizedQuery)) {
      score += 120;
    }

    if (badge.includes(normalizedQuery)) {
      score += 80;
    }

    if (name.includes(normalizedQuery)) {
      score += 70;
    }

    if (tags.some((tag) => tag.includes(normalizedQuery))) {
      score += 60;
    }

    if (description.includes(normalizedQuery)) {
      score += 30;
    }
  }

  if (tool.isQuickAccess) {
    score += 18;
  }

  if (tool.isFeaturedNew) {
    score += 12;
  }

  return score;
}

export function getFilteredTools(tools, filters) {
  const { activeCategory, deferredQuery } = filters;
  const normalizedQuery = deferredQuery.trim().toLowerCase().replace(/^#/, "");
  const hasInteractiveFilters = normalizedQuery.length > 0;

  return tools
    .map((tool, index) => {
      const matchesCategory =
        activeCategory === "todas" || tool.category === activeCategory;
      const haystack =
        `${tool.name} ${tool.description} ${tool.badge} ${tool.tags.join(" ")}`.toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 || haystack.includes(normalizedQuery);

      return {
        tool,
        index,
        matches: matchesCategory && matchesQuery,
        score: getToolSearchScore(tool, normalizedQuery),
      };
    })
    .filter((entry) => entry.matches)
    .sort((left, right) => {
      if (!hasInteractiveFilters) {
        return left.index - right.index;
      }

      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.index - right.index;
    })
    .map((entry) => entry.tool);
}
