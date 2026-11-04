export const postRelations = (r: any) => ({
  postsTable: {
    site: r.one.sitesTable({
      from: r.postsTable.siteId,
      to: r.sitesTable.id,
    }),
    category: r.one.categoriesTable({
      from: r.postsTable.categoryId,
      to: r.categoriesTable.id,
    }),
  },
});
