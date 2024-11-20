# jotai-capsule

An alternative approach to scoping Jotai atoms. A capsule is used as a namespace
for atoms for which you can provide a new scope.

```tsx
import {atom} from 'jotai'
import {createCapsule} from 'jotai-capsule'

const capsule = createCapsule()
const nameAtom = capsule(atom(''))
const countAtom = capsule(atom(0))

const CounterName = () => {
  const name = useAtomValue(nameAtom)
  return <div>name: {name}</div>
}

const Counter = capsule.provide(({name}) => {  
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