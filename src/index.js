import { of, fromEvent } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import {
    catchError,
    debounceTime,
    filter,
    map,
    pairwise,
    pluck,
    startWith,
    switchMap
} from 'rxjs/operators';

const EMPTY_MESSAGE = 'Start by typing your search term in the input';

const searchEl = document.getElementById('Search');

const result = document.getElementById('Result');
result.innerText = EMPTY_MESSAGE;

fromEvent(searchEl, 'keyup')
    .pipe(
        debounceTime(500),
        pluck('target', 'value'),
        startWith(''),
        pairwise(),
        map(([prevValue, currValue]) => [prevValue.trim(), currValue.trim()]),
        filter(([prevValue, currValue]) => prevValue !== currValue),
        switchMap(([_, value]) => {
            return fromFetch(
                `https://en.wikipedia.org/w/api.php?origin=*&format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${value}`
            );
        }),
        switchMap(response => {
            if (response.ok) {
                return response.json();
            }
            return of({
                error: true,
                message: `Error ${response.status}`
            });
        }),
        catchError(err => {
            // Network or other error, handle appropriately
            return of({ error: true, message: err.message });
        })
    )
    .subscribe(response => {
        if (response.error) {
            result.innerText = response.message;
        } else if (response.query) {
            result.innerText =
                Object.values(response.query.pages)[0].extract || 'No result';
        } else {
            result.innerText = EMPTY_MESSAGE;
        }
    });
