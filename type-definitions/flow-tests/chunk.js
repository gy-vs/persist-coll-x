//@flow

import {
  List,
  Map,
  OrderedMap,
  OrderedSet,
  Range,
  Seq,
  Set,
} from 'immutable';

// Indexed collections chunk into an indexed Seq of Lists
var rangeChunks: Seq.Indexed<List<number>> = Range(0, 7).chunk(3);
var listChunks: Seq.Indexed<List<number>> = List([1, 2, 3]).chunk(2);
var seqChunks: Seq.Indexed<List<string>> = Seq.Indexed([
  'a',
  'b',
]).chunk(1);

// Set collections chunk into an indexed Seq of Lists
var setChunks: Seq.Indexed<List<number>> = Set([1, 2, 3]).chunk(2);
var orderedSetChunks: Seq.Indexed<List<number>> = OrderedSet([
  1,
  2,
]).chunk(1);

// Keyed collections chunk into an indexed Seq of OrderedMaps
var mapChunks: Seq.Indexed<OrderedMap<string, number>> = Map<
  string,
  number
>({ a: 1 }).chunk(1);
var orderedMapChunks: Seq.Indexed<OrderedMap<string, number>> = OrderedMap<
  string,
  number
>([['a', 1]]).chunk(1);
var keyedSeqChunks: Seq.Indexed<OrderedMap<string, string>> = Seq.Keyed({
  a: 'x',
}).chunk(1);

// $FlowExpectedError[incompatible-type-arg] chunks are always Lists, never numbers
var badIndexedChunk: Seq.Indexed<number> = Range(0, 3).chunk(2);

// $FlowExpectedError[incompatible-type-arg] keyed chunks are OrderedMaps, not Lists
var badKeyedChunk: Seq.Indexed<List<number>> = Map({ a: 1 }).chunk(1);
