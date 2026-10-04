import { expect, test } from 'tstyche';
import { Collection, List, Map, OrderedMap, Range, Seq, Set } from 'immutable';

test('Collection.Indexed#chunk', () => {
  expect(Range(0, 7).chunk(3)).type.toBe<Seq.Indexed<List<number>>>();
  expect(List(['a', 'b']).chunk(1)).type.toBe<Seq.Indexed<List<string>>>();
});

test('Collection.Set#chunk', () => {
  expect(Set([1, 2]).chunk(1)).type.toBe<Seq.Indexed<List<number>>>();
  expect(Seq.Set([1, 2]).chunk(1)).type.toBe<Seq.Indexed<List<number>>>();
});

test('Collection.Keyed#chunk', () => {
  const map: Map<string, number> = Map({ a: 1 });
  const ordered: OrderedMap<string, number> = OrderedMap({ a: 1 });
  expect(map.chunk(1)).type.toBe<Seq.Indexed<OrderedMap<string, number>>>();
  expect(ordered.chunk(1)).type.toBe<Seq.Indexed<OrderedMap<string, number>>>();
  expect(Seq.Keyed<string, number>([['a', 1]]).chunk(1)).type.toBe<
    Seq.Indexed<OrderedMap<string, number>>
  >();
});

test('Collection#chunk on subtype references', () => {
  const indexed: Collection.Indexed<number> = Collection([1, 2]);
  const keyed: Collection.Keyed<string, number> = Collection({ a: 1 });
  const set: Collection.Set<number> = Collection.Set([1, 2]);
  expect(indexed.chunk(2)).type.toBe<Seq.Indexed<List<number>>>();
  expect(keyed.chunk(2)).type.toBe<Seq.Indexed<OrderedMap<string, number>>>();
  expect(set.chunk(2)).type.toBe<Seq.Indexed<List<number>>>();
});

test('chunked Seqs stay chained', () => {
  expect(Range(0, 7).chunk(3).take(2)).type.toBe<Seq.Indexed<List<number>>>();
  expect(Range(0, 7).chunk(3).reverse()).type.toBe<Seq.Indexed<List<number>>>();
  expect(
    Range(0, 7)
      .chunk(3)
      .filter(chunk => chunk.size === 3)
  ).type.toBe<Seq.Indexed<List<number>>>();
});

test('chunk requires a number argument', () => {
  expect(Range(0, 7).chunk).type.toBe<
    (size: number) => Seq.Indexed<List<number>>
  >();
});
