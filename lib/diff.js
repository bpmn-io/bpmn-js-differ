import Differ from './differ.js';

export default function diff(a, b, handler) {
  return new Differ().diff(a, b, handler);
}