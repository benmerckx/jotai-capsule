# jotai-capsule

An alternative approach to scoping Jotai atoms.  
A capsule is used as a namespace for atoms. 
By wrapping a component with a capsule provider, a new scope is created.

```tsx
import {atom} from 'jotai'
import {createCapsule} from 'jotai-capsule'

const counterCapsule = createCapsule()

const nameAtom = counterCapsule(atom(''))
const countAtom = counterCapsule(atom(0))

const Counter = counterCapsule.provide(({name}) => {  
  useHydrateAtoms([
    [nameAtom, name]
  ])
  const [count, setCount] = useAtom(countAtom)
  return (
    <div>
      <CounterName />
      <button onClick={() => setCount((c) => c + 1)}>increment</button>
      <div>count: {count}</div>
    </div>
  )
})

const CounterName = () => {
  const name = useAtomValue(nameAtom)
  return <div>name: {name}</div>
}

const App = () => (
  <div>
    <h1>Each Counter is wrapped in a new scope</h1>
    <Counter name="counter 1" />
    <Counter name="counter 2" />
  </div>
)
```

## Api

```tsx
interface Capsule {
  /** Scope this atom */
  (atom: Atom): Atom
  /** Wrap this component in a provider */
  provide(component: FunctionComponent): FunctionComponent
}
```