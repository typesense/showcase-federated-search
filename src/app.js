import jQuery from 'jquery';

window.$ = jQuery; // workaround for https://github.com/parcel-bundler/parcel/issues/333

import 'popper.js';
import 'bootstrap';

import instantsearch from 'instantsearch.js/es';
import {
  searchBox,
  infiniteHits,
  configure,
  stats,
  index,
} from 'instantsearch.js/es/widgets';
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import images from '../images/*.*';

let TYPESENSE_SERVER_CONFIG = {
  apiKey: process.env.TYPESENSE_SEARCH_ONLY_API_KEY, // Be sure to use an API key that only allows searches, in production
  nodes: [
    {
      host: process.env.TYPESENSE_HOST,
      port: process.env.TYPESENSE_PORT,
      protocol: process.env.TYPESENSE_PROTOCOL,
    },
  ],
  numRetries: 8,
  useServerSideSearchCache: true,
};

// [2, 3].forEach(i => {
//   if (process.env[`TYPESENSE_HOST_${i}`]) {
//     TYPESENSE_SERVER_CONFIG.nodes.push({
//       host: process.env[`TYPESENSE_HOST_${i}`],
//       port: process.env.TYPESENSE_PORT,
//       protocol: process.env.TYPESENSE_PROTOCOL,
//     });
//   }
// });

// Unfortunately, dynamic process.env keys don't work with parcel.js
// So need to enumerate each key one by one

if (process.env[`TYPESENSE_HOST_2`]) {
  TYPESENSE_SERVER_CONFIG.nodes.push({
    host: process.env[`TYPESENSE_HOST_2`],
    port: process.env.TYPESENSE_PORT,
    protocol: process.env.TYPESENSE_PROTOCOL,
  });
}

if (process.env[`TYPESENSE_HOST_3`]) {
  TYPESENSE_SERVER_CONFIG.nodes.push({
    host: process.env[`TYPESENSE_HOST_3`],
    port: process.env.TYPESENSE_PORT,
    protocol: process.env.TYPESENSE_PROTOCOL,
  });
}

if (process.env[`TYPESENSE_HOST_NEAREST`]) {
  TYPESENSE_SERVER_CONFIG['nearestNode'] = {
    host: process.env[`TYPESENSE_HOST_NEAREST`],
    port: process.env.TYPESENSE_PORT,
    protocol: process.env.TYPESENSE_PROTOCOL,
  };
}

const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: TYPESENSE_SERVER_CONFIG,
  // The following parameters are directly passed to Typesense's search API endpoint.
  //  So you can pass any parameters supported by the search endpoint below.
  //  queryBy is required.
  collectionSpecificSearchParameters: {
    federated_search_companies: {
      query_by: 'name',
    },
    federated_search_users: {
      query_by: 'username',
    },
  },
});
const searchClient = typesenseInstantsearchAdapter.searchClient;

const search = instantsearch({
  searchClient,
  indexName: 'federated_search_users',
  searchFunction(helper) {
    if (helper.state.query === '') {
      $('#results-section').addClass('d-none');
    } else {
      $('#results-section').removeClass('d-none');
      helper.search();
    }
  },
});

search.addWidgets([
  searchBox({
    container: '#searchbox',
    showSubmit: false,
    showReset: false,
    placeholder: 'type in a search term... ',
    autofocus: true,
    cssClasses: {
      input: 'form-control',
      loadingIcon: 'stroke-primary',
    },
  }),
  index({ indexName: 'federated_search_users' }).addWidgets([
    stats({
      container: '#stats-users',
      templates: {
        text: ({ nbHits, hasNoResults, hasOneResult, processingTimeMS }) => {
          let statsText = '';
          if (hasNoResults) {
            statsText = 'No usernames';
          } else if (hasOneResult) {
            statsText = '1 username';
          } else {
            statsText = `${nbHits.toLocaleString()} usernames`;
          }
          return `Found ${statsText} in ${processingTimeMS}ms.`;
        },
      },
    }),
    infiniteHits({
      container: '#hits-users',
      cssClasses: {
        list: 'list-unstyled',
        item: 'd-flex flex-column search-result-card',
        loadMore: 'btn btn-secondary d-block mt-4',
        disabledLoadMore: 'btn btn-light mx-auto d-block mt-4',
      },
      templates: {
        item: (data) => {
          return `
            <div class="row">
              <div class="col">
                ${data._highlightResult.username.value}
              </div>
            </div>
        `;
        },
        empty:
          'No usernames found for <q>{{ query }}</q>. Try another search term.',
        showMoreText: 'Show more usernames',
      },
    }),
    configure({
      hitsPerPage: 5,
    }),
  ]),

  index({ indexName: 'federated_search_companies' }).addWidgets([
    stats({
      container: '#stats-companies',
      templates: {
        text: ({ nbHits, hasNoResults, hasOneResult, processingTimeMS }) => {
          let statsText = '';
          if (hasNoResults) {
            statsText = 'No companies';
          } else if (hasOneResult) {
            statsText = '1 company';
          } else {
            statsText = `${nbHits.toLocaleString()} companies`;
          }
          return `Found ${statsText} in ${processingTimeMS}ms.`;
        },
      },
    }),
    infiniteHits({
      container: '#hits-companies',
      cssClasses: {
        list: 'list-unstyled',
        item: 'd-flex flex-column search-result-card',
        loadMore: 'btn btn-secondary d-block mt-4',
        disabledLoadMore: 'btn btn-light mx-auto d-block mt-4',
      },
      templates: {
        item: (data) => {
          return `
            <div class="row">
              <div class="col">
                ${data._highlightResult.name.value}
              </div>
            </div>
        `;
        },
        empty:
          'No companies found for <q>{{ query }}</q>. Try another search term.',
        showMoreText: 'Show more companies',
      },
    }),
    configure({
      hitsPerPage: 5,
    }),
  ]),
]);

search.start();

function handleSearchTermClick(event) {
  const $searchBox = $('#searchbox input[type=search]');
  search.helper.clearRefinements();
  $searchBox.val(event.currentTarget.textContent);
  $searchBox.trigger('change');
  search.helper.setQuery($searchBox.val()).search();
  return false;
}

$(async function () {
  // Handle example search terms
  $('.clickable-search-term').on('click', handleSearchTermClick);
});
