import { expect, test } from 'tstyche';
import {
  Collection,
  List,
  Map,
  OrderedMap,
  OrderedSet,
  Range,
  Seq,
  Set,
  Stack,
} from 'immutable';

test('indexed collections chunk into Lists', () => {
  expect(Range(0, 7).chunk(3)).type.toBe<Seq.Indexed<List<number>>>();

  expect(List.of(1, 2, 3).chunk(2)).type.toBe<Seq.Indexed<List<number>>>();

  expect(Stack.of(1, 2, 3).chunk(2)).type.toBe<Seq.Indexed<List<number>>>();

  expect(Collection.Indexed([1, 2, 3]).chunk(2)).type.toBe<
    Seq.Indexed<List<number>>
  >();

  expect(Seq.Indexed(['a', 'b']).chunk(1)).type.toBe<
    Seq.Indexed<List<string>>
  >();
});

test('set collections chunk into Lists', () => {
  expect(Set.of(1, 2, 3).chunk(2)).type.toBe<Seq.Indexed<List<number>>>();

  expect(OrderedSet.of(1, 2, 3).chunk(2)).type.toBe<
    Seq.Indexed<List<number>>
  >();

  expect(Collection.Set([1, 2, 3]).chunk(2)).type.toBe<
    Seq.Indexed<List<number>>
  >();

  expect(Seq.Set(['a']).chunk(1)).type.toBe<Seq.Indexed<List<string>>>();
});

test('keyed collections chunk into OrderedMaps', () => {
  expect(Map<string, number>({ a: 1, b: 2 }).chunk(1)).type.toBe<
    Seq.Indexed<OrderedMap<string, number>>
  >();

  expect(
    OrderedMap<string, number>([
      ['a', 1],
      ['b', 2],
    ]).chunk(1)
  ).type.toBe<Seq.Indexed<OrderedMap<string, number>>>();

  expect(Collection.Keyed<string, number>([['a', 1]]).chunk(1)).type.toBe<
    Seq.Indexed<OrderedMap<string, number>>
  >();

  expect(Seq.Keyed({ a: 'x' }).chunk(1)).type.toBe<
    Seq.Indexed<OrderedMap<string, string>>
  >();
});

test('chunks keep chaining as a Seq.Indexed', () => {
  const chunks = Range(0, 7).chunk(3);
  expect(chunks.reverse()).type.toBe<Seq.Indexed<List<number>>>();
  expect(chunks.take(2)).type.toBe<Seq.Indexed<List<number>>>();
  expect(chunks.map(chunk => chunk.get(0, 0))).type.toBe<Seq.Indexed<number>>();
  expect(chunks.filter(chunk => chunk.size === 3)).type.toBe<
    Seq.Indexed<List<number>>
  >();
  expect(chunks.get(0)).type.toBe<List<number> | undefined>();
});
