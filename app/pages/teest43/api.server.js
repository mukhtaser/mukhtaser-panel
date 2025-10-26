import { app } from '../../_server/app';

const controller = app.defineTableController({
  // Add your customizations for the table here.
  // Learn more: https://kottster.app/docs/table/configuration/api

  customDataFetcher: async () => {
    // Fetch data for the table using custom logic
    return {
      records: [],
      total: 0
    };
  },
});

export default controller;