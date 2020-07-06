import { Serializer } from "./Serializer"
import { concat } from "./concat";
import { version } from "./version";

export type VersionMap<T, V extends string | number> =
  Record<V, Serializer<T> | (() => Serializer<T>)>

export interface VersionedSerializer<T, V extends string | number> extends Serializer<T> {
  getVersion(version: V): Serializer<T>,
  withVersion(version: V): VersionedSerializer<T, V>,
}

export const versioned = <T, V extends string | number>(
  versions: VersionMap<T, V>,
  latest: V extends infer U ? Extract<U, V> : never,
): VersionedSerializer<T, V> => {
  const getVersion = (version: V) => {
    const serializer: Serializer<T> | (() => Serializer<T>) = versions[version];
    if (typeof serializer === "function")
      return serializer();
    return serializer;
  };

  return Object.assign(
    concat(
      version<V>(Object.keys(versions) as any),
      ([version]) => getVersion(version),
    ).map<T>({
      serialize: val => [latest, val],
      deserialize: ([, val]) => val,
    }),
    {
      getVersion,
      withVersion: (version: typeof latest) => versioned<T, V>(versions, version),
    }
  )
};
