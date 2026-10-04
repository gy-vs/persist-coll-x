import {
  List,
  Map,
  OrderedMap,
  OrderedSet,
  Range,
  Seq,
  Set,
  Stack,
} from 'immutable';

describe('chunk', () => {
  it('chunks indexed collections into Lists', () => {
    const chunks = Range(0, 7).chunk(3);
    expect(chunks.size).toBe(3);
    const materialized = chunks.toArray();
    expect(materialized).toEqual([List([0, 1, 2]), List([3, 4, 5]), List([6])]);
  });

  it('returns an empty chunked seq for empty collections', () => {
    const chunks = Range(0, 0).chunk(3);
    expect(chunks.size).toBe(0);
    expect(chunks.toArray()).toEqual([]);
  });

  it('chunks Lists', () => {
    const chunks = List([1, 2, 3, 4, 5]).chunk(2);
    expect(chunks.size).toBe(3);
    expect(chunks.toArray()).toEqual([List([1, 2]), List([3, 4]), List([5])]);
  });

  it('chunks Sets into Lists preserving iteration order', () => {
    const chunks = Set(['a', 'b', 'c']).chunk(2);
    const flat = chunks.flatMap(chunk => chunk);
    expect(flat.toArray()).toEqual(Set(['a', 'b', 'c']).toArray());
    chunks.forEach(chunk => {
      expect(List.isList(chunk)).toBe(true);
    });
  });

  it('chunks SetSeqs and OrderedSets into Lists', () => {
    const seqChunks = Seq.Set([1, 2, 3, 4]).chunk(2);
    expect(seqChunks.toArray()).toEqual([List([1, 2]), List([3, 4])]);
    expect(List.isList(OrderedSet([1, 2, 3]).chunk(2).first())).toBe(true);
  });

  it('chunks lazy keyed seqs from generators into ordered keyed chunks', () => {
    function* entries() {
      yield ['a', 1] as [string, number];
      yield ['b', 2] as [string, number];
      yield ['c', 3] as [string, number];
    }
    const chunks = Seq(entries()).fromEntrySeq().chunk(2);
    expect(chunks.size).toBe(undefined);
    expect(chunks.toArray()).toEqual([
      OrderedMap({ a: 1, b: 2 }),
      OrderedMap({ c: 3 }),
    ]);
  });

  it('chunks keyed collections into ordered keyed chunks', () => {
    const chunks = OrderedMap({ a: 1, b: 2, c: 3, d: 4 }).chunk(2);
    expect(chunks.size).toBe(2);
    const materialized = chunks.toArray();
    expect(materialized).toEqual([
      OrderedMap({ a: 1, b: 2 }),
      OrderedMap({ c: 3, d: 4 }),
    ]);
    materialized.forEach(chunk => {
      expect(OrderedMap.isOrderedMap(chunk)).toBe(true);
    });
  });

  it('keeps keys and values in the original traversal order for OrderedMap', () => {
    const source = OrderedMap({ a: 1, b: 2, c: 3, d: 4, e: 5 });
    const chunks = source.chunk(2);
    expect(chunks.get(0).entrySeq().toArray()).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
    expect(chunks.get(1).entrySeq().toArray()).toEqual([
      ['c', 3],
      ['d', 4],
    ]);
    expect(chunks.get(2).entrySeq().toArray()).toEqual([['e', 5]]);
  });

  it('chunks Maps into ordered keyed chunks following Map iteration', () => {
    const source = Map({ a: 1, b: 2, c: 3, d: 4 });
    const chunks = source.chunk(2);
    const flat = chunks.flatMap(chunk => chunk.entrySeq());
    expect(flat.toArray()).toEqual(source.entrySeq().toArray());
  });

  it('throws a RangeError for non-positive, fractional, NaN and Infinity size', () => {
    expect(() => Range(0, 7).chunk(0)).toThrow(RangeError);
    expect(() => Range(0, 7).chunk(-1)).toThrow(RangeError);
    expect(() => Range(0, 7).chunk(2.5)).toThrow(RangeError);
    expect(() => Range(0, 7).chunk(NaN)).toThrow(RangeError);
    expect(() => Range(0, 7).chunk(Infinity)).toThrow(RangeError);
  });

  it('accepts positive integers beyond 32 bits', () => {
    expect(
      Range(0, 7)
        .chunk(2 ** 32)
        .toArray()
    ).toEqual([List([0, 1, 2, 3, 4, 5, 6])]);
  });

  it('is lazy: taking the first chunks does not consume the whole source', () => {
    let consumed = 0;
    const source = Range(0, Infinity).map(x => {
      consumed++;
      return x;
    });
    const chunks = source.chunk(3).take(2);
    expect(chunks.toArray()).toEqual([List([0, 1, 2]), List([3, 4, 5])]);
    expect(consumed).toBe(6);
  });

  it('is lazy: Range(0, Infinity).chunk(3).take(2)', () => {
    const chunks = Range(0, Infinity).chunk(3).take(2);
    expect(chunks.size).toBe(2);
    expect(chunks.toArray()).toEqual([List([0, 1, 2]), List([3, 4, 5])]);
  });

  it('does not consume the source when the chunks are not iterated', () => {
    let consumed = 0;
    Range(0, Infinity)
      .map(x => {
        consumed++;
        return x;
      })
      .chunk(3);
    expect(consumed).toBe(0);
  });

  it('reports an undefined size when the source size is unknown', () => {
    function* gen() {
      yield* [1, 2, 3, 4, 5, 6, 7];
    }
    const chunks = Seq(gen()).chunk(3);
    expect(chunks.size).toBe(undefined);
    expect(chunks.toArray()).toEqual([
      List([1, 2, 3]),
      List([4, 5, 6]),
      List([7]),
    ]);
  });

  it('reports Infinity chunks for an infinite source', () => {
    expect(Range(0, Infinity).chunk(3).size).toBe(Infinity);
  });

  it('supports lazy filter and map before chunking', () => {
    const chunks = Range(0, 10)
      .filter(x => x % 2 === 0)
      .map(x => x * 10)
      .chunk(2);
    expect(chunks.size).toBe(undefined);
    expect(chunks.toArray()).toEqual([
      List([0, 20]),
      List([40, 60]),
      List([80]),
    ]);
  });

  it('reverses chunk order while keeping each chunk in original order', () => {
    const chunks = Range(0, 7).chunk(3).reverse();
    expect(chunks.toArray()).toEqual([
      List([6]),
      List([3, 4, 5]),
      List([0, 1, 2]),
    ]);
  });

  it('reverses keyed chunks while keeping each chunk ordered', () => {
    const chunks = OrderedMap({ a: 1, b: 2, c: 3, d: 4, e: 5 })
      .chunk(2)
      .reverse();
    expect(chunks.toArray()).toEqual([
      OrderedMap({ e: 5 }),
      OrderedMap({ c: 3, d: 4 }),
      OrderedMap({ a: 1, b: 2 }),
    ]);
  });

  it('reverses without consuming more than the requested chunks lazily', () => {
    let consumed = 0;
    const chunks = Range(0, 12)
      .map(x => {
        consumed++;
        return x;
      })
      .chunk(3)
      .reverse()
      .take(1);
    expect(chunks.toArray()).toEqual([List([9, 10, 11])]);
    expect(consumed).toBe(3);
  });

  it('reverse iteration only consumes the requested chunks', () => {
    let consumed = 0;
    const iterator = Range(0, 12)
      .map(x => {
        consumed++;
        return x;
      })
      .chunk(3)
      .reverse()
      .values();
    expect(iterator.next().value).toEqual(List([9, 10, 11]));
    expect(consumed).toBe(3);
    expect(iterator.next().value).toEqual(List([6, 7, 8]));
    expect(consumed).toBe(6);
  });

  it('supports take, filter and further chaining', () => {
    const chunks = Range(0, 12)
      .chunk(4)
      .filter(chunk => chunk.first() !== 4)
      .take(1);
    expect(chunks.toArray()).toEqual([List([0, 1, 2, 3])]);
  });

  it('chunks exact multiples without an empty trailing chunk', () => {
    expect(Range(0, 9).chunk(3).size).toBe(3);
    expect(Range(0, 9).chunk(3).toArray()).toEqual([
      List([0, 1, 2]),
      List([3, 4, 5]),
      List([6, 7, 8]),
    ]);
  });

  it('can be iterated as an iterator', () => {
    const iterator = Range(0, 4).chunk(2).values();
    expect(iterator.next()).toEqual({ value: List([0, 1]), done: false });
    expect(iterator.next()).toEqual({ value: List([2, 3]), done: false });
    expect(iterator.next()).toEqual({ value: undefined, done: true });
  });

  it('works with other concrete collections', () => {
    expect(Stack([1, 2, 3, 4]).chunk(2).size).toBe(2);
    expect(Seq([1, 2, 3]).chunk(1).toArray()).toEqual([
      List([1]),
      List([2]),
      List([3]),
    ]);
  });

  it('supports cacheResult', () => {
    let consumed = 0;
    const chunks = Range(0, 7)
      .map(x => {
        consumed++;
        return x;
      })
      .chunk(3)
      .cacheResult();
    expect(chunks.size).toBe(3);
    expect(consumed).toBe(7);
    chunks.toArray();
    chunks.toArray();
    expect(consumed).toBe(7);
  });
});
