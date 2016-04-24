/* global rdf:false */

'use strict';

var
  fs = require('fs'),
  path = require('path');


var endpointUrl = 'http://localhost:8890/sparql';
var port = 8888;

var buildQuery = function (iri) {
  iri = iri.replace(':' + port, '');
  return 'CONSTRUCT {<' + iri + '> ?p ?o} WHERE {<' + iri + '> ?p ?o}';
};

var buildExistsQuery = function (iri) {
  iri = iri.replace(':' + port, '');
  return 'ASK { GRAPH ?g { <' + iri + '> ?p ?o }}';
};

var patchResponseHeaders = function (res, headers) {
  if (res.statusCode === 200) {
    // clean existings values
    var fieldList = [
      'Access-Control-Allow-Origin',
      'Cache-Control',
      'Fuseki-Request-ID',
      'Server',
      'Vary'];

    if (res._headers) {
      fieldList.forEach(function (field) {
        if (field in res._headers) {
          delete res._headers[field];
        }

        if (field.toLowerCase() in res._headers) {
          delete res._headers[field.toLowerCase()];
        }
      });
    }

    // cors header
    headers['Access-Control-Allow-Origin'] = '*';

    // cache header
    headers['Cache-Control'] = 'public, max-age=120';

    // vary header
    headers['Vary'] = 'Accept';
  }

  return headers;
};

module.exports = {
  app: 'trifid-ld',
  hostname: 'voldemort.exascale.info',
  port: '',
  logger: {
    level: 'debug'
  },
  listener: {
    hostname: 'localhost',
    port: port
  },
  expressSettings: {
    'trust proxy': 'loopback',
    'x-powered-by': null
  },
  patchHeaders: {
    patchResponse: patchResponseHeaders
  },
  sparqlProxy: {
    path: '/sparql',
    options: {
      endpointUrl: endpointUrl
    }
  },
  sparqlSearch: {
    path: '/query',
    options: {
      endpointUrl: endpointUrl,
      resultsPerPage: 10,
      queryTemplate: fs.readFileSync(path.join(__dirname, 'data/sparql/search.sparql')).toString(),
      variables: {
        'q': {
          variable: '%searchstring%',
          type: 'Raw', // can be Literal, NamedNode or Raw. Defaults to Literal
          required: true
        }
      }
    }
  },
  HandlerClass: require('./lib/sparql-handler'),
  handlerOptions: {
    endpointUrl: endpointUrl,
    buildQuery: buildQuery,
    buildExistsQuery: buildExistsQuery
  }
};
