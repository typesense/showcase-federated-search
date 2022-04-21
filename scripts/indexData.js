require('dotenv').config();

const { faker } = require('@faker-js/faker');

const Typesense = require('typesense');

async function addRecordsToTypesense(records, typesense, collectionName) {
  try {
    const returnData = await typesense
      .collections(collectionName)
      .documents()
      .import(records);

    const failedItems = returnData.filter((item) => item.success === false);
    if (failedItems.length > 0) {
      throw new Error(
        `Error indexing items ${JSON.stringify(failedItems, null, 2)}`
      );
    }

    return returnData;
  } catch (error) {
    console.log(error);
  }
}

module.exports = (async () => {
  const typesense = new Typesense.Client({
    nodes: [
      {
        host: process.env.TYPESENSE_HOST,
        port: process.env.TYPESENSE_PORT,
        protocol: process.env.TYPESENSE_PROTOCOL,
      },
    ],
    apiKey: process.env.TYPESENSE_ADMIN_API_KEY,
  });

  // Add usernames
  const usersSchema = {
    name: 'federated_search_users',
    fields: [{ name: 'username', type: 'string' }],
    token_separators: ['+', '-', '@', '.', '_'],
  };

  console.log('Creating users schema... ');
  try {
    await typesense.collections(usersSchema.name).delete();
  } catch (e) {
    console.log(e);
  }
  await typesense.collections().create(usersSchema);

  console.log('Adding users records...');
  const usernames = [...Array(10000)].map(() => {
    return {
      username: faker.internet.userName(),
    };
  });
  await addRecordsToTypesense(usernames, typesense, 'federated_search_users');

  // Add company names
  const companySchema = {
    name: 'federated_search_companies',
    fields: [{ name: 'name', type: 'string' }],
  };

  console.log('Creating companies schema... ');
  try {
    await typesense.collections(companySchema.name).delete();
  } catch (e) {
    console.log(e);
  }
  await typesense.collections().create(companySchema);

  console.log('Adding company records...');
  const companyNames = [...Array(10000)].map(() => {
    return {
      name: faker.company.companyName(),
    };
  });
  await addRecordsToTypesense(
    companyNames,
    typesense,
    'federated_search_companies'
  );
})();
