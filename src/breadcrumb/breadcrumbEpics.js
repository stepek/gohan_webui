import {Observable} from 'rxjs';
import {combineEpics} from 'redux-observable';

import {
  get,
  parseXHRError
} from './../api/index';

import {UPDATE} from './breadcrumbActionTypes.js';
import {
  updateFulfilled,
  updateFailure,
} from './breadcrumbActions.js';

export const updateBreadcrumb = (action$, store, call = (fn, ...args) => fn(...args)) => action$.ofType(UPDATE)
  .mergeMap(({data: elements}) => {
    const state = store.getState();
    const query = '?_fields=id&_fields=name';
    const headers = {
      'Content-Type': 'application/json',
      'X-Auth-Token': state.authReducer.tokenId,
    };

    if (!elements) {
      return Observable.of(updateFulfilled([]));
    }

    const elementsWithoutTitle = elements
      .map((element, index) => ({...element, index}))
      .filter(element => !element.title);

    if (elementsWithoutTitle.length === 0) {
      return Observable.of(updateFulfilled(elements));
    }

    return Observable.zip(
      ...elementsWithoutTitle.map(
        element => call(
          (url, headers) => get(url, headers),
          `${state.configReducer.gohan.url}${element.requestUrl}${query}`,
          headers,
        )
      )
    ).map(responseArray => {
      const updatedElements = responseArray.reduce((result, item, index) => {
        result[elementsWithoutTitle[index].index] = {
          title: item.response[elementsWithoutTitle[index].singular].name,
          url: elementsWithoutTitle[index].url,
        };
        return result;
      }, {});

      return updateFulfilled([
        ...elements.map((element, index) => (updatedElements[index] !== undefined) ? updatedElements[index] : element)
      ]);
    }).catch(error => {
      console.error(error);
      return Observable.of(updateFailure(parseXHRError(error)));
  });
});

export default combineEpics(
  updateBreadcrumb,
);