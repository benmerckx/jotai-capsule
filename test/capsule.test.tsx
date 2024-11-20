import {suite} from '@alinea/suite'
import {fireEvent, render} from '@testing-library/react'
import {atom, useAtom, useAtomValue} from 'jotai'
import {useHydrateAtoms} from 'jotai/utils'
import {createCapsule} from '../src/index.ts'

suite(import.meta, test => {
  test('readme', () => {
    const capsule = createCapsule()
    const nameAtom = capsule(atom(''))
    const countAtom = capsule(atom(0))

    const CounterName = () => {
      const name = useAtomValue(nameAtom)
      return <div id={`name-${name}`}>name: {name}</div>
    }

    const Counter = capsule.provide(({name}: {name: string}) => {
      useHydrateAtoms([[nameAtom, name]])
      const [count, setCount] = useAtom(countAtom)
      return (
        <div>
          <CounterName />
          <button
            type="button"
            id={`btn-${name}`}
            onClick={() => setCount(c => c + 1)}
          >
            increment
          </button>
          <div id={`count-${name}`}>count: {count}</div>
        </div>
      )
    })

    const App = () => (
      <div>
        <h1>Each Counter is wrapped in a new scope</h1>
        <Counter name="counter1" />
        <Counter name="counter2" />
      </div>
    )
    const {container} = render(<App />)

    test.is(getText(container, '#name-counter1'), 'name: counter1')
    test.is(getText(container, '#name-counter2'), 'name: counter2')

    click(container, '#btn-counter1')
    test.is(getText(container, '#count-counter1'), 'count: 1')
    test.is(getText(container, '#count-counter2'), 'count: 0')

    click(container, '#btn-counter2')
    test.is(getText(container, '#count-counter1'), 'count: 1')
    test.is(getText(container, '#count-counter2'), 'count: 1')
  })
})

function getText(container: HTMLElement, selector: string) {
  return container.querySelector(selector)!.textContent!
}

function click(container: HTMLElement, querySelector: string) {
  const button = container.querySelector(querySelector)
  fireEvent.click(button!)
}
