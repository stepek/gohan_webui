import {Router, history} from 'backbone';

/**
 * Class contains logic of router in application.
 * @class AppRouter
 * @extends Router
 */
export default class AppRouter extends Router {

  /**
   * Constructs the object.
   * @constructor
   * @override Router.constructor
   * @param options
   */
  constructor(options) {
    super(options);
    this.routes = [];
  }

  /**
   * Adds route to router.
   * @override Router.route
   * @param {string} route
   * @param {string} name
   * @param {!*} rest
   */
  route(route, name, ...rest) {
    this.routes.push({
      path: route,
      name
    });
    super.route(route, name, ...rest);
  }

  getQueryParams() {
    const params = {};
    const queryStrings = history.location.search.substr(1);

    if (queryStrings === '') {
      return params;
    }

    queryStrings.split('&').map(query => {
      const keyvalue = query.split('=');

      params[keyvalue[0].toString()] = keyvalue[1].toString();
    });

    return params;
  }

  /**
   * Returns status of path in router,
   * if is registered returns true, otherwise false.
   * @param param
   * @returns {boolean}
   */
  pathIsRegistered(param) {
    return this.routes.map(({path}) => path).includes(param);
  }
}
