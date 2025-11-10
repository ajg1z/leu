import { areNodesEqual } from "../nodes-equal";

/**
 * Removes nulls from an array.
 * @param array - The array to remove nulls from.
 * @returns The array without nulls.
 */
export function withoutNulls<T>(array: T[]): T[] {
  return array.filter((item) => item != null) as T[];
}

/**
 * Compares two arrays and returns the differences.
 * @param oldArray - The old array.
 * @param newArray - The new array.
 * @returns The differences.
 * @returns {Object} The differences.
 * @returns {Array<T>} added - The items that were added.
 * @returns {Array<T>} removed - The items that were removed.
 */
export function arraysDiff<T>(
  oldArray: T[],
  newArray: T[]
): {
  added: T[];
  removed: T[];
} {
  const added: T[] = [];
  const removed: T[] = [];

  const oldSet = new Set(oldArray);
  const newSet = new Set(newArray);

  for (const item of newArray) {
    if (!oldSet.has(item)) {
      added.push(item);
    }
  }

  for (const item of oldArray) {
    if (!newSet.has(item)) {
      removed.push(item);
    }
  }

  return { added, removed };
}

export type RemoveOp<T> = {
  type: "remove";
  index: number;
  item: T;
};
export type NoopOp<T> = {
  type: "noop";
  index: number;
  originalIndex: number;
  item: T;
};
export type AddOp<T> = {
  type: "add";
  index: number;
  item: T;
};
export type MoveOp<T> = {
  type: "move";
  from: number;
  index: number;
  originalIndex: number;
  item: T;
};
export type ArrayDiffOperations<T> =
  | RemoveOp<T>
  | NoopOp<T>
  | AddOp<T>
  | MoveOp<T>;

/**
 * A class that represents an array with original indices.
 * @param array - The array to represent.
 * @param equalsFn - The function to use to compare items.
 */
export class ArrayWithOriginalIndices<T> {
  private array: T[] = [];
  private originalIndices: number[] = [];
  private equalsFn: (a: T, b: T) => boolean = (a, b) => a === b;

  constructor(
    array: T[],
    equalsFn: (a: T, b: T) => boolean = (a, b) => a === b
  ) {
    this.array = [...array];
    this.equalsFn = equalsFn;
    this.originalIndices = array.map((_, index) => index);
  }

  /**
   * Gets the length of the array.
   * @returns The length of the array.
   */
  get length() {
    return this.array.length;
  }

  /**
   * Finds the index of an item in the array from a given index.
   * @param item - The item to find the index of.
   * @param fromIndex - The index to start searching from.
   * @returns The index of the item, or -1 if the item is not found.
   */
  findIndexFrom(item: T, fromIndex: number) {
    for (let i = fromIndex; i < this.length; i++) {
      if (this.equalsFn(item, this.array[i])) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Checks if an item is removed from the array.
   * @param index - The index of the item to check.
   * @param newArray - The new array to check against.
   * @returns True if the item is removed, false otherwise.
   */
  isRemoved(index: number, newArray: T[]) {
    if (index >= this.length) {
      return false;
    }

    return (
      newArray.findIndex((item) => this.equalsFn(item, this.array[index])) ===
      -1
    );
  }

  originalIndex(index: number) {
    return this.originalIndices[index];
  }

  /**
   * Checks if an item is a noop.
   * @param index - The index of the item to check.
   * @param newArray - The new array to check against.
   * @returns True if the item is a noop, false otherwise.
   */
  isNoop(index: number, newArray: T[]) {
    if (index >= this.length) {
      return false;
    }

    return this.equalsFn(this.array[index], newArray[index]);
  }

  /**
   * Creates a noop operation for an item.
   * @param index - The index of the item to create a noop operation for.
   * @returns The noop operation.
   */
  noopItem(index: number): NoopOp<T> {
    return {
      type: "noop",
      index,
      originalIndex: this.originalIndex(index),
      item: this.array[index],
    };
  }

  /**
   * Removes an item from the array.
   * @param index - The index of the item to remove.
   * @returns The operation to remove the item.
   */
  removeItem(index: number) {
    const operation: RemoveOp<T> = {
      type: "remove",
      index,
      item: this.array[index],
    };

    this.array.splice(index, 1);
    this.originalIndices.splice(index, 1);
    return operation;
  }

  /**
   * Moves an item to a new index.
   * @param item - The item to move.
   * @param toIndex - The index to move the item to.
   * @returns The operation to move the item.
   */
  moveItem(item: T, toIndex: number) {
    const fromIndex = this.findIndexFrom(item, toIndex);

    const operation: MoveOp<T> = {
      type: "move",
      index: toIndex,
      from: fromIndex,
      originalIndex: this.originalIndex(fromIndex),
      item: this.array[fromIndex],
    };

    const [removedItem] = this.array.splice(fromIndex, 1);
    this.array.splice(toIndex, 0, removedItem);

    const [originalIndex] = this.originalIndices.splice(fromIndex, 1);
    this.originalIndices.splice(toIndex, 0, originalIndex);

    return operation;
  }

  /**
   * Checks if an item is added to the array.
   * @param index - The index of the item to check.
   * @param newArray - The new array to check against.
   * @returns True if the item is added, false otherwise.
   */
  isAdded(index: number, item: T) {
    return this.findIndexFrom(item, index) === -1;
  }

  /**
   * Adds an item to the array.
   * @param index - The index to add the item to.
   * @param item - The item to add.
   * @returns The operation to add the item.
   */
  addItem(index: number, item: T) {
    const operation: AddOp<T> = {
      type: "add",
      index,
      item,
    };
    this.array.splice(index, 0, item);
    this.originalIndices.splice(index, 0, -1);
    return operation;
  }

  removeItemsAfter(index: number) {
    const operations: RemoveOp<T>[] = [];
    while (index < this.length) {
      operations.push(this.removeItem(index));
    }
    return operations;
  }
}

export function arrayDiffSequence<T>(
  oldArray: T[],
  newArray: T[],
  equalsFn: (a: T, b: T) => boolean = (a, b) => a === b
): ArrayDiffOperations<T>[] {
  const sequences: ArrayDiffOperations<T>[] = [];

  const array = new ArrayWithOriginalIndices<T>(oldArray, equalsFn);

  for (let index = 0; index < newArray.length; index++) {
    if (array.isRemoved(index, newArray)) {
      sequences.push(array.removeItem(index));
      index--;
      continue;
    }

    if (array.isNoop(index, newArray)) {
      sequences.push(array.noopItem(index));
      continue;
    }

    const item = newArray[index];
    if (array.isAdded(index, item)) {
      sequences.push(array.addItem(index, item));
      continue;
    }

    sequences.push(array.moveItem(item, index));
  }

  sequences.push(...array.removeItemsAfter(newArray.length));

  return sequences;
}
