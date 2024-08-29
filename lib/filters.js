import DiffContext from 'diffpatch/lib/contexts/diff.js';

/**
 * A filter that detects and marks `moddle` elements,
 * so we can later calculate change sets for them.
 *
 * @param {any} context
 */
export function moddleFilter(context) {

  if (context.left && context.left.$instanceOf) {
    context.leftType = 'moddle';
  }

  if (context.right && context.right.$instanceOf) {
    context.rightType = 'moddle';
  }
}

moddleFilter.filterName = 'moddle';


/**
 * A filter that creates a change set for a given context,
 * using `moddle` infrastructure to figure which changes
 * to actually diff.
 *
 * It ensures that we traverse all relevant relationships
 * and serializes references to prevent endless loops.
 *
 * This filter assumes we don't ever compare `moddle` elements
 * with plain objects.
 *
 * @param {any} context
 */
export function moddleDiffFilter(context) {
  if (context.leftIsArray || context.leftType !== 'moddle') {
    return;
  }

  const leftProperties = getModdleProperties(context.left);

  let property;
  let child;

  const propertyFilter = context.options.propertyFilter;

  if (context.left.$type !== context.right.$type) {
    child = new DiffContext(context.left.$type, context.right.$type);
    context.push(child, '$type');
  }

  for (property of leftProperties) {

    const { name, isVirtual, isMany, isReference } = property;

    if (isVirtual || (isMany && isReference)) {
      continue;
    }

    if (propertyFilter && !propertyFilter(name, context)) {
      continue;
    }

    child = new DiffContext(unref(context.left, name), unref(context.right, name));
    context.push(child, name);
  }

  const rightProperties = getModdleProperties(context.right);

  for (property of rightProperties) {

    const { name, isVirtual, isMany, isReference } = property;

    if (isVirtual || (isMany && isReference)) {
      continue;
    }

    if (propertyFilter && !propertyFilter(name, context)) {
      continue;
    }

    if (typeof context.left[name] === 'undefined') {
      child = new DiffContext(undefined, unref(context.right, name));
      context.push(child, name);
    }
  }

  if (!context.children || context.children.length === 0) {
    context.setResult(undefined).exit();
    return;
  }
  context.exit();
}

moddleDiffFilter.filterName = 'moddleDiff';


/**
 * Returns the ID to an external reference, or the actual
 * object for containment relationships.
 *
 * @param {ModdleElement} moddleElement
 * @param {string} propertyName
 *
 * @return {ModdleElement|string|any}
 */
function unref(moddleElement, propertyName) {

  const {
    isGeneric,
    idProperty,
    propertiesByName
  } = moddleElement.$descriptor;

  const value = moddleElement[propertyName];

  if (isGeneric) {
    return value;
  }

  const property = propertiesByName[propertyName];

  if (property && !property.isMany && property.isReference) {
    return value && idProperty && `#ref:${value.get(idProperty.name)}`;
  }

  return value;
}

/**
 * @param {ModdleElement} genericModdleElement
 *
 * @return {any[]}
 */
function createGenericProperties(genericModdleElement) {

  return Object.keys(genericModdleElement).flatMap(key => {
    return key !== '$type' ? { name: key } : [];
  });
}

/**
 * Returns the properties to iterate over when
 * diffing a particular moddle element.
 *
 * @param {ModdleElement} moddleElement
 *
 * @return {any[]}
 */
function getModdleProperties(moddleElement) {

  const {
    properties,
    isGeneric
  } = moddleElement.$descriptor;

  if (isGeneric) {
    return createGenericProperties(moddleElement);
  } else {
    return properties;
  }
}