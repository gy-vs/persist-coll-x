import {
  List,
  Map,
  OrderedMap,
  Range,
  Seq,
  Set,
  OrderedSet,
  Stack,
} from 'immutable';

describe('chunk', () => {
  it('chunks an indexed collection into Lists of at most the given size', () => {
    const chunks = Range(0, 7).chunk(3);
    expect(chunks.toJS()).toEqual([[0, 1, 2], [3, 4, 5], [6]]);
    chunks.forEach(chunk => expect(List.isList(chunk)).toBe(true));
  });

  it('is available on every kind of collection', () => {
    expect(List.of(1, 2, 3, 4).chunk(2).toJS()).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(
      Stack.of(1, 2, 3, 4)
        .chunk(3)
        .map(c => c.toArray())
        .toArray()
    ).toEqual([[1, 2, 3], [4]]);
    expect(OrderedSet.of(1, 2, 3, 4, 5).chunk(2).toJS()).toEqual([
      [1, 2],
      [3, 4],
      [5],
    ]);
    expect(Set.of(1, 2, 3).chunk(2).count()).toBe(2);
    const mapChunks = Map({ a: 1, b: 2, c: 3 }).chunk(2);
    expect(mapChunks.size).toBe(2);
    const rejoined = Map().asMutable();
    mapChunks.forEach(chunk => {
      expect(OrderedMap.isOrderedMap(chunk)).toBe(true);
      chunk.forEach((v, k) => rejoined.set(k, v));
    });
    expect(rejoined.asImmutable()).toEqual(Map({ a: 1, b: 2, c: 3 }));
  });

  it('chunks keyed collections into ordered keyed collections', () => {
    const chunks = OrderedMap({ a: 1, b: 2, c: 3, d: 4 }).chunk(2);
    expect(chunks.size).toBe(2);
    expect(chunks.get(0)).toEqual(OrderedMap({ a: 1, b: 2 }));
    expect(chunks.get(1)).toEqual(OrderedMap({ c: 3, d: 4 }));
    chunks.forEach((chunk, index) => {
      expect(OrderedMap.isOrderedMap(chunk)).toBe(true);
      expect(chunk.entrySeq().toArray()).toEqual(
        index === 0
          ? [
              ['a', 1],
              ['b', 2],
            ]
          : [
              ['c', 3],
              ['d', 4],
            ]
      );
    });
  });

  it('keys and values keep their pairing in keyed chunks', () => {
    const chunks = OrderedMap({ x: 10, y: 20, z: 30 }).chunk(2).toArray();
    expect(chunks[0].entrySeq().toArray()).toEqual([
      ['x', 10],
      ['y', 20],
    ]);
    expect(chunks[1].entrySeq().toArray()).toEqual([['z', 30]]);
  });

  it('produces an empty sequence for empty collections', () => {
    expect(Range(0, 0).chunk(3).size).toBe(0);
    expect(List().chunk(3).toArray()).toEqual([]);
    expect(Map().chunk(3).toArray()).toEqual([]);
  });

  it('supports a chunk size larger than the collection', () => {
    const chunks = Range(0, 2).chunk(5);
    expect(chunks.size).toBe(1);
    expect(chunks.get(0)).toEqual(List([0, 1]));
  });

  it('exactly divides when the size is a multiple', () => {
    const chunks = Range(0, 9).chunk(3);
    expect(chunks.size).toBe(3);
    expect(chunks.toJS()).toEqual([
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
    ]);
  });

  it('supports a chunk size of 1', () => {
    expect(
      Range(0, 3)
        .chunk(1)
        .map(c => c.first())
        .toArray()
    ).toEqual([0, 1, 2]);
  });

  it('reports the resulting size when the source size is known', () => {
    expect(Range(0, 7).chunk(3).size).toBe(3);
    expect(Range(0, 6).chunk(3).size).toBe(2);
    expect(List.of(1, 2).chunk(3).size).toBe(1);

    const infinite = Range(0, Infinity).chunk(3);
    expect(infinite.size).toBe(Infinity);
  });

  it('reports an undefined size when the source size is unknown', () => {
    const lazy = Seq([1, 2, 3, 4, 5, 6, 7]).filter(x => x % 2 === 0);
    expect(lazy.size).toBe(undefined);
    expect(lazy.chunk(2).size).toBe(undefined);
  });

  it('is lazy: taking the first chunks only consumes the elements they need', () => {
    let consumed = 0;
    const source = Range(0, Infinity).map(x => {
      consumed++;
      return x;
    });
    const firstTwo = source.chunk(3).take(2);
    expect(firstTwo.toJS()).toEqual([
      [0, 1, 2],
      [3, 4, 5],
    ]);
    expect(consumed).toBe(6);

    // The canonical infinite case must terminate.
    expect(Range(0, Infinity).chunk(3).take(2).toJS()).toEqual([
      [0, 1, 2],
      [3, 4, 5],
    ]);
  });

  it('does not pull more elements than needed while taking while chunks match', () => {
    let consumed = 0;
    const source = Range(0, Infinity).map(x => {
      consumed++;
      return x;
    });
    const result = source
      .chunk(3)
      .takeWhile(chunk => (chunk.first() ?? 0) < 6)
      .toArray();
    expect(result.map(c => c.toArray())).toEqual([
      [0, 1, 2],
      [3, 4, 5],
    ]);
    expect(consumed).toBe(9);
  });

  it('returns a Seq that keeps chaining lazily', () => {
    const chunks = Range(0, 7).chunk(3);
    expect(Seq.isSeq(chunks)).toBe(true);
    expect(chunks.map(chunk => chunk.first()).toArray()).toEqual([0, 3, 6]);
    expect(chunks.filter(chunk => chunk.size === 3).toJS()).toEqual([
      [0, 1, 2],
      [3, 4, 5],
    ]);
  });

  it('reverses the order of chunks while preserving order inside each chunk', () => {
    const reversed = Range(0, 7).chunk(3).reverse();
    expect(reversed.toJS()).toEqual([[6], [3, 4, 5], [0, 1, 2]]);

    const reversedKeyed = OrderedMap({ a: 1, b: 2, c: 3, d: 4 })
      .chunk(2)
      .reverse();
    expect(reversedKeyed.get(0)).toEqual(OrderedMap({ c: 3, d: 4 }));
    expect(reversedKeyed.get(1)).toEqual(OrderedMap({ a: 1, b: 2 }));
  });

  it('can reverse chunks whose source size is unknown', () => {
    const lazy = Seq([0, 1, 2, 3, 4, 5, 6]).filter(() => true);
    expect(lazy.chunk(3).reverse().toJS()).toEqual([[6], [3, 4, 5], [0, 1, 2]]);
  });

  it('supports indexed access for known-size sources', () => {
    const chunks = Range(10, 17).chunk(3);
    expect(chunks.get(0)).toEqual(List([10, 11, 12]));
    expect(chunks.get(1)).toEqual(List([13, 14, 15]));
    expect(chunks.get(2)).toEqual(List([16]));
    expect(chunks.get(-1)).toEqual(List([16]));
    expect(chunks.get(3)).toBe(undefined);
    expect(chunks.get(3, 'none')).toBe('none');

    const keyed = OrderedMap({ a: 1, b: 2, c: 3 }).chunk(2);
    expect(keyed.get(0)).toEqual(OrderedMap({ a: 1, b: 2 }));
    expect(keyed.get(-1)).toEqual(OrderedMap({ c: 3 }));
  });

  it('indexed access on known-size sources is lazy', () => {
    let consumed = 0;
    const chunks = Range(0, Infinity)
      .map(x => {
        consumed++;
        return x;
      })
      .chunk(3);
    expect(chunks.get(1)).toEqual(List([3, 4, 5]));
    expect(consumed).toBe(6);
  });

  it('can be iterated with a JS iterator', () => {
    const iterator = Range(0, 7).chunk(3).values();
    expect(iterator.next()).toEqual({ value: List([0, 1, 2]), done: false });
    expect(iterator.next()).toEqual({ value: List([3, 4, 5]), done: false });
    expect(iterator.next()).toEqual({ value: List([6]), done: false });
    expect(iterator.next().done).toBe(true);
  });

  it('works after a chain of lazy map and filter on the source', () => {
    const source = Range(0, 100)
      .filter(x => x % 2 === 0)
      .map(x => x * 10);
    const chunks = source.chunk(3).take(2);
    expect(chunks.toJS()).toEqual([
      [0, 20, 40],
      [60, 80, 100],
    ]);
  });

  it('caches its result with cacheResult', () => {
    const chunks = Range(0, 7).chunk(3).cacheResult();
    expect(chunks.size).toBe(3);
    expect(chunks.toJS()).toEqual([[0, 1, 2], [3, 4, 5], [6]]);
  });

  it('throws a RangeError for invalid sizes', () => {
    expect(() => Range(0, 1).chunk(0)).toThrow(RangeError);
    expect(() => Range(0, 1).chunk(-1)).toThrow(RangeError);
    expect(() => Range(0, 1).chunk(1.5)).toThrow(RangeError);
    expect(() => Range(0, 1).chunk(NaN)).toThrow(RangeError);
    expect(() => Range(0, 1).chunk(Infinity)).toThrow(RangeError);
    expect(() => Map({ a: 1 }).chunk(0)).toThrow(RangeError);
  });

  it('validates the size lazily at call time without touching the source', () => {
    let consumed = false;
    const source = Range(0, Infinity).map(x => {
      consumed = true;
      return x;
    });
    expect(() => source.chunk(0)).toThrow(RangeError);
    expect(consumed).toBe(false);
  });
});
