export const categoryRelations = (r: any) => ({
  categoriesTable: {
    site: r.one.sitesTable({
      from: r.categoriesTable.siteId,
      to: r.sitesTable.id,
    }),
    posts: r.many.postsTable(),
  },
});
