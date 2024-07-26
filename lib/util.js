/**
 * @typedef { any } ModdleElement
 */

/**
 * @param {ModdleElement} element
 * @param {string} type
 *
 * @return {boolean}
 */
export function is(element, type) {
  return element.$instanceOf(type);
}

/**
 * @param {ModdleElement} element
 * @param {string[]} types
 *
 * @return {boolean}
 */
export function isAny(element, types) {
  return types.some(function(t) {
    return is(element, t);
  });
}