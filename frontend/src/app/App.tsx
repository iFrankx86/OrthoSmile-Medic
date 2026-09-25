import '/src/app/App.css'
import { AppProviders } from '/src/app/providers/AppProviders'
import { AppRouter } from '/src/app/router/AppRouter'

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}
