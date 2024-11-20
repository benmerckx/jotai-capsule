import type {WritableAtom} from 'jotai'
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
  const scopedAtoms: Set<Atom<unknown>> = new Set()

  return Object.assign(
    <ToScope extends JotaiAtom>(atom: ToScope): ToScope => {
      scopedAtoms.add(atom)
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
    const atomCache = new Map()
    return function scope<Atom extends JotaiAtom>(atom: Atom): Atom {
      if (!scopedAtoms.has(atom)) return atom
      if (atomCache.has(atom)) return atomCache.get(atom)
      const scoped: JotaiWriteableAtom = {
        ...atom,
        read(get, options) {
          return atom.read(atom => get(scope(atom) ?? atom), <any>options)
        },
        write(get, set, ...args) {
          const writeable = (<unknown>atom) as JotaiWriteableAtom
          return writeable.write(
            atom => get(scope(atom) ?? atom),
            (atom, ...rest) => set(scope(atom) ?? atom, ...rest),
            ...args
          )
        }
      }
      atomCache.set(atom, scoped)
      return (<unknown>scoped) as Atom
    }
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
