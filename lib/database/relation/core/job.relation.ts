export const jobRelations = (r: any) => ({
  jobsTable: {
    site: r.one.sitesTable({
      from: r.jobsTable.siteId,
      to: r.sitesTable.id,
    }),
    applications: r.many.applicationsTable(),
  },
});
