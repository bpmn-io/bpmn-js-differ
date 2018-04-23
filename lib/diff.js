import Differ from './differ';

export default function diff(a, b, handler) {
  return new Differ().diff(a, b, handler);
}