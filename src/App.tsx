import { AppView } from './app/AppView';
import { useInvestigationController } from './app/useInvestigationController';

export default function App() {
  const controller = useInvestigationController();
  return <AppView controller={controller} />;
}
