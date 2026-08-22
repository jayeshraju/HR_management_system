import { Database, RotateCcw } from 'lucide-react';
import { useDemoMutation } from '../hooks/useOperations';
export function DemoControls() { const mutation = useDemoMutation(); if (import.meta.env.VITE_DEMO_MODE !== 'true') return null; return <div className="demo-controls"><span>Demo environment</span><button onClick={() => mutation.mutate('seed')} disabled={mutation.isPending}><Database size={14}/>Load demo data</button><button onClick={() => mutation.mutate('reset')} disabled={mutation.isPending}><RotateCcw size={14}/>Reset demo</button></div>; }
