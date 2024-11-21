import type {Getter, Setter, WritableAtom} from 'jotai'
import {type Atom, Provider, useStore} from 'jotai'
import {type FunctionComponent, type PropsWithChildren, useMemo} from 'react'
import {jsx} from 'react/jsx-runtime'

type JotaiAtom = Atom<unknown>
type JotaiWriteableAtom = WritableAtom<unknown, Array<unknown>, unknown>

export interface Capsule {
  /** Scope this atom */
  <Atom extends JotaiAtom>(atom: Atom): Atom
  /** Wrap this component in a provider */
  provide<Component extends FunctionComponent<any>>(
    component: Component
  ): Component
  /** Create a new scope for this Providers children */
  Provider: FunctionComponent<PropsWithChildren>
}

export function createCapsule(): Capsule {
  const needsScope: Set<Atom<unknown>> = new Set()

  return Object.assign(
    <ToScope extends JotaiAtom>(atom: ToScope): ToScope => {
      needsScope.add(atom)
      return atom
    },
    {
      provide<Component extends FunctionComponent>(
        component: Component
      ): Component {
        return <Component>((props: any) => {
          const children = jsx(component, props)
          return jsx(this.Provider, {children})
        })
      },
      Provider({children}: PropsWithChildren) {
        const scope = useMemo(createScope, [])
        return jsx(ScopeAtoms, {scope, children})
      }
    }
  )

  function createScope() {
    const scoped = new WeakMap() as {
      get<In extends WeakKey>(key: In): In
      set<In extends WeakKey>(key: In, value: In): unknown
      has<In extends WeakKey>(key: In): boolean
    }
    const setScoped = <In extends WeakKey>(key: In, value: In) => (
      scoped.set(key, value), value
    )
    const reader = (get: Getter) =>
      scoped.get(get) ?? setScoped(get, atom => get(scope(atom)))
    const writer = (set: Setter) =>
      scoped.get(set) ??
      setScoped(set, (atom, ...rest) => set(scope(atom), ...rest))
    function scope<Atom extends JotaiAtom>(atom: Atom): Atom {
      if (!needsScope.has(atom)) return atom
      if (scoped.has(atom)) return scoped.get(atom)
      const scopedAtom = <JotaiWriteableAtom>{
        ...atom,
        read(get, options) {
          return atom.read(reader(get), <any>options)
        },
        write(get, set, ...args) {
          const writeable = (<unknown>atom) as JotaiWriteableAtom
          return writeable.write(reader(get), writer(set), ...args)
        }
      }
      const typedAtom = (<unknown>scopedAtom) as Atom
      scoped.set(atom, typedAtom)
      return typedAtom
    }
    return scope
  }
}

interface ScopeAtomsProps {
  scope: <Atom extends JotaiAtom>(atom: Atom) => Atom
}

function ScopeAtoms({scope, children}: PropsWithChildren<ScopeAtomsProps>) {
  const parent = useStore()
  const store = useMemo((): ReturnType<typeof useStore> => {
    return {
      ...parent,
      get(atom) {
        return parent.get(scope(atom))
      },
      set(atom, ...args) {
        return parent.set(scope(atom), ...args)
      },
      sub(atom, listener) {
        return parent.sub(scope(atom), listener)
      }
    }
  }, [scope, parent])
  return jsx(Provider, {
    store,
    children
  })
}
